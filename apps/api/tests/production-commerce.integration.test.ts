import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from './http-fixture.js';
import { createApp } from '../src/app.js';
import { createPool, type DatabasePool } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import type { AppConfig } from '../src/config.js';
import { StripeCommerceExecutor, type StripeCommerceProvider } from '../src/stripe-commerce-executor.js';
import { productionExecutionConfig } from '../src/stripe-execution-config.js';
import type { StripeProductionConfig } from '../src/stripe-production-adapter.js';
import { currentLegalContract } from '../src/legal-contract.js';
import { purchaseConsentContract } from '../src/purchase-consent.js';
import Stripe from 'stripe';
import type { StripeSdkPort } from '../src/stripe-sdk.js';
import { resolveStripeFinancialSignal } from '../src/stripe-financial-resolution.js';

// A dedicated local test database. Never accept a remote database override.
const databaseUrl = dedicatedTestDatabaseUrl('postgresql://127.0.0.1:5432/continuity_production_commerce_test', 'continuity_production_commerce_test');
const plannerPublicId = '77777777-7777-4777-8777-777777777777';
const billing: StripeProductionConfig = {
  apiKey: 'rk_live_production_integration_fixture_only', webhookSecret: 'whsec_production_integration_fixture_only',
  expectedAccountId: 'acct_1U6B2RCxTlowhyiG', familyProductId: 'prod_production_fixture', annualPriceId: 'price_production_fixture', historicalPrices: [],
  checkoutSuccessUrl: 'https://app.rillora.xyz/account/billing/complete?session_id={CHECKOUT_SESSION_ID}',
  checkoutCancelUrl: 'https://app.rillora.xyz/account/billing', portalReturnUrl: 'https://app.rillora.xyz/account/billing', portalConfigurationId: 'bpc_production_fixture',
  tax: { mode: 'reviewed_no_collection', assessmentReference: 'synthetic-fixture-not-a-tax-assessment', productTaxCode: 'txcd_fixture', activeRegistrationIds: [] },
};
const config: AppConfig = {
  nodeEnv: 'test', host: '127.0.0.1', port: 4180, database: { connectionString: databaseUrl, sslMode: 'disable', sslCaPath: null },
  corsOrigins: new Set(['http://localhost:4173']), allowDevAuth: true, allowSyntheticRecipientRehearsal: false,
  allowStripeTestIntegration: false, databasePoolMax: 3, databaseConnectionTimeoutMs: 5000, trustProxyHops: 0,
  sessionTtlMinutes: 480, sessionIdleMinutes: 30, authTransactionTtlSeconds: 600, dataRegion: 'eu-central-1',
  oidc: null, nativeOidc: null, stripeTest: null, appleSandbox: null,
  stripeProductionSecretArn: 'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/stripe-billing-FIXTUR',
  stripeProductionCheckoutEnabled: true,
};
const consent = { ...purchaseConsentContract, acceptedSubscriptionTerms: true, acceptedAnnualRenewal: true, acknowledgedCancellation: true };
let captured: Parameters<StripeCommerceProvider['createHostedSubscriptionCheckout']>[0];
let invoiceReference = 'in_local_fixture', refundInvoiceReference = 'in_local_fixture';
const currentState: { value: 'active' | 'cancel_at_period_end' | 'expired_read_only'; mayRenew: boolean | null } = { value: 'active', mayRenew: null };
const checkoutCall = vi.fn<StripeCommerceProvider['createHostedSubscriptionCheckout']>(async input => {
  captured = input; return { sessionId: 'cs_live_local_fixture', url: 'https://checkout.stripe.com/c/pay/cs_live_local_fixture', expiresAt: null };
});
const readyCall = vi.fn(async () => {});
const provider: StripeCommerceProvider = {
  assertCheckoutReady: readyCall, createHostedSubscriptionCheckout: checkoutCall,
  retrieveHostedCheckout: async () => ({ sessionId: 'cs_live_local_fixture', url: 'https://checkout.stripe.com/c/pay/cs_live_local_fixture', expiresAt: null }),
  expireHostedCheckout: async () => {},
  createCustomerPortal: async () => ({ sessionId: 'bps_local_fixture', url: 'https://billing.stripe.com/p/session/fixture' }),
  verifyWebhook: body => {
    const input = JSON.parse(body.toString());
    return { provider: 'stripe', providerEnvironment: input.environment ?? 'production', providerEventReference: input.id,
      sourceEventType: input.financial ? 'charge.refunded' : 'customer.subscription.updated', signalType: input.financial ? 'refund_changed' : 'subscription_changed', occurredAt: new Date().toISOString(),
      providerSubscriptionReference: 'sub_local_fixture', providerTransactionReference: 'cs_live_local_fixture', providerRefundReference: null,
      commerceAccountReference: captured.commerceAccountReference, providerCustomerReference: 'cus_local_fixture',
      orderReference: captured.orderReference ?? null, paymentAttemptReference: captured.paymentAttemptReference ?? null,
      accountBindingReference: billing.expectedAccountId, payloadSha256: createHash('sha256').update(body).digest('base64url'),
      signatureVerified: true, verificationMode: 'stripe_sdk_webhook_signature', requiresAuthoritativeSnapshot: true };
  },
  resolveFinancialSignal: async () => ({providerInvoiceReference:refundInvoiceReference,providerSubscriptionReference:'sub_local_fixture',providerCustomerReference:'cus_local_fixture',providerTransactionReference:'ch_local_fixture',providerRefundReference:'re_local_fixture',authoritativeStateOverride:'refunded'}),
  retrieveAuthoritativeSubscription: async input => ({ provider: 'stripe', providerEnvironment: 'production', providerSubscriptionReference: input.providerSubscriptionReference,
    commerceAccountReference: input.expectedCommerceAccountReference, providerCustomerReference: input.expectedStripeCustomerReference,
    planCode: 'family', priceCode: 'family_usd_annual_v4', state: currentState.value, observedAt: new Date().toISOString(),
    currentPeriodStartsAt: new Date(Date.now() - 86400000).toISOString(), currentPeriodEndsAt: new Date(Date.now() + (currentState.value === 'expired_read_only' ? -1000 : 365 * 86400000)).toISOString(),
    cancelAtPeriodEnd: currentState.value === 'cancel_at_period_end', renewalIsPossible: currentState.mayRenew ?? (currentState.value !== 'expired_read_only'),
    providerInvoiceReference: invoiceReference, source: 'stripe_api' }),
};
let pool: DatabasePool, app: ReturnType<typeof createApp>, executor: StripeCommerceExecutor;
const postCheckout = (proof: unknown = consent, key = 'production-fixture-idempotency-001') => request(app)
  .post('/api/v1/commerce/stripe/checkout').set('x-dev-planner-id', plannerPublicId).set('idempotency-key', key)
  .send({ billingPeriod: 'annual', purchaseConsent: proof });

