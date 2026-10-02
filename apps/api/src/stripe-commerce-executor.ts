import { recordSubscriptionObservation, persistReconciliation } from './commerce-subscription-ledger.js';
import { assertNoForeignPurchase, assertFamilyPriceReady } from './commerce-purchase-conflicts.js';
import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { executionSnapshotPriceId, stripeExecutionEnvironment, type StripeExecutionConfig } from "./stripe-execution-config.js";
import { parsePurchaseConsent, purchaseConsentDigest, type PurchaseConsent } from "./purchase-consent.js";
import {
  reconcileCommerceProviderState,
} from "./commerce-reconciliation.js";
import type {
  AuthoritativeSubscriptionSnapshot,
  NormalizedProviderSignal,
} from "./commerce-provider-contract.js";
import {
  withCommerceAccountDatabase,
  withCommerceInboxDatabase,
  withCommercePlannerDatabase,
  type DatabasePool,
} from "./db.js";
import { ApiError } from "./errors.js";
import { stripeFamilyPriceCode } from "./stripe-test-adapter.js";
import type {
  StripeBillingPeriod,
  StripeCheckoutResult,
  StripeFinancialSignalResolution,
  StripePortalResult,
} from "./stripe-test-adapter.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  createCustomerPortal(input: { stripeCustomerReference: string }): Promise<StripePortalResult>;
  resolveFinancialSignal?(signal: Pick<
    NormalizedProviderSignal,
    "signalType" | "providerTransactionReference" | "providerRefundReference"
  >): Promise<StripeFinancialSignalResolution>;
  retrieveAuthoritativeSubscription(input: {
    providerSubscriptionReference: string;
    expectedCommerceAccountReference: string;
    expectedStripeCustomerReference: string;
  }): Promise<AuthoritativeSubscriptionSnapshot>;
}>;

type CheckoutReservation = Readonly<{
  commerceAccountReference: string;
  orderReference: string;
  paymentAttemptReference: string;
  providerIdempotencyKey: string;
  existingStripeCustomerReference: string | null;
  existingCheckoutReference: string | null;
}>;

type InboxReservation = Readonly<{
  publicId: string;
  processingStatus: string;
}>;

export class StripeCommerceExecutor {
  constructor(
    private readonly pool: DatabasePool,
    private readonly config: StripeExecutionConfig,
    private readonly provider: StripeCommerceProvider,
  ) { stripeExecutionEnvironment(config); }

  get providerEnvironment(): "test" | "production" { return stripeExecutionEnvironment(this.config); }

  async createCheckout(input: {
    plannerId: string;
    billingPeriod: StripeBillingPeriod;
    idempotencySeed: string;
    purchaseConsent?: PurchaseConsent;
  }): Promise<StripeCheckoutResult & {
    orderReference: string;
    paymentAttemptReference: string;
    testOnly: boolean;
    salesEnabled: boolean;
  }> {
    if (input.billingPeriod !== "annual") {
      throw new ApiError(409, "billing_period_unavailable",
        "Rillora Family is available as an annual subscription. Existing subscriptions can still be managed.");
    }
    if (this.providerEnvironment === "production") {
      parsePurchaseConsent(input.purchaseConsent);
      await withCommercePlannerDatabase(this.pool, input.plannerId, assertProductionSalesReady);
    }
    // Configuration failures should be discovered before reserving an order.
    // Once provider submission may have happened, retain the durable reservation
    // and the same idempotency key even if a later request's preflight fails.
    await this.provider.assertCheckoutReady?.(input.billingPeriod);
    const reservation = await withCommercePlannerDatabase(
      this.pool,
      input.plannerId,
      (client) => reserveCheckout(
        client,
        input.billingPeriod,
        providerIdempotencyKey(input.plannerId, input.billingPeriod, input.idempotencySeed, this.providerEnvironment),
        this.config,
        this.provider,
        input.purchaseConsent,
      ),
    );

    const checkout = reservation.existingCheckoutReference && this.provider.retrieveHostedCheckout
      ? await this.provider.retrieveHostedCheckout(reservation.existingCheckoutReference, reservation.commerceAccountReference)
      : await this.provider.createHostedSubscriptionCheckout({
      commerceAccountReference: reservation.commerceAccountReference,
      billingPeriod: input.billingPeriod,
      idempotencyKey: reservation.providerIdempotencyKey,
      orderReference: reservation.orderReference,
      paymentAttemptReference: reservation.paymentAttemptReference,
      ...(reservation.existingStripeCustomerReference
        ? { existingStripeCustomerReference: reservation.existingStripeCustomerReference }
        : {}),
    });

    await withCommercePlannerDatabase(this.pool, input.plannerId, async (client) => {
      const attempt = await client.query(
        `update app.commerce_payment_attempts
         set provider_payment_reference = $2,
             status = case when status='created' then 'submitted' else status end, updated_at = now()
         where public_id = $1::uuid and (provider_payment_reference is null or provider_payment_reference=$2)
         returning id`,
        [reservation.paymentAttemptReference, checkout.sessionId],
      );
      if (attempt.rowCount !== 1) throw new Error("Reserved Stripe payment attempt was not found");
      await client.query(
        `update app.commerce_orders
         set status = case when status='created' then 'pending' else status end, updated_at = now()
         where public_id = $1::uuid`,
        [reservation.orderReference],
      );
      await insertProviderObjectLink(client, this.providerEnvironment, {
        objectType: "checkout_session",
        objectReference: checkout.sessionId,
        commerceAccountReference: reservation.commerceAccountReference,
        orderReference: reservation.orderReference,
        paymentAttemptReference: reservation.paymentAttemptReference,
      });
    });

    return Object.freeze({
      ...checkout,
      orderReference: reservation.orderReference,
      paymentAttemptReference: reservation.paymentAttemptReference,
      testOnly: this.providerEnvironment === "test",
      salesEnabled: this.providerEnvironment === "production",
    });
  }

