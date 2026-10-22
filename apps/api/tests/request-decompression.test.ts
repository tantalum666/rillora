import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { request } from 'node:http';
import type { Server } from 'node:http';
import { once } from 'node:events';
import { brotliCompressSync, deflateSync, gzipSync } from 'node:zlib';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import type { DatabasePool } from '../src/db.js';

// Benign transport controls, not a native-decoder exploit or production probe.
// Keep the pre-authentication parser's existing contract on the patched runtime.
describe('request decompression preserves the API boundary', () => {
  const query = vi.fn(() => { throw new Error('Unauthenticated controls must not query the database'); });
  let server: Server;
  let port: number;
  beforeAll(async () => {
    const app = createApp({ query } as unknown as DatabasePool, loadConfig({
      NODE_ENV: 'test', DATABASE_URL: 'postgresql:///continuity_test',
    }));
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    port = (server.address() as { port: number }).port;
  });
  afterAll(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  function send(path: string, body: Buffer, contentType: string, encoding?: string) {
    return new Promise<{ status: number; body: { error: { code: string } } }>((resolve, reject) => {
      const outgoing = request({ hostname: '127.0.0.1', port, path, method: 'POST', agent: false,
        headers: { 'content-type': contentType, 'content-length': body.length,
          ...(encoding ? { 'content-encoding': encoding } : {}) },
      }, response => {
        let text = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { text += chunk; });
        response.on('error', reject);
        response.on('end', () => {
          try { resolve({ status: response.statusCode!, body: JSON.parse(text) }); }
          catch (error) { reject(error); }
        });
      });
      outgoing.on('error', reject);
      outgoing.end(body);
    });
  }

  for (const path of ['/v1/matters', '/api/v1/matters']) {
    for (const type of ['application/json', 'application/vnd.rillora+json']) {
      it(`keeps unauthenticated access rejected for ordinary compressed JSON at ${path} (${type})`, async () => {
        const input = Buffer.from(JSON.stringify({ name: 'synthetic transport control' }));
        const plain = await send(path, input, type);
        expect(plain.status).toBe(401);
        expect(plain.body.error.code).toBe('authentication_required');
        for (const [encoding, compress] of [
          ['br', brotliCompressSync], ['BR', brotliCompressSync],
          ['gzip', gzipSync], ['deflate', deflateSync],
        ] as const) {
          expect(await send(path, compress(input), type, encoding)).toEqual(plain);
        }
        expect(query).not.toHaveBeenCalled();
      });
    }
    it(`keeps invalid decompressed JSON at ${path} a 400 response`, async () => {
      const result = await send(path, brotliCompressSync(Buffer.from('{invalid JSON')), 'application/json', 'br');
      expect(result.status).toBe(400);
      expect(result.body.error.code).toBe('invalid_json');
      expect(query).not.toHaveBeenCalled();
    });
    it(`applies the existing decoded body limit at ${path}`, async () => {
      const input = Buffer.from(JSON.stringify({ note: 'x'.repeat(65 * 1024) }));
      const result = await send(path, brotliCompressSync(input), 'application/json', 'br');
      expect(result.status).toBe(413);
      expect(result.body.error.code).toBe('request_body_too_large');
      expect(query).not.toHaveBeenCalled();
    });
  }
});
