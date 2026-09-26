import type { PoolClient } from 'pg';
import type { AppleReceiptEvidence } from './apple-production-evidence.js';
import { minorToAppleMilliunits } from './apple-price-catalog.js';

/** Rebind inside the commit transaction, including retired windows for restores. */
export async function resolveAppleReceiptPrice(client: PoolClient, receipt: AppleReceiptEvidence) {
  const rows = (await client.query<{
    id: string; plan_version_id: string; price_code: string; plan_version: number;
    binding_code: string; amount_minor: string; minor_unit_exponent: number;
  }>(`select p.id::text,p.plan_version_id::text,p.price_code,pv.version as plan_version,
        b.binding_code,p.amount_minor::text,p.minor_unit_exponent
      from app.commerce_apple_price_bindings b join app.commerce_prices p on p.id=b.price_id
      join app.commerce_plan_versions pv on pv.id=p.plan_version_id
      where p.purchase_channel='apple_app_store' and p.status in ('active','retired')
        and pv.plan_code='family' and b.status in ('active','retired')
        and b.product_reference=$1 and b.storefront_country_code=$2 and p.currency_code=$3
        and b.effective_from<=$4 and (b.effective_to is null or b.effective_to>$4)
      order by b.binding_code limit 501`, [receipt.productId, receipt.storefront, receipt.currency, receipt.purchasedAt])).rows;
  if (rows.length > 500) throw new Error('Apple receipt catalog is excessive');
  const matches = rows.filter(row => minorToAppleMilliunits(row.amount_minor, row.minor_unit_exponent) === receipt.priceMilliunits);
  if (matches.length !== 1) throw new Error('Apple receipt has no unique reviewed price');
  return matches[0]!;
}

export async function persistAppleReceipt(client: PoolClient, subscriptionId: string, receipt: AppleReceiptEvidence): Promise<void> {
  const price = await resolveAppleReceiptPrice(client, receipt);
  await client.query(`insert into app.commerce_apple_transaction_receipts(planner_id,subscription_id,binding_code,
      provider_environment,original_transaction_reference,transaction_reference,price_milliunits,
      currency_code,purchased_at,paid_through,signed_at,proof_sha256)
    values(app.current_planner_id(),$1,$2,'production',$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict(provider_environment,transaction_reference) do nothing`, [subscriptionId, price.binding_code,
    receipt.originalTransactionId, receipt.transactionId, receipt.priceMilliunits, receipt.currency,
    receipt.purchasedAt, receipt.paidThrough, receipt.signedAt, Buffer.from(receipt.proofSha256, 'base64url')]);
  // Apple can re-sign the same financial transaction after a refund or restore.
  // Keep its first proof, but never silently accept changed owner/amount/purchase facts.
  // expiresDate may legitimately change on a signed renewal extension. The current
  // status ledger owns that access deadline; it does not rewrite the first receipt.
  const match = (await client.query(`select 1 from app.commerce_apple_transaction_receipts
    where planner_id=app.current_planner_id() and subscription_id=$1 and binding_code=$2
      and provider_environment='production' and original_transaction_reference=$3
      and transaction_reference=$4 and price_milliunits=$5 and currency_code=$6
      and purchased_at=$7`, [subscriptionId, price.binding_code, receipt.originalTransactionId,
    receipt.transactionId, receipt.priceMilliunits, receipt.currency, receipt.purchasedAt])).rowCount;
  if (!match) throw new Error('Apple immutable receipt conflicts with verified financial facts');
}