describe('production commerce ledger with a synthetic provider only', () => {
  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: new URL('/postgres', databaseUrl).href }); await admin.connect();
    try { if (!(await admin.query("select 1 from pg_database where datname='continuity_production_commerce_test'")).rowCount) await admin.query('create database continuity_production_commerce_test'); }
    finally { await admin.end(); }
    await assertDedicatedTestDatabase(databaseUrl, 'continuity_production_commerce_test');
    await runMigrations(databaseUrl); pool = createPool(config);
    await pool.query('truncate app.commerce_provider_event_inbox,app.planners restart identity cascade');
    await pool.query("update app.commerce_market_policies set sales_enabled=false,status='configured_disabled'");
    await pool.query("update app.commerce_runtime_policy set production_entitlements_enabled=false");
    const planner = await pool.query("insert into app.planners(public_id,display_name,locale,time_zone,residence_country_code) values($1,'Production billing fixture','en','UTC','US') returning id", [plannerPublicId]);
    await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2)",[planner.rows[0].id]);
    executor = new StripeCommerceExecutor(pool, productionExecutionConfig(billing), provider);
    app = createApp(pool, config, { stripeProductionConfig: billing, stripeExecutor: executor });
  });
  afterAll(async () => { await pool?.end(); });

  it('accepts signed notification-only traffic without exposing quotes, purchases or bypassing authentication',async()=>{
    const pending={...billing,tax:{mode:'not_configured' as const,productTaxCode:'txcd_fixture'}};
    const receiver=createApp(pool,{...config,stripeProductionCheckoutEnabled:false},{stripeProductionConfig:pending});
    await request(receiver).get('/api/v1/commerce/stripe/status').expect(401);
    await request(receiver).get('/api/v1/commerce/stripe/status').set('x-dev-planner-id',plannerPublicId).expect(200);
    await request(receiver).get('/api/v1/commerce/stripe/quote').set('x-dev-planner-id',plannerPublicId).expect(503);
    await request(receiver).post('/api/v1/commerce/stripe/checkout').set('x-dev-planner-id',plannerPublicId)
      .set('idempotency-key','notifications-cannot-purchase-001').send({billingPeriod:'annual',purchaseConsent:consent}).expect(503);
    const body=JSON.stringify({id:'evt_notifications_only_fixture',object:'event',type:'product.updated',created:Math.floor(Date.now()/1000),livemode:true,
      data:{object:{id:billing.familyProductId,object:'product'}}});
    const signature=Stripe.webhooks.generateTestHeaderString({payload:body,secret:billing.webhookSecret});
    const result=await request(receiver).post('/commerce/stripe/webhook').set('content-type','application/json').set('stripe-signature',signature).send(body).expect(200);
    expect(result.body).toMatchObject({received:true,status:'ignored',testOnly:false});
    await request(receiver).post('/commerce/stripe/webhook').set('content-type','application/json').set('stripe-signature',signature).send(body+' ').expect(400);
    const testBody=body.replace('"livemode":true','"livemode":false');
    const testSignature=Stripe.webhooks.generateTestHeaderString({payload:testBody,secret:billing.webhookSecret});
    await request(receiver).post('/commerce/stripe/webhook').set('content-type','application/json').set('stripe-signature',testSignature).send(testBody).expect(400);
    expect((await pool.query('select count(*)::int as count from app.commerce_orders')).rows[0].count).toBe(0);
    expect(checkoutCall).not.toHaveBeenCalled();
  });

  it('requires authentication and separate exact purchase consent; registration consent is insufficient', async () => {
    await request(app).get('/api/v1/commerce/stripe/quote').expect(401);
    await request(app).get('/api/v1/commerce/stripe/quote').set('x-dev-planner-id', plannerPublicId).expect(200);
    await postCheckout({ ...currentLegalContract, acceptedTerms: true, acknowledgedPrivacy: true, acceptedElectronicRecords: true }).expect(400);
    await postCheckout({ ...consent, amountMinor: 6800 }).expect(400);
    await postCheckout({ ...consent, acceptedAnnualRenewal: false }).expect(400);
    expect(checkoutCall).not.toHaveBeenCalled();
  });
  it('keeps new sales closed before any provider call or order creation', async () => {
    const result = await postCheckout().expect(409); expect(result.body.error.code).toBe('billing_closed');
    expect(readyCall).not.toHaveBeenCalled(); expect(checkoutCall).not.toHaveBeenCalled();
    expect((await pool.query('select count(*)::int as count from app.commerce_orders')).rows[0].count).toBe(0);
  });
  it('reserves one production order and immutable consent before checkout; return does not grant access', async () => {
    // Activation below exists only in this local synthetic database, never AWS.
    await pool.query("update app.commerce_operating_planes set status='active' where code='global'");
    await pool.query("update app.commerce_operators set status='active' where operating_plane_code='global'");
    await pool.query("update app.commerce_market_policies set sales_enabled=true,status='active' where service_market_code='GLOBAL_US'");
    await pool.query("update app.commerce_storefront_policies set status='active' where client_surface='web'");
    await pool.query("update app.commerce_purchase_route_policies set enabled=true,status='active' where policy_code='global_us_web_stripe_v1'");
    await pool.query("update app.commerce_plan_versions set status='active' where plan_code='family' and version=2");
    await pool.query("update app.commerce_plan_capabilities set enforcement_mode='included' where plan_version_id in(select id from app.commerce_plan_versions where plan_code='family' and version=2)");
    await pool.query("update app.commerce_prices set status='active',tax_behavior='exclusive' where price_code='family_usd_annual_v4'");
    await pool.query("update app.commerce_runtime_policy set production_entitlements_enabled=true,sharing_limits_enabled=true");
    await pool.query(`insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,external_product_reference,status,provider_account_reference,external_parent_product_reference)
      select id,'stripe','production',$1,'active',$2,$3 from app.commerce_prices where price_code='family_usd_annual_v4'
      on conflict(provider_code,provider_environment,external_product_reference) do update set status='active'`,[billing.annualPriceId,billing.expectedAccountId,billing.familyProductId]);
    checkoutCall.mockImplementationOnce(async input => { captured = input; throw new Error('synthetic ambiguous provider transport failure'); });
    await postCheckout().expect(500);
    // A subscription event may learn the new Customer before the lost response
    // is retried. Preserve the first request's absence of a pre-existing Customer.
    await pool.query("insert into app.commerce_provider_customers(planner_id,commerce_account_id,provider_code,provider_environment,provider_customer_reference,status) select planner_id,id,'stripe','production','cus_local_fixture','active' from app.commerce_accounts where public_id=$1",[captured.commerceAccountReference]);
    const result = await postCheckout().expect(201);
    expect(checkoutCall.mock.calls[0]![0]).toEqual(checkoutCall.mock.calls[1]![0]);
    expect(checkoutCall.mock.calls[1]![0].existingStripeCustomerReference).toBeUndefined();
    expect(result.body.checkout.testOnly).toBe(false); expect(result.body.boundaries.callbackGrantsAccess).toBe(false);
    const retry = await postCheckout().expect(201); expect(retry.body.checkout.orderReference).toBe(result.body.checkout.orderReference);
    expect(checkoutCall).toHaveBeenCalledTimes(2);
    const counts = (await pool.query('select (select count(*) from app.commerce_orders)::int as orders,(select count(*) from app.commerce_purchase_consents)::int as consents,(select count(*) from app.commerce_entitlement_grants)::int as grants')).rows[0];
    expect(counts.orders).toBe(1); expect(counts.consents).toBe(1); expect(counts.grants).toBe(0);
    await request(app).post('/api/v1/commerce/test/checkout').set('x-dev-planner-id',plannerPublicId).send({billingPeriod:'annual'}).expect(404);
  });
  it('reconciles a fast verified webhook through the owned consent, then deduplicates and rejects cross-environment events', async () => {
    await pool.query("delete from app.commerce_provider_object_links where provider_code='stripe' and provider_environment='production'");
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_production_fixture'}).expect(200);
    await request(app).post('/api/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_production_fixture'}).expect(200);
    expect((await pool.query("select count(*)::int as count from app.commerce_subscriptions where provider_environment='production'")).rows[0].count).toBe(1);
    expect((await pool.query('select count(*)::int as count from app.commerce_provider_events')).rows[0].count).toBe(1);
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBeGreaterThan(0);
    const finished = await postCheckout().expect(409); expect(finished.body.error.code).toBe('checkout_finished');
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_cross_environment',environment:'test'}).expect(400);
    expect((await pool.query('select count(*)::int as count from app.commerce_provider_events')).rows[0].count).toBe(1);
    const duplicate = await postCheckout(consent,'production-another-idempotency-002').expect(409); expect(duplicate.body.error.code).toBe('existing_subscription');
  });
  it('keeps already purchased management available while new sales are closed', async () => {
    await pool.query("update app.commerce_market_policies set sales_enabled=false,status='configured_disabled'");
    await request(app).post('/api/v1/commerce/stripe/portal').set('x-dev-planner-id',plannerPublicId).send({}).expect(201);
    await postCheckout(consent,'production-after-close-003').expect(409);
  });
  it('retains paid-period access on cancellation and revokes future entitlement after expiry', async () => {
    currentState.value = 'cancel_at_period_end';
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_cancel_at_end'}).expect(200);
    const canceled = (await pool.query("select state,cancel_at_period_end from app.commerce_subscriptions where provider_environment='production'")).rows[0];
    expect(canceled).toMatchObject({state:'cancel_at_period_end',cancel_at_period_end:true});
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBeGreaterThan(0);
    currentState.value = 'expired_read_only';
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_expired'}).expect(200);
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBe(0);
  });
  it('does not sell a second subscription when an expired read-only provider subscription can resume renewal', async () => {
    await pool.query("update app.commerce_market_policies set sales_enabled=true,status='active' where service_market_code='GLOBAL_US'");
    currentState.mayRenew = true;
    const response = await postCheckout(consent,'production-paused-renewal-004').expect(409);
    expect(response.body.error.code).toBe('existing_subscription');
    expect(checkoutCall).toHaveBeenCalledTimes(2);
    const status = await request(app).get('/api/v1/commerce/stripe/status').set('x-dev-planner-id',plannerPublicId).expect(200);
    expect(status.body).toMatchObject({testOnly:false,canManage:true,subscription:{state:'expired_read_only'}});
    expect(JSON.stringify(status.body)).not.toContain('cus_local_fixture');
  });
  it('retries a verified transient failure from minimal inbox metadata without a raw webhook or a second grant', async () => {
    const fetch = vi.spyOn(provider, 'retrieveAuthoritativeSubscription');
    fetch.mockRejectedValueOnce(new Error('synthetic provider timeout'));
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_transient_failure'}).expect(500);
    const failure = (await pool.query("select processing_status from app.commerce_provider_event_inbox where provider_event_reference='evt_transient_failure'")).rows[0];
    expect(failure.processing_status).toBe('failed');
    await pool.query("update app.commerce_provider_event_inbox set last_attempt_at=now()-interval '6 minutes' where provider_event_reference='evt_transient_failure'");
    await expect(executor.retryPendingProviderEvents()).resolves.toEqual({attempted:1,applied:1,failed:0});
    await expect(executor.retryPendingProviderEvents()).resolves.toEqual({attempted:0,applied:0,failed:0});
    expect((await pool.query("select count(*)::int as count from app.commerce_provider_events where provider_event_reference='evt_transient_failure'")).rows[0].count).toBe(1);
    fetch.mockRestore();
  });

  it('removes access after a confirmed full refund for the current invoice without canceling the provider by inference', async () => {
    currentState.value = 'active'; currentState.mayRenew = true;
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_renewed_fixture'}).expect(200);
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBeGreaterThan(0);
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_full_refund',financial:true}).expect(200);
    expect((await pool.query("select state from app.commerce_subscriptions where provider_environment='production'")).rows[0].state).toBe('refunded');
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBe(0);
    const duplicate = await postCheckout(consent,'production-after-refund-005').expect(409);
    expect(duplicate.body.error.code).toBe('existing_subscription');
  });
  it('does not remove a newly paid period when an older invoice refund arrives late', async () => {
    invoiceReference = 'in_new_paid_period';
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_next_paid_period'}).expect(200);
    await request(app).post('/commerce/stripe/webhook').set('stripe-signature','synthetic-fixture').send({id:'evt_old_refund_arrives_late',financial:true}).expect(200);
    expect((await pool.query("select state,provider_invoice_reference from app.commerce_subscriptions where provider_environment='production'")).rows[0]).toMatchObject({state:'active',provider_invoice_reference:'in_new_paid_period'});
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBeGreaterThan(0);
  });

  it('persists a freshly confirmed nonrenewing termination for later cross-channel checks',async()=>{
    currentState.value='expired_read_only';currentState.mayRenew=false;
    checkoutCall.mockImplementationOnce(async input=>{
      captured=input;return {sessionId:'cs_live_ended_fixture',url:'https://checkout.stripe.com/c/pay/cs_live_ended_fixture',expiresAt:null};
    });
    await postCheckout(consent,'production-after-fully-ended-006').expect(201);
    expect((await pool.query("select state,renewal_is_possible,grace_ends_at from app.commerce_subscriptions where provider_subscription_reference='sub_local_fixture'")).rows[0])
      .toMatchObject({state:'expired_read_only',renewal_is_possible:false,grace_ends_at:null});
  });

  it('owns subscription reads through commit and retries concurrent cancellation without resurrecting access', async () => {
    const original = provider.retrieveAuthoritativeSubscription;
    let entered!: () => void, resume!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const invoice = new Promise<void>(resolve => { resume = resolve; });
    let calls = 0;
    const observation = vi.spyOn(provider, 'retrieveAuthoritativeSubscription').mockImplementation(async input => {
      calls++;
      const snapshot = await original(input);
      if (calls === 1) { entered(); await invoice; }
      return { ...snapshot, observedAt: new Date().toISOString() };
    });
    currentState.value = 'active'; currentState.mayRenew = true;
    invoiceReference = 'in_concurrent_paid_renewal';
    const event = (id: string) => executor.acceptWebhook(Buffer.from(JSON.stringify({ id })), 'fixture');
    try {
      const older = event('evt_slow_active');
      await started;
      currentState.value = 'expired_read_only'; currentState.mayRenew = false;
      await expect(event('evt_concurrent_cancel')).rejects.toMatchObject({ code: 'subscription_observation_busy' });
      expect(calls).toBe(1); // second worker cannot even read a competing provider snapshot
      resume(); await older;
      await expect(event('evt_concurrent_cancel')).resolves.toMatchObject({ status: 'applied' });
      const final = (await pool.query("select state,renewal_is_possible from app.commerce_subscriptions where provider_subscription_reference='sub_local_fixture'")).rows[0];
      expect(final).toMatchObject({ state: 'expired_read_only', renewal_is_possible: false });
      expect((await pool.query("select count(*)::int as n from app.commerce_entitlement_grants where revoked_at is null and (expires_at is null or expires_at>now()) and subscription_id in(select id from app.commerce_subscriptions where provider_subscription_reference='sub_local_fixture')")).rows[0].n).toBe(0);
    } finally { resume(); observation.mockRestore(); }
  });

  it('keeps the dispute reference for the fresh locked read and reconciles dispute recovery', async () => {
    currentState.value = 'active'; currentState.mayRenew = true;
    invoiceReference = 'in_dispute_current';
    let status: Stripe.Dispute.Status = 'under_review';
    let resolveBeforeLockedRead = true;
    const retrieveDispute = vi.fn(async (id: string) => {
      expect(id).toBe('du_current_fixture');
      const result = { id, charge: 'ch_dispute_fixture', payment_intent: 'pi_dispute_fixture',
        livemode: true, status } as Stripe.Dispute;
      if (resolveBeforeLockedRead) status = 'won';
      return result;
    });
    const sdk = {
      retrieveDispute,
      retrieveCharge: async () => ({ id: 'ch_dispute_fixture', livemode: true,
        customer: 'cus_local_fixture', payment_intent: 'pi_dispute_fixture', amount: 8899, amount_refunded: 0 }),
      listInvoicePaymentsByPaymentIntent: async () => ({ has_more: false,
        data: [{ livemode: true, invoice: invoiceReference }] }),
      retrieveInvoice: async () => ({ id: invoiceReference, livemode: true, customer: 'cus_local_fixture',
        parent: { subscription_details: { subscription: 'sub_local_fixture' } } }),
    } as unknown as StripeSdkPort;
    const disputeProvider: StripeCommerceProvider = {
      ...provider,
      verifyWebhook(body, signature) {
        return { ...provider.verifyWebhook(body, signature), sourceEventType: 'charge.dispute.updated',
          signalType: 'dispute_changed', providerTransactionReference: 'du_current_fixture', providerRefundReference: null };
      },
      resolveFinancialSignal: signal => resolveStripeFinancialSignal(sdk, signal, 'production'),
    };
    const disputes = new StripeCommerceExecutor(pool, productionExecutionConfig(billing), disputeProvider);
    const receive = (id: string) => disputes.acceptWebhook(Buffer.from(JSON.stringify({ id })), 'fixture');
    const subscription = async () => (await pool.query("select state,financial_state_override from app.commerce_subscriptions where provider_subscription_reference='sub_local_fixture'")).rows[0];

    await expect(receive('evt_dispute_resolved_during_lookup')).resolves.toMatchObject({ status: 'applied' });
    expect(retrieveDispute).toHaveBeenCalledTimes(2);
    expect(await subscription()).toMatchObject({ state: 'active', financial_state_override: null });

    resolveBeforeLockedRead = false; status = 'under_review';
    await receive('evt_dispute_under_review');
    expect(await subscription()).toMatchObject({ state: 'revoked', financial_state_override: 'revoked' });
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBe(0);

    status = 'won';
    await receive('evt_dispute_won');
    expect(await subscription()).toMatchObject({ state: 'active', financial_state_override: null });
    expect((await pool.query('select count(*)::int as count from app.commerce_entitlement_grants where revoked_at is null')).rows[0].count).toBeGreaterThan(0);
    const calls = retrieveDispute.mock.calls.length;
    await expect(receive('evt_dispute_won')).resolves.toMatchObject({ status: 'duplicate' });
    expect(retrieveDispute).toHaveBeenCalledTimes(calls);
  });

});
