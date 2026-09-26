import { recordSubscriptionObservation, persistReconciliation } from './commerce-subscription-ledger.js';
import type { PoolClient } from "pg";
import {
  type AppleSignedDataVerifying,
  verifyAppleSandboxClientTransaction,
  verifyAppleSandboxNotification,
} from "./apple-storekit-adapter.js";
import type { StoreKitSandboxSnapshotProvider } from "./apple-storekit-server-api.js";
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

export type StoreKitSandboxIntakeResult = Readonly<{
  accepted: true;
  status: "applied" | "needs_authoritative_snapshot" | "duplicate";
  providerEventReference: string;
  finishAuthorized: boolean;
  authoritativeSnapshotLoaded: boolean;
  entitlementChanged: boolean;
  validationOnly?: true;
  sandboxOnly: true;
}>;

export type StoreKitSandboxNotificationResult = Readonly<{
  received: true;
  status:
    | "applied"
    | "needs_authoritative_snapshot"
    | "needs_mapping"
    | "ignored"
    | "duplicate";
  sandboxOnly: true;
}>;

export class StoreKitSandboxIntake {
  constructor(
    private readonly pool: DatabasePool,
    private readonly verifierSource:
      | AppleSignedDataVerifying
      | Promise<AppleSignedDataVerifying>,
    private readonly snapshotProvider: StoreKitSandboxSnapshotProvider | null = null,
  ) {}

  async acceptClientTransaction(input: {
    plannerId: string;
    plannerPublicId: string;
    signedTransaction: string;
    storefrontCountryCode: string;
  }): Promise<StoreKitSandboxIntakeResult> {
    const validationOnly = await withCommercePlannerDatabase(this.pool, input.plannerId, async client =>
      (await client.query("select app.commerce_validation_enabled() as enabled")).rows[0].enabled === true);
    let signal: NormalizedProviderSignal;
    try {
      signal = await verifyAppleSandboxClientTransaction({
        signedTransaction: input.signedTransaction,
        verifier: await this.verifierSource,
        expectedAppAccountToken: input.plannerPublicId,
        expectedStorefrontCountryCode: input.storefrontCountryCode,
      });
    } catch {
      throw new ApiError(
        400,
        "storekit_sandbox_transaction_rejected",
        "The Apple-signed Sandbox transaction was rejected.",
      );
    }
    if (
      signal.provider !== "storekit"
      || signal.providerEnvironment !== "sandbox"
      || signal.accountBindingReference !== input.plannerPublicId
      || !signal.providerSubscriptionReference
      || !signal.providerTransactionReference
    ) {
      throw new Error("Verified StoreKit signal is outside the Sandbox intake contract");
    }

    const reservation = await withCommercePlannerDatabase(
      this.pool,
      input.plannerId,
      async (client) => persistAwaitingSnapshot(client, signal),
    );
    if (reservation.processingStatus === "applied") {
      return Object.freeze({
        accepted: true,
        status: "duplicate",
        providerEventReference: signal.providerEventReference,
        finishAuthorized: true,
        authoritativeSnapshotLoaded: true,
        entitlementChanged: false,
        sandboxOnly: true,
        ...(validationOnly ? { validationOnly: true as const } : {}),
      });
    }
    if (this.snapshotProvider) {
      const applied = await this.loadAndApplySnapshot(
        reservation,
        signal,
      );
      if (applied) {
        return Object.freeze({
          accepted: true,
          status: applied,
          providerEventReference: signal.providerEventReference,
          finishAuthorized: true,
          authoritativeSnapshotLoaded: true,
          entitlementChanged: validationOnly && applied === "applied" && await withCommercePlannerDatabase(this.pool, input.plannerId, async client =>
            (await client.query(`select exists(select 1 from app.commerce_reconciliation_runs r
              join app.commerce_provider_events e on e.id=r.provider_event_id
              where e.provider_code='storekit' and e.provider_event_reference=$1 and r.entitlement_mutation_applied) as changed`,
            [signal.providerEventReference])).rows[0].changed === true),
          sandboxOnly: true,
          ...(validationOnly ? { validationOnly: true as const } : {}),
        });
      }
    }
    return Object.freeze({
      accepted: true,
      status: reservation.attemptCount > 0
        ? "duplicate"
        : "needs_authoritative_snapshot",
      providerEventReference: signal.providerEventReference,
      finishAuthorized: false,
      authoritativeSnapshotLoaded: false,
      entitlementChanged: false,
      sandboxOnly: true,
      ...(validationOnly ? { validationOnly: true as const } : {}),
    });
  }

