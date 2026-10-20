import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import type { StripeTestConfig } from "../src/config.js";
import {
  StripeTestAdapter,
  stripeSnapshotPriceId,
  stripeSubscriptionState,
  type StripeSdkPort,
} from "../src/stripe-test-adapter.js";

const now = new Date("2026-08-19T16:00:00.000Z");
const webhookSecret = "whsec_rillora_official_fixture_0001";
const config = Object.freeze({
  apiKey: "rk_test_rillora_fixture_key_0001",
  webhookSecret,
  integrationEnvironment: "test",
  expectedAccountId: "acct_1U6B2RCxTlowhyiG",
  familyProductId: "prod_V6O8lAFbTCDmKd",
  familyPriceIds: Object.freeze({
    monthly: "price_1U6BMoCxTlowhyiG7qsmBrdY",
    annual: "price_1U6BMnCxTlowhyiGJEC1w596",
  }),
  checkoutSuccessUrl:
    "https://app.staging.rillora.xyz/account/billing/complete?session_id={CHECKOUT_SESSION_ID}",
  checkoutCancelUrl: "https://app.staging.rillora.xyz/account/billing",
  portalReturnUrl: "https://app.staging.rillora.xyz/account/billing",
} satisfies StripeTestConfig);

describe("official Stripe test adapter", () => {
  it.each([['en', 'en'], ['zh-CN', 'zh']] as const)('keeps %s through test Checkout and Portal', async (locale, stripeLocale) => {
    const checkout = vi.fn(async (_params: Stripe.Checkout.SessionCreateParams) => checkoutSession());
    const portal = vi.fn(async (_params: Stripe.BillingPortal.SessionCreateParams) => ({
      id: 'bps_test_language', livemode: false, url: 'https://billing.stripe.com/p/session/test_language',
    }) as Stripe.BillingPortal.Session);
    const adapter = new StripeTestAdapter(config, fakeStripePort({ createCheckoutSession: checkout, createPortalSession: portal }), () => now);
    await adapter.createHostedSubscriptionCheckout({ commerceAccountReference: 'commerce-account-global-001',
      billingPeriod: 'annual', idempotencyKey: 'selected-language-fixture-001', locale });
    await adapter.createCustomerPortal({ stripeCustomerReference: 'cus_rillora_test_001', locale });
    expect(checkout.mock.calls[0]![0]).toMatchObject({ locale: stripeLocale,
      line_items: [{ price: config.familyPriceIds.annual, quantity: 1 }], adaptive_pricing: { enabled: false } });
    expect(portal.mock.calls[0]![0]).toMatchObject({ locale: stripeLocale, customer: 'cus_rillora_test_001' });
  });
  it("uses Web88.99 v4 for new annual checkout and rejects a v4 monthly purchase", async () => {
    const current = { ...config, familyPlanVersion: 2, familyPriceVersion: 4,
      familyPriceIds: { annual: "price_new_annual_v4", monthly: "price_1UHMlhCxTlowhyiGvBEPdb4x" } };
    const create = vi.fn(async (_params: Stripe.Checkout.SessionCreateParams) => checkoutSession());
    const adapter = new StripeTestAdapter(current, fakeStripePort({ createCheckoutSession: create,
      retrievePrice: async id => ({ ...priceFixture(id), unit_amount: 8899, recurring: {interval:"year",interval_count:1} }) as Stripe.Price }), () => now);
    const input = {commerceAccountReference:"commerce-account-global-001",billingPeriod:"annual" as const,idempotencyKey:"owner-price-v4-annual-001"};
    await adapter.createHostedSubscriptionCheckout(input);
    expect(create.mock.calls[0]![0].metadata).toMatchObject({rillora_plan_version:"family-v2",rillora_price_code:"family_usd_annual_v4"});
    await expect(adapter.createHostedSubscriptionCheckout({...input,billingPeriod:"monthly"})).rejects.toMatchObject({code:"billing_period_unavailable"});
    expect(create).toHaveBeenCalledTimes(1);
    const old = subscriptionFixture();
    old.metadata.rillora_plan_version="family-v2";old.metadata.rillora_price_code="family_usd_annual_v3";
    old.items.data[0]!.price = {...old.items.data[0]!.price,id:"price_1UHMkTCxTlowhyiGu3do5wps",unit_amount:8880,active:false,recurring:{interval:"year",interval_count:1}} as Stripe.Price;
    const reader = new StripeTestAdapter(current,fakeStripePort({retrieveSubscription:async()=>old}),()=>now);
    await expect(reader.retrieveAuthoritativeSubscription({providerSubscriptionReference:old.id,expectedCommerceAccountReference:"commerce-account-global-001",expectedStripeCustomerReference:"cus_rillora_test_001"})).resolves.toMatchObject({priceCode:"family_usd_annual_v3"});
    expect(stripeSnapshotPriceId(current,"family_usd_annual_v3")).toBe("price_1UHMkTCxTlowhyiGu3do5wps");
    expect(stripeSnapshotPriceId(current,"family_usd_monthly_v3")).toBe("price_1UHMlhCxTlowhyiGvBEPdb4x");
  });

  it("changes price to88.80/9.99 without changing Family capability version2", async () => {
    const current = { ...config, familyPlanVersion: 2, familyPriceVersion: 3,
      familyPriceIds: { annual: "price_new_annual_v3", monthly: "price_new_monthly_v3" } };
    const createCheckoutSession = vi.fn(async (_params: Stripe.Checkout.SessionCreateParams) => checkoutSession());
    const provider = fakeStripePort({ createCheckoutSession, retrievePrice: async id => ({
      ...priceFixture(id), unit_amount: id === current.familyPriceIds.annual ? 8880 : 999,
      recurring: { interval: id === current.familyPriceIds.annual ? "year" : "month", interval_count: 1 },
    }) as Stripe.Price });
    const adapter = new StripeTestAdapter(current, provider, () => now);
    for (const billingPeriod of ["annual", "monthly"] as const) {
      await adapter.createHostedSubscriptionCheckout({ commerceAccountReference: "commerce-account-global-001",
        billingPeriod, idempotencyKey: "owner-price-v3-verification-" + billingPeriod });
    }
    expect(createCheckoutSession.mock.calls.map(call => call[0].metadata)).toEqual([
      expect.objectContaining({ rillora_plan_version: "family-v2", rillora_price_code: "family_usd_annual_v3" }),
      expect.objectContaining({ rillora_plan_version: "family-v2", rillora_price_code: "family_usd_monthly_v3" }),
    ]);
    const mismatch = new StripeTestAdapter(current, fakeStripePort({ createCheckoutSession,
      retrievePrice: async id => ({ ...priceFixture(id), unit_amount: 6800 }) }), () => now);
    await expect(mismatch.createHostedSubscriptionCheckout({ commerceAccountReference: "commerce-account-global-001",
      billingPeriod: "annual", idempotencyKey: "owner-price-v3-mismatch-annual" })).rejects.toThrow("price differs");
    expect(createCheckoutSession).toHaveBeenCalledTimes(2);
  });
  it("keeps previous68/7.99 subscriptions on their original immutable price after repricing", async () => {
    const current = { ...config, familyPlanVersion: 2, familyPriceVersion: 3,
      familyPriceIds: { annual: "price_new_annual_v3", monthly: "price_new_monthly_v3" } };
    const previous = subscriptionFixture();
    previous.metadata.rillora_plan_version = "family-v2";
    previous.metadata.rillora_price_code = "family_usd_monthly_v2";
    previous.items.data[0]!.price = { ...previous.items.data[0]!.price,
      id: "price_1UGKadCxTlowhyiGJ0bnY9Kn", unit_amount: 799 };
    const adapter = new StripeTestAdapter(current, fakeStripePort({ retrieveSubscription: async () => previous }), () => now);
    await expect(adapter.retrieveAuthoritativeSubscription({ providerSubscriptionReference: previous.id,
      expectedCommerceAccountReference: "commerce-account-global-001", expectedStripeCustomerReference: "cus_rillora_test_001" }))
      .resolves.toMatchObject({ priceCode: "family_usd_monthly_v2" });
    expect(stripeSnapshotPriceId(current, "family_usd_monthly_v2")).toBe("price_1UGKadCxTlowhyiGJ0bnY9Kn");
    expect(stripeSnapshotPriceId(current, "family_usd_monthly_v1")).toBe(config.familyPriceIds.monthly);
    previous.metadata.rillora_price_code = "family_usd_monthly_v3";
    await expect(adapter.retrieveAuthoritativeSubscription({ providerSubscriptionReference: previous.id,
      expectedCommerceAccountReference: "commerce-account-global-001", expectedStripeCustomerReference: "cus_rillora_test_001" }))
      .rejects.toThrow("immutable Price");
  });
  it("reports an unavailable price lookup before creating a payment session", async () => {
    const createCheckoutSession = vi.fn(async () => checkoutSession());
    const adapter = new StripeTestAdapter(config, fakeStripePort({ createCheckoutSession, retrievePrice: async () => { throw new Error("Provider permission unavailable"); } }), () => now);
    await expect(adapter.createHostedSubscriptionCheckout({ commerceAccountReference:"commerce-account-global-001", billingPeriod:"annual",idempotencyKey:"price-lookup-unavailable-001" })).rejects.toMatchObject({ status:503,code:"checkout_setup_unavailable" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });
  it("checks the current 68/7.99 amount before creating a checkout and requires a settled invoice", async () => {
    const createCheckoutSession = vi.fn(async (_params: Stripe.Checkout.SessionCreateParams) => checkoutSession());
    const current = { ...config, familyPlanVersion: 2 };
    const provider = fakeStripePort({ createCheckoutSession, retrievePrice: async id => ({ ...priceFixture(id), unit_amount: id === config.familyPriceIds.annual ? 6800 : 799 }) });
    const adapter = new StripeTestAdapter(current, provider, () => now);
    await adapter.createHostedSubscriptionCheckout({ commerceAccountReference: "commerce-account-global-001", billingPeriod: "annual", idempotencyKey: "current-quote-verification-0001" });
    expect(createCheckoutSession.mock.calls[0]?.[0]).toMatchObject({ metadata: { rillora_plan_version: "family-v2", rillora_price_code: "family_usd_annual_v2" } });
    const mismatched = new StripeTestAdapter(current, fakeStripePort({ createCheckoutSession, retrievePrice: async id => priceFixture(id) }), () => now);
    await expect(mismatched.createHostedSubscriptionCheckout({ commerceAccountReference: "commerce-account-global-001", billingPeriod: "annual", idempotencyKey: "wrong-quote-verification-0001" })).rejects.toThrow("price differs");
    expect(createCheckoutSession).toHaveBeenCalledTimes(1);
    const unsettled = new StripeTestAdapter(config, fakeStripePort({ retrieveSubscription: async () => subscriptionFixture(), retrieveInvoice: async () => ({ status: "open", livemode: false }) as Stripe.Invoice }), () => now);
    await expect(unsettled.retrieveAuthoritativeSubscription({ providerSubscriptionReference: "sub_rillora_test_001", expectedCommerceAccountReference: "commerce-account-global-001", expectedStripeCustomerReference: "cus_rillora_test_001" })).rejects.toThrow("not yet authoritatively settled");
  });
  it("uses the official SDK signature verifier and retains only a normalized test signal", () => {
    const rawBody = Buffer.from(JSON.stringify({
      id: "evt_official_subscription_updated",
      object: "event",
      type: "customer.subscription.updated",
      created: Math.floor(now.getTime() / 1_000),
      livemode: false,
      data: {
        object: {
          id: "sub_rillora_test_001",
          object: "subscription",
          customer_email: "must-not-be-retained@example.invalid",
        },
      },
    }));
    const stripe = new Stripe("sk_test_signature_fixture_0001");
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: rawBody.toString("utf8"),
      secret: webhookSecret,
      timestamp: Math.floor(now.getTime() / 1_000),
    });
    const adapter = new StripeTestAdapter(config, fakeStripePort({
      constructWebhookEvent: (body, header, secret) =>
        stripe.webhooks.constructEvent(
          body,
          header,
          secret,
          undefined,
          undefined,
          now.getTime(),
        ),
    }), () => now);

    const signal = adapter.verifyWebhook(rawBody, signature);
    expect(signal).toEqual(expect.objectContaining({
      provider: "stripe",
      providerEnvironment: "test",
      providerEventReference: "evt_official_subscription_updated",
      providerSubscriptionReference: "sub_rillora_test_001",
      signalType: "subscription_changed",
      signatureVerified: true,
      verificationMode: "stripe_sdk_webhook_signature",
      requiresAuthoritativeSnapshot: true,
    }));
    expect(signal.payloadSha256).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(signal)).not.toContain("customer_email");
    expect(JSON.stringify(signal)).not.toContain("example.invalid");
  });

  it("rejects tampering, live-mode deliveries and bodies outside the bounded raw-body contract", () => {
    const stripe = new Stripe("sk_test_signature_fixture_0001");
    const payload = JSON.stringify({
      id: "evt_official_paid",
      object: "event",
      type: "invoice.paid",
      created: Math.floor(now.getTime() / 1_000),
      livemode: false,
      data: { object: { id: "in_test_001", subscription: "sub_rillora_test_001" } },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
      timestamp: Math.floor(now.getTime() / 1_000),
    });
    const adapter = new StripeTestAdapter(config, fakeStripePort({
      constructWebhookEvent: (body, header, secret) =>
        stripe.webhooks.constructEvent(
          body,
          header,
          secret,
          undefined,
          undefined,
          now.getTime(),
        ),
    }), () => now);

    expect(() => adapter.verifyWebhook(Buffer.from(`${payload} `), signature)).toThrow();
    expect(() => adapter.verifyWebhook(Buffer.alloc(256 * 1024 + 1), signature))
      .toThrow("size boundary");

    const livePayload = payload.replace('"livemode":false', '"livemode":true');
    const liveSignature = stripe.webhooks.generateTestHeaderString({
      payload: livePayload,
      secret: webhookSecret,
      timestamp: Math.floor(now.getTime() / 1_000),
    });
    expect(() => adapter.verifyWebhook(Buffer.from(livePayload), liveSignature))
      .toThrow("refuses live-mode events");
  });

  it("creates a server-priced, account-specific, idempotent hosted Checkout", async () => {
    const createCheckoutSession = vi.fn(async (
      _params: Stripe.Checkout.SessionCreateParams,
      _options: Stripe.RequestOptions,
    ) => checkoutSession());
    const adapter = new StripeTestAdapter(config, fakeStripePort({
      createCheckoutSession,
    }), () => now);

    const result = await adapter.createHostedSubscriptionCheckout({
      commerceAccountReference: "commerce-account-global-001",
      billingPeriod: "annual",
      idempotencyKey: "checkout:commerce-account-global-001:annual:0001",
      orderReference: "order-reference-global-0001",
      paymentAttemptReference: "attempt-reference-global-0001",
    });

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        ui_mode: "hosted_page",
        integration_identifier: expect.stringMatching(/^rillora_phase1c_[a-z]{8}$/),
        line_items: [{ price: config.familyPriceIds.annual, quantity: 1 }],
        allow_promotion_codes: false,
        automatic_tax: { enabled: false },
        success_url: config.checkoutSuccessUrl,
        cancel_url: config.checkoutCancelUrl,
        client_reference_id: "commerce-account-global-001",
        metadata: expect.objectContaining({
          rillora_environment: "test",
          rillora_plan_code: "family",
          rillora_price_code: "family_usd_annual_v1",
          rillora_order_reference: "order-reference-global-0001",
          rillora_payment_attempt_reference: "attempt-reference-global-0001",
        }),
        subscription_data: {
          metadata: expect.objectContaining({
            rillora_commerce_account_reference: "commerce-account-global-001",
          }),
        },
      }),
      { idempotencyKey: "checkout:commerce-account-global-001:annual:0001" },
    );
    expect(createCheckoutSession.mock.calls[0]?.[0]).not.toHaveProperty("payment_method_types");
    expect(result).toEqual({
      sessionId: "cs_test_rillora_001",
      url: "https://checkout.stripe.com/c/pay/cs_test_rillora_001",
      expiresAt: "2026-08-19T17:00:00.000Z",
    });
  });

  it("refuses a broad test secret before constructing the official SDK port", () => {
    expect(() => new StripeTestAdapter({
      ...config,
      apiKey: "sk_test_broad_fixture_key_0001",
    })).toThrow("restricted test-mode API key");
  });

  it("creates the Portal only for a server-supplied Customer mapping and a fixed return URL", async () => {
    const createPortalSession = vi.fn(async () => ({
      id: "bps_test_rillora_001",
      object: "billing_portal.session",
      configuration: "bpc_test_001",
      created: Math.floor(now.getTime() / 1_000),
      customer: "cus_rillora_test_001",
      customer_account: null,
      flow: null,
      livemode: false,
      locale: "auto",
      on_behalf_of: null,
      return_url: config.portalReturnUrl,
      url: "https://billing.stripe.com/p/session/rillora-test",
    }) as Stripe.BillingPortal.Session);
    const adapter = new StripeTestAdapter(config, fakeStripePort({ createPortalSession }), () => now);

    const result = await adapter.createCustomerPortal({
      stripeCustomerReference: "cus_rillora_test_001",
    });
    expect(createPortalSession).toHaveBeenCalledWith({
      customer: "cus_rillora_test_001",
      return_url: config.portalReturnUrl,
    });
    expect(result.url).toBe("https://billing.stripe.com/p/session/rillora-test");
    await expect(adapter.createCustomerPortal({
      stripeCustomerReference: "attacker-controlled-customer",
    })).rejects.toThrow("cus_");
  });

  it("resolves a successful full Refund through Invoice Payments to its Subscription", async () => {
    const adapter = new StripeTestAdapter(config, fakeStripePort({
      retrieveRefund: async () => ({
        id: "re_rillora_test_001",
        object: "refund",
        status: "succeeded",
        amount: 999,
        charge: "ch_rillora_test_001",
        payment_intent: "pi_rillora_test_001",
      }) as unknown as Stripe.Refund,
      retrieveCharge: async () => ({
        id: "ch_rillora_test_001",
        object: "charge",
        livemode: false,
        amount: 999,
        amount_refunded: 999,
        refunded: true,
        currency: 'usd',
        customer: "cus_rillora_test_001",
        payment_intent: "pi_rillora_test_001",
      }) as Stripe.Charge,
      listRefundsByCharge: async () => ({ has_more: false, data: [
        { id: 're_rillora_test_001', charge: 'ch_rillora_test_001', amount: 999, currency: 'usd', status: 'succeeded' },
      ] }) as Stripe.ApiList<Stripe.Refund>,
      listInvoicePaymentsByPaymentIntent: async () => ({
        object: "list",
        has_more: false,
        url: "/v1/invoice_payments",
        data: [{
          id: "inpay_rillora_test_001",
          object: "invoice_payment",
          amount_paid: 999,
          amount_requested: 999,
          created: Math.floor(now.getTime() / 1_000),
          currency: "usd",
          invoice: "in_rillora_test_001",
          is_default: true,
          livemode: false,
          payment: { type: "payment_intent", payment_intent: "pi_rillora_test_001" },
          status: "paid",
          status_transitions: { canceled_at: null, paid_at: Math.floor(now.getTime() / 1_000) },
        }],
      }) as Stripe.ApiList<Stripe.InvoicePayment>,
      retrieveInvoice: async () => ({
        id: "in_rillora_test_001",
        object: "invoice",
        livemode: false,
        customer: "cus_rillora_test_001",
        parent: {
          type: "subscription_details",
          quote_details: null,
          subscription_details: {
            metadata: null,
            subscription: "sub_rillora_test_001",
          },
        },
      }) as Stripe.Invoice,
    }), () => now);

    await expect(adapter.resolveFinancialSignal({
      signalType: "refund_changed",
      providerTransactionReference: null,
      providerRefundReference: "re_rillora_test_001",
    })).resolves.toEqual({
      providerSubscriptionReference: "sub_rillora_test_001",
      providerCustomerReference: "cus_rillora_test_001",
      providerTransactionReference: "ch_rillora_test_001",
      providerRefundReference: "re_rillora_test_001",
      authoritativeStateOverride: "refunded",
      providerInvoiceReference: "in_rillora_test_001",
    });
  });

  it("resolves an open Dispute through Invoice Payments to a revoked Subscription snapshot", async () => {
    const adapter = new StripeTestAdapter(config, fakeStripePort({
      retrieveDispute: async () => ({
        id: "du_rillora_test_001",
        object: "dispute",
        livemode: false,
        status: "needs_response",
        charge: "ch_rillora_test_002",
        payment_intent: "pi_rillora_test_002",
      }) as unknown as Stripe.Dispute,
      retrieveCharge: async () => ({
        id: "ch_rillora_test_002",
        object: "charge",
        livemode: false,
        amount: 999,
        amount_refunded: 0,
        refunded: false,
        customer: "cus_rillora_test_001",
        payment_intent: "pi_rillora_test_002",
      }) as Stripe.Charge,
      listInvoicePaymentsByPaymentIntent: async () => ({
        object: "list",
        has_more: false,
        url: "/v1/invoice_payments",
        data: [{
          id: "inpay_rillora_test_002",
          object: "invoice_payment",
          amount_paid: 999,
          amount_requested: 999,
          created: Math.floor(now.getTime() / 1_000),
          currency: "usd",
          invoice: "in_rillora_test_002",
          is_default: true,
          livemode: false,
          payment: { type: "payment_intent", payment_intent: "pi_rillora_test_002" },
          status: "paid",
          status_transitions: { canceled_at: null, paid_at: Math.floor(now.getTime() / 1_000) },
        }],
      }) as Stripe.ApiList<Stripe.InvoicePayment>,
      retrieveInvoice: async () => ({
        id: "in_rillora_test_002",
        object: "invoice",
        livemode: false,
        customer: "cus_rillora_test_001",
        parent: {
          type: "subscription_details",
          quote_details: null,
          subscription_details: {
            metadata: null,
            subscription: "sub_rillora_test_002",
          },
        },
      }) as Stripe.Invoice,
    }), () => now);

    await expect(adapter.resolveFinancialSignal({
      signalType: "dispute_changed",
      providerTransactionReference: "du_rillora_test_001",
      providerRefundReference: null,
    })).resolves.toEqual({
      providerSubscriptionReference: "sub_rillora_test_002",
      providerCustomerReference: "cus_rillora_test_001",
      providerTransactionReference: "ch_rillora_test_002",
      providerRefundReference: null,
      authoritativeStateOverride: "revoked",
      providerInvoiceReference: "in_rillora_test_002",
    });
  });

  it("retrieves and binds the authoritative Subscription before producing an access snapshot", async () => {
    const retrieveSubscription = vi.fn(async () => subscriptionFixture());
    const adapter = new StripeTestAdapter(config, fakeStripePort({ retrieveSubscription }), () => now);

    const snapshot = await adapter.retrieveAuthoritativeSubscription({
      providerSubscriptionReference: "sub_rillora_test_001",
      expectedCommerceAccountReference: "commerce-account-global-001",
      expectedStripeCustomerReference: "cus_rillora_test_001",
    });
    expect(snapshot).toEqual({
      provider: "stripe",
      providerEnvironment: "test",
      providerSubscriptionReference: "sub_rillora_test_001",
      commerceAccountReference: "commerce-account-global-001",
      planCode: "family",
      state: "active",
      observedAt: now.toISOString(),
      currentPeriodEndsAt: "2026-09-19T16:00:00.000Z",
      cancelAtPeriodEnd: false,
      source: "stripe_api",
      currentPeriodStartsAt: "2026-08-19T16:00:00.000Z",
      providerCustomerReference: "cus_rillora_test_001",
      priceCode: "family_usd_monthly_v1",
      providerInvoiceReference: "in_paid_test",
      renewalIsPossible: true,
    });

    const scheduledCancellation = new StripeTestAdapter(config, fakeStripePort({
      retrieveSubscription: async () => subscriptionFixture({
        cancel_at: Math.floor(new Date("2026-09-19T16:00:00.000Z").getTime() / 1_000),
        cancel_at_period_end: false,
      }),
    }), () => now);
    await expect(scheduledCancellation.retrieveAuthoritativeSubscription({
      providerSubscriptionReference: "sub_rillora_test_001",
      expectedCommerceAccountReference: "commerce-account-global-001",
      expectedStripeCustomerReference: "cus_rillora_test_001",
    })).resolves.toMatchObject({
      state: "cancel_at_period_end",
      cancelAtPeriodEnd: true,
    });

    const wrongMetadata = subscriptionFixture({
      metadata: {
        rillora_commerce_account_reference: "commerce-account-attacker-001",
        rillora_plan_code: "family",
        rillora_plan_version: "family-v1",
      },
    });
    const rejecting = new StripeTestAdapter(config, fakeStripePort({
      retrieveSubscription: async () => wrongMetadata,
    }), () => now);
    await expect(rejecting.retrieveAuthoritativeSubscription({
      providerSubscriptionReference: "sub_rillora_test_001",
      expectedCommerceAccountReference: "commerce-account-global-001",
      expectedStripeCustomerReference: "cus_rillora_test_001",
    })).rejects.toThrow("metadata does not match");
  });

  it("maps paid and non-paid Subscription states conservatively and refuses an unapproved trial", () => {
    expect(stripeSubscriptionState(subscriptionFixture())).toBe("active");
    expect(stripeSubscriptionState(subscriptionFixture({ cancel_at_period_end: true })))
      .toBe("cancel_at_period_end");
    expect(stripeSubscriptionState(subscriptionFixture({
      cancel_at: Math.floor(new Date("2026-09-19T16:00:00.000Z").getTime() / 1_000),
      cancel_at_period_end: false,
    }))).toBe("cancel_at_period_end");
    expect(stripeSubscriptionState(subscriptionFixture({ status: "past_due" }))).toBe("past_due");
    expect(stripeSubscriptionState(subscriptionFixture({ status: "unpaid" }))).toBe("past_due");
    expect(stripeSubscriptionState(subscriptionFixture({ status: "incomplete" })))
      .toBe("expired_read_only");
    expect(stripeSubscriptionState(subscriptionFixture({ status: "paused" })))
      .toBe("expired_read_only");
    expect(stripeSubscriptionState(subscriptionFixture({
      status: "active",
      pause_collection: { behavior: "void", resumes_at: null },
    }))).toBe("expired_read_only");
    expect(() => stripeSubscriptionState(subscriptionFixture({ status: "trialing" })))
      .toThrow("no-trial launch policy");
  });
});

