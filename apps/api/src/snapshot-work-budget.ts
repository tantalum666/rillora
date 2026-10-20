import type { PoolClient } from 'pg';
import { ApiError } from './errors.js';

/** Large snapshots may not let one account occupy every pooled connection. */
export async function admitPlannerSnapshot(client: PoolClient): Promise<void> {
  const row = (await client.query<{ allowed: boolean }>(
    "select pg_try_advisory_xact_lock(hashtextextended('snapshot:'||app.current_planner_id()::text,0)) as allowed",
  )).rows[0];
  if (!row?.allowed) throw new ApiError(429, 'snapshot_busy', 'Another export is being prepared. Try again shortly.');
  await client.query("set local statement_timeout='5s'");
}
