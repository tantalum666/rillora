import pg from 'pg';
import express from 'express';
import { createHash, randomBytes } from 'node:crypto';
import request from 'supertest';
import { loadConfig } from '../src/config.js';
import { createPool } from '../src/db.js';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/migrate.js';
import { seedDevelopmentFixture, developmentPlannerPublicId as owner } from '../src/seed-dev.js';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { TestContentKeys } from './content-test-keys.js';
import { EmailIdentityFixture } from './email-identity-fixture.js';
import { currentLegalContract } from '../src/legal-contract.js';
import { ContentContext } from '../src/legacy-content/context.js';
import { LegacyContentCipher } from '../src/legacy-content/crypto.js';

// Fixed loopback database and synthetic identities. Never reads cloud credentials.
const name = 'continuity_native_content_ui_test';
const url = dedicatedTestDatabaseUrl(`postgresql://127.0.0.1:5432/${name}`, name);
const adminURL = new URL(url); adminURL.pathname = '/postgres';
await assertDedicatedTestDatabase(adminURL.toString(), 'postgres');
const admin = new pg.Client({ connectionString: adminURL.toString() }); await admin.connect();
try {
  if (!(await admin.query('select 1 from pg_database where datname=$1', [name])).rowCount)
    await admin.query('create database continuity_native_content_ui_test');
} finally { await admin.end(); }
await assertDedicatedTestDatabase(url, name);
const lock = new pg.Client({ connectionString: url }); await lock.connect();
if (!(await lock.query("select pg_try_advisory_lock(hashtext('native-content-ui-fixture')) as acquired")).rows[0].acquired)
  throw Error('Another fixture owns this local database');
await runMigrations(url);
const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, ALLOW_DEV_AUTH: 'true', CORS_ORIGINS: 'http://127.0.0.1:4397' });
const pool = createPool(config);
await pool.query('truncate app.planners restart identity cascade');
await pool.query('truncate app.legacy_content_cleanup');
await seedDevelopmentFixture(pool);
await pool.query('update app.commerce_runtime_policy set sharing_limits_enabled=true');
const ownerID = (await pool.query('select id from app.planners where public_id=$1', [owner])).rows[0].id;
const account = (await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code)
 select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id`, [ownerID])).rows[0].id;
await pool.query(`insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at)
 values($1,$2,'family_maintenance','manual_override','native-content-local-test',null,now()-interval '1 minute',now()+interval '1 day'),
 ($1,$2,'trusted_people_multiple','manual_override','native-content-local-test',5,now()-interval '1 minute',now()+interval '1 day')`, [ownerID, account]);
const identities = new EmailIdentityFixture(), issuer = 'https://native-content.example', subject = 'content|synthetic-recipient';
identities.register(issuer, subject, 'native-recipient@example.test');
const recipient = (await pool.query("select * from app.provision_oidc_planner($1,$2,'Synthetic recipient','en','UTC')", [issuer, subject])).rows[0];
const hash = (text: string) => createHash('sha256').update(text).digest();
const token = randomBytes(32).toString('base64url'), csrf = randomBytes(32).toString('base64url');
await pool.query(`with a as (insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,
 legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
 values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id)
 insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at)
 select $1,$2,id,$8,$9,now()+interval '1 day' from a`, [recipient.planner_id, recipient.identity_account_id, currentLegalContract.termsVersion,
 currentLegalContract.privacyVersion, currentLegalContract.consentTextVersion, Buffer.from(currentLegalContract.bundleSha256, 'hex'),
 hash(`${issuer}\u001f${subject}`), hash(token), hash(csrf)]);
class Objects {
  rows = new Map<string, Buffer>();
  async put(key: string, bytes: Buffer) { this.rows.set(key, Buffer.from(bytes)); }
  async get(key: string) { const bytes = this.rows.get(key); if (!bytes) throw Error('missing'); return Buffer.from(bytes); }
  async remove(key: string) { this.rows.delete(key); }
}
const api = createApp(pool, config, { legacyContent: new ContentContext(pool, new LegacyContentCipher('rillora-staging', new TestContentKeys()), new Objects()), emailIdentityVerifier: identities });
const bootstrap = api.listen(0, '127.0.0.1');
await new Promise<void>(resolve => bootstrap.once('listening', resolve));
const ownerHeaders = { 'x-dev-planner-id': owner };
const person = (await request(bootstrap).post('/v1/trusted-contacts').set(ownerHeaders).send({ displayName: 'Synthetic family / 合成家人' }).expect(201)).body.trustedContact.publicId;
const invitation = (await request(bootstrap).post('/v1/sharing/connections').set(ownerHeaders).send({ personPublicId: person, email: 'native-recipient@example.test', grants: [] }).expect(201)).body;
await request(bootstrap).post('/v1/sharing/invitations/accept').set({ cookie: `continuity_session=${token}`, 'x-csrf-token': csrf, 'x-rillora-planner': recipient.planner_public_id })
  .send({ accepted: true, invitationToken: new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation') }).expect(200);
await new Promise<void>((resolve, reject) => bootstrap.close(error => error ? reject(error) : resolve()));
const app = express();
app.get('/qa/content-fixture', (_req, res) => res.json({ fixture: 'native-content-v1', syntheticOnly: true, owner, recipient: recipient.planner_public_id, person }));
app.post('/qa/family/:state', async (req, res) => {
  if (!['enabled', 'expired'].includes(req.params.state)) { res.status(400).end(); return; }
  await pool.query("update app.commerce_entitlement_grants set effective_at=now()-interval '2 days',expires_at=now()+($2::int * interval '1 day') where planner_id=$1 and source_reference='native-content-local-test'", [ownerID, req.params.state === 'enabled' ? 1 : -1]);
  res.json({ syntheticOnly: true });
});
app.use(api);
const server = app.listen(4397, '127.0.0.1', () => console.log('Native content fixture ready at 127.0.0.1:4397'));
async function stop() { server.close(); await pool.end(); await lock.end(); }
process.once('SIGTERM', () => { void stop(); }); process.once('SIGINT', () => { void stop(); });
