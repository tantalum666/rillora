import { createHash } from 'node:crypto';
import { z } from 'zod';
import { currentLegalContract } from './legal-contract.js';
export const purchaseConsentContract = Object.freeze({
    version: 'family-annual-web-20260926-1', provider: 'stripe', priceCode: 'family_usd_annual_v4',
    amountMinor: 8899, currency: 'USD', billingPeriod: 'annual',
    termsVersion: currentLegalContract.termsVersion,
    subscriptionTermsVersion: 'subscriptions-2026-08-27-1', refundPolicyVersion: 'refunds-2026-08-27-1',
    legalBundleSha256: currentLegalContract.bundleSha256,
});
export const purchaseConsentSchema = z.object({
    version: z.literal(purchaseConsentContract.version), provider: z.literal('stripe'),
    priceCode: z.literal(purchaseConsentContract.priceCode), amountMinor: z.literal(purchaseConsentContract.amountMinor),
    currency: z.literal('USD'), billingPeriod: z.literal('annual'), termsVersion: z.literal(purchaseConsentContract.termsVersion),
    subscriptionTermsVersion: z.literal(purchaseConsentContract.subscriptionTermsVersion),
    refundPolicyVersion: z.literal(purchaseConsentContract.refundPolicyVersion),
    legalBundleSha256: z.literal(purchaseConsentContract.legalBundleSha256),
    acceptedSubscriptionTerms: z.literal(true), acceptedAnnualRenewal: z.literal(true), acknowledgedCancellation: z.literal(true),
}).strict();
export function parsePurchaseConsent(value) { return purchaseConsentSchema.parse(value); }
export function purchaseConsentDigest(proof) {
    // Use a stable field order; browser JSON order does not affect replay checks.
    return createHash('sha256').update(JSON.stringify(purchaseConsentSchema.parse(proof))).digest();
}