  async createPortal(plannerId: string): Promise<StripePortalResult & { testOnly: boolean }> {
    const customerReference = await withCommercePlannerDatabase(
      this.pool,
      plannerId,
      async (client) => {
        const result = await client.query<{ provider_customer_reference: string }>(
          `select customer.provider_customer_reference
           from app.commerce_provider_customers customer
           join app.commerce_accounts account
             on account.id = customer.commerce_account_id
            and account.planner_id = customer.planner_id
           where customer.planner_id = app.current_planner_id()
             and account.service_market_code = 'GLOBAL_US'
             and customer.provider_code = 'stripe'
             and customer.provider_environment = '${this.providerEnvironment}'
             and customer.status = 'active'
           limit 1`,
        );
        return result.rows[0]?.provider_customer_reference ?? null;
      },
    );
    if (!customerReference) {
      throw new ApiError(
        409,
        this.providerEnvironment === "test" ? "stripe_test_customer_missing" : "stripe_customer_missing",
        "No reconciled billing account exists for this account.",
      );
    }
    return Object.freeze({
      ...(await this.provider.createCustomerPortal({
        stripeCustomerReference: customerReference,
      })),
      testOnly: this.providerEnvironment === "test",
    });
  }
  async cancelPendingCheckout(plannerId: string): Promise<void> {
    if (!this.provider.expireHostedCheckout) throw new ApiError(503, "checkout_cancel_unavailable", "Checkout could not be canceled. Try again.");
    await withCommercePlannerDatabase(this.pool, plannerId, async client => {
      await client.query("select pg_advisory_xact_lock(hashtextextended('checkout:' || app.current_planner_id()::text,0))");
      const pending = await client.query<{ id: string; order_id: string; provider_payment_reference: string | null; account_reference: string }>(`select p.id::text,p.order_id::text,p.provider_payment_reference,a.public_id as account_reference
        from app.commerce_payment_attempts p join app.commerce_orders o on o.id=p.order_id
        join app.commerce_accounts a on a.id=o.commerce_account_id
        where p.planner_id=app.current_planner_id() and p.provider_code='stripe' and p.provider_environment='${this.providerEnvironment}'
          and p.status in ('created','submitted') and o.status in ('created','pending') for update of p,o`);
      for (const row of pending.rows) {
        if (!row.provider_payment_reference) throw new ApiError(409, "checkout_preparing", "Checkout is still preparing. Try again shortly.");
        await this.provider.expireHostedCheckout!(row.provider_payment_reference, row.account_reference);
        await client.query("update app.commerce_payment_attempts set status='canceled',updated_at=now() where id=$1",[row.id]);
        await client.query("update app.commerce_orders set status='canceled',updated_at=now() where id=$1",[row.order_id]);
      }
    });
  }

  async acceptWebhook(rawBody: Buffer, signatureHeader: string): Promise<{
    received: true;
    status: "applied" | "duplicate" | "ignored" | "needs_mapping";
    testOnly: boolean;
  }> {
    let signal: NormalizedProviderSignal;
    try {
      signal = this.provider.verifyWebhook(rawBody, signatureHeader);
    } catch {
      throw new ApiError(
        400,
        "stripe_webhook_rejected",
        "Stripe webhook signature or payload was rejected.",
      );
    }
    return this.processVerifiedSignal(signal);
  }

  private async processVerifiedSignal(signal: NormalizedProviderSignal): Promise<{
    received: true; status: "applied" | "duplicate" | "ignored" | "needs_mapping"; testOnly: boolean;
  }> {
    if (signal.provider !== "stripe" || signal.providerEnvironment !== this.providerEnvironment) {
      throw new ApiError(400, "stripe_webhook_rejected", "Stripe webhook environment was rejected.");
    }
    const inbox = await reserveInbox(this.pool, signal);
    if (inbox.processingStatus === "applied" || inbox.processingStatus === "ignored") {
      return Object.freeze({
        received: true,
        status: "duplicate",
        testOnly: this.providerEnvironment === "test",
      });
    }
    if (signal.signalType === "unsupported") {
      await updateInboxStatus(this.pool, inbox.publicId, "ignored", null, true);
      return Object.freeze({ received: true, status: "ignored", testOnly: this.providerEnvironment === "test" });
    }

    // Keep the provider event's original reference. Resolution replaces its
    // transaction reference with the Charge for ledger routing; a fresh dispute
    // lookup still needs the original Dispute ID.
    const financialSignal = signal;
    let financialResolution: StripeFinancialSignalResolution | null = null;
    if (
      ["refund_changed", "dispute_changed"].includes(signal.signalType)
    ) {
      if (!this.provider.resolveFinancialSignal) {
        await updateInboxStatus(
          this.pool,
          inbox.publicId,
          "needs_mapping",
          "financial_lookup_unavailable",
        );
        return Object.freeze({ received: true, status: "needs_mapping", testOnly: this.providerEnvironment === "test" });
      }
      try {
        financialResolution = await this.provider.resolveFinancialSignal(signal);
        signal = Object.freeze({
          ...signal,
          providerSubscriptionReference: financialResolution.providerSubscriptionReference,
          providerCustomerReference: financialResolution.providerCustomerReference,
          providerTransactionReference: financialResolution.providerTransactionReference,
          providerRefundReference: financialResolution.providerRefundReference,
        });
      } catch (error) {
        await updateInboxStatus(this.pool, inbox.publicId, "failed", errorCode(error), true);
        throw error;
      }
    }

    const commerceAccountReference = await resolveCommerceAccountReference(this.pool, signal);
    if (!commerceAccountReference) {
      await updateInboxStatus(this.pool, inbox.publicId, "needs_mapping", "account_mapping_missing");
      return Object.freeze({ received: true, status: "needs_mapping", testOnly: this.providerEnvironment === "test" });
    }
    if (!signal.providerSubscriptionReference) {
      await updateInboxStatus(
        this.pool,
        inbox.publicId,
        "needs_mapping",
        "subscription_reference_missing",
      );
      return Object.freeze({ received: true, status: "needs_mapping", testOnly: this.providerEnvironment === "test" });
    }

    const customerReference = await resolveCustomerReference(
      this.pool,
      commerceAccountReference,
      signal.providerCustomerReference ?? null,
      this.providerEnvironment,
    );
    if (!customerReference) {
      await updateInboxStatus(this.pool, inbox.publicId, "needs_mapping", "customer_mapping_missing");
      return Object.freeze({ received: true, status: "needs_mapping", testOnly: this.providerEnvironment === "test" });
    }

    try {
      const result = await withCommerceAccountDatabase(this.pool, commerceAccountReference, async (client, context) => {
        // One database transaction owns observation through commit across processes.
        // Do not queue pooled connections behind a slow provider; durable inbox and
        // provider retries obtain a fresh snapshot after the current owner finishes.
        await acquireStripeObservation(client, this.providerEnvironment, signal.providerSubscriptionReference!);
        // Initial financial lookup supplies routing only. Re-read it under the same
        // ownership as the subscription so a delayed dispute/refund cannot regress it.
        if (financialResolution) {
          const current = await this.provider.resolveFinancialSignal!(financialSignal);
          if (current.providerSubscriptionReference !== signal.providerSubscriptionReference
            || current.providerCustomerReference !== customerReference) throw new Error('Financial observation binding changed');
          financialResolution = current;
        }
        const providerSnapshot = await this.provider.retrieveAuthoritativeSubscription({
          providerSubscriptionReference: signal.providerSubscriptionReference!,
          expectedCommerceAccountReference: commerceAccountReference,
          expectedStripeCustomerReference: customerReference,
        });
        if (financialResolution?.authoritativeStateOverride && !providerSnapshot.providerInvoiceReference) {
          throw new Error('Financial invoice binding missing');
        }
        const appliesToCurrentPeriod = financialResolution?.providerInvoiceReference === providerSnapshot.providerInvoiceReference;
        const snapshot = financialResolution?.authoritativeStateOverride && appliesToCurrentPeriod
          ? Object.freeze({ ...providerSnapshot, state: financialResolution.authoritativeStateOverride, cancelAtPeriodEnd: false })
          : providerSnapshot;
        return applyAuthoritativeSnapshot(client, context, inbox.publicId, signal, snapshot, this.config, financialResolution);
      });
      if (!result) throw new Error("Verified Stripe commerce account was not found");
      return Object.freeze({ received: true, status: result, testOnly: this.providerEnvironment === "test" });
    } catch (error) {
      await updateInboxStatus(this.pool, inbox.publicId, "failed", errorCode(error), true);
      throw error;
    }
  }

