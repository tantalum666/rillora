import { type StripeExecutionConfig } from "./stripe-execution-config.js";
import { type PurchaseConsent } from "./purchase-consent.js";
import type { AuthoritativeSubscriptionSnapshot, NormalizedProviderSignal } from "./commerce-provider-contract.js";
import { type DatabasePool } from "./db.js";
import type { StripeBillingPeriod, StripeCheckoutResult, StripeFinancialSignalResolution, StripePortalResult } from "./stripe-test-adapter.js";
export type StripeCommerceProvider = Readonly<{
    assertCheckoutReady?(billingPeriod: StripeBillingPeriod): Promise<void>;
    retrieveHostedCheckout?(id: string, account: string): Promise<StripeCheckoutResult>;
    expireHostedCheckout?(id: string, account: string): Promise<void>;
    verifyWebhook(rawBody: Buffer, signatureHeader: string): NormalizedProviderSignal;
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
    resolveFinancialSignal?(signal: Pick<NormalizedProviderSignal, "signalType" | "providerTransactionReference" | "providerRefundReference">): Promise<StripeFinancialSignalResolution>;
    retrieveAuthoritativeSubscription(input: {
        providerSubscriptionReference: string;
        expectedCommerceAccountReference: string;
        expectedStripeCustomerReference: string;
    }): Promise<AuthoritativeSubscriptionSnapshot>;
}>;
export declare class StripeCommerceExecutor {
    private readonly pool;
    private readonly config;
    private readonly provider;
    constructor(pool: DatabasePool, config: StripeExecutionConfig, provider: StripeCommerceProvider);
    get providerEnvironment(): "test" | "production";
    createCheckout(input: {
        plannerId: string;
        billingPeriod: StripeBillingPeriod;
        idempotencySeed: string;
        purchaseConsent?: PurchaseConsent;
    }): Promise<StripeCheckoutResult & {
        orderReference: string;
        paymentAttemptReference: string;
        testOnly: boolean;
        salesEnabled: boolean;
    }>;
    createPortal(plannerId: string): Promise<StripePortalResult & {
        testOnly: boolean;
    }>;
    cancelPendingCheckout(plannerId: string): Promise<void>;
    acceptWebhook(rawBody: Buffer, signatureHeader: string): Promise<{
        received: true;
        status: "applied" | "duplicate" | "ignored" | "needs_mapping";
        testOnly: boolean;
    }>;
    private processVerifiedSignal;
    retryPendingProviderEvents(): Promise<{
        attempted: number;
        applied: number;
        failed: number;
    }>;
    loadProductionStatus(plannerId: string): Promise<unknown>;
    loadTestStatus(plannerId: string): Promise<unknown>;
}
