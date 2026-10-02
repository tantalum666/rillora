import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { loadDatabaseConfig, type DatabaseConfig } from "./config.js";
import { databaseConnectionOptions } from "./db.js";
import { migrationTransactionBody } from "./migration-sql.js";

const { Client } = pg;

export async function runMigrations(
  database: DatabaseConfig | string,
  migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations"),
): Promise<void> {
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
    .sort();

  const connection =
    typeof database === "string"
      ? { connectionString: database, ssl: false }
      : databaseConnectionOptions(database);
  const client = new Client({ ...connection, application_name: "continuity-migrate" });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("set local standard_conforming_strings = on");
    await client.query("select pg_advisory_xact_lock(hashtext('continuity_schema_migrations'))");
    await client.query("create schema if not exists app");
    await client.query(`
      create table if not exists app.schema_migrations (
        name text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `);

    for (const name of migrationFiles) {
      const sql = await readFile(join(migrationsDirectory, name), "utf8");
      const checksum = createHash("sha256").update(sql, "utf8").digest("hex");
      const existing = await client.query<{ checksum: string }>(
        "select checksum from app.schema_migrations where name = $1",
        [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`Applied migration checksum changed: ${name}`);
        }
        continue;
      }
      await client.query(migrationTransactionBody(sql));
      await client.query(
        "insert into app.schema_migrations (name, checksum) values ($1, $2)",
        [name, checksum],
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

const executedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (executedDirectly) {
  runMigrations(loadDatabaseConfig())
    .then(() => {
      process.stdout.write("Database migrations are current.\n");
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : "Migration failed"}\n`);
      process.exitCode = 1;
    });
}
