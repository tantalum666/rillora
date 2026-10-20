import { OAuthProvider, OAuthError, AuthorizationError, authorizationErrorRedirect, type OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createSelectedMcpServer } from '../../apps/api/src/mcp/server.js';
import { createOidcIdentityProvider } from '../../apps/api/src/identity.js';
import { connectionInput } from '../../apps/api/src/mcp/service.js';
import { AI_CONSENT_VERSION as CONSENT_VERSION } from '../../apps/api/src/mcp/config.js';
import { ApiError } from '../../apps/api/src/errors.js';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { withCandidate } from './database.js';
import { ORIGIN, RESOURCE, ISSUER, SCOPES, PLATFORMS, assertEnvironment, checkRequest, escapeHtml as e } from './config.mjs';
import { sealSession, readSession, requireFormCsrf, clearCookie } from './sessions.mjs';

type Env = Record<string, any> & { OAUTH_PROVIDER: OAuthHelpers };
const html = (title: string, body: string, headers = new Headers(), formRedirectOrigins: string[] = []) => {
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('referrer-policy', 'same-origin');
  headers.set('x-content-type-options', 'nosniff');
  // Chrome checks a POST's redirected destination against form-action too.
  // Callers pass only the fixed identity origin or a provider-validated callback origin.
  headers.set('content-security-policy', `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${formRedirectOrigins.join(' ')}; frame-ancestors 'none'; base-uri 'none'`);
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${e(title)} · Rillora</title>
  <style>body{font:17px/1.6 system-ui;max-width:660px;margin:8vh auto;padding:24px;color:#e9ece5;background:#171e1b}a{color:#c5e5a2}button{font:inherit;padding:12px 22px;border:0;border-radius:12px;background:#c5e5a2;color:#171e1b;cursor:pointer}label{display:block;margin:20px 0}input{margin-right:12px}small{color:#b7c0ba}.row{margin:24px 0;padding:16px 0;border-bottom:1px solid #46514a}</style>
  <p><a href="/">Rillora</a> · <small>Synthetic integration candidate</small></p><h1>${e(title)}</h1>${body}</html>`, { headers });
};
const redirect = (url: string, headers = new Headers()) => {
  headers.set('location', url); headers.set('cache-control', 'no-store'); headers.set('referrer-policy', 'same-origin');
  return new Response(null, { status: 303, headers });
};
const oidc = (env: Env) => createOidcIdentityProvider({ issuerUrl: ISSUER, clientId: env.AUTH0_CLIENT_ID,
  clientSecret: env.AUTH0_CLIENT_SECRET, redirectUri: ORIGIN + '/callback', webAppOrigin: ORIGIN });
const fresh = (time: number) => Number.isFinite(time) && time <= Date.now() + 30_000 && Date.now() - time < 600_000;
const actor = (props: any, clientId: string, scopes: string[], issuedAt: number, env: Env) => {
  if (props?.subject !== env.SYNTHETIC_SUBJECT || typeof props.connectionId !== 'string'
    || !/^[0-9a-f-]{36}$/.test(props.connectionId) || props.clientId !== clientId
    || !scopes.includes(SCOPES[0]) || scopes.some(s => !SCOPES.includes(s))) throw new OAuthError('invalid_grant', { description: 'Selected connection unavailable' });
  return { issuer: ISSUER, subject: props.subject, clientId, scopes, issuedAt, boundConnectionPublicId: props.connectionId };
};

async function browser(request: Request, env: Env) {
  const path = new URL(request.url).pathname, oauth = env.OAUTH_PROVIDER;
  if (path.startsWith('/operator/')) return operator(request, env);
  if (request.method === 'GET' && path === '/') return html('Connect selected matters',
    '<p>This separate candidate contains synthetic examples only. It is not your current Rillora account.</p><p>Start a connection from an individually registered AI client. You choose the matters and can revoke access here.</p><p><a href="/connections">Manage connections</a></p>');
  if (request.method === 'GET' && path === '/authorize') {
    const auth = await oauth.parseAuthRequest(request);
    const registry = await env.OAUTH_KV.get('candidate:clients', 'json') ?? {};
    if (!Object.values(registry).includes(auth.clientId) || auth.resource !== RESOURCE
      || auth.codeChallengeMethod !== 'S256' || !auth.scope.includes(SCOPES[0]) || auth.scope.some(s => !SCOPES.includes(s))) {
      return html('Connection unavailable', '<p>This client or requested permission is not enabled.</p>');
    }
    const description = await oauth.describeConsent(auth), consent = await oauth.beginConsent(auth);
    return html('Continue with ' + description.clientName,
      `<p>This client requests read-only access to selected matter titles, categories, statuses and missing-field names. Notes, account hints, values, contacts and unselected matters remain unavailable.</p>
      <p>Return address: <strong>${e(description.redirectHost)}</strong></p>${description.redirectIsLoopback ? '<p>Only continue if you initiated this connection in your local AI application.</p>' : ''}
      <p>No changes, payments, transfers or disclosure can be performed.</p><form method="post" action="/authorize"><input type="hidden" name="handle" value="${e(consent.handle)}">
      <button name="decision" value="continue">Sign in and choose matters</button> <button name="decision" value="deny">Cancel</button></form>`, consent.headers, [ISSUER, new URL(auth.redirectUri).origin]);
  }
  if (request.method === 'POST' && path === '/authorize') {
    if (request.headers.get('origin') !== ORIGIN) return new Response('Invalid origin', { status: 403 });
    const form = await request.formData();
    if (form.get('decision') !== 'continue') {
      const denied = await oauth.denyConsent(request, String(form.get('handle'))); return redirect(denied.redirectTo, denied.headers);
    }
    const approved = await oauth.approveConsent(request, String(form.get('handle')));
    const data = { codeVerifier: randomBytes(32).toString('base64url'), nonce: randomBytes(32).toString('base64url') };
    const upstream = await oauth.beginUpstream(approved.request, { data, headers: approved.headers });
    const url = await oidc(env).createAuthorizationUrl({ ...data, state: upstream.state }, { maxAge: 600, uiLocales: 'en' });
    url.searchParams.set('connection', env.AUTH0_CONNECTION);
    return redirect(url.toString(), upstream.headers);
  }
  if (request.method === 'GET' && path === '/callback') {
    const completed = await oauth.finishUpstream<{ codeVerifier: string; nonce: string }>(request);
    const callback = new URL(request.url);
    if (callback.searchParams.has('error')) return redirect(authorizationErrorRedirect(completed.request, 'access_denied'), completed.headers);
    const identity = await oidc(env).exchangeAuthorizationCode(callback, { ...completed.data, state: callback.searchParams.get('state')! });
    if (identity.subject !== env.SYNTHETIC_SUBJECT || !identity.authenticatedAt || !fresh(identity.authenticatedAt.getTime())) throw new Error('Fresh synthetic sign-in required');
    return withCandidate(env, async runtime => {
      const planner = await runtime.planner(identity.subject), session = await sealSession(env, identity, planner);
      const selected = await runtime.service.selectable(planner.id, null);
      const target = runtime.clients.find(c => c.clientId === completed.request.clientId);
      if (!target) throw new Error('Client unavailable');
      const connections = await runtime.service.list(planner.id), prior = connections.connections.find(c => c.clientKey === target.key);
      const pending = await oauth.beginUpstream(completed.request, { headers: completed.headers,
        data: { subject: identity.subject, clientKey: target.key, matters: selected.matters,
          prior: prior ? { publicId: prior.publicId, expectedVersion: prior.version } : undefined } });
      pending.headers.append('set-cookie', session.cookie);
      return html('Choose matters for ' + target.name, `<p>Select up to 20 matters. Access lasts at most seven days and can be revoked at any time.</p>
        <form method="post" action="/select?state=${e(pending.state)}"><input type="hidden" name="csrf" value="${e(session.csrf)}">
        ${selected.matters.map(m => `<label><input type="checkbox" name="matter" value="${e(m.publicId)}">${e(m.title)}</label>`).join('')}
        <label><input required type="checkbox" name="disclosure" value="yes">I allow ${e(target.name)} to receive only these selected summaries${completed.request.scope.includes(SCOPES[1]) ? ' and missing-field names' : ''}.</label>
        ${prior ? '<p>This replaces the previous selection for this client.</p>' : ''}
        <button name="decision" value="allow">Connect selected matters</button> <button name="decision" value="deny" formnovalidate>Cancel</button></form>`, pending.headers, [new URL(completed.request.redirectUri).origin]);
    });
  }
  if (request.method === 'POST' && path === '/select') {
    const session = await readSession(request, env), form = await request.formData();
    requireFormCsrf(request, session, form);
    const completed = await oauth.finishUpstream<any>(request);
    if (form.get('decision') !== 'allow') return redirect(authorizationErrorRedirect(completed.request, 'access_denied'), completed.headers);
    if (!fresh(session.authenticatedAt) || completed.data.subject !== session.subject || form.get('disclosure') !== 'yes') throw new Error('Fresh explicit approval required');
    const ids = form.getAll('matter').map(String);
    if (new Set(ids).size !== ids.length || !ids.length || ids.length > 20) throw new Error('Select distinct matters');
    return withCandidate(env, async runtime => {
      const owner = await runtime.planner(session.subject);
      const input = connectionInput.parse({ clientKey: completed.data.clientKey,
        matters: ids.map(id => { const item = completed.data.matters.find((m: any) => m.publicId === id); return { publicId: id, expectedVersion: item?.version }; }),
        scopes: completed.request.scope, consentVersion: CONSENT_VERSION, acknowledgedDisclosure: true, replace: completed.data.prior });
      const result = await runtime.service.authorize(owner.id, input);
      // SQL deliberately rounds the invalidation floor up. Do not issue a same-second token below that floor.
      await new Promise(resolve => setTimeout(resolve, 1100 - Date.now() % 1000));
      const granted = await oauth.completeAuthorization({ request: completed.request, userId: owner.public_id, metadata: {},
        scope: completed.request.scope, props: { subject: session.subject, clientId: completed.request.clientId, connectionId: result.connection.publicId } });
      return redirect(granted.redirectTo, completed.headers);
    });
  }
  if (path === '/connections' && request.method === 'GET') {
    const session = await readSession(request, env);
    return withCandidate(env, async runtime => {
      const owner = await runtime.planner(session.subject), list = await runtime.service.list(owner.id);
      return html('Your AI connections', list.connections.map(c => `<div class="row"><strong>${e(c.name)}</strong><p>${c.selectedCount} selected · ${e(c.status)}</p>
        <form method="post" action="/revoke"><input type="hidden" name="csrf" value="${e(session.csrf)}"><input type="hidden" name="id" value="${e(c.publicId)}"><input type="hidden" name="version" value="${c.version}"><button>Revoke access</button></form></div>`).join('')
        + `<form method="post" action="/logout"><input type="hidden" name="csrf" value="${e(session.csrf)}"><button>Sign out</button></form>`);
    });
  }
  if (request.method === 'POST' && ['/revoke', '/logout'].includes(path)) {
    const session = await readSession(request, env), form = await request.formData(); requireFormCsrf(request, session, form);
    if (path === '/logout') return redirect('/', new Headers({ 'set-cookie': clearCookie }));
    await withCandidate(env, async runtime => { const owner = await runtime.planner(session.subject);
      await runtime.service.revoke(owner.id, String(form.get('id')), Number(form.get('version'))); });
    return redirect('/connections');
  }
  return new Response('Not found', { status: 404 });
}

async function operator(request: Request, env: Env) {
  const supplied = /^Bearer ([a-f0-9]{64})$/.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!supplied || !timingSafeEqual(Buffer.from(supplied), Buffer.from(env.OPERATOR_SECRET))) return new Response(null, { status: 401 });
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  const path = new URL(request.url).pathname;
  if (path === '/operator/clients') {
    const body = await request.json() as any;
    if (Object.keys(body).length !== 1 || !Object.hasOwn(PLATFORMS, body.platform)) return new Response(null, { status: 400 });
    const registry = await env.OAUTH_KV.get('candidate:clients', 'json') ?? {};
    if (!registry[body.platform]) {
      const spec = PLATFORMS[body.platform];
      const client = await env.OAUTH_PROVIDER.createClient({ clientName: spec.name, policyUri: spec.privacyUrl,
        redirectUris: spec.redirectUris, tokenEndpointAuthMethod: 'none', grantTypes: ['authorization_code', 'refresh_token'], responseTypes: ['code'] });
      registry[body.platform] = client.clientId; await env.OAUTH_KV.put('candidate:clients', JSON.stringify(registry));
    }
    return Response.json({ platform: body.platform, clientId: registry[body.platform], resource: RESOURCE });
  }
  if (path === '/operator/seed-matters') return Response.json(await withCandidate(env, runtime => runtime.seedMatters()));
  if (path === '/operator/status') return Response.json(await withCandidate(env, async runtime => {
    const identity = (await runtime.pool.query(`select current_database() as database,current_user as role,
      has_schema_privilege(current_user,'app','USAGE') as direct_app_access`)).rows[0];
    await runtime.planner(env.SYNTHETIC_SUBJECT);
    return { mode: 'synthetic-only', identity, registeredClients: runtime.clients.map(c => c.key) };
  }));
  return new Response(null, { status: 404 });
}

const provider = new OAuthProvider<Env>({
  apiRoute: '/mcp', authorizeEndpoint: '/authorize', tokenEndpoint: '/oauth/token',
  scopesSupported: SCOPES, requiredScopes: [SCOPES[0]], accessTokenTTL: 900, refreshTokenTTL: 28_800,
  resourceMetadata: { resource: RESOURCE, authorization_servers: [ORIGIN], resource_name: 'Rillora synthetic selected matters' },
  // Pre-registered clients only. DCR, CIMD, external tokens and token exchange remain disabled.
  defaultHandler: { fetch: browser },
  apiHandler: { async fetch(request, env, ctx: any) {
    if (new URL(request.url).pathname !== '/mcp') return new Response(null, { status: 404 });
    const token = await env.OAUTH_PROVIDER.unwrapToken(ctx.auth.token);
    if (!token || token.audience !== RESOURCE) return new Response(null, { status: 401 });
    const verified = actor(token.grant.props, token.grant.clientId, token.scope, token.createdAt, env);
    return withCandidate(env, async runtime => {
      if (!runtime.clients.some(c => c.clientId === verified.clientId)) return new Response(null, { status: 401 });
      const handler = createMcpHandler(context => createSelectedMcpServer(runtime.service, context.authInfo),
        { legacy: 'stateless', responseMode: 'json', maxSubscriptions: 0, maxRequestBodySize: 32768 });
      const response = await handler.fetch(request, { authInfo: { token: ctx.auth.token, clientId: verified.clientId,
        scopes: verified.scopes, expiresAt: token.expiresAt, extra: { actor: verified } } });
      // Consume the JSON body before closing this request's database connections.
      return new Response(await response.arrayBuffer(), { status: response.status, headers: response.headers });
    });
  } },
  async tokenExchangeCallback(options) {
    if (!options.env) throw new OAuthError('temporarily_unavailable', { description: 'Candidate unavailable' });
    const verified = actor(options.props, options.clientId, options.scope, Math.floor(Date.now() / 1000), options.env);
    try { await withCandidate(options.env, runtime => runtime.service.read(verified, 'summary')); }
    catch (error) {
      if (error instanceof ApiError && error.code === 'ai_connection_unavailable') throw new OAuthError('invalid_grant', { description: 'Selected connection unavailable' });
      throw new OAuthError('temporarily_unavailable', { statusCode: 503, description: 'Candidate unavailable' });
    }
  },
});

export default { async fetch(request: Request, env: Env, ctx: ExecutionContext) {
  try {
    assertEnvironment(env);
    if (!checkRequest(request)) return new Response(null, { status: 403 });
    if (request.body) {
      const reader = request.body.getReader(), chunks: Uint8Array[] = []; let length = 0;
      while (true) { const { done, value } = await reader.read(); if (done) break;
        length += value.byteLength; if (length > 32768) { await reader.cancel(); return new Response(null, { status: 413 }); } chunks.push(value); }
      request = new Request(request, { body: Buffer.concat(chunks) });
    }
    const response = await provider.fetch(request, env, ctx);
    const headers = new Headers(response.headers); headers.set('cache-control', 'no-store');
    headers.set('x-robots-tag', 'noindex, nofollow');
    // no-referrer makes Chrome serialize the Origin of a native form POST as null.
    // same-origin preserves strict CSRF checks without leaking callback URLs to other sites.
    headers.set('referrer-policy', headers.get('content-type')?.startsWith('text/html') || headers.has('location') ? 'same-origin' : 'no-referrer');
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof Error && error.name === 'ZodError') {
      return new Response('Invalid authorization request. Start the connection again.', { status: 400, headers: { 'cache-control': 'no-store' } });
    }
    console.warn('candidate_request_failed', error instanceof Error ? error.name : 'UnknownError');
    return new Response('The candidate request could not be completed. Start the connection again.', { status: 503, headers: { 'cache-control': 'no-store' } });
  }
} };