  async retryPendingProviderEvents(): Promise<{ attempted: number; applied: number; failed: number }> {
    if (this.providerEnvironment !== "production") throw new Error("Production retry worker cannot process test events");
    const rows = await withCommerceInboxDatabase(this.pool, async client => {
      const result = await client.query<{
        provider_event_reference: string; event_type: string; signal_type: NormalizedProviderSignal["signalType"];
        provider_occurred_at: Date; provider_subscription_reference: string | null; provider_transaction_reference: string | null;
        provider_refund_reference: string | null; commerce_account_reference: string | null; provider_customer_reference: string | null;
        order_reference: string | null; payment_attempt_reference: string | null; payload_sha256: Buffer;
      }>(`select provider_event_reference,event_type,signal_type,provider_occurred_at,
        provider_subscription_reference,provider_transaction_reference,provider_refund_reference,
        commerce_account_reference,provider_customer_reference,order_reference,payment_attempt_reference,payload_sha256
        from app.commerce_provider_event_inbox where provider_code='stripe' and provider_environment='production'
          and signature_verified and processing_status in ('received','processing','needs_mapping','failed')
          and attempt_count<12 and last_attempt_at<now()-interval '5 minutes'
        order by last_attempt_at,id limit 20`);
      return result.rows;
    });
    const counts = { attempted: rows.length, applied: 0, failed: 0 };
    for (const row of rows) {
      try {
        const result = await this.processVerifiedSignal({ provider: 'stripe', providerEnvironment: 'production',
          providerEventReference: row.provider_event_reference, sourceEventType: row.event_type, signalType: row.signal_type,
          occurredAt: row.provider_occurred_at.toISOString(), providerSubscriptionReference: row.provider_subscription_reference,
          providerTransactionReference: row.provider_transaction_reference, providerRefundReference: row.provider_refund_reference,
          commerceAccountReference: row.commerce_account_reference, providerCustomerReference: row.provider_customer_reference,
          orderReference: row.order_reference, paymentAttemptReference: row.payment_attempt_reference,
          accountBindingReference: this.config.expectedAccountId, payloadSha256: row.payload_sha256.toString('base64url'),
          signatureVerified: true, verificationMode: 'stripe_sdk_webhook_signature', requiresAuthoritativeSnapshot: true });
        if (result.status === 'needs_mapping') counts.failed += 1; else counts.applied += 1;
      } catch { counts.failed += 1; }
    }
    return counts;
  }

  async loadProductionStatus(plannerId: string): Promise<unknown> {
    if (this.providerEnvironment !== "production") throw new Error("Production billing status requires a production executor");
    return withCommercePlannerDatabase(this.pool, plannerId, async client => {
      const subscription = await client.query<{ state: string; current_period_ends_at: Date | null; cancel_at_period_end: boolean }>(
        `select state,current_period_ends_at,cancel_at_period_end from app.commerce_subscriptions
         where planner_id=app.current_planner_id() and renewal_provider='stripe' and provider_environment='production'
         order by created_at desc,id desc limit 1`);
      const flags = await client.query<{ can_manage: boolean; checkout_pending: boolean }>(`select
        exists(select 1 from app.commerce_provider_customers where planner_id=app.current_planner_id()
          and provider_code='stripe' and provider_environment='production' and status='active') as can_manage,
        exists(select 1 from app.commerce_orders where planner_id=app.current_planner_id()
          and provider_code='stripe' and provider_environment='production' and status in ('created','pending','paid_pending_reconciliation')) as checkout_pending`);
      const row = subscription.rows[0];
      return { contractVersion: 'commerce-stripe-production-v1', testOnly: false,
        canManage: flags.rows[0]?.can_manage === true, checkoutPending: flags.rows[0]?.checkout_pending === true,
        subscription: row ? { state: row.state, currentPeriodEndsAt: row.current_period_ends_at?.toISOString() ?? null,
          cancelAtPeriodEnd: row.cancel_at_period_end } : null };
    });
  }

  async loadTestStatus(plannerId: string): Promise<unknown> {
    if (this.providerEnvironment !== "test") throw new Error("Test diagnostics cannot expose production commerce");
    return withCommercePlannerDatabase(this.pool, plannerId, async (client) => {
      const validation = (await client.query("select app.commerce_validation_enabled() as enabled")).rows[0].enabled === true;
      const orders = await client.query<{ public_id: string; status: string; created_at: Date }>(
          `select public_id, status, created_at
           from app.commerce_orders
           where planner_id = app.current_planner_id() and provider_environment = 'test'
           order by created_at desc, id desc limit 20`,
        );
      const subscriptions = await client.query<{
          public_id: string;
          state: string;
          current_period_ends_at: Date | null;
          cancel_at_period_end: boolean;
        }>(
          `select public_id, state, current_period_ends_at, cancel_at_period_end
           from app.commerce_subscriptions
           where planner_id = app.current_planner_id()
             and renewal_provider = 'stripe'
             and provider_environment = 'test'
           order by created_at desc, id desc limit 20`,
        );
      const events = await client.query<{
        public_id: string;
        event_type: string;
        processing_status: string;
      }>(
          `select public_id, event_type, processing_status
           from app.commerce_provider_events
           where planner_id = app.current_planner_id()
             and provider_code = 'stripe'
             and provider_environment = 'test'
           order by received_at desc, id desc limit 20`,
        );
      const reconciliations = await client.query<{
          public_id: string;
          directive: string;
          target_state: string | null;
          reason_code: string;
          entitlement_mutation_applied: boolean;
        }>(
          `select public_id, directive, target_state, reason_code, entitlement_mutation_applied
           from app.commerce_reconciliation_runs
           where planner_id = app.current_planner_id()
           order by created_at desc, id desc limit 20`,
        );
      return {
        contractVersion: "commerce-stripe-test-v1",
        testOnly: this.providerEnvironment === "test",
        billingOpen: false,
        salesEnabled: this.providerEnvironment === "production",
        entitlementMutationEnabled: validation,
        ...(validation ? { validationOnly: true } : {}),
        orders: orders.rows.map((row) => ({
          publicId: row.public_id,
          status: row.status,
          createdAt: row.created_at.toISOString(),
        })),
        subscriptions: subscriptions.rows.map((row) => ({
          publicId: row.public_id,
          state: row.state,
          currentPeriodEndsAt: row.current_period_ends_at?.toISOString() ?? null,
          cancelAtPeriodEnd: row.cancel_at_period_end,
        })),
        events: events.rows.map((row) => ({
          publicId: row.public_id,
          eventType: row.event_type,
          processingStatus: row.processing_status,
        })),
        reconciliations: reconciliations.rows.map((row) => ({
          publicId: row.public_id,
          directive: row.directive,
          targetState: row.target_state,
          reasonCode: row.reason_code,
          entitlementMutationApplied: row.entitlement_mutation_applied,
        })),
      };
    });
  }
}

