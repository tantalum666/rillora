import type { PoolClient } from 'pg';

/** Shared overview/standalone projection. Counts are preparation, not verification. */
export async function loadReadiness(client: PoolClient) {
  const result = await client.query<{
    total_matters: number; ready_matters: number; assigned_outcomes: number;
    confirmed_contacts: number; completed_official_checks: number; completed_simulations: number;
  }>(`select
    count(*) filter (where m.archived_at is null)::int as total_matters,
    count(*) filter (where m.archived_at is null and m.status='ready')::int as ready_matters,
    count(*) filter (where m.archived_at is null and m.desired_outcome<>'undecided')::int as assigned_outcomes,
    (select count(*)::int from app.people p where p.planner_id=app.current_planner_id() and p.status='confirmed') as confirmed_contacts,
    (select count(*)::int from app.official_setup_checks o where o.planner_id=app.current_planner_id() and o.completed) as completed_official_checks,
    (select count(*)::int from app.claim_simulations s where s.planner_id=app.current_planner_id()) as completed_simulations
    from app.matter_items m where m.planner_id=app.current_planner_id()`);
  const counts = result.rows[0]!;
  return {
    totalMatters: counts.total_matters,
    readyMatters: counts.ready_matters,
    assignedOutcomes: counts.assigned_outcomes,
    confirmedContacts: counts.confirmed_contacts,
    completedOfficialChecks: counts.completed_official_checks,
    completedSimulations: counts.completed_simulations,
    // Retained for older client decoding. No real verification process exists;
    // simulated invitations or count thresholds must never turn this true.
    verifiedEmergencyPlan: false,
    confirmationEvidenceMayBeSimulated: true,
  };
}
