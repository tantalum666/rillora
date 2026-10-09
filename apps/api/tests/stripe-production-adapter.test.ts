import Stripe from 'stripe';
import { describe, expect, it, vi } from 'vitest';
import { StripeProductionAdapter, type StripeProductionConfig } from '../src/stripe-production-adapter.js';
import type { StripeSdkPort } from '../src/stripe-sdk.js';
import { stripeSubscriptionReference } from '../src/stripe-provider-shared.js';

const now = new Date('2026-09-25T00:00:00.000Z');
const config = {
  apiKey: 'rk_live_rillora_fixture_not_a_real_key', webhookSecret: 'whsec_rillora_production_fixture_only',
  expectedAccountId: 'acct_1U6B2RCxTlowhyiG', familyProductId: 'prod_fixture_family', annualPriceId: 'price_fixture_annual', historicalPrices: [],
  checkoutSuccessUrl: 'https://app.rillora.xyz/account/billing/complete?session_id={CHECKOUT_SESSION_ID}',
  checkoutCancelUrl: 'https://app.rillora.xyz/account/billing', portalReturnUrl: 'https://app.rillora.xyz/account/billing', portalConfigurationId: 'bpc_fixture',
  tax: { mode: 'reviewed_no_collection', assessmentReference: 'synthetic-assessment-not-a-tax-decision', productTaxCode: 'txcd_fixture', activeRegistrationIds: [] },
} satisfies StripeProductionConfig;
const price = () => ({ id: config.annualPriceId, object: 'price', livemode: true, active: true,
  product: config.familyProductId, currency: 'usd', unit_amount: 8899, billing_scheme: 'per_unit', transform_quantity: null, tax_behavior: 'exclusive', recurring: { interval: 'year', interval_count: 1, usage_type: 'licensed' } }) as Stripe.Price;
const subscription = () => ({ id: 'sub_fixture', object: 'subscription', livemode: true, status: 'active',
  customer: 'cus_fixture', latest_invoice: 'in_fixture', cancel_at_period_end: false, cancel_at: null, pause_collection: null,
  metadata: { rillora_commerce_account_reference: 'account-fixture-001', rillora_plan_code: 'family', rillora_environment: 'production', rillora_plan_version: 'family-v2', rillora_price_code: 'family_usd_annual_v4' },
  items: { data: [{ quantity: 1, price: price(), current_period_start: 1790294400, current_period_end: 1821830400 }] },
}) as unknown as Stripe.Subscription;
const snapshotInput = { providerSubscriptionReference: 'sub_fixture', expectedCommerceAccountReference: 'account-fixture-001', expectedStripeCustomerReference: 'cus_fixture' };

function sdk(overrides: Partial<StripeSdkPort> = {}): StripeSdkPort {
  const unused = async (): Promise<never> => { throw new Error('Unexpected provider call in fixture'); };
  return {
    retrieveAccountStatus: async () => ({ id: config.expectedAccountId, chargesEnabled: true, payoutsEnabled: true }),
    retrieveProduct: async () => ({ id: config.familyProductId, active: true, livemode: true, tax_code: 'txcd_fixture' }) as Stripe.Product,
    retrieveTaxReadiness: async () => ({ status: 'active', activeRegistrationIds: ['taxreg_fixture'] }),
    retrievePrice: async () => price(), retrieveCheckoutSession: unused, expireCheckoutSession: unused,
    createCheckoutSession: async params => ({ id: 'cs_live_fixture', livemode: true, url: 'https://checkout.stripe.com/c/pay/cs_live_fixture', expires_at: 1790298000,
      client_reference_id: params.client_reference_id, metadata: params.metadata }) as Stripe.Checkout.Session,
    createPortalSession: async () => ({ id: 'bps_fixture', livemode: true, url: 'https://billing.stripe.com/p/session/fixture' }) as Stripe.BillingPortal.Session,
    retrieveRefund: unused, retrieveDispute: unused, retrieveCharge: unused, listInvoicePaymentsByPaymentIntent: unused,
    retrieveInvoice: async () => ({ id: 'in_fixture', status: 'paid', livemode: true, customer: 'cus_fixture', parent: { subscription_details: { subscription: 'sub_fixture' } } }) as Stripe.Invoice,
    retrieveSubscription: async () => subscription(), constructWebhookEvent: () => { throw new Error('Signature verifier required'); },
    ...overrides,
  };
}
const checkoutInput = { commerceAccountReference: 'account-fixture-001', billingPeriod: 'annual' as const,
  idempotencyKey: 'server-owned-order-fixture-001', orderReference: 'order-fixture-001', paymentAttemptReference: 'attempt-fixture-001' };

