import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { StripeTestConfig } from "./config.js";
import {
  reconcileCommerceProviderState,
  type EntitlementReconciliationDecision,
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
import type {
  StripeBillingPeriod,
  StripeCheckoutResult,
  StripeFinancialSignalResolution,
  StripePortalResult,
} from "./stripe-test-adapter.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StripeCommerceProvider = Readonly<{
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
}>;

type InboxReservation = Readonly<{
  publicId: string;
  processingStatus: string;
}>;

export class StripeCommerceExecutor {
  constructor(
    private readonly pool: DatabasePool,
    private readonly config: StripeTestConfig,
    private readonly provider: StripeCommerceProvider,
  ) {}

  async createCheckout(input: {
    plannerId: string;
    billingPeriod: StripeBillingPeriod;
    idempotencySeed: string;
  }): Promise<StripeCheckoutResult & {
    orderReference: string;
    paymentAttemptReference: string;
    testOnly: true;
    salesEnabled: false;
  }> {
    const reservation = await withCommercePlannerDatabase(
      this.pool,
      input.plannerId,
      (client) => reserveCheckout(
        client,
        input.billingPeriod,
        providerIdempotencyKey(input.plannerId, input.billingPeriod, input.idempotencySeed),
        this.config,
      ),
    );

    const checkout = await this.provider.createHostedSubscriptionCheckout({
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
         set provider_payment_reference = $2, status = 'submitted', updated_at = now()
         where public_id = $1::uuid
         returning id`,
        [reservation.paymentAttemptReference, checkout.sessionId],
      );
      if (attempt.rowCount !== 1) throw new Error("Reserved Stripe payment attempt was not found");
      await client.query(
        `update app.commerce_orders
         set status = 'pending', updated_at = now()
         where public_id = $1::uuid`,
        [reservation.orderReference],
      );
      await insertProviderObjectLink(client, {
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
      testOnly: true,
      salesEnabled: false,
    });
  }

  async createPortal(plannerId: string): Promise<StripePortalResult & { testOnly: true }> {
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
             and customer.provider_environment = 'test'
             and customer.status = 'active'
           limit 1`,
        );
        return result.rows[0]?.provider_customer_reference ?? null;
      },
    );
    if (!customerReference) {
      throw new ApiError(
        409,
        "stripe_test_customer_missing",
        "No reconciled Stripe test Customer exists for this account.",
      );
    }
    return Object.freeze({
      ...(await this.provider.createCustomerPortal({
        stripeCustomerReference: customerReference,
      })),
      testOnly: true,
    });
  }

  async acceptWebhook(rawBody: Buffer, signatureHeader: string): Promise<{
    received: true;
    status: "applied" | "duplicate" | "ignored" | "needs_mapping";
    testOnly: true;
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
    if (signal.provider !== "stripe" || signal.providerEnvironment !== "test") {
      throw new Error("Stripe test executor received a non-test provider signal");
    }
    const inbox = await reserveInbox(this.pool, signal);
    if (inbox.processingStatus === "applied" || inbox.processingStatus === "ignored") {
      return Object.freeze({
        received: true,
        status: "duplicate",
        testOnly: true,
      });
    }
    if (signal.signalType === "unsupported") {
      await updateInboxStatus(this.pool, inbox.publicId, "ignored", null, true);
      return Object.freeze({ received: true, status: "ignored", testOnly: true });
    }

    let financialResolution: StripeFinancialSignalResolution | null = null;
    if (
      !signal.providerSubscriptionReference
      && ["refund_changed", "dispute_changed"].includes(signal.signalType)
    ) {
      if (!this.provider.resolveFinancialSignal) {
        await updateInboxStatus(
          this.pool,
          inbox.publicId,
          "needs_mapping",
          "financial_lookup_unavailable",
        );
        return Object.freeze({ received: true, status: "needs_mapping", testOnly: true });
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
      return Object.freeze({ received: true, status: "needs_mapping", testOnly: true });
    }
    if (!signal.providerSubscriptionReference) {
      await updateInboxStatus(
        this.pool,
        inbox.publicId,
        "needs_mapping",
        "subscription_reference_missing",
      );
      return Object.freeze({ received: true, status: "needs_mapping", testOnly: true });
    }

    const customerReference = await resolveCustomerReference(
      this.pool,
      commerceAccountReference,
      signal.providerCustomerReference ?? null,
    );
    if (!customerReference) {
      await updateInboxStatus(this.pool, inbox.publicId, "needs_mapping", "customer_mapping_missing");
      return Object.freeze({ received: true, status: "needs_mapping", testOnly: true });
    }

    try {
      const providerSnapshot = await this.provider.retrieveAuthoritativeSubscription({
        providerSubscriptionReference: signal.providerSubscriptionReference,
        expectedCommerceAccountReference: commerceAccountReference,
        expectedStripeCustomerReference: customerReference,
      });
      const snapshot = financialResolution?.authoritativeStateOverride
        ? Object.freeze({
            ...providerSnapshot,
            state: financialResolution.authoritativeStateOverride,
            cancelAtPeriodEnd: false,
          })
        : providerSnapshot;
      const result = await withCommerceAccountDatabase(
        this.pool,
        commerceAccountReference,
        (client, context) => applyAuthoritativeSnapshot(
          client,
          context,
          inbox.publicId,
          signal,
          snapshot,
          this.config,
        ),
      );
      if (!result) throw new Error("Verified Stripe commerce account was not found");
      return Object.freeze({ received: true, status: result, testOnly: true });
    } catch (error) {
      await updateInboxStatus(this.pool, inbox.publicId, "failed", errorCode(error), true);
      throw error;
    }
  }

  async loadTestStatus(plannerId: string): Promise<unknown> {
    return withCommercePlannerDatabase(this.pool, plannerId, async (client) => {
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
        testOnly: true,
        billingOpen: false,
        salesEnabled: false,
        entitlementMutationEnabled: false,
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

async function reserveCheckout(
  client: PoolClient,
  billingPeriod: StripeBillingPeriod,
  idempotencyKey: string,
  config: StripeTestConfig,
): Promise<CheckoutReservation> {
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

  const priceCode = billingPeriod === "monthly"
    ? "family_usd_monthly_v1"
    : "family_usd_annual_v1";
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
     where price.price_code = $1
       and price.status = 'test_only'
       and product.provider_code = 'stripe'
       and product.provider_environment = 'test'
       and product.status = 'test_only'
       and product.provider_account_reference = $2
       and product.external_parent_product_reference = $3
       and product.external_product_reference = $4`,
    [priceCode, config.expectedAccountId, config.familyProductId, expectedPrice],
  );
  const catalogRow = catalog.rows[0];
  if (!catalogRow) throw new Error("Rillora Stripe test catalog binding is unavailable");

  const existing = await client.query<{
    order_public_id: string;
    attempt_public_id: string;
    price_id: string;
  }>(
    `select order_row.public_id::text as order_public_id,
            attempt.public_id::text as attempt_public_id,
            order_row.price_id::text
     from app.commerce_payment_attempts attempt
     join app.commerce_orders order_row
       on order_row.id = attempt.order_id and order_row.planner_id = attempt.planner_id
     where attempt.planner_id = app.current_planner_id()
       and attempt.provider_code = 'stripe'
       and attempt.provider_environment = 'test'
       and attempt.idempotency_key = $1`,
    [idempotencyKey],
  );
  if (existing.rows[0] && existing.rows[0].price_id !== catalogRow.price_id) {
    throw new ApiError(409, "stripe_idempotency_conflict", "Idempotency key was used for another price.");
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
         'stripe', 'test', $6, $7, 'created'
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
         app.current_planner_id(), $1, 'stripe', 'test', $2, 'created', $3, $4
       ) returning public_id::text`,
      [order.rows[0]!.id, idempotencyKey, catalogRow.amount_minor, catalogRow.currency_code],
    );
    orderReference = order.rows[0]!.public_id;
    paymentAttemptReference = attempt.rows[0]!.public_id;
  }

  const customer = await client.query<{ provider_customer_reference: string }>(
    `select provider_customer_reference
     from app.commerce_provider_customers
     where planner_id = app.current_planner_id()
       and commerce_account_id = $1
       and provider_code = 'stripe'
       and provider_environment = 'test'
       and status = 'active'
     limit 1`,
    [accountRow.id],
  );
  return Object.freeze({
    commerceAccountReference: accountRow.public_id,
    orderReference,
    paymentAttemptReference,
    providerIdempotencyKey: idempotencyKey,
    existingStripeCustomerReference: customer.rows[0]?.provider_customer_reference ?? null,
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
         payload_sha256, signature_verified, provider_occurred_at
       ) values (
         $1, $2, $3, $4, $5, $6::uuid, $7, $8, $9, $10, $11, true, $12
       )
       on conflict (provider_code, provider_environment, provider_event_reference)
       do update set attempt_count = app.commerce_provider_event_inbox.attempt_count + 1
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
  if (isUuid(signal.commerceAccountReference)) return signal.commerceAccountReference;
  const references = [
    signal.providerSubscriptionReference,
    signal.providerTransactionReference,
    signal.providerRefundReference,
    signal.providerCustomerReference ?? null,
  ].filter((value): value is string => Boolean(value));
  if (references.length === 0) return null;
  return withCommerceInboxDatabase(pool, async (client) => {
    const result = await client.query<{ commerce_account_reference: string }>(
      `select commerce_account_reference::text
       from app.commerce_provider_object_links
       where provider_code = 'stripe'
         and provider_environment = 'test'
         and provider_object_reference = any($1::text[])
       order by id desc limit 1`,
      [references],
    );
    return result.rows[0]?.commerce_account_reference ?? null;
  });
}

async function resolveCustomerReference(
  pool: DatabasePool,
  commerceAccountReference: string,
  directCustomerReference: string | null,
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
           and provider_environment = 'test'
           and status = 'active'
         limit 1`,
        [context.commerceAccountId],
      );
      return customer.rows[0]?.provider_customer_reference ?? null;
    },
  );
  return result ?? null;
}

async function applyAuthoritativeSnapshot(
  client: PoolClient,
  context: { commerceAccountId: string; plannerId: string; publicId: string },
  inboxPublicId: string,
  signal: NormalizedProviderSignal,
  snapshot: AuthoritativeSubscriptionSnapshot,
  config: StripeTestConfig,
): Promise<"applied" | "duplicate"> {
  const duplicate = await client.query(
    `select 1 from app.commerce_provider_events
     where provider_code = 'stripe'
       and provider_environment = 'test'
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
    || snapshot.providerEnvironment !== "test"
    || snapshot.commerceAccountReference !== context.publicId
    || !snapshot.providerCustomerReference?.startsWith("cus_")
    || !snapshot.priceCode
  ) {
    throw new Error("Authoritative Stripe snapshot is outside the test executor contract");
  }

  const expectedPriceId = snapshot.priceCode === "family_usd_monthly_v1"
    ? config.familyPriceIds.monthly
    : snapshot.priceCode === "family_usd_annual_v1"
      ? config.familyPriceIds.annual
      : null;
  if (!expectedPriceId) throw new Error("Authoritative Stripe snapshot uses an unknown price code");
  const price = await client.query<{ id: string; plan_version_id: string }>(
    `select price.id::text, price.plan_version_id::text
     from app.commerce_prices price
     join app.commerce_storefront_products product on product.price_id = price.id
     where price.price_code = $1
       and price.status = 'test_only'
       and product.provider_code = 'stripe'
       and product.provider_environment = 'test'
       and product.provider_account_reference = $2
       and product.external_parent_product_reference = $3
       and product.external_product_reference = $4
       and product.status = 'test_only'`,
    [snapshot.priceCode, config.expectedAccountId, config.familyProductId, expectedPriceId],
  );
  if (!price.rows[0]) throw new Error("Authoritative Stripe price is not bound to Rillora");

  const providerEvent = await client.query<{ id: string; public_id: string }>(
    `insert into app.commerce_provider_events (
       planner_id, commerce_account_id, provider_code, provider_environment,
       provider_event_reference, event_type, signature_verified, payload_sha256,
       processing_status, provider_occurred_at
     ) values (
       app.current_planner_id(), $1, 'stripe', 'test', $2, $3, true, $4,
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

  await client.query(
    `insert into app.commerce_provider_customers (
       planner_id, commerce_account_id, provider_code, provider_environment,
       provider_customer_reference, status
     ) values (app.current_planner_id(), $1, 'stripe', 'test', $2, 'active')
     on conflict (commerce_account_id, provider_code, provider_environment)
     do update set provider_customer_reference = excluded.provider_customer_reference,
                   status = 'active', updated_at = now()`,
    [context.commerceAccountId, snapshot.providerCustomerReference],
  );

  const existing = await client.query<{ id: string; public_id: string; state: string }>(
    `select id::text, public_id::text, state
     from app.commerce_subscriptions
     where planner_id = app.current_planner_id()
       and renewal_provider = 'stripe'
       and provider_environment = 'test'
       and provider_subscription_reference = $1
     limit 1`,
    [snapshot.providerSubscriptionReference],
  );
  let subscriptionId: string;
  let previousState: string | null;
  if (existing.rows[0]) {
    subscriptionId = existing.rows[0].id;
    previousState = existing.rows[0].state;
    await client.query(
      `update app.commerce_subscriptions
       set state = $2, current_period_starts_at = $3, current_period_ends_at = $4,
           cancel_at_period_end = $5, version = version + 1, updated_at = now()
       where id = $1`,
      [
        subscriptionId,
        snapshot.state,
        snapshot.currentPeriodStartsAt ?? null,
        snapshot.currentPeriodEndsAt,
        snapshot.cancelAtPeriodEnd,
      ],
    );
  } else {
    previousState = null;
    const inserted = await client.query<{ id: string }>(
      `insert into app.commerce_subscriptions (
         planner_id, commerce_account_id, plan_version_id, plan_code, price_id,
         acquisition_type, renewal_provider, provider_environment,
         provider_subscription_reference, state, current_period_starts_at,
         current_period_ends_at, cancel_at_period_end
       ) values (
         app.current_planner_id(), $1, $2, 'family', $3, 'purchased',
         'stripe', 'test', $4, $5, $6, $7, $8
       ) returning id::text`,
      [
        context.commerceAccountId,
        price.rows[0].plan_version_id,
        price.rows[0].id,
        snapshot.providerSubscriptionReference,
        snapshot.state,
        snapshot.currentPeriodStartsAt ?? null,
        snapshot.currentPeriodEndsAt,
        snapshot.cancelAtPeriodEnd,
      ],
    );
    subscriptionId = inserted.rows[0]!.id;
  }

  if (previousState !== snapshot.state) {
    await client.query(
      `insert into app.commerce_subscription_state_history (
         planner_id, subscription_id, from_state, to_state, reason_code,
         provider_event_public_id, occurred_at
       ) values (app.current_planner_id(), $1, $2, $3, $4, $5::uuid, $6)`,
      [
        subscriptionId,
        previousState,
        snapshot.state,
        `stripe_authoritative_${snapshot.state}`,
        providerEvent.rows[0]!.public_id,
        snapshot.observedAt,
      ],
    );
  }

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
  await updateOrderAndAttempt(client, signal);
  await insertSignalObjectLinks(client, context.publicId, signal);
  await insertProviderObjectLink(client, {
    objectType: "customer",
    objectReference: snapshot.providerCustomerReference,
    commerceAccountReference: context.publicId,
  });
  await insertProviderObjectLink(client, {
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

async function persistReconciliation(
  client: PoolClient,
  context: { commerceAccountId: string },
  providerEventId: string,
  subscriptionId: string,
  decision: EntitlementReconciliationDecision,
): Promise<void> {
  await client.query(
    `insert into app.commerce_reconciliation_runs (
       planner_id, commerce_account_id, provider_event_id, subscription_id,
       directive, target_state, reason_code, entitlement_mutation_applied
     ) values (app.current_planner_id(), $1, $2, $3, $4, $5, $6, false)`,
    [
      context.commerceAccountId,
      providerEventId,
      subscriptionId,
      decision.directive,
      decision.targetState,
      decision.reason,
    ],
  );
}

async function updateOrderAndAttempt(
  client: PoolClient,
  signal: NormalizedProviderSignal,
): Promise<void> {
  if (isUuid(signal.paymentAttemptReference)) {
    await client.query(
      `update app.commerce_payment_attempts
       set status = 'reconciled', updated_at = now()
       where public_id = $1::uuid and planner_id = app.current_planner_id()`,
      [signal.paymentAttemptReference],
    );
  }
  if (isUuid(signal.orderReference)) {
    await client.query(
      `update app.commerce_orders
       set status = 'paid_reconciled', updated_at = now()
       where public_id = $1::uuid and planner_id = app.current_planner_id()`,
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
    await insertProviderObjectLink(client, {
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
     ) values ('stripe', 'test', $1, $2, $3::uuid, $4::uuid, $5::uuid)
     on conflict (provider_code, provider_environment, provider_object_reference) do nothing`,
    [
      input.objectType,
      input.objectReference,
      input.commerceAccountReference,
      input.orderReference ?? null,
      input.paymentAttemptReference ?? null,
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
): string {
  const digest = createHash("sha256")
    .update(`${plannerId}:${billingPeriod}:${seed}`)
    .digest("base64url")
    .slice(0, 32);
  return `checkout:rillora:${billingPeriod}:${digest}`;
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
