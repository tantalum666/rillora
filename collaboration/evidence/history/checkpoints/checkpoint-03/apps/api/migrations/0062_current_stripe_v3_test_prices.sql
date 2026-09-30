-- Exact prices created/read back in the isolated Rillora TEST account.
-- They are not live products and do not open a market, route or real sale.
insert into app.commerce_storefront_products (
  price_id, provider_code, provider_environment, external_product_reference,
  external_parent_product_reference, provider_account_reference, status, effective_from
)
select price.id, 'stripe', 'test', binding.external_id,
       'prod_V6O8lAFbTCDmKd', 'acct_1U6B2RCxTlowhyiG', 'test_only', now()
from app.commerce_prices price
join (values
  ('family_usd_annual_v3', 'price_1UHMkTCxTlowhyiGu3do5wps'),
  ('family_usd_monthly_v3', 'price_1UHMlhCxTlowhyiGvBEPdb4x')
) binding(code, external_id) on binding.code = price.price_code;
