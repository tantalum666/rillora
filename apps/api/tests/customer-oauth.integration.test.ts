import pg from 'pg';
import {createServer} from 'node:http';
import {createHash,randomBytes} from 'node:crypto';
import {generateKeyPair,exportJWK,decodeJwt,createLocalJWKSet,jwtVerify} from 'jose';
import supertest from 'supertest';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {assertDedicatedTestDatabase,dedicatedTestDatabaseUrl} from './dedicated-test-database.js';
import {runMigrations} from '../src/migrate.js';
import {bootstrapRuntimeRole} from '../src/bootstrap-runtime.js';
import {createPool} from '../src/db.js';
import {loadConfig} from '../src/config.js';
import {currentLegalContract} from '../src/legal-contract.js';
import {createApp} from '../src/app.js';
import {AI_CONSENT_VERSION,AI_IDENTITY_DISCLOSURE_VERSION,MCP_SCOPES,type McpConfig} from '../src/mcp/config.js';
import {customerClients} from '../src/mcp/customer-clients.js';
import {CustomerOAuth} from '../src/mcp/customer-oauth.js';
import {McpIntegration} from '../src/mcp/integration.js';
import {oauthStoreFixture} from './oauth-store-fixture.js';

const url=dedicatedTestDatabaseUrl('postgresql:///rillora_customer_mcp_test','rillora_customer_mcp_test');
const role='continuity_runtime_customer_mcp_test';
const hash=(value:string)=>createHash('sha256').update(value).digest();
let admin:pg.Client,pool:pg.Pool,app:ReturnType<typeof createApp>,broker:CustomerOAuth,config:McpConfig;
let owner:{id:string;public_id:string},selected:{publicId:string;version:number},hidden:typeof selected;
let session:string,csrf:string,base:string;
const server=createServer((req,res)=>{
  // The browser still uses the public /api path for Cookie matching; only the
  // edge-to-origin request loses that prefix and receives the backend Host.
  if(req.url?.startsWith('/api/ai/oauth/')) {
    req.url=req.url.slice(4);req.headers.host='origin.production.rillora.xyz';
  }
  return app?app(req,res):res.writeHead(503).end();
});
const prompts:unknown[]=[];
let rows:ReturnType<typeof oauthStoreFixture>['rows'];
let jwks:{keys:Record<string,unknown>[]};
const cookie=()=>`continuity_session=${session}`;

async function start(clientKey='codex',patch:Record<string,string>={}) {
  const client=customerClients.find(c=>c.key===clientKey)!;
  const redirectUri=clientKey==='codex'?'http://127.0.0.1:48901/callback':client.redirectUris[0]!;
  const verifier=randomBytes(32).toString('base64url');
  const scope=[...MCP_SCOPES,...(client.identityScopes?['openid','email']:[])].join(' ');
  const query={client_id:client.clientId,response_type:'code',redirect_uri:redirectUri,scope,
    resource:config.resourceUrl,state:randomBytes(18).toString('base64url'),...(client.identityScopes?{nonce:randomBytes(18).toString('base64url')}:{}),
    code_challenge:hash(verifier).toString('base64url'),code_challenge_method:'S256',...patch};
  const agent=supertest.agent(base);
  const response=await agent.get('/api/ai/oauth/auth').query(query);
  return {agent,response,query,verifier,client,redirectUri};
}
async function connect(clientKey='codex') {
  const flow=await start(clientKey);
  expect(flow.response.status,JSON.stringify(prompts)).toBe(303);
  expect(flow.response.headers.location).toBe(base+'/account?next=ai-connect');
  const pending=(await flow.agent.get('/v1/account/ai-connections/oauth').set('cookie',cookie()).expect(200)).body.pending;
  expect(pending.clientKey).toBe(clientKey);
  const selection={clientKey,matters:[{publicId:selected.publicId,expectedVersion:selected.version}],scopes:MCP_SCOPES,consentVersion:AI_CONSENT_VERSION,acknowledgedDisclosure:true,
    ...(flow.client.identityScopes?{identityDisclosure:{version:AI_IDENTITY_DISCLOSURE_VERSION,acknowledged:true}}:{})};
  const accepted=await flow.agent.post('/v1/account/ai-connections/oauth/complete').set('cookie',cookie())
    .set('x-csrf-token',csrf).set('x-rillora-planner',owner.public_id).send({selection,interactionUid:pending.uid}).expect(200);
  expect(accepted.body.redirectTo).toMatch(new RegExp('^'+base.replaceAll('.','\\.')+'/api/ai/oauth/'));
  const resumed=await flow.agent.get(accepted.body.redirectTo.replace(base,'')).expect(303);
  const callback=new URL(resumed.headers.location!);
  expect(callback.searchParams.get('state'),JSON.stringify(prompts)).toBe(flow.query.state);
  expect(callback.searchParams.get('iss')).toBe(broker.issuer);
  expect(callback.searchParams.get('code')).toBeTruthy();
  const code=callback.searchParams.get('code')!;
  const result=await supertest(base).post('/api/ai/oauth/token').type('form').send({grant_type:'authorization_code',
    client_id:flow.client.clientId,redirect_uri:flow.redirectUri,code,code_verifier:flow.verifier,resource:config.resourceUrl}).expect(200);
  const connection=(await supertest(base).get('/v1/account/ai-connections').set('cookie',cookie()).expect(200)).body.connections[0];
  return {...flow,...result.body,code,connection};
}

