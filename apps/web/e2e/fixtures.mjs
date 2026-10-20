export const APP = 'http://127.0.0.1:4174', PUBLIC = 'http://127.0.0.1:4197';
export const OWNER = '22222222-2222-4222-8222-222222222222';
export const session = { plannerPublicId: OWNER, authenticationMode: 'session', authenticationMethods: [], authenticatedAt: null };
const matter = { publicId: '11111111-1111-4111-8111-111111111111', title: 'Synthetic user 原文', category: 'account', institutionName: 'Example platform', locationHint: 'Original shelf 甲', accountHint: 'test-only-42', notes: 'Keep original 用户输入\nSecond line', desiredOutcome: 'notify', status: 'draft', importance: 'important', valueBand: 'unknown', currencyCode: 'USD', details: {}, version: 1 };
export const overview = { session, plan: { publicId: OWNER, version: 1, firstUseState: 'completed', firstUseStep: 2 }, matters: [matter], trustedContacts: [], nextCursor: null };
export const identity = { account: { publicId: OWNER, displayName: 'Synthetic Owner 林', verifiedEmail: 'owner@example.test' }, emailStatus: 'available' };
export async function isolate(context, state = {}) {
  Object.assign(state, { writes: [], unexpected: [], errors: [], console: [] });
  context.on('page', page => {
    page.on('pageerror', error => state.errors.push(error.message));
    page.on('console', message => {
      if (!['error', 'warning'].includes(message.type())) return;
      const entry = { level: message.type(), text: message.text(), url: message.location().url };
      const expectedApiFailure = entry.url?.includes('/api/') && /status of (401|403|404|409|503)/.test(entry.text);
      const expectedImageFailure = state.expectedImageFailure && /Failed to load resource/.test(entry.text);
      state.console.push({ ...entry, expectedFixtureFailure: Boolean(expectedApiFailure || expectedImageFailure) });
      if (!expectedApiFailure && !expectedImageFailure) state.errors.push(`console ${entry.level}: ${entry.text}`);
    });
  });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.protocol === 'data:') return route.continue();
    if (!['127.0.0.1', 'localhost', 'app.staging.rillora.xyz', 'app.rillora.xyz'].includes(url.hostname)) {
      state.unexpected.push(request.url()); return route.abort();
    }
    if (url.pathname.startsWith('/api/')) {
      const path = url.pathname;
      if (request.method() !== 'GET') {
        state.writes.push({ path, body: request.postDataJSON() });
        if (path === '/api/auth/start') {
          state.authReturn = request.postDataJSON().returnTo;
          // Synthetic response intentionally stays on the account page. Test explicitly
          // follows the captured return path; no provider, consent or real session exists.
          return route.fulfill({ json: { authorizationUrl: APP + '/account' } });
        }
        return route.fulfill({ status: 409, json: { error: { code: 'qa_mutation_blocked' } } });
      }
      if (path.endsWith('/overview')) return state.signedIn === false ? route.fulfill({ status: 401, json: { error: { code: 'authentication_required' } } }) : route.fulfill({ json: overview });
      if (path.endsWith('/auth/session-status')) return route.fulfill({ json: { authenticated: state.signedIn !== false } });
      if (path.endsWith('/session')) return route.fulfill({ json: state.session ?? session });
      if (path.endsWith('/account/identity')) {
        if (state.delayIdentity) await new Promise(resolve => { state.releaseIdentity = resolve; });
        return route.fulfill({ json: state.identity ?? identity });
      }
      if (path.endsWith('/account/profile')) return route.fulfill({ json: { account: identity.account, billing: { hasSubscription: false, hasPendingPurchase: false } } });
      if (path.endsWith('/account/archived-matters')) return route.fulfill({ json: { matters: [] } });
      if (path.endsWith('/official-setup-checks')) return route.fulfill({ json: { officialSetupChecks: [] } });
      if (path.endsWith('/audit-events')) return route.fulfill({ json: { auditEvents: [] } });
      if (path.endsWith('/sharing/connections')) return route.fulfill({ json: { connections: [] } });
      if (path.endsWith('/sharing/access')) return route.fulfill({ json: { access: null } });
      if (path.endsWith('/sharing/shared-with-me')) return route.fulfill({ json: { readOnly: true, purpose: 'planner_directed', connections: [], items: [] } });
      if (path.includes('/commerce/') || path.includes('/maintenance/')) return route.fulfill({ status: 503, json: { error: { code: 'service_unavailable' } } });
      if (path.includes('/sharing/invitations/')) return route.fulfill({ status: 404, json: { error: { code: 'not_found' } } });
      state.unexpected.push(path); return route.fulfill({ status: 404, json: { error: { code: 'not_found' } } });
    }
    if (url.hostname.startsWith('app.')) {
      // Preserve the real, separate App origin while serving only this branch's
      // local compiled fixture. No network request reaches an external account.
      const response = await route.fetch({ url: APP + url.pathname + url.search });
      return route.fulfill({ response });
    }
    return route.continue();
  });
  return state;
}
