import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
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

const url = dedicatedTestDatabaseUrl('postgresql:///rillora_recent_auth_test', 'rillora_recent_auth_test');
const config=loadConfig({NODE_ENV:'test',DATABASE_URL:url,REQUIRE_RECENT_AUTHENTICATION:'true',
  CORS_ORIGINS:'http://localhost:4173',WEB_APP_ORIGIN:'http://localhost:4173',
  OIDC_ISSUER_URL:'https://identity.example',OIDC_CLIENT_ID:'fixture-web',
  OIDC_CLIENT_SECRET:'synthetic-test-credential-only',OIDC_REDIRECT_URI:'http://localhost:4173/auth/callback',
  NATIVE_OIDC_CLIENT_ID:'fixture-native',OIDC_API_AUDIENCE:'urn:fixture:recent-auth'});
const acceptance={...currentLegalContract,acceptedTerms:true,acknowledgedPrivacy:true,acceptedElectronicRecords:true} as const;
let pool:DatabasePool;
function fixture(authenticatedAt:Date|null=null, webOrigin?:string) {
  const owner:ExternalIdentity={issuer:'https://identity.example',subject:`auth0|${randomUUID()}`,displayName:'Synthetic planner',locale:'en',authenticatedAt,authenticationMethods:['pwd'],legalAcceptance:acceptance};
  let who=owner;let intent:AuthorizationIntent|undefined;
  const applicationConfig=webOrigin ? {...config,oidc:{...config.oidc!,webAppOrigin:webOrigin,redirectUri:`${webOrigin}/auth/callback`}} : config;
  const app=createApp(pool,applicationConfig,{
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
  const cookies=(result.headers['set-cookie'] as unknown as string[]).filter(value=>! /^(?:__Host-)?continuity_auth_tx=/.test(value));
  const csrf=cookies.find(value=> /^(?:__Host-)?continuity_csrf=/.test(value))!.split(';')[0]!.split('=')[1]!;
  const session = await request(f.app).get('/v1/session').set('Cookie', cookies).expect(200);
  return {cookies, csrf, planner: session.body.plannerPublicId,transactionCookies:start.headers['set-cookie'] as unknown as string[]};
}
describe.sequential('Recent identity authentication without replaying the sensitive action',()=>{
  beforeAll(async()=>{await assertDedicatedTestDatabase(url, 'rillora_recent_auth_test');
    await runMigrations(url);pool=createPool(config);});
  afterAll(async()=>{await pool?.end();});
  it.each([
    ['http://localhost:4173', false], ['https://acceptance.example.test', true], ['https://localhost:4173', true],
  ] as const)('keeps the %s cookie policy through sign-in, reauthentication and both logout paths', async (origin, secure) => {
    const f=fixture(new Date(),origin),session=await web(f);
    const hasSecure=(value:string)=>/;\s*Secure(?:;|$)/.test(value);
    for (const cookie of [...session.transactionCookies,...session.cookies]) {
      expect(hasSecure(cookie)).toBe(secure);
      expect(cookie.startsWith('__Host-')).toBe(secure);
    }
    const headers={'x-csrf-token':session.csrf,'x-rillora-planner':session.planner};
    const renewed=await request(f.app).post('/auth/reauthenticate').set('Cookie',session.cookies).set(headers).send({}).expect(201);
    expect((renewed.headers['set-cookie'] as unknown as string[]).every(value=>hasSecure(value)===secure)).toBe(true);
    const logout=await request(f.app).post('/v1/auth/logout').set('Cookie',session.cookies).set(headers).send({}).expect(204);
    expect((logout.headers['set-cookie'] as unknown as string[]).every(value=>hasSecure(value)===secure)).toBe(true);
    await request(f.app).get('/v1/session').set('Cookie',session.cookies).expect(401);
    const next=await web(f);
    const logoutAll=await request(f.app).post('/v1/auth/logout-all').set('Cookie',next.cookies)
      .set({'x-csrf-token':next.csrf,'x-rillora-planner':next.planner}).send({}).expect(200);
    expect((logoutAll.headers['set-cookie'] as unknown as string[]).every(value=>hasSecure(value)===secure)).toBe(true);
    await request(f.app).get('/v1/session').set('Cookie',next.cookies).expect(401);
  });
  it('never substitutes token issue time and rejects invalid/future auth_time',()=>{
    expect(verifiedAuthenticationTime(undefined)).toBeNull();
    for (const value of [NaN,Infinity,-1,0,123.5,Date.now(),String(Date.now())]) expect(verifiedAuthenticationTime(value)).toBeNull();
    expect(verifiedAuthenticationTime(Math.floor(Date.now()/1000))).toBeInstanceOf(Date);
  });
  it('holds sensitive endpoints for missing/stale proof while ordinary records and logout remain available',async()=>{
    for(const time of [null,new Date(Date.now()-11*60_000)]) {
      const f=fixture(time),token=await native(f),headers={Authorization:`Bearer ${token}`};
      await request(f.app).get('/v1/overview').set(headers).expect(200);
      for(const path of ['/account/map/export','/account/map/import','/account/delete','/exports/start-here/printable','/exports/start-here/encrypted/prepare',`/exports/start-here/encrypted/${randomUUID()}/finalize`,'/sharing/connections','/sharing/invitations/accept']) {
        const response=await request(f.app).post(`/v1${path}`).set(headers).send({}).expect(403);
        expect(response.body.error.code).toBe('reauthentication_required');
      }
      await request(f.app).post('/v1/auth/logout').set(headers).send({}).expect(204);
    }
  });
  it('guards the actual handlers under both prefixes, case variants and trailing slashes', async () => {
    const paths = ['/account/map/export', '/account/map/import', '/account/delete',
      '/exports/start-here/printable', '/exports/start-here/encrypted/prepare', `/exports/start-here/encrypted/${randomUUID()}/finalize`, '/sharing/connections', '/sharing/invitations/accept',
      `/sharing/connections/${randomUUID()}/link`, `/sharing/connections/${randomUUID()}/live`];
    for (const time of [null, new Date(Date.now() - 11 * 60_000), new Date()]) {
      const f = fixture(time), token = await native(f);
      for (const prefix of ['/v1', '/api/v1']) for (const path of paths) {
        for (const variant of [path, `${path}/`, path.toUpperCase(), `${path.toUpperCase()}/`]) {
          const response = await request(f.app).post(`${prefix}${variant}`)
            .set('Authorization', `Bearer ${token}`).send({});
          if (!time || Date.now() - time.getTime() > 10 * 60_000) {
            expect([response.status, response.body.error?.code], `${prefix}${variant}`)
              .toEqual([403, 'reauthentication_required']);
          } else {
            expect(response.status).not.toBe(500);
            expect(response.body.error?.code).not.toBe('reauthentication_required');
          }
        }
      }
    }
  });
  it('rejects old-tab reads and all new-record writes after another tab changes the cookie account', async () => {
    const a = await web(fixture(new Date())), b = await web(fixture(new Date()));
    const headers = { 'x-csrf-token': b.csrf, 'x-rillora-planner': a.planner };
    for (const path of ['/matters', '/trusted-contacts', '/account/map/import']) {
      const response = await request(fixture().app).post(`/v1${path}`).set('Cookie', b.cookies).set(headers)
        .send({}).expect(409);
      expect(response.body.error.code).toBe('account_changed');
    }
    await request(fixture().app).get('/v1/overview').set('Cookie', b.cookies).set(headers).expect(409);
    const missing = await request(fixture().app).post('/v1/trusted-contacts').set('Cookie', b.cookies)
      .set('x-csrf-token', b.csrf).send({ displayName: 'Unbound draft' }).expect(409);
    expect(missing.body.error.code).toBe('workspace_identity_required');
    for (const owner of [a, b]) {
      const overview = await request(fixture().app).get('/v1/overview').set('Cookie', owner.cookies)
        .set('x-rillora-planner', owner.planner).expect(200);
      expect(overview.body.matters).toHaveLength(0);
      expect(overview.body.trustedContacts).toHaveLength(0);
    }
    await request(fixture().app).post('/v1/trusted-contacts').set('Cookie', b.cookies)
      .set({ ...headers, 'x-rillora-planner': b.planner }).send({ displayName: 'B own contact' }).expect(201);
  });
  it('returns one contact for multiple scopes and a recreated plan-wide role, including personal exports', async () => {
    const f = fixture(new Date()), token = await native(f), headers = { Authorization: `Bearer ${token}` };
    const person = (await request(f.app).post('/v1/trusted-contacts').set(headers).send({ displayName: 'Unique recipient' }).expect(201)).body.trustedContact;
    const matter = (await request(f.app).post('/v1/matters').set(headers).send({ category: 'document', title: 'Archive', institutionName: 'Example archive', locationHint: 'Blue folder', desiredOutcome: 'notify' }).expect(201)).body.matter;
    const role = { personPublicId: person.publicId, role: 'trusted_contact', acknowledgesRecordOnly: true, acknowledgesNoAuthority: true };
    await request(f.app).post('/v1/role-assignments').set(headers).send({ ...role, scope: 'matter_specific', matterPublicId: matter.publicId }).expect(201);
    const roles = (await request(f.app).get('/v1/role-assignments').set(headers).expect(200)).body.roleAssignments;
    const main = roles.find((item: { scope: string }) => item.scope === 'plan_wide');
    await request(f.app).delete(`/v1/role-assignments/${main.publicId}`).set(headers).set('if-match', String(main.version)).expect(200);
    await request(f.app).post('/v1/role-assignments').set(headers).send({ ...role, scope: 'plan_wide', matterPublicId: null }).expect(201);
    for (const path of ['/v1/overview', '/v1/trusted-contacts']) {
      const response = await request(f.app).get(path).set(headers).expect(200);
      expect(response.body.trustedContacts).toHaveLength(1);
      expect(response.body.trustedContacts[0].roleStatus).not.toBe('revoked');
    }
    const preview = await request(f.app).post('/v1/exports/start-here/preview').set(headers).send({}).expect(201);
    expect(preview.body.package.trustedContacts).toHaveLength(1);
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
    await request(f.app).post('/v1/account/map/export').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).set('x-rillora-planner',session.planner).send({acknowledgesPrivateCopy:true}).expect(200);
  });
  it('a different browser identity cannot change the original session or provision a new planner',async()=>{
    const f=fixture(),session=await web(f);
    const start=await request(f.app).post('/auth/reauthenticate').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).send({}).expect(201);
    const stranger=`auth0|wrong-${randomUUID()}`;
    f.setIdentity({...f.owner,subject:stranger,authenticatedAt:new Date()});
    const state=new URL(start.body.authorizationUrl).searchParams.get('state');
    await request(f.app).get(`/auth/callback?state=${state}&code=synthetic`).set('Cookie',[...session.cookies,...start.headers['set-cookie']!]).expect(403);
    expect((await pool.query('select count(*)::int as n from app.identity_accounts where subject=$1',[stranger])).rows[0].n).toBe(0);
    await request(f.app).post('/v1/account/map/export').set('Cookie',session.cookies).set('x-csrf-token',session.csrf).set('x-rillora-planner',session.planner).send({acknowledgesPrivateCopy:true}).expect(403);
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
