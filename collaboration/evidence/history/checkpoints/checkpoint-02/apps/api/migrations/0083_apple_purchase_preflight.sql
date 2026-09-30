-- A short quote reservation becomes durable once the native payment sheet may
-- have opened. Never time out a submitted/Ask-to-Buy payment as if it were canceled.
create table app.commerce_apple_purchase_sessions (
  order_id bigint primary key,
  planner_id bigint not null references app.planners(id) on delete cascade,
  client_nonce uuid not null,
  binding_code text not null references app.commerce_apple_price_bindings(binding_code),
  storefront_country_code text not null check(storefront_country_code ~ '^[A-Z]{3}$'),
  state text not null check(state in ('prepared','started','pending','completed','closed')),
  prepared_until timestamptz not null default(now()+interval '15 minutes'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(planner_id,client_nonce),
  foreign key(order_id,planner_id) references app.commerce_orders(id,planner_id) on delete cascade
);
alter table app.commerce_apple_purchase_sessions enable row level security;
alter table app.commerce_apple_purchase_sessions force row level security;
create policy apple_purchase_session_owner on app.commerce_apple_purchase_sessions to continuity_commerce
  using(planner_id=app.current_planner_id()) with check(planner_id=app.current_planner_id());
revoke all on app.commerce_apple_purchase_sessions from public;
grant select,insert,update on app.commerce_apple_purchase_sessions to continuity_commerce;
-- This is public catalog metadata, like commerce_prices; no receipt or owner data.
grant select on app.commerce_apple_price_bindings to continuity_app;

drop policy commerce_purchase_consents_owner on app.commerce_purchase_consents;
create policy commerce_purchase_consents_owner on app.commerce_purchase_consents
  using(planner_id=app.current_planner_id()) with check (
    planner_id=app.current_planner_id() and exists (
      select 1 from app.commerce_orders o where o.id=order_id and o.planner_id=app.current_planner_id()
        and o.provider_code in ('stripe','storekit') and o.provider_environment='production'
    )
  );
