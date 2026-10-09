import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePurchaseConsent, purchaseConsentContract, purchaseConsentDigest } from '../src/purchase-consent.js';
import { parseStripeProductionSecret, stripeProductionSecretArnPattern } from '../src/stripe-production-secret.js';
import { loadConfig } from '../src/config.js';

const secret = {
  schemaVersion: 1, environment: 'production',
  apiKey: 'rk_live_synthetic_fixture_never_usable', webhookSecret: 'whsec_synthetic_fixture_never_usable',
  expectedAccountId:'acct_1U6B2RCxTlowhyiG', familyProductId:'prod_fixture',annualPriceId:'price_fixture',historicalPrices:[],
  checkoutSuccessUrl:'https://app.rillora.xyz/account/billing/complete?session_id={CHECKOUT_SESSION_ID}',
  checkoutCancelUrl:'https://app.rillora.xyz/account/billing',portalReturnUrl:'https://app.rillora.xyz/account/billing',portalConfigurationId:'bpc_fixture',
  tax:{mode:'reviewed_no_collection',assessmentReference:'synthetic-fixture-only',productTaxCode:'txcd_fixture',activeRegistrationIds:[]},
};
describe('production purchase configuration fails closed',()=>{
  it('keeps browser and server price/legal proof identical without registration consent reuse',()=>{
    const client=JSON.parse(readFileSync(new URL('../../../config/purchase-consent.json',import.meta.url),'utf8'));
    for(const [key,value] of Object.entries(purchaseConsentContract)) expect(client[key]).toEqual(value);
    const proof={...purchaseConsentContract,acceptedSubscriptionTerms:true,acceptedAnnualRenewal:true,acknowledgedCancellation:true} as const;
    expect(parsePurchaseConsent(proof)).toEqual(proof);
    expect(purchaseConsentDigest(proof)).toEqual(purchaseConsentDigest(Object.fromEntries(Object.entries(proof).reverse()) as typeof proof));
    for(const patch of [{acceptedAnnualRenewal:false},{acknowledgedCancellation:false},{amountMinor:6800},{amountMinor:8880},{version:'family-annual-web-20260925-1'},{termsVersion:'old'},{extra:true}]) expect(()=>parsePurchaseConsent({...proof,...patch})).toThrow();
  });
  it('accepts only the named AWS account, region and production secret',()=>{
    expect(stripeProductionSecretArnPattern.test('arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/stripe-billing-ABC123')).toBe(true);
    for(const arn of ['arn:aws:secretsmanager:us-east-1:133857166372:secret:rillora/production/stripe-billing-ABC123','arn:aws:secretsmanager:eu-central-1:000000000000:secret:rillora/production/stripe-billing-ABC123','arn:aws:secretsmanager:eu-central-1:133857166372:secret:fanpass/stripe-billing-ABC123']) expect(stripeProductionSecretArnPattern.test(arn)).toBe(false);
  });
  it('rejects test, broad-key, duplicate, unreviewed-tax and cross-origin secrets without echoing their contents',()=>{
    expect(parseStripeProductionSecret(JSON.stringify(secret))).toMatchObject({expectedAccountId:secret.expectedAccountId});
    for(const patch of [{apiKey:'sk_live_synthetic_fixture_never_usable'},{environment:'test'},{expectedAccountId:'acct_other'},{portalReturnUrl:'https://evil.invalid/'},{unexpected:'secret-content'},
      {tax:{...secret.tax,mode:'automatic',activeRegistrationIds:[]}},
      {historicalPrices:[{id:secret.annualPriceId,priceCode:'family_usd_annual_v2',amountMinor:6800,currency:'usd',interval:'year',planVersion:2}]}]) {
      try{parseStripeProductionSecret(JSON.stringify({...secret,...patch}));throw new Error('accepted invalid configuration');}
      catch(error){expect((error as Error).message).toBe('Production billing secret does not match its reviewed schema');}
    }
    expect(()=>parseStripeProductionSecret('{')).toThrow('reviewed schema');
  });
  it('cannot enable production billing in development, a closed runtime or by secret ARN alone',()=>{
    const base={DATABASE_URL:'postgresql://127.0.0.1/local_fixture',ALLOW_STRIPE_PRODUCTION_INTEGRATION:'true',STRIPE_PRODUCTION_SECRET_ARN:'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/stripe-billing-ABC123'};
    expect(()=>loadConfig(base)).toThrow('Production billing requires');
    expect(()=>loadConfig({...base,NODE_ENV:'production',PRODUCTION_RUNTIME_MODE:'closed'})).toThrow('Closed production requires');
    expect(loadConfig({...base,ALLOW_STRIPE_PRODUCTION_INTEGRATION:'false'}).stripeProductionSecretArn).toBeNull();
  });
  it('records pending tax configuration explicitly instead of inventing an assessment',()=>{
    const pending={...secret,tax:{mode:'not_configured',productTaxCode:'txcd_fixture'}};
    expect(parseStripeProductionSecret(JSON.stringify(pending)).tax).toEqual(pending.tax);
    expect(()=>parseStripeProductionSecret(JSON.stringify({...pending,tax:{...pending.tax,assessmentReference:'pretend-review'}}))).toThrow('reviewed schema');
    expect(()=>parseStripeProductionSecret(JSON.stringify({...pending,tax:{...pending.tax,activeRegistrationIds:['taxreg_fixture']}}))).toThrow('reviewed schema');
  });
  it('allows only signed Live notifications inside the existing restricted review boundary',()=>{
    const env={DATABASE_URL:'postgresql://127.0.0.1/local_fixture',NODE_ENV:'production',DATABASE_SSL_MODE:'verify-full',DATABASE_SSL_CA_PATH:'/tmp/fixture-ca.pem',
      PRODUCTION_RUNTIME_MODE:'review',PRODUCTION_REVIEW_IDENTITY_SHA256:'a'.repeat(64),PRODUCTION_REVIEW_EXPIRES_AT:'2026-12-01T00:00:00Z',
      ALLOW_APPLE_REVIEW_INTEGRATION:'true',APPLE_REVIEW_SECRET_ARN:'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/apple-review-ABC123',APPLE_ROOT_CERTIFICATE_DIRECTORY:'/app/certificates/apple',
      ALLOW_STRIPE_PRODUCTION_NOTIFICATIONS:'true',STRIPE_PRODUCTION_SECRET_ARN:'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/stripe-billing-ABC123',
      WEB_APP_ORIGIN:'https://app.rillora.xyz',OIDC_ISSUER_URL:'https://login.rillora.xyz',OIDC_CLIENT_ID:'EcevpyKt1GELKwkLnVU3aCbh3Ix2SJhz',
      OIDC_CLIENT_SECRET:'synthetic-oidc-secret-never-usable',OIDC_REDIRECT_URI:'https://app.rillora.xyz/api/auth/callback',
      NATIVE_OIDC_CLIENT_ID:'POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4',OIDC_API_AUDIENCE:'urn:rillora:production:api',
      CONTENT_PROTECTION_MODE:'encrypted',CONTENT_KEY_NAMESPACE:'rillora-production',
      CONTENT_KMS_KEY_ARN:'arn:aws:kms:eu-central-1:133857166372:key/11111111-1111-4111-8111-111111111111',
      RECOVERY_JOURNAL_TABLE:'production-fixture',RECOVERY_ENVIRONMENT:'production',
      API_TLS_CERTIFICATE_ARN:'arn:aws:acm:eu-central-1:133857166372:certificate/11111111-1111-4111-8111-111111111111',API_TLS_SERVER_NAME:'origin.production.rillora.xyz'};
    const loaded=loadConfig(env);
    expect(loaded.stripeProductionSecretArn).toBe(env.STRIPE_PRODUCTION_SECRET_ARN);
    expect(loaded.stripeProductionCheckoutEnabled).toBe(false);
    expect(loaded.productionReviewAccess?.identityDigests).toEqual(['a'.repeat(64)]);
    for(const patch of [{NODE_ENV:'development'},{PRODUCTION_RUNTIME_MODE:'closed'},{ALLOW_STRIPE_PRODUCTION_INTEGRATION:'true'},
      {ALLOW_STRIPE_TEST_INTEGRATION:'true'},{ALLOW_DEV_AUTH:'true'},{STRIPE_PRODUCTION_SECRET_ARN:undefined},
      {WEB_APP_ORIGIN:'https://app.staging.rillora.xyz'},{CONTENT_PROTECTION_MODE:'off'}])expect(()=>loadConfig({...env,...patch})).toThrow();
  });
});
