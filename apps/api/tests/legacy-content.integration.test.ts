import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from 'vitest';
import request from './http-fixture.js';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { TestContentKeys } from './content-test-keys.js';
import { EmailIdentityFixture } from './email-identity-fixture.js';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { createPool, withPlannerDatabase, type DatabasePool } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { seedDevelopmentFixture, developmentPlannerPublicId as A } from '../src/seed-dev.js';
import { currentLegalContract } from '../src/legal-contract.js';
import { ContentContext } from '../src/legacy-content/context.js';
import { LegacyContentCipher } from '../src/legacy-content/crypto.js';
import { ContentCleanup } from '../src/legacy-content/cleanup.js';
import { AccountDeletionProcessor } from '../src/account-deletion.js';
import { contentNoticeVersion } from '../src/legacy-content/notice.js';
import { contentObjectKey } from '../src/legacy-content/object-store.js';
import { replayRecoveryControls } from '../src/recovery-replay.js';
import { configureContentQa, validateContentQaScope } from '../src/configure-content-qa.js';
import { configureRecoveryPool, type RecoveryControl } from '../src/recovery-journal.js';

const name = 'continuity_legacy_content_v2_test';
const url = dedicatedTestDatabaseUrl(`postgresql:///${name}`, name);
const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, ALLOW_DEV_AUTH: 'true', CORS_ORIGINS: 'http://localhost:4191' });
const owner: Record<string, string> = { 'x-dev-planner-id': A }, identities = new EmailIdentityFixture();
const pdf = Buffer.from('%PDF-1.7\nSynthetic family policy only.\n%%EOF');
const hash = (value: string) => createHash('sha256').update(value).digest();
class Objects {
  rows = new Map<string, Buffer>(); writes = 0; failWrite = false; failRemove = false;
  async put(key: string, bytes: Buffer) { this.rows.set(key, Buffer.from(bytes)); this.writes++; if (this.failWrite) throw new Error('lost upload response'); }
  async get(key: string) { const bytes = this.rows.get(key); if (!bytes) throw new Error('missing'); return Buffer.from(bytes); }
  async remove(key: string) { if (this.failRemove) throw new Error('storage unavailable'); this.rows.delete(key); }
}
let pool: DatabasePool, app: ReturnType<typeof createApp>, context: ContentContext, objects: Objects;
let ownerId: string, B: Record<string, string>, C: Record<string, string>;
async function actor(label: string) {
  identities.register('https://content.example', `content|${label}`, `${label.toLowerCase()}@example.test`);
  const row = (await pool.query("select * from app.provision_oidc_planner($1,$2,$3,'en','UTC')", ['https://content.example', `content|${label}`, label])).rows[0];
  const token = randomBytes(32).toString('base64url'), csrf = randomBytes(32).toString('base64url');
  await pool.query(`with a as (insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,
   legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
   values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id)
   insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at)
   select $1,$2,id,$8,$9,now()+interval '1 hour' from a`, [row.planner_id, row.identity_account_id, currentLegalContract.termsVersion,
    currentLegalContract.privacyVersion, currentLegalContract.consentTextVersion, Buffer.from(currentLegalContract.bundleSha256, 'hex'),
    hash(`https://content.example\u001fcontent|${label}`), hash(token), hash(csrf)]);
  return { cookie: `continuity_session=${token}`, 'x-csrf-token': csrf, 'x-rillora-planner': row.planner_public_id };
}
async function enable(headers = owner) {
  const plannerId = headers === owner ? ownerId : String((await pool.query('select id from app.planners where public_id=$1', [headers['x-rillora-planner']])).rows[0].id);
  const account = (await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code)
   select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id`, [plannerId])).rows[0].id;
  await pool.query(`insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at)
   values($1,$2,'family_maintenance','manual_override','content-synthetic-test',null,now()-interval '1 day',now()+interval '1 day')`, [plannerId, account]);
  await request(app).post('/v1/legacy-content/consent').set(headers).send({ version: contentNoticeVersion, accepted: true }).expect(200);
}
function payload(bytes = pdf, metadata: Record<string, unknown> = {}, requestKey = randomUUID()) {
  const description = Buffer.from(JSON.stringify({ requestKey, kind: 'file', mediaType: 'application/pdf', metadata: { name: '保单副本.pdf', ...metadata } }));
  const size = Buffer.alloc(4); size.writeUInt32BE(description.length);
  return Buffer.concat([size, description, bytes]);
}
const upload = (data = payload(), headers = owner) => request(app).post('/v1/legacy-content/assets').set(headers).set('Content-Type', 'application/octet-stream').send(data);
const overview = async (headers = owner) => (await request(app).get('/v1/legacy-content').set(headers).expect(200)).body;
const task = (title = 'Preserve the family records', matterPublicId: string | null = null, dependsOn: string[] = []) =>
  ({ id: randomUUID(), title, matterPublicId, action: 'preserve', instructions: 'Use the official request route.', providerId: 'apple', dependsOn });
async function person(headers = owner) {
  const contact = (await request(app).post('/v1/trusted-contacts').set(headers).send({ displayName: 'B' }).expect(201)).body.trustedContact;
  const invitation = (await request(app).post('/v1/sharing/connections').set(headers).send({ personPublicId: contact.publicId, email: 'b@example.test', grants: [] }).expect(201)).body;
  await request(app).post('/v1/sharing/invitations/accept').set(B).send({ accepted: true,
    invitationToken: new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation') }).expect(200);
  return { person: contact.publicId, connection: invitation.connection.publicId };
}
async function pack(options: { intent?: string; personPublicId?: string | null; assets?: string[]; tasks?: ReturnType<typeof task>[] } = {}, headers = owner) {
  const selected = (await pool.query('select public_id,version from app.legacy_content_assets where public_id=any($1::uuid[])', [options.assets ?? []])).rows;
  return (await request(app).post('/v1/legacy-content/packs').set(headers).send({ personPublicId: options.personPublicId ?? null,
    intent: options.intent ?? 'after_death', body: { title: '给家人的办理包', note: 'Only this selected information',
      tasks: options.tasks ?? [task()], assetPublicIds: options.assets ?? [], assetVersions: Object.fromEntries(selected.map(asset => [asset.public_id, asset.version])) } }).expect(201)).body.pack;
}
async function publish(pack: { publicId: string; version: number }, headers = owner) {
  return (await request(app).post(`/v1/legacy-content/packs/${pack.publicId}/publish`).set(headers)
    .send({ expectedVersion: pack.version, shareNow: true }).expect(200)).body.publication.publicId as string;
}
const receive = (id: string, headers = B) => request(app).get(`/v1/legacy-content/publications/${id}`).set(headers);

describe.sequential('Web content — real database, synthetic files and identities', () => {
  beforeAll(async () => {
    await assertDedicatedTestDatabase(url, name); await runMigrations(url); pool = createPool(config);
    await pool.query('update app.recovery_policy set enforced=false');
  });
  beforeEach(async () => {
    await pool.query('truncate app.planners restart identity cascade'); await pool.query('truncate app.legacy_content_cleanup');
    await seedDevelopmentFixture(pool); ownerId = String((await pool.query('select id from app.planners where public_id=$1', [A])).rows[0].id);
    objects = new Objects(); context = new ContentContext(pool, new LegacyContentCipher('rillora-staging', new TestContentKeys()), objects);
    app = createApp(pool, config, { legacyContent: context, emailIdentityVerifier: identities }); B = await actor('B'); C = await actor('C');
  });
  afterAll(async () => { await pool?.end(); });

  it('provides expiring QA access without a purchase, fabricated session, or changes to ordinary accounts', async () => {
    const subject = 'auth0|' + 'a'.repeat(24), now = Date.now();
    const scope = { subject, identitySha256: hash(`https://login.rillora.xyz\u001f${subject}`).toString('hex'),
      label: 'Rillora Web Content QA 2026-10-22', expiresAt: new Date(now + 3600_000).toISOString() };
    const sessionsBefore = (await pool.query('select count(*)::int n from app.auth_sessions')).rows[0].n;
    const policy = (await pool.query('select sharing_limits_enabled from app.commerce_runtime_policy where singleton')).rows[0].sharing_limits_enabled;
    try {
      // The same grant must work under live sharing limits, not a preview bypass.
      await pool.query('update app.commerce_runtime_policy set sharing_limits_enabled=true where singleton');
      const result = await configureContentQa(pool, 'prepare', scope, now);
      expect(result.grants).toHaveLength(2); expect(result.commercialConfigurationUnchanged).toBe(true);
      const id = String((await pool.query('select id from app.planners where public_id=$1', [result.publicId])).rows[0].id);
      expect(await context.transaction(id, ({ client }) => context.canCreate(client))).toBe(true);
      expect((await configureContentQa(pool, 'prepare', scope, now)).grants).toHaveLength(2);
      await expect(configureContentQa(pool, 'prepare', { ...scope, expiresAt: new Date(now + 2 * 3600_000).toISOString() }, now)).rejects.toThrow('expiry cannot be extended');
      expect((await pool.query('select count(*)::int n from app.auth_sessions')).rows[0].n).toBe(sessionsBefore);
      expect((await pool.query('select count(*)::int n from app.legal_acceptances where planner_id=$1', [id])).rows[0].n).toBe(0);
      expect((await pool.query('select count(*)::int n from app.commerce_orders where planner_id=$1', [id])).rows[0].n).toBe(0);
      expect((await pool.query('select count(*)::int n from app.commerce_subscriptions where planner_id=$1', [id])).rows[0].n).toBe(0);
      const revoked = await configureContentQa(pool, 'revoke', scope, now + 5 * 3600_000);
      expect(revoked.grants.every(g => g.revoked_at !== null)).toBe(true);
      expect(await context.transaction(id, ({ client }) => context.canCreate(client))).toBe(false);
      await expect(configureContentQa(pool, 'prepare', scope, now)).rejects.toThrow('cannot be reactivated');
      expect((await pool.query('select count(*)::int n from app.auth_sessions where revoked_at is null')).rows[0].n).toBe(sessionsBefore);
    } finally { await pool.query('update app.commerce_runtime_policy set sharing_limits_enabled=$1 where singleton', [policy]); }
  });
  it('refuses invalid scope, personal identities and any enrolled Apple reviewer as a content QA account', async () => {
    const subject = 'auth0|' + 'b'.repeat(24), now = Date.now();
    const scope = { subject, identitySha256: hash(`https://login.rillora.xyz\u001f${subject}`).toString('hex'),
      label: 'Rillora Web Content QA 2026-10-22', expiresAt: new Date(now + 3600_000).toISOString() };
    for (const patch of [{ subject: 'google-oauth2|personal' }, { identitySha256: 'c'.repeat(64) }, { label: 'Rillora App Review' },
      { expiresAt: new Date(now - 1).toISOString() }, { expiresAt: new Date(now + 5 * 3600_000).toISOString() }]) {
      expect(() => validateContentQaScope({ ...scope, ...patch }, 'prepare', now)).toThrow();
    }
    const existing = (await pool.query("select * from app.provision_oidc_planner($1,$2,'Personal account','en','UTC')", ['https://login.rillora.xyz', subject])).rows[0];
    await expect(configureContentQa(pool, 'prepare', scope, now)).rejects.toThrow('cannot be repurposed');
    await pool.query('update app.planners set display_name=$2 where id=$1', [existing.planner_id, scope.label]);
    await pool.query("insert into app.commerce_validation_accounts(planner_id,expires_at,reason) values($1,now()+interval '1 day','Existing review fixture')", [existing.planner_id]);
    await expect(configureContentQa(pool, 'prepare', scope, now)).rejects.toThrow('Apple-review');
    expect((await pool.query('select count(*)::int n from app.commerce_entitlement_grants where planner_id=$1', [existing.planner_id])).rows[0].n).toBe(0);
  });
  it('publishes attested QA controls before commit and rolls back the whole grant when publication fails', async () => {
    const subject = 'auth0|' + 'c'.repeat(24), now = Date.now(), key = randomBytes(48).toString('base64url');
    const scope = { subject, identitySha256: hash(`https://login.rillora.xyz\u001f${subject}`).toString('hex'),
      label: 'Rillora Web Content QA 2026-10-22', expiresAt: new Date(now+3600_000).toISOString() };
    const candidate = createPool(config), events: RecoveryControl[] = []; let unavailable = true;
    configureRecoveryPool(candidate, { async publish() { throw new Error('Unsigned publication refused'); }, async publishAttested(e) {
      expect(e.signature).toBe(createHmac('sha256',key).update(`rillora-journal-event-v1|${e.generation}|${e.transaction}|${e.event}`).digest('hex'));
      if (unavailable) throw new Error('Unavailable fixture publisher');
      const event = JSON.parse(e.event); events.push(event);
      return createHmac('sha256',key).update(`rillora-journal-ack-v1|${e.generation}|${e.transaction}|${hash(e.event).toString('hex')}|${event.revision}`).digest('hex');
    } });
    await pool.query('insert into rillora_guard.journal_authority(singleton,signing_key) values(true,$1) on conflict(singleton) do update set signing_key=excluded.signing_key',[key]);
    await pool.query('update app.recovery_policy set enforced=true,coverage_started_at=now()');
    try {
      await expect(configureContentQa(candidate, 'prepare', scope, now)).rejects.toThrow('saved safely');
      expect((await pool.query('select 1 from app.identity_accounts where issuer=$1 and subject=$2',['https://login.rillora.xyz',subject])).rowCount).toBe(0);
      unavailable = false;
      const result = await configureContentQa(candidate, 'prepare', scope, now);
      expect(result.grants).toHaveLength(2);
      expect(events.some(e=>e.kind==='unreconciled_access')).toBe(true);
      expect(JSON.stringify(events)).not.toContain(scope.subject);
      expect(JSON.stringify(events)).not.toContain(scope.label);
      await configureContentQa(candidate, 'revoke', scope, now);
      expect((await pool.query('select count(*)::int n from app.recovery_controls where not published')).rows[0].n).toBe(0);
    } finally { await pool.query('update app.recovery_policy set enforced=false'); await candidate.end(); }
  });

  it('is disabled by default and rejects unauthenticated, stale-account and unconsented changes', async () => {
    await request(createApp(pool, config)).get('/v1/legacy-content').set(owner).expect(404);
    await request(app).post('/v1/legacy-content/assets').set('Content-Type', 'application/octet-stream').send(payload()).expect(401);
    await upload().expect(403); await enable();
    await pool.query('delete from app.legacy_content_consents'); await upload().expect(409);
    await request(app).post('/v1/legacy-content/consent').set(owner).send({ version: contentNoticeVersion, accepted: false }).expect(400);
    await upload(payload(), { ...B, 'x-rillora-planner': A }).expect(409);
    expect((await overview()).acceptedNotice).toBe(false);
  });
  it('allows browser cookie reads without a CSRF header while requiring it for every content mutation', async () => {
    // Match the shipped Web client: safe reads carry the session and planner
    // binding; only mutations send x-csrf-token. Do not use development auth.
    const browser = { cookie: B.cookie!, 'x-rillora-planner': B['x-rillora-planner']! };
    const initial = await request(app).get('/v1/legacy-content').set(browser).expect(200);
    expect(initial.body.acceptedNotice).toBe(false);
    await request(app).post('/v1/legacy-content/consent').set(browser)
      .send({ version: contentNoticeVersion, accepted: true }).expect(403);
    await enable(B);
    const file = (await upload(payload(), B).expect(201)).body.asset;
    const download = await request(app).get(`/v1/legacy-content/assets/${file.publicId}/download`).set(browser).expect(200);
    expect(download.body).toEqual(pdf);
    await request(app).get('/v1/legacy-content/received').set(browser).expect(200);
    await upload(payload(), browser).expect(403);
    await request(app).post('/v1/legacy-content/packs').set(browser).send({}).expect(403);
    await request(app).patch(`/v1/legacy-content/assets/${file.publicId}`).set(browser)
      .send({ expectedVersion: 1, metadata: { name: 'Changed.pdf' } }).expect(403);
    await request(app).delete(`/v1/legacy-content/assets/${file.publicId}`).set(browser).expect(403);
    expect((await request(app).get('/v1/legacy-content').set(browser).expect(200)).body.assets).toHaveLength(1);
  });
  it('encrypts original bytes and metadata, retrieves exactly, and denies another account', async () => {
    await enable(); const result = await upload().expect(201), id = result.body.asset.publicId;
    expect(result.body.asset.name).toBe('保单副本.pdf');
    const row = (await pool.query('select * from app.legacy_content_assets where public_id=$1', [id])).rows[0];
    expect(JSON.stringify(row)).not.toContain('保单副本'); expect(objects.rows.get(contentObjectKey(A, id))).not.toEqual(pdf);
    const downloaded = await request(app).get(`/v1/legacy-content/assets/${id}/download`).set(owner).expect(200);
    expect(downloaded.body).toEqual(pdf); expect(downloaded.headers['content-disposition']).toContain('attachment;');
    expect(downloaded.headers['cache-control']).toContain('no-store');
    await request(app).get(`/v1/legacy-content/assets/${id}/download`).set(C).expect(404);
    await request(app).patch(`/v1/legacy-content/assets/${id}`).set(C).send({ expectedVersion: 1, metadata: { name: 'foreign.pdf' } }).expect(403);
    await upload(payload(Buffer.from('<script>not a PDF</script>'))).expect(400);
    await upload(payload(pdf, { name: '../unsafe.pdf' })).expect(400);
  });
  it('deduplicates retries and cleans lost upload responses with a bounded grace period', async () => {
    await enable(); const data = payload(); const first = await upload(data).expect(201); const second = await upload(data).expect(201);
    expect(second.body.asset.publicId).toBe(first.body.asset.publicId); expect(objects.writes).toBe(1);
    objects.failWrite = true; await upload().expect(500); objects.failWrite = false;
    expect((await overview()).cleanupPending).toBe(1);
    const cleanup = new ContentCleanup(pool, objects); await cleanup.sweep(); expect(objects.rows.size).toBe(2);
    await pool.query("update app.legacy_content_cleanup set next_attempt_at=now()-interval '1 second'");
    objects.failRemove = true; await cleanup.sweep(); expect((await overview()).cleanupPending).toBe(1);
    objects.failRemove = false; await pool.query("update app.legacy_content_cleanup set next_attempt_at=now()-interval '1 second'");
    await cleanup.sweep(); expect((await overview()).cleanupPending).toBe(0); expect(objects.rows.size).toBe(1);
  });
  it('keeps future preparation and existing accepted invitations separate from content access', async () => {
    await enable(); const p = await person(), asset = (await upload().expect(201)).body.asset;
    const saved = await pack({ personPublicId: p.person, assets: [asset.publicId] });
    expect((await overview(B)).received).toEqual([]);
    await request(app).post(`/v1/legacy-content/packs/${saved.publicId}/publish`).set(owner).send({ expectedVersion: 1, shareNow: true }).expect(409);
    await request(app).get(`/v1/legacy-content/assets/${asset.publicId}/download`).set(B).expect(404);
    expect((await request(app).get('/v1/sharing/shared-with-me').set(B).expect(200)).body.items).toEqual([]);
  });
  it('publishes only the selected version, filters unconfirmed text, and records scoped progress', async () => {
    await enable(); const p = await person(), file = (await upload(payload(pdf, { transcript: 'UNCHECKED WISH', transcriptConfirmed: false })).expect(201)).body.asset;
    const first = task(), next = task('Submit the official request', null, [first.id]);
    const saved = await pack({ intent: 'current', personPublicId: p.person, assets: [file.publicId], tasks: [first, next] }), id = await publish(saved);
    expect((await receive(id).expect(200)).body.publication.assets[0].transcript).toBe('');
    const receivedFile = await request(app).get(`/v1/legacy-content/received/${id}/assets/${file.publicId}/download`).set(B).expect(200);
    expect(receivedFile.body).toEqual(pdf);
    await request(app).get(`/v1/legacy-content/received/${id}/assets/${file.publicId}/download`).set(C).expect(404);
    await receive(id, C).expect(404); await receive(id, owner).expect(200);
    await request(app).patch(`/v1/legacy-content/packs/${saved.publicId}`).set(owner).send({ expectedVersion: 1,
      personPublicId: p.person, intent: 'current', body: { ...saved.body, note: 'NEW PRIVATE DRAFT' } }).expect(200);
    expect(JSON.stringify((await receive(id)).body)).not.toContain('NEW PRIVATE DRAFT');
    const report = (taskId: string, status: string, expectedVersion = 0, headers = B) => request(app).post(`/v1/legacy-content/publications/${id}/progress`)
      .set(headers).send({ expectedVersion, progress: { taskId, status, reference: 'Synthetic case 123', note: 'User report only' } });
    await report(next.id, 'submitted').expect(409);
    await report(first.id, 'completed').expect(200); await report(first.id, 'completed').expect(409);
    await report(next.id, 'submitted').expect(200); await report(randomUUID(), 'completed').expect(404);
    await report(next.id, 'completed', 1, C).expect(404);
    await report(next.id, 'completed', 1, { cookie: B.cookie! }).expect(403);
    expect((await receive(id).expect(200)).body.publication.progress).toHaveLength(2);
  });
  it('revokes frozen matter references even after the owner removes the matter from the newer draft', async () => {
    await enable(); const p = await person();
    const matter = (await request(app).post('/v1/matters').set(owner).send({ category: 'document', title: 'Policy', institutionName: 'Insurer', locationHint: 'Folder', desiredOutcome: 'notify', status: 'draft' }).expect(201)).body.matter;
    const saved = await pack({ intent: 'current', personPublicId: p.person, tasks: [task('Contact insurer', matter.publicId)] }), id = await publish(saved);
    await request(app).patch(`/v1/legacy-content/packs/${saved.publicId}`).set(owner).send({ expectedVersion: 1,
      personPublicId: p.person, intent: 'current', body: { ...saved.body, tasks: [] } }).expect(200);
    await request(app).patch(`/v1/matters/${matter.publicId}`).set(owner).send({ expectedVersion: matter.version, desiredOutcome: 'never_disclose' }).expect(200);
    await receive(id).expect(404);
  });
  it('makes revocation durable across connection reactivation and file removal', async () => {
    await enable(); const p = await person(), file = (await upload().expect(201)).body.asset;
    const saved = await pack({ intent: 'current', personPublicId: p.person, assets: [file.publicId] }), id = await publish(saved);
    await pool.query("update app.sharing_connections set status='revoked',version=version+1 where public_id=$1", [p.connection]);
    await pool.query("update app.sharing_connections set status='accepted',version=version+1 where public_id=$1", [p.connection]);
    await receive(id).expect(404);
    const replacement = await publish(saved); expect(replacement).not.toBe(id);
    await request(app).delete(`/v1/legacy-content/assets/${file.publicId}`).set(owner).expect(200);
    await receive(replacement).expect(404);
    await request(app).get(`/v1/legacy-content/received/${replacement}/assets/${file.publicId}/download`).set(B).expect(404);
  });
  it('keeps existing files, published copies and progress accessible after paid access expires', async () => {
    await enable(); const p = await person(), file = (await upload().expect(201)).body.asset;
    const saved = await pack({ intent: 'current', personPublicId: p.person, assets: [file.publicId] }), id = await publish(saved);
    await pool.query("update app.commerce_entitlement_grants set expires_at=now()-interval '1 second'");
    expect((await overview()).canCreate).toBe(false); await upload().expect(403);
    await request(app).get(`/v1/legacy-content/assets/${file.publicId}/download`).set(owner).expect(200); await receive(id).expect(200);
    await request(app).post(`/v1/legacy-content/packs/${saved.publicId}/revoke`).set(owner).send({}).expect(200); await receive(id).expect(404);
    await request(app).delete(`/v1/legacy-content/assets/${file.publicId}`).set(owner).expect(200);
  });
  it('withholds account completion until external objects are removed', async () => {
    await enable(); await upload().expect(201);
    const job = await withPlannerDatabase(pool, ownerId, async client => (await client.query('select app.request_account_deletion($1) as id', [randomBytes(32)])).rows[0].id);
    await new AccountDeletionProcessor(pool, null).process(job);
    expect((await pool.query('select status from app.account_deletions where public_id=$1', [job])).rows[0].status).not.toBe('completed');
    await pool.query("update app.account_deletions set next_attempt_at=now()-interval '1 second'");
    const cleanup = new ContentCleanup(pool, objects), processor = new AccountDeletionProcessor(pool, null, async () => {}, job => cleanup.prepareAccount(job));
    await processor.process(job); expect(objects.rows.size).toBe(1);
    await pool.query("update app.legacy_content_cleanup set next_attempt_at=now()-interval '1 second'");
    await pool.query("update app.account_deletions set next_attempt_at=now()-interval '1 second'");
    await processor.process(job); expect(objects.rows.size).toBe(0);
    expect((await pool.query('select status from app.account_deletions where public_id=$1', [job])).rows[0].status).toBe('completed');
  });

  it('requires the owner to review changed file metadata before publishing and preserves old snapshots', async () => {
    await enable(); const p = await person(), file = (await upload().expect(201)).body.asset;
    const saved = await pack({ intent: 'current', personPublicId: p.person, assets: [file.publicId] });
    await request(app).patch(`/v1/legacy-content/assets/${file.publicId}`).set(owner)
      .send({ expectedVersion: 1, metadata: { name: 'Changed.pdf' } }).expect(200);
    await request(app).post(`/v1/legacy-content/packs/${saved.publicId}/publish`).set(owner)
      .send({ expectedVersion: 1, shareNow: true }).expect(409);
    const updated = (await request(app).patch(`/v1/legacy-content/packs/${saved.publicId}`).set(owner)
      .send({ expectedVersion: 1, personPublicId: p.person, intent: 'current', body: { ...saved.body, assetVersions: { [file.publicId]: 2 } } }).expect(200)).body.pack;
    const id = await publish(updated);
    await request(app).patch(`/v1/legacy-content/assets/${file.publicId}`).set(owner)
      .send({ expectedVersion: 2, metadata: { name: 'New private name.pdf' } }).expect(200);
    expect((await receive(id).expect(200)).body.publication.assets[0].name).toBe('Changed.pdf');
  });
  it('checks availability and progress revisions without decrypting content and keeps retrieval open during a write pause', async () => {
    await enable(); const p = await person(), saved = await pack({ intent: 'current', personPublicId: p.person }), id = await publish(saved);
    const spy = vi.spyOn(context.cipher, 'openJson');
    expect((await request(app).get(`/v1/legacy-content/publications/${id}/state`).set(B).expect(200)).body.revision).toBe('0');
    expect(spy).not.toHaveBeenCalled();
    await request(app).get(`/v1/legacy-content/publications/${id}/state`).set(C).expect(404);
    spy.mockRestore();
    app = createApp(pool, config, { legacyContent: new ContentContext(pool, context.cipher, objects, false), emailIdentityVerifier: identities });
    expect((await overview()).canCreate).toBe(false); await upload().expect(503); await receive(id).expect(200);
    await request(app).post(`/v1/legacy-content/publications/${id}/progress`).set(B).send({ expectedVersion: 0,
      progress: { taskId: saved.body.tasks[0].id, status: 'ready', reference: '', note: '' } }).expect(200);
    expect((await request(app).get(`/v1/legacy-content/publications/${id}/state`).set(B).expect(200)).body.revision).toBe('1');
    await request(app).post(`/v1/legacy-content/packs/${saved.publicId}/revoke`).set(owner).send({}).expect(200);
    await request(app).get(`/v1/legacy-content/publications/${id}/state`).set(B).expect(404);
  });
  it('accepts complete Chinese metadata at the file limit and still bounds the upload envelope', async () => {
    await enable();
    const bytes = Buffer.concat([pdf, Buffer.alloc(8 * 1024 * 1024 - pdf.length)]);
    const metadata = { description: '中'.repeat(2000), transcript: '请先保留资料。'.repeat(1000), transcriptConfirmed: true, language: 'zh-CN' };
    const input = payload(bytes, metadata);
    expect(input.readUInt32BE(0)).toBeGreaterThan(4096);
    const asset = (await upload(input).expect(201)).body.asset;
    expect(asset.description).toBe(metadata.description); expect(asset.transcript).toBe(metadata.transcript);
    const downloaded = (await request(app).get(`/v1/legacy-content/assets/${asset.publicId}/download`).set(owner).expect(200)).body as Buffer;
    expect(Buffer.isBuffer(downloaded)).toBe(true);
    expect(downloaded.equals(bytes)).toBe(true);
    const oversize = Buffer.alloc(4 + 65537 + pdf.length); oversize.writeUInt32BE(65537);
    await upload(oversize).expect(400);
    expect((await overview()).assets).toHaveLength(1);
  });
  it('paginates a recipient inbox across multiple owners without losing or repeating published packs', async () => {
    await enable(); await enable(C); const p = await person(), c = await person(C), expected = new Set<string>();
    for (let index = 0; index < 51; index++) {
      const headers = index < 30 ? owner : C;
      expected.add(await publish(await pack({ intent: 'current', personPublicId: index < 30 ? p.person : c.person }, headers), headers));
    }
    const initial = await overview(B); expect(initial.received).toHaveLength(50); expect(initial.receivedNextCursor).toBeTruthy();
    const last = (await request(app).get(`/v1/legacy-content/received?cursor=${initial.receivedNextCursor}`).set(B).expect(200)).body;
    expect(last.items).toHaveLength(1); expect(last.nextCursor).toBeNull();
    expect(new Set([...initial.received, ...last.items].map(item => item.publicId))).toEqual(expected);
    expect((await overview()).received).toHaveLength(0);
    await request(app).get('/v1/legacy-content/received?cursor=invalid').set(B).expect(400);
  });
  it('checks optional schema readiness through the non-inheriting runtime role', async () => {
    const login = 'continuity_ready_' + randomUUID().replaceAll('-', '').slice(0, 12);
    const password = randomBytes(36).toString('base64url');
    const quoted = (await pool.query('select quote_ident($1) as login, quote_literal($2) as password', [login, password])).rows[0];
    await pool.query(`create role ${quoted.login} login noinherit nosuperuser nocreatedb nocreaterole nobypassrls password ${quoted.password}`);
    await pool.query(`grant continuity_auth to ${quoted.login}`);
    const runtimeUrl = new URL(url); runtimeUrl.username = login; runtimeUrl.password = password;
    const runtimePool = createPool({ ...config, database: { connectionString: runtimeUrl.toString(), sslMode: 'disable', sslCaPath: null } });
    try {
      await expect(runtimePool.query("select to_regclass('app.legacy_content_assets')")).rejects.toMatchObject({ code: '42501' });
      const candidate = createApp(runtimePool, config, { legacyContent: context, futureNoticesEnabled: true });
      await request(candidate).get('/health/ready').expect(200);
    } finally { await runtimePool.end(); await pool.query(`drop role ${quoted.login}`); }
  });
  it('does not resurrect files or shared versions from an older database snapshot', async () => {
    await enable(); const p = await person(), file = (await upload().expect(201)).body.asset;
    const saved = await pack({ intent: 'current', personPublicId: p.person, assets: [file.publicId] }), id = await publish(saved);
    const result = await replayRecoveryControls(pool, [{ key: `legacy_asset:${file.publicId}`, kind: 'legacy_asset', id: file.publicId,
      revision: '99999', recordedAt: new Date().toISOString(), facts: { deleted: true } }]);
    expect(result.applied).toBe(1);
    expect((await pool.query('select count(*)::int as count from app.legacy_content_assets')).rows[0].count).toBe(0);
    expect((await pool.query('select revoked_at from app.legacy_pack_publications where public_id=$1', [id])).rows[0].revoked_at).not.toBeNull();
  });
});
