-- Provider evidence and commercial rollout are independent. A closed rollout
-- preserves the existing controlled beta; validation accounts are explicit.
create table app.commerce_runtime_policy (
  singleton boolean primary key default true check (singleton),
  sharing_limits_enabled boolean not null default false,
  production_entitlements_enabled boolean not null default false
);
insert into app.commerce_runtime_policy default values;
create table app.commerce_validation_accounts (
  planner_id bigint primary key references app.planners(id) on delete cascade,
  expires_at timestamptz not null,
  reason text not null check (char_length(reason) between 8 and 200)
);
create table app.sharing_preferences (
  planner_id bigint primary key references app.planners(id) on delete cascade,
  free_connection_id bigint,
  version integer not null default 1,
  foreign key (free_connection_id, planner_id) references app.sharing_connections(id, planner_id)
    on delete set null (free_connection_id)
);
alter table app.sharing_connections add column live_entitlement_id bigint
  references app.commerce_entitlement_grants(id) on delete set null;
create table app.sharing_saved_items (
  grant_id bigint primary key references app.sharing_grants(id) on delete cascade,
  planner_id bigint not null references app.planners(id) on delete cascade,
  entitlement_id bigint not null references app.commerce_entitlement_grants(id) on delete cascade,
  detail_level text not null check (detail_level in ('name','directions','details')),
  fields jsonb not null check (jsonb_typeof(fields) = 'object'),
  saved_at timestamptz not null,
  cutoff_at timestamptz not null
);
grant create on schema app to continuity_share_service;
revoke all on app.commerce_runtime_policy, app.commerce_validation_accounts,
  app.sharing_preferences, app.sharing_saved_items from public;
grant select on app.commerce_runtime_policy, app.commerce_validation_accounts to continuity_share_service;
grant select, insert, update, delete on app.sharing_preferences, app.sharing_saved_items to continuity_share_service;
alter table app.sharing_preferences enable row level security;
alter table app.sharing_preferences force row level security;
alter table app.sharing_saved_items enable row level security;
alter table app.sharing_saved_items force row level security;
create policy sharing_preferences_service on app.sharing_preferences to continuity_share_service using(true) with check(true);
create policy sharing_saved_service on app.sharing_saved_items to continuity_share_service using(true) with check(true);

create function app.sharing_limits_enabled(p_owner bigint) returns boolean
language sql stable security definer set search_path='' as $$
  select (select sharing_limits_enabled from app.commerce_runtime_policy where singleton)
    or exists(select 1 from app.commerce_validation_accounts where planner_id=p_owner and expires_at>statement_timestamp())
$$;

-- An expired provider row or sandbox transaction alone never authorizes access.
create function app.sharing_family_grant(p_owner bigint)
returns table(id bigint, allowance integer, cutoff_at timestamptz)
language sql stable security definer set search_path='' as $$
  select e.id, least(e.allowance,5), least(e.expires_at,
      case when e.source_type='subscription' then
        case when s.state='grace' then least(s.grace_ends_at,s.current_period_ends_at+interval '7 days')
          else s.current_period_ends_at end else e.expires_at end)
  from app.commerce_entitlement_grants e
  left join app.commerce_subscriptions s on s.id=e.subscription_id and s.planner_id=e.planner_id
  where e.planner_id=p_owner and e.capability_code='trusted_people_multiple'
    and e.allowance between 1 and 5 and e.revoked_at is null
    and e.effective_at<=statement_timestamp() and e.expires_at>statement_timestamp()
    and (e.source_type<>'subscription' or (
      s.state in ('active','cancel_at_period_end','grace')
      and s.current_period_starts_at<=statement_timestamp()
      and (case when s.state='grace' then least(s.grace_ends_at,s.current_period_ends_at+interval '7 days')
           else s.current_period_ends_at end)>statement_timestamp()
      and ((s.provider_environment='production' and
        (select production_entitlements_enabled from app.commerce_runtime_policy where singleton))
        or (s.provider_environment in ('test','sandbox') and exists(select 1
          from app.commerce_validation_accounts v where v.planner_id=p_owner and v.expires_at>statement_timestamp())))
    )) order by e.effective_at desc,e.id desc limit 1
$$;

create function app.sharing_connection_mode(p_connection bigint) returns text
language sql stable security definer set search_path='' as $$
  select case when c.status='revoked' or p.status in ('revoked','archived') then 'none'
    when not app.sharing_limits_enabled(c.planner_id) then 'live'
    when exists(select 1 from app.sharing_preferences f where f.planner_id=c.planner_id and f.free_connection_id=c.id)
      or exists(select 1 from app.sharing_family_grant(c.planner_id) e where e.id=c.live_entitlement_id) then 'live'
    when c.status='accepted' and exists(select 1 from app.sharing_saved_items s
      join app.sharing_grants g on g.id=s.grant_id where g.connection_id=c.id) then 'saved'
    else 'paused' end
  from app.sharing_connections c join app.people p on p.id=c.person_id and p.planner_id=c.planner_id
  where c.id=p_connection
