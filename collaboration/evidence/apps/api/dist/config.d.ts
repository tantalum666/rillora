import "dotenv/config";
import type { AccountDeletionConfig } from "./account-deletion.js";
import type { EmailVerificationConfig } from "./email-verification.js";
import type { ContentProtectionConfig } from "./private-content.js";
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
    familyPlanVersion?: number;
    familyPriceVersion?: number;
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
    appleReview?: {
        secretArn: string;
        rootCertificateDirectory: string;
    } | null;
    appleProduction?: {
        secretArn: string;
        rootCertificateDirectory: string;
    } | null;
    stripeProductionSecretArn?: string | null;
    productionRuntimeClosed?: boolean;
    productionReviewAccess?: {
        identityDigests: readonly string[];
        expiresAt: number;
    } | null;
    allowRetentionWorker?: boolean;
    requireRecentAuthentication?: boolean;
    apiTls?: {
        certificateArn: string;
        serverName: string;
        region: string;
    } | null;
    contentProtection?: ContentProtectionConfig | null;
    accountDeletion?: AccountDeletionConfig | null;
    emailVerification?: EmailVerificationConfig | null;
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
export type DatabaseConfig = {
    connectionString: string;
    host?: never;
    port?: never;
    database?: never;
    user?: never;
    password?: never;
    sslMode: "disable" | "verify-full";
    sslCaPath: string | null;
} | {
    connectionString?: never;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    sslMode: "disable" | "verify-full";
    sslCaPath: string | null;
};
export declare function loadDatabaseConfig(env?: NodeJS.ProcessEnv): DatabaseConfig;
export declare function loadContentProtectionConfig(env?: NodeJS.ProcessEnv): ContentProtectionConfig | null;
export declare function loadConfig(env?: NodeJS.ProcessEnv): AppConfig;
