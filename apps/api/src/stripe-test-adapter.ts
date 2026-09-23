import { createHash } from "node:crypto";
import Stripe from "stripe";
import { ApiError } from "./errors.js";
import type { StripeTestConfig } from "./config.js";
import type {
  AuthoritativeSubscriptionSnapshot,
  CommerceProviderSignalType,
  CommerceSubscriptionState,
  NormalizedProviderSignal,
} from "./commerce-provider-contract.js";

const maximumWebhookBytes = 256 * 1024;
const stripeApiVersion = "2026-07-29.dahlia";
const commerceReferencePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/;
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,254}$/;
const historicalFamilyPrices = Object.freeze({ monthly: "price_1U6BMoCxTlowhyiG7qsmBrdY", annual: "price_1U6BMnCxTlowhyiGJEC1w596" });
const previousFamilyPrices = Object.freeze({ monthly: "price_1UGKadCxTlowhyiGJ0bnY9Kn", annual: "price_1UGKXlCxTlowhyiGVLKAkfl1" });

export type StripeBillingPeriod = "monthly" | "annual";

export type StripeSdkPort = Readonly<{
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
}>;

export function createOfficialStripeSdkPort(apiKey: string): StripeSdkPort {
  if (!apiKey.startsWith("rk_test_")) {
    throw new Error("The official Stripe test adapter requires a restricted test-mode API key");
  }
  const stripe = new Stripe(apiKey, {
    apiVersion: stripeApiVersion,
    maxNetworkRetries: 2,
    timeout: 10_000,
  });
  return Object.freeze({
    retrievePrice: (id) => stripe.prices.retrieve(id),
    retrieveCheckoutSession: id => stripe.checkout.sessions.retrieve(id),
    expireCheckoutSession: id => stripe.checkout.sessions.expire(id),
    createCheckoutSession: (params, options) => stripe.checkout.sessions.create(params, options),
    createPortalSession: (params) => stripe.billingPortal.sessions.create(params),
    retrieveRefund: (id) => stripe.refunds.retrieve(id),
    retrieveDispute: (id) => stripe.disputes.retrieve(id),
    retrieveCharge: (id) => stripe.charges.retrieve(id),
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

/**
 * Official Stripe SDK boundary for Rillora's disabled test commerce plane.
 *
 * The adapter is intentionally test-only. It binds provider operations to
 * account-specific server-owned Product, Price, Customer and Subscription
 * references, and never treats Checkout or a webhook delivery as entitlement
 * evidence.
 */
export class StripeTestAdapter {
  constructor(
    private readonly config: StripeTestConfig,
    private readonly stripe: StripeSdkPort = createOfficialStripeSdkPort(config.apiKey),
    private readonly now: () => Date = () => new Date(),
  ) {}

  verifyWebhook(rawBody: Buffer, signatureHeader: string): NormalizedProviderSignal {
    if (!Buffer.isBuffer(rawBody) || rawBody.byteLength === 0) {
      throw new Error("Stripe webhook requires a non-empty raw request body");
    }
    if (rawBody.byteLength > maximumWebhookBytes) {
      throw new Error("Stripe webhook body is outside the accepted size boundary");
    }
    if (!signatureHeader) {
      throw new Error("Stripe webhook signature header is required");
    }

    const event = this.stripe.constructWebhookEvent(
      rawBody,
      signatureHeader,
      this.config.webhookSecret,
    );
    if (event.livemode) {
      throw new Error("The Stripe test adapter refuses live-mode events");
    }

    const object = event.data.object as unknown as Record<string, unknown>;
    const eventType = event.type;
    return Object.freeze({
      provider: "stripe",
      providerEnvironment: "test",
      providerEventReference: event.id,
      sourceEventType: eventType,
      signalType: stripeSignalType(eventType),
      occurredAt: epochSecondsToIso(event.created),
      providerSubscriptionReference: stripeSubscriptionReference(object),
      providerTransactionReference: stripeTransactionReference(eventType, object),
      providerRefundReference: stripeRefundReference(eventType, object),
      commerceAccountReference: stripeCommerceAccountReference(object),
      providerCustomerReference: stripeCustomerReference(object),
      orderReference: stripeMetadataValue(object, "rillora_order_reference"),
      paymentAttemptReference: stripeMetadataValue(
        object,
        "rillora_payment_attempt_reference",
      ),
      payloadSha256: createHash("sha256").update(rawBody).digest("base64url"),
      signatureVerified: true,
      verificationMode: "stripe_sdk_webhook_signature",
      requiresAuthoritativeSnapshot: true,
    });
  }

  async resolveFinancialSignal(
    signal: Pick<
      NormalizedProviderSignal,
      "signalType" | "providerTransactionReference" | "providerRefundReference"
    >,
  ): Promise<StripeFinancialSignalResolution> {
    if (signal.signalType !== "refund_changed" && signal.signalType !== "dispute_changed") {
      throw new Error("Stripe financial signal resolution requires a refund or dispute signal");
    }

    let refund: Stripe.Refund | null = null;
    let dispute: Stripe.Dispute | null = null;
    if (signal.signalType === "refund_changed" && signal.providerRefundReference) {
      assertStripeObjectId(signal.providerRefundReference, "re_");
      refund = await this.stripe.retrieveRefund(signal.providerRefundReference);
    }

    if (signal.signalType === "dispute_changed") {
      const disputeReference = stringWithPrefix(signal.providerTransactionReference, "du_");
      if (!disputeReference) throw new Error("Stripe dispute resolution requires a Dispute reference");
      dispute = await this.stripe.retrieveDispute(disputeReference);
      if (dispute.livemode) throw new Error("Stripe dispute resolution refuses live-mode objects");
    }

    let chargeReference = stripeObjectReference(refund?.charge)
      ?? stripeObjectReference(dispute?.charge)
      ?? stringWithPrefix(signal.providerTransactionReference, "ch_");
    if (!chargeReference) {
      throw new Error("Stripe refund resolution requires a Charge reference");
    }
    assertStripeObjectId(chargeReference, "ch_");
    const charge = await this.stripe.retrieveCharge(chargeReference);
    if (charge.livemode) throw new Error("Stripe refund resolution refuses a live-mode Charge");

    const paymentIntentReference = stripeObjectReference(refund?.payment_intent)
      ?? stripeObjectReference(dispute?.payment_intent)
      ?? stripeObjectReference(charge.payment_intent);
    if (!paymentIntentReference?.startsWith("pi_")) {
      throw new Error("Stripe refund resolution requires a PaymentIntent reference");
    }
    const invoicePayments = await this.stripe.listInvoicePaymentsByPaymentIntent(
      paymentIntentReference,
    );
    const invoicePayment = invoicePayments.data[0];
    if (invoicePayments.data.length !== 1 || !invoicePayment || invoicePayment.livemode) {
      throw new Error("Stripe refund resolution requires one test Invoice Payment");
    }
    const invoiceReference = stripeObjectReference(invoicePayment.invoice);
    if (!invoiceReference?.startsWith("in_")) {
      throw new Error("Stripe refund resolution requires an Invoice reference");
    }
    const invoice = await this.stripe.retrieveInvoice(invoiceReference);
    if (invoice.livemode) throw new Error("Stripe refund resolution refuses a live-mode Invoice");

    const subscriptionReference = stripeObjectReference(
      invoice.parent?.subscription_details?.subscription,
    );
    const customerReference = stripeObjectReference(invoice.customer)
      ?? stripeObjectReference(charge.customer);
    if (!subscriptionReference?.startsWith("sub_") || !customerReference?.startsWith("cus_")) {
      throw new Error("Stripe refund resolution requires Subscription and Customer references");
    }
    if (
      stripeObjectReference(charge.customer)
      && stripeObjectReference(charge.customer) !== customerReference
    ) {
      throw new Error("Stripe refund Charge and Invoice Customer references do not match");
    }

    const refundSucceeded = refund === null || refund.status === "succeeded";
    const fullRefund = signal.signalType === "refund_changed"
      && refundSucceeded
      && (charge.refunded || charge.amount_refunded >= charge.amount);
    const disputeRevokes = dispute !== null && ![
      "won",
      "prevented",
      "warning_closed",
    ].includes(dispute.status);
    return Object.freeze({
      providerSubscriptionReference: subscriptionReference,
      providerCustomerReference: customerReference,
      providerTransactionReference: chargeReference,
      providerRefundReference: signal.providerRefundReference,
      providerInvoiceReference: invoiceReference,
      authoritativeStateOverride: fullRefund ? "refunded" : disputeRevokes ? "revoked" : null,
    });
  }

  async assertCheckoutReady(billingPeriod: StripeBillingPeriod): Promise<void> {
    let price: Stripe.Price;
    try { price = await this.stripe.retrievePrice(this.config.familyPriceIds[billingPeriod]); }
    catch { throw new ApiError(503, "checkout_setup_unavailable", "Checkout is temporarily unavailable. Please try again later."); }
    assertConfiguredPrice(price, this.config, billingPeriod);
  }

  async createHostedSubscriptionCheckout(input: {
    commerceAccountReference: string;
    billingPeriod: StripeBillingPeriod;
    idempotencyKey: string;
    existingStripeCustomerReference?: string;
    orderReference?: string;
    paymentAttemptReference?: string;
  }): Promise<StripeCheckoutResult> {
    assertCommerceReference(input.commerceAccountReference);
    assertIdempotencyKey(input.idempotencyKey);
    if (input.existingStripeCustomerReference) {
      assertStripeObjectId(input.existingStripeCustomerReference, "cus_");
    }
    if (input.orderReference) assertCommerceReference(input.orderReference);
    if (input.paymentAttemptReference) assertCommerceReference(input.paymentAttemptReference);
    const priceId = this.config.familyPriceIds[input.billingPeriod];
    const priceCode = stripeFamilyPriceCode(this.config, input.billingPeriod);
    await this.assertCheckoutReady(input.billingPeriod);
    const metadata = {
      rillora_commerce_account_reference: input.commerceAccountReference,
      rillora_plan_code: "family",
      rillora_plan_version: `family-v${this.config.familyPlanVersion ?? 1}`,
      rillora_price_code: priceCode,
      rillora_environment: this.config.integrationEnvironment,
      ...(input.orderReference ? { rillora_order_reference: input.orderReference } : {}),
      ...(input.paymentAttemptReference
        ? { rillora_payment_attempt_reference: input.paymentAttemptReference }
        : {}),
    };
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      ui_mode: "hosted_page",
      origin_context: "web",
      integration_identifier: stripeIntegrationIdentifier(input.idempotencyKey),
      client_reference_id: input.commerceAccountReference,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: this.config.checkoutSuccessUrl,
      cancel_url: this.config.checkoutCancelUrl,
      allow_promotion_codes: false,
      automatic_tax: { enabled: false },
      adaptive_pricing: { enabled: false },
      billing_address_collection: "auto",
      payment_method_collection: "always",
      metadata,
      subscription_data: { metadata },
      ...(input.existingStripeCustomerReference
        ? { customer: input.existingStripeCustomerReference }
        : {}),
    };
    const session = await this.stripe.createCheckoutSession(params, {
      idempotencyKey: input.idempotencyKey,
    });
    if (session.livemode) {
      throw new Error("The Stripe test adapter received a live-mode Checkout Session");
    }
    if (!session.url) {
      throw new Error("Stripe did not return a hosted Checkout URL");
    }
    assertStripeHostedUrl(session.url, "checkout.stripe.com");

    return Object.freeze({
      sessionId: session.id,
      url: session.url,
      expiresAt: session.expires_at ? epochSecondsToIso(session.expires_at) : null,
    });
  }

  async createCustomerPortal(input: {
    stripeCustomerReference: string;
  }): Promise<StripePortalResult> {
    assertStripeObjectId(input.stripeCustomerReference, "cus_");
    const session = await this.stripe.createPortalSession({
      customer: input.stripeCustomerReference,
      return_url: this.config.portalReturnUrl,
    });
    if (session.livemode) {
      throw new Error("The Stripe test adapter received a live-mode Portal Session");
    }
    assertStripeHostedUrl(session.url, "billing.stripe.com");
    return Object.freeze({ sessionId: session.id, url: session.url });
  }

  async retrieveAuthoritativeSubscription(input: {
    providerSubscriptionReference: string;
    expectedCommerceAccountReference: string;
    expectedStripeCustomerReference: string;
  }): Promise<AuthoritativeSubscriptionSnapshot> {
    assertStripeObjectId(input.providerSubscriptionReference, "sub_");
    assertStripeObjectId(input.expectedStripeCustomerReference, "cus_");
    assertCommerceReference(input.expectedCommerceAccountReference);
    const subscription = await this.stripe.retrieveSubscription(
      input.providerSubscriptionReference,
    );
    if (subscription.livemode) {
      throw new Error("The Stripe test adapter refuses a live-mode Subscription");
    }
    if (stripeObjectReference(subscription.customer) !== input.expectedStripeCustomerReference) {
      throw new Error("Stripe Subscription customer does not match the server-owned account mapping");
    }
    if (
      subscription.metadata.rillora_commerce_account_reference
      !== input.expectedCommerceAccountReference
      || subscription.metadata.rillora_plan_code !== "family"
    ) {
      throw new Error("Stripe Subscription metadata does not match the Rillora commerce account");
    }
    const items = subscription.items.data;
    if (items.length !== 1 || items[0]?.quantity !== 1) {
      throw new Error("Stripe Subscription must contain exactly one Family item with quantity one");
    }
    const item = items[0];
    // Amount changes do not change Family's capability version. Resolve each
    // historical immutable Stripe Price before interpreting its metadata.
    const candidates: StripeTestConfig[] = [this.config];
    if (familyPriceVersion(this.config) > 1) candidates.push({ ...this.config,
      familyPlanVersion: 1, familyPriceVersion: 1, familyPriceIds: historicalFamilyPrices });
    if (familyPriceVersion(this.config) > 2) candidates.push({ ...this.config,
      familyPlanVersion: 2, familyPriceVersion: 2, familyPriceIds: previousFamilyPrices });
    const subscriptionConfig = candidates.find(candidate =>
      Object.values(candidate.familyPriceIds).includes(item.price.id)
      && subscription.metadata.rillora_plan_version === `family-v${candidate.familyPlanVersion ?? 1}`);
    if (!subscriptionConfig) {
      throw new Error("Stripe Subscription metadata does not match the Rillora catalog version or Price");
    }
    const allowedPriceIds = new Set(Object.values(subscriptionConfig.familyPriceIds));
    if (!allowedPriceIds.has(item.price.id)) {
      throw new Error("Stripe Subscription uses an unrecognized Price");
    }
    if (stripeObjectReference(item.price.product) !== this.config.familyProductId) {
      throw new Error("Stripe Subscription uses an unrecognized Product");
    }
    const period = item.price.id === subscriptionConfig.familyPriceIds.monthly ? "monthly" : "annual";
    if (subscription.metadata.rillora_price_code
      && subscription.metadata.rillora_price_code !== stripeFamilyPriceCode(subscriptionConfig, period)) {
      throw new Error("Stripe Subscription price metadata does not match its immutable Price");
    }
    assertConfiguredPrice(item.price, subscriptionConfig, period, false);
    const state = stripeSubscriptionState(subscription);
    if (["active", "cancel_at_period_end"].includes(state)) {
      const invoiceId = stripeObjectReference(subscription.latest_invoice);
      if (!invoiceId) throw new Error("An active subscription needs a settled invoice before access");
      const invoice = await this.stripe.retrieveInvoice(invoiceId);
      if (invoice.livemode || invoice.status !== "paid"
        || stripeObjectReference(invoice.customer) !== input.expectedStripeCustomerReference
        || stripeObjectReference(invoice.parent?.subscription_details?.subscription) !== subscription.id) {
        throw new Error("Subscription payment is not yet authoritatively settled");
      }
    }

    return Object.freeze({
      provider: "stripe",
      providerEnvironment: "test",
      providerSubscriptionReference: subscription.id,
      commerceAccountReference: input.expectedCommerceAccountReference,
      planCode: "family",
      state,
      observedAt: this.now().toISOString(),
      currentPeriodEndsAt: epochSecondsToIso(subscription.status === "canceled" && subscription.ended_at
        ? Math.min(item.current_period_end, subscription.ended_at) : item.current_period_end),
      currentPeriodStartsAt: epochSecondsToIso(item.current_period_start),
      cancelAtPeriodEnd: stripeHasScheduledCancellation(subscription),
      providerCustomerReference: input.expectedStripeCustomerReference,
      priceCode: stripeFamilyPriceCode(subscriptionConfig, period),
      providerInvoiceReference: stripeObjectReference(subscription.latest_invoice),
      renewalIsPossible: !["canceled", "incomplete_expired"].includes(subscription.status),
      source: "stripe_api",
    });
  }
  async retrieveHostedCheckout(id: string, account: string): Promise<StripeCheckoutResult> {
    const session = await this.stripe.retrieveCheckoutSession(id);
    if (session.livemode || session.metadata?.rillora_commerce_account_reference !== account) throw new Error("Checkout account binding rejected");
    if (session.status !== "open" || !session.url) throw new ApiError(409,
      session.status === "expired" ? "checkout_expired" : "checkout_processing",
      session.status === "expired" ? "This checkout expired. Close the unfinished checkout, then try again." : "Payment is being confirmed. Refresh your access before continuing.");
    assertStripeHostedUrl(session.url, "checkout.stripe.com");
    return { sessionId: session.id, url: session.url, expiresAt: session.expires_at ? epochSecondsToIso(session.expires_at) : null };
  }
  async expireHostedCheckout(id: string, account: string): Promise<void> {
    const current = await this.stripe.retrieveCheckoutSession(id);
    if (current.livemode || current.metadata?.rillora_commerce_account_reference !== account) throw new Error("Checkout account binding rejected");
    if (current.status === "expired") return;
    if (current.status !== "open") throw new ApiError(409, "checkout_processing", "Payment is being confirmed. Refresh your access before continuing.");
    const expired = await this.stripe.expireCheckoutSession(id);
    if (expired.livemode || expired.status !== "expired") throw new Error("Checkout expiration was not confirmed");
  }
}

function familyPriceVersion(config: Pick<StripeTestConfig, "familyPlanVersion" | "familyPriceVersion">): number {
  const version = config.familyPriceVersion ?? config.familyPlanVersion ?? 1;
  if (![1, 2, 3].includes(version)) throw new Error("Unknown Rillora price version");
  return version;
}
export function stripeFamilyPriceCode(config: Pick<StripeTestConfig, "familyPlanVersion" | "familyPriceVersion">, period: StripeBillingPeriod): string {
  return `family_usd_${period}_v${familyPriceVersion(config)}`;
}
export function stripeSnapshotPriceId(config: StripeTestConfig, priceCode: string): string | null {
  for (const period of ["monthly", "annual"] as const) {
    if (priceCode === stripeFamilyPriceCode(config, period)) return config.familyPriceIds[period];
    if (familyPriceVersion(config) > 1 && priceCode === `family_usd_${period}_v1`) return historicalFamilyPrices[period];
    if (familyPriceVersion(config) > 2 && priceCode === `family_usd_${period}_v2`) return previousFamilyPrices[period];
  }
  return null;
}

function assertConfiguredPrice(price: Stripe.Price, config: StripeTestConfig, period: StripeBillingPeriod, newPurchase = true): void {
  const version = familyPriceVersion(config);
  const expected = version === 3 ? (period === "annual" ? 8880 : 999)
    : version === 2 ? (period === "annual" ? 6800 : 799) : (period === "annual" ? 9900 : 999);
  if (price.livemode || (newPurchase && !price.active) || price.id !== config.familyPriceIds[period]
    || stripeObjectReference(price.product) !== config.familyProductId || price.currency !== "usd"
    || price.unit_amount !== expected || price.recurring?.interval !== (period === "annual" ? "year" : "month")
    || price.recurring.interval_count !== 1) throw new Error("Provider price differs from the exact Rillora offer");
}

export function stripeSubscriptionState(
  subscription: Pick<
    Stripe.Subscription,
    "status" | "cancel_at" | "cancel_at_period_end" | "pause_collection"
  >,
): CommerceSubscriptionState {
  if (subscription.pause_collection) return "expired_read_only";
  if (subscription.status === "active") {
    return stripeHasScheduledCancellation(subscription) ? "cancel_at_period_end" : "active";
  }
  if (["past_due", "unpaid"].includes(subscription.status)) return "past_due";
  if (["canceled", "incomplete", "incomplete_expired", "paused"].includes(subscription.status)) {
    return "expired_read_only";
  }
  if (subscription.status === "trialing") {
    throw new Error("Stripe trialing status is outside Rillora's no-trial launch policy");
  }
  throw new Error("Stripe Subscription status is unsupported; access must fail closed");
}

function stripeHasScheduledCancellation(
  subscription: Pick<Stripe.Subscription, "status" | "cancel_at" | "cancel_at_period_end">,
): boolean {
  return subscription.status === "active"
    && (subscription.cancel_at_period_end || subscription.cancel_at != null);
}

function stripeSignalType(eventType: string): CommerceProviderSignalType {
  if ([
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
  ].includes(eventType)) return "subscription_changed";
  if (eventType === "customer.subscription.deleted") return "subscription_ended";
  if (["invoice.paid", "invoice.payment_succeeded"].includes(eventType)) return "renewal_paid";
  if (eventType === "invoice.payment_failed") return "renewal_failed";
  if (["refund.created", "refund.updated", "refund.failed", "charge.refunded"].includes(eventType)) {
    return "refund_changed";
  }
  if (eventType.startsWith("charge.dispute.")) return "dispute_changed";
  return "unsupported";
}

function stripeSubscriptionReference(object: Record<string, unknown>): string | null {
  if (object.object === "subscription") return stringWithPrefix(object.id, "sub_");
  const direct = stripeObjectReference(object.subscription);
  if (direct?.startsWith("sub_")) return direct;

  const metadata = record(object.metadata);
  const metadataReference = stringWithPrefix(metadata?.rillora_subscription_reference, "sub_");
  if (metadataReference) return metadataReference;

  const parent = record(object.parent);
  const subscriptionDetails = record(parent?.subscription_details);
  const parentReference = stripeObjectReference(subscriptionDetails?.subscription);
  if (parentReference?.startsWith("sub_")) return parentReference;

  const lines = record(object.lines);
  const lineItems = Array.isArray(lines?.data) ? lines.data : [];
  for (const candidate of lineItems) {
    const line = record(candidate);
    const lineParent = record(line?.parent);
    const itemDetails = record(lineParent?.subscription_item_details);
    const lineReference = stripeObjectReference(itemDetails?.subscription);
    if (lineReference?.startsWith("sub_")) return lineReference;
  }
  return null;
}

function stripeTransactionReference(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  if (eventType.startsWith("invoice.")) return stringWithPrefix(object.id, "in_");
  if (eventType === "checkout.session.completed") return stringWithPrefix(object.id, "cs_");
  if (eventType.startsWith("charge.dispute.")) return stringWithPrefix(object.id, "du_");
  if (eventType.startsWith("charge.")) return stringWithPrefix(object.id, "ch_");
  return null;
}

function stripeRefundReference(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  if (eventType.startsWith("refund.")) return stringWithPrefix(object.id, "re_");
  return null;
}

function stripeCommerceAccountReference(object: Record<string, unknown>): string | null {
  const direct = typeof object.client_reference_id === "string"
    ? object.client_reference_id
    : null;
  return direct ?? stripeMetadataValue(object, "rillora_commerce_account_reference");
}

function stripeCustomerReference(object: Record<string, unknown>): string | null {
  const customer = stripeObjectReference(object.customer);
  return customer?.startsWith("cus_") ? customer : null;
}

function stripeMetadataValue(
  object: Record<string, unknown>,
  key: string,
): string | null {
  const direct = record(object.metadata)?.[key];
  if (typeof direct === "string" && direct.length > 0) return direct;
  const parent = record(object.parent);
  const subscriptionDetails = record(parent?.subscription_details);
  const nested = record(subscriptionDetails?.metadata)?.[key];
  return typeof nested === "string" && nested.length > 0 ? nested : null;
}

function stripeObjectReference(value: unknown): string | null {
  if (typeof value === "string") return value;
  return typeof record(value)?.id === "string" ? record(value)!.id as string : null;
}

function stringWithPrefix(value: unknown, prefix: string): string | null {
  return typeof value === "string" && value.startsWith(prefix) ? value : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function assertCommerceReference(value: string): void {
  if (!commerceReferencePattern.test(value)) {
    throw new Error("Rillora commerce account reference is invalid");
  }
}

function assertIdempotencyKey(value: string): void {
  if (!idempotencyKeyPattern.test(value)) {
    throw new Error("Stripe Checkout requires a stable server-owned idempotency key");
  }
}

function stripeIntegrationIdentifier(idempotencyKey: string): string {
  const digest = createHash("sha256").update(idempotencyKey).digest();
  let suffix = "";
  for (let index = 0; index < 8; index += 1) {
    suffix += String.fromCharCode(97 + digest[index]! % 26);
  }
  return `rillora_phase1c_${suffix}`;
}

function assertStripeObjectId(value: string, prefix: string): void {
  if (!value.startsWith(prefix) || !/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Stripe object reference must start with ${prefix}`);
  }
}

function assertStripeHostedUrl(value: string, expectedHost: string): void {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== expectedHost) {
    throw new Error("Stripe returned an unexpected hosted URL");
  }
}

function epochSecondsToIso(value: number): string {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Stripe timestamp is invalid");
  }
  const date = new Date(value * 1_000);
  if (Number.isNaN(date.getTime())) throw new Error("Stripe timestamp is invalid");
  return date.toISOString();
}
