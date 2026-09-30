import pg from 'pg';
import express from 'express';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db.js';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/migrate.js';
import { seedDevelopmentFixture } from '../src/seed-dev.js';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';

// A reproducible local-only UI fixture. No inherited application/provider config,
// cloud URL, real identity, or configurable database name is accepted.
const name = 'rillora_native_ui_test';
const url = dedicatedTestDatabaseUrl(`postgresql://127.0.0.1:5432/${name}`, name);
const port = Number(process.env.RILLORA_MATRIX_API_PORT ?? 4395);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid local fixture port');
const adminUrl = new URL(url); adminUrl.pathname = '/postgres';
await assertDedicatedTestDatabase(adminUrl.toString(), 'postgres');
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
try {
  if (!(await admin.query('select 1 from pg_database where datname=$1', [name])).rowCount) {
    await admin.query('create database rillora_native_ui_test');
  }
} finally { await admin.end(); }
await assertDedicatedTestDatabase(url, name);
const owner = new pg.Client({ connectionString: url });
await owner.connect();
if (!(await owner.query("select pg_try_advisory_lock(hashtext('rillora-native-ui-fixture')) as acquired")).rows[0].acquired) {
  await owner.end(); throw new Error('Another UI fixture owns this database');
}
await runMigrations(url);
const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, ALLOW_DEV_AUTH: 'true',
  ALLOW_FAMILY_MAINTENANCE_PREVIEW: 'true',
  CORS_ORIGINS: `http://127.0.0.1:${port}` });
const pool = createPool(config);
await pool.query('truncate app.commerce_provider_event_inbox, app.planners restart identity cascade');
await seedDevelopmentFixture(pool);
for (const id of ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333',
  'c6a631bb-f907-4260-aaae-58b116738a27', 'd30d0270-4520-49b6-bef2-9d7dc2b4376c']) {
  const planner = (await pool.query("insert into app.planners(public_id,display_name) values($1,'Synthetic UI planner') returning id", [id])).rows[0].id;
  const empty = id.startsWith('33333333');
  const plan = (await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active',$2,$3) returning id",
    [planner, empty ? 'available' : 'completed', empty ? 0 : 2])).rows[0].id;
  if (id.startsWith('22222222')) await pool.query(`insert into app.matter_items(planner_id,plan_id,category,title,location_hint,desired_outcome)
    select $1,$2,'document','Pagination record '||lpad(n::text,2,'0'),'Synthetic blue folder','notify' from generate_series(1,51) n`, [planner, plan]);
}
const app = express();
app.get('/qa/native-ui-fixture', (_request, response) => response.json({ fixture: 'rillora-native-ui-v1', syntheticOnly: true, database: name }));
app.use(createApp(pool, config));
const server = app.listen(port, '127.0.0.1', () => console.log(`Synthetic native UI fixture ready on 127.0.0.1:${port}`));
async function stop() { server.close(); await pool.end(); await owner.end(); }
process.once('SIGTERM', () => { void stop(); });
process.once('SIGINT', () => { void stop(); });
server.once('error', error => { console.error(error.message); void stop(); process.exitCode = 1; });
