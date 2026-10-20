import type { PoolClient } from "pg";

/** Append metadata to the current planner's transaction, never private record text. */
export async function appendPlannerAudit(
  client: PoolClient,
  action: string,
  resourceType: string,
  resourcePublicId: string | null,
  metadata: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `insert into app.audit_events (
       planner_id, actor_type, action, resource_type, resource_public_id, metadata
     ) values (app.current_planner_id(), 'planner', $1, $2, $3, $4::jsonb)`,
    [action, resourceType, resourcePublicId, JSON.stringify(metadata)],
  );
}
