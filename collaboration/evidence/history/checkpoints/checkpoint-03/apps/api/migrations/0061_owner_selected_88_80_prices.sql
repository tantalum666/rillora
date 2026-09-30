-- Owner selected US$88.80/year and US$9.99/month on September19.
-- Price version3 retains Family capability version2. Do not rewrite prices,
-- provider bindings, receipts or subscriptions from previous test offers.
insert into app.commerce_prices (
  price_code, plan_version_id, operator_code, service_market_code,
  amount_minor, currency_code, billing_interval, tax_behavior, status
)
select quote.code, plan.id, 'global_operator_pending', 'GLOBAL_US',
       quote.amount_minor, 'USD', quote.billing_interval,
       'not_configured', 'disabled_hypothesis'
from app.commerce_plan_versions plan
cross join (values
  ('family_usd_monthly_v3', 999::bigint, 'monthly'),
  ('family_usd_annual_v3', 8880::bigint, 'annual')
) as quote(code, amount_minor, billing_interval)
where plan.plan_code = 'family' and plan.version = 2;
