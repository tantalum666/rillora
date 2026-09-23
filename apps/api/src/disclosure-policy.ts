import type { PoolClient } from "pg";

export async function invalidateDisclosureRehearsals(client: PoolClient): Promise<number> {
  const result = await client.query(
    `update app.disclosure_rehearsals
     set invalidated_at = now(), invalidated_reason = 'policy_source_changed',
         version = version + 1, updated_at = now()
     where planner_id = app.current_planner_id() and invalidated_at is null`,
  );
  return result.rowCount ?? 0;
}
