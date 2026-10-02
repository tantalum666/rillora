-- Serialize both placing/releasing administrative holds and bounded cleanup.
-- The lock precedes the worker's fresh statement snapshot; locking a due row
-- alone cannot refresh a hold predicate evaluated before a concurrent commit.
grant select(public_id) on app.product_events,app.audit_events,app.legal_acceptances to continuity_recovery_service;
grant select(deletion_public_id) on app.closed_account_payment_records to continuity_recovery_service;
do $$ declare t text; begin
 foreach t in array array['product_events','audit_events','legal_acceptances','closed_account_payment_records'] loop
  execute format('create policy recovery_hold_record_lookup on app.%I for select to continuity_recovery_service using(true)',t);
 end loop;
end $$;

create or replace function app.run_retention_batch(p_limit integer default 200) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n integer; result jsonb:='{}';
begin
 if p_limit<1 or p_limit>1000 or p_limit is null then raise exception 'invalid retention batch bound' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended('retention-holds',0));
 -- The caller cannot choose the clock, a planner, a private table or a cutoff.
 with due as(select id from app.auth_sessions where expires_at<=statement_timestamp() order by expires_at,id limit p_limit for update skip locked)
 delete from app.auth_sessions s using due where s.id=due.id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('sessions',n);
 with due as(select id from app.auth_transactions where expires_at<=statement_timestamp() order by expires_at,id limit p_limit for update skip locked)
 delete from app.auth_transactions t using due where t.id=due.id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('authTransactions',n);
 with due as(select token_hash from app.sharing_handoffs where expires_at<=statement_timestamp() order by expires_at limit p_limit for update skip locked)
 delete from app.sharing_handoffs h using due where h.token_hash=due.token_hash;
 get diagnostics n=row_count;result:=result||jsonb_build_object('sharingHandoffs',n);
 with due as(select e.id from app.product_events e where e.expires_at<=statement_timestamp()
  and not exists(select 1 from app.retention_holds h where h.category='product_event' and h.record_id=e.public_id and h.released_at is null)
  order by e.expires_at,e.id limit p_limit for update skip locked)
 delete from app.product_events e using due where e.id=due.id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('productEvents',n);
 with due as(select e.id from app.audit_events e where e.occurred_at<=statement_timestamp()-interval '12 months'
  and not exists(select 1 from app.retention_holds h where h.category='audit_event' and h.record_id=e.public_id and h.released_at is null)
  order by e.occurred_at,e.id limit p_limit for update skip locked)
 delete from app.audit_events e using due where e.id=due.id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('auditEvents',n);
 -- Linked receipts remain needed by an active account/session. Closed-account
 -- evidence follows the published seven-year window unless an explicit hold exists.
 with due as(select a.id from app.legal_acceptances a where a.planner_id is null and a.identity_account_id is null
  and a.accepted_at<=statement_timestamp()-interval '7 years'
  and not exists(select 1 from app.auth_sessions s where s.legal_acceptance_id=a.id)
  and not exists(select 1 from app.retention_holds h where h.category='legal_acceptance' and h.record_id=a.public_id and h.released_at is null)
  order by a.accepted_at,a.id limit p_limit for update skip locked)
 delete from app.legal_acceptances a using due where a.id=due.id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('legalAcceptances',n);
 with due as(select p.deletion_public_id from app.closed_account_payment_records p where p.recorded_at<=statement_timestamp()-interval '7 years'
  and not exists(select 1 from app.retention_holds h where h.category='closed_payment' and h.record_id=p.deletion_public_id and h.released_at is null)
  order by p.recorded_at,p.deletion_public_id limit p_limit for update skip locked)
 delete from app.closed_account_payment_records p using due where p.deletion_public_id=due.deletion_public_id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('closedPayments',n);
 with due as(select d.public_id from app.account_deletions d where d.status='completed' and d.planner_id is null
  and d.identities='[]'::jsonb and d.completed_at<=statement_timestamp()-interval '30 days'
  and not exists(select 1 from app.retention_holds h where h.category='deletion_receipt' and h.record_id=d.public_id and h.released_at is null)
  order by d.completed_at,d.public_id limit p_limit for update skip locked)
 delete from app.account_deletions d using due where d.public_id=due.public_id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('deletionReceipts',n);
 with due as(select public_id from app.retention_holds where released_at<=statement_timestamp()-interval '90 days'
  order by released_at,public_id limit p_limit for update skip locked)
 delete from app.retention_holds h using due where h.public_id=due.public_id;
 get diagnostics n=row_count;result:=result||jsonb_build_object('releasedHolds',n);
 return result;
end $$;
revoke all on function app.run_retention_batch(integer) from public;
grant execute on function app.run_retention_batch(integer) to continuity_auth;
alter function app.run_retention_batch(integer) owner to continuity_retention_service;
