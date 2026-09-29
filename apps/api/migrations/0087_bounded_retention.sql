-- Purpose-specific expiry only. No inactive-account or private-map deletion.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='continuity_retention_service') then
  create role continuity_retention_service nologin nosuperuser nocreatedb nocreaterole noinherit;
 end if;
end $$;
grant continuity_retention_service to current_user;
grant usage,create on schema app to continuity_retention_service;

create table app.retention_holds (
 public_id uuid not null default gen_random_uuid() unique,
 category text not null check(category in ('product_event','audit_event','legal_acceptance','closed_payment','deletion_receipt')),
 record_id uuid not null,
 reason_code text not null check(reason_code in ('legal_requirement','unresolved_dispute','security_incident')),
 created_at timestamptz not null default now(),
 released_at timestamptz,
 primary key(category,record_id)
);
revoke all on app.retention_holds from public;
grant select,delete,update(public_id) on app.retention_holds to continuity_retention_service;
grant select,insert,update on app.retention_holds to continuity_recovery_service;
-- Only an administrative operator can place/release a hold; neither a public
-- request nor the runtime identity can erase or shorten a retention hold.

alter table app.recovery_controls drop constraint recovery_controls_kind_check;
alter table app.recovery_controls add constraint recovery_controls_kind_check
 check(kind in ('account','connection','matter','person','free_slot','unreconciled_access','retention_hold'));
grant create on schema app to continuity_recovery_service;
create function app.capture_retention_hold() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not (select enforced from app.recovery_policy where singleton) or app.recovery_replaying() then return null; end if;
 insert into app.recovery_controls(entity_key,kind,entity_public_id)
 values('retention_hold:'||new.public_id::text,'retention_hold',new.public_id)
 on conflict(entity_key) do update set revision=nextval('app.recovery_revision_seq'),
  transaction_id=txid_current(),published=false,recorded_at=clock_timestamp();
 return null;
end $$;
create trigger recovery_retention_hold after insert or update on app.retention_holds
 for each row execute function app.capture_retention_hold();
revoke all on function app.capture_retention_hold() from public;
alter function app.capture_retention_hold() owner to continuity_recovery_service;
revoke create on schema app from continuity_recovery_service;
create function app.protect_retention_hold() returns trigger
language plpgsql set search_path='' as $$
begin
 if old.released_at is null or old.released_at>statement_timestamp()-interval '90 days' then
  raise exception 'release and retain the hold record before removal' using errcode='55000';
 end if;
 return old;
end $$;
create trigger retention_hold_removal before delete on app.retention_holds
 for each row execute function app.protect_retention_hold();
revoke all on function app.protect_retention_hold() from public;

create or replace function app.recovery_pending() returns jsonb
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
  elsif e.kind='retention_hold' then
   select jsonb_build_object('category',category,'recordId',record_id,'reason',reason_code,'active',released_at is null)
    into payload from app.retention_holds where public_id=e.entity_public_id;
  elsif e.kind='account' then
   select jsonb_build_object('status',status) into payload from app.planners where public_id=e.entity_public_id;
  else payload:='{}'::jsonb;
  end if;
  result:=result||jsonb_build_array(jsonb_build_object('key',e.entity_key,'kind',e.kind,'id',e.entity_public_id,
   'revision',e.revision::text,'recordedAt',e.recorded_at,'facts',coalesce(payload,'{"deleted":true}'::jsonb)));
 end loop;
 return result;
end $$;

do $$ declare t text; key_column text; begin
 foreach t in array array['auth_sessions','auth_transactions','sharing_handoffs','product_events','audit_events','legal_acceptances','closed_account_payment_records','account_deletions'] loop
  execute format('grant select,delete on app.%I to continuity_retention_service',t);
  -- PostgreSQL row locks require UPDATE on at least one column. This role is
  -- not granted to the runtime; only the fixed security-definer function uses it.
  key_column:=case t when 'sharing_handoffs' then 'token_hash'
   when 'closed_account_payment_records' then 'deletion_public_id'
   when 'account_deletions' then 'public_id' else 'id' end;
  execute format('grant update(%I) on app.%I to continuity_retention_service',key_column,t);
  execute format('create policy retention_service on app.%I to continuity_retention_service using(true)',t);
 end loop;
end $$;
create index audit_events_retention_time on app.audit_events(occurred_at,id);
create index closed_payment_retention_time on app.closed_account_payment_records(recorded_at,deletion_public_id);
create index legal_acceptance_unlinked_retention on app.legal_acceptances(accepted_at,id)
 where planner_id is null and identity_account_id is null;

create function app.run_retention_batch(p_limit integer default 200) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n integer; result jsonb:='{}';
begin
 if p_limit<1 or p_limit>1000 or p_limit is null then raise exception 'invalid retention batch bound' using errcode='22023'; end if;
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
revoke create on schema app from continuity_retention_service;
