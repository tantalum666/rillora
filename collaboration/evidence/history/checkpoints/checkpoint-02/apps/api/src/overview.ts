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
    const counts = await client.query<{
      total_matters: number; ready_matters: number; assigned_outcomes: number;
      confirmed_contacts: number; completed_official_checks: number; completed_simulations: number;
    }>(`select
             count(*) filter (where m.archived_at is null)::int as total_matters,
             count(*) filter (where m.archived_at is null and m.status = 'ready')::int as ready_matters,
             count(*) filter (
               where m.archived_at is null and m.desired_outcome <> 'undecided'
             )::int as assigned_outcomes,
             (select count(*)::int from app.people p
              where p.planner_id = app.current_planner_id() and p.status = 'confirmed') as confirmed_contacts,
             (select count(*)::int from app.official_setup_checks o
              where o.planner_id = app.current_planner_id() and o.completed) as completed_official_checks,
             (select count(*)::int from app.claim_simulations s
              where s.planner_id = app.current_planner_id()) as completed_simulations
           from app.matter_items m
           where m.planner_id = app.current_planner_id()`);
    const readiness = counts.rows[0]!;
    const activated = readiness.total_matters >= 5 && readiness.assigned_outcomes >= 5
      && readiness.confirmed_contacts >= 1 && readiness.completed_simulations >= 1;
    return {
      session, plan: mapPlan(plan), matters: matters.rows.slice(0, 50).map(mapMatter),
      nextCursor: matters.rows.length > 50 ? matters.rows[49]!.public_id : null,
      trustedContacts: contacts.map(mapContact),
      readiness: {
        totalMatters: readiness.total_matters, readyMatters: readiness.ready_matters,
        assignedOutcomes: readiness.assigned_outcomes, confirmedContacts: readiness.confirmed_contacts,
        completedOfficialChecks: readiness.completed_official_checks, completedSimulations: readiness.completed_simulations,
        verifiedEmergencyPlan: activated, confirmationEvidenceMayBeSimulated: true,
      },
    };
  });
}
