import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg, { type PoolClient } from 'pg';
import { loadDatabaseConfig } from './config.js';
import { databaseConnectionOptions } from './db.js';
import { configureRecoveryPool, publishRecoveryTransaction, recoveryPublisherFromEnvironment } from './recovery-journal.js';

type Operation = 'inspect' | 'prepare' | 'revoke';
export type ContentQaScope = { subject: string; identitySha256: string; label: string; expiresAt: string };
class ContentQaError extends Error {}
function requireFact(value: unknown, reason: string): asserts value {
  if (!value) throw new ContentQaError(reason);
}
const issuer = 'https://login.rillora.xyz';
export function validateContentQaScope(scope: ContentQaScope, operation: Operation, now = Date.now()) {
  requireFact(['inspect', 'prepare', 'revoke'].includes(operation), 'Unsupported QA operation');
  requireFact(/^auth0\|[a-f0-9]{24}$/.test(scope.subject)
    && /^[a-f0-9]{64}$/.test(scope.identitySha256)
    && createHash('sha256').update(`${issuer}\u001f${scope.subject}`).digest('hex') === scope.identitySha256,
  'Exact synthetic database identity required');
  requireFact(/^Rillora Web Content QA \d{4}-\d{2}-\d{2}$/.test(scope.label), 'Synthetic QA label required');
  const expiry = Date.parse(scope.expiresAt);
  requireFact(Number.isFinite(expiry), 'Valid QA deadline required');
  if (operation === 'prepare') requireFact(expiry > now && expiry <= now + 4 * 3600_000, 'QA access must expire within four hours');
}

async function catalogFingerprint(client: Pick<PoolClient, 'query'>) {
  const tables = ['commerce_runtime_policy', 'commerce_market_policies', 'commerce_plan_versions', 'commerce_plan_capabilities',
    'commerce_prices', 'commerce_storefront_products', 'commerce_storefront_policies', 'commerce_purchase_route_policies', 'commerce_apple_price_bindings'];
  const result: Record<string, string> = {};
  for (const table of tables) {
    // Identifiers come only from the fixed array, never from an operator input.
    const rows = (await client.query(`select to_jsonb(t)::text as value from app.${table} t order by to_jsonb(t)::text`)).rows;
    requireFact(rows.length <= 1000, 'Commercial catalog exceeds the reviewed bound');
    result[table] = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  }
  return createHash('sha256').update(JSON.stringify(result)).digest('hex');
}

