import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from './http-fixture.js';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createPool, type DatabasePool } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { currentLegalContract } from '../src/legal-contract.js';
import type { ExternalIdentity } from '../src/identity.js';
import type { IdentitySecurityStatus } from '../src/email-verification.js';
import express from 'express';
import { authenticate } from '../src/auth.js';
import { SessionSecurity } from '../src/session-security.js';
import { appleReviewAccessRequired } from '../src/apple-review-access.js';
import { errorHandler } from '../src/errors.js';

const url = dedicatedTestDatabaseUrl('postgresql:///rillora_trusted_sessions_test', 'rillora_trusted_sessions_test');
const proof = randomBytes(32).toString('base64url');
const digest = createHash('sha256').update(proof).digest('hex');
const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: url, REQUIRE_RECENT_AUTHENTICATION: 'true',
  CORS_ORIGINS: 'http://localhost:4173', WEB_APP_ORIGIN: 'http://localhost:4173',
  OIDC_ISSUER_URL: 'https://identity.example', OIDC_CLIENT_ID: 'fixture-web',
  OIDC_CLIENT_SECRET: 'synthetic-test-credential-only', OIDC_REDIRECT_URI: 'http://localhost:4173/auth/callback',
  NATIVE_OIDC_CLIENT_ID: 'fixture-native', OIDC_API_AUDIENCE: 'urn:fixture:sessions',
  TRUSTED_USER_SESSIONS_ENABLED: 'true', SESSION_EDGE_PROOF_SHA256: digest });
const acceptance = { ...currentLegalContract, acceptedTerms: true, acknowledgedPrivacy: true, acceptedElectronicRecords: true } as const;
const nativeAgent = 'Rillora/18 CFNetwork/3860.500 Darwin/26.0.0';
const browserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36';
const edge = (browser = false, asn = '64512') => ({ 'x-rillora-session-edge-proof': proof,
  'cloudfront-viewer-country': 'HK', 'cloudfront-viewer-asn': asn, 'user-agent': browser ? browserAgent : nativeAgent });
const tokenHash = (value: string) => createHash('sha256').update(value).digest();
let pool: DatabasePool;

function fixture(enabled = true, authenticatedAt: Date | null = new Date()) {
  const owner: ExternalIdentity = { issuer: 'https://identity.example', subject: `auth0|${randomUUID()}`,
    displayName: 'Synthetic session planner', locale: 'en', authenticatedAt, authenticationMethods: ['pwd'], legalAcceptance: acceptance };
  let who = owner;
  const security = vi.fn(async (): Promise<IdentitySecurityStatus> => ({ exists: true, blocked: false, passwordChangedAt: null }));
  const app = createApp(pool, { ...config, trustedUserSessions: { ...config.trustedUserSessions!, enabled } }, {
    nativeIdentityVerifier: { async verifyAccessToken() { return who; } },
    sessionIdentityVerifier: { securityStatus: security },
    identityProvider: { async createAuthorizationUrl(transaction) { return new URL(`https://identity.example/authorize?state=${transaction.state}`); },
      async exchangeAuthorizationCode() { return who; } },
  });
  return { app, owner, security, setIdentity(value: ExternalIdentity) { who = value; } };
}
async function native(f: ReturnType<typeof fixture>, headers = edge()) {
  return (await request(f.app).post('/auth/native/session').set(headers).set('Authorization', `Bearer ${'x'.repeat(90)}`)
    .send({ legalAcceptance: acceptance }).expect(201)).body as { sessionToken: string; expiresIn: number };
}
async function row(token: string) {
  return (await pool.query('select * from app.auth_sessions where token_hash=$1', [tokenHash(token)])).rows[0];
}
const reauthInput = { accessToken: 'x'.repeat(90), idToken: 'y'.repeat(90) };
const bearer = (token: string, asn = '64512') => ({ ...edge(false, asn), Authorization: `Bearer ${token}` });

