import pg from 'pg';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { configureContentPool, withAuthDatabase, withPlannerDatabase } from '../../apps/api/src/db.js';
import { configureDatabaseAuthority } from '../../apps/api/src/database-authority.js';
import { protectMatterInput, type ContentKeyContext, type ContentKeyProvider } from '../../apps/api/src/private-content.js';
import { loadConfig } from '../../apps/api/src/config.js';
import { SelectedAiService } from '../../apps/api/src/mcp/service.js';
import { currentLegalContract } from '../../apps/api/src/legal-contract.js';
import { ISSUER, RESOURCE, PLATFORMS } from './config.mjs';

// Only the explicitly synthetic deployment uses this key provider. Production continues to use AWS KMS.
class CandidateKeys implements ContentKeyProvider {
  constructor(private root: Buffer) {}
  async check() { if (this.root.length !== 32) throw new Error('Candidate key unavailable'); }
  async generate(context: ContentKeyContext) {
    const plaintext = randomBytes(32), nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.root, nonce);
    cipher.setAAD(Buffer.from(JSON.stringify(context)));
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { plaintext, wrapped: Buffer.concat([nonce, cipher.getAuthTag(), encrypted]), wrappingKeyRef: 'candidate-synthetic-v1' };
  }
  async unwrap(wrapped: Buffer, ref: string, context: ContentKeyContext) {
    if (ref !== 'candidate-synthetic-v1' || wrapped.length !== 60) throw new Error('Candidate key unavailable');
    const decipher = createDecipheriv('aes-256-gcm', this.root, wrapped.subarray(0, 12));
    decipher.setAAD(Buffer.from(JSON.stringify({ namespace: context.namespace, owner: context.owner, id: context.id })));
    decipher.setAuthTag(wrapped.subarray(12, 28));
    return Buffer.concat([decipher.update(wrapped.subarray(28)), decipher.final()]);
  }
}

export async function withCandidate<T>(env: any, operation: (value: ReturnType<typeof runtime>) => Promise<T>): Promise<T> {
  // Hyperdrive terminates this local connection and independently verifies the Neon origin certificate.
  // Per-request pools prevent Cloudflare I/O objects from leaking across requests. Query caching is disabled.
  const pool = new pg.Pool({ connectionString: env.DATABASE.connectionString, max: 2,
    connectionTimeoutMillis: 10_000, statement_timeout: 12_000, application_name: 'rillora-ai-synthetic' });
  pool.on('error', () => console.warn('candidate_database_connection_error'));
  configureDatabaseAuthority(pool, env.DATABASE_AUTHORITY_KEY);
  configureContentPool(pool, { mode: 'encrypted', namespace: 'rillora-ai-candidate', region: 'eu-central-1',
    kmsKeyArn: 'synthetic-candidate-only' }, false, new CandidateKeys(Buffer.from(env.CONTENT_WRAPPING_KEY, 'hex')));
  try { return await operation(runtime(pool, env, await env.OAUTH_KV.get('candidate:clients', 'json') ?? {})); }
  finally { await pool.end(); }
}

function runtime(pool: pg.Pool, env: any, registry: Record<string, string>) {
  const clients = Object.entries(registry).filter(([key]) => Object.hasOwn(PLATFORMS, key)).map(([key, clientId]) => ({
    key, clientId, name: PLATFORMS[key].name, privacyUrl: PLATFORMS[key].privacyUrl,
  }));
  const config = { issuer: ISSUER + '/', resourceUrl: RESOURCE, clients };
  // This deployment is intentionally not a customer production runtime and has no production credentials.
  const app = loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgresql:///rillora_ai_candidate' });
  const service = new SelectedAiService(pool, app, config);
  const planner = async (subject: string) => {
    if (subject !== env.SYNTHETIC_SUBJECT) throw new Error('Synthetic identity required');
    const row = await withAuthDatabase(pool, async db => (await db.query(`select p.id::text,p.public_id from app.planners p
      join app.identity_accounts i on i.planner_id=p.id where i.issuer=$1 and i.subject=$2 and p.status='active'
      and exists(select 1 from app.legal_acceptances a where a.planner_id=p.id and a.terms_version=$3
      and a.privacy_version=$4 and a.legal_bundle_sha256=$5)`, [ISSUER, subject, currentLegalContract.termsVersion,
      currentLegalContract.privacyVersion, Buffer.from(currentLegalContract.bundleSha256, 'hex')])).rows[0]);
    if (!row) throw new Error('Synthetic account unavailable');
    return row;
  };
  const seedMatters = async () => {
    const owner = await planner(env.SYNTHETIC_SUBJECT);
    return withPlannerDatabase(pool, owner.id, async db => {
      await db.query("select pg_advisory_xact_lock(hashtextextended('candidate-fixture',0))");
      const existing = await db.query('select count(*)::int as count from app.matter_items where planner_id=app.current_planner_id()');
      if (existing.rows[0].count) return { created: false, count: existing.rows[0].count };
      for (const title of ['Selected synthetic digital account', 'Unselected synthetic document']) {
        const id = randomUUID();
        const stored = await protectMatterInput(db, id, { title, institutionName: 'Synthetic service',
          locationHint: 'Synthetic location', notes: 'Private synthetic note — never disclose through MCP', valueBand: 'unknown' });
        await db.query(`insert into app.matter_items(public_id,planner_id,plan_id,category,title,institution_name,location_hint,notes,value_band)
          select $1,app.current_planner_id(),id,'account',$2,$3,$4,$5,$6 from app.plans where planner_id=app.current_planner_id()`,
        [id, stored.title, stored.institutionName, stored.locationHint, stored.notes, stored.valueBand]);
      }
      return { created: true, count: 2 };
    });
  };
  return { pool, service, clients, planner, seedMatters };
}
