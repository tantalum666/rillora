-- Refuse to strand an already queued provider deletion without a signed proof.
-- Drain/reconcile these jobs before the maintenance cutover; the whole migration
-- batch rolls back and the old service remains available when this check fails.
lock app.account_deletions in share row exclusive mode;
do $$ begin
 if exists(select 1 from app.account_deletions where status<>'completed' and jsonb_array_length(identities)>0) then
  raise exception 'pending_identity_deletions_require_reconciliation';
 end if;
end $$;

do $$ begin
 if not exists(select 1 from pg_roles where rolname='continuity_deletion_worker') then
  create role continuity_deletion_worker nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
 end if;
 if exists(select 1 from pg_roles where rolname='continuity_deletion_worker'
  and (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolinherit or rolbypassrls or rolreplication)) then
  raise exception 'unsafe deletion worker role';
 end if;
end $$;
grant continuity_deletion_worker to current_user;
grant usage on schema app to continuity_deletion_worker;
alter table app.auth_sessions add column deletion_identity_proof jsonb
 check(deletion_identity_proof is null or (jsonb_typeof(deletion_identity_proof)='object' and octet_length(deletion_identity_proof::text)<=50000));
grant insert(public_id,deletion_identity_proof),update(deletion_identity_proof) on app.auth_sessions to continuity_auth;
grant select(public_id,expires_at,authenticated_at,deletion_identity_proof) on app.auth_sessions to continuity_account_service;
alter table app.account_deletions add column identity_proof jsonb,add column proof_session uuid;
grant create on schema app to continuity_account_service;
grant execute on function app.runtime_maintenance_login() to continuity_account_service;
alter function app.request_account_deletion(bytea) rename to request_account_deletion_internal;
revoke all on function app.request_account_deletion_internal(bytea) from public,continuity_app,continuity_auth,continuity_commerce,continuity_rehearsal;

create function app.request_account_deletion(p_receipt_hash bytea) returns uuid
language plpgsql security definer set search_path='' as $$
begin
 if not app.runtime_maintenance_login() then raise exception 'deletion_identity_proof_required' using errcode='42501'; end if;
 return app.request_account_deletion_internal(p_receipt_hash);
end $$;
alter function app.request_account_deletion(bytea) owner to continuity_account_service;
revoke all on function app.request_account_deletion(bytea) from public;
grant execute on function app.request_account_deletion(bytea) to continuity_app;

