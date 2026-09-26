import type { PoolClient } from 'pg';
import type { AuthoritativeSubscriptionSnapshot, NormalizedProviderSignal } from './commerce-provider-contract.js';
import type { EntitlementReconciliationDecision } from './commerce-reconciliation.js';

type AccountContext = Readonly<{ commerceAccountId: string; publicId: string }>;
type BoundPrice = Readonly<{ id: string; plan_version_id: string }>;

/** Called inside the provider's owner-scoped transaction after verification/catalog binding. */
export async function recordSubscriptionObservation(client: PoolClient, context: AccountContext,
  signal: NormalizedProviderSignal, snapshot: AuthoritativeSubscriptionSnapshot,
  price: BoundPrice, eventPublicId: string, financialOverride: 'refunded' | 'revoked' | null = null): Promise<string> {
  if (snapshot.commerceAccountReference !== context.publicId || snapshot.provider !== signal.provider
    || snapshot.providerEnvironment !== signal.providerEnvironment
    || snapshot.providerSubscriptionReference !== signal.providerSubscriptionReference || snapshot.planCode !== 'family') {
    throw new Error('Verified subscription observation is outside its ledger account or provider');
  }
  await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:' || app.current_planner_id()::text,0))");
  const existing = (await client.query<{
    id: string; state: string; provider_observed_at: Date | null;
  }>(`select id::text,state,provider_observed_at from app.commerce_subscriptions
      where planner_id=app.current_planner_id() and commerce_account_id=$1
        and renewal_provider=$2 and provider_environment=$3 and provider_subscription_reference=$4
      for update`, [context.commerceAccountId, snapshot.provider, snapshot.providerEnvironment,
    snapshot.providerSubscriptionReference])).rows[0];
  if (existing?.provider_observed_at && existing.provider_observed_at > new Date(snapshot.observedAt)) {
    throw new Error('Stale authoritative subscription observation; retry with current provider state');
  }
  let subscriptionId: string;
  if (existing) {
    subscriptionId = existing.id;
    await client.query(`update app.commerce_subscriptions set state=$2,
        current_period_starts_at=$3,current_period_ends_at=$4,grace_ends_at=$5,
        cancel_at_period_end=$6,price_id=$7,plan_version_id=$8,
        provider_observed_at=$9,provider_invoice_reference=$10,financial_state_override=$11,
        version=version+1,updated_at=now()
      where id=$1 and planner_id=app.current_planner_id()`, [subscriptionId, snapshot.state,
      snapshot.currentPeriodStartsAt ?? null, snapshot.currentPeriodEndsAt, snapshot.graceEndsAt ?? null,
      snapshot.cancelAtPeriodEnd, price.id, price.plan_version_id, snapshot.observedAt,
      snapshot.providerInvoiceReference ?? null, financialOverride]);
  } else {
    subscriptionId = (await client.query<{ id: string }>(`insert into app.commerce_subscriptions(
        planner_id,commerce_account_id,plan_version_id,plan_code,price_id,acquisition_type,
        renewal_provider,provider_environment,provider_subscription_reference,state,
        current_period_starts_at,current_period_ends_at,grace_ends_at,cancel_at_period_end,
        provider_observed_at,provider_invoice_reference,financial_state_override)
      values(app.current_planner_id(),$1,$2,'family',$3,'purchased',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      returning id::text`, [context.commerceAccountId, price.plan_version_id, price.id,
      snapshot.provider, snapshot.providerEnvironment, snapshot.providerSubscriptionReference, snapshot.state,
      snapshot.currentPeriodStartsAt ?? null, snapshot.currentPeriodEndsAt, snapshot.graceEndsAt ?? null,
      snapshot.cancelAtPeriodEnd, snapshot.observedAt, snapshot.providerInvoiceReference ?? null,
      financialOverride])).rows[0]!.id;
  }
  if (existing?.state !== snapshot.state) {
    await client.query(`insert into app.commerce_subscription_state_history(
        planner_id,subscription_id,from_state,to_state,reason_code,provider_event_public_id,occurred_at)
      values(app.current_planner_id(),$1,$2,$3,$4,$5::uuid,$6)`, [subscriptionId,
      existing?.state ?? null, snapshot.state, `${snapshot.provider}_authoritative_${snapshot.state}`,
      eventPublicId, snapshot.observedAt]);
  }
  return subscriptionId;
}

/** Every provider uses the same SQL entitlement/permission clock and audit result. */
export async function persistReconciliation(client: PoolClient, context: { commerceAccountId: string },
  providerEventId: string, subscriptionId: string, decision: EntitlementReconciliationDecision): Promise<boolean> {
  if (decision.directive === 'hold') throw new Error('Unresolved provider state cannot mutate entitlements');
  const applied = (await client.query<{ applied: boolean }>(
    'select app.apply_verified_subscription_entitlements($1) as applied', [subscriptionId])).rows[0]?.applied === true;
  await client.query(`insert into app.commerce_reconciliation_runs(
      planner_id,commerce_account_id,provider_event_id,subscription_id,directive,target_state,
      reason_code,entitlement_mutation_applied)
    values(app.current_planner_id(),$1,$2,$3,$4,$5,$6,$7)`, [context.commerceAccountId,
    providerEventId, subscriptionId, decision.directive, decision.targetState, decision.reason, applied]);
  return applied;
}