describe('production Stripe boundary without live network access', () => {
  it('refuses wrong-account/test credentials and non-production return destinations', () => {
    for (const mutation of [{ apiKey: 'rk_test_fixture' }, { expectedAccountId: 'acct_other' },
      { checkoutCancelUrl: 'https://app.staging.rillora.xyz/account' }, { portalReturnUrl: 'https://user:password@app.rillora.xyz/account' }]) {
      expect(() => new StripeProductionAdapter({ ...config, ...mutation }, sdk())).toThrow();
    }
  });
  it('creates only the exact annual offer after provider readiness and durable reservation', async () => {
    const create = vi.fn(sdk().createCheckoutSession), provider = sdk({ createCheckoutSession: create });
    const adapter = new StripeProductionAdapter(config, provider, () => now);
    await adapter.createHostedSubscriptionCheckout(checkoutInput);
    expect(create.mock.calls[0]![0]).toMatchObject({ mode: 'subscription', line_items: [{ price: config.annualPriceId, quantity: 1 }],
      automatic_tax: { enabled: false }, metadata: { rillora_environment: 'production', rillora_order_reference: checkoutInput.orderReference } });
    expect(create.mock.calls[0]![0]).not.toHaveProperty('payment_method_types');
    expect(create.mock.calls[0]![1]).toEqual({ idempotencyKey: checkoutInput.idempotencyKey });
    await expect(adapter.createHostedSubscriptionCheckout({ ...checkoutInput, billingPeriod: 'monthly' })).rejects.toMatchObject({ code: 'billing_period_unavailable' });
    const { orderReference: _orderReference, ...unreserved } = checkoutInput;
    await expect(adapter.createHostedSubscriptionCheckout(unreserved)).rejects.toThrow('durable order');
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('keeps an unconfigured tax state available for notifications but rejects purchases before provider calls',async()=>{
    const create=vi.fn(sdk().createCheckoutSession),account=vi.fn(sdk().retrieveAccountStatus!);
    const pending={...config,tax:{mode:'not_configured' as const,productTaxCode:'txcd_fixture'}};
    const adapter=new StripeProductionAdapter(pending,sdk({createCheckoutSession:create,retrieveAccountStatus:account}));
    await expect(adapter.createHostedSubscriptionCheckout(checkoutInput)).rejects.toMatchObject({status:503,code:'checkout_setup_unavailable'});
    expect(create).not.toHaveBeenCalled();expect(account).not.toHaveBeenCalled();
  });
  it('blocks unready merchants, other accounts and altered price before checkout creation', async () => {
    for (const overrides of [
      { retrieveAccountStatus: async () => ({ id: config.expectedAccountId, chargesEnabled: false, payoutsEnabled: true }) },
      { retrieveAccountStatus: async () => ({ id: 'acct_other', chargesEnabled: true, payoutsEnabled: true }) },
      { retrieveAccountStatus: async () => ({ id: config.expectedAccountId, chargesEnabled: true, payoutsEnabled: false }) },
      { retrievePrice: async () => ({ ...price(), livemode: false }) },
      { retrievePrice: async () => ({ ...price(), unit_amount: 6800 }) },
      { retrievePrice: async () => ({ ...price(), transform_quantity: { divide_by: 2, round: 'up' as const } }) },
      { retrievePrice: async () => ({ ...price(), tax_behavior: 'unspecified' as const }) },
    ]) {
      const create = vi.fn(sdk().createCheckoutSession);
      const adapter = new StripeProductionAdapter(config, sdk({ ...overrides, createCheckoutSession: create }), () => now);
      await expect(adapter.createHostedSubscriptionCheckout(checkoutInput)).rejects.toThrow();
      expect(create).not.toHaveBeenCalled();
    }
  });
  it('requires confirmed active tax registrations and refreshes returning customer address', async () => {
    const automatic = { ...config, tax: { ...config.tax, mode: 'automatic', activeRegistrationIds: ['taxreg_fixture'] } } satisfies StripeProductionConfig;
    expect(() => new StripeProductionAdapter({ ...automatic, tax: { ...automatic.tax, activeRegistrationIds: [] } }, sdk())).toThrow('registration');
    const create = vi.fn(sdk().createCheckoutSession);
    await expect(new StripeProductionAdapter(automatic, sdk({ createCheckoutSession: create, retrieveTaxReadiness: async () => ({ status: 'active', activeRegistrationIds: [] }) })).createHostedSubscriptionCheckout(checkoutInput)).rejects.toThrow('no longer active');
    expect(create).not.toHaveBeenCalled();
    await new StripeProductionAdapter(automatic, sdk({ createCheckoutSession: create })).createHostedSubscriptionCheckout({ ...checkoutInput, existingStripeCustomerReference: 'cus_fixture' });
    expect(create.mock.calls[0]![0]).toMatchObject({ automatic_tax: { enabled: true }, billing_address_collection: 'required', customer_update: { address: 'auto' } });
  });
  it('verifies signatures, rejects test events and handles asynchronous outcomes as signals only', () => {
    const stripe = new Stripe(config.apiKey);
    const adapter = new StripeProductionAdapter(config, sdk({ constructWebhookEvent: (body, header, secret) => stripe.webhooks.constructEvent(body, header, secret, undefined, undefined, now.getTime()) }));
    for (const type of ['checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed']) {
      const body = JSON.stringify({ id: 'evt_fixture', object: 'event', type, created: now.getTime() / 1000, livemode: true,
        data: { object: { id: 'cs_live_fixture', object: 'checkout.session', subscription: 'sub_fixture', customer_email: 'private@example.invalid' } } });
      const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret: config.webhookSecret, timestamp: now.getTime() / 1000 });
      const result = adapter.verifyWebhook(Buffer.from(body), header);
      expect(result).toMatchObject({ providerEnvironment: 'production', providerSubscriptionReference: 'sub_fixture', providerTransactionReference: 'cs_live_fixture', requiresAuthoritativeSnapshot: true });
      expect(result.signalType).not.toBe('unsupported'); expect(JSON.stringify(result)).not.toContain('private@example');
      expect(() => adapter.verifyWebhook(Buffer.from(body + ' '), header)).toThrow();
      const testBody = body.replace('"livemode":true', '"livemode":false');
      const testHeader = stripe.webhooks.generateTestHeaderString({ payload: testBody, secret: config.webhookSecret, timestamp: now.getTime() / 1000 });
      expect(() => adapter.verifyWebhook(Buffer.from(testBody), testHeader)).toThrow('refuses test');
    }
  });
  it('requires settled invoice plus exact customer/environment/price before an active snapshot', async () => {
    const adapter = new StripeProductionAdapter(config, sdk(), () => now);
    await expect(adapter.retrieveAuthoritativeSubscription(snapshotInput)).resolves.toMatchObject({ providerEnvironment: 'production', state: 'active', priceCode: 'family_usd_annual_v4' });
    for (const overrides of [
      { retrieveInvoice: async () => ({ status: 'open', livemode: true }) as Stripe.Invoice },
      { retrieveSubscription: async () => ({ ...subscription(), livemode: false }) },
      { retrieveSubscription: async () => ({ ...subscription(), customer: 'cus_other' }) },
      { retrieveSubscription: async () => ({ ...subscription(), items: { data: [{ ...subscription().items.data[0], quantity: 2 }] } }) as Stripe.Subscription },
    ]) await expect(new StripeProductionAdapter(config, sdk(overrides)).retrieveAuthoritativeSubscription(snapshotInput)).rejects.toThrow();
  });
  it('retains an explicitly bound88.80 receipt after the new88.99 offer replaces it', async () => {
    const historic = {...config,historicalPrices:[{id:'price_old_v3',priceCode:'family_usd_annual_v3',amountMinor:8880,currency:'usd' as const,interval:'year' as const,planVersion:2}]};
    const old=subscription();old.metadata.rillora_price_code='family_usd_annual_v3';
    old.items.data[0]!.price={...price(),id:'price_old_v3',unit_amount:8880,active:false};
    await expect(new StripeProductionAdapter(historic,sdk({retrieveSubscription:async()=>old})).retrieveAuthoritativeSubscription(snapshotInput)).resolves.toMatchObject({priceCode:'family_usd_annual_v3'});
    const create=vi.fn(sdk().createCheckoutSession);
    await expect(new StripeProductionAdapter(config,sdk({createCheckoutSession:create,retrievePrice:async()=>({...price(),unit_amount:8880})})).createHostedSubscriptionCheckout(checkoutInput)).rejects.toThrow('price differs');
    expect(create).not.toHaveBeenCalled();
  });
  it('gives first-class invoice lineage precedence over optional metadata fallback', () => {
    expect(stripeSubscriptionReference({ object: 'invoice', metadata: { rillora_subscription_reference: 'sub_wrong' }, parent: { subscription_details: { subscription: 'sub_right' } } })).toBe('sub_right');
    expect(stripeSubscriptionReference({ metadata: { rillora_subscription_reference: 'sub_fallback' } })).toBe('sub_fallback');
  });
  it('dates the subscription observation before a delayed invoice response', async () => {
    let resume!: () => void, entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { resume = resolve; });
    let clock = now;
    const provider = sdk();
    const adapter = new StripeProductionAdapter(config, sdk({ retrieveInvoice: async id => {
      entered(); await gate; return provider.retrieveInvoice(id);
    } }), () => clock);
    const pending = adapter.retrieveAuthoritativeSubscription(snapshotInput);
    await started; clock = new Date(now.getTime() + 10_000); resume();
    expect((await pending).observedAt).toBe(now.toISOString());
  });

});
