import { purchaseConsentContract } from './purchase-consent.js';
import { createHash } from 'node:crypto';
import { ApiError } from './errors.js';
import { createStripeSdkPort } from './stripe-sdk.js';
import { assertCommerceReference, assertIdempotencyKey, assertStripeHostedUrl, assertStripeObjectId, epochSecondsToIso, stripeCommerceAccountReference, stripeCustomerReference, stripeHasScheduledCancellation, stripeIntegrationIdentifier, stripeMetadataValue, stripeObjectReference, stripeRefundReference, stripeSignalType, stripeSubscriptionReference, stripeSubscriptionState, stripeTransactionReference } from './stripe-provider-shared.js';
import { resolveStripeFinancialSignal } from './stripe-financial-resolution.js';
import { readStripeRecoveryFinancialState } from './stripe-recovery-financial-state.js';
/** Production-only provider boundary; market/consent/ledger checks remain in the executor. */
export class StripeProductionAdapter {
    config;
    sdk;
    now;
    constructor(config, sdk = createStripeSdkPort(config.apiKey, 'production'), now = () => new Date()) {
        this.config = config;
        this.sdk = sdk;
        this.now = now;
        if (!config.apiKey.startsWith('rk_live_') || !config.webhookSecret.startsWith('whsec_')
            || config.expectedAccountId !== 'acct_1U6B2RCxTlowhyiG')
            throw new Error('Production Stripe must use the reviewed Rillora account and restricted live credentials');
        assertStripeObjectId(config.familyProductId, 'prod_');
        assertStripeObjectId(config.annualPriceId, 'price_');
        assertStripeObjectId(config.portalConfigurationId, 'bpc_');
        for (const raw of [config.checkoutSuccessUrl, config.checkoutCancelUrl, config.portalReturnUrl]) {
            const url = new URL(raw);
            if (url.origin !== 'https://app.rillora.xyz' || url.username || url.password || url.hash)
                throw new Error('Production billing return URL must remain on the reviewed origin');
        }
        if (!['automatic', 'reviewed_no_collection'].includes(config.tax.mode)
            || !config.tax.assessmentReference.trim() || !config.tax.productTaxCode.startsWith('txcd_'))
            throw new Error('Production billing needs a recorded tax assessment and confirmed product tax code');
        if (config.tax.mode === 'automatic' && config.tax.activeRegistrationIds.length === 0)
            throw new Error('Automatic tax requires confirmed active registration references');
    }
    get currentPrice() {
        return { id: this.config.annualPriceId, priceCode: purchaseConsentContract.priceCode, amountMinor: purchaseConsentContract.amountMinor,
            currency: 'usd', interval: 'year', planVersion: 2 };
    }
    requireLive(value) { if (value !== true)
        throw new Error('Production Stripe refuses test or ambiguous provider objects'); }
    verifyWebhook(body, signature) {
        if (!Buffer.isBuffer(body) || body.length === 0 || body.length > 256 * 1024 || !signature)
            throw new Error('Invalid bounded Stripe webhook input');
        const event = this.sdk.constructWebhookEvent(body, signature, this.config.webhookSecret);
        this.requireLive(event.livemode);
        if (event.account && event.account !== this.config.expectedAccountId)
            throw new Error('Stripe event account mismatch');
        const object = event.data.object;
        return Object.freeze({ provider: 'stripe', providerEnvironment: 'production', providerEventReference: event.id,
            sourceEventType: event.type, signalType: stripeSignalType(event.type), occurredAt: epochSecondsToIso(event.created),
            providerSubscriptionReference: stripeSubscriptionReference(object), providerTransactionReference: stripeTransactionReference(event.type, object),
            providerRefundReference: stripeRefundReference(event.type, object), commerceAccountReference: stripeCommerceAccountReference(object),
            providerCustomerReference: stripeCustomerReference(object), orderReference: stripeMetadataValue(object, 'rillora_order_reference'),
            paymentAttemptReference: stripeMetadataValue(object, 'rillora_payment_attempt_reference'),
            accountBindingReference: this.config.expectedAccountId, payloadSha256: createHash('sha256').update(body).digest('base64url'),
            signatureVerified: true, verificationMode: 'stripe_sdk_webhook_signature', requiresAuthoritativeSnapshot: true });
    }
    async assertCheckoutReady(period) {
        if (period !== 'annual')
            throw new ApiError(409, 'billing_period_unavailable', 'Rillora Family is available as an annual subscription.');
        if (!this.sdk.retrieveAccountStatus || !this.sdk.retrieveProduct)
            throw new Error('Production provider readiness checks are unavailable');
        const account = await this.sdk.retrieveAccountStatus();
        if (account.id !== this.config.expectedAccountId || !account.chargesEnabled || !account.payoutsEnabled)
            throw new ApiError(503, 'checkout_setup_unavailable', 'Checkout is not available yet.');
        const product = await this.sdk.retrieveProduct(this.config.familyProductId);
        if (product.deleted)
            throw new Error('Configured Product was deleted');
        this.requireLive(product.livemode);
        if (!product.active || stripeObjectReference(product.tax_code) !== this.config.tax.productTaxCode)
            throw new Error('Product or tax-code binding changed');
        if (this.config.tax.mode === 'automatic') {
            if (!this.sdk.retrieveTaxReadiness)
                throw new Error('Tax readiness cannot be checked');
            const tax = await this.sdk.retrieveTaxReadiness();
            if (tax.status !== 'active' || !this.config.tax.activeRegistrationIds.every(id => tax.activeRegistrationIds.includes(id)))
                throw new Error('Confirmed tax registrations are no longer active');
        }
        this.validatePrice(await this.sdk.retrievePrice(this.config.annualPriceId), this.currentPrice, true);
    }
    async createHostedSubscriptionCheckout(input) {
        assertCommerceReference(input.commerceAccountReference);
        assertIdempotencyKey(input.idempotencyKey);
        if (!input.orderReference || !input.paymentAttemptReference)
            throw new Error('Production checkout requires a durable order and attempt');
        assertCommerceReference(input.orderReference);
        assertCommerceReference(input.paymentAttemptReference);
        if (input.existingStripeCustomerReference)
            assertStripeObjectId(input.existingStripeCustomerReference, 'cus_');
        await this.assertCheckoutReady(input.billingPeriod);
        const metadata = { rillora_commerce_account_reference: input.commerceAccountReference, rillora_plan_code: 'family',
            rillora_plan_version: 'family-v2', rillora_price_code: purchaseConsentContract.priceCode, rillora_environment: 'production',
            rillora_order_reference: input.orderReference, rillora_payment_attempt_reference: input.paymentAttemptReference };
        const automatic = this.config.tax.mode === 'automatic';
        const session = await this.sdk.createCheckoutSession({ mode: 'subscription', ui_mode: 'hosted_page', origin_context: 'web',
            integration_identifier: stripeIntegrationIdentifier(input.idempotencyKey, 'family_annual'),
            client_reference_id: input.commerceAccountReference, line_items: [{ price: this.config.annualPriceId, quantity: 1 }],
            success_url: this.config.checkoutSuccessUrl, cancel_url: this.config.checkoutCancelUrl,
            allow_promotion_codes: false, automatic_tax: { enabled: automatic }, adaptive_pricing: { enabled: false },
            billing_address_collection: automatic && input.existingStripeCustomerReference ? 'required' : 'auto',
            payment_method_collection: 'always', metadata, subscription_data: { metadata },
            ...(input.existingStripeCustomerReference ? { customer: input.existingStripeCustomerReference,
                ...(automatic ? { customer_update: { address: 'auto' } } : {}) } : {}),
        }, { idempotencyKey: input.idempotencyKey });
        this.requireLive(session.livemode);
        if (session.client_reference_id !== input.commerceAccountReference || session.metadata?.rillora_order_reference !== input.orderReference
            || !session.url)
            throw new Error('Created checkout does not match the reserved order');
        assertStripeHostedUrl(session.url, 'checkout.stripe.com');
        return { sessionId: session.id, url: session.url, expiresAt: session.expires_at ? epochSecondsToIso(session.expires_at) : null };
    }
    async createCustomerPortal(input) {
        assertStripeObjectId(input.stripeCustomerReference, 'cus_');
        const session = await this.sdk.createPortalSession({ customer: input.stripeCustomerReference,
            configuration: this.config.portalConfigurationId, return_url: this.config.portalReturnUrl });
        this.requireLive(session.livemode);
        assertStripeHostedUrl(session.url, 'billing.stripe.com');
        return { sessionId: session.id, url: session.url };
    }
    async retrieveHostedCheckout(id, account) {
        assertStripeObjectId(id, 'cs_');
        assertCommerceReference(account);
        const session = await this.sdk.retrieveCheckoutSession(id);
        this.requireLive(session.livemode);
        if (session.client_reference_id !== account || session.metadata?.rillora_commerce_account_reference !== account)
            throw new Error('Checkout account binding rejected');
        if (session.status !== 'open' || !session.url)
            throw new ApiError(409, session.status === 'expired' ? 'checkout_expired' : 'checkout_processing', 'Refresh your subscription before continuing.');
        assertStripeHostedUrl(session.url, 'checkout.stripe.com');
        return { sessionId: session.id, url: session.url, expiresAt: session.expires_at ? epochSecondsToIso(session.expires_at) : null };
    }
    async expireHostedCheckout(id, account) {
        assertStripeObjectId(id, 'cs_');
        assertCommerceReference(account);
        const session = await this.sdk.retrieveCheckoutSession(id);
        this.requireLive(session.livemode);
        if (session.client_reference_id !== account || session.metadata?.rillora_commerce_account_reference !== account)
            throw new Error('Checkout account binding rejected');
        if (session.status === 'expired')
            return;
        if (session.status !== 'open')
            throw new ApiError(409, 'checkout_processing', 'Payment is being confirmed. Refresh your access.');
        const expired = await this.sdk.expireCheckoutSession(id);
        this.requireLive(expired.livemode);
        if (expired.status !== 'expired')
            throw new Error('Checkout expiration was not confirmed');
    }
    async retrieveAuthoritativeSubscription(input) {
        assertStripeObjectId(input.providerSubscriptionReference, 'sub_');
        assertStripeObjectId(input.expectedStripeCustomerReference, 'cus_');
        assertCommerceReference(input.expectedCommerceAccountReference);
        const subscription = await this.sdk.retrieveSubscription(input.providerSubscriptionReference);
        const observedAt = this.now().toISOString();
        this.requireLive(subscription.livemode);
        if (stripeObjectReference(subscription.customer) !== input.expectedStripeCustomerReference
            || subscription.metadata.rillora_commerce_account_reference !== input.expectedCommerceAccountReference
            || subscription.metadata.rillora_plan_code !== 'family' || subscription.metadata.rillora_environment !== 'production')
            throw new Error('Subscription account/environment binding rejected');
        const item = subscription.items.data[0];
        if (subscription.items.data.length !== 1 || !item || item.quantity !== 1)
            throw new Error('One Family item with quantity one is required');
        const binding = [this.currentPrice, ...this.config.historicalPrices].find(price => price.id === item.price.id);
        if (!binding || subscription.metadata.rillora_plan_version !== 'family-v' + binding.planVersion
            || (subscription.metadata.rillora_price_code && subscription.metadata.rillora_price_code !== binding.priceCode))
            throw new Error('Unknown immutable subscription price');
        this.validatePrice(item.price, binding, false);
        const state = stripeSubscriptionState(subscription), invoiceId = stripeObjectReference(subscription.latest_invoice);
        if (state === 'active' || state === 'cancel_at_period_end') {
            if (!invoiceId)
                throw new Error('Paid invoice evidence is missing');
            const invoice = await this.sdk.retrieveInvoice(invoiceId);
            this.requireLive(invoice.livemode);
            if (invoice.status !== 'paid' || stripeObjectReference(invoice.customer) !== input.expectedStripeCustomerReference
                || stripeObjectReference(invoice.parent?.subscription_details?.subscription) !== subscription.id)
                throw new Error('Subscription payment is not authoritatively settled');
        }
        return { provider: 'stripe', providerEnvironment: 'production', providerSubscriptionReference: subscription.id,
            commerceAccountReference: input.expectedCommerceAccountReference, planCode: 'family', state, observedAt,
            currentPeriodEndsAt: epochSecondsToIso(subscription.status === 'canceled' && subscription.ended_at ? Math.min(item.current_period_end, subscription.ended_at) : item.current_period_end),
            currentPeriodStartsAt: epochSecondsToIso(item.current_period_start), cancelAtPeriodEnd: stripeHasScheduledCancellation(subscription),
            providerCustomerReference: input.expectedStripeCustomerReference, priceCode: binding.priceCode, providerInvoiceReference: invoiceId,
            renewalIsPossible: !['canceled', 'incomplete_expired'].includes(subscription.status), source: 'stripe_api' };
    }
    resolveFinancialSignal(signal) {
        return resolveStripeFinancialSignal(this.sdk, signal, 'production');
    }
    async retrieveRecoverySubscription(input) {
        const snapshot = await this.retrieveAuthoritativeSubscription(input);
        const price = [this.currentPrice, ...this.config.historicalPrices].find(p => p.priceCode === snapshot.priceCode);
        if (!price)
            throw new Error('Recovery price binding is unavailable');
        if (!['active', 'cancel_at_period_end', 'grace'].includes(snapshot.state))
            return { snapshot,
                financial: { override: null, resolvedDispute: false, chargeReference: null }, price, product: this.config.familyProductId };
        if (!snapshot.providerInvoiceReference)
            throw new Error('Recovery requires current invoice evidence');
        const financial = await readStripeRecoveryFinancialState(this.sdk, snapshot.providerInvoiceReference, input.expectedStripeCustomerReference, true);
        const current = await this.retrieveAuthoritativeSubscription(input);
        if (current.providerInvoiceReference !== snapshot.providerInvoiceReference || current.priceCode !== snapshot.priceCode
            || current.state !== snapshot.state || current.currentPeriodStartsAt !== snapshot.currentPeriodStartsAt
            || current.currentPeriodEndsAt !== snapshot.currentPeriodEndsAt || current.cancelAtPeriodEnd !== snapshot.cancelAtPeriodEnd)
            throw new Error('Provider subscription changed during recovery observation');
        return { snapshot: { ...snapshot, state: financial.override ?? snapshot.state, observedAt: this.now().toISOString(),
                ...(financial.override ? { cancelAtPeriodEnd: false } : {}) }, financial, price, product: this.config.familyProductId };
    }
    validatePrice(price, binding, newPurchase) {
        this.requireLive(price.livemode);
        if (price.id !== binding.id || (newPurchase && !price.active) || stripeObjectReference(price.product) !== this.config.familyProductId
            || price.currency !== binding.currency || price.unit_amount !== binding.amountMinor
            || price.billing_scheme !== 'per_unit' || price.transform_quantity !== null || price.recurring?.usage_type !== 'licensed'
            || (newPurchase && !['exclusive', 'inclusive'].includes(price.tax_behavior ?? ''))
            || price.recurring?.interval !== binding.interval || price.recurring.interval_count !== 1)
            throw new Error('Provider price differs from the exact Rillora offer');
    }
}
