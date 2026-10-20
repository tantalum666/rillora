import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

// Explicit customer activation is a configuration capability, never an IaC
// default. No provider connection or real credential is used by these tests.
const production = {
  NODE_ENV:'production',PRODUCTION_RUNTIME_MODE:'live',
  DATABASE_URL:'postgresql://127.0.0.1/local_fixture',DATABASE_SSL_MODE:'verify-full',DATABASE_SSL_CA_PATH:'fixture-ca.pem',
  CONTENT_PROTECTION_MODE:'encrypted',CONTENT_KEY_NAMESPACE:'rillora-production',DATA_REGION:'eu-central-1',
  CONTENT_KMS_KEY_ARN:'arn:aws:kms:eu-central-1:133857166372:key/11111111-1111-4111-8111-111111111111',
  RECOVERY_JOURNAL_TABLE:'fixture-production-recovery',RECOVERY_ENVIRONMENT:'production',
  API_TLS_CERTIFICATE_ARN:'arn:aws:acm:eu-central-1:133857166372:certificate/11111111-1111-4111-8111-111111111111',
  API_TLS_SERVER_NAME:'origin.production.rillora.xyz',WEB_APP_ORIGIN:'https://app.rillora.xyz',
  OIDC_ISSUER_URL:'https://login.rillora.xyz',OIDC_CLIENT_ID:'EcevpyKt1GELKwkLnVU3aCbh3Ix2SJhz',
  OIDC_CLIENT_SECRET:'synthetic-configuration-not-a-live-secret',OIDC_REDIRECT_URI:'https://app.rillora.xyz/api/auth/callback',
  NATIVE_OIDC_CLIENT_ID:'POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4',OIDC_API_AUDIENCE:'urn:rillora:production:api',
};
describe('explicit protected production activation',()=>{
  it('preserves an intentional production configuration without implicitly enabling payment providers',()=>{
    expect(loadConfig(production)).toMatchObject({productionRuntimeClosed:false,productionReviewAccess:null,
      requireRecentAuthentication:true,appleProduction:null,stripeProductionSecretArn:null});
  });
  it.each([
    {PRODUCTION_RUNTIME_MODE:undefined},{NODE_ENV:'test'},{WEB_APP_ORIGIN:'https://app.staging.rillora.xyz'},
    {OIDC_ISSUER_URL:'https://attacker.example'},{OIDC_CLIENT_ID:'another-client'},
    {NATIVE_OIDC_CLIENT_ID:'another-client'},{OIDC_API_AUDIENCE:'urn:rillora:api'},
    {OIDC_REDIRECT_URI:'https://app.rillora.xyz/other'},{OIDC_CLIENT_SECRET:undefined},
    {CONTENT_PROTECTION_MODE:'off',CONTENT_KMS_KEY_ARN:undefined,CONTENT_KEY_NAMESPACE:undefined},
    {CONTENT_KEY_NAMESPACE:'rillora-staging'},{RECOVERY_JOURNAL_TABLE:undefined},
    {RECOVERY_ENVIRONMENT:'staging'},{DATA_REGION:'us-east-1'},
    {API_TLS_CERTIFICATE_ARN:undefined,API_TLS_SERVER_NAME:undefined},{DATABASE_SSL_MODE:'disable'},
    {ALLOW_DEV_AUTH:'true'},{ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL:'true'},
    {ALLOW_FAMILY_MAINTENANCE_PREVIEW:'true'},{ALLOW_APPLE_REVIEW_INTEGRATION:'true'},
    {ALLOW_STRIPE_TEST_INTEGRATION:'true'},{ALLOW_APPLE_SANDBOX_INTEGRATION:'true'},
    {PRODUCTION_REVIEW_IDENTITY_SHA256:'a'.repeat(64)},
  ])('rejects a missing or substituted protected boundary: %j',patch=>{
    expect(()=>loadConfig({...production,...patch})).toThrow();
  });
});
