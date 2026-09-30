import { stripeSubscriptionState, stripeHasScheduledCancellation, stripeSignalType, stripeSubscriptionReference, stripeTransactionReference, stripeRefundReference, stripeCommerceAccountReference, stripeCustomerReference, stripeMetadataValue, stripeObjectReference, stringWithPrefix, assertCommerceReference, assertIdempotencyKey, stripeIntegrationIdentifier, assertStripeObjectId, assertStripeHostedUrl, epochSecondsToIso, } from "./stripe-provider-shared.js";
export { stripeSubscriptionState } from "./stripe-provider-shared.js";
import { createHash } from "node:crypto";
import { ApiError } from "./errors.js";
const maximumWebhookBytes = 256 * 1024;
const historicalFamilyPrices = Object.freeze({ monthly: "price_1U6BMoCxTlowhyiG7qsmBrdY", annual: "price_1U6BMnCxTlowhyiGJEC1w596" });
const v3FamilyPrices = Object.freeze({ monthly: "price_1UHMlhCxTlowhyiGvBEPdb4x", annual: "price_1UHMkTCxTlowhyiGu3do5wps" });
const previousFamilyPrices = Object.freeze({ monthly: "price_1UGKadCxTlowhyiGJ0bnY9Kn", annual: "price_1UGKXlCxTlowhyiGVLKAkfl1" });
import { createStripeSdkPort } from "./stripe-sdk.js";
export function createOfficialStripeSdkPort(apiKey) {
    if (!apiKey.startsWith("rk_test_"))
        throw new Error("The official Stripe test adapter requires a restricted test-mode API key");
    return createStripeSdkPort(apiKey, "test");
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
    config;
    stripe;
    now;
    constructor(config, stripe = createOfficialStripeSdkPort(config.apiKey), now = () => new Date()) {
        this.config = config;
        this.stripe = stripe;
        this.now = now;
    }
    verifyWebhook(rawBody, signatureHeader) {
        if (!Buffer.isBuffer(rawBody) || rawBody.byteLength === 0) {
            throw new Error("Stripe webhook requires a non-empty raw request body");
        }
        if (rawBody.byteLength > maximumWebhookBytes) {
            throw new Error("Stripe webhook body is outside the accepted size boundary");
        }
        if (!signatureHeader) {
            throw new Error("Stripe webhook signature header is required");
        }
        const event = this.stripe.constructWebhookEvent(rawBody, signatureHeader, this.config.webhookSecret);
        if (event.livemode) {
            throw new Error("The Stripe test adapter refuses live-mode events");
        }
        const object = event.data.object;
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
            paymentAttemptReference: stripeMetadataValue(object, "rillora_payment_attempt_reference"),
            payloadSha256: createHash("sha256").update(rawBody).digest("base64url"),
            signatureVerified: true,
            verificationMode: "stripe_sdk_webhook_signature",
            requiresAuthoritativeSnapshot: true,
        });
    }
    async resolveFinancialSignal(signal) {
        if (signal.signalType !== "refund_changed" && signal.signalType !== "dispute_changed") {
            throw new Error("Stripe financial signal resolution requires a refund or dispute signal");
        }
        let refund = null;
        let dispute = null;
        if (signal.signalType === "refund_changed" && signal.providerRefundReference) {
            assertStripeObjectId(signal.providerRefundReference, "re_");
            refund = await this.stripe.retrieveRefund(signal.providerRefundReference);
        }
        if (signal.signalType === "dispute_changed") {
            const disputeReference = stringWithPrefix(signal.providerTransactionReference, "du_");
            if (!disputeReference)
                throw new Error("Stripe dispute resolution requires a Dispute reference");
            dispute = await this.stripe.retrieveDispute(disputeReference);
            if (dispute.livemode)
                throw new Error("Stripe dispute resolution refuses live-mode objects");
        }
        let chargeReference = stripeObjectReference(refund?.charge)
            ?? stripeObjectReference(dispute?.charge)
            ?? stringWithPrefix(signal.providerTransactionReference, "ch_");
        if (!chargeReference) {
            throw new Error("Stripe refund resolution requires a Charge reference");
        }
        assertStripeObjectId(chargeReference, "ch_");
        const charge = await this.stripe.retrieveCharge(chargeReference);
        if (charge.livemode)
            throw new Error("Stripe refund resolution refuses a live-mode Charge");
        const paymentIntentReference = stripeObjectReference(refund?.payment_intent)
            ?? stripeObjectReference(dispute?.payment_intent)
            ?? stripeObjectReference(charge.payment_intent);
        if (!paymentIntentReference?.startsWith("pi_")) {
            throw new Error("Stripe refund resolution requires a PaymentIntent reference");
        }
        const invoicePayments = await this.stripe.listInvoicePaymentsByPaymentIntent(paymentIntentReference);
        const invoicePayment = invoicePayments.data[0];
        if (invoicePayments.data.length !== 1 || !invoicePayment || invoicePayment.livemode) {
            throw new Error("Stripe refund resolution requires one test Invoice Payment");
        }
        const invoiceReference = stripeObjectReference(invoicePayment.invoice);
        if (!invoiceReference?.startsWith("in_")) {
            throw new Error("Stripe refund resolution requires an Invoice reference");
        }
        const invoice = await this.stripe.retrieveInvoice(invoiceReference);
        if (invoice.livemode)
            throw new Error("Stripe refund resolution refuses a live-mode Invoice");
        const subscriptionReference = stripeObjectReference(invoice.parent?.subscription_details?.subscription);
        const customerReference = stripeObjectReference(invoice.customer)
            ?? stripeObjectReference(charge.customer);
        if (!subscriptionReference?.startsWith("sub_") || !customerReference?.startsWith("cus_")) {
            throw new Error("Stripe refund resolution requires Subscription and Customer references");
        }
        if (stripeObjectReference(charge.customer)
            && stripeObjectReference(charge.customer) !== customerReference) {
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
    async assertCheckoutReady(billingPeriod) {
        if (familyPriceVersion(this.config) === 4 && billingPeriod !== "annual")
            throw new ApiError(409, "billing_period_unavailable", "Rillora Family is available as an annual subscription.");
        let price;
        try {
            price = await this.stripe.retrievePrice(this.config.familyPriceIds[billingPeriod]);
        }
        catch {
            throw new ApiError(503, "checkout_setup_unavailable", "Checkout is temporarily unavailable. Please try again later.");
        }
        assertConfiguredPrice(price, this.config, billingPeriod);
    }
    async createHostedSubscriptionCheckout(input) {
        assertCommerceReference(input.commerceAccountReference);
        assertIdempotencyKey(input.idempotencyKey);
        if (input.existingStripeCustomerReference) {
            assertStripeObjectId(input.existingStripeCustomerReference, "cus_");
        }
        if (input.orderReference)
            assertCommerceReference(input.orderReference);
        if (input.paymentAttemptReference)
            assertCommerceReference(input.paymentAttemptReference);
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
        const params = {
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
    async createCustomerPortal(input) {
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
    async retrieveAuthoritativeSubscription(input) {
        assertStripeObjectId(input.providerSubscriptionReference, "sub_");
        assertStripeObjectId(input.expectedStripeCustomerReference, "cus_");
        assertCommerceReference(input.expectedCommerceAccountReference);
        const subscription = await this.stripe.retrieveSubscription(input.providerSubscriptionReference);
        if (subscription.livemode) {
            throw new Error("The Stripe test adapter refuses a live-mode Subscription");
        }
        if (stripeObjectReference(subscription.customer) !== input.expectedStripeCustomerReference) {
            throw new Error("Stripe Subscription customer does not match the server-owned account mapping");
        }
        if (subscription.metadata.rillora_commerce_account_reference
            !== input.expectedCommerceAccountReference
            || subscription.metadata.rillora_plan_code !== "family") {
            throw new Error("Stripe Subscription metadata does not match the Rillora commerce account");
        }
        const items = subscription.items.data;
        if (items.length !== 1 || items[0]?.quantity !== 1) {
            throw new Error("Stripe Subscription must contain exactly one Family item with quantity one");
        }
        const item = items[0];
        // Amount changes do not change Family's capability version. Resolve each
        // historical immutable Stripe Price before interpreting its metadata.
        const candidates = [this.config];
        if (familyPriceVersion(this.config) > 1)
            candidates.push({ ...this.config,
                familyPlanVersion: 1, familyPriceVersion: 1, familyPriceIds: historicalFamilyPrices });
        if (familyPriceVersion(this.config) > 2)
            candidates.push({ ...this.config,
                familyPlanVersion: 2, familyPriceVersion: 2, familyPriceIds: previousFamilyPrices });
        if (familyPriceVersion(this.config) > 3)
            candidates.push({ ...this.config,
                familyPlanVersion: 2, familyPriceVersion: 3, familyPriceIds: v3FamilyPrices });
        const subscriptionConfig = candidates.find(candidate => Object.values(candidate.familyPriceIds).includes(item.price.id)
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
            if (!invoiceId)
                throw new Error("An active subscription needs a settled invoice before access");
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
    async retrieveHostedCheckout(id, account) {
        const session = await this.stripe.retrieveCheckoutSession(id);
        if (session.livemode || session.metadata?.rillora_commerce_account_reference !== account)
            throw new Error("Checkout account binding rejected");
        if (session.status !== "open" || !session.url)
            throw new ApiError(409, session.status === "expired" ? "checkout_expired" : "checkout_processing", session.status === "expired" ? "This checkout expired. Close the unfinished checkout, then try again." : "Payment is being confirmed. Refresh your access before continuing.");
        assertStripeHostedUrl(session.url, "checkout.stripe.com");
        return { sessionId: session.id, url: session.url, expiresAt: session.expires_at ? epochSecondsToIso(session.expires_at) : null };
    }
    async expireHostedCheckout(id, account) {
        const current = await this.stripe.retrieveCheckoutSession(id);
        if (current.livemode || current.metadata?.rillora_commerce_account_reference !== account)
            throw new Error("Checkout account binding rejected");
        if (current.status === "expired")
            return;
        if (current.status !== "open")
            throw new ApiError(409, "checkout_processing", "Payment is being confirmed. Refresh your access before continuing.");
        const expired = await this.stripe.expireCheckoutSession(id);
        if (expired.livemode || expired.status !== "expired")
            throw new Error("Checkout expiration was not confirmed");
    }
}
function familyPriceVersion(config) {
    const version = config.familyPriceVersion ?? config.familyPlanVersion ?? 1;
    if (![1, 2, 3, 4].includes(version))
        throw new Error("Unknown Rillora price version");
    return version;
}
export function stripeFamilyPriceCode(config, period) {
    const version = familyPriceVersion(config);
    return `family_usd_${period}_v${version === 4 && period === "monthly" ? 3 : version}`;
}
export function stripeSnapshotPriceId(config, priceCode) {
    for (const period of ["monthly", "annual"]) {
        if (priceCode === stripeFamilyPriceCode(config, period))
            return config.familyPriceIds[period];
        if (familyPriceVersion(config) > 1 && priceCode === `family_usd_${period}_v1`)
            return historicalFamilyPrices[period];
        if (familyPriceVersion(config) > 2 && priceCode === `family_usd_${period}_v2`)
            return previousFamilyPrices[period];
        if (familyPriceVersion(config) > 3 && priceCode === `family_usd_${period}_v3`)
            return v3FamilyPrices[period];
    }
    return null;
}
function assertConfiguredPrice(price, config, period, newPurchase = true) {
    const version = familyPriceVersion(config);
    const expected = version === 4 ? (period === "annual" ? 8899 : 999)
        : version === 3 ? (period === "annual" ? 8880 : 999)
            : version === 2 ? (period === "annual" ? 6800 : 799) : (period === "annual" ? 9900 : 999);
    if (price.livemode || (newPurchase && !price.active) || price.id !== config.familyPriceIds[period]
        || stripeObjectReference(price.product) !== config.familyProductId || price.currency !== "usd"
        || price.unit_amount !== expected || price.recurring?.interval !== (period === "annual" ? "year" : "month")
        || price.recurring.interval_count !== 1)
        throw new Error("Provider price differs from the exact Rillora offer");
}
