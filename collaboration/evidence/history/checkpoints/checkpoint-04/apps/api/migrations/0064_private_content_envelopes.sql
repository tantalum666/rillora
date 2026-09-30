-- Application-encrypted contents. PostgreSQL never receives an unwrapped key.
-- Existing business columns retain opaque references so field-level projections
-- and paid-period copies keep their existing authorization semantics.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='continuity_content_service') then
  create role continuity_content_service nologin nosuperuser nocreatedb nocreaterole noinherit;
 end if;
end $$;
grant continuity_content_service to current_user;
grant usage,create on schema app to continuity_content_service;
grant execute on function app.current_planner_id() to continuity_content_service;

create table app.private_content_policy (
 singleton boolean primary key default true check(singleton),
 require_encrypted_writes boolean not null default false
);
insert into app.private_content_policy(singleton) values(true);
create table app.private_content_keys (
 public_id uuid primary key,
 planner_id bigint not null references app.planners(id) on delete cascade,
 namespace text not null check(char_length(namespace) between 1 and 80),
 wrapping_key_ref text not null check(char_length(wrapping_key_ref) between 1 and 2048),
 wrapped_key bytea not null check(octet_length(wrapped_key) between 16 and 8192),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(public_id,planner_id)
);
create unique index private_content_active_key on app.private_content_keys(planner_id) where active;
create table app.private_content_values (
 public_id uuid primary key,
 planner_id bigint not null references app.planners(id) on delete cascade,
 key_id uuid not null,
 source_kind text not null check(source_kind in('matter','person','snapshot')),
 source_public_id uuid not null,
 field_name text not null check(field_name ~ '^[a-zA-Z][a-zA-Z0-9_.]{0,79}$'),
 nonce bytea not null check(octet_length(nonce)=12),
 ciphertext bytea not null check(octet_length(ciphertext) between 1 and 65536),
 auth_tag bytea not null check(octet_length(auth_tag)=16),
 created_at timestamptz not null default now(),
 foreign key(key_id,planner_id) references app.private_content_keys(public_id,planner_id) on delete cascade
);
create index private_content_owner_source on app.private_content_values(planner_id,source_kind,source_public_id);
do $$ declare t text; begin
 foreach t in array array['private_content_policy','private_content_keys','private_content_values'] loop
  execute format('revoke all on app.%I from public',t);
  execute format('alter table app.%I enable row level security',t);
  execute format('alter table app.%I force row level security',t);
  execute format('grant select,insert,delete on app.%I to continuity_content_service',t);
  execute format('create policy content_service on app.%I to continuity_content_service using(true) with check(true)',t);
 end loop;
end $$;

grant select on app.planners,app.matter_items,app.people,app.family_review_tasks,
 app.sharing_saved_items,app.family_review_changes,app.disclosure_rehearsals
 to continuity_content_service;
do $$ declare t text; begin
 foreach t in array array['planners','matter_items','people','family_review_tasks',
  'sharing_saved_items','family_review_changes','disclosure_rehearsals'] loop
  execute format('create policy content_service_read on app.%I for select to continuity_content_service using(true)',t);
 end loop;
end $$;
grant execute on function app.recipient_shared_items(),app.family_review_incoming(boolean),
 app.family_review_task(bigint,boolean) to continuity_content_service;

create function app.content_reference_id(v text) returns uuid
language sql immutable parallel safe set search_path='' as $$
 select case when v ~ '^rce1_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then substring(v from 6)::uuid end