function fakeStripePort(overrides: Partial<StripeSdkPort> = {}): StripeSdkPort {
  const unavailable = async (): Promise<never> => {
    throw new Error("Unexpected Stripe network operation in unit test");
  };
  return {
    createCheckoutSession: unavailable,
    createPortalSession: unavailable,
    retrieveRefund: unavailable,
    retrieveDispute: unavailable,
    retrieveCharge: unavailable,
    listInvoicePaymentsByPaymentIntent: unavailable,
    retrieveInvoice: async () => ({ id: 'in_paid_test', object: 'invoice', livemode: false, status: 'paid', customer: 'cus_rillora_test_001', parent: { type: 'subscription_details', subscription_details: { subscription: 'sub_rillora_test_001' } } }) as Stripe.Invoice,
    retrievePrice: async id => priceFixture(id),
    retrieveCheckoutSession: unavailable,
    expireCheckoutSession: unavailable,
    retrieveSubscription: unavailable,
    constructWebhookEvent() {
      throw new Error("Unexpected Stripe webhook verification in unit test");
    },
    ...overrides,
  };
}

function checkoutSession(): Stripe.Checkout.Session {
  return {
    id: "cs_test_rillora_001",
    object: "checkout.session",
    livemode: false,
    url: "https://checkout.stripe.com/c/pay/cs_test_rillora_001",
    expires_at: Math.floor(new Date("2026-08-19T17:00:00.000Z").getTime() / 1_000),
  } as Stripe.Checkout.Session;
}