describe.sequential('Bounded user sessions and authenticated network changes', () => {
  beforeAll(async () => { await assertDedicatedTestDatabase(url, 'rillora_trusted_sessions_test'); await runMigrations(url); pool = createPool(config); });
  afterAll(async () => { await pool?.end(); });

  it('issues 30-day sessions only with a verified edge/client, and keeps the legacy fallback bounded', async () => {
    const f = fixture(), session = await native(f), saved = await row(session.sessionToken);
    expect(session.expiresIn).toBe(30 * 86400);
    expect(saved.context_version).toBe(1); expect(saved.idle_timeout_minutes).toBe(7 * 1440);
    expect(saved.client_context_hash.length).toBe(32); expect(saved.network_context_hashes.length).toBe(32);
    expect(saved.expires_at.getTime() - saved.created_at.getTime()).toBeLessThanOrEqual(30 * 86400000);
    for (const headers of [{ ...edge(), 'x-rillora-session-edge-proof': randomBytes(32).toString('base64url') },
      { ...edge(), 'cloudfront-viewer-country': '' }, { ...edge(), 'user-agent': 'Unknown client' }]) {
      const short = await native(fixture(), headers);
      expect(short.expiresIn).toBe(8 * 3600); expect((await row(short.sessionToken)).context_version).toBe(0);
    }
    const disabled = await native(fixture(false));
    expect(disabled.expiresIn).toBe(8 * 3600);
    expect((await native(fixture(true, null))).expiresIn).toBe(8 * 3600);
    expect((await native(fixture(true, new Date(Date.now() - 2 * 86400000)))).expiresIn).toBe(8 * 3600);
  });

  it('survives an overnight absence while preserving recent-authentication gates', async () => {
    const f = fixture(), { sessionToken } = await native(f);
    await pool.query("update app.auth_sessions set last_seen_at=now()-interval '2 days',authenticated_at=now()-interval '2 days' where token_hash=$1", [tokenHash(sessionToken)]);
    await request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(200);
    const held = await request(f.app).post('/v1/account/map/export').set(bearer(sessionToken)).send({ acknowledgesPrivateCopy: true }).expect(403);
    expect(held.body.error.code).toBe('reauthentication_required');
    expect((await row(sessionToken)).last_seen_at.getTime()).toBeGreaterThan(Date.now() - 5000);
  });

  it('challenges an unfamiliar network without losing the original native session or replaying an action', async () => {
    const f = fixture(), { sessionToken } = await native(f), before = await row(sessionToken);
    const changed = bearer(sessionToken, '64513');
    const held = await request(f.app).get('/v1/overview').set(changed).expect(403);
    expect(held.body.error.code).toBe('reauthentication_required');
    expect((await row(sessionToken)).last_seen_at).toEqual(before.last_seen_at);
    f.setIdentity({ ...f.owner, subject: `auth0|${randomUUID()}`, authenticatedAt: new Date() });
    await request(f.app).post('/auth/native/reauthenticate').set(changed).send(reauthInput).expect(403);
    f.setIdentity({ ...f.owner, authenticatedAt: new Date() });
    await request(f.app).post('/auth/native/reauthenticate').set(changed).send(reauthInput).expect(200);
    const after = await row(sessionToken);
    expect(after.expires_at).toEqual(before.expires_at); expect(after.token_hash).toEqual(before.token_hash);
    expect(after.network_context_hashes.length).toBe(64);
    await request(f.app).get('/v1/overview').set(changed).expect(200);
    await request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(200);
  });

  it('retains only five explicitly confirmed networks; missing edge proof cannot establish trust', async () => {
    const f = fixture(), { sessionToken } = await native(f);
    for (let index = 1; index <= 6; index++) {
      await request(f.app).post('/auth/native/reauthenticate').set(bearer(sessionToken, String(64512 + index))).send(reauthInput).expect(200);
    }
    expect((await row(sessionToken)).network_context_hashes.length).toBe(160);
    await request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(403);
    const noEdge = { ...bearer(sessionToken, '64518'), 'x-rillora-session-edge-proof': '' };
    await request(f.app).post('/auth/native/reauthenticate').set(noEdge).send(reauthInput).expect(403);
    await request(f.app).get('/v1/overview').set(bearer(sessionToken, '64518')).expect(200);
  });

  it.each(['revoked', 'absolute', 'idle'] as const)('never revives a %s session through reauthentication', async reason => {
    const f = fixture(), { sessionToken } = await native(f);
    const setting = { revoked: 'revoked_at=now()', absolute: "created_at=now()-interval '30 days',expires_at=now()-interval '1 second'", idle: "last_seen_at=now()-interval '8 days'" }[reason];
    await pool.query(`update app.auth_sessions set ${setting} where token_hash=$1`, [tokenHash(sessionToken)]);
    await request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(401);
    await request(f.app).post('/auth/native/reauthenticate').set(bearer(sessionToken)).send(reauthInput).expect(401);
  });

  it.each(['/v1/auth/logout', '/v1/auth/logout-all'])('allows %s on an unfamiliar network without permitting data access', async path => {
    const f = fixture(), { sessionToken } = await native(f);
    await request(f.app).get('/v1/overview').set(bearer(sessionToken, '64520')).expect(403);
    await request(f.app).post(path).set(bearer(sessionToken, '64520')).send({}).expect(path.endsWith('-all') ? 200 : 204);
    await request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(401);
  });

  it.each(['blocked', 'deleted', 'reset'] as const)('revokes stale sessions when the identity becomes %s', async reason => {
    const f = fixture(), { sessionToken } = await native(f);
    await pool.query("update app.auth_sessions set identity_checked_at=now()-interval '5 hours',authenticated_at=now()-interval '2 hours' where token_hash=$1", [tokenHash(sessionToken)]);
    f.security.mockResolvedValue({ exists: reason !== 'deleted', blocked: reason === 'blocked', passwordChangedAt: reason === 'reset' ? new Date(Date.now() - 3600000) : null });
    await request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(401);
    expect((await row(sessionToken)).revoked_at).toBeInstanceOf(Date);
  });

  it('fails closed during a provider outage without deleting the session, then retries and coalesces parallel checks', async () => {
    const f = fixture(), { sessionToken } = await native(f);
    await pool.query("update app.auth_sessions set identity_checked_at=now()-interval '5 hours' where token_hash=$1", [tokenHash(sessionToken)]);
    f.security.mockRejectedValueOnce(new Error('provider offline'));
    const result = await request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(503);
    expect(result.body.error.code).toBe('identity_status_unavailable'); expect((await row(sessionToken)).revoked_at).toBeNull();
    f.security.mockImplementation(async () => { await new Promise(resolve => setTimeout(resolve, 50)); return { exists: true, blocked: false, passwordChangedAt: null }; });
    const calls = f.security.mock.calls.length;
    await Promise.all(Array.from({ length: 4 }, () => request(f.app).get('/v1/overview').set(bearer(sessionToken)).expect(200)));
    expect(f.security.mock.calls.length - calls).toBe(1);
  });

  it('does not revoke a fresh post-reset login when it invalidates older sessions', async () => {
    const f = fixture(), old = await native(f);
    await pool.query("update app.auth_sessions set identity_checked_at=now()-interval '5 hours',authenticated_at=now()-interval '2 hours' where token_hash=$1", [tokenHash(old.sessionToken)]);
    f.security.mockResolvedValue({ exists: true, blocked: false, passwordChangedAt: new Date(Date.now() - 3600000) });
    const fresh = await native(f);
    await request(f.app).get('/v1/overview').set(bearer(old.sessionToken)).expect(401);
    await request(f.app).get('/v1/overview').set(bearer(fresh.sessionToken)).expect(200);
    expect((await row(fresh.sessionToken)).revoked_at).toBeNull();
  });

  it('rejects blocked sign-in and maintains context enforcement when new long-session issuance is disabled', async () => {
    const f = fixture(); f.security.mockResolvedValue({ exists: true, blocked: true, passwordChangedAt: null });
    await request(f.app).post('/auth/native/session').set(edge()).set('Authorization', `Bearer ${'x'.repeat(90)}`).send({ legalAcceptance: acceptance }).expect(401);
    const { sessionToken } = await native(fixture());
    await request(fixture(false).app).get('/v1/overview').set(bearer(sessionToken, '64530')).expect(403);
  });

  it('keeps the reviewer-only purchase guard usable when identity proof becomes due after parent authentication', async () => {
    const f = fixture(), { sessionToken } = await native(f);
    const security = new SessionSecurity(pool, { securityStatus: f.security });
    const makeRestricted = (reviewService: SessionSecurity | undefined) => {
      const restricted = express();
      restricted.use(authenticate(pool, config, { sessionSecurity: security }));
      // Deterministically model crossing the four-hour boundary between the two
      // database reads; no purchase or provider mutation is involved.
      restricted.use(async (_req, _res, next) => {
        await pool.query("update app.auth_sessions set identity_checked_at=now()-interval '5 hours' where token_hash=$1", [tokenHash(sessionToken)]);
        next();
      });
      const reviewConfig = { ...config, appleReviewAccess: {
        identityDigests: [createHash('sha256').update(`${f.owner.issuer}\u001f${f.owner.subject}`).digest('hex')], expiresAt: Date.now() + 3600000,
      } };
      restricted.use(appleReviewAccessRequired(pool, reviewConfig, reviewService));
      restricted.get('/', (_req, res) => res.json({ eligible: true }));
      restricted.use(errorHandler);
      return restricted;
    };
    await request(makeRestricted(undefined)).get('/').set(bearer(sessionToken)).expect(503);
    await pool.query('update app.auth_sessions set identity_checked_at=now() where token_hash=$1', [tokenHash(sessionToken)]);
    const before = f.security.mock.calls.length;
    await request(makeRestricted(security)).get('/').set(bearer(sessionToken)).expect(200, { eligible: true });
    expect(f.security.mock.calls.length - before).toBe(1);
  });

  it('keeps browser cookies, CSRF, account binding and the network-confirmation callback consistent', async () => {
    const f = fixture();
    const start = await request(f.app).post('/auth/start').set(edge(true)).send({ intent: 'signin', legalAcceptance: acceptance }).expect(201);
    const state = new URL(start.body.authorizationUrl).searchParams.get('state');
    const callback = await request(f.app).get(`/auth/callback?state=${state}&code=synthetic`).set(edge(true)).set('Cookie', start.headers['set-cookie']!).expect(303);
    const cookies = (callback.headers['set-cookie'] as unknown as string[]).filter(value => !/^(?:__Host-)?continuity_auth_tx=/.test(value));
    const sessionCookie = cookies.find(value => /^(?:__Host-)?continuity_session=/.test(value))!;
    expect(sessionCookie).toContain('Max-Age=2592000'); expect(sessionCookie).toContain('HttpOnly');
    const csrf = cookies.find(value => /^(?:__Host-)?continuity_csrf=/.test(value))!.split(';')[0]!.split('=')[1]!;
    const current = (await request(f.app).get('/v1/session').set(edge(true)).set('Cookie', cookies).expect(200)).body;
    const headers = { ...edge(true, '64550'), 'x-csrf-token': csrf, 'x-rillora-planner': current.plannerPublicId };
    await request(f.app).get('/v1/overview').set(headers).set('Cookie', cookies).expect(403);
    await request(f.app).post('/auth/reauthenticate').set(edge(true, '64550')).set('Cookie', cookies).send({}).expect(403);
    const renew = await request(f.app).post('/auth/reauthenticate').set(headers).set('Cookie', cookies).send({}).expect(201);
    const nextState = new URL(renew.body.authorizationUrl).searchParams.get('state');
    await request(f.app).get(`/auth/callback?state=${nextState}&code=synthetic`).set(edge(true, '64550')).set('Cookie', [...cookies, ...renew.headers['set-cookie']!]).expect(200);
    await request(f.app).get('/v1/overview').set(headers).set('Cookie', cookies).expect(200);
    await request(f.app).get('/v1/overview').set({ ...headers, 'user-agent': browserAgent.replace('Chrome/141.0.0.0', 'Firefox/141.0') }).set('Cookie', cookies).expect(401);
    await request(f.app).get('/v1/overview').set(headers).set('Cookie', cookies).expect(200);
    const nativeForgery = sessionCookie.split(';')[0]!.split('=')[1]!;
    await request(f.app).get('/v1/overview').set(bearer(nativeForgery)).expect(401);
  });
});
