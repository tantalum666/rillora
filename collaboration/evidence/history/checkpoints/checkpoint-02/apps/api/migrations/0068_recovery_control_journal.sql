-- Minimal restore restrictions live outside the data backup before commit.
-- Enforcement is opt-in only after the external journal has been initialized.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='continuity_recovery_service') then
  create role continuity_recovery_service nologin nosuperuser nocreatedb nocreaterole noinherit;
 end if;
end $$;
grant continuity_recovery_service to current_user;
grant usage,create on schema app to continuity_recovery_service;
create table app.recovery_policy (
 singleton boolean primary key default true check(singleton),
 enforced boolean not null default false,
 generation uuid not null default gen_random_uuid(),
 coverage_started_at timestamptz
);
insert into app.recovery_policy default values;
create sequence app.recovery_revision_seq;
create table app.recovery_controls (
 entity_key text primary key,
 kind text not null check(kind in('account','connection','matter','person','free_slot','unreconciled_access')),
 entity_public_id uuid not null,
 revision bigint not null default nextval('app.recovery_revision_seq'),
 transaction_id bigint not null default txid_current(),
 published boolean not null default false,
 recorded_at timestamptz not null default clock_timestamp()
);
revoke all on app.recovery_policy,app.recovery_controls from public;
grant select,insert,update,delete on app.recovery_policy,app.recovery_controls to continuity_recovery_service;
grant usage,select,update on sequence app.recovery_revision_seq to continuity_recovery_service;
alter table app.recovery_policy enable row level security;
alter table app.recovery_policy force row level security;
alter table app.recovery_controls enable row level security;
alter table app.recovery_controls force row level security;
create policy recovery_policy_service on app.recovery_policy to continuity_recovery_service using(true) with check(true);
create policy recovery_control_service on app.recovery_controls to continuity_recovery_service using(true) with check(true);
do $$ declare t text; begin
 foreach t in array array['planners','sharing_connections','sharing_grants','matter_items','people','sharing_preferences'] loop
  execute format('grant select on app.%I to continuity_recovery_service',t);
  execute format('create policy recovery_metadata_read on app.%I for select to continuity_recovery_service using(true)',t);
 end loop;
end $$;

create function app.recovery_replaying() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce(current_setting('app.recovery_replay',true),'')='true'
  and pg_has_role(session_user,'continuity_recovery_service','member')
$$;
create function app.recovery_capture() returns trigger
language plpgsql security definer set search_path='' as $$
declare obj jsonb; previous jsonb; k text; pid uuid; owner_id bigint;
begin
 if not (select enforced from app.recovery_policy where singleton) or app.recovery_replaying() then return null; end if;
 obj:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 previous:=case when tg_op='UPDATE' then to_jsonb(old) else null end;
 if tg_table_name='planners' then
  if tg_op='UPDATE' and obj->>'status'=previous->>'status' then return null; end if;
  if tg_op<>'DELETE' and obj->>'status'='active' then return null; end if;
  k:='account';pid:=(obj->>'public_id')::uuid;
 elsif tg_table_name='sharing_connections' then
  k:='connection';pid:=(obj->>'public_id')::uuid;
 elsif tg_table_name='sharing_grants' then
  k:='connection';select public_id into pid from app.sharing_connections where id=(obj->>'connection_id')::bigint;
 elsif tg_table_name='matter_items' then
  if tg_op='UPDATE' and obj->'archived_at'=previous->'archived_at' and obj->'desired_outcome'=previous->'desired_outcome' then return null; end if;
  k:='matter';pid:=(obj->>'public_id')::uuid;
 elsif tg_table_name='people' then
  if tg_op='UPDATE' and obj->'status'=previous->'status' and obj->'archived_at'=previous->'archived_at' then return null; end if;
  k:='person';pid:=(obj->>'public_id')::uuid;
 else
  -- Billing/free-slot changes need provider/control reconciliation before a
  -- restored copy can serve traffic. Never silently assume the old entitlement.
  k:=case when tg_table_name='sharing_preferences' then 'free_slot' else 'unreconciled_access' end;owner_id:=(obj->>'planner_id')::bigint;
  select public_id into pid from app.planners where id=owner_id;
 end if;
 if pid is null then return null; end if;
 insert into app.recovery_controls(entity_key,kind,entity_public_id)
  values(k||':'||pid::text,k,pid)
  on conflict(entity_key) do update set revision=nextval('app.recovery_revision_seq'),
   transaction_id=txid_current(),published=false,recorded_at=clock_timestamp();
 return null;