async function assertProductionSalesReady(client: PoolClient): Promise<void> {
  const result = await client.query<{ ready: boolean }>(`select exists (
    select 1 from app.commerce_purchase_route_policies route
    join app.commerce_market_policies market on market.id=route.market_policy_id
    join app.commerce_storefront_policies storefront on storefront.id=route.storefront_policy_id
    join app.commerce_operators op on op.code=market.operator_code
    join app.commerce_operating_planes plane on plane.code=market.operating_plane_code
    where route.policy_code='global_us_web_stripe_v1' and route.version=1
      and route.enabled and route.status='active' and route.provider_code='stripe'
      and route.purchase_route='web_direct'
      and market.service_market_code='GLOBAL_US' and market.sales_enabled and market.status='active'
      and market.operating_plane_code='global' and op.operating_plane_code='global'
      and storefront.client_surface='web' and storefront.status='active'
      and storefront.planned_route='web_direct'
      and op.status='active' and plane.status='active'
      and (route.effective_from is null or route.effective_from<=now()) and (route.effective_to is null or route.effective_to>now())
      and (market.effective_from is null or market.effective_from<=now()) and (market.effective_to is null or market.effective_to>now())
      and (storefront.effective_from is null or storefront.effective_from<=now()) and (storefront.effective_to is null or storefront.effective_to>now())
      and (op.effective_from is null or op.effective_from<=now()) and (op.effective_to is null or op.effective_to>now())
  ) and coalesce((select production_entitlements_enabled from app.commerce_runtime_policy where singleton),false) as ready`);
  if (result.rows[0]?.ready !== true) throw new ApiError(409, 'billing_closed', 'Subscriptions are not available for purchase yet.');
}

async function savePurchaseConsent(client: PoolClient, orderReference: string, proof: PurchaseConsent): Promise<void> {
  const digest = purchaseConsentDigest(proof);
  await client.query(`insert into app.commerce_purchase_consents (
    planner_id,order_id,consent_version,terms_version,subscription_terms_version,refund_policy_version,
    legal_bundle_sha256,acceptance_sha256,price_code,amount_minor,currency_code,billing_interval)
    select app.current_planner_id(),id,$2,$3,$4,$5,$6,$7,$8,$9,$10,'annual'
    from app.commerce_orders where public_id=$1::uuid and planner_id=app.current_planner_id()
      and provider_code='stripe' and provider_environment='production'
    on conflict (order_id) do nothing`, [orderReference, proof.version, proof.termsVersion,
    proof.subscriptionTermsVersion, proof.refundPolicyVersion, Buffer.from(proof.legalBundleSha256, 'hex'),
    digest, proof.priceCode, proof.amountMinor, proof.currency]);
  const result = await client.query<{ acceptance_sha256: Buffer }>(`select consent.acceptance_sha256
    from app.commerce_purchase_consents consent join app.commerce_orders orders on orders.id=consent.order_id
    where orders.public_id=$1::uuid and consent.planner_id=app.current_planner_id()`, [orderReference]);
  if (!result.rows[0]?.acceptance_sha256.equals(digest)) throw new ApiError(409, 'purchase_consent_changed', 'Close the unfinished checkout and review the current purchase terms.');
}

