import { fileURLToPath } from "node:url";
import pg, { type Client as PgClient } from "pg";
import { z } from "zod";
import { loadDatabaseConfig } from "./config.js";
import { databaseConnectionOptions } from "./db.js";

const { Client } = pg;

const runtimeCredentialSchema = z.object({
  RUNTIME_DATABASE_USER: z
    .string()
    .regex(/^continuity_runtime(?:_[a-z0-9]+)?$/)
    .default("continuity_runtime"),
  RUNTIME_DATABASE_PASSWORD: z.string().min(32).max(512),
  ROTATE_RUNTIME_DATABASE_PASSWORD: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const grantedRoles = [
  "continuity_app",
  "continuity_auth",
  "continuity_rehearsal",
  "continuity_commerce",
] as const;

async function quoteIdentifier(client: PgClient, value: string): Promise<string> {
  const result = await client.query<{ quoted: string }>("select quote_ident($1) as quoted", [value]);
  const quoted = result.rows[0]?.quoted;
  if (!quoted) throw new Error("PostgreSQL did not quote the runtime-role identifier");
  return quoted;
}

async function quoteLiteral(client: PgClient, value: string): Promise<string> {
  const result = await client.query<{ quoted: string }>("select quote_literal($1) as quoted", [value]);
  const quoted = result.rows[0]?.quoted;
  if (!quoted) throw new Error("PostgreSQL did not quote the runtime-role credential");
  return quoted;
}

export async function bootstrapRuntimeRole(
  client: PgClient,
  runtimeUser: string,
  runtimePassword: string,
  rotateExistingPassword = false,
): Promise<void> {
  await client.query("begin");
  try {
    await client.query("select pg_advisory_xact_lock(hashtext('rillora_runtime_role_bootstrap'))");
    const role = await client.query<{
      exists: boolean;
      rolcanlogin: boolean | null;
      rolsuper: boolean | null;
      rolcreatedb: boolean | null;
      rolcreaterole: boolean | null;
      rolinherit: boolean | null;
    }>(
      `select exists(select 1 from pg_roles where rolname = $1) as exists,
              max(rolcanlogin::int)::boolean as rolcanlogin,
              max(rolsuper::int)::boolean as rolsuper,
              max(rolcreatedb::int)::boolean as rolcreatedb,
              max(rolcreaterole::int)::boolean as rolcreaterole,
              max(rolinherit::int)::boolean as rolinherit
       from pg_roles where rolname = $1`,
      [runtimeUser],
    );
    const quotedRuntimeUser = await quoteIdentifier(client, runtimeUser);
    const quotedRuntimePassword = await quoteLiteral(client, runtimePassword);
    const roleState = role.rows[0];
    if (roleState?.exists) {
      if (
        roleState.rolcanlogin !== true
        || roleState.rolsuper !== false
        || roleState.rolcreatedb !== false
        || roleState.rolcreaterole !== false
        || roleState.rolinherit !== false
      ) {
        throw new Error("Existing runtime database role violates the locked privilege boundary");
      }
      if (rotateExistingPassword) {
        await client.query(`alter role ${quotedRuntimeUser} password ${quotedRuntimePassword}`);
      }
    } else {
      await client.query(
        `create role ${quotedRuntimeUser} with login nosuperuser nocreatedb nocreaterole noinherit password ${quotedRuntimePassword}`,
      );
    }

    for (const grantedRole of grantedRoles) {
      const quotedGrantedRole = await quoteIdentifier(client, grantedRole);
      await client.query(`grant ${quotedGrantedRole} to ${quotedRuntimeUser}`);
    }
    const contentRole=await client.query<{forbidden:boolean}>(
      "select exists(select 1 from pg_roles where rolname in('continuity_content_service','continuity_recovery_service') and pg_has_role($1,oid,'MEMBER')) as forbidden",[runtimeUser]);
    if(contentRole.rows[0]?.forbidden)throw new Error("Runtime database login must not hold content migration authority or recovery authority");
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function main(): Promise<void> {
  const runtime = runtimeCredentialSchema.parse(process.env);
  const client = new Client({
    ...databaseConnectionOptions(loadDatabaseConfig()),
    application_name: "rillora-runtime-bootstrap",
  });
  await client.connect();
  try {
    await bootstrapRuntimeRole(
      client,
      runtime.RUNTIME_DATABASE_USER,
      runtime.RUNTIME_DATABASE_PASSWORD,
      runtime.ROTATE_RUNTIME_DATABASE_PASSWORD,
    );
  } finally {
    await client.end();
  }
}

const executedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (executedDirectly) {
  main()
    .then(() => process.stdout.write("Runtime database role is current.\n"))
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : "Runtime role bootstrap failed"}\n`);
      process.exitCode = 1;
    });
}
