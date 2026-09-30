-- New commercial terms; historical test prices and provider bindings stay intact.
insert into app.commerce_prices (
  price_code, plan_version_id, operator_code, service_market_code,
  amount_minor, currency_code, billing_interval, tax_behavior, status
)
select price.code, pv.id, 'global_operator_pending', 'GLOBAL_US',
       price.amount_minor, 'USD', price.billing_interval,
       'not_configured', 'disabled_hypothesis'
from app.commerce_plan_versions pv
cross join (values
  ('family_usd_monthly_v2', 799::bigint, 'monthly'),
  ('family_usd_annual_v2', 6800::bigint, 'annual')
) as price(code, amount_minor, billing_interval)
where pv.plan_code = 'family' and pv.version = 2;