function subscriptionFixture(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: "sub_rillora_test_001",
    object: "subscription",
    livemode: false,
    customer: "cus_rillora_test_001",
    status: "active",
    cancel_at: null,
    cancel_at_period_end: false,
    pause_collection: null,
    latest_invoice: "in_paid_test",
    metadata: {
      rillora_commerce_account_reference: "commerce-account-global-001",
      rillora_plan_code: "family",
      rillora_plan_version: "family-v1",
    },
    items: {
      object: "list",
      has_more: false,
      url: "/v1/subscription_items?subscription=sub_rillora_test_001",
      data: [{
        id: "si_rillora_test_001",
        object: "subscription_item",
        current_period_start: Math.floor(new Date("2026-08-19T16:00:00.000Z").getTime() / 1_000),
        current_period_end: Math.floor(new Date("2026-09-19T16:00:00.000Z").getTime() / 1_000),
        price: priceFixture(config.familyPriceIds.monthly),
        quantity: 1,
      }],
    },
    ...overrides,
  } as Stripe.Subscription;
}

function priceFixture(id: string): Stripe.Price {
 const annual = id === config.familyPriceIds.annual;
 return { id, object: 'price', product: config.familyProductId, active: true, livemode: false, currency: 'usd', unit_amount: annual ? 9900 : 999,
   recurring: { interval: annual ? 'year' : 'month', interval_count: 1 } } as Stripe.Price;
}
