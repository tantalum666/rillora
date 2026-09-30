import { createHash } from 'node:crypto';
import { z } from 'zod';
import { currentLegalContract } from './legal-contract.js';

export const applePurchaseTerms = Object.freeze({ version: 'family-annual-apple-20260926-1',
  termsVersion: currentLegalContract.termsVersion, subscriptionTermsVersion: 'subscriptions-2026-08-27-1',
  refundPolicyVersion: 'refunds-2026-08-27-1', legalBundleSha256: currentLegalContract.bundleSha256,
});
export const appleQuoteSchema = z.object({
  bindingCode: z.string().regex(/^[a-z][a-z0-9_]{1,79}$/), priceCode: z.string().min(1).max(120),
  productId: z.literal('com.rillora.family.annual'), serviceMarketCode: z.string().regex(/^[A-Z][A-Z0-9_]{1,39}$/),
  storefrontCountryCode: z.string().regex(/^[A-Z]{3}$/), currency: z.string().regex(/^[A-Z]{3}$/),
  amountMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), minorUnitExponent: z.number().int().min(0).max(3),
  priceMilliunits: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), billingPeriod: z.literal('annual'),
}).strict();
export type ApplePurchaseQuote = z.infer<typeof appleQuoteSchema>;
export const applePurchaseConsentSchema = z.object({
  version: z.literal(applePurchaseTerms.version), termsVersion: z.literal(applePurchaseTerms.termsVersion),
  subscriptionTermsVersion: z.literal(applePurchaseTerms.subscriptionTermsVersion),
  refundPolicyVersion: z.literal(applePurchaseTerms.refundPolicyVersion),
  legalBundleSha256: z.literal(applePurchaseTerms.legalBundleSha256),
  acceptedSubscriptionTerms: z.literal(true), acceptedAnnualRenewal: z.literal(true), acknowledgedCancellation: z.literal(true),
}).strict();
export type ApplePurchaseConsent = z.infer<typeof applePurchaseConsentSchema>;
export function applePurchaseConsentDigest(quote: ApplePurchaseQuote, consent: ApplePurchaseConsent): Buffer {
  return createHash('sha256').update(JSON.stringify({ quote: appleQuoteSchema.parse(quote),
    consent: applePurchaseConsentSchema.parse(consent) })).digest();
}
