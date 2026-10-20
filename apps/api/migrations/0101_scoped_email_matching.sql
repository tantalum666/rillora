-- Existing digests are backfilled by the administrative keyed migration before
-- the new runtime becomes ready. No raw email or matching key enters PostgreSQL.
alter table app.sharing_connections add column recipient_email_hash_version smallint not null default 1
 check(recipient_email_hash_version in(1,2));
-- A representation-only administrative backfill preserves historical duplicate
-- connections; it cannot alter any field other than the versioned digest.
create or replace function app.sharing_connection_before() returns trigger
language plpgsql security definer set search_path='' as $$
declare e record;
begin
 perform pg_advisory_xact_lock(hashtextextended('sharing:'||new.planner_id::text,0));
 if tg_op='UPDATE' and old.recipient_email_hash_version=1 and new.recipient_email_hash_version=2
  and app.runtime_maintenance_login()
  and (to_jsonb(old)-'recipient_email_hash'-'recipient_email_hash_version')=(to_jsonb(new)-'recipient_email_hash'-'recipient_email_hash_version') then return new; end if;
 if not app.runtime_maintenance_login() and new.recipient_email_hash_version<>2 then raise exception 'email_match_migration_required'; end if;
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
grant execute on function app.runtime_maintenance_login() to continuity_share_service;
grant insert(recipient_email_hash_version),update(recipient_email_hash_version) on app.sharing_connections to continuity_app;
grant select(recipient_email_hash_version) on app.sharing_connections to continuity_share_service;
update app.auth_sessions set verified_email_hash=null;
alter table app.auth_sessions add constraint session_has_no_global_email_digest check(verified_email_hash is null);

create table app.email_match_policy (
 singleton boolean primary key default true check(singleton),
 key_verifier bytea not null check(octet_length(key_verifier)=32),
 migrated_at timestamptz not null default now()
);
revoke all on app.email_match_policy from public;
grant select on app.email_match_policy to continuity_auth;
grant select on app.email_match_policy to continuity_share_service;
alter table app.email_match_policy enable row level security;
alter table app.email_match_policy force row level security;
create policy email_match_read on app.email_match_policy for select to continuity_auth,continuity_share_service using(true);
create policy email_match_admin on app.email_match_policy to continuity_authority_service using(true) with check(true);
create policy runtime_authority on app.email_match_policy as restrictive
 using((select app.runtime_authority_valid())) with check((select app.runtime_authority_valid()));

create function app.invitation_email_scope(p_hash bytea) returns uuid
language sql stable security definer set search_path='' as $$
 select p.public_id from app.sharing_connections c join app.planners p on p.id=c.planner_id
 where c.invitation_token_hash=p_hash and c.recipient_email_hash_version=2 and p.status='active'
  and (c.status='pending' or (c.status='accepted' and c.recipient_planner_id=app.current_planner_id()))
$$;
revoke all on function app.invitation_email_scope(bytea) from public;
grant execute on function app.invitation_email_scope(bytea) to continuity_app;
grant create on schema app to continuity_share_service;
alter function app.invitation_email_scope(bytea) owner to continuity_share_service;

create function app.email_match_state() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('verifier',(select encode(key_verifier,'hex') from app.email_match_policy where singleton),
   'legacy',exists(select 1 from app.sharing_connections where recipient_email_hash_version<>2))
$$;
alter function app.email_match_state() owner to continuity_share_service;
revoke all on function app.email_match_state() from public;
grant execute on function app.email_match_state() to continuity_auth;
revoke create on schema app from continuity_share_service;