async function reserveCheckout(
  client: PoolClient,
  billingPeriod: StripeBillingPeriod,
  idempotencyKey: string,
  config: StripeExecutionConfig,
  provider: StripeCommerceProvider,
  purchaseConsent?: PurchaseConsent,
): Promise<CheckoutReservation> {
  const environment = stripeExecutionEnvironment(config);
  await client.query("select pg_advisory_xact_lock(hashtextextended('checkout:' || app.current_planner_id()::text,0))");
  if (environment === "production") {
    await assertProductionSalesReady(client);
    await assertNoForeignPurchase(client,'stripe');
  }
  const account = await client.query<{
    id: string;
    public_id: string;
  }>(
    `with plan as (
       select id, planner_id from app.plans where planner_id = app.current_planner_id()
     ), inserted as (
       insert into app.commerce_accounts (
         planner_id, plan_id, operating_plane_code, service_market_code, status
       )
       select planner_id, id, 'global', 'GLOBAL_US', 'active' from plan
       on conflict (plan_id, operating_plane_code) do nothing
       returning id, public_id
     )
     select id::text, public_id::text from inserted
     union all
     select account.id::text, account.public_id::text
     from app.commerce_accounts account
     where account.planner_id = app.current_planner_id()
       and account.operating_plane_code = 'global'
       and account.service_market_code = 'GLOBAL_US'
     limit 1`,
  );
  const accountRow = account.rows[0];
  if (!accountRow) throw new Error("Rillora Global commerce account could not be reserved");

  const priceCode = stripeFamilyPriceCode(config, billingPeriod);
  const expectedPrice = config.familyPriceIds[billingPeriod];
  const catalog = await client.query<{
    price_id: string;
    amount_minor: string;
    currency_code: string;
    operator_code: string;
    route_policy_code: string;
    route_policy_version: number;
  }>(
    `select price.id::text as price_id, price.amount_minor::text, price.currency_code,
            price.operator_code, route.policy_code as route_policy_code,
            route.version as route_policy_version
     from app.commerce_prices price
     join app.commerce_storefront_products product on product.price_id = price.id
     join app.commerce_purchase_route_policies route
       on route.policy_code = 'global_us_web_stripe_v1' and route.version = 1
     join app.commerce_market_policies market on market.id=route.market_policy_id
       and market.operator_code=price.operator_code and market.service_market_code=price.service_market_code
     join app.commerce_plan_versions plan_version on plan_version.id=price.plan_version_id
     where price.price_code = $1
       and price.service_market_code='GLOBAL_US' and price.currency_code='USD'
       and plan_version.plan_code='family' and plan_version.version=$5
       and price.status in (${environment === 'production' ? "'active'" : "'test_only','disabled_hypothesis'"})
       and product.provider_code = 'stripe'
       and product.provider_environment = '${environment}'
       and product.status = '${environment === 'production' ? 'active' : 'test_only'}'
       and product.provider_account_reference = $2
       and product.external_parent_product_reference = $3
       and product.external_product_reference = $4
       and ('${environment}'<>'production' or (
         plan_version.status='active' and price.tax_behavior<>'not_configured'
         and (price.effective_from is null or price.effective_from<=now()) and (price.effective_to is null or price.effective_to>now())
         and (product.effective_from is null or product.effective_from<=now()) and (product.effective_to is null or product.effective_to>now())
       ))`,
    [priceCode, config.expectedAccountId, config.familyProductId, expectedPrice, config.familyPlanVersion ?? 1],
  );
  const catalogRow = catalog.rows[0];
  if (!catalogRow) throw new Error("Rillora Stripe catalog binding is unavailable for this environment");
  if(environment==='production')await assertFamilyPriceReady(client,catalogRow.price_id);

  let existing = await client.query<{
    order_public_id: string;
    attempt_public_id: string;
    price_id: string;
    idempotency_key: string;
    provider_payment_reference: string | null;
    attempt_status?: string;
    order_status?: string;
  }>(
    `select order_row.public_id::text as order_public_id,
            attempt.public_id::text as attempt_public_id,
            order_row.price_id::text,attempt.idempotency_key,attempt.provider_payment_reference,
            attempt.status as attempt_status,order_row.status as order_status
     from app.commerce_payment_attempts attempt
     join app.commerce_orders order_row
       on order_row.id = attempt.order_id and order_row.planner_id = attempt.planner_id
     where attempt.planner_id = app.current_planner_id()
       and attempt.provider_code = 'stripe'
       and attempt.provider_environment = '${environment}'
       and attempt.idempotency_key = $1`,
    [idempotencyKey],
  );
  if (existing.rows[0]?.order_status && !['created','pending'].includes(existing.rows[0].order_status)) {
    throw new ApiError(409, "checkout_finished", "This checkout has finished. Refresh your access before starting another.");
  }
  if (existing.rows[0] && existing.rows[0].price_id !== catalogRow.price_id) {
    throw new ApiError(409, "stripe_idempotency_conflict", "Idempotency key was used for another price.");
  }
  if (!existing.rows[0]) {
    const subscriptions = await client.query<{ id: string; renewal_provider: string; provider_environment: string; provider_subscription_reference: string; provider_customer_reference: string | null; state: string }>(
      `select s.id::text,s.renewal_provider,s.provider_environment,s.provider_subscription_reference,s.state,c.provider_customer_reference
       from app.commerce_subscriptions s left join app.commerce_provider_customers c on c.commerce_account_id=s.commerce_account_id
         and c.provider_code=s.renewal_provider and c.provider_environment=s.provider_environment
       where s.commerce_account_id=$1 and (s.state in ('active','cancel_at_period_end','grace','past_due','refunded','revoked')
         or (s.renewal_provider='stripe' and s.provider_environment='${environment}' and s.state='expired_read_only'))
       order by s.id desc limit 21`, [accountRow.id]);
    if (subscriptions.rows.length > 20) throw new ApiError(409, "billing_review_required", "Your billing history needs review before another subscription can start.");
    for (const sub of subscriptions.rows) {
      if (sub.renewal_provider !== "stripe" || sub.provider_environment !== environment || !sub.provider_customer_reference) throw new ApiError(409, "existing_subscription", "Manage your existing subscription before starting another.");
      await acquireStripeObservation(client, environment, sub.provider_subscription_reference);
      const current = await provider.retrieveAuthoritativeSubscription({ providerSubscriptionReference: sub.provider_subscription_reference,
        expectedCommerceAccountReference: accountRow.public_id, expectedStripeCustomerReference: sub.provider_customer_reference });
      if (current.state !== "expired_read_only" || current.renewalIsPossible !== false) throw new ApiError(409, "existing_subscription", "Manage your existing subscription before starting another.");
      // This authoritative preflight can end stale access; it never grants it.
      const expired = await client.query(`update app.commerce_subscriptions set state='expired_read_only',provider_observed_at=$2,
        current_period_starts_at=$3,current_period_ends_at=$4,renewal_is_possible=false,grace_ends_at=null,
        version=version+1,updated_at=now()
        where id=$1 and (provider_observed_at is null or provider_observed_at <= $2) returning id`,
        [sub.id,current.observedAt,current.currentPeriodStartsAt,current.currentPeriodEndsAt]);
      if (!expired.rowCount) throw new ApiError(409, "billing_changed", "Billing changed. Refresh your access before continuing.");
      await client.query("select app.apply_verified_subscription_entitlements($1)",[sub.id]);
      await client.query(`insert into app.commerce_subscription_state_history(planner_id,subscription_id,from_state,to_state,reason_code,occurred_at)
        values(app.current_planner_id(),$1,$2,'expired_read_only','stripe_api_checkout_preflight',$3)`,[sub.id,sub.state,current.observedAt]);
    }
    const pending = await client.query<{ order_public_id: string; attempt_public_id: string; price_id: string; idempotency_key: string; provider_payment_reference: string | null }>(
      `select o.public_id as order_public_id,p.public_id as attempt_public_id,o.price_id::text,p.idempotency_key,p.provider_payment_reference
       from app.commerce_payment_attempts p join app.commerce_orders o on o.id=p.order_id
       where o.commerce_account_id=$1 and p.provider_code='stripe' and p.provider_environment='${environment}'
         and p.status in ('created','submitted') and o.status in ('created','pending') order by p.id desc limit 1`,[accountRow.id]);
    if (pending.rows[0]) {
      if (pending.rows[0].price_id !== catalogRow.price_id) throw new ApiError(409, "unfinished_checkout", "Close the unfinished checkout before reviewing the current subscription price.");
      existing = pending;
    }
  }

  let orderReference = existing.rows[0]?.order_public_id;
  let paymentAttemptReference = existing.rows[0]?.attempt_public_id;
  if (!orderReference || !paymentAttemptReference) {
    const order = await client.query<{ id: string; public_id: string }>(
      `insert into app.commerce_orders (
         planner_id, commerce_account_id, operator_code, price_id,
         purchase_route_policy_code, purchase_route_policy_version,
         provider_code, provider_environment, amount_minor, currency_code, status
       ) values (
         app.current_planner_id(), $1, $2, $3, $4, $5,
         'stripe', '${environment}', $6, $7, 'created'
       ) returning id::text, public_id::text`,
      [
        accountRow.id,
        catalogRow.operator_code,
        catalogRow.price_id,
        catalogRow.route_policy_code,
        catalogRow.route_policy_version,
        catalogRow.amount_minor,
        catalogRow.currency_code,
      ],
    );
    const attempt = await client.query<{ public_id: string }>(
      `insert into app.commerce_payment_attempts (
         planner_id, order_id, provider_code, provider_environment,
         idempotency_key, status, amount_minor, currency_code
       ) values (
         app.current_planner_id(), $1, 'stripe', '${environment}', $2, 'created', $3, $4
       ) returning public_id::text`,
      [order.rows[0]!.id, idempotencyKey, catalogRow.amount_minor, catalogRow.currency_code],
    );
    orderReference = order.rows[0]!.public_id;
    paymentAttemptReference = attempt.rows[0]!.public_id;
  }

  if (environment === "production") {
    const consent = parsePurchaseConsent(purchaseConsent);
    if (consent.priceCode !== priceCode || consent.amountMinor !== Number(catalogRow.amount_minor)
      || consent.currency !== catalogRow.currency_code) throw new ApiError(409, "purchase_terms_changed", "Review the current subscription terms before continuing.");
    await savePurchaseConsent(client, orderReference!, consent);
  }
  const customer = await client.query<{ provider_customer_reference: string }>(
    `select provider_customer_reference
     from app.commerce_provider_customers
     where planner_id = app.current_planner_id()
       and commerce_account_id = $1
       and provider_code = 'stripe'
       and provider_environment = '${environment}'
       and status = 'active'
       and ('${environment}'<>'production' or created_at <= (select created_at from app.commerce_orders where public_id=$2::uuid))
     limit 1`,
    [accountRow.id, orderReference],
  );
  return Object.freeze({
    commerceAccountReference: accountRow.public_id,
    orderReference,
    paymentAttemptReference,
    providerIdempotencyKey: existing.rows[0]?.idempotency_key ?? idempotencyKey,
    existingStripeCustomerReference: customer.rows[0]?.provider_customer_reference ?? null,
    existingCheckoutReference: existing.rows[0]?.provider_payment_reference ?? null,
  });
}

