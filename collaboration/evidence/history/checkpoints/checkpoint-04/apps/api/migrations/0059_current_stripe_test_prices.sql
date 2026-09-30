-- Created and read back in the Rillora TEST dashboard on September16.
-- Retain the legacy99/9.99 Prices and their historical subscriptions unchanged.
insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,
  external_product_reference,external_parent_product_reference,provider_account_reference,status,effective_from)
select p.id,'stripe','test',b.external_id,'prod_V6O8lAFbTCDmKd','acct_1U6B2RCxTlowhyiG','test_only',now()
from app.commerce_prices p join (values
 ('family_usd_annual_v2','price_1UGKXlCxTlowhyiGVLKAkfl1'),
 ('family_usd_monthly_v2','price_1UGKadCxTlowhyiGJ0bnY9Kn')
) b(code,external_id) on b.code=p.price_code;
-- Price status stays disabled_hypothesis. No market/route/live grant opens.