  async acceptNotification(
    signedPayload: string,
  ): Promise<StoreKitSandboxNotificationResult> {
    let signal: NormalizedProviderSignal;
    try {
      signal = await verifyAppleSandboxNotification({
        signedPayload,
        verifier: await this.verifierSource,
      });
    } catch {
      throw new ApiError(
        400,
        "storekit_sandbox_notification_rejected",
        "The Apple-signed Sandbox notification was rejected.",
      );
    }
    if (signal.provider !== "storekit" || signal.providerEnvironment !== "sandbox") {
      throw new Error("Verified StoreKit notification is outside the Sandbox intake contract");
    }
    const reservation = await withCommerceInboxDatabase(
      this.pool,
      async (client) => persistNotification(client, signal),
    );
    if (
      reservation.attemptCount > 0
      && ["applied", "ignored"].includes(reservation.processingStatus)
    ) {
      return Object.freeze({ received: true, status: "duplicate", sandboxOnly: true });
    }
    if (
      reservation.processingStatus === "needs_mapping"
      || reservation.processingStatus === "ignored"
    ) {
      return Object.freeze({
        received: true,
        status: reservation.processingStatus,
        sandboxOnly: true,
      });
    }
    if (this.snapshotProvider) {
      const applied = await this.loadAndApplySnapshot(reservation, signal);
      if (applied) {
        return Object.freeze({ received: true, status: applied, sandboxOnly: true });
      }
    }
    return Object.freeze({
      received: true,
      status: reservation.attemptCount > 0
        ? "duplicate"
        : "needs_authoritative_snapshot",
      sandboxOnly: true,
    });
  }

  private async loadAndApplySnapshot(
    reservation: InboxReservation,
    signal: NormalizedProviderSignal,
  ): Promise<"applied" | "duplicate" | null> {
    if (
      !this.snapshotProvider
      || !reservation.commerceAccountReference
      || !signal.providerSubscriptionReference
      || !signal.accountBindingReference
    ) return null;
    try {
      const snapshot = await this.snapshotProvider.retrieveAuthoritativeSubscription({
        anyTransactionId:
          signal.providerTransactionReference
          ?? signal.providerSubscriptionReference,
        providerSubscriptionReference: signal.providerSubscriptionReference,
        expectedAppAccountToken: signal.accountBindingReference,
        expectedCommerceAccountReference: reservation.commerceAccountReference,
      });
      const result = await withCommerceAccountDatabase(
        this.pool,
        reservation.commerceAccountReference,
        (client, context) => applyAuthoritativeStoreKitSnapshot(
          client,
          context,
          reservation.publicId,
          signal,
          snapshot,
        ),
      );
      if (!result) throw new Error("Verified StoreKit commerce account was not found");
      return result;
    } catch {
      await markSnapshotUnavailable(this.pool, reservation.publicId);
      return null;
    }
  }
}

type InboxReservation = Readonly<{
  publicId: string;
  commerceAccountReference: string | null;
  processingStatus: string;
  attemptCount: number;
}>;

