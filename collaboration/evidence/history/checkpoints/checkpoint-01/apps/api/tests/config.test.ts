import { describe, expect, it } from "vitest";
import { loadConfig, loadContentProtectionConfig } from "../src/config.js";

const baseEnvironment = {
  DATABASE_URL: "postgresql:///continuity_test",
};

describe("API configuration", () => {
  it("requires an exact regional KMS key and a complete content-encryption configuration", () => {
    const environment={CONTENT_PROTECTION_MODE:"encrypted",CONTENT_KEY_NAMESPACE:"rillora-staging",DATA_REGION:"eu-central-1",
      CONTENT_KMS_KEY_ARN:"arn:aws:kms:eu-central-1:111111111111:key/11111111-1111-4111-8111-111111111111"};
    expect(loadContentProtectionConfig(environment)).toMatchObject({mode:"encrypted",namespace:"rillora-staging",region:"eu-central-1"});
    expect(loadContentProtectionConfig({})).toBeNull();
    expect(()=>loadContentProtectionConfig({...environment,CONTENT_PROTECTION_MODE:"off"})).toThrow();
    expect(()=>loadContentProtectionConfig({...environment,CONTENT_KMS_KEY_ARN:""})).toThrow();
    expect(()=>loadContentProtectionConfig({...environment,DATA_REGION:"us-east-1"})).toThrow();
    expect(()=>loadContentProtectionConfig({...environment,CONTENT_KMS_KEY_ARN:"arn:aws:kms:eu-central-1:111111111111:alias/rillora"})).toThrow();
    expect(()=>loadContentProtectionConfig({...environment,CONTENT_KEY_NAMESPACE:""})).toThrow();
  });
  it("supports an explicit database wake-up timeout while keeping the local default short", () => {
    expect(loadConfig(baseEnvironment).databaseConnectionTimeoutMs).toBe(5_000);
    expect(
      loadConfig({
        ...baseEnvironment,
        DATABASE_CONNECTION_TIMEOUT_MS: "45000",
      }).databaseConnectionTimeoutMs,
    ).toBe(45_000);
  });

  it("refuses development authentication in production", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        NODE_ENV: "production",
        ALLOW_DEV_AUTH: "true",
      }),
    ).toThrow("ALLOW_DEV_AUTH");
  });

  it("refuses the synthetic recipient rehearsal in production", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        NODE_ENV: "production",
        ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL: "true",
      }),
    ).toThrow("ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL");
  });

  it("keeps the official Stripe adapter disabled unless a complete test-only set is explicit", () => {
    expect(loadConfig(baseEnvironment).stripeTest).toBeNull();
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        STRIPE_TEST_API_KEY: "[REDACTED_SCANNER_LITERAL]",
      }),
    ).toThrow("ALLOW_STRIPE_TEST_INTEGRATION");
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        ALLOW_STRIPE_TEST_INTEGRATION: "true",
        STRIPE_TEST_API_KEY: "[REDACTED_SCANNER_LITERAL]",
      }),
    ).toThrow("complete set");
  });

  it("accepts a restricted same-origin Stripe test set while rejecting broad, live and cross-origin configuration", () => {
    const stripeEnvironment = {
      ...baseEnvironment,
      ALLOW_STRIPE_TEST_INTEGRATION: "true",
      WEB_APP_ORIGIN: "https://app.staging.rillora.xyz",
      OIDC_ISSUER_URL: "https://login.rillora.xyz",
      OIDC_CLIENT_ID: "web-client",
      OIDC_CLIENT_SECRET: "client-secret-long-enough",
      OIDC_REDIRECT_URI: "https://api.staging.rillora.xyz/auth/callback",
      STRIPE_TEST_API_KEY: "[REDACTED_SCANNER_LITERAL]",
      STRIPE_TEST_WEBHOOK_SECRET: "[REDACTED_SCANNER_LITERAL]",
      STRIPE_EXPECTED_ACCOUNT_ID: "acct_RilloraFixture001",
      STRIPE_FAMILY_PRODUCT_ID: "prod_RilloraFamilyFixture",
      STRIPE_FAMILY_MONTHLY_PRICE_ID: "price_RilloraMonthlyFixture",
      STRIPE_FAMILY_ANNUAL_PRICE_ID: "price_RilloraAnnualFixture",
      STRIPE_CHECKOUT_SUCCESS_URL:
        "https://app.staging.rillora.xyz/account/billing/complete?session_id={CHECKOUT_SESSION_ID}",
      STRIPE_CHECKOUT_CANCEL_URL: "https://app.staging.rillora.xyz/account/billing",
      STRIPE_PORTAL_RETURN_URL: "https://app.staging.rillora.xyz/account/billing",
    };
    const config = loadConfig(stripeEnvironment);
    expect(config.stripeTest).toMatchObject({
      integrationEnvironment: "development",
      expectedAccountId: "acct_RilloraFixture001",
      familyProductId: "prod_RilloraFamilyFixture",
      familyPriceIds: {
        monthly: "price_RilloraMonthlyFixture",
        annual: "price_RilloraAnnualFixture",
      },
    });

    expect(() => loadConfig({
      ...stripeEnvironment,
      STRIPE_TEST_API_KEY: "[REDACTED_SCANNER_LITERAL]",
    })).toThrow("restricted test-mode API key");
    expect(() => loadConfig({
      ...stripeEnvironment,
      STRIPE_TEST_API_KEY: "[REDACTED_SCANNER_LITERAL]",
    })).toThrow("restricted test-mode API key");
    expect(() => loadConfig({
      ...stripeEnvironment,
      STRIPE_PORTAL_RETURN_URL: "https://attacker.example/account/billing",
    })).toThrow("WEB_APP_ORIGIN");
  });

  it("refuses the test Stripe adapter in production even with otherwise valid identity and TLS", () => {
    expect(() => loadConfig({
      ...baseEnvironment,
      NODE_ENV: "production",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_SSL_CA_PATH: "/tmp/rds-ca.pem",
      OIDC_ISSUER_URL: "https://login.rillora.xyz",
      OIDC_CLIENT_ID: "web-client",
      OIDC_CLIENT_SECRET: "client-secret-long-enough",
      OIDC_REDIRECT_URI: "https://app.staging.rillora.xyz/api/auth/callback",
      NATIVE_OIDC_CLIENT_ID: "native-client",
      OIDC_API_AUDIENCE: "urn:rillora:api",
      ALLOW_STRIPE_TEST_INTEGRATION: "true",
    })).toThrow("explicit staging mode");
  });

  it("allows the exact Rillora Stripe test catalog only in explicit production-shaped staging", () => {
    const staging = {
      ...baseEnvironment,
      NODE_ENV: "production",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_SSL_CA_PATH: "/tmp/rds-ca.pem",
      OIDC_ISSUER_URL: "https://login.rillora.xyz",
      OIDC_CLIENT_ID: "web-client",
      OIDC_CLIENT_SECRET: "client-secret-long-enough",
      OIDC_REDIRECT_URI: "https://app.staging.rillora.xyz/api/auth/callback",
      NATIVE_OIDC_CLIENT_ID: "native-client",
      OIDC_API_AUDIENCE: "urn:rillora:api",
      WEB_APP_ORIGIN: "https://app.staging.rillora.xyz",
      DATA_REGION: "eu-central-1",
      ALLOW_STRIPE_TEST_INTEGRATION: "true",
      STRIPE_TEST_STAGING_MODE: "true",
      STRIPE_TEST_API_KEY: "[REDACTED_SCANNER_LITERAL]",
      STRIPE_TEST_WEBHOOK_SECRET: "[REDACTED_SCANNER_LITERAL]",
      STRIPE_EXPECTED_ACCOUNT_ID: "acct_1U6B2RCxTlowhyiG",
      STRIPE_FAMILY_PRODUCT_ID: "prod_V6O8lAFbTCDmKd",
      STRIPE_FAMILY_MONTHLY_PRICE_ID: "price_1U6BMoCxTlowhyiG7qsmBrdY",
      STRIPE_FAMILY_ANNUAL_PRICE_ID: "price_1U6BMnCxTlowhyiGJEC1w596",
      STRIPE_CHECKOUT_SUCCESS_URL:
        "https://app.staging.rillora.xyz/account/billing/complete?session_id={CHECKOUT_SESSION_ID}",
      STRIPE_CHECKOUT_CANCEL_URL: "https://app.staging.rillora.xyz/account/billing",
      STRIPE_PORTAL_RETURN_URL: "https://app.staging.rillora.xyz/account/billing",
    };
    expect(loadConfig(staging).stripeTest).toMatchObject({ integrationEnvironment: "staging" });
    expect(() => loadConfig({
      ...staging,
      STRIPE_EXPECTED_ACCOUNT_ID: "acct_FanPassMustNeverBeUsed",
    })).toThrow("exact Rillora test account and catalog");
  });

  it("keeps Apple Sandbox intake disabled unless the pinned-root gate is complete", () => {
    expect(loadConfig(baseEnvironment).appleSandbox).toBeNull();
    expect(() => loadConfig({
      ...baseEnvironment,
      APPLE_ROOT_CERTIFICATE_DIRECTORY: "/tmp/apple-roots",
    })).toThrow("ALLOW_APPLE_SANDBOX_INTEGRATION");
    expect(() => loadConfig({
      ...baseEnvironment,
      ALLOW_APPLE_SANDBOX_INTEGRATION: "true",
    })).toThrow("pinned root certificate directory");

    expect(loadConfig({
      ...baseEnvironment,
      NODE_ENV: "test",
      ALLOW_APPLE_SANDBOX_INTEGRATION: "true",
      APPLE_ROOT_CERTIFICATE_DIRECTORY: "/tmp/apple-roots",
    }).appleSandbox).toEqual({
      rootCertificateDirectory: "/tmp/apple-roots",
      integrationEnvironment: "test",
      serverApi: null,
    });
  });

  it("requires a complete, gated Apple In-App Purchase credential set", () => {
    const privateKey = [
      "[REDACTED_PRIVATE_KEY]",
    ].join("\n");
    expect(() => loadConfig({
      ...baseEnvironment,
      APPLE_IAP_KEY_ID: "RILLORA001",
    })).toThrow("ALLOW_APPLE_SANDBOX_INTEGRATION");
    expect(() => loadConfig({
      ...baseEnvironment,
      ALLOW_APPLE_SANDBOX_INTEGRATION: "true",
      APPLE_ROOT_CERTIFICATE_DIRECTORY: "/tmp/apple-roots",
      APPLE_IAP_KEY_ID: "RILLORA001",
    })).toThrow("complete set");

    expect(loadConfig({
      ...baseEnvironment,
      NODE_ENV: "test",
      ALLOW_APPLE_SANDBOX_INTEGRATION: "true",
      APPLE_ROOT_CERTIFICATE_DIRECTORY: "/tmp/apple-roots",
      APPLE_IAP_KEY_ID: "RILLORA001",
      APPLE_IAP_ISSUER_ID: "11111111-2222-4333-8444-555555555555",
      APPLE_IAP_PRIVATE_KEY: privateKey,
    }).appleSandbox).toEqual({
      rootCertificateDirectory: "/tmp/apple-roots",
      integrationEnvironment: "test",
      serverApi: {
        keyId: "RILLORA001",
        issuerId: "11111111-2222-4333-8444-555555555555",
        privateKey,
      },
    });
  });

  it("allows Apple Sandbox intake in production-shaped staging only with packaged roots", () => {
    const staging = {
      ...baseEnvironment,
      NODE_ENV: "production",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_SSL_CA_PATH: "/tmp/rds-ca.pem",
      OIDC_ISSUER_URL: "https://login.rillora.xyz",
      NATIVE_OIDC_CLIENT_ID: "native-client",
      OIDC_API_AUDIENCE: "urn:rillora:api",
      DATA_REGION: "eu-central-1",
      ALLOW_APPLE_SANDBOX_INTEGRATION: "true",
      APPLE_SANDBOX_STAGING_MODE: "true",
      APPLE_ROOT_CERTIFICATE_DIRECTORY: "/app/certificates/apple",
    };
    expect(loadConfig(staging).appleSandbox).toEqual({
      rootCertificateDirectory: "/app/certificates/apple",
      integrationEnvironment: "staging",
      serverApi: null,
    });
    expect(() => loadConfig({
      ...staging,
      APPLE_ROOT_CERTIFICATE_DIRECTORY: "/tmp/unpinned-roots",
    })).toThrow("packaged roots and Frankfurt");
    expect(() => loadConfig({
      ...staging,
      APPLE_SANDBOX_STAGING_MODE: "false",
    })).toThrow("explicit staging mode");
  });

  it("refuses an incomplete Web OIDC configuration", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        OIDC_ISSUER_URL: "https://identity.example",
        OIDC_CLIENT_ID: "web-client",
      }),
    ).toThrow("complete set");
  });

  it("accepts native OIDC without requiring Web client credentials", () => {
    const config = loadConfig({
      ...baseEnvironment,
      OIDC_ISSUER_URL: "https://identity.example",
      NATIVE_OIDC_CLIENT_ID: "native-client",
      OIDC_API_AUDIENCE: "urn:rillora:api",
    });
    expect(config.oidc).toBeNull();
    expect(config.nativeOidc).toEqual({
      issuerUrl: "https://identity.example",
      clientId: "native-client",
      audience: "urn:rillora:api",
    });
  });

  it("requires configured identity issuance in production", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        NODE_ENV: "production",
        DATABASE_SSL_MODE: "verify-full",
        DATABASE_SSL_CA_PATH: "/tmp/rds-ca.pem",
      }),
    ).toThrow("Web or native OIDC");
  });

  it("accepts a same-origin HTTPS callback for production", () => {
    const config = loadConfig({
      ...baseEnvironment,
      NODE_ENV: "production",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_SSL_CA_PATH: "/tmp/rds-ca.pem",
      WEB_APP_ORIGIN: "https://app.example.com",
      OIDC_ISSUER_URL: "https://login.example.com",
      OIDC_CLIENT_ID: "client-id",
      OIDC_CLIENT_SECRET: "client-secret-long-enough",
      OIDC_REDIRECT_URI: "https://app.example.com/api/auth/callback",
    });
    expect(config.oidc?.issuerUrl).toBe("https://login.example.com");
    expect(config.nativeOidc).toBeNull();
    expect(config.dataRegion).toBe("eu-central-1");
  });

  it("allows a separate HTTPS API callback origin for the authenticated Web", () => {
    const config = loadConfig({
      ...baseEnvironment,
      NODE_ENV: "production",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_SSL_CA_PATH: "/tmp/rds-ca.pem",
      WEB_APP_ORIGIN: "https://app.staging.rillora.xyz",
      OIDC_ISSUER_URL: "https://login.rillora.xyz",
      OIDC_CLIENT_ID: "web-client",
      OIDC_CLIENT_SECRET: "client-secret-long-enough",
      OIDC_REDIRECT_URI: "https://api.staging.rillora.xyz/auth/callback",
    });
    expect(config.oidc?.redirectUri).toBe("https://api.staging.rillora.xyz/auth/callback");
    expect(config.oidc?.webAppOrigin).toBe("https://app.staging.rillora.xyz");
  });

  it("accepts production native identity with component database credentials", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      DATABASE_HOST: "database.internal",
      DATABASE_PORT: "5432",
      DATABASE_NAME: "rillora",
      DATABASE_USER: "continuity_runtime",
      DATABASE_PASSWORD: "runtime-secret",
      DATABASE_SSL_MODE: "verify-full",
      DATABASE_SSL_CA_PATH: "/app/certs/rds-global-bundle.pem",
      OIDC_ISSUER_URL: "https://login.rillora.xyz",
      NATIVE_OIDC_CLIENT_ID: "native-client",
      OIDC_API_AUDIENCE: "urn:rillora:api",
    });
    expect(config.host).toBe("0.0.0.0");
    expect(config.database).toMatchObject({
      host: "database.internal",
      port: 5432,
      database: "rillora",
      user: "continuity_runtime",
      sslMode: "verify-full",
    });
    expect(config.oidc).toBeNull();
    expect(config.nativeOidc?.clientId).toBe("native-client");
  });

  it("refuses production database connections without verified TLS", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        NODE_ENV: "production",
        OIDC_ISSUER_URL: "https://login.rillora.xyz",
        NATIVE_OIDC_CLIENT_ID: "native-client",
        OIDC_API_AUDIENCE: "urn:rillora:api",
      }),
    ).toThrow("verify-full TLS");
  });

  it("refuses an insecure native issuer in production", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        NODE_ENV: "production",
        DATABASE_SSL_MODE: "verify-full",
        DATABASE_SSL_CA_PATH: "/tmp/rds-ca.pem",
        OIDC_ISSUER_URL: "http://identity.example",
        NATIVE_OIDC_CLIENT_ID: "native-client",
        OIDC_API_AUDIENCE: "urn:rillora:api",
      }),
    ).toThrow("native OIDC issuer must use HTTPS");
  });

  it("refuses ambiguous database connection inputs", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        DATABASE_HOST: "database.internal",
        DATABASE_PORT: "5432",
        DATABASE_NAME: "rillora",
        DATABASE_USER: "continuity_runtime",
        DATABASE_PASSWORD: "runtime-secret",
      }),
    ).toThrow("either DATABASE_URL or the DATABASE_*");
  });

  it("accepts a native client and absolute URN audience as one configuration set", () => {
    const config = loadConfig({
      ...baseEnvironment,
      WEB_APP_ORIGIN: "http://localhost:4173",
      OIDC_ISSUER_URL: "https://identity.example",
      OIDC_CLIENT_ID: "web-client",
      OIDC_CLIENT_SECRET: "client-secret-long-enough",
      OIDC_REDIRECT_URI: "http://localhost:4173/api/auth/callback",
      NATIVE_OIDC_CLIENT_ID: "native-client",
      OIDC_API_AUDIENCE: "urn:rillora:api",
    });
    expect(config.nativeOidc).toEqual({
      issuerUrl: "https://identity.example",
      clientId: "native-client",
      audience: "urn:rillora:api",
    });
  });

  it("refuses a partial native OIDC configuration", () => {
    expect(() =>
      loadConfig({
        ...baseEnvironment,
        NATIVE_OIDC_CLIENT_ID: "native-client",
      }),
    ).toThrow("complete set");
  });
});
