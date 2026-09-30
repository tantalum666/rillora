import { readFileSync } from "node:fs";
import pg, { type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import type { AppConfig, DatabaseConfig } from "./config.js";

const { Pool } = pg;

export type DatabasePool = InstanceType<typeof Pool>;

export function databaseConnectionOptions(config: DatabaseConfig): pg.PoolConfig {
  const connection = config.connectionString
    ? { connectionString: config.connectionString }
    : {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
      };
  const ssl =
    config.sslMode === "verify-full"
      ? {
          rejectUnauthorized: true,
          ca: readFileSync(config.sslCaPath!, "utf8"),
        }
      : false;
  return { ...connection, ssl };
}

export function createPool(config: AppConfig): DatabasePool {
  return new Pool({
    ...databaseConnectionOptions(config.database),
    max: config.databasePoolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: config.databaseConnectionTimeoutMs,
    application_name: "continuity-api",
  });
}

async function inRoleTransaction<T>(
  pool: DatabasePool,
  role: "continuity_app" | "continuity_auth" | "continuity_rehearsal" | "continuity_commerce",
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${role}`);
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export type RecipientRehearsalContext = {
  id: string;
  publicId: string;
  plannerId: string;
  personId: string;
  invitationId: string;
};

export function withRecipientAcceptanceDatabase<T>(
  pool: DatabasePool,
  acceptanceTokenHash: Buffer,
  newSessionTokenHash: Buffer,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return inRoleTransaction(pool, "continuity_rehearsal", async (client) => {
    await client.query(
      "select set_config('app.rehearsal_acceptance_hash', $1, true), set_config('app.rehearsal_new_session_hash', $2, true), set_config('app.rehearsal_session_hash', $2, true)",
      [acceptanceTokenHash.toString("hex"), newSessionTokenHash.toString("hex")],
    );
    return operation(client);
  });
}

export function withRecipientRehearsalDatabase<T>(
  pool: DatabasePool,
  sessionTokenHash: Buffer,
  operation: (client: PoolClient, context: RecipientRehearsalContext) => Promise<T>,
): Promise<T | null> {
  return inRoleTransaction(pool, "continuity_rehearsal", async (client) => {
    await client.query("select set_config('app.rehearsal_session_hash', $1, true)", [
      sessionTokenHash.toString("hex"),
    ]);
    const contextResult = await client.query<{
      id: string;
      public_id: string;
      planner_id: string;
      person_id: string;
      invitation_id: string;
    }>(
      `select id::text, public_id, planner_id::text, person_id::text, invitation_id::text
       from app.recipient_rehearsals
       where session_token_hash = $1 and status = 'accepted' and expires_at > now()`,
      [sessionTokenHash],
    );
    const row = contextResult.rows[0];
    if (!row) return null;
    await client.query(
      "select set_config('app.current_rehearsal_id', $1, true), set_config('app.current_planner_id', $2, true)",
      [row.id, row.planner_id],
    );
    return operation(client, {
      id: row.id,
      publicId: row.public_id,
      plannerId: row.planner_id,
      personId: row.person_id,
      invitationId: row.invitation_id,
    });
  });
}

export function withAuthDatabase<T>(
  pool: DatabasePool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return inRoleTransaction(pool, "continuity_auth", operation);
}

export function withPlannerDatabase<T>(
  pool: DatabasePool,
  plannerId: string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return inRoleTransaction(pool, "continuity_app", async (client) => {
    await client.query("select set_config('app.current_planner_id', $1, true)", [plannerId]);
    return operation(client);
  });
}

export function withCommercePlannerDatabase<T>(
  pool: DatabasePool,
  plannerId: string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return inRoleTransaction(pool, "continuity_commerce", async (client) => {
    await client.query("select set_config('app.current_planner_id', $1, true)", [plannerId]);
    return operation(client);
  });
}

export function withCommerceAccountDatabase<T>(
  pool: DatabasePool,
  commerceAccountReference: string,
  operation: (
    client: PoolClient,
    context: { commerceAccountId: string; plannerId: string; planId: string; publicId: string },
  ) => Promise<T>,
): Promise<T | null> {
  return inRoleTransaction(pool, "continuity_commerce", async (client) => {
    const context = await client.query<{
      commerce_account_id: string;
      planner_id: string;
      plan_id: string;
      public_id: string;
    }>(
      `select commerce_account_id::text, planner_id::text, plan_id::text, public_id::text
       from app.resolve_commerce_account($1::uuid)`,
      [commerceAccountReference],
    );
    const row = context.rows[0];
    if (!row) return null;
    await client.query("select set_config('app.current_planner_id', $1, true)", [row.planner_id]);
    return operation(client, {
      commerceAccountId: row.commerce_account_id,
      plannerId: row.planner_id,
      planId: row.plan_id,
      publicId: row.public_id,
    });
  });
}

export function withCommerceInboxDatabase<T>(
  pool: DatabasePool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return inRoleTransaction(pool, "continuity_commerce", operation);
}

export async function oneOrNull<T extends QueryResultRow>(
  result: QueryResult<T>,
): Promise<T | null> {
  return result.rows[0] ?? null;
}
