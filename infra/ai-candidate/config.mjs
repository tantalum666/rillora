export const ORIGIN = 'https://rillora-ai-candidate.rillora-candidate.workers.dev';
export const RESOURCE = ORIGIN + '/mcp';
export const ISSUER = 'https://rillora-dev.eu.auth0.com';
export const SCOPES = ['matters:read:summary', 'readiness:read:scoped'];
export const PLATFORMS = Object.freeze({
  claude: { name: 'Claude', privacyUrl: 'https://www.anthropic.com/legal/privacy',
    redirectUris: ['https://claude.ai/api/mcp/auth_callback'] },
  'claude-code': { name: 'Claude Code', privacyUrl: 'https://www.anthropic.com/legal/privacy',
    redirectUris: ['http://localhost/callback'] },
  cursor: { name: 'Cursor', privacyUrl: 'https://cursor.com/privacy',
    redirectUris: ['https://www.cursor.com/agents/mcp/oauth/callback', 'http://localhost:8787/callback'] },
  'qwen-code': { name: 'Qwen Code', privacyUrl: 'https://qwen.ai/privacypolicy',
    redirectUris: ['http://localhost:7777/oauth/callback'] },
  inspector: { name: 'Rillora synthetic protocol acceptance', privacyUrl: 'https://legal.rillora.xyz/privacy',
    redirectUris: ['http://127.0.0.1/callback'] },
});

export function assertEnvironment(env) {
  if (env.HOSTING_MODE !== 'synthetic-only' || !/^auth0\|[A-Za-z0-9]+$/.test(env.SYNTHETIC_SUBJECT ?? '')
    || !/^[A-Za-z0-9_-]{16,128}$/.test(env.AUTH0_CLIENT_ID ?? '')
    || !env.AUTH0_CLIENT_SECRET || !/^[a-f0-9]{64}$/.test(env.SESSION_KEY ?? '')
    || !/^[a-f0-9]{64}$/.test(env.CONTENT_WRAPPING_KEY ?? '')
    || !/^[a-f0-9]{96}$/.test(env.DATABASE_AUTHORITY_KEY ?? '')
    || !/^[a-f0-9]{64}$/.test(env.OPERATOR_SECRET ?? '')
    || !env.DATABASE?.connectionString || !env.OAUTH_KV) throw new Error('Candidate configuration unavailable');
}

export function checkRequest(request) {
  const url = new URL(request.url);
  if (url.origin !== ORIGIN || url.username || url.password) return false;
  const origin = request.headers.get('origin');
  if (origin && origin !== ORIGIN) return false;
  return !['POST', 'DELETE', 'PUT', 'PATCH'].includes(request.method)
    || !request.headers.get('sec-fetch-site') || request.headers.get('sec-fetch-site') !== 'cross-site';
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}
