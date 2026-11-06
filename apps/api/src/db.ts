import { readFileSync } from "node:fs";
import { createSecureContext } from "node:tls";
import pg, { type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import type { AppConfig, DatabaseConfig } from "./config.js";
import { contentClient, KmsContentKeyProvider, type ContentKeyProvider, type ContentProtectionConfig } from "./private-content.js";
import { configureRecoveryPool, publishRecoveryTransaction, recoveryPublisherFromEnvironment } from './recovery-journal.js';
import { bindDatabaseAuthority, configureDatabaseAuthority } from './database-authority.js';
import { emailMatchKey } from './sharing-identity.js';

const { Pool } = pg;

export type DatabasePool = InstanceType<typeof Pool>;
const protection = new WeakMap<DatabasePool, { config: ContentProtectionConfig | null; provider: ContentKeyProvider | null; preview: boolean }>();

export function configureContentPool(pool: DatabasePool, config: ContentProtectionConfig | null,
  preview = false, provider: ContentKeyProvider | null = config ? new KmsContentKeyProvider(config) : null): void {
  protection.set(pool, { config, provider, preview });
}

export async function checkContentKeys(pool: DatabasePool): Promise<void> {
  const settings = protection.get(pool);
  if (!settings?.config) return;
  if (!settings.provider) throw new Error("Private content key provider is unavailable");
  await settings.provider.check();
}

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
  let ssl: pg.PoolConfig['ssl'] = false;
  if (config.sslMode === "verify-full") {
    const ca = readFileSync(config.sslCaPath!, "utf8");
    // One context per pool avoids reparsing/retaining the large RDS root store
    // whenever an idle connection is replaced. Hostname/chain checks stay on.
    ssl = { rejectUnauthorized: true, ca, secureContext: createSecureContext({ ca }) };
  }
  return { ...connection, ssl };
}

export function createPool(config: AppConfig, testContentProvider?: ContentKeyProvider): DatabasePool {
  if (testContentProvider && config.nodeEnv !== "test") throw new Error("Injected content keys are restricted to tests");
  const pool = new Pool({
    ...databaseConnectionOptions(config.database),
    max: config.databasePoolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: config.databaseConnectionTimeoutMs,
    application_name: "continuity-api",
  });
  configureContentPool(pool,config.contentProtection ?? null,config.allowFamilyMaintenancePreview ?? false,
    testContentProvider ?? (config.contentProtection ? new KmsContentKeyProvider(config.contentProtection) : null));
  if (config.nodeEnv === 'production' && !config.databaseAuthorityKey) throw new Error('Production requires database transaction authority');
  if (config.nodeEnv === 'production') emailMatchKey(config);
  if (config.deletionWorkerEnabled && !config.deletionProof) throw new Error('Isolated deletion requires protected provider identity proofs');
  configureDatabaseAuthority(pool, config.databaseAuthorityKey ?? null);
  if(config.nodeEnv==='production'){
    const journal=recoveryPublisherFromEnvironment();if(journal)configureRecoveryPool(pool,journal);
  }
  return pool;
}

async function protectedPlannerOperation<T>(pool: DatabasePool,client: PoolClient,operation:(client:PoolClient)=>Promise<T>):Promise<T> {
  const settings=protection.get(pool) ?? {config:null,provider:null,preview:false};
  const wrapped=contentClient(client,settings.config,settings.provider,settings.preview);
  try { const result=await operation(wrapped.client);await wrapped.session.prune();return result; }
  finally { wrapped.session.dispose(); }
}

async function inRoleTransaction<T>(
  pool: DatabasePool,
  role: "continuity_app" | "continuity_auth" | "continuity_rehearsal" | "continuity_commerce",
  operation: (client: PoolClient) => Promise<T>,
  repeatableSnapshot = false,
  plannerId: string | null = null,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(repeatableSnapshot ? "begin isolation level repeatable read" : "begin");
    await client.query(`set local role ${role}`);
    await bindDatabaseAuthority(pool, client, role, plannerId);
    const result = await operation(client);
    await publishRecoveryTransaction(pool,client);
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
    await bindDatabaseAuthority(pool, client, 'continuity_rehearsal', row.planner_id);
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

export async function withDeletionWorkerDatabase<T>(pool:DatabasePool,operation:(client:PoolClient)=>Promise<T>):Promise<T>{
  const client=await pool.connect();
  try{
    await client.query('begin');await client.query('set local role continuity_deletion_worker');
    const result=await operation(client);
    await publishRecoveryTransaction(pool,client);await client.query('commit');return result;
  }catch(error){await client.query('rollback');throw error;}finally{client.release();}
}

export function withPlannerDatabase<T>(
  pool: DatabasePool,
  plannerId: string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return inRoleTransaction(pool, "continuity_app", async (client) => {
    await client.query("select set_config('app.current_planner_id', $1, true)", [plannerId]);
    return protectedPlannerOperation(pool,client,operation);
  }, false, plannerId);
}

export function withPlannerSnapshotDatabase<T>(pool: DatabasePool, plannerId: string, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  return inRoleTransaction(pool, "continuity_app", async client => {
    await client.query("select set_config('app.current_planner_id', $1, true)", [plannerId]);
    return protectedPlannerOperation(pool,client,operation);
  }, true, plannerId);
}

export async function withContentMigrationDatabase<T>(pool:DatabasePool,plannerId:string,
  operation:(raw:PoolClient,client:PoolClient,session:ReturnType<typeof contentClient>["session"])=>Promise<T>):Promise<T>{
  return inRoleTransaction(pool,"continuity_app",async raw=>{
    const allowed=(await raw.query("select pg_has_role(session_user,'continuity_content_service','member') as allowed")).rows[0]?.allowed;
    if(!allowed)throw new Error("Content migration requires the dedicated administrative credential");
    await raw.query('set local role continuity_content_service');
    await raw.query("select set_config('app.current_planner_id',$1,true),set_config('app.content_migration','true',true)",[plannerId]);
    await raw.query("select pg_advisory_xact_lock(hashtextextended('sharing:'||app.current_planner_id()::text,0))");
    const settings=protection.get(pool);
    if(!settings?.config || settings.config.mode!=="encrypted" || !settings.provider)throw new Error("Content migration requires the encrypted writer and key provider");
    const wrapped=contentClient(raw,settings.config,settings.provider,settings.preview);
    try {return await operation(raw,wrapped.client,wrapped.session);}finally{wrapped.session.dispose();}
  });
}

export async function sweepContentOrphans(pool:DatabasePool):Promise<number>{
  return inRoleTransaction(pool,"continuity_app",async client=>
    (await client.query("select app.content_sweep_orphans() as removed")).rows[0].removed as number);
}

export function withCommercePlannerDatabase<T>(
  pool: DatabasePool,
  plannerId: string,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return inRoleTransaction(pool, "continuity_commerce", async (client) => {
    await client.query("select set_config('app.current_planner_id', $1, true)", [plannerId]);
    return operation(client);
  }, false, plannerId);
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
    await bindDatabaseAuthority(pool, client, 'continuity_commerce', row.planner_id);
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
