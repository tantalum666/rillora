alter table app.commerce_storefront_products
  add column provider_account_reference text,
  add column external_parent_product_reference text;

alter table app.commerce_storefront_products
  add constraint commerce_storefront_products_account_reference
  check (
    provider_account_reference is null
    or char_length(provider_account_reference) between 1 and 255
  ),
  add constraint commerce_storefront_products_parent_reference
  check (
    external_parent_product_reference is null
    or char_length(external_parent_product_reference) between 1 and 255
  );

comment on column app.commerce_storefront_products.external_product_reference is
  'Provider saleable-item reference. For Stripe this is the Price ID; for StoreKit it is the product ID.';

comment on column app.commerce_storefront_products.external_parent_product_reference is
  'Optional provider parent product reference. For Stripe this is the Product ID.';

comment on column app.commerce_storefront_products.provider_account_reference is
  'Provider account boundary used to prevent cross-project catalog reuse. This is not a credential.';

update app.commerce_prices
set status = 'test_only'
where price_code in ('family_usd_monthly_v1', 'family_usd_annual_v1')
  and status = 'disabled_hypothesis';

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
  'stripe',
  'test',
  null,
  binding.external_price_reference,
  'prod_V6O8lAFbTCDmKd',
  'acct_1U6B2RCxTlowhyiG',
  'test_only',
  '2026-08-19T00:00:00Z'
from app.commerce_prices price
join (values
  ('family_usd_monthly_v1', 'price_1U6BMoCxTlowhyiG7qsmBrdY'),
  ('family_usd_annual_v1', 'price_1U6BMnCxTlowhyiGJEC1w596')
) as binding(price_code, external_price_reference)
  on binding.price_code = price.price_code;

do $$
begin
  if (select count(*)
    from app.commerce_storefront_products
    where provider_code = 'stripe'
      and provider_environment = 'test'
      and provider_account_reference = 'acct_1U6B2RCxTlowhyiG'
      and external_parent_product_reference = 'prod_V6O8lAFbTCDmKd'
      and status = 'test_only') <> 2 then
    raise exception 'Rillora Stripe test catalog binding is incomplete';
  end if;
end
$$;
