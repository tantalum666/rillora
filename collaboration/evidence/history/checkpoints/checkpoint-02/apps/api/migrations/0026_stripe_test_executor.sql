do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'continuity_commerce') then
    create role continuity_commerce nologin nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end
$$;

grant usage on schema app to continuity_commerce;
grant execute on function app.current_planner_id() to continuity_commerce;

create table app.commerce_provider_event_inbox (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  provider_code text not null,
  provider_environment text not null,
  provider_event_reference text not null,
  event_type text not null,
  signal_type text not null,
  commerce_account_reference uuid,
  provider_customer_reference text,
  provider_subscription_reference text,
  provider_transaction_reference text,
  provider_refund_reference text,
  payload_sha256 bytea not null,
  signature_verified boolean not null,
  provider_occurred_at timestamptz not null,
  processing_status text not null default 'received',
  attempt_count integer not null default 0,
  last_error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint commerce_provider_inbox_provider check (provider_code in ('stripe', 'storekit')),
  constraint commerce_provider_inbox_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_provider_inbox_reference check (
    char_length(provider_event_reference) between 1 and 255
  ),
  constraint commerce_provider_inbox_event_type check (char_length(event_type) between 1 and 160),
  constraint commerce_provider_inbox_signal_type check (char_length(signal_type) between 1 and 80),
  constraint commerce_provider_inbox_customer_reference check (
    provider_customer_reference is null
    or char_length(provider_customer_reference) between 1 and 255
  ),
  constraint commerce_provider_inbox_subscription_reference check (
    provider_subscription_reference is null
    or char_length(provider_subscription_reference) between 1 and 255
  ),
  constraint commerce_provider_inbox_transaction_reference check (
    provider_transaction_reference is null
    or char_length(provider_transaction_reference) between 1 and 255
  ),
  constraint commerce_provider_inbox_refund_reference check (
    provider_refund_reference is null
    or char_length(provider_refund_reference) between 1 and 255
  ),
  constraint commerce_provider_inbox_digest check (octet_length(payload_sha256) = 32),
  constraint commerce_provider_inbox_signature check (signature_verified = true),
  constraint commerce_provider_inbox_processing check (
    processing_status in ('received', 'processing', 'needs_mapping', 'applied', 'ignored', 'failed')
  ),
  constraint commerce_provider_inbox_attempts check (attempt_count >= 0),
  constraint commerce_provider_inbox_error check (
    last_error_code is null or char_length(last_error_code) between 1 and 80
  ),
  constraint commerce_provider_inbox_processed_time check (
    processed_at is null or processing_status in ('applied', 'ignored', 'failed')
  ),
  constraint commerce_provider_inbox_reference_unique unique (
    provider_code, provider_environment, provider_event_reference
  )
);

create index commerce_provider_inbox_pending_idx
  on app.commerce_provider_event_inbox (processing_status, received_at, id)
  where processing_status in ('received', 'needs_mapping', 'failed');

create table app.commerce_provider_customers (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  commerce_account_id bigint not null,
  provider_code text not null,
  provider_environment text not null,
  provider_customer_reference text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_provider_customers_account_fk foreign key (commerce_account_id, planner_id)
    references app.commerce_accounts(id, planner_id) on delete cascade,
  constraint commerce_provider_customers_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_provider_customers_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_provider_customers_reference check (
    char_length(provider_customer_reference) between 1 and 255
  ),
  constraint commerce_provider_customers_status check (status in ('active', 'revoked')),
  constraint commerce_provider_customers_reference_unique unique (
    provider_code, provider_environment, provider_customer_reference
  ),
  constraint commerce_provider_customers_account_unique unique (
    commerce_account_id, provider_code, provider_environment
  ),
  constraint commerce_provider_customers_id_planner_unique unique (id, planner_id)
);

create table app.commerce_provider_object_links (
  id bigint generated always as identity primary key,
  provider_code text not null,
  provider_environment text not null,
  provider_object_type text not null,
  provider_object_reference text not null,
  commerce_account_reference uuid not null references app.commerce_accounts(public_id) on delete cascade,
  order_public_id uuid,
  payment_attempt_public_id uuid,
  created_at timestamptz not null default now(),
  constraint commerce_provider_object_links_provider check (provider_code in ('stripe', 'storekit')),
  constraint commerce_provider_object_links_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_provider_object_links_type check (
    provider_object_type in ('checkout_session', 'customer', 'subscription', 'invoice', 'charge', 'refund', 'dispute')
  ),
  constraint commerce_provider_object_links_reference check (
    char_length(provider_object_reference) between 1 and 255
  ),
  constraint commerce_provider_object_links_reference_unique unique (
    provider_code, provider_environment, provider_object_reference
  )
);

