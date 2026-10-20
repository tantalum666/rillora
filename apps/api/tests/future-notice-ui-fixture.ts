import pg from "pg";
import express from "express";
import { loadConfig } from "../src/config.js";
import { createPool } from "../src/db.js";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/migrate.js";
import { seedDevelopmentFixture } from "../src/seed-dev.js";
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from "./dedicated-test-database.js";

// Isolated, loopback-only UI fixture. It never loads ambient application/cloud config.
const name = "continuity_future_notice_ui_test";
const url = dedicatedTestDatabaseUrl(`postgresql://127.0.0.1:5432/${name}`, name);
const adminUrl = new URL(url); adminUrl.pathname = "/postgres";
await assertDedicatedTestDatabase(adminUrl.toString(), "postgres");
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
try {
  if (!(await admin.query("select 1 from pg_database where datname=$1", [name])).rowCount) {
    await admin.query("create database continuity_future_notice_ui_test");
  }
} finally { await admin.end(); }
await assertDedicatedTestDatabase(url, name);
const lock = new pg.Client({ connectionString: url });
await lock.connect();
if (!(await lock.query("select pg_try_advisory_lock(hashtext('future-notice-ui-fixture')) as acquired")).rows[0].acquired) {
  await lock.end(); throw new Error("Another fixture owns this database");
}
await runMigrations(url);
// Generated links use the same trusted public origin as the native link validator.
// All API traffic remains loopback; the test never sends these links to a recipient.
const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: url, ALLOW_DEV_AUTH: "true",
  CORS_ORIGINS: "https://app.rillora.xyz,http://127.0.0.1:4396" });
const pool = createPool(config);
await pool.query("truncate app.planners restart identity cascade");
await seedDevelopmentFixture(pool);
const recipient = (await pool.query(`insert into app.planners(public_id,display_name)
 values('22222222-2222-4222-8222-222222222222','Synthetic recipient') returning id`)).rows[0].id;
await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2)", [recipient]);
const app = express();
app.get("/qa/future-notice-fixture", (_req, res) => res.json({ fixture: "future-notice-ui-v1", syntheticOnly: true }));
app.use(createApp(pool, config, { futureNoticesEnabled: true }));
const server = app.listen(4396, "127.0.0.1", () => console.log("Future-notice synthetic UI fixture ready at 127.0.0.1:4396"));
async function stop() { server.close(); await pool.end(); await lock.end(); }
process.once("SIGTERM", () => { void stop(); });
process.once("SIGINT", () => { void stop(); });
server.once("error", error => { console.error(error.message); void stop(); process.exitCode = 1; });
