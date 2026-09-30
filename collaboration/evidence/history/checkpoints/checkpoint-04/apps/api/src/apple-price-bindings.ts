import type { JWSTransactionDecodedPayload } from '@apple/app-store-server-library';
import { z } from 'zod';
import { rilloraAppleIdentity } from './apple-production-verification.js';

const binding = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]{1,79}$/),
  productId: z.enum([rilloraAppleIdentity.annualProductId, rilloraAppleIdentity.historicalMonthlyProductId]),
  storefrontCountryCode: z.string().regex(/^[A-Z]{3}$/), currency: z.string().regex(/^[A-Z]{3}$/),
  priceMilliunits: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  priceCode: z.string().regex(/^family_[a-z0-9_]{1,70}$/), planVersion: z.number().int().positive(),
  // Dates describe signed transaction purchase dates, not wall-clock receipt time.
  effectiveFrom: z.iso.datetime(), effectiveUntil: z.iso.datetime().nullable(),
}).strict().refine(value => value.effectiveUntil === null || Date.parse(value.effectiveUntil) > Date.parse(value.effectiveFrom));
export type ApplePriceBinding = z.infer<typeof binding>;

export class ApplePriceBindings {
  private readonly rows: readonly ApplePriceBinding[];
  constructor(input: unknown) {
    this.rows = z.array(binding).min(1).max(500).parse(input);
    if (new Set(this.rows.map(row => row.id)).size !== this.rows.length) throw new Error('Apple price binding identifiers must be unique');
    for (let i = 0; i < this.rows.length; i += 1) for (let j = i + 1; j < this.rows.length; j += 1) {
      const a = this.rows[i]!, b = this.rows[j]!;
      if (a.productId !== b.productId || a.storefrontCountryCode !== b.storefrontCountryCode
        || a.currency !== b.currency || a.priceMilliunits !== b.priceMilliunits) continue;
      if (Date.parse(a.effectiveFrom) < end(b) && Date.parse(b.effectiveFrom) < end(a)) throw new Error('Apple price binding windows overlap');
    }
  }
  resolve(transaction: JWSTransactionDecodedPayload): ApplePriceBinding {
    if (!Number.isSafeInteger(transaction.purchaseDate) || !Number.isSafeInteger(transaction.price)) throw new Error('Signed Apple purchase date and amount are required');
    const rows = this.rows.filter(row => row.productId === transaction.productId
      && row.storefrontCountryCode === transaction.storefront && row.currency === transaction.currency
      && row.priceMilliunits === transaction.price && transaction.purchaseDate! >= Date.parse(row.effectiveFrom)
      && transaction.purchaseDate! < end(row));
    if (rows.length !== 1) throw new Error('Signed Apple transaction has no unambiguous versioned price binding');
    return Object.freeze({ ...rows[0]! });
  }
}
function end(row: ApplePriceBinding): number { return row.effectiveUntil === null ? Infinity : Date.parse(row.effectiveUntil); }
