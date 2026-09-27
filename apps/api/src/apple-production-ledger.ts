import { withCommerceAccountDatabase, type DatabasePool } from './db.js';
import type { AppleProductionSnapshot } from './apple-production-server-api.js';
import { requireAppleLease, type AppleDelivery } from './apple-production-inbox.js';
import { persistAppleReceipt, resolveAppleReceiptPrice } from './apple-production-receipts.js';
import { recordSubscriptionObservation, persistReconciliation } from './commerce-subscription-ledger.js';
import { reconcileCommerceProviderState } from './commerce-reconciliation.js';

/** One atomic owner-scoped commit: receipts, current state, grants and queue ack. */
export async function commitAppleObservation(pool: DatabasePool, job: AppleDelivery,
  snapshot: AppleProductionSnapshot): Promise<{ entitlementChanged: boolean }> {
  if (!job.accountReference || !job.signal.accountBindingReference) throw new Error('Apple delivery lacks its owner');
  const result = await withCommerceAccountDatabase(pool, job.accountReference, async (client, context) => {
    await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:' || app.current_planner_id()::text,0))");
    await requireAppleLease(client, job);
    if (!(await client.query(`select 1 from app.resolve_apple_production_account($1)
      where planner_id=app.current_planner_id() and commerce_account_reference=$2`,
    [job.signal.accountBindingReference, context.publicId])).rowCount) throw new Error('Apple account is no longer active');
    if (snapshot.provider !== 'storekit' || snapshot.providerEnvironment !== 'production'
      || snapshot.source !== 'app_store_server_api_signed_status' || snapshot.commerceAccountReference !== context.publicId
      || snapshot.providerSubscriptionReference !== job.signal.providerSubscriptionReference
      || snapshot.receipt.originalTransactionId !== snapshot.providerSubscriptionReference
      || snapshot.receipt.transactionId !== snapshot.providerTransactionReference
      || snapshot.receipt.purchasedAt !== snapshot.currentPeriodStartsAt || snapshot.receipt.paidThrough !== snapshot.currentPeriodEndsAt
      || snapshot.receipt.signedAt !== snapshot.transactionSignedAt || typeof snapshot.renewalIsPossible !== 'boolean') {
      throw new Error('Apple current status conflicts with its signed receipt');
    }
    const price = await resolveAppleReceiptPrice(client, snapshot.receipt);
    if (price.binding_code !== snapshot.priceBindingId || price.price_code !== snapshot.priceCode
      || price.plan_version !== snapshot.planVersion) throw new Error('Apple catalog changed before commit');
    const previous = (await client.query<{ transaction_reference: string; transaction_signed_at: Date;
      renewal_signed_at: Date; purchased_at: Date }>(`select o.* from app.commerce_apple_subscription_observations o
        join app.commerce_subscriptions s on s.id=o.subscription_id
        where s.planner_id=app.current_planner_id() and s.provider_subscription_reference=$1
          and s.renewal_provider='storekit' and s.provider_environment='production' for update of o`,
    [snapshot.providerSubscriptionReference])).rows[0];
    if (previous && (previous.purchased_at > new Date(snapshot.receipt.purchasedAt)
      || previous.renewal_signed_at > new Date(snapshot.renewalSignedAt)
      || (previous.transaction_reference === snapshot.providerTransactionReference
        && previous.transaction_signed_at > new Date(snapshot.transactionSignedAt)))) {
      throw new Error('Apple status regressed behind committed signed evidence');
    }
    const decision = reconcileCommerceProviderState({ signals: [job.signal], snapshots: [snapshot] }).entitlementDecisions[0];
    if (!decision || decision.directive === 'hold') throw new Error('Apple state needs current reconciliation');
    const enabled = (await client.query('select production_entitlements_enabled from app.commerce_runtime_policy where singleton')).rows[0];
    if (!enabled?.production_entitlements_enabled) throw new Error('Production entitlement execution is closed');
    const event = (await client.query<{ id: string; public_id: string }>(`insert into app.commerce_provider_events(
        planner_id,commerce_account_id,provider_code,provider_environment,provider_event_reference,event_type,
        signature_verified,payload_sha256,processing_status,provider_occurred_at)
      values(app.current_planner_id(),$1,'storekit','production',$2,$3,true,$4,'received',$5)
      on conflict(provider_code,provider_environment,provider_event_reference) do update
        set processing_status='received',processed_at=null
        where app.commerce_provider_events.planner_id=app.current_planner_id()
          and app.commerce_provider_events.payload_sha256=excluded.payload_sha256
      returning id::text,public_id::text`, [context.commerceAccountId, job.signal.providerEventReference,
      job.signal.sourceEventType, Buffer.from(job.signal.payloadSha256, 'base64url'), job.signal.occurredAt])).rows[0];
    if (!event) throw new Error('Apple event ownership or evidence changed');
    const subscriptionId = await recordSubscriptionObservation(client, context, job.signal, snapshot, price, event.public_id);
    if (job.signal.receipt) {
      if (job.signal.receipt.originalTransactionId !== snapshot.providerSubscriptionReference) throw new Error('Apple receipt subject mismatch');
      await persistAppleReceipt(client, subscriptionId, job.signal.receipt);
    }
    await persistAppleReceipt(client, subscriptionId, snapshot.receipt);
    await client.query(`insert into app.commerce_apple_subscription_observations(subscription_id,planner_id,
        transaction_reference,transaction_signed_at,renewal_signed_at,purchased_at)
      values($1,app.current_planner_id(),$2,$3,$4,$5) on conflict(subscription_id) do update
      set transaction_reference=excluded.transaction_reference,transaction_signed_at=excluded.transaction_signed_at,
        renewal_signed_at=excluded.renewal_signed_at,purchased_at=excluded.purchased_at`,
    [subscriptionId, snapshot.providerTransactionReference, snapshot.transactionSignedAt,
      snapshot.renewalSignedAt, snapshot.receipt.purchasedAt]);
    const entitlementChanged = await persistReconciliation(client, context, event.id, subscriptionId, decision, snapshot.observedAt);
    if (decision.directive === 'grant' && !entitlementChanged) throw new Error('Apple paid access could not be committed');
    // An already-owned restoration is not another sale. Complete a matching new
    // purchase only when its signed financial facts fit the prepared order; close
    // other own drafts without inventing a second payment.
    await client.query(`with finished as (
        update app.commerce_apple_purchase_sessions session set state=case when
          receipt.purchased_at>=session.created_at-interval '5 minutes'
          and receipt.price_milliunits=orders.amount_minor*power(10::numeric,3-price.minor_unit_exponent)
          and receipt.currency_code=orders.currency_code
          and session.binding_code=receipt.binding_code then 'completed' else 'closed' end,updated_at=now()
        from app.commerce_apple_transaction_receipts receipt,app.commerce_orders orders,app.commerce_prices price
        where session.planner_id=app.current_planner_id() and session.state in ('prepared','started','pending')
          and receipt.transaction_reference=$1 and receipt.planner_id=session.planner_id
          and orders.id=session.order_id and price.id=orders.price_id
          and (receipt.purchased_at>=session.created_at-interval '5 minutes' or $2)
        returning session.order_id,session.state)
      update app.commerce_orders set status=case when finished.state='completed' then 'paid_reconciled' else 'canceled' end,
        updated_at=now() from finished where app.commerce_orders.id=finished.order_id
        and app.commerce_orders.status in ('created','pending')`,
    [snapshot.providerTransactionReference,decision.directive==='grant']);
    await client.query(`update app.commerce_provider_events set processing_status='applied',processed_at=now() where id=$1`, [event.id]);
    await client.query(`update app.commerce_provider_event_inbox set processing_status='applied',processed_at=now(),
      last_error_code=null,lease_token=null,lease_until=null where public_id=$1 and lease_token=$2`, [job.publicId, job.leaseToken]);
    return { entitlementChanged };
  });
  if (!result) throw new Error('Apple commerce account was removed');
  return result;
}