describe.sequential('customer OAuth on the real protocol implementation and signed local PostgreSQL',()=>{
  beforeAll(async()=>{
    await assertDedicatedTestDatabase(url,'rillora_customer_mcp_test');await runMigrations(url);
    admin=new pg.Client({connectionString:url});await admin.connect();
    const password=randomBytes(32).toString('hex'),authority=randomBytes(48).toString('base64url');
    await bootstrapRuntimeRole(admin,role,password,true,authority);
    const runtime=new URL(url);runtime.username=role;runtime.password=password;
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const address=server.address();if(!address||typeof address==='string')throw new Error('Missing fixture listener');
    base=`http://127.0.0.1:${address.port}`;
    const appConfig=loadConfig({NODE_ENV:'test',DATABASE_URL:runtime.toString(),DATABASE_AUTHORITY_KEY:authority,ALLOW_DEV_AUTH:'true',
      OIDC_ISSUER_URL:'https://identity.example.test',OIDC_CLIENT_ID:'synthetic-browser-client',OIDC_CLIENT_SECRET:randomBytes(32).toString('hex'),
      OIDC_REDIRECT_URI:base+'/api/auth/callback',WEB_APP_ORIGIN:base,CORS_ORIGINS:base,REQUIRE_RECENT_AUTHENTICATION:'true'});
    pool=createPool(appConfig);
    const pair=await generateKeyPair('RS256',{extractable:true});jwks={keys:[{...await exportJWK(pair.privateKey),kid:'fixture-rsa',alg:'RS256',use:'sig'}]};
    config={resourceUrl:base+'/api/mcp',issuer:'https://identity.example.test/',clients:customerClients.map(c=>({key:c.key,name:c.name,
      clientId:c.clientId,privacyUrl:c.privacyUrl,verifiedEmailDisclosure:c.identityScopes}))};
    const fixture=oauthStoreFixture();rows=fixture.rows;
    broker=new CustomerOAuth(pool,appConfig,config,fixture.store,{version:1,storageKey:randomBytes(32).toString('hex'),
      cookieKeys:[randomBytes(32).toString('hex')],jwks},{verifiedEmail:async identity=>identity.subject==='synthetic-customer-owner'?'reviewer@example.test':null});
    broker.provider.on('authorization.error',(_ctx,error)=>prompts.push({oauthError:error.error,errorDescription:error.error_description}));
    broker.provider.on('interaction.started',(_ctx,prompt)=>prompts.push(prompt));
    app=createApp(pool,appConfig,{mcp:new McpIntegration(pool,appConfig,config,broker.verifier,broker)});
  });
  beforeEach(async()=>{
    prompts.length=0;rows.clear();await admin.query('update app.recovery_policy set enforced=false');await admin.query('truncate app.planners restart identity cascade');
    owner=(await admin.query("insert into app.planners(display_name) values('Synthetic customer') returning id::text,public_id")).rows[0];
    await admin.query('insert into app.plans(planner_id) values($1)',[owner.id]);
    const identity=(await admin.query('insert into app.identity_accounts(planner_id,issuer,subject) values($1,$2,$3) returning id',
      [owner.id,'https://identity.example.test','synthetic-customer-owner'])).rows[0];
    const acceptance=(await admin.query(`insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,
      legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
      values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id`,[owner.id,identity.id,currentLegalContract.termsVersion,
      currentLegalContract.privacyVersion,currentLegalContract.consentTextVersion,Buffer.from(currentLegalContract.bundleSha256,'hex'),hash('synthetic-customer')])).rows[0];
    session=randomBytes(32).toString('base64url');csrf=randomBytes(32).toString('base64url');
    await admin.query(`insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at,authenticated_at)
      values($1,$2,$3,$4,$5,now()+interval '1 hour',now())`,[owner.id,identity.id,acceptance.id,hash(session),hash(csrf)]);
    const matter=async(title:string)=>(await supertest(base).post('/v1/matters').set('x-dev-planner-id',owner.public_id).send({
      category:'account',title,institutionName:'Synthetic provider',notes:'Excluded synthetic secret note',details:{}}).expect(201)).body.matter;
    const a=await matter('Allowed synthetic record'),b=await matter('Hidden synthetic record');
    selected={publicId:a.publicId,version:a.version};hidden={publicId:b.publicId,version:b.version};
  });
  afterAll(async()=>{
    await new Promise<void>(resolve=>server.close(()=>resolve()));await pool?.end();
    if(admin){await admin.query('truncate app.planners restart identity cascade');await admin.query(`drop role if exists ${role}`);await admin.end();}
  });
  it('advertises exact issuer, code/PKCE, UserInfo and no dynamic registration',async()=>{
    const discovery=await supertest(base).get('/api/ai/oauth/.well-known/openid-configuration').expect(200);
    expect(discovery.body.issuer).toBe(broker.issuer);expect(discovery.body.authorization_response_iss_parameter_supported).toBe(true);
    expect(discovery.body.code_challenge_methods_supported).toEqual(['S256']);expect(discovery.body.registration_endpoint).toBeUndefined();
    expect(discovery.body.userinfo_endpoint).toBe(broker.issuer+'/userinfo');
    for(const prefix of ['/api/ai/oauth','/ai/oauth']) {
      const proxied=await supertest(base).get(prefix+'/.well-known/openid-configuration')
        .set('host','origin.production.rillora.xyz').set('x-forwarded-host','untrusted.example.test').set('x-forwarded-proto','https').expect(200);
      for(const [key,path] of Object.entries({authorization_endpoint:'/auth',token_endpoint:'/token',jwks_uri:'/jwks',userinfo_endpoint:'/userinfo'}))
        expect(proxied.body[key]).toBe(broker.issuer+path);
    }
  });
  it('rejects foreign redirect, missing PKCE and wrong resource before granting',async()=>{
    for(const patch of [{redirect_uri:'https://attacker.example/callback'},{resource:'https://attacker.example/mcp'},{code_challenge:''}]) {
      const flow=await start('codex',patch);expect(flow.response.status).toBeGreaterThanOrEqual(300);
      expect(flow.response.headers.location??'').not.toContain('/account?next=ai-connect');
    }
    expect((await admin.query('select count(*)::int as n from app.ai_connections')).rows[0].n).toBe(0);
  });
  it('completes same-second bound authorization without exposing the other matter or notes',async()=>{
    const flow=await connect();const auth=await broker.verifier.verifyAccessToken(flow.access_token);
    expect(auth.scopes).toContain(MCP_SCOPES[0]);
    const client=new Client({name:'synthetic-customer',version:'1.0.0'},{versionNegotiation:{mode:'legacy'}});
    await client.connect(new StreamableHTTPClientTransport(new URL(config.resourceUrl),{requestInit:{headers:{authorization:`Bearer ${flow.access_token}`}}}));
    const result=await client.callTool({name:'list_selected_matters',arguments:{}});
    expect(JSON.stringify(result)).toContain(selected.publicId);expect(JSON.stringify(result)).not.toContain(hidden.publicId);
    expect(JSON.stringify(result)).not.toContain('Excluded synthetic secret note');await client.close();
    await expect(broker.verifier.verifyAccessToken(session)).rejects.toThrow();
  });
  it('provides verified email only with a separately stored disclosure and matching OIDC subject',async()=>{
    const flow=await connect('openai');
    const info=await supertest(base).get('/api/ai/oauth/userinfo').set('authorization',`Bearer ${flow.access_token}`).expect(200);
    expect(info.body).toEqual({sub:owner.public_id,email:'reviewer@example.test',email_verified:true});
    expect(decodeJwt(flow.id_token).sub).toBe(info.body.sub);
    const keys=(await supertest(base).get('/api/ai/oauth/jwks').expect(200)).body;
    expect(keys.keys.every((key:Record<string,unknown>)=>!key.d&&!key.p&&!key.q)).toBe(true);
    const verified=await jwtVerify(flow.id_token,createLocalJWKSet(keys),{
      issuer:broker.issuer,audience:flow.client.clientId,algorithms:['RS256'],
    });
    expect(verified.payload.sub).toBe(info.body.sub);expect(verified.payload.nonce).toBe(flow.query.nonce);
    expect((await admin.query('select consent_version from app.ai_identity_disclosures')).rows).toEqual([{consent_version:AI_IDENTITY_DISCLOSURE_VERSION}]);
  });
  it('requires the exact interaction, CSRF and optional email disclosure without creating a grant',async()=>{
    const flow=await start('openai');
    const pending=(await flow.agent.get('/v1/account/ai-connections/oauth').set('cookie',cookie()).expect(200)).body.pending;
    const selection={clientKey:'openai',matters:[{publicId:selected.publicId,expectedVersion:selected.version}],scopes:MCP_SCOPES,
      consentVersion:AI_CONSENT_VERSION,acknowledgedDisclosure:true};
    await flow.agent.post('/v1/account/ai-connections/oauth/complete').set('cookie',cookie()).set('x-rillora-planner',owner.public_id)
      .send({selection,interactionUid:pending.uid}).expect(403);
    for (const input of [{selection,interactionUid:pending.uid},
      {selection:{...selection,identityDisclosure:{version:AI_IDENTITY_DISCLOSURE_VERSION,acknowledged:true}},interactionUid:randomBytes(24).toString('hex')}]) {
      await flow.agent.post('/v1/account/ai-connections/oauth/complete').set('cookie',cookie()).set('x-csrf-token',csrf)
        .set('x-rillora-planner',owner.public_id).send(input).expect(403);
    }
    expect((await admin.query('select count(*)::int as n from app.ai_connections')).rows[0].n).toBe(0);
  });
  it('rejects authorization-code replay and withholds UserInfo from a matter-only token',async()=>{
    const flow=await connect();
    const replay=await supertest(base).post('/api/ai/oauth/token').type('form').send({grant_type:'authorization_code',
      client_id:flow.client.clientId,redirect_uri:flow.redirectUri,code:flow.code,code_verifier:flow.verifier,resource:config.resourceUrl});
    expect(replay.status).toBe(400);expect(replay.body.error).toBe('invalid_grant');
    await supertest(base).get('/api/ai/oauth/userinfo').expect(401);
    const second=await connect('claude-code');
    await supertest(base).get('/api/ai/oauth/userinfo').set('authorization',`Bearer ${second.access_token}`).expect(403);
  });
  it('rotates refresh tokens and blocks both reads and refreshing after account-side revocation',async()=>{
    const flow=await connect();
    const refreshed=await supertest(base).post('/api/ai/oauth/token').type('form').send({grant_type:'refresh_token',
      client_id:flow.client.clientId,refresh_token:flow.refresh_token,resource:config.resourceUrl}).expect(200);
    expect(refreshed.body.refresh_token).not.toBe(flow.refresh_token);
    await supertest(base).delete('/v1/account/ai-connections/'+flow.connection.publicId).set('cookie',cookie())
      .set('x-csrf-token',csrf).set('x-rillora-planner',owner.public_id).send({expectedVersion:flow.connection.version}).expect(200);
    for(const value of [flow.access_token,refreshed.body.access_token]) await expect(broker.verifier.verifyAccessToken(value)).rejects.toThrow();
    const denied=await supertest(base).post('/api/ai/oauth/token').type('form').send({grant_type:'refresh_token',client_id:flow.client.clientId,
      refresh_token:refreshed.body.refresh_token,resource:config.resourceUrl});
    expect(denied.status).toBe(400);expect(denied.body.error).toBe('invalid_grant');
  });
});
