-- Owner selected annual-only new purchases on September21.
-- Preserve price amounts, provider bindings, subscriptions and historical receipts.
-- Retired prices remain valid identifiers for reconciliation and restoration.
update app.commerce_prices price
set status = 'retired'
from app.commerce_plan_versions plan
where plan.id = price.plan_version_id
  and plan.plan_code = 'family'
  and price.billing_interval = 'monthly'
  and price.status <> 'retired';
