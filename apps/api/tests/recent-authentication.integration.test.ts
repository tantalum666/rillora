import { createHash, randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from './http-fixture.js';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { createPool, type DatabasePool } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { currentLegalContract } from '../src/legal-contract.js';
import { verifiedAuthenticationTime, type ExternalIdentity, type AuthorizationIntent } from '../src/identity.js';
import { expandsSharing } from '../src/recent-authentication.js';

const url='postgresql:///rillora_recent_auth_test';
const config=loadConfig({NODE_ENV:'test',DATABASE_URL:url,REQUIRE_RECENT_AUTHENTICATION:'true',
  CORS_ORIGINS:'http://localhost:4173',WEB_APP_ORIGIN:'http://localhost:4173',
  OIDC_ISSUER_URL:'https://identity.example',OIDC_CLIENT_ID:'fixture-web',
  OIDC_CLIENT_SECRET:'synthetic-test-credential-only',OIDC_REDIRECT_URI:'http://localhost:4173/auth/callback',
  NATIVE_OIDC_CLIENT_ID:'fixture-native',OIDC_API_AUDIENCE:'urn:fixture:recent-auth'});
const acceptance={...currentLegalContract,acceptedTerms:true,acknowledgedPrivacy:true,acceptedElectronicRecords:true};
let pool:DatabasePool;
function fixture(authenticatedAt:Date|null=null) {
  const owner:ExternalIdentity={issuer:'https://identity.example',subject:`auth0|${randomUUID()}`,displayName:'Synthetic planner',locale:'en',authenticatedAt,authenticationMethods:['pwd']};
  let who=owner;let intent:AuthorizationIntent|undefined;
  const app=createApp(pool,config,{
    nativeIdentityVerifier:{async verifyAccessToken(){return who;}},
    identityProvider:{async createAuthorizationUrl(transaction,value){intent=value;return new URL(`https://identity.example/authorize?state=${transaction.state}`);},async exchangeAuthorizationCode(){return who;}},
  });
  return {app,owner,setIdentity(value:ExternalIdentity){who=value;},getIntent:()=>intent};
}
async function native(f:ReturnType<typeof fixture>) {
  return (await request(f.app).post('/auth/native/session').set('Authorization',`Bearer ${'x'.repeat(90)}`).send({legalAcceptance:acceptance}).expect(201)).body.sessionToken as string;
}
async function web(f:ReturnType<typeof fixture>) {
  const start=await request(f.app).post('/auth/start').send({intent:'signin',legalAcceptance:acceptance}).expect(201);
  const state=new URL(start.body.authorizationUrl).searchParams.get('state');
  const result=await request(f.app).get(`/auth/callback?state=${state}&code=synthetic`).set('Cookie',start.headers['set-cookie']!).expect(303);
  const cookies=(result.headers['set-cookie'] as unknown as string[]).filter(value=>!value.startsWith('continuity_auth_tx='));
  const csrf=cookies.find(value=>value.startsWith('continuity_csrf='))!.split(';')[0]!.split('=')[1]!;
  return {cookies,csrf};
}
describe.sequential('Recent identity authentication without replaying the sensitive action',()=>{
  beforeAll(async()=>{await runMigrations(url);pool=createPool(config);});
  afterAll(async()=>{await pool?.end();});
  it('never substitutes token issue time and rejects invalid/future auth_time',()=>{
    expect(verifiedAuthenticationTime(undefined)).toBeNull();
    for (const value of [NaN,Infinity,-1,0,123.5,Date.now(),String(Date.now())]) expect(verifiedAuthenticationTime(value)).toBeNull();
    expect(verifiedAuthenticationTime(Math.floor(Date.now()/1000))).toBeInstanceOf(Date);
  });
  it('holds sensitive endpoints for missing/stale proof while ordinary records and logout remain available',async()=>{
    for(const time of [null,new Date(Date.now()-11*60_000)]) {
      const f=fixture(time),token=await native(f),headers={Authorization:`Bearer ${token}`};
      await request(f.app).get('/v1/overview').set(headers).expect(200);
      for(const path of ['/account/map/export','/account/map/import','/account/delete','/exports/start-here/printable','/exports/start-here/encrypted/prepare','/sharing/connections']) {
        const response=await request(f.app).post(`/v1${path}`).set(headers).send({}).expect(403);
        expect(response.body.error.code).toBe('reauthentication_required');
      }
      await request(f.app).post('/v1/auth/logout').set(headers).send({}).expect(204);
    }
  });
  it('native reauthentication refuses account switching, expired proof and revoked sessions; preserves its original token',async()=>{
    const f=fixture(),token=await native(f),headers={Authorization:`Bearer ${token}`};
    const input={accessToken:'x'.repeat(90),idToken:'y'.repeat(90)};
    f.setIdentity({...f.owner,subject:`auth0|wrong-${randomUUID()}`,authenticatedAt:new Date()});
    await request(f.app).post('/auth/native/reauthenticate').set(headers).send(input).expect(403);
    f.setIdentity({...f.owner,authenticatedAt:new Date(Date.now()-11*60_000)});
    await request(f.app).post('/auth/native/reauthenticate').set(headers).send(input).expect(403);
    f.setIdentity({...f.owner,authenticatedAt:new Date()});
    await request(f.app).post('/auth/native/reauthenticate').set(headers).send(input).expect(200);
    await request(f.app).post('/v1/account/map/export').set(headers).send({acknowledgesPrivateCopy:true}).expect(200);
    await request(f.app).post('/v1/auth/logout').set(headers).send({}).expect(204);
    await request(f.app).post('/auth/native/reauthenticate').set(headers).send(input).expect(401);
  });
  it('browser reauthentication is CSRF-protected, bound to the original account and session, and requires a fresh transaction',async()=>{
    const f=fixture(),session=await web(f);
    await request(f.app).post('/auth/reauthenticate').set('Cookie',session.cookies).send({}).expect(403);
    const start=await request(f.app).post('/auth/reauthenticate').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).send({}).expect(201);
    expect(f.getIntent()).toEqual({prompt:'login',maxAge:0});
    expect(start.body.pollToken).not.toBe((start.headers['set-cookie'] as unknown as string[])[0]!.split('=')[1]!.split(';')[0]);
    const status=()=>request(f.app).post('/auth/reauthentication-status').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).send({pollToken:start.body.pollToken});
    expect((await status().expect(200)).body.completed).toBe(false);
    const state=new URL(start.body.authorizationUrl).searchParams.get('state');
    f.setIdentity({...f.owner,authenticatedAt:new Date()});
    const cookie=[...session.cookies,...start.headers['set-cookie']!];
    await request(f.app).get(`/auth/callback?state=${state}&code=synthetic`).set('Cookie',cookie).expect(200);
    expect((await status().expect(200)).body.completed).toBe(true);
    await request(f.app).get(`/auth/callback?state=${state}&code=synthetic`).set('Cookie',cookie).expect(401);
    await request(f.app).post('/v1/account/map/export').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).send({acknowledgesPrivateCopy:true}).expect(200);
  });
  it('a different browser identity cannot change the original session or provision a new planner',async()=>{
    const f=fixture(),session=await web(f);
    const start=await request(f.app).post('/auth/reauthenticate').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).send({}).expect(201);
    const stranger=`auth0|wrong-${randomUUID()}`;
    f.setIdentity({...f.owner,subject:stranger,authenticatedAt:new Date()});
    const state=new URL(start.body.authorizationUrl).searchParams.get('state');
    await request(f.app).get(`/auth/callback?state=${state}&code=synthetic`).set('Cookie',[...session.cookies,...start.headers['set-cookie']!]).expect(403);
    expect((await pool.query('select count(*)::int as n from app.identity_accounts where subject=$1',[stranger])).rows[0].n).toBe(0);
    await request(f.app).post('/v1/account/map/export').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).send({acknowledgesPrivateCopy:true}).expect(403);
  });
  it('scope comparison permits reductions/removal and catches additional matters or detail',()=>{
    expect(expandsSharing([{matterPublicId:'a',detailLevel:'details'}],[{matterPublicId:'a',detailLevel:'name'}])).toBe(false);
    expect(expandsSharing([{matterPublicId:'a',detailLevel:'details'}],[])).toBe(false);
    expect(expandsSharing([{matterPublicId:'a',detailLevel:'name'}],[{matterPublicId:'a',detailLevel:'directions'}])).toBe(true);
    expect(expandsSharing([],[{matterPublicId:'b',detailLevel:'name'}])).toBe(true);
  });
  it('rolls back a blocked scope expansion while allowing immediate reduction and revocation',async()=>{
    const f=fixture(new Date()),token=await native(f),headers={Authorization:`Bearer ${token}`};
    const matter=(await request(f.app).post('/v1/matters').set(headers).send({category:'financial_asset',title:'Synthetic bank',institutionName:'Example bank',locationHint:'Test folder',desiredOutcome:'notify'}).expect(201)).body.matter.publicId;
    const person=(await request(f.app).post('/v1/trusted-contacts').set(headers).send({displayName:'Synthetic recipient'}).expect(201)).body.trustedContact.publicId;
    const connection=(await request(f.app).post('/v1/sharing/connections').set(headers).send({personPublicId:person,email:'recipient@example.test',grants:[{matterPublicId:matter,detailLevel:'directions'}]}).expect(201)).body.connection;
    await pool.query("update app.auth_sessions set authenticated_at=now()-interval '11 minutes' where token_hash=$1",[createHash('sha256').update(token).digest()]);
    await request(f.app).patch(`/v1/sharing/connections/${connection.publicId}`).set(headers).send({expectedVersion:connection.version,grants:[{matterPublicId:matter,detailLevel:'details'}]}).expect(403);
    const after=(await request(f.app).get('/v1/sharing/connections').set(headers).expect(200)).body.connections[0];
    expect(after.version).toBe(connection.version);expect(after.grants[0].detailLevel).toBe('directions');
    const reduced=(await request(f.app).patch(`/v1/sharing/connections/${connection.publicId}`).set(headers).send({expectedVersion:connection.version,grants:[{matterPublicId:matter,detailLevel:'name'}]}).expect(200)).body.connection;
    await request(f.app).delete(`/v1/sharing/connections/${connection.publicId}`).set(headers).set('if-match',String(reduced.version)).expect(200);
  });
});
