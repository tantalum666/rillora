import Stripe from "stripe";
export declare const STRIPE_API_VERSION: "2026-08-26.dahlia";
export type StripeSdkPort = Readonly<{
    retrieveAccountStatus?(): Promise<{
        id: string;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
    }>;
    retrieveProduct?(id: string): Promise<Stripe.Product | Stripe.DeletedProduct>;
    retrieveTaxReadiness?(): Promise<{
        status: string;
        activeRegistrationIds: string[];
    }>;
    retrievePrice(id: string): Promise<Stripe.Price>;
    retrieveCheckoutSession(id: string): Promise<Stripe.Checkout.Session>;
    expireCheckoutSession(id: string): Promise<Stripe.Checkout.Session>;
    createCheckoutSession(params: Stripe.Checkout.SessionCreateParams, options: Stripe.RequestOptions): Promise<Stripe.Checkout.Session>;
    createPortalSession(params: Stripe.BillingPortal.SessionCreateParams): Promise<Stripe.BillingPortal.Session>;
    retrieveRefund(id: string): Promise<Stripe.Refund>;
    retrieveDispute(id: string): Promise<Stripe.Dispute>;
    retrieveCharge(id: string): Promise<Stripe.Charge>;
    listInvoicePaymentsByInvoice?(id: string): Promise<Stripe.ApiList<Stripe.InvoicePayment>>;
    listChargesByPaymentIntent?(id: string): Promise<Stripe.ApiList<Stripe.Charge>>;
    listDisputesByCharge?(id: string): Promise<Stripe.ApiList<Stripe.Dispute>>;
    listRefundsByCharge?(id: string): Promise<Stripe.ApiList<Stripe.Refund>>;
    listInvoicePaymentsByPaymentIntent(id: string): Promise<Stripe.ApiList<Stripe.InvoicePayment>>;
    retrieveInvoice(id: string): Promise<Stripe.Invoice>;
    retrieveSubscription(id: string): Promise<Stripe.Subscription>;
    constructWebhookEvent(rawBody: Buffer, signatureHeader: string, webhookSecret: string): Stripe.Event;
}>;
export type StripeCheckoutResult = Readonly<{
    sessionId: string;
    url: string;
    expiresAt: string | null;
}>;
export type StripePortalResult = Readonly<{
    sessionId: string;
    url: string;
}>;
export type StripeFinancialSignalResolution = Readonly<{
    providerInvoiceReference: string;
    providerSubscriptionReference: string;
    providerCustomerReference: string;
    providerTransactionReference: string;
    providerRefundReference: string | null;
    authoritativeStateOverride: "refunded" | "revoked" | null;
}>;
export declare function createStripeSdkPort(apiKey: string, environment: "test" | "production"): StripeSdkPort;
