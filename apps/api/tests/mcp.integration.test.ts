import pg from 'pg';
import { createServer } from 'node:http';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT, type JWTPayload } from 'jose';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { runMigrations } from '../src/migrate.js';
import { bootstrapRuntimeRole } from '../src/bootstrap-runtime.js';
import { createPool, withPlannerDatabase, configureContentPool } from '../src/db.js';
import { TestContentKeys } from './content-test-keys.js';
import { loadConfig } from '../src/config.js';
import { currentLegalContract } from '../src/legal-contract.js';
import { createApp } from '../src/app.js';
import { AI_CONSENT_VERSION, MCP_SCOPES, loadMcpConfig, type McpConfig } from '../src/mcp/config.js';
import { createMcpTokenVerifier } from '../src/mcp/identity.js';
import { McpIntegration } from '../src/mcp/integration.js';
import { SelectedAiService, connectionInput } from '../src/mcp/service.js';
import { configureRecoveryPool, parseRecoveryControl, type RecoveryControl } from '../src/recovery-journal.js';
import { replayRecoveryControls } from '../src/recovery-replay.js';
import request from './http-fixture.js';

const url = dedicatedTestDatabaseUrl('postgresql:///rillora_mcp_test', 'rillora_mcp_test');
const mcpConfig: McpConfig = { issuer: 'https://identity.example.test/', resourceUrl: 'https://ai.example.test/api/mcp',
  clients: [{ key: 'client-a', name: 'Synthetic AI A', clientId: 'synthetic-client-a', privacyUrl: 'https://ai.example.test/privacy' }, { key: 'client-b', name: 'Synthetic AI B', clientId: 'synthetic-client-b', privacyUrl: 'https://ai.example.test/privacy' }] };
const role = 'continuity_runtime_mcp_test';
let admin: pg.Client, pool: pg.Pool, app: ReturnType<typeof createApp>, mcp: McpIntegration;
let keys: Awaited<ReturnType<typeof generateKeyPair>>, owner: { id: string; public_id: string }, other: typeof owner;
let selected: { publicId: string; version: number }, hidden: typeof selected;
const journal: RecoveryControl[] = [];
const choice = () => ({ publicId: selected.publicId, expectedVersion: selected.version });

async function token(patch: JWTPayload = {}) {
  const now = Math.ceil(Date.now() / 1000);
  return new SignJWT({ iss: mcpConfig.issuer, sub: 'synthetic-owner', aud: mcpConfig.resourceUrl,
    azp: mcpConfig.clients[0]!.clientId, scope: MCP_SCOPES.join(' '), iat: now, exp: now + 900, ...patch })
    .setProtectedHeader({ alg: 'RS256', kid: 'fixture' }).sign(keys.privateKey);
}
async function authorize(scopes: readonly string[] = MCP_SCOPES) {
  const result = await request(app).post('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).send({
    clientKey: 'client-a', matters: [choice()], scopes, consentVersion: AI_CONSENT_VERSION, acknowledgedDisclosure: true,
  }).expect(201);
  return result.body.connection as { publicId: string; version: number };
}
async function client(accessToken: string, era: 'legacy' | 'modern' = 'legacy') {
  const value = new Client({ name: 'rillora-synthetic-client', version: '1.0.0' },
    { versionNegotiation: { mode: era === 'modern' ? { pin: '2026-07-28' } : 'legacy' } });
  await value.connect(new StreamableHTTPClientTransport(new URL(mcpConfig.resourceUrl), {
    requestInit: { headers: { authorization: `Bearer ${accessToken}` } },
    fetch: (input, init) => mcp.fetch(new Request(input, init)),
  }));
  return value;
}