$$;

create function app.sharing_project_fields(p_fields jsonb,p_level text) returns jsonb
language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) from jsonb_each(p_fields) as f(k,v)
 where k in ('title','category') or (p_level in ('directions','details') and k in
 ('institutionName','locationHint','desiredOutcome')) or (p_level='details' and k in
 ('accountHint','valueBand','currencyCode','importance','notes','assetType','debtType','documentType',
  'deviceModel','billingCycle','renewalDate','cryptoCustody','network','walletAddress','walletLabel','assetSymbol'))
$$;

create function app.sharing_capture(p_connection bigint) returns void
language plpgsql security definer set search_path='' as $$
declare c app.sharing_connections%rowtype; e record;
begin
 select * into c from app.sharing_connections where id=p_connection;
 if not found or c.status<>'accepted' then return; end if;
 select * into e from app.sharing_family_grant(c.planner_id);
 -- Never make a cutoff copy from post-expiry values, even if a job/webhook is late.
 if not found or e.cutoff_at<=clock_timestamp() or c.live_entitlement_id is distinct from e.id then return; end if;
 insert into app.sharing_saved_items(grant_id,planner_id,entitlement_id,detail_level,fields,saved_at,cutoff_at)
 select g.id,c.planner_id,e.id,g.detail_level,app.sharing_project_fields(jsonb_strip_nulls(
   m.details || jsonb_build_object('title',m.title,'category',m.category,'institutionName',m.institution_name,
     'locationHint',m.location_hint,'desiredOutcome',m.desired_outcome,'accountHint',m.account_hint,
     'valueBand',m.value_band,'currencyCode',m.currency_code,'importance',m.importance,'notes',m.notes)
     ),g.detail_level),clock_timestamp(),e.cutoff_at
 from app.sharing_grants g join app.matter_items m on m.id=g.matter_item_id and m.planner_id=g.planner_id
 where g.connection_id=c.id and g.planner_id=c.planner_id and m.archived_at is null and m.desired_outcome<>'never_disclose'
 on conflict(grant_id) do update set entitlement_id=excluded.entitlement_id,detail_level=excluded.detail_level,
   fields=excluded.fields,saved_at=excluded.saved_at,cutoff_at=excluded.cutoff_at;
end $$;

create function app.sharing_access_status() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('enforcementEnabled',app.sharing_limits_enabled(app.current_planner_id()),
   'limit',coalesce((select allowance from app.sharing_family_grant(app.current_planner_id())),1),
   'used',(select count(*) from app.sharing_connections c join app.people p on p.id=c.person_id
     where c.planner_id=app.current_planner_id() and p.status not in ('revoked','archived')
       and (c.status='accepted' or (c.status='pending' and c.invitation_expires_at>statement_timestamp()))
       and app.sharing_connection_mode(c.id)='live'),
   'version',coalesce((select version from app.sharing_preferences where planner_id=app.current_planner_id()),0),
   'freeConnectionPublicId',(select c.public_id from app.sharing_preferences p join app.sharing_connections c on c.id=p.free_connection_id
     where p.planner_id=app.current_planner_id() and c.status<>'revoked'),
   'paidUntil',(select cutoff_at from app.sharing_family_grant(app.current_planner_id())))
$$;

create function app.sharing_connection_access(p_public uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('mode',app.sharing_connection_mode(c.id),
   'isFreeRecipient',exists(select 1 from app.sharing_preferences f where f.planner_id=c.planner_id and f.free_connection_id=c.id),
   'savedAt',(select max(s.saved_at) from app.sharing_saved_items s join app.sharing_grants g on g.id=s.grant_id where g.connection_id=c.id),
   'cutoffAt',(select max(s.cutoff_at) from app.sharing_saved_items s join app.sharing_grants g on g.id=s.grant_id where g.connection_id=c.id))
 from app.sharing_connections c where c.public_id=p_public and c.planner_id=app.current_planner_id()
$$;

-- Used before insert/reissue/resume. One owner lock serializes all reservations.
create function app.sharing_reserve(p_connection bigint default null) returns bigint
language plpgsql security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); e record; used integer; lim integer;
begin
 if actor is null then raise exception 'sharing_unauthorized'; end if;
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||actor::text,0));
 if p_connection is not null and not exists(select 1 from app.sharing_connections where id=p_connection and planner_id=actor)
 then raise exception 'sharing_unauthorized'; end if;
 select * into e from app.sharing_family_grant(actor); lim:=coalesce(e.allowance,1);
 if app.sharing_limits_enabled(actor) then
   select count(*) into used from app.sharing_connections c join app.people p on p.id=c.person_id
   where c.planner_id=actor and c.id is distinct from p_connection and p.status not in ('revoked','archived')
     and (c.status='accepted' or (c.status='pending' and c.invitation_expires_at>statement_timestamp()))
     and app.sharing_connection_mode(c.id)='live';
   if used>=lim then raise exception 'sharing_limit_reached'; end if;
 end if;
 return e.id;
