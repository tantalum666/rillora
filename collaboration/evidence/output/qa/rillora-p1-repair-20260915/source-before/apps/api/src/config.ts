import "dotenv/config";
import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const optionalUrl = z.string().url().optional();

const optionalNonEmpty = z.string().min(1).optional();

const configSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().min(1).max(255).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4180),
    DATABASE_URL: optionalNonEmpty,
    DATABASE_HOST: optionalNonEmpty,
    DATABASE_PORT: z.coerce.number().int().min(1).max(65_535).optional(),
    DATABASE_NAME: optionalNonEmpty,
    DATABASE_USER: optionalNonEmpty,
    DATABASE_PASSWORD: optionalNonEmpty,
    DATABASE_SSL_MODE: z.enum(["disable", "verify-full"]).default("disable"),
    DATABASE_SSL_CA_PATH: optionalNonEmpty,
    CORS_ORIGINS: z.string().default("http://localhost:4173,http://localhost:4174"),
    ALLOW_DEV_AUTH: booleanFromString,
    ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL: booleanFromString,
    ALLOW_STRIPE_TEST_INTEGRATION: booleanFromString,
    STRIPE_TEST_STAGING_MODE: booleanFromString,
    ALLOW_APPLE_SANDBOX_INTEGRATION: booleanFromString,
    ALLOW_FAMILY_MAINTENANCE_PREVIEW: booleanFromString,
    APPLE_SANDBOX_STAGING_MODE: booleanFromString,
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(5_000),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
    SESSION_TTL_MINUTES: z.coerce.number().int().min(15).max(1_440).default(480),
    SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(240).default(30),
    AUTH_TRANSACTION_TTL_SECONDS: z.coerce.number().int().min(120).max(900).default(600),
    WEB_APP_ORIGIN: optionalUrl,
    OIDC_ISSUER_URL: optionalUrl,
    OIDC_CLIENT_ID: z.string().min(1).max(255).optional(),
    OIDC_CLIENT_SECRET: z.string().min(16).max(2_048).optional(),
    OIDC_REDIRECT_URI: optionalUrl,
    NATIVE_OIDC_CLIENT_ID: z.string().min(1).max(255).optional(),
    OIDC_API_AUDIENCE: z.string().url().or(z.string().startsWith("urn:")).optional(),
    STRIPE_TEST_API_KEY: z.string().min(20).max(255).optional(),
    STRIPE_TEST_WEBHOOK_SECRET: z.string().min(20).max(255).optional(),
    STRIPE_EXPECTED_ACCOUNT_ID: z.string().regex(/^acct_[A-Za-z0-9]+$/).optional(),
    STRIPE_FAMILY_PRODUCT_ID: z.string().regex(/^prod_[A-Za-z0-9]+$/).optional(),
    STRIPE_FAMILY_MONTHLY_PRICE_ID: z.string().regex(/^price_[A-Za-z0-9]+$/).optional(),
    STRIPE_FAMILY_ANNUAL_PRICE_ID: z.string().regex(/^price_[A-Za-z0-9]+$/).optional(),
    STRIPE_CHECKOUT_SUCCESS_URL: optionalUrl,
    STRIPE_CHECKOUT_CANCEL_URL: optionalUrl,
    STRIPE_PORTAL_RETURN_URL: optionalUrl,
    APPLE_ROOT_CERTIFICATE_DIRECTORY: optionalNonEmpty,
    APPLE_IAP_KEY_ID: z.string().regex(/^[A-Z0-9]{10}$/).optional(),
    APPLE_IAP_ISSUER_ID: z.string().uuid().optional(),
    APPLE_IAP_PRIVATE_KEY: z.string().min(100).max(8_192).optional(),
    DATA_REGION: z.string().min(2).max(80).default("eu-central-1"),
  });

export type OidcConfig = {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  webAppOrigin: string;
};

export type NativeOidcConfig = {
  issuerUrl: string;
  clientId: string;
  audience: string;
};

export type StripeTestConfig = {
  apiKey: string;
  webhookSecret: string;
  integrationEnvironment: "development" | "test" | "staging";
  expectedAccountId: string;
  familyProductId: string;
  familyPriceIds: Readonly<{
    monthly: string;
    annual: string;
  }>;
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
  portalReturnUrl: string;
};