async function reserveInbox(
  pool: DatabasePool,
  signal: NormalizedProviderSignal,
): Promise<InboxReservation> {
  return withCommerceInboxDatabase(pool, async (client) => {
    const accountReference = isUuid(signal.commerceAccountReference)
      ? signal.commerceAccountReference
      : null;
    const result = await client.query<{ public_id: string; processing_status: string }>(
      `insert into app.commerce_provider_event_inbox (
         provider_code, provider_environment, provider_event_reference,
         event_type, signal_type, commerce_account_reference,
         provider_customer_reference, provider_subscription_reference,
         provider_transaction_reference, provider_refund_reference,
         payload_sha256, signature_verified, provider_occurred_at, order_reference, payment_attempt_reference
       ) values (
         $1, $2, $3, $4, $5, $6::uuid, $7, $8, $9, $10, $11, true, $12, $13::uuid, $14::uuid
       )
       on conflict (provider_code, provider_environment, provider_event_reference)
       do update set attempt_count = app.commerce_provider_event_inbox.attempt_count + 1, last_attempt_at=now()
       returning public_id::text, processing_status`,
      [
        signal.provider,
        signal.providerEnvironment,
        signal.providerEventReference,
        signal.sourceEventType,
        signal.signalType,
        accountReference,
        signal.providerCustomerReference ?? null,
        signal.providerSubscriptionReference,
        signal.providerTransactionReference,
        signal.providerRefundReference,
        Buffer.from(signal.payloadSha256, "base64url"),
        signal.occurredAt,
        isUuid(signal.orderReference) ? signal.orderReference : null,
        isUuid(signal.paymentAttemptReference) ? signal.paymentAttemptReference : null,
      ],
    );
    return Object.freeze({
      publicId: result.rows[0]!.public_id,
      processingStatus: result.rows[0]!.processing_status,
    });
  });
}

async function resolveCommerceAccountReference(
  pool: DatabasePool,
  signal: NormalizedProviderSignal,
): Promise<string | null> {
  const references = [
    signal.providerSubscriptionReference,
    signal.providerTransactionReference,
    signal.providerRefundReference,
    signal.providerCustomerReference ?? null,
  ].filter((value): value is string => Boolean(value));
  const mapped = await withCommerceInboxDatabase(pool, async (client) => {
    const result = await client.query<{ commerce_account_reference: string }>(
      `select distinct commerce_account_reference::text
       from app.commerce_provider_object_links
       where provider_code = 'stripe'
         and provider_environment = $2
         and provider_object_reference = any($1::text[])
       limit 2`,
      [references, signal.providerEnvironment],
    );
    if (result.rows.length > 1) throw new Error("Provider objects map to conflicting accounts");
    return result.rows[0]?.commerce_account_reference ?? null;
  });
  if (mapped && isUuid(signal.commerceAccountReference) && mapped !== signal.commerceAccountReference) throw new Error("Provider object and metadata account mappings conflict");
  if (mapped) return mapped;
  if (!isUuid(signal.commerceAccountReference)) return null;
  if (signal.providerEnvironment === "test") return signal.commerceAccountReference;
  // A fast webhook can arrive before the checkout POST result is persisted.
  // Metadata alone is insufficient: require the owned durable purchase consent.
  if (!isUuid(signal.orderReference) || !isUuid(signal.paymentAttemptReference)) return null;
  return withCommerceAccountDatabase(pool, signal.commerceAccountReference, async (client, context) => {
    const proof = await client.query(`select 1 from app.commerce_orders o
      join app.commerce_payment_attempts p on p.order_id=o.id and p.planner_id=o.planner_id
      join app.commerce_purchase_consents consent on consent.order_id=o.id and consent.planner_id=o.planner_id
      where o.commerce_account_id=$1 and o.public_id=$2::uuid and p.public_id=$3::uuid
        and o.provider_code='stripe' and o.provider_environment='production'
        and p.provider_code='stripe' and p.provider_environment='production'
        and o.status in ('created','pending','paid_pending_reconciliation','paid_reconciled')`, [context.commerceAccountId, signal.orderReference, signal.paymentAttemptReference]);
    return proof.rowCount ? context.publicId : null;
  });
}

