import { z } from 'zod';
import type { PoolClient } from 'pg';
import type { AppConfig } from '../config.js';
import { withAuthDatabase, withPlannerDatabase, type DatabasePool } from '../db.js';
import { ApiError } from '../errors.js';
import { currentLegalContract } from '../legal-contract.js';
import { reviewIdentityAllowed, reviewIdentityDigest } from '../production-review-access.js';
import { AI_CONSENT_VERSION, AI_IDENTITY_DISCLOSURE_VERSION, MCP_SCOPES, type McpConfig } from './config.js';
import type { McpActor } from './identity.js';

const id = z.uuid().transform(value => value.toLowerCase());
export const connectionInput = z.object({
  clientKey: z.string().min(1).max(40),
  matters: z.array(z.object({ publicId: id, expectedVersion: z.number().int().positive() }).strict()).min(1).max(20)
    .refine(items => new Set(items.map(item => item.publicId)).size === items.length),
  scopes: z.array(z.enum(MCP_SCOPES)).min(1).max(2)
    .refine(items => items.includes('matters:read:summary') && new Set(items).size === items.length),
  consentVersion: z.literal(AI_CONSENT_VERSION),
  acknowledgedDisclosure: z.literal(true),
  identityDisclosure: z.object({version:z.literal(AI_IDENTITY_DISCLOSURE_VERSION),acknowledged:z.literal(true)}).strict().optional(),
  replace: z.object({ publicId: id, expectedVersion: z.number().int().positive() }).strict().optional(),
}).strict();
export const revokeInput = z.object({ expectedVersion: z.number().int().positive() }).strict();

type Connection = { id: string; public_id: string; client_id: string; scopes: string[]; selected_count: number;
  eligible_count?: number; token_valid_after: string; expires_at: Date; revoked_at: Date | null; version: number; consent_version: string; legal_bundle_sha256: Buffer };
type Selection = { id: string; public_id: string; version: number; title: string; category: string; status: string;
  institution_name: string | null; location_hint: string | null; desired_outcome: string };
const unavailable = () => new ApiError(403, 'ai_connection_unavailable', 'Review and authorize the selected matters in Rillora, then reconnect the AI application.');

async function audit(client: PoolClient, action: string, publicId: string) {
  await client.query(`insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
    values(app.current_planner_id(),'planner',$1,'ai_connection',$2,'{}'::jsonb)`, [action, publicId]);
}

/** A shared application service, never a full overview/export adapter. */
export class SelectedAiService {
  constructor(private pool: DatabasePool, private app: AppConfig, readonly config: McpConfig) {}

  async list(plannerId: string) {
    return withPlannerDatabase(this.pool, plannerId, async client => {
      const rows = (await client.query<Connection>(`select c.id::text,c.public_id,c.client_id,c.scopes,c.selected_count,
        c.token_valid_after::text,c.expires_at,c.revoked_at,c.version,c.consent_version,c.legal_bundle_sha256,
        (select count(*)::int from app.ai_connection_matters g join app.matter_items m on m.id=g.matter_item_id and m.planner_id=g.planner_id
          where g.connection_id=c.id and m.archived_at is null and m.desired_outcome<>'never_disclose' and m.version>=g.matter_version) as eligible_count
        from app.ai_connections c where c.planner_id=app.current_planner_id() and c.client_id=any($1::text[])
        and c.revoked_at is null order by c.id limit 17`, [this.config.clients.map(client => client.clientId)])).rows;
      return { consentVersion: AI_CONSENT_VERSION, identityDisclosureVersion:AI_IDENTITY_DISCLOSURE_VERSION, serverUrl: this.config.resourceUrl,
        clients: this.config.clients.map(({ key, name, privacyUrl, clientId }) => ({ key, name, privacyUrl, clientId })),
        connections: rows.flatMap(row => {
          const target = this.config.clients.find(c => c.clientId === row.client_id);
          return target ? [{ publicId: row.public_id, clientKey: target.key, name: target.name, version: row.version,
            scopes: row.scopes, selectedCount: row.eligible_count ?? 0, expiresAt: row.expires_at,
            status: row.expires_at.getTime() <= Date.now() ? 'expired'
              : row.consent_version !== AI_CONSENT_VERSION || row.legal_bundle_sha256.toString('hex') !== currentLegalContract.bundleSha256 ? 'needs_review'
                : row.eligible_count !== row.selected_count ? 'scope_reduced' : 'active' }] : [];
        }) };
    });
  }

