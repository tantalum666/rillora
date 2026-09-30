export { stripeSubscriptionState } from "./stripe-provider-shared.js";
import type { StripeTestConfig } from "./config.js";
import type { AuthoritativeSubscriptionSnapshot, NormalizedProviderSignal } from "./commerce-provider-contract.js";
export type StripeBillingPeriod = "monthly" | "annual";
export type { StripeSdkPort, StripeCheckoutResult, StripePortalResult, StripeFinancialSignalResolution } from "./stripe-sdk.js";
import { type StripeSdkPort, type StripeCheckoutResult, type StripePortalResult, type StripeFinancialSignalResolution } from "./stripe-sdk.js";
export declare function createOfficialStripeSdkPort(apiKey: string): StripeSdkPort;
/**
 * Official Stripe SDK boundary for Rillora's disabled test commerce plane.
 *
 * The adapter is intentionally test-only. It binds provider operations to
 * account-specific server-owned Product, Price, Customer and Subscription
 * references, and never treats Checkout or a webhook delivery as entitlement
 * evidence.
 */
export declare class StripeTestAdapter {
    private readonly config;
    private readonly stripe;
    private readonly now;
    constructor(config: StripeTestConfig, stripe?: StripeSdkPort, now?: () => Date);
    verifyWebhook(rawBody: Buffer, signatureHeader: string): NormalizedProviderSignal;
    resolveFinancialSignal(signal: Pick<NormalizedProviderSignal, "signalType" | "providerTransactionReference" | "providerRefundReference">): Promise<StripeFinancialSignalResolution>;
    assertCheckoutReady(billingPeriod: StripeBillingPeriod): Promise<void>;
    createHostedSubscriptionCheckout(input: {
        commerceAccountReference: string;
        billingPeriod: StripeBillingPeriod;
        idempotencyKey: string;
        existingStripeCustomerReference?: string;
        orderReference?: string;
        paymentAttemptReference?: string;
    }): Promise<StripeCheckoutResult>;
    createCustomerPortal(input: {
        stripeCustomerReference: string;
    }): Promise<StripePortalResult>;
    retrieveAuthoritativeSubscription(input: {
        providerSubscriptionReference: string;
        expectedCommerceAccountReference: string;
        expectedStripeCustomerReference: string;
    }): Promise<AuthoritativeSubscriptionSnapshot>;
    retrieveHostedCheckout(id: string, account: string): Promise<StripeCheckoutResult>;
    expireHostedCheckout(id: string, account: string): Promise<void>;
}
export declare function stripeFamilyPriceCode(config: Pick<StripeTestConfig, "familyPlanVersion" | "familyPriceVersion">, period: StripeBillingPeriod): string;
export declare function stripeSnapshotPriceId(config: StripeTestConfig, priceCode: string): string | null;
