import type { PoolClient } from 'pg';
import { ApiError } from './errors.js';
import { minorToAppleMilliunits } from './apple-price-catalog.js';
import { appleQuoteSchema, type ApplePurchaseQuote } from './apple-purchase-consent.js';
import { loadAppleReviewQuoteRows } from './apple-review-catalog.js';
import { appleProductionContext, assertAppleContext, requireAppleReviewEnrollment, type AppleExecutionContext } from './apple-execution-context.js';
import { assertFamilyPriceReady } from './commerce-purchase-conflicts.js';

export type ApplePurchaseSelection = Readonly<{ serviceMarketCode: string; storefrontCountryCode: string }>;
export async function loadApplePurchaseQuote(client: PoolClient, selection: ApplePurchaseSelection, context: AppleExecutionContext = appleProductionContext): Promise<{
  quote: ApplePurchaseQuote; priceId: string; operatorCode: string; routeCode: string; routeVersion: number;
}> {
  assertAppleContext(context);
  await requireAppleReviewEnrollment(client, context);
  const rows = context.validationOnly ? await loadAppleReviewQuoteRows(client,selection) : (await client.query<{ binding_code: string; price_id: string; price_code: string;
    amount_minor: string; minor_unit_exponent: number; currency_code: string; operator_code: string;
    route_code: string; route_version: number }>(`select b.binding_code,p.id::text as price_id,p.price_code,
      p.amount_minor::text,p.minor_unit_exponent,p.currency_code,p.operator_code,
      route.policy_code as route_code,route.version as route_version
    from app.commerce_apple_price_bindings b join app.commerce_prices p on p.id=b.price_id
    join app.commerce_plan_versions pv on pv.id=p.plan_version_id
    join app.commerce_operators operator on operator.code=p.operator_code
    join app.commerce_operating_planes plane on plane.code=operator.operating_plane_code
    join app.commerce_market_policies market on market.operator_code=operator.code and market.service_market_code=p.service_market_code
    join app.commerce_purchase_route_policies route on route.market_policy_id=market.id
    join app.commerce_storefront_policies storefront on storefront.id=route.storefront_policy_id
    where p.service_market_code=$1 and b.storefront_country_code=$2
      and b.provider_environment='production' and p.purchase_channel='apple_app_store' and p.billing_interval='annual'
      and b.product_reference='com.rillora.family.annual' and b.status='active' and p.status='active'
      and pv.plan_code='family' and pv.status='active' and p.tax_behavior<>'not_configured'
      and plane.code='global' and plane.status='active' and operator.status='active'
      and (operator.effective_from is null or operator.effective_from<=now())
      and (operator.effective_to is null or operator.effective_to>now())
      and market.sales_enabled and market.status='active' and route.enabled and route.status='active'
      and route.provider_code='storekit' and route.purchase_route='apple_storekit'
      and storefront.client_surface='ios' and storefront.apple_storefront_country_code=$2
      and storefront.status='active' and storefront.planned_route='apple_storekit'
      and b.effective_from<=now() and (b.effective_to is null or b.effective_to>now())
      and (p.effective_from is null or p.effective_from<=now()) and (p.effective_to is null or p.effective_to>now())
      and (route.effective_from is null or route.effective_from<=now()) and (route.effective_to is null or route.effective_to>now())
      and (market.effective_from is null or market.effective_from<=now()) and (market.effective_to is null or market.effective_to>now())
      and (storefront.effective_from is null or storefront.effective_from<=now()) and (storefront.effective_to is null or storefront.effective_to>now())
      and (select production_entitlements_enabled from app.commerce_runtime_policy where singleton)
      and exists(select 1 from app.commerce_storefront_products product where product.provider_code='storekit'
        and product.provider_environment='production' and product.status='active'
        and product.provider_account_reference='com.rillora.ios' and product.external_parent_product_reference='22325627'
        and product.external_product_reference=b.product_reference
        and (product.storefront_country_code is null or product.storefront_country_code=$2)
        and (product.effective_from is null or product.effective_from<=now()) and (product.effective_to is null or product.effective_to>now()))
    limit 2`, [selection.serviceMarketCode, selection.storefrontCountryCode])).rows;
  if (rows.length !== 1) throw new ApiError(409, 'apple_purchase_unavailable', 'Apple subscriptions are not available for this selection.');
  const row = rows[0]!;
  await assertFamilyPriceReady(client,row.price_id);
  return { priceId: row.price_id, operatorCode: row.operator_code, routeCode: row.route_code, routeVersion: row.route_version,
    quote: appleQuoteSchema.parse({ ...selection, bindingCode: row.binding_code, priceCode: row.price_code,
      productId: 'com.rillora.family.annual', currency: row.currency_code, amountMinor: Number(row.amount_minor),
      minorUnitExponent: row.minor_unit_exponent, priceMilliunits: minorToAppleMilliunits(row.amount_minor,row.minor_unit_exponent),
      billingPeriod: 'annual' }) };
}
