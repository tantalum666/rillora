import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bootstrapRuntimeRole } from "../src/bootstrap-runtime.js";
import { runMigrations } from "../src/migrate.js";

const { Client } = pg;
const databaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql:///continuity_test";
const runtimeRole = "continuity_runtime_staging_test";
const runtimePassword = "local-test-runtime-password-0000000001";

let client: InstanceType<typeof Client>;

describe.sequential("runtime database role bootstrap", () => {
  beforeAll(async () => {
    await runMigrations(databaseUrl);
    client = new Client({ connectionString: databaseUrl, application_name: "runtime-role-test" });
    await client.connect();
    const database = await client.query<{ database: string }>("select current_database() as database");
    if (database.rows[0]?.database !== "continuity_test") {
      throw new Error("Runtime-role tests refuse to modify roles outside continuity_test");
    }
    await client.query(`drop role if exists ${runtimeRole}`);
  });

  afterAll(async () => {
    if (!client) return;
    await client.query(`drop role if exists ${runtimeRole}`);
    await client.end();
  });

  it("creates a non-inheriting login that can assume only the application roles", async () => {
    await bootstrapRuntimeRole(client, runtimeRole, runtimePassword);
    const role = await client.query<{
      rolcanlogin: boolean;
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
      rolinherit: boolean;
    }>(
      "select rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolinherit from pg_roles where rolname = $1",
      [runtimeRole],
    );
    expect(role.rows[0]).toEqual({
      rolcanlogin: true,
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolinherit: false,
    });

    for (const membership of [
      "continuity_app",
      "continuity_auth",
      "continuity_rehearsal",
      "continuity_commerce",
    ]) {
      const result = await client.query<{ member: boolean }>(
        "select pg_has_role($1, $2, 'MEMBER') as member",
        [runtimeRole, membership],
      );
      expect(result.rows[0]?.member).toBe(true);
    }
    const contentRole = await client.query<{member:boolean}>("select pg_has_role($1,'continuity_content_service','MEMBER') as member",[runtimeRole]);
    expect(contentRole.rows[0]?.member).toBe(false);
    const local=new URL(databaseUrl);
    const runtime=new Client({host:local.hostname||'localhost',port:Number(local.port||5432),database:local.pathname.slice(1),user:runtimeRole,password:runtimePassword});
    await runtime.connect();
    try {
      expect((await runtime.query('select session_user')).rows[0].session_user).toBe(runtimeRole);
      await runtime.query('set role continuity_app');
      await runtime.query("select set_config('app.content_migration','true',false)");
      await expect(runtime.query('select app.content_migration_active()')).rejects.toThrow('permission denied');
      await expect(runtime.query('set role continuity_content_service')).rejects.toThrow('permission denied');
    }finally{await runtime.end();}
  });

  it("rotates the credential without widening privileges", async () => {
    await bootstrapRuntimeRole(client, runtimeRole, `${runtimePassword}-rotated`, true);
    const result = await client.query<{ rolinherit: boolean; rolsuper: boolean }>(
      "select rolinherit, rolsuper from pg_roles where rolname = $1",
      [runtimeRole],
    );
    expect(result.rows[0]).toEqual({ rolinherit: false, rolsuper: false });
  });
});
