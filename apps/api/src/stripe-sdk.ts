import Stripe from "stripe";

export const STRIPE_API_VERSION = "2026-08-26.dahlia" as const;
export type BillingDisplayLocale = "en" | "zh-CN";

export type StripeSdkPort = Readonly<{
  retrieveAccountStatus?(): Promise<{ id: string; chargesEnabled: boolean; payoutsEnabled: boolean }>;
  retrieveProduct?(id: string): Promise<Stripe.Product | Stripe.DeletedProduct>;
  retrieveTaxReadiness?(): Promise<{ status: string; activeRegistrationIds: string[] }>;
  retrievePrice(id: string): Promise<Stripe.Price>;
  retrieveCheckoutSession(id: string): Promise<Stripe.Checkout.Session>;
  expireCheckoutSession(id: string): Promise<Stripe.Checkout.Session>;
  createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    options: Stripe.RequestOptions,
  ): Promise<Stripe.Checkout.Session>;
  createPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams,
  ): Promise<Stripe.BillingPortal.Session>;
  retrieveRefund(id: string): Promise<Stripe.Refund>;
  retrieveDispute(id: string): Promise<Stripe.Dispute>;
  retrieveCharge(id: string): Promise<Stripe.Charge>;
  listInvoicePaymentsByInvoice?(id:string):Promise<Stripe.ApiList<Stripe.InvoicePayment>>;
  listChargesByPaymentIntent?(id:string):Promise<Stripe.ApiList<Stripe.Charge>>;
  listDisputesByCharge?(id:string):Promise<Stripe.ApiList<Stripe.Dispute>>;
  listRefundsByCharge?(id:string):Promise<Stripe.ApiList<Stripe.Refund>>;
  listInvoicePaymentsByPaymentIntent(id: string): Promise<Stripe.ApiList<Stripe.InvoicePayment>>;
  retrieveInvoice(id: string): Promise<Stripe.Invoice>;
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
  constructWebhookEvent(
    rawBody: Buffer,
    signatureHeader: string,
    webhookSecret: string,
  ): Stripe.Event;
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
  /** Complete current-invoice evidence confirms an earlier refund no longer settled. */
  refundReversed?: boolean;
}>;

export function createStripeSdkPort(apiKey: string, environment: "test" | "production"): StripeSdkPort {
  if (!["test", "production"].includes(environment)) throw new Error("Unknown Stripe environment");
  if (!apiKey.startsWith(environment === "test" ? "rk_test_" : "rk_live_")) {
    throw new Error("Stripe requires a restricted key for the exact configured environment");
  }
  const stripe = new Stripe(apiKey, {
    apiVersion: STRIPE_API_VERSION,
    maxNetworkRetries: 2,
    timeout: 10_000,
  });
  return Object.freeze({
    retrieveAccountStatus: async () => {
      const account = await stripe.accounts.retrieve(null);
      return { id: account.id, chargesEnabled: account.charges_enabled, payoutsEnabled: account.payouts_enabled };
    },
    retrieveProduct: id => stripe.products.retrieve(id),
    retrieveTaxReadiness: async () => {
      const settings = await stripe.tax.settings.retrieve();
      const activeRegistrationIds: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 10; page += 1) {
        const registrations = await stripe.tax.registrations.list({ status: 'active', limit: 100,
          ...(cursor ? { starting_after: cursor } : {}) });
        activeRegistrationIds.push(...registrations.data.map(value => value.id));
        if (!registrations.has_more) return { status: settings.status, activeRegistrationIds };
        cursor = registrations.data.at(-1)?.id;
        if (!cursor) break;
      }
      throw new Error('Tax registration inventory is incomplete');
    },
    retrievePrice: (id) => stripe.prices.retrieve(id),
    retrieveCheckoutSession: id => stripe.checkout.sessions.retrieve(id),
    expireCheckoutSession: id => stripe.checkout.sessions.expire(id),
    createCheckoutSession: (params, options) => stripe.checkout.sessions.create(params, options),
    createPortalSession: (params) => stripe.billingPortal.sessions.create(params),
    retrieveRefund: (id) => stripe.refunds.retrieve(id),
    retrieveDispute: (id) => stripe.disputes.retrieve(id),
    retrieveCharge: (id) => stripe.charges.retrieve(id),
    listInvoicePaymentsByInvoice:id=>stripe.invoicePayments.list({invoice:id,status:'paid',limit:100}),
    listChargesByPaymentIntent:id=>stripe.charges.list({payment_intent:id,limit:100}),
    listDisputesByCharge:id=>stripe.disputes.list({charge:id,limit:100}),
    listRefundsByCharge:id=>stripe.refunds.list({charge:id,limit:100}),
    listInvoicePaymentsByPaymentIntent: (id) => stripe.invoicePayments.list({
      payment: { type: "payment_intent", payment_intent: id },
      limit: 2,
    }),
    retrieveInvoice: (id) => stripe.invoices.retrieve(id),
    retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
    constructWebhookEvent: (rawBody, signatureHeader, webhookSecret) =>
      stripe.webhooks.constructEvent(rawBody, signatureHeader, webhookSecret),
  });
}
