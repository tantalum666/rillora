import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const route = runInNewContext(`${await readFile(new URL('../worker/production-router.js', import.meta.url), 'utf8')}; handler`);
test('API routes retain methods, cookies, auth and query while only the public prefix is removed', () => {
  for (const path of ['/api/v1/overview', '/api/auth/callback', '/api/auth/native/session', '/api/health/ready']) {
    const request = { uri: path, method: 'POST', querystring: { state: { value: 'fixture' } }, headers: { authorization: { value: 'Bearer fixture' } }, cookies: { continuity_session: { value: 'fixture' } } };
    const result = route({ request });
    assert.equal(result, request);
    assert.equal(result.uri, path.slice(4));
    assert.equal(result.method, 'POST');
    assert.equal(result.headers.authorization.value, 'Bearer fixture');
    assert.equal(result.cookies.continuity_session.value, 'fixture');
    assert.equal(result.querystring.state.value, 'fixture');
  }
});
test('no API or unknown request falls back to a cached HTML response', () => {
  for (const path of ['/api', '/api-unsafe/v1', '/.env', '/production-build.json', '/unknown', '/assets/../index.html']) {
    const result = route({ request: { uri: path, method: 'GET' } });
    assert.equal(result.statusCode, 404); assert.equal(result.headers['cache-control'].value, 'no-store');
  }
  assert.equal(route({ request: { uri: '/account', method: 'POST' } }).statusCode, 405);
  assert.equal(route({ request: { uri: '/accept', method: 'GET' } }).uri, '/index.html');
  for (const extension of ['jpg', 'jpeg', 'webp']) {
    const uri = `/assets/folio-fixture.${extension}`;
    assert.equal(route({ request: { uri, method: 'GET' } }).uri, uri);
  }
});

test('real invitations survive initial fragment entry, auth return and reload with GET or HEAD',()=>{
  const id='11111111-1111-4111-8111-111111111111';
  // Fragments never reach CloudFront; /invite is the exact initial HTTP URI.
  for(const uri of ['/invite',`/invite/${id}`,`/invite/${id}/`]) for(const method of ['GET','HEAD']) {
    const request={uri,method,querystring:{from:{value:'shared'}}};
    const result=route({request});
    assert.equal(result.uri,'/index.html');assert.equal(result.method,method);
    assert.equal(result.querystring.from.value,'shared');
  }
  for(const uri of ['/invite/nope',`/invite/${id}/extra`,'/invite/%2e%2e']) {
    assert.equal(route({request:{uri,method:'GET'}}).statusCode,404);
  }
});
