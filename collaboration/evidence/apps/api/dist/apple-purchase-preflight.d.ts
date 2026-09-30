import { type DatabasePool } from './db.js';
import { type ApplePurchaseSelection } from './apple-purchase-catalog.js';
import { type ApplePurchaseQuote, type ApplePurchaseConsent } from './apple-purchase-consent.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
export declare class ApplePurchasePreflight {
    private readonly pool;
    readonly context: AppleExecutionContext;
    constructor(pool: DatabasePool, context?: AppleExecutionContext);
    current(plannerId: string): Promise<{
        purchase: {
            orderReference: string;
            nonce: string;
            state: string;
        } | null;
    }>;
    quote(plannerId: string, selection: ApplePurchaseSelection): Promise<{
        contractVersion: string;
        quote: {
            bindingCode: string;
            priceCode: string;
            productId: "com.rillora.family.annual";
            serviceMarketCode: string;
            storefrontCountryCode: string;
            currency: string;
            amountMinor: number;
            minorUnitExponent: number;
            priceMilliunits: number;
            billingPeriod: "annual";
        };
        purchaseTerms: Readonly<{
            version: "family-annual-apple-20260926-1";
            termsVersion: "terms-2026-08-27-1";
            subscriptionTermsVersion: "subscriptions-2026-08-27-1";
            refundPolicyVersion: "refunds-2026-08-27-1";
            legalBundleSha256: "3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602";
        }>;
        requiresFreshEvaluation: boolean;
        environment: "production" | "sandbox";
        validationOnly: boolean;
    }>;
    prepare(input: {
        plannerId: string;
        plannerPublicId: string;
        nonce: string;
        quote: ApplePurchaseQuote;
        consent: ApplePurchaseConsent;
    }): Promise<{
        environment: "production" | "sandbox";
        validationOnly: boolean;
        contractVersion: string;
        orderReference: string;
        appAccountToken: string;
        state: string;
        grantsAccess: boolean;
    }>;
    transition(input: {
        plannerId: string;
        orderReference: string;
        action: 'start' | 'pending' | 'cancel';
    }): Promise<{
        state: string;
        environment: "production" | "sandbox";
        validationOnly: boolean;
    }>;
    private executionMetadata;
}