async function resolveCustomerReference(
  pool: DatabasePool,
  commerceAccountReference: string,
  directCustomerReference: string | null,
  environment: "test" | "production",
): Promise<string | null> {
  if (directCustomerReference?.startsWith("cus_")) return directCustomerReference;
  const result = await withCommerceAccountDatabase(
    pool,
    commerceAccountReference,
    async (client, context) => {
      const customer = await client.query<{ provider_customer_reference: string }>(
        `select provider_customer_reference
         from app.commerce_provider_customers
         where planner_id = app.current_planner_id()
           and commerce_account_id = $1
           and provider_code = 'stripe'
           and provider_environment = $2
           and status = 'active'
         limit 1`,
        [context.commerceAccountId, environment],
      );
      return customer.rows[0]?.provider_customer_reference ?? null;
    },
  );
  return result ?? null;
}

async function acquireStripeObservation(client: PoolClient, environment: string, subscription: string): Promise<void> {
  const locked = await client.query<{ acquired: boolean }>(
    "select pg_try_advisory_xact_lock(hashtextextended($1,0)) as acquired",
    [`stripe-observation:${environment}:${subscription}`],
  );
  if (!locked.rows[0]?.acquired) throw new ApiError(503, 'subscription_observation_busy', 'Subscription reconciliation will retry.');
  await client.query("set local idle_in_transaction_session_timeout = '120s'");
}

async function applyAuthoritativeSnapshot(
  client: PoolClient,
  context: { commerceAccountId: string; plannerId: string; publicId: string },
  inboxPublicId: string,
  signal: NormalizedProviderSignal,
  snapshotInput: AuthoritativeSubscriptionSnapshot,
  config: StripeExecutionConfig,
  financialResolution: StripeFinancialSignalResolution | null,
): Promise<"applied" | "duplicate"> {
  const environment = stripeExecutionEnvironment(config);
  let snapshot = snapshotInput;
  await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:' || app.current_planner_id()::text,0))");
  const candidate = reconcileCommerceProviderState({ signals: [signal], snapshots: [snapshot] }).entitlementDecisions[0];
  if (!candidate || candidate.directive === "hold") throw new Error("Provider snapshot needs a fresh authoritative reconciliation");
  const duplicate = await client.query(
    `select 1 from app.commerce_provider_events
     where provider_code = 'stripe'
       and provider_environment = '${environment}'
       and provider_event_reference = $1`,
    [signal.providerEventReference],
  );
  if (duplicate.rowCount) {
    await client.query(
      `update app.commerce_provider_event_inbox
       set processing_status = 'applied', processed_at = coalesce(processed_at, now()),
           last_error_code = null
       where public_id = $1::uuid`,
      [inboxPublicId],
    );
    return "duplicate";
  }
  if (
    snapshot.provider !== "stripe"
    || snapshot.providerEnvironment !== environment
    || snapshot.commerceAccountReference !== context.publicId
    || !snapshot.providerCustomerReference?.startsWith("cus_")
    || !snapshot.priceCode
  ) {
    throw new Error("Authoritative Stripe snapshot is outside the configured executor contract");
  }

  const providerCustomerReference = snapshot.providerCustomerReference;
  const expectedPriceId = executionSnapshotPriceId(config, snapshot.priceCode);
  if (!expectedPriceId) throw new Error("Authoritative Stripe snapshot uses an unknown price code");
  const price = await client.query<{ id: string; plan_version_id: string }>(
    `select price.id::text, price.plan_version_id::text
     from app.commerce_prices price
     join app.commerce_storefront_products product on product.price_id = price.id
     where price.price_code = $1
       and price.status in (${environment === 'production' ? "'active','retired'" : "'test_only','disabled_hypothesis','retired'"})
       and product.provider_code = 'stripe'
       and product.provider_environment = '${environment}'
       and product.provider_account_reference = $2
       and product.external_parent_product_reference = $3
       and product.external_product_reference = $4
       and product.status in (${environment === 'production' ? "'active','retired'" : "'test_only'"})`,
    [snapshot.priceCode, config.expectedAccountId, config.familyProductId, expectedPriceId],
  );
  if (!price.rows[0]) throw new Error("Authoritative Stripe price is not bound to Rillora");

  const providerEvent = await client.query<{ id: string; public_id: string }>(
    `insert into app.commerce_provider_events (
       planner_id, commerce_account_id, provider_code, provider_environment,
       provider_event_reference, event_type, signature_verified, payload_sha256,
       processing_status, provider_occurred_at
     ) values (
       app.current_planner_id(), $1, 'stripe', '${environment}', $2, $3, true, $4,
       'received', $5
     ) returning id::text, public_id::text`,
    [
      context.commerceAccountId,
      signal.providerEventReference,
      signal.sourceEventType,
      Buffer.from(signal.payloadSha256, "base64url"),
      signal.occurredAt,
    ],
  );

  const customerBinding = await client.query(
    `insert into app.commerce_provider_customers (
       planner_id, commerce_account_id, provider_code, provider_environment,
       provider_customer_reference, status
     ) values (app.current_planner_id(), $1, 'stripe', '${environment}', $2, 'active')
     on conflict (commerce_account_id, provider_code, provider_environment)
     do update set provider_customer_reference = excluded.provider_customer_reference,
                   status = 'active', updated_at = now()
     where app.commerce_provider_customers.provider_customer_reference=excluded.provider_customer_reference
     returning id`,
    [context.commerceAccountId, snapshot.providerCustomerReference],
  );
  if (customerBinding.rowCount !== 1) throw new Error('Existing billing customer binding cannot be replaced by an event');

  const existing = await client.query<{ id: string; public_id: string; state: string; provider_observed_at: Date | null;
    provider_invoice_reference: string | null; financial_state_override: "refunded" | "revoked" | null }>(
    `select id::text, public_id::text, state, provider_observed_at, provider_invoice_reference, financial_state_override
     from app.commerce_subscriptions
     where planner_id = app.current_planner_id()
       and renewal_provider = 'stripe'
       and provider_environment = '${environment}'
       and provider_subscription_reference = $1
     limit 1`,
    [snapshot.providerSubscriptionReference],
  );
  if (existing.rows[0]?.provider_observed_at && existing.rows[0].provider_observed_at > new Date(snapshot.observedAt)) {
    throw new Error("Stale authoritative subscription observation; retry with current provider state");
  }
  const matchingAdjustment = financialResolution?.providerInvoiceReference === snapshot.providerInvoiceReference;
  let financialOverride = matchingAdjustment ? financialResolution?.authoritativeStateOverride ?? null : null;
  const prior = existing.rows[0];
  if (prior?.provider_invoice_reference === snapshot.providerInvoiceReference && prior?.financial_state_override) {
    const disputeResolved = prior.financial_state_override === "revoked" && matchingAdjustment
      && signal.signalType === "dispute_changed" && financialResolution?.authoritativeStateOverride === null;
    if (!disputeResolved) financialOverride = prior.financial_state_override === "refunded" ? "refunded" : financialOverride ?? prior.financial_state_override;
  }
  if (financialOverride) snapshot = Object.freeze({ ...snapshot, state: financialOverride, cancelAtPeriodEnd: false });
  const subscriptionId = await recordSubscriptionObservation(client, context, signal, snapshot,
    price.rows[0], providerEvent.rows[0]!.public_id, financialOverride);

  const reconciliation = reconcileCommerceProviderState({ signals: [signal], snapshots: [snapshot] });
  const decision = reconciliation.entitlementDecisions[0];
  if (!decision) throw new Error("Stripe reconciliation produced no decision");
  await persistReconciliation(
    client,
    context,
    providerEvent.rows[0]!.id,
    subscriptionId,
    decision,
  );
  // Only settled access-bearing snapshots finish the original checkout. A later
  // renewal/refund event must not rewrite the original order's paid history.
  if (['active', 'cancel_at_period_end'].includes(snapshot.state)) await updateOrderAndAttempt(client, signal);
  await insertSignalObjectLinks(client, context.publicId, signal);
  await insertProviderObjectLink(client, environment, {
    objectType: "customer",
    objectReference: providerCustomerReference,
    commerceAccountReference: context.publicId,
  });
  await insertProviderObjectLink(client, environment, {
    objectType: "subscription",
    objectReference: snapshot.providerSubscriptionReference,
    commerceAccountReference: context.publicId,
  });
  await client.query(
    `update app.commerce_provider_events
     set processing_status = 'applied', processed_at = now()
     where id = $1`,
    [providerEvent.rows[0]!.id],
  );
  await client.query(
    `update app.commerce_provider_event_inbox
     set processing_status = 'applied', processed_at = now(), last_error_code = null
     where public_id = $1::uuid`,
    [inboxPublicId],
  );
  return "applied";
}

