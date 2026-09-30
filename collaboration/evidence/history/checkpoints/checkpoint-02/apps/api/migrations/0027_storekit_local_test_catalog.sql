insert into app.commerce_storefront_products (
  price_id,
  provider_code,
  provider_environment,
  storefront_country_code,
  external_product_reference,
  external_parent_product_reference,
  provider_account_reference,
  status,
  effective_from
)
select
  price.id,
  'storekit',
  'test',
  'USA',
  binding.external_product_reference,
  'D7BCE9A1',
  'com.rillora.ios',
  'test_only',
  '2026-08-20T00:00:00Z'
from app.commerce_prices price
join (values
  ('family_usd_monthly_v1', 'com.rillora.family.monthly'),
  ('family_usd_annual_v1', 'com.rillora.family.annual')
) as binding(price_code, external_product_reference)
  on binding.price_code = price.price_code;

do $$
begin
  if (select count(*)
    from app.commerce_storefront_products
    where provider_code = 'storekit'
      and provider_environment = 'test'
      and storefront_country_code = 'USA'
      and provider_account_reference = 'com.rillora.ios'
      and external_parent_product_reference = 'D7BCE9A1'
      and status = 'test_only') <> 2 then
    raise exception 'Rillora local StoreKit test catalog binding is incomplete';
  end if;
end
$$;
