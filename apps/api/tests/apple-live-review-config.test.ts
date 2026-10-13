import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const connection = JSON.parse(readFileSync(new URL('../../../config/production-connections.json', import.meta.url), 'utf8'));
const base = {
  NODE_ENV: 'production', PRODUCTION_RUNTIME_MODE: 'live', DATABASE_URL: 'postgresql:///rillora_review_config_test',
  DATABASE_SSL_MODE: 'verify-full', DATABASE_SSL_CA_PATH: '/tmp/fixture-ca.pem',
  CONTENT_PROTECTION_MODE: 'encrypted', CONTENT_KEY_NAMESPACE: 'rillora-production',
  CONTENT_KMS_KEY_ARN: 'arn:aws:kms:eu-central-1:111111111111:key/11111111-1111-4111-8111-111111111111',
  RECOVERY_JOURNAL_TABLE: 'production-journal', RECOVERY_ENVIRONMENT: 'production',
  API_TLS_CERTIFICATE_ARN: 'arn:aws:acm:eu-central-1:111111111111:certificate/11111111-1111-4111-8111-111111111111',
  API_TLS_SERVER_NAME: 'origin.production.rillora.xyz', WEB_APP_ORIGIN: connection.webOrigin,
  OIDC_ISSUER_URL: 'https://' + connection.auth0Domain, OIDC_CLIENT_ID: connection.webClientID,
  OIDC_CLIENT_SECRET: 'synthetic-configuration-fixture-only', OIDC_REDIRECT_URI: connection.webOrigin + '/api/auth/callback',
  NATIVE_OIDC_CLIENT_ID: connection.nativeClientID, OIDC_API_AUDIENCE: connection.audience,
  ALLOW_APPLE_PRODUCTION_INTEGRATION: 'true',
  APPLE_PRODUCTION_SECRET_ARN: 'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/apple-iap-ABC123',
  APPLE_ROOT_CERTIFICATE_DIRECTORY: '/app/certificates/apple',
};
const review = {
  ALLOW_APPLE_REVIEW_INTEGRATION: 'true',
  APPLE_REVIEW_SECRET_ARN: 'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/apple-review-ABC123',
  APPLE_REVIEW_IDENTITY_SHA256: 'a'.repeat(64),
  APPLE_REVIEW_EXPIRES_AT: new Date(Date.now() + 60 * 60_000).toISOString(),
};

describe('Separate App Review access in the live production runtime', () => {
  it('loads both fixed Apple contexts without restricting ordinary account access', () => {
    const config = loadConfig({ ...base, ...review });
    expect(config.appleProduction).not.toBeNull();
    expect(config.appleReview).not.toBeNull();
    expect(config.productionReviewAccess).toBeNull();
    expect(config.appleReviewAccess).toEqual({
      identityDigests: [review.APPLE_REVIEW_IDENTITY_SHA256], expiresAt: Date.parse(review.APPLE_REVIEW_EXPIRES_AT),
    });
    expect(config.allowDevAuth).toBe(false);
    expect(config.appleSandbox).toBeNull();
    expect(config.stripeTest).toBeNull();
  });
  it('rejects incomplete, malformed, unbounded and stray review access configuration', () => {
    for (const overrides of [
      { APPLE_REVIEW_IDENTITY_SHA256: undefined }, { APPLE_REVIEW_EXPIRES_AT: undefined },
      { APPLE_REVIEW_IDENTITY_SHA256: '*' }, { APPLE_REVIEW_EXPIRES_AT: 'never' },
      { APPLE_REVIEW_EXPIRES_AT: new Date(Date.now() + 32 * 86_400_000).toISOString() },
      { ALLOW_APPLE_REVIEW_INTEGRATION: 'false' },
      { PRODUCTION_RUNTIME_MODE: 'staging' }, { PRODUCTION_RUNTIME_MODE: 'closed' },
    ]) expect(() => loadConfig({ ...base, ...review, ...overrides })).toThrow();
  });
  it('lets an expired review window close its routes without bringing down real customer services', () => {
    const config = loadConfig({ ...base, ...review, APPLE_REVIEW_EXPIRES_AT: new Date(Date.now() - 1_000).toISOString() });
    expect(config.productionRuntimeClosed).toBe(false);
    expect(config.productionReviewAccess).toBeNull();
    expect(config.appleReviewAccess!.expiresAt).toBeLessThan(Date.now());
  });
  it('continues rejecting every general development and diagnostic test switch', () => {
    for (const flag of ['ALLOW_DEV_AUTH', 'ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL', 'ALLOW_STRIPE_TEST_INTEGRATION',
      'ALLOW_APPLE_SANDBOX_INTEGRATION', 'ALLOW_FAMILY_MAINTENANCE_PREVIEW']) {
      expect(() => loadConfig({ ...base, ...review, [flag]: 'true' })).toThrow();
    }
  });
});