  async selectable(plannerId: string, cursor: string | null) {
    if (cursor !== null) cursor = id.parse(cursor);
    return withPlannerDatabase(this.pool, plannerId, async client => {
      const rows = (await client.query<{ public_id: string; title: string; version: number }>(`select public_id,title,version
        from app.matter_items where planner_id=app.current_planner_id() and archived_at is null and desired_outcome<>'never_disclose'
        and ($1::uuid is null or id>(select id from app.matter_items where public_id=$1 and planner_id=app.current_planner_id()))
        order by id limit 51`, [cursor])).rows;
      return { matters: rows.slice(0, 50).map(row => ({ publicId: row.public_id, title: row.title, version: row.version })),
        nextCursor: rows.length > 50 ? rows[49]!.public_id : null };
    });
  }

  async authorize(plannerId: string, input: z.infer<typeof connectionInput>) {
    const target = this.config.clients.find(client => client.key === input.clientKey);
    if (!target) throw unavailable();
    if (input.identityDisclosure && target.verifiedEmailDisclosure !== true) throw unavailable();
    return withPlannerDatabase(this.pool, plannerId, async client => {
      await client.query("select pg_advisory_xact_lock(hashtextextended('ai:'||app.current_planner_id()::text||':'||$1,0))", [target.clientId]);
      const selected = (await client.query<Selection>(`select id::text,public_id,version from app.matter_items
        where planner_id=app.current_planner_id() and public_id=any($1::uuid[]) and archived_at is null
        and desired_outcome<>'never_disclose' order by id for share`, [input.matters.map(m => m.publicId)])).rows;
      if (selected.length !== input.matters.length || selected.some(row => input.matters.find(m => m.publicId === row.public_id)?.expectedVersion !== row.version)) {
        throw new ApiError(409, 'ai_selection_changed', 'A selected matter changed or is unavailable. Review your selection.');
      }
      const prior = (await client.query<Connection>(`select id::text,public_id,version from app.ai_connections
        where planner_id=app.current_planner_id() and client_id=$1 and revoked_at is null for update`, [target.clientId])).rows[0];
      if (Boolean(prior) !== Boolean(input.replace) || (prior && (prior.public_id !== input.replace!.publicId || prior.version !== input.replace!.expectedVersion))) {
        throw new ApiError(409, 'ai_connection_changed', 'This connection changed. Refresh before continuing.');
      }
      if (prior) {
        await client.query('update app.ai_connections set revoked_at=now(),version=version+1 where id=$1', [prior.id]);
        await audit(client, 'ai.connection_revoked', prior.public_id);
      }
      const created = (await client.query<Connection>(`insert into app.ai_connections
        (planner_id,client_id,consent_version,legal_bundle_sha256,scopes,selected_count,expires_at)
        values(app.current_planner_id(),$1,$2,$3,$4,$5,now()+interval '7 days') returning id::text,public_id,version,expires_at`,
      [target.clientId, AI_CONSENT_VERSION, Buffer.from(currentLegalContract.bundleSha256, 'hex'), input.scopes, selected.length])).rows[0]!;
      await client.query(`insert into app.ai_connection_matters(connection_id,planner_id,matter_item_id,matter_version)
        select $1,app.current_planner_id(),item,version from unnest($2::bigint[],$3::integer[]) as selected(item,version)`,
      [created.id, selected.map(m => m.id), selected.map(m => m.version)]);
      if (input.identityDisclosure) await client.query(`insert into app.ai_identity_disclosures(connection_id,planner_id,consent_version,fields)
        values($1,app.current_planner_id(),$2,array['verified_email']::text[])`,[created.id,input.identityDisclosure.version]);
      await audit(client, 'ai.connection_authorized', created.public_id);
      return { connection: { publicId: created.public_id, version: created.version, expiresAt: created.expires_at }, reconnectRequired: true };
    });
  }

  async revoke(plannerId: string, publicId: string, expectedVersion: number) {
    return withPlannerDatabase(this.pool, plannerId, async client => {
      const row = (await client.query<Connection>(`select id::text,public_id,version,revoked_at from app.ai_connections
        where planner_id=app.current_planner_id() and public_id=$1 for update`, [id.parse(publicId)])).rows[0];
      if (!row) throw unavailable();
      if (row.revoked_at) return { revoked: true };
      if (row.version !== expectedVersion) throw new ApiError(409, 'ai_connection_changed', 'This connection changed. Refresh before continuing.');
      await client.query('update app.ai_connections set revoked_at=now(),version=version+1 where id=$1', [row.id]);
      await audit(client, 'ai.connection_revoked', row.public_id);
      return { revoked: true };
    });
  }

