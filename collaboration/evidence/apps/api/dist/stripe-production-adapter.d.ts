import type { AuthoritativeSubscriptionSnapshot, NormalizedProviderSignal } from './commerce-provider-contract.js';
import { type StripeSdkPort, type StripeCheckoutResult, type StripePortalResult } from './stripe-sdk.js';
export type StripeProductionPriceBinding = Readonly<{
    id: string;
    priceCode: string;
    amountMinor: number;
    currency: 'usd';
    interval: 'year' | 'month';
    planVersion: number;
}>;
export type StripeProductionConfig = Readonly<{
    apiKey: string;
    webhookSecret: string;
    expectedAccountId: string;
    familyProductId: string;
    annualPriceId: string;
    historicalPrices: readonly StripeProductionPriceBinding[];
    checkoutSuccessUrl: string;
    checkoutCancelUrl: string;
    portalReturnUrl: string;
    portalConfigurationId: string;
    tax: Readonly<{
        mode: 'automatic' | 'reviewed_no_collection';
        assessmentReference: string;
        productTaxCode: string;
        activeRegistrationIds: readonly string[];
    }>;
}>;
/** Production-only provider boundary; market/consent/ledger checks remain in the executor. */
export declare class StripeProductionAdapter {
    private readonly config;
    private readonly sdk;
    private readonly now;
    constructor(config: StripeProductionConfig, sdk?: StripeSdkPort, now?: () => Date);
    private get currentPrice();
    private requireLive;
    verifyWebhook(body: Buffer, signature: string): NormalizedProviderSignal;
    assertCheckoutReady(period: 'annual' | 'monthly'): Promise<void>;
    createHostedSubscriptionCheckout(input: {
        commerceAccountReference: string;
        billingPeriod: 'annual' | 'monthly';
        idempotencyKey: string;
        existingStripeCustomerReference?: string;
        orderReference?: string;
        paymentAttemptReference?: string;
    }): Promise<StripeCheckoutResult>;
    createCustomerPortal(input: {
        stripeCustomerReference: string;
    }): Promise<StripePortalResult>;
    retrieveHostedCheckout(id: string, account: string): Promise<StripeCheckoutResult>;
    expireHostedCheckout(id: string, account: string): Promise<void>;
    retrieveAuthoritativeSubscription(input: {
        providerSubscriptionReference: string;
        expectedCommerceAccountReference: string;
        expectedStripeCustomerReference: string;
    }): Promise<AuthoritativeSubscriptionSnapshot>;
    resolveFinancialSignal(signal: Pick<NormalizedProviderSignal, 'signalType' | 'providerTransactionReference' | 'providerRefundReference'>): Promise<Readonly<{
        providerInvoiceReference: string;
        providerSubscriptionReference: string;
        providerCustomerReference: string;
        providerTransactionReference: string;
        providerRefundReference: string | null;
        authoritativeStateOverride: "refunded" | "revoked" | null;
    }>>;
    retrieveRecoverySubscription(input: {
        providerSubscriptionReference: string;
        expectedCommerceAccountReference: string;
        expectedStripeCustomerReference: string;
    }): Promise<{
        snapshot: Readonly<{
            providerInvoiceReference?: string | null;
            renewalIsPossible?: boolean;
            provider: import("./commerce-provider-contract.js").CommerceRenewalProvider;
            providerEnvironment: import("./commerce-provider-contract.js").CommerceProviderEnvironment;
            providerSubscriptionReference: string;
            commerceAccountReference: string;
            planCode: string;
            state: import("./commerce-provider-contract.js").CommerceSubscriptionState;
            observedAt: string;
            currentPeriodEndsAt: string | null;
            currentPeriodStartsAt?: string | null;
            graceEndsAt?: string | null;
            providerCustomerReference?: string | null;
            priceCode?: string | null;
            cancelAtPeriodEnd: boolean;
            source: "stripe_api" | "app_store_server_api_signed_status" | "synthetic_fixture";
        }>;
        financial: {
            override: null;
            resolvedDispute: boolean;
            chargeReference: null;
        };
        price: Readonly<{
            id: string;
            priceCode: string;
            amountMinor: number;
            currency: 'usd';
            interval: 'year' | 'month';
            planVersion: number;
        }>;
        product: string;
    } | {
        snapshot: {
            providerInvoiceReference?: string | null;
            renewalIsPossible?: boolean;
            provider: import("./commerce-provider-contract.js").CommerceRenewalProvider;
            providerEnvironment: import("./commerce-provider-contract.js").CommerceProviderEnvironment;
            providerSubscriptionReference: string;
            commerceAccountReference: string;
            planCode: string;
            currentPeriodEndsAt: string | null;
            currentPeriodStartsAt?: string | null;
            graceEndsAt?: string | null;
            providerCustomerReference?: string | null;
            priceCode?: string | null;
            cancelAtPeriodEnd: boolean;
            source: "stripe_api" | "app_store_server_api_signed_status" | "synthetic_fixture";
            state: import("./commerce-provider-contract.js").CommerceSubscriptionState;
            observedAt: string;
        };
        financial: {
            override: "refunded" | "revoked" | null;
            resolvedDispute: boolean;
            chargeReference: string;
        };
        price: Readonly<{
            id: string;
            priceCode: string;
            amountMinor: number;
            currency: 'usd';
            interval: 'year' | 'month';
            planVersion: number;
        }>;
        product: string;
    }>;
    private validatePrice;
}
