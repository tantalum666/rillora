-- Verified notifications are acknowledged only after durable storage. Delivery
-- duplicates and worker attempts are different counters; leases survive crashes.
alter table app.commerce_provider_event_inbox
  add column work_attempts integer not null default 0 check(work_attempts>=0),
  add column next_attempt_at timestamptz not null default now(),
  add column lease_token uuid,
  add column lease_until timestamptz,
  add column verified_receipt jsonb check(verified_receipt is null or
    (jsonb_typeof(verified_receipt)='object' and octet_length(verified_receipt::text)<=4096)),
  add constraint commerce_inbox_lease_pair check((lease_token is null)=(lease_until is null));
create index apple_production_work_due on app.commerce_provider_event_inbox(next_attempt_at,id)
  where provider_code='storekit' and provider_environment='production'
    and processing_status in ('received','needs_mapping','needs_authoritative_snapshot','processing');

alter table app.commerce_subscriptions add column renewal_is_possible boolean;
grant select(renewal_is_possible),update(renewal_is_possible) on app.commerce_subscriptions to continuity_commerce;
grant select(renewal_is_possible) on app.commerce_subscriptions to continuity_app;

create table app.commerce_apple_subscription_observations (
  subscription_id bigint primary key,
  planner_id bigint not null references app.planners(id) on delete cascade,
  renewal_provider text not null default 'storekit' check(renewal_provider='storekit'),
  provider_environment text not null default 'production' check(provider_environment='production'),
  transaction_reference text not null check(transaction_reference ~ '^[0-9]{1,40}$'),
  transaction_signed_at timestamptz not null,
  renewal_signed_at timestamptz not null,
  purchased_at timestamptz not null,
  foreign key(subscription_id,planner_id,renewal_provider,provider_environment)
    references app.commerce_subscriptions(id,planner_id,renewal_provider,provider_environment) on delete cascade
);
alter table app.commerce_apple_subscription_observations enable row level security;
alter table app.commerce_apple_subscription_observations force row level security;
create policy apple_observation_owner on app.commerce_apple_subscription_observations to continuity_commerce
  using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
revoke all on app.commerce_apple_subscription_observations from public;
grant select,insert,update on app.commerce_apple_subscription_observations to continuity_commerce;

-- Account management/renewals remain possible when new sales close. Never infer
-- service-market residence from an Apple storefront, or revive a deleting owner.
create function app.resolve_apple_production_account(p_token uuid)
returns table(planner_id bigint,commerce_account_reference uuid)
language sql stable security definer set search_path=pg_catalog,app as $$
  select p.id,a.public_id from app.planners p
    join app.commerce_accounts a on a.planner_id=p.id
  where p.public_id=p_token and p.status='active'
    and a.operating_plane_code='global' and a.status='active'
$$;
revoke all on function app.resolve_apple_production_account(uuid) from public;
grant execute on function app.resolve_apple_production_account(uuid) to continuity_commerce;