describe.sequential('selected AI access in an isolated signed PostgreSQL fixture', () => {
  beforeAll(async () => {
    await assertDedicatedTestDatabase(url, 'rillora_mcp_test');
    await runMigrations(url);
    admin = new pg.Client({ connectionString: url }); await admin.connect();
    const password = randomBytes(32).toString('hex'), authority = randomBytes(48).toString('base64url');
    await bootstrapRuntimeRole(admin, role, password, true, authority);
    const runtime = new URL(url); runtime.username = role; runtime.password = password;
    const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: runtime.toString(), ALLOW_DEV_AUTH: 'true', DATABASE_AUTHORITY_KEY: authority });
    pool = createPool(config);
    keys = await generateKeyPair('RS256');
    const publicKey = { ...await exportJWK(keys.publicKey), kid: 'fixture', alg: 'RS256' };
    mcp = new McpIntegration(pool, config, mcpConfig, createMcpTokenVerifier(mcpConfig, createLocalJWKSet({ keys: [publicKey] })));
    app = createApp(pool, config, { mcp });
  });
  beforeEach(async () => {
    await admin.query('update app.recovery_policy set enforced=false');
    await admin.query('truncate app.recovery_controls, app.planners restart identity cascade');
    journal.length = 0;
    for (const [subject, name] of [['synthetic-owner', 'Synthetic Owner'], ['synthetic-other', 'Synthetic Other']]) {
      const p = (await admin.query('insert into app.planners(display_name) values($1) returning id::text,public_id', [name])).rows[0];
      await admin.query('insert into app.plans(planner_id) values($1)', [p.id]);
      const identity = (await admin.query('insert into app.identity_accounts(planner_id,issuer,subject) values($1,$2,$3) returning id', [p.id, mcpConfig.issuer.replace(/\/$/, ''), subject])).rows[0];
      await admin.query(`insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,
        legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
        values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7)`, [p.id, identity.id, currentLegalContract.termsVersion,
        currentLegalContract.privacyVersion, currentLegalContract.consentTextVersion, Buffer.from(currentLegalContract.bundleSha256, 'hex'),
        createHash('sha256').update(mcpConfig.issuer.replace(/\/$/, '') + '\u001f' + subject).digest()]);
      if (subject === 'synthetic-owner') owner = p; else other = p;
    }
    const create = async (title: string) => (await request(app).post('/v1/matters').set('x-dev-planner-id', owner.public_id)
      .send({ category: 'account', title, institutionName: 'Synthetic platform', locationHint: 'Synthetic shelf', notes: 'Private synthetic note never exposed', details: {} }).expect(201)).body.matter;
    selected = await create('Selected synthetic matter'); hidden = await create('Unselected synthetic matter');
  });
  afterAll(async () => { await pool?.end(); if (admin) { await admin.query('update app.recovery_policy set enforced=false'); await admin.query(`drop role if exists ${role}`); await admin.end(); } });

  it('does not enable MCP from omitted configuration or reuse first-party identity grants', () => {
    const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, ALLOW_DEV_AUTH: 'true' });
    expect(loadMcpConfig({}, config)).toBeNull();
    expect(() => loadMcpConfig({ MCP_RESOURCE_URL: mcpConfig.resourceUrl }, config)).toThrow();
    expect(() => loadMcpConfig({ ALLOW_MCP_INTEGRATION: 'yes' }, config)).toThrow();
    expect(() => loadMcpConfig({ ALLOW_MCP_INTEGRATION: 'true', MCP_RESOURCE_URL: mcpConfig.resourceUrl,
      MCP_CLIENTS_JSON: JSON.stringify(mcpConfig.clients) }, { ...config, nativeOidc: { issuerUrl: mcpConfig.issuer,
        clientId: mcpConfig.clients[0]!.clientId, audience: 'urn:first-party' } })).toThrow('first-party');
  });
  it('has no MCP or consent endpoints in the existing default application', async () => {
    const plain = createApp(pool, loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, ALLOW_DEV_AUTH: 'true' }));
    await request(plain).post('/mcp').send({}).expect(404);
    await request(plain).get('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).expect(404);
  });
  it('publishes precise protected-resource metadata and challenges opaque or missing credentials', async () => {
    const meta = await request(app).get('/api/mcp/resource-metadata').expect(200);
    expect(meta.body.resource).toBe(mcpConfig.resourceUrl);
    expect(meta.body.scopes_supported).toEqual(MCP_SCOPES);
    for (const credential of ['', randomBytes(32).toString('base64url')]) {
      const response = await request(app).post('/mcp').set('authorization', `Bearer ${credential}`).send({}).expect(401);
      expect(response.headers['www-authenticate']).toContain(mcpConfig.resourceUrl + '/resource-metadata');
    }
    await request(app).get('/v1/session').set('authorization', `Bearer ${await token()}`).expect(401);
  });
  it('rejects foreign issuer, audience, client, machine identity, stale/future and overlong tokens', async () => {
    const now = Math.floor(Date.now() / 1000);
    for (const patch of [{ iss: 'https://foreign.example.test/' }, { aud: 'urn:first-party' }, { azp: 'other-client' },
      { sub: 'service@clients' }, { gty: 'client-credentials' }, { exp: now - 10 }, { iat: now + 90 }, { exp: now + 7200 }]) {
      await request(app).post('/mcp').set('authorization', `Bearer ${await token(patch)}`).send({}).expect(401);
    }
    await request(app).post('/mcp').set('authorization', `Bearer ${await token({ scope: 'unrelated' })}`).send({}).expect(403);
  });
  it('requires explicit scoped consent and rejects a changed or foreign selection', async () => {
    const input = { clientKey: 'client-a', matters: [choice()], scopes: MCP_SCOPES, consentVersion: AI_CONSENT_VERSION, acknowledgedDisclosure: true };
    await request(app).post('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).send({ ...input, acknowledgedDisclosure: false }).expect(400);
    await request(app).post('/v1/account/ai-connections').set('x-dev-planner-id', other.public_id).send(input).expect(409);
    await request(app).post('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).send({ ...input, matters: [{ ...choice(), expectedVersion: selected.version + 1 }] }).expect(409);
  });
  it('keeps the selection endpoint minimal and verifies cookie CSRF before granting access', async () => {
    const choices = await request(app).get('/v1/account/ai-connections/selectable').set('x-dev-planner-id', owner.public_id).expect(200);
    expect(Object.keys(choices.body.matters[0]).sort()).toEqual(['publicId', 'title', 'version']);
    expect(JSON.stringify(choices.body)).not.toContain('Private synthetic note');
    const session = randomBytes(32).toString('base64url'), csrf = randomBytes(32).toString('base64url');
    await admin.query(`insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at)
      select $1,a.identity_account_id,a.id,$2,$3,now()+interval '1 hour' from app.legal_acceptances a where a.planner_id=$1`,
    [owner.id, createHash('sha256').update(session).digest(), createHash('sha256').update(csrf).digest()]);
    const input = { clientKey: 'client-a', matters: [choice()], scopes: MCP_SCOPES, consentVersion: AI_CONSENT_VERSION, acknowledgedDisclosure: true };
    await request(app).post('/v1/account/ai-connections').set('cookie', `continuity_session=${session}`)
      .set('x-rillora-planner', owner.public_id).send(input).expect(403);
    await request(app).post('/v1/account/ai-connections').set('cookie', `continuity_session=${session}`)
      .set('x-csrf-token', csrf).set('x-rillora-planner', owner.public_id).send(input).expect(201);
    const changed = (await request(app).get('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).expect(200)).body.connections[0];
    const strict = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, REQUIRE_RECENT_AUTHENTICATION: 'true' });
    const strictApp = createApp(pool, strict, { mcp: new McpIntegration(pool, strict, mcpConfig) });
    await request(strictApp).post('/v1/account/ai-connections').set('cookie', `continuity_session=${session}`)
      .set('x-csrf-token', csrf).set('x-rillora-planner', owner.public_id).send({ ...input, replace: { publicId: changed.publicId, expectedVersion: changed.version } }).expect(403);
    await request(strictApp).delete('/v1/account/ai-connections/' + changed.publicId).set('cookie', `continuity_session=${session}`)
      .set('x-csrf-token', csrf).set('x-rillora-planner', owner.public_id).send({ expectedVersion: changed.version }).expect(200);
  });
  it.each(['legacy', 'modern'] as const)('uses %s protocol without exposing hidden records or private fields', async era => {
    await authorize();
    const sdk = await client(await token(), era);
    try {
      const listing = await sdk.listTools();
      expect(listing.tools.map(tool => tool.name).sort()).toEqual(['get_preparation_gaps', 'list_selected_matters']);
      expect(listing.tools.every(tool => tool.annotations?.readOnlyHint && !tool.annotations.openWorldHint)).toBe(true);
      const summary = await sdk.callTool({ name: 'list_selected_matters', arguments: {} });
      expect(summary.isError).not.toBe(true);
      expect(summary.structuredContent).toEqual({ matters: [{ publicId: selected.publicId, title: 'Selected synthetic matter', category: 'account', status: 'draft' }] });
      expect(JSON.stringify(summary)).not.toMatch(/Private synthetic|Unselected|Synthetic shelf|Synthetic platform/);
      const gaps = await sdk.callTool({ name: 'get_preparation_gaps', arguments: {} });
      expect(gaps.structuredContent).toEqual({ matters: [{ publicId: selected.publicId, missingFields: ['intended_outcome'] }], assessment: 'selected_common_fields_only', notAssessed: ['category_specific_details', 'legal_authority', 'recipient_readiness'] });
      await expect(sdk.callTool({ name: 'export_everything', arguments: {} })).rejects.toThrow();
    } finally { await sdk.close(); }
  });
  it('keeps grants isolated by account and OAuth client', async () => {
    await authorize();
    for (const patch of [{ sub: 'synthetic-other' }, { azp: mcpConfig.clients[1]!.clientId }]) {
      const sdk = await client(await token(patch));
      try { expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).isError).toBe(true); }
      finally { await sdk.close(); }
    }
    expect((await request(app).get('/v1/account/ai-connections').set('x-dev-planner-id', other.public_id).expect(200)).body.connections).toEqual([]);
  });
  it('reads ordinary updates within the selected fields without reauthorizing the matter', async () => {
    await authorize(); const sdk = await client(await token());
    try {
      await request(app).patch('/v1/matters/' + selected.publicId).set('x-dev-planner-id', owner.public_id)
        .send({ expectedVersion: selected.version, title: 'Updated selected title', desiredOutcome: 'notify' }).expect(200);
      const summary = await sdk.callTool({ name: 'list_selected_matters', arguments: {} });
      expect(JSON.stringify(summary.structuredContent)).toContain('Updated selected title');
      expect(JSON.stringify(summary)).not.toContain(hidden.publicId);
      expect((await sdk.callTool({ name: 'get_preparation_gaps', arguments: {} })).structuredContent).toMatchObject({ matters: [{ publicId: selected.publicId, missingFields: [] }] });
      expect((await request(app).get('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).expect(200)).body.connections[0].status).toBe('active');
    } finally { await sdk.close(); }
  });
  it('does not mislabel a signing-key outage as an expired user login', async () => {
    const verifier = createMcpTokenVerifier(mcpConfig, async () => { throw new Error('Synthetic key service outage'); });
    await expect(verifier.verifyAccessToken(await token())).rejects.toMatchObject({ code: 'server_error' });
  });
  it('serves actual HTTP through the Node adapter and refuses unexpected origins and hosts', async () => {
    await authorize(); const access = await token();
    const http = createServer(app);
    await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
    const address = http.address(); if (!address || typeof address === 'string') throw new Error('No test listener');
    const sdk = new Client({ name: 'rillora-http-fixture', version: '1.0.0' });
    try {
      await sdk.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/api/mcp`), { requestInit: { headers: { authorization: `Bearer ${access}` } } }));
      expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).isError).not.toBe(true);
      await request(app).post('/mcp').set('host', 'untrusted.example.test').set('authorization', `Bearer ${access}`).send({}).expect(403);
      await request(app).post('/mcp').set('origin', 'https://untrusted.example.test').set('authorization', `Bearer ${access}`).send({}).expect(403);
      await request(app).post('/mcp').set('authorization', `Bearer ${access}`).send({ padding: 'x'.repeat(33000) }).expect(413);
    } finally { await sdk.close(); await new Promise<void>(resolve => { http.close(() => resolve()); http.closeAllConnections(); }); }
  });
  it('intersects token and connection scopes, and keeps concurrent callers separate', async () => {
    await authorize(['matters:read:summary']);
    const [a, b] = await Promise.all([client(await token()), client(await token({ sub: 'synthetic-other' }))]);
    try {
      const calls = await Promise.all([a.callTool({ name: 'list_selected_matters', arguments: {} }), b.callTool({ name: 'list_selected_matters', arguments: {} }),
        a.callTool({ name: 'get_preparation_gaps', arguments: {} })]);
      expect(calls[0]!.isError).not.toBe(true); expect(calls[1]!.isError).toBe(true); expect(calls[2]!.isError).toBe(true);
      expect((await a.callTool({ name: 'list_selected_matters', arguments: { ownerId: other.public_id, url: 'https://example.invalid' } })).isError).toBe(true);
    } finally { await a.close(); await b.close(); }
  });
  it('decrypts only selected fields through the existing content service and has no plaintext outage fallback', async () => {
    const keys = new TestContentKeys();
    configureContentPool(pool, { mode: 'encrypted', namespace: 'mcp-test', region: 'eu-central-1', kmsKeyArn: 'test-only-provider' }, false, keys);
    try {
      const item = (await request(app).post('/v1/matters').set('x-dev-planner-id', owner.public_id).send({ category: 'account', title: 'Encrypted synthetic title',
        institutionName: 'Encrypted provider', locationHint: 'Encrypted location', notes: 'Encrypted private notes', details: {} }).expect(201)).body.matter;
      selected = item;
      expect((await admin.query('select title from app.matter_items where public_id=$1', [selected.publicId])).rows[0].title).toMatch(/^rce1_/);
      await authorize(); const sdk = await client(await token());
      try {
        const result = await sdk.callTool({ name: 'list_selected_matters', arguments: {} });
        expect(JSON.stringify(result)).toContain('Encrypted synthetic title');
        expect(JSON.stringify(result)).not.toMatch(/rce1_|Encrypted provider|Encrypted location|Encrypted private notes/);
        keys.fail = true;
        expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).isError).toBe(true);
      } finally { await sdk.close(); }
    } finally { configureContentPool(pool, null); }
  });
  it('does not revive a revoked grant or a matter made private', async () => {
    const grant = await authorize(); const sdk = await client(await token());
    try {
      await withPlannerDatabase(pool, owner.id, client => client.query("update app.matter_items set desired_outcome='never_disclose',version=version+1 where public_id=$1", [selected.publicId]));
      expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).structuredContent).toEqual({ matters: [] });
      await withPlannerDatabase(pool, owner.id, client => client.query("update app.matter_items set desired_outcome='undecided',version=version+1 where public_id=$1", [selected.publicId]));
      expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).structuredContent).toEqual({ matters: [] });
      const current = (await request(app).get('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).expect(200)).body.connections[0];
      await request(app).delete('/v1/account/ai-connections/' + grant.publicId).set('x-dev-planner-id', owner.public_id).send({ expectedVersion: current.version }).expect(200);
      expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).isError).toBe(true);
    } finally { await sdk.close(); }
  });
  it('fails closed for expired grants and old tokens', async () => {
    await authorize();
    const sdk = await client(await token({ iat: Math.floor(Date.now() / 1000) - 60 }));
    try { expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).isError).toBe(true); }
    finally { await sdk.close(); }
    await admin.query("update app.ai_connections set created_at=now()-interval '2 days',expires_at=now()-interval '1 day'");
    const current = await client(await token());
    try { expect((await current.callTool({ name: 'list_selected_matters', arguments: {} })).isError).toBe(true); }
    finally { await current.close(); }
  });
  it('requires renewed consent after legal changes and rejects archived selections', async () => {
    await authorize(); const sdk = await client(await token());
    try {
      await admin.query('update app.ai_connections set legal_bundle_sha256=$1', [randomBytes(32)]);
      expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).isError).toBe(true);
      expect((await request(app).get('/v1/account/ai-connections').set('x-dev-planner-id', owner.public_id).expect(200)).body.connections[0].status).toBe('needs_review');
      await admin.query('update app.ai_connections set legal_bundle_sha256=$1', [Buffer.from(currentLegalContract.bundleSha256, 'hex')]);
      await withPlannerDatabase(pool, owner.id, c => c.query('update app.matter_items set archived_at=now(),version=version+1 where public_id=$1', [selected.publicId]));
      expect((await sdk.callTool({ name: 'list_selected_matters', arguments: {} })).structuredContent).toEqual({ matters: [] });
    } finally { await sdk.close(); }
  });
  it('journals no selected content and revokes all external grants on isolated restore', async () => {
    const authority = randomBytes(48).toString('base64url');
    await admin.query('insert into rillora_guard.journal_authority(signing_key) values($1) on conflict(singleton) do update set signing_key=excluded.signing_key', [authority]);
    configureRecoveryPool(pool, {
      publish: async () => { throw new Error('The fixture requires an independently attested write'); },
      publishAttested: async envelope => {
        const event = parseRecoveryControl(JSON.parse(envelope.event));
        const proof = createHmac('sha256', authority).update(`rillora-journal-event-v1|${envelope.generation}|${envelope.transaction}|${envelope.event}`).digest('hex');
        expect(envelope.signature).toBe(proof); journal.push(event);
        return createHmac('sha256', authority).update(`rillora-journal-ack-v1|${envelope.generation}|${envelope.transaction}|${createHash('sha256').update(envelope.event).digest('hex')}|${event.revision}`).digest('hex');
      },
    });
    await admin.query('update app.recovery_policy set enforced=true');
    const data = await new SelectedAiService(pool, loadConfig({ NODE_ENV: 'test', DATABASE_URL: url }), mcpConfig).authorize(owner.id, connectionInput.parse({ clientKey: 'client-a', matters: [choice()], scopes: MCP_SCOPES, consentVersion: AI_CONSENT_VERSION, acknowledgedDisclosure: true }));
    const result = { body: data };
    expect(journal.filter(event => event.kind === 'ai_connection').map(event => event.facts)).toEqual([{ revokeOnRestore: true }]);
    expect(JSON.stringify(journal)).not.toContain(selected.publicId);
    await admin.query('update app.recovery_policy set enforced=false');
    const restore = new pg.Pool({ connectionString: url });
    try { await replayRecoveryControls(restore, []); } finally { await restore.end(); }
    expect((await admin.query('select revoked_at from app.ai_connections where public_id=$1', [result.body.connection.publicId])).rows[0].revoked_at).not.toBeNull();
  });
});
