create table app.commerce_operating_planes (
  code text primary key,
  data_region_code text not null,
  status text not null default 'configured_disabled',
  created_at timestamptz not null default now(),
  constraint commerce_operating_planes_code check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  constraint commerce_operating_planes_region check (char_length(data_region_code) between 2 and 40),
  constraint commerce_operating_planes_status check (
    status in ('configured_disabled', 'active', 'retired')
  )
);

create table app.commerce_operators (
  code text primary key,
  operating_plane_code text not null references app.commerce_operating_planes(code),
  party_type text not null,
  status text not null default 'pending',
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_operators_code check (code ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint commerce_operators_party_type check (party_type in ('individual', 'organization', 'partner')),
  constraint commerce_operators_status check (status in ('pending', 'active', 'retired')),
  constraint commerce_operators_window check (
    effective_to is null or (effective_from is not null and effective_to > effective_from)
  )
);

create table app.commerce_catalog_products (
  code text primary key,
  catalog_family text not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint commerce_catalog_products_code check (code ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint commerce_catalog_products_family check (
    catalog_family in ('consumer_subscription', 'human_service', 'professional')
  ),
  constraint commerce_catalog_products_status check (status in ('active', 'dormant', 'retired'))
);

create table app.commerce_plan_versions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  catalog_product_code text not null references app.commerce_catalog_products(code),
  plan_code text not null,
  version integer not null,
  status text not null,
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_plan_versions_code check (plan_code ~ '^[a-z][a-z0-9_]{1,39}$'),
  constraint commerce_plan_versions_version check (version > 0),
  constraint commerce_plan_versions_status check (status in ('active', 'planned', 'dormant', 'retired')),
  constraint commerce_plan_versions_window check (
    effective_to is null or (effective_from is not null and effective_to > effective_from)
  ),
  constraint commerce_plan_versions_unique unique (plan_code, version),
  constraint commerce_plan_versions_id_code_unique unique (id, plan_code)
);

create table app.commerce_capabilities (
  code text primary key,
  status text not null,
  baseline_trust_control boolean not null default false,
  created_at timestamptz not null default now(),
  constraint commerce_capabilities_code check (code ~ '^[a-z][a-z0-9_]{1,63}$'),
  constraint commerce_capabilities_status check (status in ('active', 'planned', 'retired'))
);

create table app.commerce_plan_capabilities (
  plan_version_id bigint not null references app.commerce_plan_versions(id),
  capability_code text not null references app.commerce_capabilities(code),
  allowance integer,
  enforcement_mode text not null,
  created_at timestamptz not null default now(),
  primary key (plan_version_id, capability_code),
  constraint commerce_plan_capabilities_allowance check (allowance is null or allowance >= 0),
  constraint commerce_plan_capabilities_enforcement check (
    enforcement_mode in ('included', 'metered_limit', 'planned', 'unavailable')
  )
);

create table app.commerce_prices (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  price_code text not null unique,
  plan_version_id bigint not null references app.commerce_plan_versions(id),
  operator_code text not null references app.commerce_operators(code),
  service_market_code text not null,
  amount_minor bigint not null,
  currency_code text not null,
  billing_interval text not null,
  tax_behavior text not null,
  status text not null default 'disabled_hypothesis',
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_prices_code check (price_code ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint commerce_prices_market check (service_market_code ~ '^[A-Z][A-Z0-9_]{1,39}$'),
  constraint commerce_prices_amount check (amount_minor > 0),
  constraint commerce_prices_currency check (currency_code ~ '^[A-Z]{3}$'),
  constraint commerce_prices_interval check (billing_interval in ('monthly', 'annual', 'one_time')),
  constraint commerce_prices_tax_behavior check (
    tax_behavior in ('inclusive', 'exclusive', 'provider_determined', 'not_configured')
  ),
  constraint commerce_prices_status check (
    status in ('disabled_hypothesis', 'test_only', 'active', 'retired')
  ),
  constraint commerce_prices_window check (
    effective_to is null or (effective_from is not null and effective_to > effective_from)
  )
);

create index commerce_prices_market_status_idx
  on app.commerce_prices (service_market_code, status, billing_interval, id);

create table app.commerce_storefront_products (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  price_id bigint not null references app.commerce_prices(id),
  provider_code text not null,
  provider_environment text not null,
  storefront_country_code text,
  external_product_reference text not null,
  status text not null default 'test_only',
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_storefront_products_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_storefront_products_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_storefront_products_storefront check (
    storefront_country_code is null or storefront_country_code ~ '^[A-Z]{3}$'
  ),
  constraint commerce_storefront_products_reference check (
    char_length(external_product_reference) between 1 and 255
  ),
  constraint commerce_storefront_products_status check (status in ('test_only', 'active', 'retired')),
  constraint commerce_storefront_products_window check (
    effective_to is null or (effective_from is not null and effective_to > effective_from)
  ),
  constraint commerce_storefront_products_external_unique unique (
    provider_code, provider_environment, external_product_reference
  )
);

create table app.commerce_market_policies (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  policy_code text not null,
  version integer not null,
  service_market_code text not null,
  operating_plane_code text not null references app.commerce_operating_planes(code),
  operator_code text not null references app.commerce_operators(code),
  sales_enabled boolean not null default false,
  status text not null default 'configured_disabled',
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_market_policies_code check (policy_code ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint commerce_market_policies_version check (version > 0),
  constraint commerce_market_policies_market check (service_market_code ~ '^[A-Z][A-Z0-9_]{1,39}$'),
  constraint commerce_market_policies_status check (
    status in ('configured_disabled', 'active', 'retired')
  ),
  constraint commerce_market_policies_enabled_status check (
    sales_enabled = false or status = 'active'
  ),
  constraint commerce_market_policies_window check (
    effective_to is null or (effective_from is not null and effective_to > effective_from)
  ),
  constraint commerce_market_policies_unique unique (policy_code, version),
  constraint commerce_market_policies_market_version_unique unique (service_market_code, version)
);

create table app.commerce_storefront_policies (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  policy_code text not null,
  version integer not null,
  client_surface text not null,
  apple_storefront_country_code text,
  planned_route text not null,
  external_offer_allowed boolean not null default false,
  status text not null default 'configured_disabled',
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_storefront_policies_code check (policy_code ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint commerce_storefront_policies_version check (version > 0),
  constraint commerce_storefront_policies_surface check (client_surface in ('web', 'ios')),
  constraint commerce_storefront_policies_storefront check (
    apple_storefront_country_code is null or apple_storefront_country_code ~ '^[A-Z]{3}$'
  ),
  constraint commerce_storefront_policies_surface_storefront check (
    (client_surface = 'web' and apple_storefront_country_code is null)
    or (client_surface = 'ios' and apple_storefront_country_code is not null)
  ),
  constraint commerce_storefront_policies_route check (
    planned_route in ('stripe_web_external', 'apple_storekit', 'web_direct', 'none')
  ),
  constraint commerce_storefront_policies_status check (
    status in ('configured_disabled', 'active', 'retired')
  ),
  constraint commerce_storefront_policies_window check (
    effective_to is null or (effective_from is not null and effective_to > effective_from)
  ),
  constraint commerce_storefront_policies_unique unique (policy_code, version)
);

create table app.commerce_purchase_route_policies (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  policy_code text not null,
  version integer not null,
  market_policy_id bigint not null references app.commerce_market_policies(id),
  storefront_policy_id bigint not null references app.commerce_storefront_policies(id),
  purchase_route text not null,
  provider_code text not null,
  enabled boolean not null default false,
  status text not null default 'configured_disabled',
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_purchase_route_policies_code check (policy_code ~ '^[a-z][a-z0-9_]{1,79}$'),
  constraint commerce_purchase_route_policies_version check (version > 0),
  constraint commerce_purchase_route_policies_route check (
    purchase_route in ('stripe_web_external', 'apple_storekit', 'web_direct', 'none')
  ),
  constraint commerce_purchase_route_policies_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web', 'none')
  ),
  constraint commerce_purchase_route_policies_route_provider check (
    (purchase_route = 'none' and provider_code = 'none')
    or (purchase_route <> 'none' and provider_code <> 'none')
  ),
  constraint commerce_purchase_route_policies_status check (
    status in ('configured_disabled', 'test_only', 'active', 'retired')
  ),
  constraint commerce_purchase_route_policies_enabled_status check (
    enabled = false or status in ('test_only', 'active')
  ),
  constraint commerce_purchase_route_policies_window check (
    effective_to is null or (effective_from is not null and effective_to > effective_from)
  ),
  constraint commerce_purchase_route_policies_unique unique (policy_code, version)
);

create table app.commerce_accounts (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  plan_id bigint not null,
  operating_plane_code text not null references app.commerce_operating_planes(code),
  service_market_code text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_accounts_plan_fk foreign key (plan_id, planner_id)
    references app.plans(id, planner_id) on delete cascade,
  constraint commerce_accounts_market check (service_market_code ~ '^[A-Z][A-Z0-9_]{1,39}$'),
  constraint commerce_accounts_status check (status in ('active', 'locked', 'closed')),
  constraint commerce_accounts_plan_plane_unique unique (plan_id, operating_plane_code),
  constraint commerce_accounts_id_planner_unique unique (id, planner_id)
);

create index commerce_accounts_planner_status_idx
  on app.commerce_accounts (planner_id, status, id);

create table app.commerce_subscriptions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  commerce_account_id bigint not null,
  plan_version_id bigint not null,
  plan_code text not null,
  price_id bigint references app.commerce_prices(id),
  acquisition_type text not null,
  renewal_provider text not null,
  provider_environment text not null,
  provider_subscription_reference text,
  state text not null,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  grace_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_subscriptions_account_fk foreign key (commerce_account_id, planner_id)
    references app.commerce_accounts(id, planner_id) on delete cascade,
  constraint commerce_subscriptions_plan_version_fk foreign key (plan_version_id, plan_code)
    references app.commerce_plan_versions(id, plan_code),
  constraint commerce_subscriptions_acquisition check (
    acquisition_type in ('purchased', 'preview', 'migration', 'support_override')
  ),
  constraint commerce_subscriptions_provider check (
    renewal_provider in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_subscriptions_environment check (
    provider_environment in ('sandbox', 'test', 'production', 'internal')
  ),
  constraint commerce_subscriptions_state check (
    state in ('previewing', 'active', 'cancel_at_period_end', 'grace', 'past_due', 'expired_read_only', 'refunded', 'revoked')
  ),
  constraint commerce_subscriptions_period check (
    current_period_ends_at is null
    or (current_period_starts_at is not null and current_period_ends_at > current_period_starts_at)
  ),
  constraint commerce_subscriptions_grace check (
    grace_ends_at is null or current_period_ends_at is not null
  ),
  constraint commerce_subscriptions_purchased_reference check (
    acquisition_type <> 'purchased' or provider_subscription_reference is not null
  ),
  constraint commerce_subscriptions_reference_length check (
    provider_subscription_reference is null
    or char_length(provider_subscription_reference) between 1 and 255
  ),
  constraint commerce_subscriptions_version check (version > 0),
  constraint commerce_subscriptions_provider_reference_unique unique (
    renewal_provider, provider_environment, provider_subscription_reference
  ),
  constraint commerce_subscriptions_id_planner_unique unique (id, planner_id)
);

create unique index commerce_subscriptions_one_active_renewal_idx
  on app.commerce_subscriptions (commerce_account_id, plan_code)
  where state in ('previewing', 'active', 'cancel_at_period_end', 'grace', 'past_due');

create index commerce_subscriptions_planner_state_idx
  on app.commerce_subscriptions (planner_id, state, id desc);

create table app.commerce_subscription_state_history (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  subscription_id bigint not null,
  from_state text,
  to_state text not null,
  reason_code text not null,
  provider_event_public_id uuid,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint commerce_subscription_history_subscription_fk foreign key (subscription_id, planner_id)
    references app.commerce_subscriptions(id, planner_id) on delete cascade,
  constraint commerce_subscription_history_from_state check (
    from_state is null or from_state in ('previewing', 'active', 'cancel_at_period_end', 'grace', 'past_due', 'expired_read_only', 'refunded', 'revoked')
  ),
  constraint commerce_subscription_history_to_state check (
    to_state in ('previewing', 'active', 'cancel_at_period_end', 'grace', 'past_due', 'expired_read_only', 'refunded', 'revoked')
  ),
  constraint commerce_subscription_history_reason check (char_length(reason_code) between 1 and 80)
);

create table app.commerce_entitlement_grants (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  commerce_account_id bigint not null,
  capability_code text not null references app.commerce_capabilities(code),
  source_type text not null,
  subscription_id bigint,
  source_reference text not null,
  allowance integer,
  effective_at timestamptz not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint commerce_entitlement_grants_account_fk foreign key (commerce_account_id, planner_id)
    references app.commerce_accounts(id, planner_id) on delete cascade,
  constraint commerce_entitlement_grants_subscription_fk foreign key (subscription_id, planner_id)
    references app.commerce_subscriptions(id, planner_id) on delete cascade,
  constraint commerce_entitlement_grants_source check (
    source_type in ('subscription', 'manual_override', 'migration')
  ),
  constraint commerce_entitlement_grants_source_subscription check (
    (source_type = 'subscription' and subscription_id is not null)
    or (source_type <> 'subscription' and subscription_id is null)
  ),
  constraint commerce_entitlement_grants_reference check (char_length(source_reference) between 1 and 160),
  constraint commerce_entitlement_grants_allowance check (allowance is null or allowance >= 0),
  constraint commerce_entitlement_grants_window check (
    expires_at is null or expires_at > effective_at
  )
);

create index commerce_entitlement_grants_active_idx
  on app.commerce_entitlement_grants (commerce_account_id, capability_code, expires_at)
  where revoked_at is null;

create table app.commerce_orders (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  commerce_account_id bigint not null,
  operator_code text not null references app.commerce_operators(code),
  price_id bigint not null references app.commerce_prices(id),
  purchase_route_policy_code text not null,
  purchase_route_policy_version integer not null,
  provider_code text not null,
  provider_environment text not null,
  amount_minor bigint not null,
  currency_code text not null,
  billing_country_code text,
  transaction_storefront_country_code text,
  status text not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_orders_account_fk foreign key (commerce_account_id, planner_id)
    references app.commerce_accounts(id, planner_id) on delete cascade,
  constraint commerce_orders_route_policy_fk foreign key (
    purchase_route_policy_code, purchase_route_policy_version
  ) references app.commerce_purchase_route_policies(policy_code, version),
  constraint commerce_orders_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_orders_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_orders_amount check (amount_minor > 0),
  constraint commerce_orders_currency check (currency_code ~ '^[A-Z]{3}$'),
  constraint commerce_orders_billing_country check (
    billing_country_code is null or billing_country_code ~ '^[A-Z]{2}$'
  ),
  constraint commerce_orders_transaction_storefront check (
    transaction_storefront_country_code is null or transaction_storefront_country_code ~ '^[A-Z]{3}$'
  ),
  constraint commerce_orders_status check (
    status in ('created', 'pending', 'paid_pending_reconciliation', 'paid_reconciled', 'canceled', 'failed', 'refunded', 'disputed')
  ),
  constraint commerce_orders_id_planner_unique unique (id, planner_id)
);

create index commerce_orders_planner_created_idx
  on app.commerce_orders (planner_id, created_at desc, id desc);

create table app.commerce_payment_attempts (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  order_id bigint not null,
  provider_code text not null,
  provider_environment text not null,
  idempotency_key text not null,
  provider_payment_reference text,
  status text not null default 'created',
  amount_minor bigint not null,
  currency_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_payment_attempts_order_fk foreign key (order_id, planner_id)
    references app.commerce_orders(id, planner_id) on delete cascade,
  constraint commerce_payment_attempts_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_payment_attempts_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_payment_attempts_key check (char_length(idempotency_key) between 16 and 200),
  constraint commerce_payment_attempts_reference check (
    provider_payment_reference is null or char_length(provider_payment_reference) between 1 and 255
  ),
  constraint commerce_payment_attempts_status check (
    status in ('created', 'submitted', 'requires_action', 'succeeded_unreconciled', 'reconciled', 'failed', 'canceled')
  ),
  constraint commerce_payment_attempts_amount check (amount_minor > 0),
  constraint commerce_payment_attempts_currency check (currency_code ~ '^[A-Z]{3}$'),
  constraint commerce_payment_attempts_idempotency_unique unique (
    provider_code, provider_environment, idempotency_key
  ),
  constraint commerce_payment_attempts_provider_reference_unique unique (
    provider_code, provider_environment, provider_payment_reference
  ),
  constraint commerce_payment_attempts_id_planner_unique unique (id, planner_id)
);

create table app.commerce_provider_events (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  commerce_account_id bigint not null,
  provider_code text not null,
  provider_environment text not null,
  provider_event_reference text not null,
  event_type text not null,
  signature_verified boolean not null,
  payload_sha256 bytea not null,
  processing_status text not null default 'received',
  provider_occurred_at timestamptz,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint commerce_provider_events_account_fk foreign key (commerce_account_id, planner_id)
    references app.commerce_accounts(id, planner_id) on delete cascade,
  constraint commerce_provider_events_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_provider_events_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_provider_events_reference check (
    char_length(provider_event_reference) between 1 and 255
  ),
  constraint commerce_provider_events_type check (char_length(event_type) between 1 and 160),
  constraint commerce_provider_events_digest check (octet_length(payload_sha256) = 32),
  constraint commerce_provider_events_processing check (
    processing_status in ('received', 'ignored', 'applied', 'failed', 'needs_reconciliation')
  ),
  constraint commerce_provider_events_processed_time check (
    processed_at is null or processing_status <> 'received'
  ),
  constraint commerce_provider_events_reference_unique unique (
    provider_code, provider_environment, provider_event_reference
  )
);

create table app.commerce_settlements (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  order_id bigint not null,
  provider_code text not null,
  provider_environment text not null,
  provider_settlement_reference text not null,
  currency_code text not null,
  gross_minor bigint not null,
  tax_minor bigint not null default 0,
  provider_fee_minor bigint not null default 0,
  refund_minor bigint not null default 0,
  dispute_minor bigint not null default 0,
  settlement_net_minor bigint not null,
  settled_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  constraint commerce_settlements_order_fk foreign key (order_id, planner_id)
    references app.commerce_orders(id, planner_id) on delete cascade,
  constraint commerce_settlements_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_settlements_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_settlements_reference check (
    char_length(provider_settlement_reference) between 1 and 255
  ),
  constraint commerce_settlements_currency check (currency_code ~ '^[A-Z]{3}$'),
  constraint commerce_settlements_nonnegative check (
    gross_minor >= 0 and tax_minor >= 0 and provider_fee_minor >= 0
    and refund_minor >= 0 and dispute_minor >= 0
  ),
  constraint commerce_settlements_reconciliation check (
    settlement_net_minor = gross_minor - tax_minor - provider_fee_minor - refund_minor - dispute_minor
  ),
  constraint commerce_settlements_reference_unique unique (
    provider_code, provider_environment, provider_settlement_reference
  )
);

create table app.commerce_refunds (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  order_id bigint not null,
  payment_attempt_id bigint,
  provider_code text not null,
  provider_environment text not null,
  provider_refund_reference text not null,
  amount_minor bigint not null,
  currency_code text not null,
  status text not null,
  reason_code text not null,
  requested_at timestamptz not null,
  completed_at timestamptz,
  recorded_at timestamptz not null default now(),
  constraint commerce_refunds_order_fk foreign key (order_id, planner_id)
    references app.commerce_orders(id, planner_id) on delete cascade,
  constraint commerce_refunds_payment_attempt_fk foreign key (payment_attempt_id, planner_id)
    references app.commerce_payment_attempts(id, planner_id) on delete cascade,
  constraint commerce_refunds_provider check (
    provider_code in ('stripe', 'storekit', 'paddle', 'wechat', 'alipay', 'unionpay', 'local_web')
  ),
  constraint commerce_refunds_environment check (
    provider_environment in ('sandbox', 'test', 'production')
  ),
  constraint commerce_refunds_reference check (char_length(provider_refund_reference) between 1 and 255),
  constraint commerce_refunds_amount check (amount_minor > 0),
  constraint commerce_refunds_currency check (currency_code ~ '^[A-Z]{3}$'),
  constraint commerce_refunds_status check (status in ('requested', 'pending', 'succeeded', 'failed', 'canceled')),
  constraint commerce_refunds_reason check (char_length(reason_code) between 1 and 80),
  constraint commerce_refunds_completion check (
    completed_at is null or status in ('succeeded', 'failed', 'canceled')
  ),
  constraint commerce_refunds_reference_unique unique (
    provider_code, provider_environment, provider_refund_reference
  )
);

insert into app.commerce_operating_planes (code, data_region_code, status) values
  ('global', 'eu-central-1', 'configured_disabled'),
  ('mainland', 'cn-south-1', 'configured_disabled');

insert into app.commerce_operators (code, operating_plane_code, party_type, status) values
  ('global_operator_pending', 'global', 'individual', 'pending'),
  ('mainland_operator_pending', 'mainland', 'partner', 'pending');

insert into app.commerce_catalog_products (code, catalog_family, status) values
  ('rillora_consumer', 'consumer_subscription', 'active'),
  ('rillora_care_addon', 'human_service', 'dormant'),
  ('rillora_professional', 'professional', 'dormant');

insert into app.commerce_plan_versions (
  catalog_product_code, plan_code, version, status, effective_from
) values
  ('rillora_consumer', 'free', 1, 'active', '2026-08-19T00:00:00Z'),
  ('rillora_consumer', 'family', 1, 'planned', null),
  ('rillora_consumer', 'personal', 1, 'dormant', null),
  ('rillora_care_addon', 'care_addon', 1, 'dormant', null),
  ('rillora_professional', 'professional', 1, 'dormant', null);

insert into app.commerce_capabilities (code, status, baseline_trust_control) values
  ('matter_map_core', 'active', true),
  ('desired_outcomes_basic', 'active', true),
  ('trusted_person_basic', 'active', true),
  ('rehearsal_basic', 'active', true),
  ('official_setup_guides', 'active', true),
  ('start_here_export', 'active', true),
  ('security_controls', 'active', true),
  ('data_export', 'active', true),
  ('account_deletion', 'active', true),
  ('recipient_basic_access', 'active', true),
  ('household_coplanner', 'planned', false),
  ('trusted_people_multiple', 'planned', false),
  ('role_packages_advanced', 'planned', false),
  ('rehearsal_advanced', 'planned', false),
  ('adaptive_reviews', 'planned', false),
  ('version_history', 'planned', false),
  ('encrypted_attachments', 'planned', false),
  ('priority_product_support', 'planned', false);

insert into app.commerce_plan_capabilities (
  plan_version_id, capability_code, allowance, enforcement_mode
)
select pv.id, capability.code, capability.allowance, capability.enforcement_mode
from app.commerce_plan_versions pv
cross join (values
  ('matter_map_core', null::integer, 'included'),
  ('desired_outcomes_basic', null::integer, 'included'),
  ('trusted_person_basic', 1, 'included'),
  ('rehearsal_basic', null::integer, 'included'),
  ('official_setup_guides', null::integer, 'included'),
  ('start_here_export', null::integer, 'included'),
  ('security_controls', null::integer, 'included'),
  ('data_export', null::integer, 'included'),
  ('account_deletion', null::integer, 'included'),
  ('recipient_basic_access', null::integer, 'included')
) as capability(code, allowance, enforcement_mode)
where pv.plan_code = 'free' and pv.version = 1;

insert into app.commerce_plan_capabilities (
  plan_version_id, capability_code, allowance, enforcement_mode
)
select pv.id, capability.code, capability.allowance, capability.enforcement_mode
from app.commerce_plan_versions pv
cross join (values
  ('matter_map_core', null::integer, 'included'),
  ('desired_outcomes_basic', null::integer, 'included'),
  ('trusted_person_basic', null::integer, 'included'),
  ('rehearsal_basic', null::integer, 'included'),
  ('official_setup_guides', null::integer, 'included'),
  ('start_here_export', null::integer, 'included'),
  ('security_controls', null::integer, 'included'),
  ('data_export', null::integer, 'included'),
  ('account_deletion', null::integer, 'included'),
  ('recipient_basic_access', null::integer, 'included'),
  ('household_coplanner', 1, 'planned'),
  ('trusted_people_multiple', null::integer, 'planned'),
  ('role_packages_advanced', null::integer, 'planned'),
  ('rehearsal_advanced', null::integer, 'planned'),
  ('adaptive_reviews', null::integer, 'planned'),
  ('version_history', null::integer, 'planned'),
  ('encrypted_attachments', null::integer, 'planned'),
  ('priority_product_support', null::integer, 'planned')
) as capability(code, allowance, enforcement_mode)
where pv.plan_code = 'family' and pv.version = 1;

insert into app.commerce_prices (
  price_code, plan_version_id, operator_code, service_market_code,
  amount_minor, currency_code, billing_interval, tax_behavior, status
)
select price.code, pv.id, price.operator_code, price.market_code,
       price.amount_minor, price.currency_code, price.billing_interval,
       'not_configured', 'disabled_hypothesis'
from app.commerce_plan_versions pv
cross join (values
  ('family_usd_monthly_v1', 'global_operator_pending', 'GLOBAL_US', 999::bigint, 'USD', 'monthly'),
  ('family_usd_annual_v1', 'global_operator_pending', 'GLOBAL_US', 9900::bigint, 'USD', 'annual'),
  ('family_cny_monthly_v1', 'mainland_operator_pending', 'MAINLAND_CN', 6800::bigint, 'CNY', 'monthly'),
  ('family_cny_annual_v1', 'mainland_operator_pending', 'MAINLAND_CN', 69800::bigint, 'CNY', 'annual')
) as price(code, operator_code, market_code, amount_minor, currency_code, billing_interval)
where pv.plan_code = 'family' and pv.version = 1;

insert into app.commerce_market_policies (
  policy_code, version, service_market_code, operating_plane_code,
  operator_code, sales_enabled, status
) values
  ('global_us_market_v1', 1, 'GLOBAL_US', 'global', 'global_operator_pending', false, 'configured_disabled'),
  ('mainland_cn_market_v1', 1, 'MAINLAND_CN', 'mainland', 'mainland_operator_pending', false, 'configured_disabled');

insert into app.commerce_storefront_policies (
  policy_code, version, client_surface, apple_storefront_country_code,
  planned_route, external_offer_allowed, status
) values
  ('global_us_web_v1', 1, 'web', null, 'web_direct', true, 'configured_disabled'),
  ('global_us_ios_usa_v1', 1, 'ios', 'USA', 'stripe_web_external', true, 'configured_disabled'),
  ('mainland_cn_web_v1', 1, 'web', null, 'web_direct', false, 'configured_disabled'),
  ('mainland_cn_ios_chn_v1', 1, 'ios', 'CHN', 'apple_storekit', false, 'configured_disabled');

insert into app.commerce_purchase_route_policies (
  policy_code, version, market_policy_id, storefront_policy_id,
  purchase_route, provider_code, enabled, status
)
select route.policy_code, 1, market.id, storefront.id,
       route.purchase_route, route.provider_code, false, 'configured_disabled'
from (values
  ('global_us_web_stripe_v1', 'GLOBAL_US', 'global_us_web_v1', 'web_direct', 'stripe'),
  ('global_us_ios_stripe_v1', 'GLOBAL_US', 'global_us_ios_usa_v1', 'stripe_web_external', 'stripe'),
  ('mainland_cn_web_local_v1', 'MAINLAND_CN', 'mainland_cn_web_v1', 'web_direct', 'local_web'),
  ('mainland_cn_ios_storekit_v1', 'MAINLAND_CN', 'mainland_cn_ios_chn_v1', 'apple_storekit', 'storekit')
) as route(policy_code, market_code, storefront_code, purchase_route, provider_code)
join app.commerce_market_policies market
  on market.service_market_code = route.market_code and market.version = 1
join app.commerce_storefront_policies storefront
  on storefront.policy_code = route.storefront_code and storefront.version = 1;

alter table app.commerce_accounts enable row level security;
alter table app.commerce_accounts force row level security;
create policy commerce_accounts_tenant_isolation on app.commerce_accounts
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_subscriptions enable row level security;
alter table app.commerce_subscriptions force row level security;
create policy commerce_subscriptions_tenant_isolation on app.commerce_subscriptions
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_subscription_state_history enable row level security;
alter table app.commerce_subscription_state_history force row level security;
create policy commerce_subscription_history_tenant_isolation on app.commerce_subscription_state_history
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_entitlement_grants enable row level security;
alter table app.commerce_entitlement_grants force row level security;
create policy commerce_entitlement_grants_tenant_isolation on app.commerce_entitlement_grants
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_orders enable row level security;
alter table app.commerce_orders force row level security;
create policy commerce_orders_tenant_isolation on app.commerce_orders
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_payment_attempts enable row level security;
alter table app.commerce_payment_attempts force row level security;
create policy commerce_payment_attempts_tenant_isolation on app.commerce_payment_attempts
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_provider_events enable row level security;
alter table app.commerce_provider_events force row level security;
create policy commerce_provider_events_tenant_isolation on app.commerce_provider_events
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_settlements enable row level security;
alter table app.commerce_settlements force row level security;
create policy commerce_settlements_tenant_isolation on app.commerce_settlements
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

alter table app.commerce_refunds enable row level security;
alter table app.commerce_refunds force row level security;
create policy commerce_refunds_tenant_isolation on app.commerce_refunds
  using (planner_id = app.current_planner_id())
  with check (planner_id = app.current_planner_id());

grant select on
  app.commerce_operating_planes,
  app.commerce_operators,
  app.commerce_catalog_products,
  app.commerce_plan_versions,
  app.commerce_capabilities,
  app.commerce_plan_capabilities,
  app.commerce_prices,
  app.commerce_storefront_products,
  app.commerce_market_policies,
  app.commerce_storefront_policies,
  app.commerce_purchase_route_policies,
  app.commerce_accounts,
  app.commerce_subscriptions,
  app.commerce_subscription_state_history,
  app.commerce_entitlement_grants,
  app.commerce_orders,
  app.commerce_payment_attempts,
  app.commerce_provider_events,
  app.commerce_settlements,
  app.commerce_refunds
to continuity_app;
