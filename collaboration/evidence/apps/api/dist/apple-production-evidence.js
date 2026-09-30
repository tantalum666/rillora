import { createHash } from 'node:crypto';
import { z } from 'zod';
/** Minimal verified financial facts. Never persist a raw JWS or a provider credential. */
export const appleReceiptSchema = z.object({
    originalTransactionId: z.string().regex(/^[0-9]{1,40}$/),
    transactionId: z.string().regex(/^[0-9]{1,40}$/),
    productId: z.enum(['com.rillora.family.annual', 'com.rillora.family.monthly']),
    storefront: z.string().regex(/^[A-Z]{3}$/),
    currency: z.string().regex(/^[A-Z]{3}$/),
    priceMilliunits: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    purchasedAt: z.iso.datetime(), paidThrough: z.iso.datetime(), signedAt: z.iso.datetime(),
    proofSha256: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
}).strict().refine(value => value.paidThrough > value.purchasedAt, 'Invalid Apple paid period');
export function appleReceiptEvidence(transaction, signedTransaction) {
    return appleReceiptSchema.parse({
        originalTransactionId: transaction.originalTransactionId, transactionId: transaction.transactionId,
        productId: transaction.productId, storefront: transaction.storefront, currency: transaction.currency,
        priceMilliunits: transaction.price, purchasedAt: new Date(transaction.purchaseDate).toISOString(),
        paidThrough: new Date(transaction.expiresDate).toISOString(), signedAt: new Date(transaction.signedDate).toISOString(),
        proofSha256: createHash('sha256').update(signedTransaction).digest('base64url'),
    });
}