export type AppleSandboxConfig = {
  rootCertificateDirectory: string;
  integrationEnvironment: "development" | "test" | "staging";
  serverApi: Readonly<{
    keyId: string;
    issuerId: string;
    privateKey: string;
  }> | null;
};

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  database: DatabaseConfig;
  corsOrigins: ReadonlySet<string>;
  allowDevAuth: boolean;
  allowSyntheticRecipientRehearsal: boolean;
  allowStripeTestIntegration: boolean;
  allowFamilyMaintenancePreview?: boolean;
  databasePoolMax: number;
  databaseConnectionTimeoutMs: number;
  trustProxyHops: number;
  sessionTtlMinutes: number;
  sessionIdleMinutes: number;
  authTransactionTtlSeconds: number;
  dataRegion: string;
  oidc: OidcConfig | null;
  nativeOidc: NativeOidcConfig | null;
  stripeTest: StripeTestConfig | null;
  appleSandbox: AppleSandboxConfig | null;
};

export type DatabaseConfig =
  | {
      connectionString: string;
      host?: never;
      port?: never;
      database?: never;
      user?: never;
      password?: never;
      sslMode: "disable" | "verify-full";
      sslCaPath: string | null;
    }
  | {
      connectionString?: never;
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      sslMode: "disable" | "verify-full";
      sslCaPath: string | null;
    };

type ParsedEnvironment = z.infer<typeof configSchema>;

