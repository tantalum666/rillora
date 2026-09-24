import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = await readFile(new URL('../worker/public-router.js', import.meta.url), 'utf8');
const handler = runInNewContext(`${source}; handler`);
const request = (uri, method = 'GET') => handler({ request: { uri, method } });

test('public routing serves only public pages and fixed asset paths', () => {
  for (const path of ['/', '/guides', '/guides/', '/support']) assert.equal(request(path).uri, '/index.html');
  assert.equal(request('/assets/logo-123.svg').uri, '/assets/logo-123.svg');
  for (const path of ['/api/auth/start', '/account', '/accept/secret', '/.env', '/public-build.json', '/assets/../index.html', '/unknown']) {
    assert.equal(request(path).statusCode, 404);
    assert.equal(request(path).headers['cache-control'].value, 'no-store');
  }
});
test('public routing rejects writes without an API or account fallback', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    assert.equal(request('/', method).statusCode, 405);
    assert.equal(request('/assets/logo-123.svg', method).statusCode, 405);
  }
});
