import { createHash, timingSafeEqual } from 'node:crypto';
import { probeDatabase } from './database-probe.js';

function authorized(request: Request, env: Env): boolean {
  const until = Date.parse(env.VALIDATION_EXPIRES_AT);
  if (env.VALIDATION_MODE !== 'synthetic-only' || !Number.isFinite(until)
    || until <= Date.now() || until > Date.now() + 24 * 3600_000
    || typeof env.PROBE_SECRET !== 'string' || env.PROBE_SECRET.length < 48) return false;
  const input = request.headers.get('authorization') ?? '';
  if (input.length > 512) return false;
  return timingSafeEqual(createHash('sha256').update(input).digest(),
    createHash('sha256').update('Bearer ' + env.PROBE_SECRET).digest());
}

export default {
  async fetch(request, env, ctx) {
    if (!authorized(request, env)) return new Response('Unavailable', { status: 404,
      headers: { 'cache-control': 'no-store' } });
    const path = new URL(request.url).pathname;
    if (request.method !== 'GET' || !['/probe/http', '/probe/database', '/probe/crypto', '/probe/file-limit'].includes(path)) {
      return new Response('Unavailable', { status: 404 });
    }
    try {
      // Some existing Node dependencies initialize random values on import.
      // Workerd requires that initialization to occur in a request context.
      const result = path === '/probe/http' ? await (await import('./http-probe.js')).probeHttp(env, ctx)
        : path === '/probe/database' ? await probeDatabase(env)
        : await (await import('./crypto-probe.js')).probeCrypto(path === '/probe/file-limit');
      return Response.json(result, { headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
    } catch (error) {
      // Classification only; never SQL, headers, credentials or provider bodies.
      const locations = error instanceof Error ? (error.stack ?? '').split('\n').slice(1, 7)
        .map(line => /worker\.js:(\d+):(\d+)/.exec(line))
        .filter(match => match !== null).map(match => ({ line: Number(match[1]), column: Number(match[2]) })) : [];
      console.error(JSON.stringify({ event: 'hosting_probe_failed',
        kind: error instanceof Error ? error.name : 'unknown', locations }));
      return Response.json({ passed: false, code: 'probe_failed' }, { status: 503,
        headers: { 'cache-control': 'no-store' } });
    }
  },
} satisfies ExportedHandler<Env>;