function parseDatabaseConfig(parsed: ParsedEnvironment): DatabaseConfig {
  const componentValues = [
    parsed.DATABASE_HOST,
    parsed.DATABASE_PORT,
    parsed.DATABASE_NAME,
    parsed.DATABASE_USER,
    parsed.DATABASE_PASSWORD,
  ];
  const configuredComponents = componentValues.filter((value) => value !== undefined);
  if (parsed.DATABASE_URL && configuredComponents.length > 0) {
    throw new Error("Use either DATABASE_URL or the DATABASE_* connection fields, not both");
  }
  if (!parsed.DATABASE_URL && configuredComponents.length !== componentValues.length) {
    throw new Error("Database configuration must provide DATABASE_URL or every DATABASE_* connection field");
  }
  if (!parsed.DATABASE_URL && configuredComponents.length === 0) {
    throw new Error("Database configuration is required");
  }
  if (parsed.DATABASE_SSL_MODE === "verify-full" && !parsed.DATABASE_SSL_CA_PATH) {
    throw new Error("DATABASE_SSL_CA_PATH is required for verify-full database TLS");
  }
  if (parsed.NODE_ENV === "production" && parsed.DATABASE_SSL_MODE !== "verify-full") {
    throw new Error("Production database connections must use verify-full TLS");
  }

  const ssl = {
    sslMode: parsed.DATABASE_SSL_MODE,
    sslCaPath: parsed.DATABASE_SSL_CA_PATH ?? null,
  } as const;
  if (parsed.DATABASE_URL) {
    const databaseUrl = new URL(parsed.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
      throw new Error("DATABASE_URL must use the postgres or postgresql protocol");
    }
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
      if (databaseUrl.searchParams.has(key)) {
        throw new Error(`${key} must be configured through DATABASE_SSL_MODE and DATABASE_SSL_CA_PATH`);
      }
    }
    return { connectionString: parsed.DATABASE_URL, ...ssl };
  }
  return {
    host: parsed.DATABASE_HOST!,
    port: parsed.DATABASE_PORT!,
    database: parsed.DATABASE_NAME!,
    user: parsed.DATABASE_USER!,
    password: parsed.DATABASE_PASSWORD!,
    ...ssl,
  };
}

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  return parseDatabaseConfig(configSchema.parse(env));
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = configSchema.parse(env);
  if (parsed.NODE_ENV === "production" && parsed.ALLOW_DEV_AUTH) {
    throw new Error("ALLOW_DEV_AUTH must never be enabled in production");
  }
  if (parsed.NODE_ENV === "production" && parsed.ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL) {
    throw new Error("ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL must never be enabled in production");
  }
  if (
    parsed.NODE_ENV === "production"
    && parsed.ALLOW_STRIPE_TEST_INTEGRATION
    && !parsed.STRIPE_TEST_STAGING_MODE
  ) {
    throw new Error("Production Stripe test integration requires explicit staging mode");
  }
  if (
    parsed.STRIPE_TEST_STAGING_MODE
    && (parsed.NODE_ENV !== "production" || !parsed.ALLOW_STRIPE_TEST_INTEGRATION)
  ) {
    throw new Error("Stripe staging mode requires the production runtime and test integration gate");
  }
  if (
    parsed.NODE_ENV === "production"
    && parsed.ALLOW_APPLE_SANDBOX_INTEGRATION
    && !parsed.APPLE_SANDBOX_STAGING_MODE
  ) {
    throw new Error("Production Apple Sandbox integration requires explicit staging mode");
  }
  if (
    parsed.APPLE_SANDBOX_STAGING_MODE
    && (parsed.NODE_ENV !== "production" || !parsed.ALLOW_APPLE_SANDBOX_INTEGRATION)
  ) {
    throw new Error("Apple Sandbox staging mode requires the production runtime and integration gate");
  }
  const database = parseDatabaseConfig(parsed);

  if (parsed.NODE_ENV === "production" && parsed.ALLOW_FAMILY_MAINTENANCE_PREVIEW
    && (parsed.WEB_APP_ORIGIN !== "https://app.staging.rillora.xyz" || parsed.DATA_REGION !== "eu-central-1")) {
    throw new Error("Family maintenance preview is restricted to the existing synthetic staging");
  }

  const webOidcValues = [
    parsed.WEB_APP_ORIGIN,
    parsed.OIDC_CLIENT_ID,
    parsed.OIDC_CLIENT_SECRET,
    parsed.OIDC_REDIRECT_URI,
  ];
  const configuredWebOidcValues = webOidcValues.filter((value) => value !== undefined);
  if (
    configuredWebOidcValues.length !== 0 &&
    (configuredWebOidcValues.length !== webOidcValues.length || !parsed.OIDC_ISSUER_URL)
  ) {
    throw new Error("Web OIDC configuration must be provided as a complete set with OIDC_ISSUER_URL");
  }

  let oidc: OidcConfig | null = null;
  if (configuredWebOidcValues.length === webOidcValues.length) {
    const issuer = new URL(parsed.OIDC_ISSUER_URL!);
    const redirect = new URL(parsed.OIDC_REDIRECT_URI!);
    const webOrigin = new URL(parsed.WEB_APP_ORIGIN!).origin;
    if (parsed.NODE_ENV === "production") {
      if (issuer.protocol !== "https:" || redirect.protocol !== "https:" || webOrigin.startsWith("http:")) {
        throw new Error("Production OIDC endpoints must use HTTPS");
      }
    }
    oidc = {
      issuerUrl: issuer.href.replace(/\/$/, ""),
      clientId: parsed.OIDC_CLIENT_ID!,
      clientSecret: parsed.OIDC_CLIENT_SECRET!,
      redirectUri: redirect.href,
      webAppOrigin: webOrigin,
    };
  }

  const nativeOidcValues = [parsed.NATIVE_OIDC_CLIENT_ID, parsed.OIDC_API_AUDIENCE];
  const configuredNativeOidcValues = nativeOidcValues.filter((value) => value !== undefined);
  if (
    configuredNativeOidcValues.length !== 0 &&
    configuredNativeOidcValues.length !== nativeOidcValues.length
  ) {
    throw new Error("Native OIDC configuration must be provided as a complete set");
  }
  if (configuredNativeOidcValues.length > 0 && !parsed.OIDC_ISSUER_URL) {
    throw new Error("Native OIDC configuration requires OIDC_ISSUER_URL");
  }

  let nativeOidc: NativeOidcConfig | null = null;
  if (configuredNativeOidcValues.length === nativeOidcValues.length) {
    const issuer = new URL(parsed.OIDC_ISSUER_URL!);
    if (parsed.NODE_ENV === "production" && issuer.protocol !== "https:") {
      throw new Error("Production native OIDC issuer must use HTTPS");
    }
    nativeOidc = {
      issuerUrl: issuer.href.replace(/\/$/, ""),
      clientId: parsed.NATIVE_OIDC_CLIENT_ID!,
      audience: parsed.OIDC_API_AUDIENCE!,
    };
  }

  if (parsed.NODE_ENV === "production" && !oidc && !nativeOidc) {
    throw new Error("Production identity issuance requires Web or native OIDC configuration");
  }

  const stripeValues = [
    parsed.STRIPE_TEST_API_KEY,
    parsed.STRIPE_TEST_WEBHOOK_SECRET,
    parsed.STRIPE_EXPECTED_ACCOUNT_ID,
    parsed.STRIPE_FAMILY_PRODUCT_ID,
    parsed.STRIPE_FAMILY_MONTHLY_PRICE_ID,
    parsed.STRIPE_FAMILY_ANNUAL_PRICE_ID,
    parsed.STRIPE_CHECKOUT_SUCCESS_URL,
    parsed.STRIPE_CHECKOUT_CANCEL_URL,
    parsed.STRIPE_PORTAL_RETURN_URL,
  ];
  const configuredStripeValues = stripeValues.filter((value) => value !== undefined);
  if (configuredStripeValues.length > 0 && !parsed.ALLOW_STRIPE_TEST_INTEGRATION) {
    throw new Error("Stripe test configuration requires ALLOW_STRIPE_TEST_INTEGRATION=true");
  }
  if (
    parsed.ALLOW_STRIPE_TEST_INTEGRATION
    && configuredStripeValues.length !== stripeValues.length
  ) {
    throw new Error("Stripe test configuration must be provided as a complete set");
  }

  let stripeTest: StripeTestConfig | null = null;
  if (parsed.ALLOW_STRIPE_TEST_INTEGRATION) {
    if (!parsed.WEB_APP_ORIGIN) {
      throw new Error("Stripe test configuration requires WEB_APP_ORIGIN");
    }
    if (!parsed.STRIPE_TEST_API_KEY!.startsWith("rk_test_")) {
      throw new Error("Stripe test configuration requires a restricted test-mode API key");
    }
    if (!parsed.STRIPE_TEST_WEBHOOK_SECRET!.startsWith("whsec_")) {
      throw new Error("Stripe test webhook secret must start with whsec_");
    }

    const webOrigin = new URL(parsed.WEB_APP_ORIGIN).origin;
    if (parsed.STRIPE_TEST_STAGING_MODE) {
      if (
        webOrigin !== "https://app.staging.rillora.xyz"
        || parsed.DATA_REGION !== "eu-central-1"
        || parsed.STRIPE_EXPECTED_ACCOUNT_ID !== "acct_1U6B2RCxTlowhyiG"
        || parsed.STRIPE_FAMILY_PRODUCT_ID !== "prod_V6O8lAFbTCDmKd"
        || parsed.STRIPE_FAMILY_MONTHLY_PRICE_ID !== "price_1U6BMoCxTlowhyiG7qsmBrdY"
        || parsed.STRIPE_FAMILY_ANNUAL_PRICE_ID !== "price_1U6BMnCxTlowhyiGJEC1w596"
      ) {
        throw new Error("Stripe staging mode is bound to the exact Rillora test account and catalog");
      }
    }
    const checkoutSuccessUrl = validateStripeReturnUrl(
      parsed.STRIPE_CHECKOUT_SUCCESS_URL!,
      webOrigin,
      parsed.NODE_ENV,
    );
    const checkoutCancelUrl = validateStripeReturnUrl(
      parsed.STRIPE_CHECKOUT_CANCEL_URL!,
      webOrigin,
      parsed.NODE_ENV,
    );
    const portalReturnUrl = validateStripeReturnUrl(
      parsed.STRIPE_PORTAL_RETURN_URL!,
      webOrigin,
      parsed.NODE_ENV,
    );
    stripeTest = {
      apiKey: parsed.STRIPE_TEST_API_KEY!,
      webhookSecret: parsed.STRIPE_TEST_WEBHOOK_SECRET!,
      integrationEnvironment: parsed.STRIPE_TEST_STAGING_MODE
        ? "staging"
        : parsed.NODE_ENV === "test" ? "test" : "development",
      expectedAccountId: parsed.STRIPE_EXPECTED_ACCOUNT_ID!,
      familyProductId: parsed.STRIPE_FAMILY_PRODUCT_ID!,
      familyPriceIds: Object.freeze({
        monthly: parsed.STRIPE_FAMILY_MONTHLY_PRICE_ID!,
        annual: parsed.STRIPE_FAMILY_ANNUAL_PRICE_ID!,
      }),
      checkoutSuccessUrl,
      checkoutCancelUrl,
      portalReturnUrl,
    };
  }

  if (
    parsed.APPLE_ROOT_CERTIFICATE_DIRECTORY
    && !parsed.ALLOW_APPLE_SANDBOX_INTEGRATION
  ) {
    throw new Error(
      "Apple root certificate configuration requires ALLOW_APPLE_SANDBOX_INTEGRATION=true",
    );
  }
  if (
    parsed.ALLOW_APPLE_SANDBOX_INTEGRATION
    && !parsed.APPLE_ROOT_CERTIFICATE_DIRECTORY
  ) {
    throw new Error("Apple Sandbox integration requires the pinned root certificate directory");
  }
  const appleServerApiValues = [
    parsed.APPLE_IAP_KEY_ID,
    parsed.APPLE_IAP_ISSUER_ID,
    parsed.APPLE_IAP_PRIVATE_KEY,
  ];
  const configuredAppleServerApiValues = appleServerApiValues.filter(
    (value) => value !== undefined,
  );
  if (
    configuredAppleServerApiValues.length > 0
    && !parsed.ALLOW_APPLE_SANDBOX_INTEGRATION
  ) {
    throw new Error(
      "Apple In-App Purchase credentials require ALLOW_APPLE_SANDBOX_INTEGRATION=true",
    );
  }
  if (
    configuredAppleServerApiValues.length > 0
    && configuredAppleServerApiValues.length !== appleServerApiValues.length
  ) {
    throw new Error("Apple In-App Purchase credentials must be provided as a complete set");
  }
  if (
    parsed.APPLE_IAP_PRIVATE_KEY
    && (
      !parsed.APPLE_IAP_PRIVATE_KEY.includes("[REDACTED_PRIVATE_KEY]")
    )
  ) {
    throw new Error("Apple In-App Purchase private key must be an unmodified PKCS#8 PEM value");
  }
  let appleSandbox: AppleSandboxConfig | null = null;
  if (parsed.ALLOW_APPLE_SANDBOX_INTEGRATION) {
    if (
      parsed.APPLE_SANDBOX_STAGING_MODE
      && (
        parsed.APPLE_ROOT_CERTIFICATE_DIRECTORY !== "/app/certificates/apple"
        || parsed.DATA_REGION !== "eu-central-1"
      )
    ) {
      throw new Error(
        "Apple Sandbox staging mode is bound to the packaged roots and Frankfurt data plane",
      );
    }
    appleSandbox = {
      rootCertificateDirectory: parsed.APPLE_ROOT_CERTIFICATE_DIRECTORY!,
      integrationEnvironment: parsed.APPLE_SANDBOX_STAGING_MODE
        ? "staging"
        : parsed.NODE_ENV === "test" ? "test" : "development",
      serverApi: configuredAppleServerApiValues.length === appleServerApiValues.length
        ? Object.freeze({
            keyId: parsed.APPLE_IAP_KEY_ID!,
            issuerId: parsed.APPLE_IAP_ISSUER_ID!,
            privateKey: parsed.APPLE_IAP_PRIVATE_KEY!,
          })
        : null,
    };
  }

  const origins = parsed.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);

  return {
    nodeEnv: parsed.NODE_ENV,
    host: parsed.HOST,
    port: parsed.PORT,
    database,
    corsOrigins: new Set(origins),
    allowDevAuth: parsed.ALLOW_DEV_AUTH,
    allowSyntheticRecipientRehearsal: parsed.ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL,
    allowStripeTestIntegration: parsed.ALLOW_STRIPE_TEST_INTEGRATION,
    allowFamilyMaintenancePreview: parsed.ALLOW_FAMILY_MAINTENANCE_PREVIEW,
    databasePoolMax: parsed.DATABASE_POOL_MAX,
    databaseConnectionTimeoutMs: parsed.DATABASE_CONNECTION_TIMEOUT_MS,
    trustProxyHops: parsed.TRUST_PROXY_HOPS,
    sessionTtlMinutes: parsed.SESSION_TTL_MINUTES,
    sessionIdleMinutes: parsed.SESSION_IDLE_MINUTES,
    authTransactionTtlSeconds: parsed.AUTH_TRANSACTION_TTL_SECONDS,
    dataRegion: parsed.DATA_REGION,
    oidc,
    nativeOidc,
    stripeTest,
    appleSandbox,
  };
}

function validateStripeReturnUrl(
  value: string,
  expectedOrigin: string,
  nodeEnv: "development" | "test" | "production",
): string {
  const url = new URL(value);
  if (url.origin !== expectedOrigin) {
    throw new Error("Stripe return URLs must use WEB_APP_ORIGIN");
  }
  const isLocalHttp =
    url.protocol === "http:"
    && ["localhost", "127.0.0.1"].includes(url.hostname)
    && nodeEnv !== "production";
  if (url.protocol !== "https:" && !isLocalHttp) {
    throw new Error("Stripe return URLs must use HTTPS except on local development hosts");
  }
  return url.href;
}
