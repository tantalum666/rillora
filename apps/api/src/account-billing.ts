import type { PoolClient } from 'pg';

/** Pending provider work is billing activity even before a subscription arrives. */
export async function accountBillingStatus(client: PoolClient) {
  const { rows } = await client.query<{ provider: string; kind: 'subscription' | 'pending' }>(`
    select distinct renewal_provider as provider, 'subscription' as kind
      from app.commerce_subscriptions where planner_id=app.current_planner_id()
    union
    select distinct provider_code as provider, 'pending' as kind from app.commerce_orders
      where planner_id=app.current_planner_id() and status in ('created','pending','paid_pending_reconciliation')`);
  return {
    hasSubscription: rows.some(row => row.kind === 'subscription'),
    hasPendingPurchase: rows.some(row => row.kind === 'pending'),
    providers: [...new Set(rows.map(row => row.provider))].sort(),
  };
}
