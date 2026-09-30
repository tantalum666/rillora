alter table app.commerce_prices
  add constraint commerce_prices_id_plan_unique
  unique (id, plan_version_id);

alter table app.commerce_prices
  add constraint commerce_prices_id_amount_currency_unique
  unique (id, amount_minor, currency_code);

alter table app.commerce_subscriptions
  add constraint commerce_subscriptions_price_plan_fk
  foreign key (price_id, plan_version_id)
  references app.commerce_prices(id, plan_version_id);

alter table app.commerce_subscriptions
  add constraint commerce_subscriptions_id_account_unique
  unique (id, planner_id, commerce_account_id);

alter table app.commerce_entitlement_grants
  add constraint commerce_entitlement_grants_subscription_account_fk
  foreign key (subscription_id, planner_id, commerce_account_id)
  references app.commerce_subscriptions(id, planner_id, commerce_account_id)
  on delete cascade;

alter table app.commerce_orders
  add constraint commerce_orders_price_snapshot_fk
  foreign key (price_id, amount_minor, currency_code)
  references app.commerce_prices(id, amount_minor, currency_code);

alter table app.commerce_orders
  add constraint commerce_orders_transaction_tuple_unique
  unique (
    id,
    planner_id,
    provider_code,
    provider_environment,
    amount_minor,
    currency_code
  );

alter table app.commerce_orders
  add constraint commerce_orders_provider_tuple_unique
  unique (
    id,
    planner_id,
    provider_code,
    provider_environment,
    currency_code
  );

alter table app.commerce_payment_attempts
  add constraint commerce_payment_attempts_order_snapshot_fk
  foreign key (
    order_id,
    planner_id,
    provider_code,
    provider_environment,
    amount_minor,
    currency_code
  ) references app.commerce_orders(
    id,
    planner_id,
    provider_code,
    provider_environment,
    amount_minor,
    currency_code
  ) on delete cascade;

alter table app.commerce_payment_attempts
  add constraint commerce_payment_attempts_id_order_unique
  unique (id, planner_id, order_id);

alter table app.commerce_settlements
  add constraint commerce_settlements_order_provider_fk
  foreign key (
    order_id,
    planner_id,
    provider_code,
    provider_environment,
    currency_code
  ) references app.commerce_orders(
    id,
    planner_id,
    provider_code,
    provider_environment,
    currency_code
  ) on delete cascade;

alter table app.commerce_refunds
  add constraint commerce_refunds_order_provider_fk
  foreign key (
    order_id,
    planner_id,
    provider_code,
    provider_environment,
    currency_code
  ) references app.commerce_orders(
    id,
    planner_id,
    provider_code,
    provider_environment,
    currency_code
  ) on delete cascade;

alter table app.commerce_refunds
  add constraint commerce_refunds_attempt_order_fk
  foreign key (payment_attempt_id, planner_id, order_id)
  references app.commerce_payment_attempts(id, planner_id, order_id)
  on delete cascade;
