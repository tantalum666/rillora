-- Owner selected Web USD88.99/year on September26. Apple remains a separate
-- channel-price decision. Preserve original amounts, receipts and subscriptions.
insert into app.commerce_prices (
  price_code, plan_version_id, operator_code, service_market_code,
  amount_minor, currency_code, billing_interval, tax_behavior, status
)
select 'family_usd_annual_v4', plan.id, 'global_operator_pending', 'GLOBAL_US',
       8899, 'USD', 'annual', 'not_configured', 'disabled_hypothesis'
from app.commerce_plan_versions plan where plan.plan_code='family' and plan.version=2;

-- Stop offering the replaced annual quote; historical reconciliation still reads it.
update app.commerce_prices set status='retired' where price_code='family_usd_annual_v3';
