import { ApplePriceBindings } from './apple-price-bindings.js';
import { withCommerceInboxDatabase } from './db.js';
import { appleProductionContext, assertAppleContext } from './apple-execution-context.js';
/** Catalog reads use public price metadata, never a provider secret or client-selected amount. */
export async function loadAppleProductionPriceBindings(pool, context = appleProductionContext) {
    assertAppleContext(context);
    const rows = await withCommerceInboxDatabase(pool, async (client) => (await client.query(`select b.binding_code,b.product_reference,b.storefront_country_code,p.currency_code,
      p.amount_minor::text,p.minor_unit_exponent,p.price_code,pv.version as plan_version,
      b.effective_from,b.effective_to
    from app.commerce_apple_price_bindings b join app.commerce_prices p on p.id=b.price_id
    join app.commerce_plan_versions pv on pv.id=p.plan_version_id
    where p.purchase_channel='apple_app_store' and p.status=any($2::text[]) and b.provider_environment=$1
      and pv.plan_code='family' and b.status in ('active','retired')
    order by b.binding_code limit 501`, [context.environment,
        context.validationOnly ? ['test_only', 'retired'] : ['active', 'retired']])).rows);
    const bindings = rows.map(row => ({
        id: row.binding_code,
        productId: row.product_reference,
        storefrontCountryCode: row.storefront_country_code,
        currency: row.currency_code,
        priceMilliunits: minorToAppleMilliunits(row.amount_minor, row.minor_unit_exponent),
        priceCode: row.price_code, planVersion: row.plan_version,
        effectiveFrom: row.effective_from.toISOString(), effectiveUntil: row.effective_to?.toISOString() ?? null,
    }));
    return new ApplePriceBindings(bindings);
}
export function minorToAppleMilliunits(amountMinor, exponent) {
    if (!/^[1-9][0-9]{0,15}$/.test(amountMinor) || !Number.isInteger(exponent) || exponent < 0 || exponent > 3) {
        throw new Error('Apple price requires a positive supported integer currency amount');
    }
    const amount = BigInt(amountMinor) * (10n ** BigInt(3 - exponent));
    if (amount > BigInt(Number.MAX_SAFE_INTEGER))
        throw new Error('Apple price exceeds the supported integer amount');
    return Number(amount);
}
