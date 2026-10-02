import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../src/migrate.js';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';

const name = 'rillora_migration_atomicity_test';
const database = dedicatedTestDatabaseUrl(`postgresql://127.0.0.1/${name}`, name);
let client: pg.Client, directory: string;

describe.sequential('migration transaction ownership', () => {
  beforeAll(async () => {
    const adminUrl = new URL(database); adminUrl.pathname = '/postgres';
    const admin = new pg.Client({ connectionString: adminUrl.href });
    await admin.connect();
    try {
      if (!(await admin.query('select 1 from pg_database where datname=$1', [name])).rowCount) {
        await admin.query(`create database ${name}`);
        await admin.query(`comment on database ${name} is 'rillora-disposable-test:${name}'`);
      }
    } finally { await admin.end(); }
    await assertDedicatedTestDatabase(database, name);
    client = new pg.Client({ connectionString: database }); await client.connect();
  });
  beforeEach(async () => {
    if (directory) await rm(directory, { recursive: true });
    directory = await mkdtemp(join(tmpdir(), 'rillora-migration-atomicity-'));
    await client.query('drop schema if exists app cascade');
  });
  afterAll(async () => { await client?.end(); if (directory) await rm(directory, { recursive: true }); });

  it('rolls back wrapped DDL if writing its checksum fails', async () => {
    await runMigrations(database, directory);
    await client.query(`create function app.reject_migration_receipt() returns trigger language plpgsql as $$
      begin raise exception 'synthetic checksum storage failure'; end $$;
      create trigger receipt_failure before insert on app.schema_migrations
      for each row execute function app.reject_migration_receipt()`);
    await writeFile(join(directory, '0001_wrapped.sql'), 'begin;\ncreate table app.atomic_probe(id integer);\ncommit;\n');
    await expect(runMigrations(database, directory)).rejects.toThrow('synthetic checksum storage failure');
    expect((await client.query("select to_regclass('app.atomic_probe') as table_name")).rows[0].table_name).toBeNull();
    expect((await client.query('select count(*)::int as n from app.schema_migrations')).rows[0].n).toBe(0);
  });

  it('retains the migration lock after a wrapped file until the whole batch commits', async () => {
    const barrier = 814721603;
    await client.query('select pg_advisory_lock($1)', [barrier]);
    await writeFile(join(directory, '0001_wrapped.sql'), 'begin;\ncreate table app.first_probe(id integer);\ncommit;\n');
    await writeFile(join(directory, '0002_barrier.sql'), `select pg_advisory_xact_lock(${barrier});\ncreate table app.second_probe(id integer);\n`);
    const migration = runMigrations(database, directory);
    let acquired = false;
    try {
      let waiting = false;
      for (let attempt = 0; attempt < 100 && !waiting; attempt++) {
        waiting = (await client.query(`select exists(select 1 from pg_stat_activity
          where datname=$1 and application_name='continuity-migrate' and wait_event='advisory') as waiting`, [name])).rows[0].waiting;
        if (!waiting) await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
      acquired = (await client.query("select pg_try_advisory_lock(hashtext('continuity_schema_migrations')) as acquired")).rows[0].acquired;
      expect(acquired).toBe(false);
    } finally {
      if (acquired) await client.query("select pg_advisory_unlock(hashtext('continuity_schema_migrations'))");
      await client.query('select pg_advisory_unlock($1)', [barrier]);
      await migration;
    }
    expect((await client.query('select count(*)::int as n from app.schema_migrations')).rows[0].n).toBe(2);
    await runMigrations(database, directory);
    expect((await client.query('select count(*)::int as n from app.schema_migrations')).rows[0].n).toBe(2);
  });
});
