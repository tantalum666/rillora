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
  DATABASE_AUTHORITY_KEY: z.string().regex(/^[A-Za-z0-9_-]{48,128}$/),
  RECOVERY_ATTESTATION_KEY: z.string().regex(/^[A-Za-z0-9_-]{48,128}$/).optional(),
  DELETION_DATABASE_USER: z.string().regex(/^continuity_deletion_(production|staging)$/).optional(),
  DELETION_DATABASE_PASSWORD: z.string().min(32).max(512).optional(),
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

async function bootstrapServiceRole(
  client: PgClient,
  runtimeUser: string,
  runtimePassword: string,
  rotateExistingPassword = false,
  authorityKey?: string,
  roles: readonly string[] = grantedRoles,
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
      rolbypassrls: boolean | null;
      rolreplication: boolean | null;
    }>(
      `select exists(select 1 from pg_roles where rolname = $1) as exists,
              max(rolcanlogin::int)::boolean as rolcanlogin,
              max(rolsuper::int)::boolean as rolsuper,
              max(rolcreatedb::int)::boolean as rolcreatedb,
              max(rolcreaterole::int)::boolean as rolcreaterole,
              max(rolinherit::int)::boolean as rolinherit,
              max(rolbypassrls::int)::boolean as rolbypassrls,
              max(rolreplication::int)::boolean as rolreplication
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
        || roleState.rolbypassrls !== false
        || roleState.rolreplication !== false
      ) {
        throw new Error("Existing runtime database role violates the locked privilege boundary");
      }
      if (rotateExistingPassword) {
        await client.query(`alter role ${quotedRuntimeUser} password ${quotedRuntimePassword}`);
      }
    } else {
      await client.query(
        `create role ${quotedRuntimeUser} with login nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication password ${quotedRuntimePassword}`,
      );
    }

    for (const grantedRole of roles) {
      const quotedGrantedRole = await quoteIdentifier(client, grantedRole);
      await client.query(`grant ${quotedGrantedRole} to ${quotedRuntimeUser}`);
    }
    // An allowlist also rejects future service roles and indirect memberships.
    // NOINHERIT alone does not prevent the login from using SET ROLE.
    const memberships = await client.query<{ forbidden: boolean }>(
      `select exists(select 1 from pg_roles where rolname <> $1
       and not (rolname = any($2::text[])) and pg_has_role($1,oid,'MEMBER')) as forbidden`,
      [runtimeUser, [...roles]],
    );
    if (memberships.rows[0]?.forbidden) throw new Error("Existing runtime database role violates the locked privilege boundary: unexpected role membership");
    if (authorityKey !== undefined) {
      if (!/^[A-Za-z0-9_-]{48,128}$/.test(authorityKey)) throw new Error('Invalid database authority configuration');
      await client.query(`insert into rillora_guard.runtime_authority(singleton,signing_key) values(true,$1)
        on conflict(singleton) do update set signing_key=excluded.signing_key`, [authorityKey]);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

export async function bootstrapRuntimeRole(client:PgClient,user:string,password:string,rotate=false,authorityKey?:string):Promise<void>{
  return bootstrapServiceRole(client,user,password,rotate,authorityKey,grantedRoles);
}
export async function bootstrapDeletionWorkerRole(client:PgClient,user:string,password:string,rotate=false):Promise<void>{
  if(!/^continuity_deletion_(production|staging)(?:_test)?$/.test(user))throw new Error('Invalid deletion worker login');
  return bootstrapServiceRole(client,user,password,rotate,undefined,['continuity_deletion_worker']);
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
      runtime.DATABASE_AUTHORITY_KEY,
    );
    if(Boolean(runtime.DELETION_DATABASE_USER)!==Boolean(runtime.DELETION_DATABASE_PASSWORD))throw new Error('Incomplete deletion worker credential');
    if(runtime.DELETION_DATABASE_USER&&runtime.DELETION_DATABASE_PASSWORD){
      await bootstrapDeletionWorkerRole(client,runtime.DELETION_DATABASE_USER,runtime.DELETION_DATABASE_PASSWORD,runtime.ROTATE_RUNTIME_DATABASE_PASSWORD);
    }
    if(process.env.RECOVERY_JOURNAL_TABLE&&!runtime.RECOVERY_ATTESTATION_KEY)throw new Error('Recovery attestation key required');
    if(runtime.RECOVERY_ATTESTATION_KEY){
      await client.query('insert into rillora_guard.journal_authority(singleton,signing_key) values(true,$1) on conflict(singleton) do update set signing_key=excluded.signing_key',[runtime.RECOVERY_ATTESTATION_KEY]);
    }
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
