import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from './http-fixture.js';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { createPool, type DatabasePool } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { reviewIdentityDigest } from '../src/production-review-access.js';
import { currentLegalContract } from '../src/legal-contract.js';
import type { ExternalIdentity, IdentityProvider } from '../src/identity.js';

const databaseUrl='postgresql:///rillora_review_access_test';
const base=loadConfig({NODE_ENV:'test',DATABASE_URL:databaseUrl,CORS_ORIGINS:'http://localhost:4173',
 WEB_APP_ORIGIN:'http://localhost:4173',OIDC_ISSUER_URL:'https://identity.example',OIDC_CLIENT_ID:'fixture-web',
 OIDC_CLIENT_SECRET:'synthetic-fixture-credential-only',OIDC_REDIRECT_URI:'http://localhost:4173/auth/callback',
 NATIVE_OIDC_CLIENT_ID:'fixture-native',OIDC_API_AUDIENCE:'urn:fixture:review'});
const acceptance={...currentLegalContract,acceptedTerms:true,acknowledgedPrivacy:true,acceptedElectronicRecords:true};
const identity=(subject:string):ExternalIdentity=>({issuer:'https://identity.example',subject,displayName:'Synthetic review',locale:'en',authenticatedAt:new Date(),authenticationMethods:['pwd']});
let pool:DatabasePool;
const allowed=identity(`auth0|review-${randomUUID()}`),other=identity(`auth0|other-${randomUUID()}`);
const digest=reviewIdentityDigest(allowed.issuer,allowed.subject);
function app(who:ExternalIdentity,hashes=[digest],expiresAt=Date.now()+60_000){
 const identityProvider:IdentityProvider={
  async createAuthorizationUrl(transaction){const url=new URL('https://identity.example/authorize');url.searchParams.set('state',transaction.state);return url;},
  async exchangeAuthorizationCode(){return who;},
 };
 return createApp(pool,{...base,productionReviewAccess:{identityDigests:hashes,expiresAt}},
  {identityProvider,nativeIdentityVerifier:{async verifyAccessToken(){return who;}}});
}
async function native(target:ReturnType<typeof app>){return request(target).post('/auth/native/session').set('Authorization',`Bearer ${'x'.repeat(90)}`).send({legalAcceptance:acceptance});}
async function web(target:ReturnType<typeof app>,expected=303){
 const start=await request(target).post('/auth/start').send({intent:'signin',legalAcceptance:acceptance}).expect(201);
 const state=new URL(start.body.authorizationUrl).searchParams.get('state');
 const result=await request(target).get(`/auth/callback?state=[REDACTED_CAPABILITY]&code=[REDACTED_CAPABILITY]
 return result;
}
describe.sequential('Production review identity restriction',()=>{
 beforeAll(async()=>{await runMigrations(databaseUrl);pool=createPool(base);});
 afterAll(async()=>{await pool?.end();});
 it('rejects both verified native and Web identities before creating a planner, receipt or session',async()=>{
  expect((await native(app(other))).status).toBe(403);
  expect((await web(app(other),403)).body.error.code).toBe('service_not_open');
  expect((await pool.query('select count(*)::int as count from app.identity_accounts where subject=$1',[other.subject])).rows[0].count).toBe(0);
 });
 it('admits the explicit identity, then denies its existing native session after removal or expiry',async()=>{
  const admitted=await native(app(allowed));expect(admitted.status).toBe(201);
  const token=admitted.body.sessionToken;
  await request(app(allowed)).get('/v1/session').set('Authorization',`Bearer ${token}`).expect(200);
  await request(app(allowed,['0'.repeat(64)])).get('/v1/session').set('Authorization',`Bearer ${token}`).expect(401);
  await request(app(allowed,[digest],Date.now()-1)).get('/v1/session').set('Authorization',`Bearer ${token}`).expect(403);
  expect((await native(app(allowed,[digest],Date.now()-1))).status).toBe(403);
 });
 it('uses the same restriction for browser cookies, session status and authentication start',async()=>{
  const result=await web(app(allowed));const cookie=result.headers['set-cookie']!;
  expect((await request(app(allowed)).get('/auth/session-status').set('Cookie',cookie).expect(200)).body.authenticated).toBe(true);
  expect((await request(app(allowed,['0'.repeat(64)])).get('/auth/session-status').set('Cookie',cookie).expect(200)).body.authenticated).toBe(false);
  await request(app(allowed,['0'.repeat(64)])).get('/v1/session').set('Cookie',cookie).expect(401);
  const expired=app(allowed,[digest],Date.now()-1);
  expect((await request(expired).get('/auth/session-status').set('Cookie',cookie).expect(200)).body.authenticated).toBe(false);
  await request(expired).post('/auth/start').send({intent:'signin',legalAcceptance:acceptance}).expect(503);
 });
});