end $$;

create function app.sharing_connection_before() returns trigger
language plpgsql security definer set search_path='' as $$
declare e record; free_id bigint;
begin
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||new.planner_id::text,0));
 if new.status='pending' and new.invitation_expires_at>statement_timestamp()
   and exists(select 1 from app.sharing_connections c where c.planner_id=new.planner_id and c.id<>new.id
     and c.recipient_email_hash=new.recipient_email_hash and
     (c.status='accepted' or (c.status='pending' and c.invitation_expires_at>statement_timestamp())))
   and app.sharing_limits_enabled(new.planner_id) then raise exception 'sharing_duplicate_recipient'; end if;
 if tg_op='INSERT' then
   select * into e from app.sharing_family_grant(new.planner_id); new.live_entitlement_id:=e.id;
 end if;
 return new;
end $$;
create trigger sharing_connection_before before insert or update on app.sharing_connections
 for each row execute function app.sharing_connection_before();

create function app.sharing_connection_after() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status='pending' and new.invitation_expires_at>statement_timestamp()
   and not exists(select 1 from app.sharing_family_grant(new.planner_id)) then
   insert into app.sharing_preferences(planner_id,free_connection_id) values(new.planner_id,new.id)
   on conflict(planner_id) do update set free_connection_id=excluded.free_connection_id,version=app.sharing_preferences.version+1
   where app.sharing_preferences.free_connection_id is null or not exists(select 1 from app.sharing_connections c
     where c.id=app.sharing_preferences.free_connection_id and (c.status='accepted' or
       (c.status='pending' and c.invitation_expires_at>statement_timestamp())));
 end if;
 if new.status='revoked' then
   delete from app.sharing_saved_items s using app.sharing_grants g where s.grant_id=g.id and g.connection_id=new.id;
   update app.sharing_preferences set free_connection_id=null,version=version+1 where free_connection_id=new.id;
 else perform app.sharing_capture(new.id); end if;
 return new;
end $$;
create trigger sharing_connection_after after insert or update on app.sharing_connections
 for each row execute function app.sharing_connection_after();

create function app.sharing_grant_after() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' then
   -- Permanently redact a saved copy before any later re-expansion.
   update app.sharing_saved_items set fields=app.sharing_project_fields(fields,new.detail_level),
     detail_level=case when new.detail_level='name' then 'name'
       when new.detail_level='directions' and detail_level='details' then 'directions' else detail_level end
     where grant_id=new.id;
 end if;
 perform app.sharing_capture(new.connection_id); return new;
end $$;
create trigger sharing_grant_after after insert or update on app.sharing_grants
 for each row execute function app.sharing_grant_after();
create function app.sharing_matter_after() returns trigger
language plpgsql security definer set search_path='' as $$
declare c record;
begin
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||new.planner_id::text,0));
 for c in select distinct connection_id from app.sharing_grants where matter_item_id=new.id and planner_id=new.planner_id
 loop perform app.sharing_capture(c.connection_id); end loop;
 return new;
end $$;
create trigger sharing_matter_after after update on app.matter_items for each row execute function app.sharing_matter_after();

create function app.sharing_select_live(p_public uuid,p_version integer,p_access_version integer,p_free boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); c app.sharing_connections%rowtype; eid bigint; current_version integer;
begin
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||actor::text,0));
 select * into c from app.sharing_connections where public_id=p_public and planner_id=actor and status<>'revoked' for update;
 if not found or c.version<>p_version or (c.status='pending' and c.invitation_expires_at<=statement_timestamp())
 then raise exception 'sharing_changed'; end if;
 select coalesce((select version from app.sharing_preferences where planner_id=actor),0) into current_version;
 if current_version<>p_access_version then raise exception 'sharing_changed'; end if;
 if p_free then
   insert into app.sharing_preferences(planner_id,free_connection_id) values(actor,c.id)
   on conflict(planner_id) do update set free_connection_id=c.id,version=app.sharing_preferences.version+1;
   perform app.sharing_reserve(c.id);
 else
   eid:=app.sharing_reserve(c.id);
   if eid is null then raise exception 'sharing_family_required'; end if;
 end if;
 update app.sharing_connections set live_entitlement_id=coalesce(eid,live_entitlement_id),version=version+1,updated_at=now() where id=c.id;
 insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
 values(actor,'planner',case when p_free then 'sharing.free_recipient_selected' else 'sharing.updates_resumed' end,
   'sharing_connection',c.public_id,jsonb_build_object('purpose','planner_directed'));
 return app.sharing_access_status();