alter table app.commerce_provider_events
  add constraint commerce_provider_events_id_planner_unique unique (id, planner_id);

create table app.commerce_reconciliation_runs (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  commerce_account_id bigint not null,
  provider_event_id bigint not null,
  subscription_id bigint,
  directive text not null,
  target_state text,
  reason_code text not null,
  entitlement_mutation_applied boolean not null default false,
  created_at timestamptz not null default now(),
  constraint commerce_reconciliation_account_fk foreign key (commerce_account_id, planner_id)
    references app.commerce_accounts(id, planner_id) on delete cascade,
  constraint commerce_reconciliation_event_fk foreign key (provider_event_id, planner_id)
    references app.commerce_provider_events(id, planner_id) on delete cascade,
  constraint commerce_reconciliation_subscription_fk foreign key (subscription_id, planner_id)
    references app.commerce_subscriptions(id, planner_id) on delete cascade,
  constraint commerce_reconciliation_directive check (directive in ('grant', 'revoke', 'hold')),
  constraint commerce_reconciliation_state check (
    target_state is null
    or target_state in (
      'previewing', 'active', 'cancel_at_period_end', 'grace', 'past_due',
      'expired_read_only', 'refunded', 'revoked'
    )
  ),
  constraint commerce_reconciliation_reason check (char_length(reason_code) between 1 and 80),
  constraint commerce_reconciliation_no_test_entitlement check (
    entitlement_mutation_applied = false
  ),
  constraint commerce_reconciliation_event_unique unique (provider_event_id)
);

alter table app.commerce_provider_customers enable row level security;
alter table app.commerce_provider_customers force row level security;
create policy commerce_provider_customers_tenant_isolation on app.commerce_provider_customers
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_reconciliation_runs enable row level security;
alter table app.commerce_reconciliation_runs force row level security;
create policy commerce_reconciliation_runs_tenant_isolation on app.commerce_reconciliation_runs
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

create or replace function app.resolve_commerce_account(p_public_id uuid)
returns table (commerce_account_id bigint, planner_id bigint, plan_id bigint, public_id uuid)
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select account.id, account.planner_id, account.plan_id, account.public_id
  from app.commerce_accounts account
  where account.public_id = p_public_id
    and account.status = 'active'
$$;

revoke all on function app.resolve_commerce_account(uuid) from public;
grant execute on function app.resolve_commerce_account(uuid) to continuity_commerce;

revoke all privileges on app.commerce_provider_event_inbox from public;
revoke all privileges on app.commerce_provider_object_links from public;

grant select on
  app.plans,
  app.commerce_operators,
  app.commerce_plan_versions,
  app.commerce_plan_capabilities,
  app.commerce_capabilities,
  app.commerce_prices,
  app.commerce_storefront_products,
  app.commerce_market_policies,
  app.commerce_storefront_policies,
  app.commerce_purchase_route_policies
to continuity_commerce;

grant select, insert on app.commerce_accounts to continuity_commerce;
grant select, insert on app.commerce_orders to continuity_commerce;
grant update (status, updated_at) on app.commerce_orders to continuity_commerce;
grant select, insert on app.commerce_payment_attempts to continuity_commerce;
grant update (provider_payment_reference, status, updated_at)
  on app.commerce_payment_attempts to continuity_commerce;
grant select, insert on app.commerce_provider_events to continuity_commerce;
grant update (processing_status, processed_at)
  on app.commerce_provider_events to continuity_commerce;
grant select, insert on app.commerce_provider_customers to continuity_commerce;
grant update (provider_customer_reference, status, updated_at)
  on app.commerce_provider_customers to continuity_commerce;
grant select, insert on app.commerce_subscriptions to continuity_commerce;
grant update (
  state, current_period_starts_at, current_period_ends_at, grace_ends_at,
  cancel_at_period_end, canceled_at, ended_at, version, updated_at
) on app.commerce_subscriptions to continuity_commerce;
grant select, insert on app.commerce_subscription_state_history to continuity_commerce;
grant select, insert on app.commerce_reconciliation_runs to continuity_commerce;
grant select, insert, update on app.commerce_provider_event_inbox to continuity_commerce;
grant select, insert on app.commerce_provider_object_links to continuity_commerce;

grant usage, select on sequence
  app.commerce_accounts_id_seq,
  app.commerce_orders_id_seq,
  app.commerce_payment_attempts_id_seq,
  app.commerce_provider_events_id_seq,
  app.commerce_provider_customers_id_seq,
  app.commerce_subscriptions_id_seq,
  app.commerce_subscription_state_history_id_seq,
  app.commerce_reconciliation_runs_id_seq,
  app.commerce_provider_event_inbox_id_seq,
  app.commerce_provider_object_links_id_seq
to continuity_commerce;