$$;
create function app.content_references(doc jsonb) returns setof uuid
language sql immutable parallel safe set search_path='' as $$
 select distinct app.content_reference_id(v#>>'{}') from jsonb_path_query(doc,'$.** ? (@.type() == "string")') v
 where app.content_reference_id(v#>>'{}') is not null
$$;
revoke all on function app.content_reference_id(text),app.content_references(jsonb) from public;
grant execute on function app.content_reference_id(text),app.content_references(jsonb) to continuity_app,continuity_content_service;

create function app.content_write_target(p_kind text,p_public uuid,p_preview boolean default false)
returns table(owner_id bigint,owner_public_id uuid,source_kind text,source_public_id uuid)
language plpgsql stable security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); candidate bigint; task record; view jsonb;
begin
 if not exists(select 1 from app.planners where id=actor and status='active') then raise exception 'content_access_denied'; end if;
 if p_kind in('matter','person','snapshot') then
  if p_kind='matter' then select planner_id into candidate from app.matter_items where public_id=p_public;
  elsif p_kind='person' then select planner_id into candidate from app.people where public_id=p_public; end if;
  if candidate is not null and candidate<>actor then raise exception 'content_access_denied'; end if;
  return query select p.id,p.public_id,p_kind,p_public from app.planners p where p.id=actor;
 elsif p_kind='review_proposal' then
  select t.id,t.planner_id,m.public_id as matter_public_id into task from app.family_review_tasks t
   join app.matter_items m on m.id=t.matter_item_id and m.planner_id=t.planner_id where t.public_id=p_public;
  if not found then raise exception 'content_access_denied'; end if;
  view:=app.family_review_task(task.id,p_preview);
  if view is null or coalesce((view->>'canSuggest')::boolean,false)=false
    or coalesce((view->>'canRespond')::boolean,false)=false then raise exception 'content_access_denied'; end if;
  return query select p.id,p.public_id,'matter'::text,task.matter_public_id from app.planners p where p.id=task.planner_id;
 else raise exception 'content_access_denied'; end if;
end $$;
revoke all on function app.content_write_target(text,uuid,boolean) from public;
grant execute on function app.content_write_target(text,uuid,boolean) to continuity_app,continuity_content_service;
alter function app.content_write_target(text,uuid,boolean) owner to continuity_content_service;

create function app.content_key_for_write(p_kind text,p_public uuid,p_preview boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target record; result jsonb;
begin
 select * into target from app.content_write_target(p_kind,p_public,p_preview);
 perform pg_advisory_xact_lock(hashtextextended('content-key:'||target.owner_id::text,0));
 select jsonb_build_object('id',k.public_id,'owner',target.owner_public_id,'namespace',k.namespace,
  'wrappingKeyRef',k.wrapping_key_ref,'wrappedKey',encode(k.wrapped_key,'base64')) into result
 from app.private_content_keys k where k.planner_id=target.owner_id and k.active;
 return jsonb_build_object('target',jsonb_build_object('owner',target.owner_public_id,
  'sourceKind',target.source_kind,'sourceId',target.source_public_id),'key',result);
end $$;
revoke all on function app.content_key_for_write(text,uuid,boolean) from public;
grant execute on function app.content_key_for_write(text,uuid,boolean) to continuity_app;
alter function app.content_key_for_write(text,uuid,boolean) owner to continuity_content_service;

create function app.content_register_key(p_kind text,p_public uuid,p_key uuid,p_namespace text,
 p_wrapping_ref text,p_wrapped bytea,p_preview boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare target record;
begin
 select * into target from app.content_write_target(p_kind,p_public,p_preview);
 perform pg_advisory_xact_lock(hashtextextended('content-key:'||target.owner_id::text,0));
 insert into app.private_content_keys(public_id,planner_id,namespace,wrapping_key_ref,wrapped_key)
  values(p_key,target.owner_id,p_namespace,p_wrapping_ref,p_wrapped);
end $$;
revoke all on function app.content_register_key(text,uuid,uuid,text,text,bytea,boolean) from public;
grant execute on function app.content_register_key(text,uuid,uuid,text,text,bytea,boolean) to continuity_app;
alter function app.content_register_key(text,uuid,uuid,text,text,bytea,boolean) owner to continuity_content_service;

create function app.content_store_values(p_kind text,p_public uuid,p_entries jsonb,p_preview boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare target record; entry jsonb;
begin
 select * into target from app.content_write_target(p_kind,p_public,p_preview);
 if jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries)>20000 then raise exception 'content_invalid_envelope'; end if;
 for entry in select value from jsonb_array_elements(p_entries) loop
  if jsonb_typeof(entry)<>'object' or (select count(*) from jsonb_object_keys(entry))<>6
    or not(entry ?& array['id','keyId','field','nonce','ciphertext','tag'])
    or (p_kind='review_proposal' and entry->>'field' not in('institution_name','location_hint'))
    or not exists(select 1 from app.private_content_keys where public_id=(entry->>'keyId')::uuid and planner_id=target.owner_id)
   then raise exception 'content_invalid_envelope'; end if;
  insert into app.private_content_values(public_id,planner_id,key_id,source_kind,source_public_id,field_name,nonce,ciphertext,auth_tag)
   values((entry->>'id')::uuid,target.owner_id,(entry->>'keyId')::uuid,target.source_kind,target.source_public_id,
    entry->>'field',decode(entry->>'nonce','base64'),decode(entry->>'ciphertext','base64'),decode(entry->>'tag','base64'));
 end loop;
end $$;
revoke all on function app.content_store_values(text,uuid,jsonb,boolean) from public;
grant execute on function app.content_store_values(text,uuid,jsonb,boolean) to continuity_app;
alter function app.content_store_values(text,uuid,jsonb,boolean) owner to continuity_content_service;

-- This resolver is a second authorization boundary, not an arbitrary decrypt API.
-- A recipient must currently receive the exact immutable reference through the
-- existing allowlisted live/saved/review projection, not merely know its UUID.
create function app.content_read_values(p_ids uuid[],p_preview boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); permitted uuid[]:='{}'; result jsonb;
begin
 if coalesce(array_length(p_ids,1),0)>20000 or not exists(select 1 from app.planners where id=actor and status='active')
  then raise exception 'content_access_denied'; end if;
 if exists(select 1 from app.private_content_values where public_id=any(p_ids) and planner_id<>actor) then
  select coalesce(array_agg(ref),'{}'::uuid[]) into permitted from (
   select app.content_references(app.recipient_shared_items()) as ref
   union select app.content_references(app.family_review_incoming(p_preview)) as ref
  ) x;
 end if;
 with allowed as (
  select v.*,p.public_id as owner_public_id from app.private_content_values v join app.planners p on p.id=v.planner_id
  where v.public_id=any(p_ids) and p.status='active' and (v.planner_id=actor or v.public_id=any(permitted))
 ), keys as (
  select distinct k.*,a.owner_public_id from app.private_content_keys k join allowed a on a.key_id=k.public_id and a.planner_id=k.planner_id
 ) select jsonb_build_object('values',coalesce((select jsonb_agg(jsonb_build_object(
  'id',public_id,'keyId',key_id,'owner',owner_public_id,'sourceKind',source_kind,'sourceId',source_public_id,
  'field',field_name,'nonce',encode(nonce,'base64'),'ciphertext',encode(ciphertext,'base64'),'tag',encode(auth_tag,'base64'))) from allowed),'[]'::jsonb),
  'keys',coalesce((select jsonb_agg(jsonb_build_object('id',public_id,'owner',owner_public_id,'namespace',namespace,
  'wrappingKeyRef',wrapping_key_ref,'wrappedKey',encode(wrapped_key,'base64'))) from keys),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function app.content_read_values(uuid[],boolean) from public;
grant execute on function app.content_read_values(uuid[],boolean) to continuity_app;
alter function app.content_read_values(uuid[],boolean) owner to continuity_content_service;

create function app.content_assert_value(v text,p_owner bigint,p_source uuid default null,p_field text default null) returns void
language plpgsql stable security definer set search_path='' as $$
declare ref uuid:=app.content_reference_id(v);
begin
 if v is null or v='' then return; end if;
 if ref is null then
  if (select require_encrypted_writes from app.private_content_policy where singleton) then raise exception 'content_plaintext_rejected'; end if;
  return;
 end if;
 if not exists(select 1 from app.private_content_values where public_id=ref and planner_id=p_owner
   and (p_source is null or source_public_id=p_source) and (p_field is null or field_name=p_field))
  then raise exception 'content_reference_invalid'; end if;
end $$;
revoke all on function app.content_assert_value(text,bigint,uuid,text) from public;
grant execute on function app.content_assert_value(text,bigint,uuid,text) to continuity_content_service;
alter function app.content_assert_value(text,bigint,uuid,text) owner to continuity_content_service;

create function app.content_assert_json(doc jsonb,p_owner bigint,p_sensitive_only boolean default false) returns void
language plpgsql stable security definer set search_path='' as $$
declare kv record; item jsonb;
begin
 if jsonb_typeof(doc)='object' then
  for kv in select * from jsonb_each(doc) loop
   if jsonb_typeof(kv.value)='string' and (not p_sensitive_only or kv.key=any(array[
    'title','institutionName','locationHint','accountHint','notes','displayName','display_name','personName',
    'relationshipLabel','relationship_label','ownerName','valueBand','currencyCode',
    'assetType','debtType','documentType','deviceModel','billingCycle','renewalDate','cryptoCustody',
    'network','walletAddress','walletLabel','assetSymbol'])) then
    perform app.content_assert_value(kv.value#>>'{}',p_owner);
   elsif jsonb_typeof(kv.value) in('object','array') then perform app.content_assert_json(kv.value,p_owner,p_sensitive_only); end if;
  end loop;
 elsif jsonb_typeof(doc)='array' then
  for item in select value from jsonb_array_elements(doc) loop perform app.content_assert_json(item,p_owner,p_sensitive_only); end loop;
 end if;
end $$;
revoke all on function app.content_assert_json(jsonb,bigint,boolean) from public;
grant execute on function app.content_assert_json(jsonb,bigint,boolean) to continuity_content_service;
alter function app.content_assert_json(jsonb,bigint,boolean) owner to continuity_content_service;

create function app.content_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare kv record; matter_public uuid; field text;
begin
 if tg_table_name='matter_items' then
  for kv in select * from jsonb_each_text(to_jsonb(new)) where key=any(array['title','institution_name','account_hint','location_hint','notes','value_band','currency_code']) loop
   perform app.content_assert_value(kv.value,new.planner_id,new.public_id,kv.key);
  end loop;
  for kv in select * from jsonb_each_text(new.details) loop perform app.content_assert_value(kv.value,new.planner_id,new.public_id,'details.'||kv.key); end loop;
 elsif tg_table_name='people' then
  perform app.content_assert_value(new.display_name,new.planner_id,new.public_id,'display_name');
  perform app.content_assert_value(new.relationship_label,new.planner_id,new.public_id,'relationship_label');
 elsif tg_table_name='family_review_tasks' then
  select public_id into matter_public from app.matter_items where id=new.matter_item_id and planner_id=new.planner_id;
  for kv in select * from jsonb_each_text(coalesce(new.source_fields,'{}'))
    union all select * from jsonb_each_text(coalesce(new.proposal,'{}')) loop
   field:=case kv.key when 'institutionName' then 'institution_name' when 'locationHint' then 'location_hint' end;
   if field is null then raise exception 'content_reference_invalid'; end if;
   perform app.content_assert_value(kv.value,new.planner_id,matter_public,field);
  end loop;
 elsif tg_table_name='family_review_changes' then
  perform app.content_assert_json(new.before_fields,new.planner_id);
  perform app.content_assert_json(new.after_fields,new.planner_id);
 elsif tg_table_name='sharing_saved_items' then
  perform app.content_assert_json(new.fields,new.planner_id,true);
 elsif tg_table_name='disclosure_rehearsals' then
  perform app.content_assert_json(new.policy_snapshot,new.planner_id,true);
 end if;
 return new;
end $$;
revoke all on function app.content_guard() from public;
alter function app.content_guard() owner to continuity_content_service;
do $$ declare t text; begin
 foreach t in array array['matter_items','people','family_review_tasks','family_review_changes','sharing_saved_items','disclosure_rehearsals'] loop
  execute format('create trigger content_guard before insert or update on app.%I for each row execute function app.content_guard()',t);
 end loop;
end $$;
alter table app.matter_items drop constraint matter_items_value_band,drop constraint matter_items_currency;
alter table app.matter_items add constraint matter_items_value_band check(
 value_band in('none','under_1k','1k_10k','10k_100k','100k_plus','unknown') or app.content_reference_id(value_band) is not null),
 add constraint matter_items_currency check(currency_code is null or currency_code ~ '^[A-Z]{3}$' or app.content_reference_id(currency_code) is not null);

-- Every durable body-copy location participates in reference liveness.
create function app.content_used_references(p_owner bigint) returns setof uuid
language sql stable security definer set search_path='' as $$
 select app.content_references(to_jsonb(m)) from app.matter_items m where planner_id=p_owner
 union select app.content_references(to_jsonb(p)) from app.people p where planner_id=p_owner
 union select app.content_references(source_fields) from app.family_review_tasks where planner_id=p_owner
 union select app.content_references(proposal) from app.family_review_tasks where planner_id=p_owner
 union select app.content_references(before_fields) from app.family_review_changes where planner_id=p_owner
 union select app.content_references(after_fields) from app.family_review_changes where planner_id=p_owner
 union select app.content_references(fields) from app.sharing_saved_items where planner_id=p_owner
 union select app.content_references(policy_snapshot) from app.disclosure_rehearsals where planner_id=p_owner
$$;
revoke all on function app.content_used_references(bigint) from public;
grant execute on function app.content_used_references(bigint) to continuity_content_service;
alter function app.content_used_references(bigint) owner to continuity_content_service;
create function app.content_prune_unused() returns integer
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 delete from app.private_content_values where public_id in (
  select public_id from app.private_content_values v where planner_id=app.current_planner_id()
   and not exists(select 1 from app.content_used_references(app.current_planner_id()) ref where ref=v.public_id)
  order by created_at limit 20000
 );
 get diagnostics n=row_count; return n;
end $$;
revoke all on function app.content_prune_unused() from public;
grant execute on function app.content_prune_unused() to continuity_app;
alter function app.content_prune_unused() owner to continuity_content_service;

-- A migration changes representation only; it must not recapture paid history.
create function app.content_migration_active() returns boolean
language sql stable set search_path='' as $$
 select coalesce(current_setting('app.content_migration',true),'')='true'
   and pg_has_role(session_user,'continuity_content_service','member')
$$;
revoke all on function app.content_migration_active() from public;
grant execute on function app.content_migration_active() to continuity_share_service;
do $$ declare definition text; begin
 select pg_get_functiondef('app.sharing_capture(bigint)'::regprocedure) into definition;
 if position(E'begin\n' in definition)=0 then raise exception 'Unexpected sharing capture definition'; end if;
 definition:=replace(definition,E'begin\n',E'begin\n if app.content_migration_active() then return; end if;\n');
 execute definition;
end $$;
revoke create on schema app from continuity_content_service;