end $$;

-- A recipient cannot claim a reservation after the owner's allowance expired.
alter function app.accept_sharing_invitation(bytea,bytea) rename to accept_sharing_invitation_unmetered;
revoke execute on function app.accept_sharing_invitation_unmetered(bytea,bytea) from continuity_app;
create function app.accept_sharing_invitation(p_hash bytea,p_email_hash bytea) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c app.sharing_connections%rowtype;
begin
 select * into c from app.sharing_connections where invitation_token_hash=p_hash;
 if not found then return jsonb_build_object('error','invitation_unavailable'); end if;
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||c.planner_id::text,0));
 select row.* into c from app.sharing_connections row where row.id=c.id for update;
 if c.status='pending' and app.sharing_connection_mode(c.id)<>'live' then
   return jsonb_build_object('error','sharing_updates_paused'); end if;
 return app.accept_sharing_invitation_unmetered(p_hash,p_email_hash);
end $$;


-- Reads resolve the mode against server time on every request. Saved content
-- cannot be reconstructed from the current Matter or expanded by a later grant.
create or replace function app.recipient_shared_items() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'connectionPublicId',c.public_id,'ownerName',owner.display_name,'matterPublicId',m.public_id,
   'detailLevel',case when mode.value='saved' then s.detail_level else g.detail_level end,
   'accessMode',mode.value,'savedAt',case when mode.value='saved' then s.saved_at end,
   'cutoffAt',case when mode.value='saved' then s.cutoff_at end,
   'fields',case when mode.value='saved' then app.sharing_project_fields(s.fields,g.detail_level)
     else app.sharing_project_fields(jsonb_strip_nulls(m.details || jsonb_build_object(
       'title',m.title,'category',m.category,'institutionName',m.institution_name,
       'locationHint',m.location_hint,'desiredOutcome',m.desired_outcome,'accountHint',m.account_hint,
       'valueBand',m.value_band,'currencyCode',m.currency_code,'importance',m.importance,'notes',m.notes)),g.detail_level) end
 ) order by c.id,g.id),'[]'::jsonb)
 from app.sharing_connections c
 join app.planners owner on owner.id=c.planner_id and owner.status='active'
 join app.people person on person.id=c.person_id and person.planner_id=c.planner_id and person.status not in ('revoked','archived')
 join app.sharing_grants g on g.connection_id=c.id and g.planner_id=c.planner_id
 join app.matter_items m on m.id=g.matter_item_id and m.planner_id=c.planner_id
 cross join lateral (select app.sharing_connection_mode(c.id) as value) mode
 left join app.sharing_saved_items s on s.grant_id=g.id and s.planner_id=c.planner_id
 where c.recipient_planner_id=app.current_planner_id() and c.status='accepted'
   and m.archived_at is null and m.desired_outcome<>'never_disclose'
   and (mode.value='live' or (mode.value='saved' and s.grant_id is not null))
$$;
create or replace function app.recipient_sharing_connections() returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('publicId',c.public_id,'ownerName',p.display_name,
   'acceptedAt',c.accepted_at,'readOnly',true,'accessMode',app.sharing_connection_mode(c.id))
   order by c.accepted_at desc),'[]'::jsonb)
 from app.sharing_connections c join app.planners p on p.id=c.planner_id and p.status='active'
 join app.people person on person.id=c.person_id and person.planner_id=c.planner_id and person.status not in ('revoked','archived')
 where c.recipient_planner_id=app.current_planner_id() and c.status='accepted'
$$;

-- Only bounded functions can inspect or write the snapshots/preferences.
do $$ declare fn record; begin
 for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='app' and p.proname in ('sharing_limits_enabled','sharing_family_grant','sharing_connection_mode',
     'sharing_project_fields','sharing_capture','sharing_access_status','sharing_connection_access','sharing_reserve',
     'sharing_connection_before','sharing_connection_after','sharing_grant_after','sharing_matter_after',
     'sharing_select_live','accept_sharing_invitation')
 loop
   execute format('revoke all on function %s from public',fn.signature);
   execute format('alter function %s owner to continuity_share_service',fn.signature);
 end loop;
end $$;
grant execute on function app.sharing_access_status(),app.sharing_connection_access(uuid),
 app.sharing_reserve(bigint),app.sharing_select_live(uuid,integer,integer,boolean),app.accept_sharing_invitation(bytea,bytea)
 to continuity_app;
revoke create on schema app from continuity_share_service;