async function persistAwaitingSnapshot(
  client: PoolClient,
  signal: NormalizedProviderSignal,
): Promise<InboxReservation> {
  const account = await client.query<{ public_id: string }>(
    `with plan as (
       select id, planner_id from app.plans where planner_id = app.current_planner_id()
     ), inserted as (
       insert into app.commerce_accounts (
         planner_id, plan_id, operating_plane_code, service_market_code, status
       )
       select planner_id, id, 'global', 'GLOBAL_US', 'active' from plan
       on conflict (plan_id, operating_plane_code) do nothing
       returning public_id
     )
     select public_id::text from inserted
     union all
     select account.public_id::text
     from app.commerce_accounts account
     where account.planner_id = app.current_planner_id()
       and account.operating_plane_code = 'global'
       and account.service_market_code = 'GLOBAL_US'
       and account.status = 'active'
     limit 1`,
  );
  const commerceAccountReference = account.rows[0]?.public_id;
  if (!commerceAccountReference) {
    throw new Error("Rillora Global commerce account could not be reserved");
  }

  const inbox = await client.query<{
    public_id: string;
    attempt_count: number;
    processing_status: string;
  }>(
    `insert into app.commerce_provider_event_inbox (
       provider_code, provider_environment, provider_event_reference,
       event_type, signal_type, account_binding_reference,
       commerce_account_reference, provider_subscription_reference,
       provider_transaction_reference, provider_refund_reference,
       payload_sha256, signature_verified, provider_occurred_at,
       processing_status, last_error_code
     ) values (
       'storekit', 'sandbox', $1, $2, $3, $4::uuid,
       $5::uuid, $6, $7, $8, $9, true, $10,
       'needs_authoritative_snapshot', 'app_store_server_api_not_configured'
     )
     on conflict (provider_code, provider_environment, provider_event_reference)
     do update set attempt_count = app.commerce_provider_event_inbox.attempt_count + 1
     returning public_id::text, attempt_count, processing_status`,
    [
      signal.providerEventReference,
      signal.sourceEventType,
      signal.signalType,
      signal.accountBindingReference,
      commerceAccountReference,
      signal.providerSubscriptionReference,
      signal.providerTransactionReference,
      signal.providerRefundReference,
      Buffer.from(signal.payloadSha256, "base64url"),
      signal.occurredAt,
    ],
  );

  for (const [objectType, objectReference] of [
    ["original_transaction", signal.providerSubscriptionReference],
    ["transaction", signal.providerTransactionReference],
  ] as const) {
    await client.query(
      `insert into app.commerce_provider_object_links (
         provider_code, provider_environment, provider_object_type,
         provider_object_reference, commerce_account_reference
       ) values ('storekit', 'sandbox', $1, $2, $3::uuid)
       on conflict (provider_code, provider_environment, provider_object_reference)
       do nothing`,
      [objectType, objectReference, commerceAccountReference],
    );
  }
  return Object.freeze({
    publicId: inbox.rows[0]!.public_id,
    commerceAccountReference,
    processingStatus: inbox.rows[0]!.processing_status,
    attemptCount: inbox.rows[0]!.attempt_count,
  });
}

