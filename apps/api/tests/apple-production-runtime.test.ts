import { generateKeyPairSync, randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { parseAppleProductionSecret, appleProductionSecretArnPattern } from '../src/apple-production-secret.js';
import { appleDeliveryMetrics } from '../src/apple-production-metrics.js';

const secretArn = 'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/apple-iap-ABC123';
const environment = () => ({
  NODE_ENV: 'production', DATABASE_URL: 'postgresql://127.0.0.1/local_fixture',
  DATABASE_SSL_MODE: 'verify-full', DATABASE_SSL_CA_PATH: 'fixture-ca.pem',
  WEB_APP_ORIGIN: 'https://app.rillora.xyz', OIDC_ISSUER_URL: 'https://identity.example',
  OIDC_CLIENT_ID: 'fixture', OIDC_CLIENT_SECRET: 'synthetic-configuration-not-a-live-secret',
  OIDC_REDIRECT_URI: 'https://app.rillora.xyz/api/auth/callback',
  CONTENT_PROTECTION_MODE: 'encrypted', CONTENT_KEY_NAMESPACE: 'rillora-production',
  CONTENT_KMS_KEY_ARN: `arn:aws:kms:eu-central-1:133857166372:key/${randomUUID()}`,
  RECOVERY_JOURNAL_TABLE: 'rillora-production-fixture', RECOVERY_ENVIRONMENT: 'production',
  API_TLS_CERTIFICATE_ARN: `arn:aws:acm:eu-central-1:133857166372:certificate/${randomUUID()}`,
  API_TLS_SERVER_NAME: 'origin.production.rillora.xyz',
  ALLOW_APPLE_PRODUCTION_INTEGRATION: 'true', APPLE_PRODUCTION_SECRET_ARN: secretArn,
  APPLE_ROOT_CERTIFICATE_DIRECTORY: 'fixture-pinned-roots',
});

describe('Apple production runtime boundaries', () => {
  it('requires the named secret and real production safeguards, without enabling Stripe or new sales', () => {
    expect(loadConfig(environment())).toMatchObject({ appleProduction: { secretArn }, appleSandbox: null, stripeProductionSecretArn: null });
    for (const patch of [{ NODE_ENV: 'test' }, { PRODUCTION_RUNTIME_MODE: 'closed' },
      { ALLOW_DEV_AUTH: 'true' }, { ALLOW_APPLE_SANDBOX_INTEGRATION: 'true' }, { ALLOW_STRIPE_TEST_INTEGRATION: 'true' },
      { ALLOW_FAMILY_MAINTENANCE_PREVIEW: 'true' }, { CONTENT_PROTECTION_MODE: 'off' },
      { CONTENT_KEY_NAMESPACE: 'rillora-staging' }, { API_TLS_SERVER_NAME: 'origin.staging.rillora.xyz' },
      { RECOVERY_ENVIRONMENT: 'staging' }, { WEB_APP_ORIGIN: 'https://app.staging.rillora.xyz' },
      { APPLE_PRODUCTION_SECRET_ARN: undefined }, { APPLE_ROOT_CERTIFICATE_DIRECTORY: undefined },
      { APPLE_IAP_KEY_ID: 'ABCDEFGHIJ' }, { DATA_REGION: 'us-east-1' }]) {
      expect(() => loadConfig({ ...environment(), ...patch })).toThrow();
    }
    expect(loadConfig({ DATABASE_URL: 'postgresql://127.0.0.1/local_fixture', APPLE_PRODUCTION_SECRET_ARN: secretArn }).appleProduction).toBeNull();
    for (const invalid of [secretArn.replace('133857166372', '111111111111'),
      secretArn.replace('eu-central-1', 'us-east-1'), secretArn.replace('rillora/production/apple-iap', 'fanpass/apple-iap'),
      secretArn.replace('apple-iap', 'sign-in-with-apple')]) expect(appleProductionSecretArnPattern.test(invalid)).toBe(false);
  });

  it('validates an ephemeral generated EC key and never echoes rejected credential material', () => {
    const privateKey = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const valid = { schemaVersion: 1, environment: 'production', bundleId: 'com.rillora.ios',
      keyId: 'ABCDEFGHIJ', issuerId: randomUUID(), privateKey, allowedStorefronts: ['USA'] };
    expect(parseAppleProductionSecret(JSON.stringify(valid)).allowedStorefronts).toEqual(['USA']);
    for (const patch of [{ environment: 'sandbox' }, { bundleId: 'com.fanpass.ios' }, { privateKey: 'invalid-key-secret-content' },
      { allowedStorefronts: [] }, { allowedStorefronts: ['USA', 'USA'] }, { allowedStorefronts: ['usa'] },
      { unreviewedSecret: 'must-not-echo' }, { privateKey: generateKeyPairSync('ec', { namedCurve: 'secp384r1' }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }]) {
      expect(() => parseAppleProductionSecret(JSON.stringify({ ...valid, ...patch }))).toThrow('Production Apple IAP secret does not match its reviewed schema');
    }
  });

  it('emits aggregate queue age/failure and worker heartbeat with no dynamic identity dimensions', () => {
    const event = appleDeliveryMetrics({ pending: 2, failed: 1, oldestPendingSeconds: 301 }, 123);
    expect(event).toMatchObject({ Environment: 'production', Provider: 'storekit', Heartbeat: 1, WorkerErrors: 0,
      Pending: 2, Failed: 1, OldestPendingSeconds: 301 });
    expect(event._aws.CloudWatchMetrics[0]!.Dimensions).toEqual([['Environment', 'Provider']]);
    expect(appleDeliveryMetrics(null)).toMatchObject({ Heartbeat: 1, WorkerErrors: 1 });
    expect(appleDeliveryMetrics(null)).not.toHaveProperty('Failed');
  });
});
