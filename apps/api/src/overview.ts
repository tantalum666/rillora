import { loadReadiness } from "./readiness.js";
import { withPlannerDatabase, type DatabasePool } from "./db.js";
import { getPlan, mapPlan, mapMatter, mapContact, selectTrustedContacts, type MatterRow } from "./planner-records.js";

type OverviewSession = { plannerPublicId: string; authenticationMode: string; authenticationMethods: string[]; authenticatedAt: Date | string | null };

// One authenticated transaction replaces five separately authenticated HTTP requests.
export async function fetchInitialOverview(pool: DatabasePool, plannerId: string, session: OverviewSession) {
  return withPlannerDatabase(pool, plannerId, async (client) => {
    const plan = await getPlan(client);
    const matters = await client.query<MatterRow>(`select * from app.matter_items
      where planner_id = app.current_planner_id() and archived_at is null order by id limit 51`);
    const contacts = await selectTrustedContacts(client);
    const readiness = await loadReadiness(client);
    return {
      session, plan: mapPlan(plan), matters: matters.rows.slice(0, 50).map(mapMatter),
      nextCursor: matters.rows.length > 50 ? matters.rows[49]!.public_id : null,
      trustedContacts: contacts.map(mapContact),
      readiness,
    };
  });
}
