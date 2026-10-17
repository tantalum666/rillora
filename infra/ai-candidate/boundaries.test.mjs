import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { assertEnvironment, checkRequest, escapeHtml, ORIGIN } from './config.mjs';
import { sealSession, readSession, requireFormCsrf } from './sessions.mjs';

test('candidate cannot be enabled without its synthetic identity and isolated bindings', () => {
  assert.throws(() => assertEnvironment({}));
  assert.throws(() => assertEnvironment({ HOSTING_MODE:'production' }));
  assert.equal(checkRequest(new Request('https://app.rillora.xyz/mcp')), false);
  assert.equal(checkRequest(new Request(ORIGIN+'/select', {method:'POST',headers:{origin:'https://attacker.example'}})), false);
  assert.equal(checkRequest(new Request(ORIGIN+'/select', {method:'POST',headers:{origin:'null'}})), false);
  assert.equal(checkRequest(new Request(ORIGIN+'/mcp',{method:'POST'})), true);
  assert.equal(escapeHtml('<script>"&\''), '&lt;script&gt;&quot;&amp;&#39;');
});

test('browser cookie is encrypted, host-only, short-lived and tied to the synthetic identity', async () => {
  const env={SESSION_KEY:randomBytes(32).toString('hex'),SYNTHETIC_SUBJECT:'auth0|synthetic'};
  const sealed=await sealSession(env,{subject:env.SYNTHETIC_SUBJECT,authenticatedAt:new Date()},{id:'1',public_id:crypto.randomUUID()});
  assert.match(sealed.cookie,/^__Host-.*; Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=1800$/);
  assert.ok(!sealed.cookie.includes('synthetic'));
  const cookie=sealed.cookie.split(';')[0], request=new Request(ORIGIN+'/connections',{headers:{cookie}});
  const session=await readSession(request,env);assert.equal(session.plannerId,'1');
  await assert.rejects(readSession(request,{...env,SYNTHETIC_SUBJECT:'auth0|another'}));
  await assert.rejects(readSession(request,{...env,SESSION_KEY:randomBytes(32).toString('hex')}));
  await assert.rejects(readSession(new Request(ORIGIN,{headers:{cookie:cookie+'; '+cookie}}),env));
  const form=new FormData();form.set('csrf',session.csrf);
  assert.throws(()=>requireFormCsrf(new Request(ORIGIN+'/revoke',{headers:{origin:'https://attacker.example'}}),session,form));
  assert.throws(()=>requireFormCsrf(new Request(ORIGIN+'/revoke',{headers:{origin:ORIGIN}}),session,new FormData()));
  requireFormCsrf(new Request(ORIGIN+'/revoke',{headers:{origin:ORIGIN}}),session,form);
});