create function app.request_account_deletion(p_receipt_hash bytea,p_session uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare proof jsonb; job uuid;
begin
 select s.deletion_identity_proof into proof from app.auth_sessions s
 where s.public_id=p_session and s.planner_id=app.current_planner_id() and s.revoked_at is null
  and s.expires_at>now() and s.authenticated_at>=now()-interval '10 minutes'
  and s.authenticated_at<=now()+interval '30 seconds' for update;
 if proof is null then raise exception 'deletion_identity_proof_required' using errcode='42501'; end if;
 job:=app.request_account_deletion_internal(p_receipt_hash);
 update app.account_deletions set identity_proof=proof,proof_session=p_session where public_id=job;
 return job;
end $$;
alter function app.request_account_deletion(bytea,uuid) owner to continuity_account_service;
revoke all on function app.request_account_deletion(bytea,uuid) from public;
grant execute on function app.request_account_deletion(bytea,uuid) to continuity_app;

create function app.deletion_identity_proof_ready(p_session uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from app.auth_sessions where public_id=p_session and planner_id=app.current_planner_id()
  and revoked_at is null and expires_at>now() and authenticated_at>=now()-interval '10 minutes'
  and authenticated_at<=now()+interval '30 seconds' and deletion_identity_proof is not null)
$$;
alter function app.deletion_identity_proof_ready(uuid) owner to continuity_account_service;
revoke all on function app.deletion_identity_proof_ready(uuid) from public;
grant execute on function app.deletion_identity_proof_ready(uuid) to continuity_app;

create or replace function app.claim_account_deletion(p_job uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j app.account_deletions%rowtype; lease uuid:=gen_random_uuid();
begin
 select * into j from app.account_deletions where status<>'completed'
  and (p_job is null or public_id=p_job) and next_attempt_at<=now()
  and (lease_until is null or lease_until<now()) order by created_at for update skip locked limit 1;
 if not found then return null; end if;
 update app.account_deletions set status='processing',attempts=attempts+1,lease_token=lease,
  lease_until=now()+interval '2 minutes',error_code=null where public_id=j.public_id;
 return jsonb_build_object('publicId',j.public_id,'leaseToken',lease,'identities',j.identities,
  'proof',j.identity_proof,'proofSession',j.proof_session,'requestedAt',j.created_at);
end $$;
revoke execute on function app.claim_account_deletion(uuid),app.finish_account_deletion(uuid,uuid,boolean) from continuity_auth;
grant execute on function app.claim_account_deletion(uuid),app.finish_account_deletion(uuid,uuid,boolean) to continuity_deletion_worker;
grant execute on function app.recovery_pending(),app.recovery_envelopes(),app.recovery_mark_attested(bigint,text,text) to continuity_deletion_worker;
-- This function still checks the original maintenance session_user; an actual
-- worker can never use an unsigned publication acknowledgment.
grant execute on function app.recovery_mark_published(bigint) to continuity_deletion_worker;

create function app.clear_completed_identity_proof() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='completed' then new.identity_proof:=null;new.proof_session:=null; end if;
 return new;
end $$;
revoke all on function app.clear_completed_identity_proof() from public;
create trigger clear_completed_identity_proof before update on app.account_deletions
 for each row execute function app.clear_completed_identity_proof();

create function app.clear_invalid_session_deletion_proof() returns trigger language plpgsql set search_path='' as $$
begin
 if new.revoked_at is not null or new.expires_at<=now() or new.authenticated_at is null
  or new.authenticated_at<now()-interval '10 minutes' then new.deletion_identity_proof:=null; end if;
 return new;
end $$;
revoke all on function app.clear_invalid_session_deletion_proof() from public;
create trigger clear_invalid_session_deletion_proof before insert or update on app.auth_sessions
 for each row execute function app.clear_invalid_session_deletion_proof();
create index session_deletion_proof_expiry on app.auth_sessions(authenticated_at,id) where deletion_identity_proof is not null;
grant select(id),update(deletion_identity_proof) on app.auth_sessions to continuity_account_service;
create function app.sweep_deletion_identity_proofs() returns integer
language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
 with expired as (
  select id from app.auth_sessions where deletion_identity_proof is not null
    and (revoked_at is not null or expires_at<=now() or authenticated_at is null or authenticated_at<now()-interval '10 minutes')
  order by authenticated_at,id limit 250 for update skip locked
 ) update app.auth_sessions set deletion_identity_proof=null where id in (select id from expired);
 get diagnostics removed=row_count;
 return removed;
end $$;
alter function app.sweep_deletion_identity_proofs() owner to continuity_account_service;
revoke all on function app.sweep_deletion_identity_proofs() from public;
grant execute on function app.sweep_deletion_identity_proofs() to continuity_auth;

-- Replaying a terminal source deletion only erases the quarantined database;
-- it never calls Auth0 again or grants the HTTP auth role worker privileges.
grant execute on function app.recovery_replaying() to continuity_account_service;
create function app.recover_completed_account_deletion(p_job uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare job jsonb;
begin
 if not app.recovery_replaying() then raise exception 'recovery_login_required' using errcode='42501'; end if;
 update app.account_deletions set lease_until=null,next_attempt_at=now() where public_id=p_job;
 job:=app.claim_account_deletion(p_job);
 if job is null then return false; end if;
 return app.finish_account_deletion(p_job,(job->>'leaseToken')::uuid,true);
end $$;
alter function app.recover_completed_account_deletion(uuid) owner to continuity_account_service;
revoke all on function app.recover_completed_account_deletion(uuid) from public;
grant execute on function app.recover_completed_account_deletion(uuid) to continuity_recovery_service;
revoke create on schema app from continuity_account_service;
