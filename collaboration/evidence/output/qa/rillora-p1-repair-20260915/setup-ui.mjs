import { runMigrations } from '../../../apps/api/src/migrate.ts';
import pg from '../../../apps/api/node_modules/pg/lib/index.js';
const database = 'postgresql:///continuity_p1_repair_20260915';
await runMigrations(database);
const pool = new pg.Pool({ connectionString: database });
for (const [id, name] of [
  ['11111111-1111-4111-8111-111111111111', 'Alex QA'],
  ['22222222-2222-4222-8222-222222222222', 'Parent QA'],
  ['33333333-3333-4333-8333-333333333333', 'Friend QA'],
  ['44444444-4444-4444-8444-444444444444', 'Empty QA'],
]) {
  const p = await pool.query(`insert into app.planners(public_id,display_name,locale,time_zone)
    values($1,$2,'en','Asia/Hong_Kong') on conflict(public_id) do update set display_name=excluded.display_name returning id`, [id,name]);
  await pool.query(`insert into app.plans(planner_id,status,first_use_state,first_use_step)
    values($1,'draft','available',0) on conflict(planner_id) do nothing`,[p.rows[0].id]);
}
await pool.end();
console.log('Three isolated synthetic planners ready; no user sessions or external identities.');