async function updateOrderAndAttempt(
  client: PoolClient,
  signal: NormalizedProviderSignal,
): Promise<void> {
  if (isUuid(signal.paymentAttemptReference)) {
    await client.query(
      `update app.commerce_payment_attempts
       set status = 'reconciled', updated_at = now()
       where public_id = $1::uuid and planner_id = app.current_planner_id() and status in ('created','submitted','requires_action','succeeded_unreconciled')`,
      [signal.paymentAttemptReference],
    );
  }
  if (isUuid(signal.orderReference)) {
    await client.query(
      `update app.commerce_orders
       set status = 'paid_reconciled', updated_at = now()
       where public_id = $1::uuid and planner_id = app.current_planner_id() and status in ('created','pending','paid_pending_reconciliation')`,
      [signal.orderReference],
    );
  }
}

async function insertSignalObjectLinks(
  client: PoolClient,
  commerceAccountReference: string,
  signal: NormalizedProviderSignal,
): Promise<void> {
  const candidates: Array<[string, string | null]> = [
    [providerObjectType(signal.providerTransactionReference), signal.providerTransactionReference],
    ["refund", signal.providerRefundReference],
  ];
  for (const [objectType, objectReference] of candidates) {
    if (!objectReference || !objectType) continue;
    await insertProviderObjectLink(client, signal.providerEnvironment, {
      objectType,
      objectReference,
      commerceAccountReference,
      ...(isUuid(signal.orderReference) ? { orderReference: signal.orderReference } : {}),
      ...(isUuid(signal.paymentAttemptReference)
        ? { paymentAttemptReference: signal.paymentAttemptReference }
        : {}),
    });
  }
}

async function insertProviderObjectLink(
  client: PoolClient,
  environment: NormalizedProviderSignal["providerEnvironment"],
  input: {
    objectType: string;
    objectReference: string;
    commerceAccountReference: string;
    orderReference?: string;
    paymentAttemptReference?: string;
  },
): Promise<void> {
  await client.query(
    `insert into app.commerce_provider_object_links (
       provider_code, provider_environment, provider_object_type,
       provider_object_reference, commerce_account_reference,
       order_public_id, payment_attempt_public_id
     ) values ('stripe', $6, $1, $2, $3::uuid, $4::uuid, $5::uuid)
     on conflict (provider_code, provider_environment, provider_object_reference) do nothing`,
    [
      input.objectType,
      input.objectReference,
      input.commerceAccountReference,
      input.orderReference ?? null,
      input.paymentAttemptReference ?? null,
      environment,
    ],
  );
}

async function updateInboxStatus(
  pool: DatabasePool,
  inboxPublicId: string,
  status: "needs_mapping" | "ignored" | "failed",
  error: string | null,
  processed = false,
): Promise<void> {
  await withCommerceInboxDatabase(pool, async (client) => {
    await client.query(
      `update app.commerce_provider_event_inbox
       set processing_status = $2, last_error_code = $3,
           processed_at = case when $4 then now() else null end
       where public_id = $1::uuid`,
      [inboxPublicId, status, error, processed],
    );
  });
}

function providerIdempotencyKey(
  plannerId: string,
  billingPeriod: StripeBillingPeriod,
  seed: string,
  environment: "test" | "production",
): string {
  const digest = createHash("sha256")
    .update(`${plannerId}:${billingPeriod}:${seed}`)
    .digest("base64url")
    .slice(0, 32);
  return `checkout:rillora:${environment === "production" ? "production:" : ""}${billingPeriod}:${digest}`;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}

function providerObjectType(reference: string | null): string {
  if (!reference) return "";
  if (reference.startsWith("cs_")) return "checkout_session";
  if (reference.startsWith("in_")) return "invoice";
  if (reference.startsWith("ch_")) return "charge";
  if (reference.startsWith("du_") || reference.startsWith("dp_")) return "dispute";
  return "";
}

function errorCode(error: unknown): string {
  if (error instanceof ApiError) return error.code.slice(0, 80);
  if (
    error
    && typeof error === "object"
    && "code" in error
    && typeof error.code === "string"
    && /^[A-Za-z0-9_:-]{1,70}$/.test(error.code)
  ) {
    return `provider_or_db_${error.code}`.slice(0, 80);
  }
  if (error instanceof Error) {
    return error.name.replace(/[^A-Za-z0-9_:-]/g, "_").slice(0, 80) || "executor_error";
  }
  return "executor_error";
}