  private async planner(actor: McpActor): Promise<string> {
    if (!reviewIdentityAllowed(this.app, reviewIdentityDigest(actor.issuer, actor.subject))) throw unavailable();
    const plannerId = await withAuthDatabase(this.pool, async client => (await client.query<{ id: string }>(
      `select p.id::text from app.identity_accounts ia join app.planners p on p.id=ia.planner_id
       where ia.issuer=$1 and ia.subject=$2 and p.status='active' and exists(select 1 from app.legal_acceptances a
        where a.planner_id=p.id and a.terms_version=$3 and a.privacy_version=$4 and a.legal_bundle_sha256=$5)`,
      [actor.issuer, actor.subject, currentLegalContract.termsVersion, currentLegalContract.privacyVersion,
        Buffer.from(currentLegalContract.bundleSha256, 'hex')])).rows[0]?.id);
    if (!plannerId) throw unavailable();
    return plannerId;
  }

  private async withConnection<T>(actor: McpActor, required: string, operation: (client: PoolClient, connection: Connection) => Promise<T>): Promise<T> {
    if (!actor.scopes.includes(required)) throw unavailable();
    const plannerId = await this.planner(actor);
    return withPlannerDatabase(this.pool, plannerId, async client => {
      if (!(await client.query("select 1 from app.planners where id=app.current_planner_id() and status='active'")).rowCount) throw unavailable();
      const connection = (await client.query<Connection>(`select id::text,public_id,scopes,selected_count,token_valid_after::text
        from app.ai_connections where planner_id=app.current_planner_id() and client_id=$1 and revoked_at is null
        and expires_at>clock_timestamp() and consent_version=$2 and legal_bundle_sha256=$3
        and ($4::uuid is null or public_id=$4) for share`,
      [actor.clientId, AI_CONSENT_VERSION, Buffer.from(currentLegalContract.bundleSha256, 'hex'),
        actor.boundConnectionPublicId ?? null])).rows[0];
      // Legacy provider tokens use the epoch guard. A broker pins the token to the exact newly created consent UUID,
      // which also permits legitimate issuance in the same clock second without reviving a replaced connection.
      if (!connection || !connection.scopes.includes(required)
        || (!actor.boundConnectionPublicId && actor.issuedAt < Number(connection.token_valid_after))) throw unavailable();
      return operation(client, connection);
    });
  }

  async assertAccess(actor: McpActor): Promise<void> {
    return this.withConnection(actor, MCP_SCOPES[0], async () => {});
  }

  async assertIdentityDisclosure(actor: McpActor): Promise<void> {
    if (!this.config.clients.some(c=>c.clientId===actor.clientId && c.verifiedEmailDisclosure)) throw unavailable();
    await this.withConnection(actor,MCP_SCOPES[0],async (client,connection)=>{
      if (!(await client.query(`select 1 from app.ai_identity_disclosures where connection_id=$1
        and planner_id=app.current_planner_id() and consent_version=$2 and fields=array['verified_email']::text[]`,
      [connection.id,AI_IDENTITY_DISCLOSURE_VERSION])).rowCount) throw unavailable();
    });
  }

  async read(actor: McpActor, operation: 'summary' | 'gaps') {
    return this.withConnection(actor, operation === 'summary' ? MCP_SCOPES[0] : MCP_SCOPES[1], async (client, connection) => {
      // No Notes, typed details, account hints, values, contacts or full-plan counts are read.
      const projection = operation === 'summary' ? 'm.title,m.category,m.status'
        : 'm.category,m.institution_name,m.location_hint,m.desired_outcome';
      const rows = (await client.query<Selection>(`select m.public_id,${projection} from app.ai_connection_matters g
        join app.matter_items m on m.id=g.matter_item_id and m.planner_id=g.planner_id
        where g.connection_id=$1 and g.planner_id=app.current_planner_id() and m.archived_at is null
        and m.desired_outcome<>'never_disclose' and m.version>=g.matter_version order by m.id limit 21`, [connection.id])).rows;
      if (rows.length > connection.selected_count || rows.length > 20) throw unavailable();
      if (operation === 'summary') return { matters: rows.map(row => ({ publicId: row.public_id, title: row.title,
        category: row.category, status: row.status })) };
      return { matters: rows.map(row => ({ publicId: row.public_id,
        missingFields: [['account', 'financial_asset', 'debt', 'subscription'].includes(row.category) && !row.institution_name?.trim() ? 'provider' : null,
          ['device', 'document'].includes(row.category) && !row.location_hint?.trim() ? 'location' : null,
          row.desired_outcome === 'undecided' ? 'intended_outcome' : null].filter((value): value is string => value !== null) })),
        assessment: 'selected_common_fields_only', notAssessed: ['category_specific_details', 'legal_authority', 'recipient_readiness'] };
    });
  }
}
