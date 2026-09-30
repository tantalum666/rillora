import {describe,it,expect,vi} from 'vitest';
import request from 'supertest';
import {createApp} from '../src/app.js';
import {loadConfig} from '../src/config.js';
import type {DatabasePool} from '../src/db.js';

const env={DATABASE_URL:'postgresql:///continuity_test',NODE_ENV:'production',PRODUCTION_RUNTIME_MODE:'closed',
 DATABASE_SSL_MODE:'verify-full',DATABASE_SSL_CA_PATH:'/tmp/fixture-ca.pem',CONTENT_PROTECTION_MODE:'encrypted',
 CONTENT_KMS_KEY_ARN:'arn:aws:kms:eu-central-1:111111111111:key/11111111-1111-4111-8111-111111111111',
 CONTENT_KEY_NAMESPACE:'rillora-production',RECOVERY_JOURNAL_TABLE:'production-journal',RECOVERY_ENVIRONMENT:'production',
 API_TLS_CERTIFICATE_ARN:'arn:aws:acm:eu-central-1:111111111111:certificate/11111111-1111-4111-8111-111111111111',
 API_TLS_SERVER_NAME:'origin.production.rillora.xyz'};

describe('Production remains closed before identity and release acceptance',()=>{
 it('requires the real encryption, recovery and transport boundary with no testing modes',()=>{
  expect(loadConfig(env).productionRuntimeClosed).toBe(true);
  for(const [key,value] of Object.entries({CONTENT_PROTECTION_MODE:'off',CONTENT_KEY_NAMESPACE:'rillora-staging',RECOVERY_ENVIRONMENT:'staging',
   API_TLS_SERVER_NAME:'staging.example',API_TLS_CERTIFICATE_ARN:undefined,RECOVERY_JOURNAL_TABLE:undefined,
   ALLOW_STRIPE_TEST_INTEGRATION:'true',ALLOW_APPLE_SANDBOX_INTEGRATION:'true',ALLOW_FAMILY_MAINTENANCE_PREVIEW:'true'})){
   expect(()=>loadConfig({...env,[key]:value})).toThrow();
  }
  expect(()=>loadConfig({...env,PRODUCTION_RUNTIME_MODE:undefined})).toThrow('Production identity');
  expect(()=>loadConfig({...env,PRODUCTION_RUNTIME_MODE:'open'})).toThrow();
 });
 it('rejects every account, invitation, private-data and provider route without querying the database',async()=>{
  const query=vi.fn(),pool={query} as unknown as DatabasePool;
  const app=createApp(pool,{...loadConfig(env),nodeEnv:'test'});
  for(const method of ['get','post','delete'] as const){
   for(const path of ['/auth/login','/api/auth/start','/auth/native/session','/sharing/invites/a','/api/v1/matters',
    '/api/commerce/stripe/webhook','/api/commerce/storekit/sandbox/notifications','/account-deletions','/health/live/extra']){
    const response=await request(app)[method](path).send({});
    expect(response.status).toBe(503);expect(response.body.error.code).toBe('service_not_open');
    expect(response.headers['cache-control']).toContain('no-store');expect(response.headers['set-cookie']).toBeUndefined();
   }
  }
  expect(query).not.toHaveBeenCalled();expect((await request(app).get('/health/live')).status).toBe(200);
 });
 it('keeps readiness false when transport has no valid certificate',async()=>{
  const query=vi.fn(),app=createApp({query} as unknown as DatabasePool,{...loadConfig(env),nodeEnv:'test'},{transportReady:()=>false});
  expect((await request(app).get('/health/ready')).status).toBe(503);expect(query).not.toHaveBeenCalled();
 });
});
