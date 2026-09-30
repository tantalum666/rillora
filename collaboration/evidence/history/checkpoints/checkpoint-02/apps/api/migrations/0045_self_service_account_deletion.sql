-- The runtime cannot assume this role. Narrow functions bind deletion to either
-- the authenticated planner or an opaque leased job created by that planner.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='continuity_account_service') then
    create role continuity_account_service nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end $$;
grant continuity_account_service to current_user;
grant usage,create on schema app to continuity_account_service;
grant execute on function app.current_planner_id() to continuity_account_service;

create table app.account_deletions (
  public_id uuid primary key default gen_random_uuid(),
  planner_id bigint unique references app.planners(id) on delete set null,
  receipt_hash bytea not null unique check(octet_length(receipt_hash)=32),
  identities jsonb not null default '[]'::jsonb,
  status text not null default 'queued' check(status in('queued','processing','retrying','completed')),
  attempts integer not null default 0,
  lease_token uuid,
  lease_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table app.closed_account_payment_records (
  deletion_public_id uuid primary key,
  records jsonb not null,
  retained_for text not null default 'payment_disputes_and_required_records',
  recorded_at timestamptz not null default now()
);
revoke all on app.account_deletions,app.closed_account_payment_records from public;
grant select,insert,update,delete on app.account_deletions,app.closed_account_payment_records to continuity_account_service;
alter table app.account_deletions enable row level security;
alter table app.account_deletions force row level security;
create policy deletion_service on app.account_deletions to continuity_account_service using(true) with check(true);
alter table app.closed_account_payment_records enable row level security;
alter table app.closed_account_payment_records force row level security;
create policy closed_payments_service on app.closed_account_payment_records to continuity_account_service using(true) with check(true);

grant select,update,delete on app.planners to continuity_account_service;
create policy planners_deletion_service on app.planners to continuity_account_service using(true) with check(true);
grant select(planner_id,issuer,subject) on app.identity_accounts to continuity_account_service;
grant select(planner_id,revoked_at),update(revoked_at) on app.auth_sessions to continuity_account_service;
create policy sessions_deletion_service on app.auth_sessions to continuity_account_service using(true) with check(true);
grant select,update on app.sharing_connections to continuity_account_service;
create policy sharing_deletion_service on app.sharing_connections to continuity_account_service using(true) with check(true);
do $$ declare t text; begin
  foreach t in array array['commerce_orders','commerce_payment_attempts','commerce_settlements','commerce_refunds'] loop
    execute format('grant select on app.%I to continuity_account_service',t);
    execute format('create policy account_deletion_retention on app.%I for select to continuity_account_service using(true)',t);
  end loop;
end $$;

create function app.request_account_deletion(p_receipt_hash bytea) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor bigint:=app.current_planner_id(); job uuid;
begin
  if actor is null or octet_length(p_receipt_hash)<>32 then raise exception 'invalid deletion request' using errcode='22023'; end if;
  perform 1 from app.planners where id=actor and status='active' for update;
  if not found then raise exception 'account unavailable' using errcode='22023'; end if;
  insert into app.account_deletions(planner_id,receipt_hash,identities)
    select actor,p_receipt_hash,coalesce(jsonb_agg(jsonb_build_object('issuer',issuer,'subject',subject)),'[]'::jsonb)
    from app.identity_accounts where planner_id=actor returning public_id into job;
  update app.planners set status='deletion_pending',updated_at=now() where id=actor;
  update app.auth_sessions set revoked_at=coalesce(revoked_at,now()) where planner_id=actor;
  -- Preserve the other planner's history, but terminate both directions of access.
  update app.sharing_connections set status='revoked',revoked_at=coalesce(revoked_at,now()),
    recipient_planner_id=case when recipient_planner_id=actor then null else recipient_planner_id end,
    version=version+1,updated_at=now()
    where planner_id=actor or recipient_planner_id=actor;
  return job;
end $$;

create function app.claim_account_deletion(p_job uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j app.account_deletions%rowtype; lease uuid:=gen_random_uuid();
begin
  select * into j from app.account_deletions where status<>'completed'
    and (p_job is null or public_id=p_job) and next_attempt_at<=now()
    and (lease_until is null or lease_until<now()) order by created_at for update skip locked limit 1;
  if not found then return null; end if;
  update app.account_deletions set status='processing',attempts=attempts+1,lease_token=lease,
    lease_until=now()+interval '2 minutes',error_code=null where public_id=j.public_id;
  return jsonb_build_object('publicId',j.public_id,'leaseToken',lease,'identities',j.identities);
end $$;

create function app.finish_account_deletion(p_job uuid,p_lease uuid,p_succeeded boolean) returns boolean
language plpgsql security definer set search_path='' as $$
declare j app.account_deletions%rowtype; orders jsonb; attempts jsonb; settlements jsonb; refunds jsonb;
begin
  select * into j from app.account_deletions where public_id=p_job and lease_token=p_lease and status='processing' for update;
  if not found then return false; end if;
  if not p_succeeded then
    update app.account_deletions set status='retrying',error_code='identity_cleanup_retry',lease_token=null,lease_until=null,
      next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,least(j.attempts,7))::integer)) where public_id=p_job;
    return false;
  end if;
  -- Keep bounded financial evidence, not the private map or identity profile.
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'-'commerce_account_id'),'[]'::jsonb) into orders from app.commerce_orders o where o.planner_id=j.planner_id;
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'),'[]'::jsonb) into attempts from app.commerce_payment_attempts o where o.planner_id=j.planner_id;
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'-'commerce_account_id'),'[]'::jsonb) into settlements from app.commerce_settlements o where o.planner_id=j.planner_id;
  select coalesce(jsonb_agg(to_jsonb(o)-'id'-'planner_id'),'[]'::jsonb) into refunds from app.commerce_refunds o where o.planner_id=j.planner_id;
  if jsonb_array_length(orders)>0 then
    insert into app.closed_account_payment_records(deletion_public_id,records)
      values(p_job,jsonb_build_object('orders',orders,'payments',attempts,'settlements',settlements,'refunds',refunds)) on conflict do nothing;
  end if;
  -- Existing legal_acceptances use SET NULL and retain only their approved digest.
  delete from app.planners where id=j.planner_id and status='deletion_pending';
  if exists(select 1 from app.planners where id=j.planner_id) then
    raise exception 'account erasure not complete' using errcode='55000';
  end if;
  update app.account_deletions set status='completed',identities='[]'::jsonb,planner_id=null,
    completed_at=now(),lease_token=null,lease_until=null,error_code=null where public_id=p_job;
  return true;