/** Internal maintenance only. No session, agreement, order or subscription is fabricated. */
export async function configureContentQa(pool: pg.Pool, operation: Operation,
  scope: ContentQaScope, now = Date.now()) {
  validateContentQaScope(scope, operation, now);
  const reference = `content-qa:${scope.identitySha256}`;
  const client = await pool.connect();
  try {
    await client.query(operation === 'inspect' ? 'begin isolation level repeatable read read only' : 'begin isolation level serializable');
    await client.query("set local statement_timeout='15s'");
    if (operation !== 'inspect') await client.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [reference]);
    const before = await catalogFingerprint(client);
    let identity = (await client.query(`select p.id::text as id,p.public_id,p.display_name,p.status from app.identity_accounts i
      join app.planners p on p.id=i.planner_id where i.issuer=$1 and i.subject=$2`, [issuer, scope.subject])).rows[0];
    if (!identity && operation === 'prepare') {
      await client.query("select * from app.provision_oidc_planner($1,$2,$3,'en','UTC')", [issuer, scope.subject, scope.label]);
      identity = (await client.query(`select p.id::text as id,p.public_id,p.display_name,p.status from app.identity_accounts i
        join app.planners p on p.id=i.planner_id where i.issuer=$1 and i.subject=$2`, [issuer, scope.subject])).rows[0];
    }
    if (identity) {
      requireFact(identity.display_name === scope.label && identity.status === 'active', 'Existing personal or review account cannot be repurposed');
      const conflict = (await client.query(`select exists(select 1 from app.commerce_orders where planner_id=$1)
        or exists(select 1 from app.commerce_subscriptions where planner_id=$1)
        or exists(select 1 from app.commerce_validation_accounts where planner_id=$1)
        or exists(select 1 from app.commerce_entitlement_grants where planner_id=$1 and source_reference is distinct from $2) as present`,
      [identity.id, reference])).rows[0];
      requireFact(!conflict?.present, 'Purchased, Apple-review or other granted accounts are excluded');
      const grants = (await client.query(`select id,capability_code,allowance,source_type,expires_at,revoked_at
        from app.commerce_entitlement_grants where planner_id=$1 and source_reference=$2 order by capability_code`, [identity.id, reference])).rows;
      requireFact(grants.length === 0 || (grants.length === 2 && grants[0].capability_code === 'family_maintenance'
        && grants[0].allowance === null && grants[1].capability_code === 'trusted_people_multiple' && grants[1].allowance === 5
        && grants.every(g => g.source_type === 'manual_override' && new Date(g.expires_at).getTime() === Date.parse(scope.expiresAt))),
      'Existing test grants differ; expiry cannot be extended');
      if (operation === 'prepare' && grants.length === 0) {
        const used = (await client.query(`select exists(select 1 from app.matter_items where planner_id=$1)
          or exists(select 1 from app.people where planner_id=$1)
          or exists(select 1 from app.legacy_content_assets where planner_id=$1)
          or exists(select 1 from app.legacy_action_packs where planner_id=$1) as present`, [identity.id])).rows[0];
        requireFact(!used?.present, 'First QA grant requires a new empty synthetic workspace');
        let accounts = (await client.query('select id from app.commerce_accounts where planner_id=$1 and status=\'active\'', [identity.id])).rows;
        requireFact(accounts.length <= 1, 'Ambiguous QA commerce account');
        if (!accounts.length) accounts = (await client.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code)
          select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id`, [identity.id])).rows;
        requireFact(accounts.length === 1, 'Exactly one synthetic commerce account required');
        for (const [capability, allowance] of [['trusted_people_multiple', 5], ['family_maintenance', null]] as const) {
          await client.query(`insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at)
            values($1,$2,$3,'manual_override',$4,$5,statement_timestamp(),$6)`, [identity.id, accounts[0].id, capability, reference, allowance, scope.expiresAt]);
        }
      } else if (operation === 'prepare') {
        requireFact(grants.every(g => g.revoked_at === null), 'Revoked QA access cannot be reactivated');
      } else if (operation === 'revoke') {
        await client.query(`update app.commerce_entitlement_grants set revoked_at=coalesce(revoked_at,statement_timestamp())
          where planner_id=$1 and source_reference=$2`, [identity.id, reference]);
        await client.query('update app.auth_sessions set revoked_at=coalesce(revoked_at,statement_timestamp()) where planner_id=$1', [identity.id]);
      }
    }
    const after = await catalogFingerprint(client);
    requireFact(after === before, 'Commercial configuration changed');
    const rows = identity ? (await client.query(`select capability_code,allowance,expires_at,revoked_at from app.commerce_entitlement_grants
      where planner_id=$1 and source_reference=$2 order by capability_code`, [identity.id, reference])).rows : [];
    if (operation !== 'inspect') await publishRecoveryTransaction(pool, client);
    await client.query('commit');
    return { operation, exists: Boolean(identity), publicId: identity?.public_id ?? null, grants: rows,
      commercialConfigurationUnchanged: true, catalogSha256: after, fabricatedPaymentsOrSessions: false };
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}

async function main() {
  const db = loadDatabaseConfig();
  requireFact(process.env.CONTENT_KEY_NAMESPACE === 'rillora-production' && process.env.RECOVERY_ENVIRONMENT === 'production'
    && db.sslMode === 'verify-full' && db.host?.endsWith('.eu-central-1.rds.amazonaws.com')
    && !db.connectionString && db.database === 'rillora', 'Only the existing protected production database is allowed');
  const pool = new pg.Pool({ ...databaseConnectionOptions(db), max: 1, application_name: 'rillora-content-qa' });
  try {
    const publisher = recoveryPublisherFromEnvironment();
    requireFact(publisher, 'Independent recovery publication is required');
    configureRecoveryPool(pool, publisher);
    requireFact((await pool.query('select ssl from pg_stat_ssl where pid=pg_backend_pid()')).rows[0]?.ssl === true, 'Verified TLS required');
    requireFact((await pool.query("select exists(select 1 from app.schema_migrations where name='0108_legacy_content_workspace.sql') as ready")).rows[0]?.ready, 'Current content schema required');
    requireFact((await pool.query('select enforced from app.recovery_policy where singleton')).rows[0]?.enforced === true, 'Recovery journal must remain enforced');
    console.log(JSON.stringify(await configureContentQa(pool, process.argv[2] as Operation, {
      subject: process.env.RILLORA_CONTENT_QA_SUBJECT ?? '', identitySha256: process.env.RILLORA_CONTENT_QA_IDENTITY_SHA256 ?? '',
      label: process.env.RILLORA_CONTENT_QA_LABEL ?? '', expiresAt: process.env.RILLORA_CONTENT_QA_EXPIRES_AT ?? '',
    })));
  } finally { await pool.end(); }
}
if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(JSON.stringify({ contentQaFailed: true, privateValuesSuppressed: true,
    reason: error instanceof ContentQaError ? error.message : 'Protected database operation failed' })); process.exitCode = 1; });
}
