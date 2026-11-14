import { createServer } from 'node:http';
import { handleAsNodeRequest } from 'cloudflare:node';
import pg from 'pg';
import { createApp } from '../../apps/api/src/app.js';
import { loadConfig } from '../../apps/api/src/config.js';

/** The real application router, without provider credentials or an auth bypass.
 * These checks cover the HTTP runtime, not authenticated customer acceptance.
 */
export async function probeHttp(env: Env, ctx: ExecutionContext) {
  const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: 'postgresql:///continuity_cf_validation',
    CORS_ORIGINS: 'https://validation.rillora.invalid', ALLOW_DEV_AUTH: 'false',
    VALIDATION_MODE: env.VALIDATION_MODE, VALIDATION_EXPIRES_AT: env.VALIDATION_EXPIRES_AT,
    PROBE_SECRET: env.PROBE_SECRET });
  // These negative requests must not reach any database. A deliberately closed
  // loopback port makes an accidental DB dependency visible instead of faking it.
  const pool = new pg.Pool({ host: '127.0.0.1', port: 1, database: 'continuity_cf_validation',
    connectionTimeoutMillis: 1000, max: 1 });
  const server = createServer(createApp(pool, config));
  server.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    await pool.end();
    throw new Error('Node HTTP port was unavailable');
  }
  const cases = [
    { key: 'health', path: '/health/live', expected: 200 },
    { key: 'unauthenticated_matters', path: '/api/v1/matters', expected: 401 },
    { key: 'untrusted_origin', path: '/health/live', expected: 403, origin: 'https://untrusted.invalid' },
    { key: 'unauthenticated_payment', path: '/api/v1/commerce/stripe/checkout', expected: 401 },
    { key: 'unauthenticated_file', path: '/api/v1/legacy-content/assets', expected: 401 },
  ];
  try {
    const results = [];
    for (const item of cases) {
      const request = new Request('https://validation.rillora.invalid' + item.path,
        item.origin ? { headers: { origin: item.origin } } : {});
      const response = await handleAsNodeRequest(address.port, request, env, ctx);
      const content = await response.text();
      if (content.length > 8192) throw new Error('HTTP probe response exceeded its bound');
      results.push({ key: item.key, status: response.status, expected: item.expected,
        noSniff: response.headers.get('x-content-type-options') === 'nosniff',
        noCache: response.headers.get('cache-control')?.includes('no-store') ?? false,
        passed: response.status === item.expected });
    }
    return { evidence: 'real-api-router-in-workerd-without-provider-credentials', results,
      passed: results.every(result => result.passed && result.noSniff) };
  } finally {
    server.close();
    await pool.end();
  }
}
