import type { JWSTransactionDecodedPayload } from '@apple/app-store-server-library';
import { z } from 'zod';
import type { NormalizedProviderSignal } from './commerce-provider-contract.js';
/** Minimal verified financial facts. Never persist a raw JWS or a provider credential. */
export declare const appleReceiptSchema: z.ZodObject<{
    originalTransactionId: z.ZodString;
    transactionId: z.ZodString;
    productId: z.ZodEnum<{
        "com.rillora.family.annual": "com.rillora.family.annual";
        "com.rillora.family.monthly": "com.rillora.family.monthly";
    }>;
    storefront: z.ZodString;
    currency: z.ZodString;
    priceMilliunits: z.ZodNumber;
    purchasedAt: z.ZodISODateTime;
    paidThrough: z.ZodISODateTime;
    signedAt: z.ZodISODateTime;
    proofSha256: z.ZodString;
}, z.core.$strict>;
export type AppleReceiptEvidence = z.infer<typeof appleReceiptSchema>;
export type AppleProductionSignal = NormalizedProviderSignal & Readonly<{
    receipt: AppleReceiptEvidence | null;
}>;
export declare function appleReceiptEvidence(transaction: JWSTransactionDecodedPayload, signedTransaction: string): AppleReceiptEvidence;
