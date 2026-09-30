import { z } from 'zod';
export declare const applePurchaseTerms: Readonly<{
    version: "family-annual-apple-20260926-1";
    termsVersion: "terms-2026-08-27-1";
    subscriptionTermsVersion: "subscriptions-2026-08-27-1";
    refundPolicyVersion: "refunds-2026-08-27-1";
    legalBundleSha256: "3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602";
}>;
export declare const appleQuoteSchema: z.ZodObject<{
    bindingCode: z.ZodString;
    priceCode: z.ZodString;
    productId: z.ZodLiteral<"com.rillora.family.annual">;
    serviceMarketCode: z.ZodString;
    storefrontCountryCode: z.ZodString;
    currency: z.ZodString;
    amountMinor: z.ZodNumber;
    minorUnitExponent: z.ZodNumber;
    priceMilliunits: z.ZodNumber;
    billingPeriod: z.ZodLiteral<"annual">;
}, z.core.$strict>;
export type ApplePurchaseQuote = z.infer<typeof appleQuoteSchema>;
export declare const applePurchaseConsentSchema: z.ZodObject<{
    version: z.ZodLiteral<"family-annual-apple-20260926-1">;
    termsVersion: z.ZodLiteral<"terms-2026-08-27-1">;
    subscriptionTermsVersion: z.ZodLiteral<"subscriptions-2026-08-27-1">;
    refundPolicyVersion: z.ZodLiteral<"refunds-2026-08-27-1">;
    legalBundleSha256: z.ZodLiteral<"3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602">;
    acceptedSubscriptionTerms: z.ZodLiteral<true>;
    acceptedAnnualRenewal: z.ZodLiteral<true>;
    acknowledgedCancellation: z.ZodLiteral<true>;
}, z.core.$strict>;
export type ApplePurchaseConsent = z.infer<typeof applePurchaseConsentSchema>;
export declare function applePurchaseConsentDigest(quote: ApplePurchaseQuote, consent: ApplePurchaseConsent): Buffer;
