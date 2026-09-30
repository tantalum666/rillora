/** Review offers require their own explicitly enabled test route and Sandbox SKU.
 * They never activate an operating entity, market or production sales policy.
 * The versioned Apple binding owns the quote amount. A retained SKU's historical
 * price_id must not be rewritten when the same Apple product is repriced. */
export async function loadAppleReviewQuoteRows(client, selection) {
    return (await client.query(`select b.binding_code,p.id::text as price_id,p.price_code,
      p.amount_minor::text,p.minor_unit_exponent,p.currency_code,p.operator_code,
      route.policy_code as route_code,route.version as route_version
    from app.commerce_apple_price_bindings b join app.commerce_prices p on p.id=b.price_id
    join app.commerce_plan_versions pv on pv.id=p.plan_version_id
    join app.commerce_operators operator on operator.code=p.operator_code
    join app.commerce_market_policies market on market.operator_code=operator.code and market.service_market_code=p.service_market_code
    join app.commerce_purchase_route_policies route on route.market_policy_id=market.id
    join app.commerce_storefront_policies storefront on storefront.id=route.storefront_policy_id
    where p.service_market_code=$1 and b.storefront_country_code=$2 and operator.operating_plane_code='global'
      and b.provider_environment='sandbox' and b.status='active' and p.status='test_only'
      and p.purchase_channel='apple_app_store' and p.billing_interval='annual'
      and b.product_reference='com.rillora.family.annual' and pv.plan_code='family' and pv.status='active'
      and route.status='test_only' and route.enabled and route.provider_code='storekit' and route.purchase_route='apple_storekit'
      and storefront.client_surface='ios' and storefront.apple_storefront_country_code=$2
      and b.effective_from<=now() and (b.effective_to is null or b.effective_to>now())
      and (p.effective_from is null or p.effective_from<=now()) and (p.effective_to is null or p.effective_to>now())
      and (route.effective_from is null or route.effective_from<=now()) and (route.effective_to is null or route.effective_to>now())
      and exists(select 1 from app.commerce_storefront_products product where product.provider_code='storekit'
        and product.provider_environment='sandbox' and product.status='test_only'
        and product.provider_account_reference='com.rillora.ios' and product.external_parent_product_reference='22325627'
        and product.external_product_reference=b.product_reference
        and (product.storefront_country_code is null or product.storefront_country_code=$2)
        and (product.effective_from is null or product.effective_from<=now()) and (product.effective_to is null or product.effective_to>now()))
    limit 2`, [selection.serviceMarketCode, selection.storefrontCountryCode])).rows;
}