async function applyAuthoritativeStoreKitSnapshot(
  client: PoolClient,
  context: { commerceAccountId: string; plannerId: string; publicId: string },
  inboxPublicId: string,
  signal: NormalizedProviderSignal,
  snapshot: AuthoritativeSubscriptionSnapshot,
): Promise<"applied" | "duplicate"> {
  await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:' || app.current_planner_id()::text,0))");
  const candidate = reconcileCommerceProviderState({ signals: [signal], snapshots: [snapshot] }).entitlementDecisions[0];
  if (!candidate || candidate.directive === "hold") throw new Error("Provider snapshot needs a fresh authoritative reconciliation");
  const duplicate = await client.query(
    `select 1 from app.commerce_provider_events
     where provider_code = 'storekit'
       and provider_environment = 'sandbox'
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
    snapshot.provider !== "storekit"
    || snapshot.providerEnvironment !== "sandbox"
    || snapshot.commerceAccountReference !== context.publicId
    || snapshot.planCode !== "family"
    || !snapshot.priceCode
    || snapshot.providerSubscriptionReference
      !== signal.providerSubscriptionReference
  ) {
    throw new Error("Authoritative StoreKit snapshot is outside the Sandbox executor contract");
  }
  const expectedProductId = snapshot.priceCode === "family_usd_monthly_v1"
    ? "com.rillora.family.monthly"
    : snapshot.priceCode === "family_usd_annual_v1"
      ? "com.rillora.family.annual"
      : null;
  if (!expectedProductId) {
    throw new Error("Authoritative StoreKit snapshot uses an unknown price code");
  }
  const price = await client.query<{ id: string; plan_version_id: string }>(
    `select price.id::text, price.plan_version_id::text
     from app.commerce_prices price
     join app.commerce_storefront_products product on product.price_id = price.id
     where price.price_code = $1
       and price.status = 'test_only'
       and product.provider_code = 'storekit'
       and product.provider_environment = 'sandbox'
       and product.provider_account_reference = 'com.rillora.ios'
       and product.external_parent_product_reference = '22325627'
       and product.external_product_reference = $2
       and product.status = 'test_only'`,
    [snapshot.priceCode, expectedProductId],
  );
  if (!price.rows[0]) {
    throw new Error("Authoritative StoreKit price is not bound to Rillora Sandbox");
  }

  const providerEvent = await client.query<{ id: string; public_id: string }>(
    `insert into app.commerce_provider_events (
       planner_id, commerce_account_id, provider_code, provider_environment,
       provider_event_reference, event_type, signature_verified, payload_sha256,
       processing_status, provider_occurred_at
     ) values (
       app.current_planner_id(), $1, 'storekit', 'sandbox', $2, $3, true, $4,
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

  const subscriptionId = await recordSubscriptionObservation(client, context, signal, snapshot,
    price.rows[0], providerEvent.rows[0]!.public_id);

  const reconciliation = reconcileCommerceProviderState({
    signals: [signal],
    snapshots: [snapshot],
  });
  const decision = reconciliation.entitlementDecisions[0];
  if (!decision) throw new Error("StoreKit reconciliation produced no decision");
  await persistReconciliation(
    client,
    context,
    providerEvent.rows[0]!.id,
    subscriptionId,
    decision,
  );
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

async function markSnapshotUnavailable(
  pool: DatabasePool,
  inboxPublicId: string,
): Promise<void> {
  await withCommerceInboxDatabase(pool, async (client) => {
    await client.query(
      `update app.commerce_provider_event_inbox
       set processing_status = 'needs_authoritative_snapshot',
           last_error_code = 'app_store_server_api_unavailable',
           processed_at = null
       where public_id = $1::uuid
         and processing_status not in ('applied', 'ignored')`,
      [inboxPublicId],
    );
  });
}

async function persistNotification(
  client: PoolClient,
  signal: NormalizedProviderSignal,
): Promise<InboxReservation> {
  const bindingReference = signal.accountBindingReference ?? null;
  const binding = bindingReference
    ? await client.query<{
        planner_id: string;
        commerce_account_reference: string;
      }>(
        `select planner_id::text, commerce_account_reference::text
         from app.resolve_storekit_account_binding($1::uuid)`,
        [bindingReference],
      )
    : null;
  const commerceAccountReference = binding?.rows[0]?.commerce_account_reference ?? null;
  const status = signal.signalType === "unsupported"
    ? "ignored"
    : commerceAccountReference
      ? "needs_authoritative_snapshot"
      : "needs_mapping";
  const lastErrorCode = status === "needs_authoritative_snapshot"
    ? "app_store_server_api_not_configured"
    : status === "needs_mapping"
      ? "account_binding_missing"
      : null;
  const inbox = await client.query<{
    public_id: string;
    attempt_count: number;
    processing_status: string;
  }>(
    `insert into app.commerce_provider_event_inbox (
       provider_code, provider_environment, provider_event_reference,
       event_type, signal_type, account_binding_reference,
       commerce_account_reference, provider_subscription_reference,
       provider_transaction_reference, provider_refund_reference,
       payload_sha256, signature_verified, provider_occurred_at,
       processing_status, last_error_code, processed_at
     ) values (
       'storekit', 'sandbox', $1, $2, $3, $4::uuid,
       $5::uuid, $6, $7, $8, $9, true, $10, $11, $12,
       case when $11 = 'ignored' then now() else null end
     )
     on conflict (provider_code, provider_environment, provider_event_reference)
     do update set attempt_count = app.commerce_provider_event_inbox.attempt_count + 1
     returning public_id::text, attempt_count, processing_status`,
    [
      signal.providerEventReference,
      signal.sourceEventType,
      signal.signalType,
      bindingReference,
      commerceAccountReference,
      signal.providerSubscriptionReference,
      signal.providerTransactionReference,
      signal.providerRefundReference,
      Buffer.from(signal.payloadSha256, "base64url"),
      signal.occurredAt,
      status,
      lastErrorCode,
    ],
  );
  if (commerceAccountReference) {
    for (const [objectType, objectReference] of [
      ["original_transaction", signal.providerSubscriptionReference],
      ["transaction", signal.providerTransactionReference],
    ] as const) {
      if (!objectReference) continue;
      await client.query(
        `insert into app.commerce_provider_object_links (
           provider_code, provider_environment, provider_object_type,
           provider_object_reference, commerce_account_reference
         ) values ('storekit', 'sandbox', $1, $2, $3::uuid)
         on conflict (provider_code, provider_environment, provider_object_reference)
         do nothing`,
        [objectType, objectReference, commerceAccountReference],
      );
    }
  }
  return Object.freeze({
    publicId: inbox.rows[0]!.public_id,
    commerceAccountReference,
    processingStatus: inbox.rows[0]!.processing_status,
    attemptCount: inbox.rows[0]!.attempt_count,
  });
}
