import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";
import { loadConfig } from "./config.js";
import { createPool, type DatabasePool } from "./db.js";

export const developmentPlannerPublicId = "11111111-1111-4111-8111-111111111111";

export async function seedDevelopmentFixture(pool: DatabasePool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const planner = await client.query<{ id: string }>(
      `insert into app.planners (public_id, display_name, locale, time_zone, residence_country_code)
       values ($1, 'Alex Chen', 'en', 'Asia/Shanghai', 'CN')
       on conflict (public_id) do update set updated_at = now()
       returning id::text`,
      [developmentPlannerPublicId],
    );
    const plannerId = planner.rows[0]?.id;
    if (!plannerId) throw new Error("Unable to create development planner");

    const plan = await client.query<{ id: string }>(
      `insert into app.plans (
         planner_id, motivation, status, first_use_state, first_use_step
       ) values ($1, 'complex_digital_life', 'active', 'completed', 2)
       on conflict (planner_id) do update
       set first_use_state = 'completed', first_use_step = 2, updated_at = now()
       returning id::text`,
      [plannerId],
    );
    const planId = plan.rows[0]?.id;
    if (!planId) throw new Error("Unable to create development plan");

    const matterCount = await client.query<{ count: string }>(
      "select count(*)::text as count from app.matter_items where plan_id = $1",
      [planId],
    );
    if (matterCount.rows[0]?.count === "0") {
      await insertFixtureMatters(client, plannerId, planId);
    }

    const people = await client.query<{ id: string }>(
      `select id::text from app.people
       where planner_id = $1 and display_name = 'Maya Chen' and archived_at is null
       limit 1`,
      [plannerId],
    );
    let personId = people.rows[0]?.id;
    if (!personId) {
      const person = await client.query<{ id: string }>(
        `insert into app.people (planner_id, display_name, relationship_label, status)
         values ($1, 'Maya Chen', 'Sister', 'confirmed')
         returning id::text`,
        [plannerId],
      );
      personId = person.rows[0]?.id;
    }
    if (!personId) throw new Error("Unable to create development trusted contact");

    const assignment = await client.query<{ id: string }>(
      `insert into app.role_assignments (planner_id, plan_id, person_id, role, status)
       values ($1, $2, $3, 'trusted_contact', 'accepted')
       on conflict (planner_id, person_id, role, (coalesce(matter_item_id, 0)))
       where status <> 'revoked'
       do update set status = 'accepted', updated_at = now()
       returning id::text`,
      [plannerId, planId, personId],
    );
    const assignmentId = assignment.rows[0]?.id;
    if (!assignmentId) throw new Error("Unable to create development role assignment");

    const existingInvitation = await client.query(
      `select 1 from app.invitations
       where planner_id = $1 and role_assignment_id = $2 and status = 'accepted' limit 1`,
      [plannerId, assignmentId],
    );
    if (existingInvitation.rowCount === 0) {
      await client.query(
        `insert into app.invitations (
           planner_id, person_id, role_assignment_id, delivery_channel, status, accepted_at
         ) values ($1, $2, $3, 'simulation', 'accepted', now())`,
        [plannerId, personId, assignmentId],
      );
    }

    for (const provider of ["apple", "google", "meta", "github", "password_manager"]) {
      await client.query(
        `insert into app.official_setup_checks (
           planner_id, plan_id, provider_key, policy_version, completed, completed_at
         ) values ($1, $2, $3, 'initial-2026-08-04', false, null)
         on conflict (plan_id, provider_key) do nothing`,
        [plannerId, planId, provider],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function insertFixtureMatters(
  client: PoolClient,
  plannerId: string,
  planId: string,
): Promise<void> {
  const matters = [
    ["financial_asset", "Bank account", "Northstar Bank", "ready", "notify"],
    ["account", "Cloud photos", "Apple", "ready", "transfer_request"],
    ["account", "GitHub projects", "GitHub", "ready", "transfer_request"],
    ["document", "Insurance", "Harbor Mutual", "draft", "undecided"],
    ["subscription", "Subscriptions", null, "draft", "close"],
  ] as const;
  for (const [category, title, institution, status, desiredOutcome] of matters) {
    await client.query(
      `insert into app.matter_items (
         planner_id, plan_id, category, title, institution_name, status, desired_outcome
       ) values ($1, $2, $3, $4, $5, $6, $7)`,
      [plannerId, planId, category, title, institution, status, desiredOutcome],
    );
  }
}

const executedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (executedDirectly) {
  const config = loadConfig();
  if (config.nodeEnv === "production") {
    throw new Error("Development fixtures cannot be seeded in production");
  }
  const pool = createPool(config);
  seedDevelopmentFixture(pool)
    .then(() => process.stdout.write(`Development planner: ${developmentPlannerPublicId}\n`))
    .finally(() => pool.end());
}