end $$;

create function app.account_deletion_status(p_hash bytea) returns jsonb
language sql stable security definer set search_path='' as $$
  select jsonb_build_object('publicId',public_id,'status',case when status='completed' then 'completed' else 'pending' end,
    'requestedAt',created_at,'completedAt',completed_at)
  from app.account_deletions where receipt_hash=p_hash and (status<>'completed' or completed_at>now()-interval '30 days')
$$;
create function app.identity_deletion_pending(p_issuer text,p_subject text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from app.identity_accounts i join app.planners p on p.id=i.planner_id
    where i.issuer=p_issuer and i.subject=p_subject and p.status='deletion_pending')
$$;

revoke all on function app.request_account_deletion(bytea),app.claim_account_deletion(uuid),
  app.finish_account_deletion(uuid,uuid,boolean),app.account_deletion_status(bytea),app.identity_deletion_pending(text,text) from public;
grant execute on function app.request_account_deletion(bytea) to continuity_app;
grant execute on function app.claim_account_deletion(uuid),app.finish_account_deletion(uuid,uuid,boolean),
  app.account_deletion_status(bytea),app.identity_deletion_pending(text,text) to continuity_auth;
alter function app.request_account_deletion(bytea) owner to continuity_account_service;
alter function app.claim_account_deletion(uuid) owner to continuity_account_service;
alter function app.finish_account_deletion(uuid,uuid,boolean) owner to continuity_account_service;
alter function app.account_deletion_status(bytea) owner to continuity_account_service;
alter function app.identity_deletion_pending(text,text) owner to continuity_account_service;
revoke create on schema app from continuity_account_service;
