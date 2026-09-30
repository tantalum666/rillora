-- Created/read back in the isolated Rillora TEST account. No live sales enabled.
insert into app.commerce_storefront_products (
  price_id, provider_code, provider_environment, external_product_reference,
  external_parent_product_reference, provider_account_reference, status, effective_from
)
select price.id, 'stripe', 'test', 'price_1UJe38CxTlowhyiGdx5ypIKJ',
       'prod_V6O8lAFbTCDmKd', 'acct_1U6B2RCxTlowhyiG', 'test_only', now()
from app.commerce_prices price where price.price_code='family_usd_annual_v4';
