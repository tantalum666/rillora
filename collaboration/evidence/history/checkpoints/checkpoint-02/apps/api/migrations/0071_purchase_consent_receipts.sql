-- Separate express purchase action from account-registration acceptance.
-- This migration does not enable any market, provider, plan or entitlement.
create table app.commerce_purchase_consents (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  planner_id bigint not null references app.planners(id) on delete cascade,
  order_id bigint not null references app.commerce_orders(id) on delete cascade,
  consent_version text not null,
  terms_version text not null,
  subscription_terms_version text not null,
  refund_policy_version text not null,
  legal_bundle_sha256 bytea not null check (octet_length(legal_bundle_sha256)=32),
  acceptance_sha256 bytea not null check (octet_length(acceptance_sha256)=32),
  price_code text not null,
  amount_minor bigint not null check (amount_minor > 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  billing_interval text not null check (billing_interval='annual'),
  accepted_at timestamptz not null default now(),
  constraint commerce_purchase_consent_order unique (order_id)
);
alter table app.commerce_purchase_consents enable row level security;
alter table app.commerce_purchase_consents force row level security;
create policy commerce_purchase_consents_owner on app.commerce_purchase_consents
  using (planner_id=app.current_planner_id()) with check (
    planner_id=app.current_planner_id() and exists (
      select 1 from app.commerce_orders o where o.id=order_id and o.planner_id=app.current_planner_id()
        and o.provider_code='stripe' and o.provider_environment='production'
    )
  );
grant select, insert on app.commerce_purchase_consents to continuity_commerce;
grant usage, select on sequence app.commerce_purchase_consents_id_seq to continuity_commerce;
grant select on app.commerce_operating_planes, app.commerce_operators,
  app.commerce_market_policies, app.commerce_storefront_policies,
  app.commerce_purchase_route_policies to continuity_commerce;