end $$;

create function app.recovery_pending() returns jsonb
language plpgsql security definer set search_path='' as $$
declare e record; payload jsonb; result jsonb:='[]'::jsonb;
begin
 for e in select * from app.recovery_controls where transaction_id=txid_current() and not published order by revision loop
  payload:=null;
  if e.kind='connection' then
   select jsonb_build_object('status',c.status,'recipient',p.public_id,'version',c.version,
    'grants',coalesce((select jsonb_agg(jsonb_build_object('matter',m.public_id,'level',g.detail_level) order by m.public_id)
      from app.sharing_grants g join app.matter_items m on m.id=g.matter_item_id
      where g.connection_id=c.id),'[]'::jsonb)) into payload
   from app.sharing_connections c left join app.planners p on p.id=c.recipient_planner_id where c.public_id=e.entity_public_id;
  elsif e.kind='matter' then
   select jsonb_build_object('version',version,'archived',archived_at is not null,'private',desired_outcome='never_disclose')
    into payload from app.matter_items where public_id=e.entity_public_id;
  elsif e.kind='person' then
   select jsonb_build_object('version',version,'restricted',status in('archived','revoked') or archived_at is not null)
    into payload from app.people where public_id=e.entity_public_id;
  elsif e.kind='free_slot' then
   select jsonb_build_object('connection',c.public_id) into payload from app.planners p
    left join app.sharing_preferences f on f.planner_id=p.id left join app.sharing_connections c on c.id=f.free_connection_id
    where p.public_id=e.entity_public_id;
  elsif e.kind='account' then
   select jsonb_build_object('status',status) into payload from app.planners where public_id=e.entity_public_id;
  else payload:='{}'::jsonb;
  end if;
  result:=result||jsonb_build_array(jsonb_build_object('key',e.entity_key,'kind',e.kind,'id',e.entity_public_id,
   'revision',e.revision::text,'recordedAt',e.recorded_at,'facts',coalesce(payload,'{"deleted":true}'::jsonb)));
 end loop;
 return result;
end $$;

create function app.recovery_mark_published(p_revision bigint) returns void
language sql security definer set search_path='' as $$
 update app.recovery_controls set published=true where revision=p_revision and transaction_id=txid_current()
$$;
create function app.recovery_require_publication() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if (select enforced from app.recovery_policy where singleton) and not app.recovery_replaying()
  and exists(select 1 from app.recovery_controls where transaction_id=txid_current() and not published)
 then raise exception 'recovery_journal_unavailable' using errcode='55000'; end if;
 return null;
end $$;
create constraint trigger recovery_publication_guard after insert or update on app.recovery_controls
 deferrable initially deferred for each row execute function app.recovery_require_publication();

create trigger recovery_account after update or delete on app.planners for each row execute function app.recovery_capture();
create trigger recovery_connection after insert or update or delete on app.sharing_connections for each row execute function app.recovery_capture();
create trigger recovery_grant after insert or update or delete on app.sharing_grants for each row execute function app.recovery_capture();
create trigger recovery_matter after update or delete on app.matter_items for each row execute function app.recovery_capture();
create trigger recovery_person after update or delete on app.people for each row execute function app.recovery_capture();
create trigger recovery_entitlement after insert or update or delete on app.commerce_entitlement_grants for each row execute function app.recovery_capture();
create trigger recovery_subscription after insert or update or delete on app.commerce_subscriptions for each row execute function app.recovery_capture();
create trigger recovery_free_slot after insert or update or delete on app.sharing_preferences for each row execute function app.recovery_capture();

revoke all on function app.recovery_replaying(),app.recovery_capture(),app.recovery_pending(),app.recovery_mark_published(bigint),app.recovery_require_publication() from public;
grant execute on function app.recovery_pending(),app.recovery_mark_published(bigint) to continuity_app,continuity_auth,continuity_rehearsal,continuity_commerce;
alter function app.recovery_replaying() owner to continuity_recovery_service;
alter function app.recovery_capture() owner to continuity_recovery_service;
alter function app.recovery_pending() owner to continuity_recovery_service;
alter function app.recovery_mark_published(bigint) owner to continuity_recovery_service;
alter function app.recovery_require_publication() owner to continuity_recovery_service;
revoke create on schema app from continuity_recovery_service;
