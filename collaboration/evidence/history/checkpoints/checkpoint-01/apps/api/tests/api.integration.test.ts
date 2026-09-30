import type { Test } from "supertest";
import { createECDH, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import request from "./http-fixture.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import {
  Environment,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import type { AppleSignedDataVerifying } from "../src/apple-storekit-adapter.js";
import type { StoreKitSandboxSnapshotProvider } from "../src/apple-storekit-server-api.js";
import type { AppConfig } from "../src/config.js";
import { createPool, type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { dedicatedTestDatabaseUrl, assertDedicatedTestDatabase } from "./dedicated-test-database.js";
import { developmentPlannerPublicId, seedDevelopmentFixture } from "../src/seed-dev.js";
import type { IdentityProvider, NativeIdentityVerifier } from "../src/identity.js";
import type { StripeCommerceProvider } from "../src/stripe-commerce-executor.js";
import { currentLegalContract } from "../src/legal-contract.js";
import { ApiError } from "../src/errors.js";

const { Client } = pg;
const databaseUrl = dedicatedTestDatabaseUrl(process.env.TEST_DATABASE_URL ?? "postgresql:///continuity_test", "continuity_test");
const secondPlannerPublicId = "22222222-2222-4222-8222-222222222222";
const sessionToken = "s".repeat(43);
const csrfToken = "c".repeat(43);
const legalAcceptance = Object.freeze({
  ...currentLegalContract,
  acceptedTerms: true as const,
  acknowledgedPrivacy: true as const,
  acceptedElectronicRecords: true as const,
});
const stripeTestConfig = Object.freeze({
  apiKey: "[REDACTED_SCANNER_LITERAL]",
  webhookSecret: "[REDACTED_SCANNER_LITERAL]",
  integrationEnvironment: "test",
  expectedAccountId: "acct_1U6B2RCxTlowhyiG",
  familyProductId: "prod_V6O8lAFbTCDmKd",
  familyPriceIds: Object.freeze({
    monthly: "price_1U6BMoCxTlowhyiG7qsmBrdY",
    annual: "price_1U6BMnCxTlowhyiGJEC1w596",
  }),
  checkoutSuccessUrl:
    "https://app.staging.rillora.xyz/account/billing/complete?session_id={CHECKOUT_SESSION_ID}",
  checkoutCancelUrl: "https://app.staging.rillora.xyz/account/billing",
  portalReturnUrl: "https://app.staging.rillora.xyz/account/billing",
});

const config: AppConfig = {
  nodeEnv: "test",
  host: "127.0.0.1",
  port: 4180,
  database: {
    connectionString: databaseUrl,
    sslMode: "disable",
    sslCaPath: null,
  },
  corsOrigins: new Set(["http://localhost:4173", "http://localhost:4174"]),
  allowDevAuth: true,
  allowSyntheticRecipientRehearsal: true,
  allowStripeTestIntegration: true,
  databasePoolMax: 5,
  databaseConnectionTimeoutMs: 5_000,
  trustProxyHops: 0,
  sessionTtlMinutes: 480,
  sessionIdleMinutes: 30,
  authTransactionTtlSeconds: 600,
  dataRegion: "eu-central-1",
  oidc: {
    issuerUrl: "https://identity.example",
    clientId: "continuity-test-client",
    clientSecret: "test-client-secret-that-is-not-production",
    redirectUri: "http://localhost:4173/api/auth/callback",
    webAppOrigin: "http://localhost:4173",
  },
  nativeOidc: {
    issuerUrl: "https://identity.example",
    clientId: "continuity-native-test-client",
    audience: "urn:rillora:api",
  },
  stripeTest: stripeTestConfig,
  appleSandbox: {
    rootCertificateDirectory: "/tmp/injected-apple-roots",
    integrationEnvironment: "test",
    serverApi: null,
  },
};

let stripeCurrentInvoiceReference = "in_phase1c_current";
const fakeStripeProvider: StripeCommerceProvider = {
  verifyWebhook(rawBody) {
    const event = JSON.parse(rawBody.toString("utf8")) as {
      id: string;
      type: string;
      commerceAccountReference: string;
      orderReference: string;
      paymentAttemptReference: string;
      customerReference: string;
      subscriptionReference?: string;
      checkoutReference?: string;
      chargeReference?: string;
      refundReference?: string;
    };
    return Object.freeze({
      provider: "stripe",
      providerEnvironment: "test",
      providerEventReference: event.id,
      sourceEventType: event.type,
      signalType: event.type.startsWith("refund.") ? "refund_changed" : "subscription_changed",
      occurredAt: "2026-08-20T01:00:00.000Z",
      providerSubscriptionReference: event.subscriptionReference ?? null,
      providerTransactionReference: event.checkoutReference ?? event.chargeReference ?? null,
      providerRefundReference: event.refundReference ?? null,
      commerceAccountReference: event.commerceAccountReference,
      providerCustomerReference: event.customerReference,
      orderReference: event.orderReference,
      paymentAttemptReference: event.paymentAttemptReference,
      payloadSha256: createHash("sha256").update(rawBody).digest("base64url"),
      signatureVerified: true,
      verificationMode: "stripe_sdk_webhook_signature",
      requiresAuthoritativeSnapshot: true,
    });
  },
  async createHostedSubscriptionCheckout() {
    return Object.freeze({
      sessionId: "cs_test_rillora_phase1c_001",
      url: "https://checkout.stripe.com/c/pay/cs_test_rillora_phase1c_001",
      expiresAt: "2026-08-20T02:00:00.000Z",
    });
  },
  async createCustomerPortal() {
    return Object.freeze({
      sessionId: "bps_test_rillora_phase1c_001",
      url: "https://billing.stripe.com/p/session/rillora-phase1c",
    });
  },
  async resolveFinancialSignal() {
    return Object.freeze({
      providerSubscriptionReference: "sub_rillora_phase1c_001",
      providerCustomerReference: "cus_rillora_phase1c_001",
      providerTransactionReference: "ch_rillora_phase1c_001",
      providerRefundReference: "re_rillora_phase1c_001",
      authoritativeStateOverride: "refunded" as const,
      providerInvoiceReference: "in_phase1c_current",
    });
  },
  async retrieveAuthoritativeSubscription(input) {
    return Object.freeze({
      provider: "stripe",
      providerEnvironment: "test",
      providerSubscriptionReference: input.providerSubscriptionReference,
      commerceAccountReference: input.expectedCommerceAccountReference,
      planCode: "family",
      state: "active",
      observedAt: "2026-08-20T01:00:01.000Z",
      currentPeriodStartsAt: "2026-08-20T01:00:00.000Z",
      currentPeriodEndsAt: "2026-09-20T01:00:00.000Z",
      cancelAtPeriodEnd: false,
      providerCustomerReference: input.expectedStripeCustomerReference,
      priceCode: "family_usd_annual_v1",
      source: "stripe_api",
      providerInvoiceReference: stripeCurrentInvoiceReference,
    });
  },
};

const fakeAppleVerifier: AppleSignedDataVerifying = {
  async verifyAndDecodeNotification(): Promise<ResponseBodyV2DecodedPayload> {
    return {
      notificationUUID: "apple-notification-intake-003",
      notificationType: "DID_RENEW",
      signedDate: Date.parse("2026-08-22T01:00:02.000Z"),
      data: {
        bundleId: "com.rillora.ios",
        environment: Environment.SANDBOX,
        signedTransactionInfo: "signed.apple.nested.transaction",
        signedRenewalInfo: "signed.apple.nested.renewal",
      },
    };
  },
  async verifyAndDecodeTransaction(): Promise<JWSTransactionDecodedPayload> {
    return {
      bundleId: "com.rillora.ios",
      environment: Environment.SANDBOX,
      originalTransactionId: "apple-original-intake-001",
      transactionId: "apple-transaction-intake-002",
      productId: "com.rillora.family.annual",
      subscriptionGroupIdentifier: "22325627",
      appAccountToken: developmentPlannerPublicId,
      storefront: "HKG",
      purchaseDate: Date.parse("2026-08-22T01:00:00.000Z"),
      signedDate: Date.parse("2026-08-22T01:00:01.000Z"),
    };
  },
  async verifyAndDecodeRenewalInfo(): Promise<JWSRenewalInfoDecodedPayload> {
    return {
      environment: Environment.SANDBOX,
      originalTransactionId: "apple-original-intake-001",
      productId: "com.rillora.family.annual",
      appAccountToken: developmentPlannerPublicId,
      signedDate: Date.parse("2026-08-22T01:00:02.000Z"),
    };
  },
};

const fakeAppleSnapshotProvider: StoreKitSandboxSnapshotProvider = {
  async retrieveAuthoritativeSubscription(input) {
    return Object.freeze({
      provider: "storekit",
      providerEnvironment: "sandbox",
      providerSubscriptionReference: input.providerSubscriptionReference,
      commerceAccountReference: input.expectedCommerceAccountReference,
      planCode: "family",
      state: "expired_read_only",
      observedAt: "2026-08-22T01:00:03.000Z",
      currentPeriodStartsAt: "2026-08-22T01:00:00.000Z",
      currentPeriodEndsAt: "2026-09-22T01:00:00.000Z",
      cancelAtPeriodEnd: false,
      priceCode: "family_usd_annual_v1",
      source: "app_store_server_api_signed_status",
    });
  },
};

const fakeIdentityProvider: IdentityProvider = {
  async createAuthorizationUrl(transaction, intent) {
    const url = new URL("https://identity.example/authorize");
    url.searchParams.set("state", transaction.state);
    if (intent?.screenHint) url.searchParams.set("screen_hint", intent.screenHint);
    return url;
  },
  async exchangeAuthorizationCode() {
    return {
      issuer: "https://identity.example",
      subject: "auth0|integration-test-planner",
      displayName: "OIDC Test Planner",
      locale: "en",
      authenticatedAt: new Date("2026-08-05T00:00:00.000Z"),
      authenticationMethods: ["passkey"],
    };
  },
};

const fakeNativeIdentityVerifier: NativeIdentityVerifier = {
  async verifyAccessToken() {
    return {
      issuer: "https://identity.example",
      subject: "auth0|native-integration-test-planner",
      displayName: "Native Test Planner",
      locale: "en",
      authenticatedAt: new Date("2026-08-09T00:00:00.000Z"),
      authenticationMethods: ["passkey"],
    };
  },
};

let pool: DatabasePool;
let app: ReturnType<typeof createApp>;
let secondPlannerMatterPublicId: string;

describe.sequential("Continuity API", () => {
  beforeAll(async () => {
    await assertDedicatedTestDatabase(databaseUrl, "continuity_test");
    await runMigrations(databaseUrl);
    pool = createPool(config);
    await pool.query(
      "truncate table app.commerce_provider_event_inbox, app.planners restart identity cascade",
    );
    await seedDevelopmentFixture(pool);
    secondPlannerMatterPublicId = await seedSecondPlanner(pool);
    await seedSession(pool);
    app = createApp(pool, config, {
      identityProvider: fakeIdentityProvider,
      nativeIdentityVerifier: fakeNativeIdentityVerifier,
      stripeProvider: fakeStripeProvider,
      appleSignedDataVerifier: fakeAppleVerifier,
    });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it("serves health checks with hardened headers", async () => {
    const response = await request(app).get("/health/live").expect(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");

    const readiness = await request(app).get("/health/ready").expect(200);
    expect(readiness.body).toEqual({ status: "ready" });
  });

  it("fails closed without an authenticated session", async () => {
    const response = await request(app).get("/v1/plan").expect(401);
    expect(response.body.error.code).toBe("authentication_required");
  });

  it("keeps the CloudFront same-origin aliases behind the same authentication boundary", async () => {
    const response = await request(app).get("/api/v1/plan").expect(401);
    expect(response.body.error.code).toBe("authentication_required");

    const login = await request(app)
      .post("/api/auth/start")
      .send({ intent: "signin", returnTo: "/", legalAcceptance })
      .expect(201);
    expect(login.body.authorizationUrl).toContain("https://identity.example/authorize");
  });

  it("reports browser session presence without turning signed-out public browsing into a 401", async () => {
    const signedOut = await request(app).get("/api/auth/session-status").expect(200);
    expect(signedOut.body).toEqual({ authenticated: false });

    const signedIn = await request(app)
      .get("/api/auth/session-status")
      .set("Cookie", `continuity_session=[REDACTED_COOKIE]
      .expect(200);
    expect(signedIn.body).toEqual({ authenticated: true });
  });

  it("exchanges an OIDC Code + PKCE transaction for an opaque local session", async () => {
    const agent = request.agent(app);
    const login = await agent
      .post("/auth/start")
      .send({ intent: "signin", returnTo: "/", legalAcceptance })
      .expect(201);
    const location = login.body.authorizationUrl as string | undefined;
    if (!location) throw new Error("OIDC authorization redirect was not returned");
    const authorizationUrl = new URL(location);
    const state = authorizationUrl.searchParams.get("state");
    expect(state).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    if (!state) throw new Error("OIDC authorization state was not returned");

    const callback = await agent
      .get(`/auth/callback?code=[REDACTED_CAPABILITY]&state=[REDACTED_CAPABILITY]
      .expect(303);
    expect(callback.headers.location).toBe("http://localhost:4173/");
    const setCookies = callback.headers["set-cookie"] as unknown as string[];
    expect(setCookies.some((value) => value.startsWith("continuity_session=") && value.includes("HttpOnly"))).toBe(true);
    const csrfCookie = setCookies.find((value) => value.startsWith("continuity_csrf="));
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).not.toContain("HttpOnly");
    const csrf = csrfCookie!.split(";", 1)[0]!.split("=", 2)[1]!;

    // A real cookie session needs CSRF and separately expiring test enrollment.
    for (const route of ["checkout", "portal", "checkout/cancel"]) {
      await agent.post(`/v1/commerce/test/${route}`).send({ billingPeriod: "annual" }).expect(403);
    }
    agent.set("x-rillora-planner", (await agent.get("/v1/session").expect(200)).body.plannerPublicId);
    const unregisteredTestBilling = await agent.post("/v1/commerce/test/checkout")
      .set("x-csrf-token", csrf).set("idempotency-key", "unenrolled-checkout-request-0001")
      .send({ billingPeriod: "annual" }).expect(403);
    expect(unregisteredTestBilling.body.error.code).toBe("test_billing_unavailable");

    const session = await agent.get("/v1/session").expect(200);
    expect(session.body.authenticationMode).toBe("session");
    expect(session.body.authenticationMethods).toEqual(["passkey"]);
    const acceptedContract = await agent.get("/v1/legal/acceptance").expect(200);
    expect(acceptedContract.body).toEqual(expect.objectContaining({
      required: true,
      developmentBypass: false,
      currentContract: currentLegalContract,
      acceptance: expect.objectContaining({
        termsVersion: currentLegalContract.termsVersion,
        privacyVersion: currentLegalContract.privacyVersion,
        bundleSha256: currentLegalContract.bundleSha256,
        clientSurface: "web",
      }),
    }));
    const acceptance = await pool.query<{
      terms_version: string;
      privacy_version: string;
      client_surface: string;
      accepted_terms: boolean;
    }>(
      `select terms_version, privacy_version, client_surface, accepted_terms
       from app.legal_acceptances acceptance
       join app.identity_accounts identity on identity.id = acceptance.identity_account_id
       where identity.issuer = $1 and identity.subject = $2`,
      ["https://identity.example", "auth0|integration-test-planner"],
    );
    expect(acceptance.rows).toEqual([expect.objectContaining({
      terms_version: currentLegalContract.termsVersion,
      privacy_version: currentLegalContract.privacyVersion,
      client_surface: "web",
      accepted_terms: true,
    })]);

    const plan = await agent.get("/v1/plan").expect(200);
    expect(plan.body.plan.firstUseState).toBe("available");
    expect(plan.body.plan.firstUseStep).toBe(0);
    const guided = await agent
      .patch("/v1/plan")
      .set("x-csrf-token", csrf)
      .send({
        expectedVersion: plan.body.plan.version,
        motivation: "general_preparedness",
        firstUseState: "guide_in_progress",
        firstUseStep: 1,
      })
      .expect(200);
    expect(guided.body.plan.firstUseState).toBe("guide_in_progress");
    expect(guided.body.plan.firstUseStep).toBe(1);

    await agent
      .post("/v1/matters")
      .set("x-csrf-token", csrf)
      .send({
        category: "document",
        title: "First safe locator",
        locationHint: "Blue folder",
        desiredOutcome: "undecided",
        status: "draft",
      })
      .expect(201);
    const completedFirstUse = await agent.get("/v1/plan").expect(200);
    expect(completedFirstUse.body.plan.firstUseState).toBe("completed");
    expect(completedFirstUse.body.plan.firstUseStep).toBe(2);
  });

  it("requires versioned clickwrap before opening sign in or registration", async () => {
    const contract = await request(app).get("/auth/legal-contract").expect(200);
    expect(contract.body).toEqual(expect.objectContaining({
      ...currentLegalContract,
      termsUrl: "https://legal.rillora.xyz/terms",
      privacyUrl: "https://legal.rillora.xyz/privacy",
      registrationRequiresAcceptance: true,
      recurringChargeRequiresSeparateConsent: true,
    }));

    const legacy = await request(app).get("/auth/login?returnTo=/").expect(428);
    expect(legacy.body.error.code).toBe("legal_acceptance_required");

    const signup = await request(app)
      .post("/auth/start")
      .send({ intent: "signup", returnTo: "/", legalAcceptance })
      .expect(201);
    expect(new URL(signup.body.authorizationUrl).searchParams.get("screen_hint")).toBe("signup");

    await request(app)
      .post("/auth/start")
      .send({ intent: "signup", returnTo: "/", legalAcceptance: {
        ...legalAcceptance,
        acceptedTerms: false,
      } })
      .expect(400);

    await request(app)
      .post("/auth/native/session")
      .set("Authorization", `Bearer ${"a".repeat(80)}`)
      .send({})
      .expect(400);
    const unprovisioned = await pool.query<{ count: string }>(
      `select count(*)::text as count
       from app.identity_accounts
       where issuer = $1 and subject = $2`,
      ["https://identity.example", "auth0|native-integration-test-planner"],
    );
    expect(unprovisioned.rows[0]?.count).toBe("0");

    await request(app)
      .post("/auth/start")
      .send({ intent: "select_account", returnTo: "/", legalAcceptance })
      .expect(400);
  });

  it("rejects a historical session that has no current legal acceptance", async () => {
    const legacyToken = "l".repeat(43);
    await pool.query(
      `insert into app.auth_sessions (
         planner_id, token_hash, csrf_token_hash, credential_kind, expires_at
       )
       select id, $2, $3, 'browser_cookie', now() + interval '1 hour'
       from app.planners where public_id = $1`,
      [secondPlannerPublicId, digest(legacyToken), digest("x".repeat(43))],
    );
    await request(app)
      .get("/v1/session")
      .set("Cookie", `continuity_session=[REDACTED_COOKIE]
      .expect(401);
    const status = await request(app)
      .get("/auth/session-status")
      .set("Cookie", `continuity_session=[REDACTED_COOKIE]
      .expect(200);
    expect(status.body).toEqual({ authenticated: false });
  });

  it("retains minimal agreement evidence without retaining a deleted private map", async () => {
    const reference = digest("https://identity.example\u001fauth0|deletion-proof");
    const created = await pool.query<{ public_id: string; planner_id: string }>(
      `with planner as (
         insert into app.planners (display_name)
         values ('Deletion Proof')
         returning id
       ), identity as (
         insert into app.identity_accounts (planner_id, issuer, subject)
         select id, 'https://identity.example', 'auth0|deletion-proof' from planner
         returning id, planner_id
       )
       insert into app.legal_acceptances (
         planner_id, identity_account_id, identity_reference_sha256,
         terms_version, privacy_version, consent_text_version,
         legal_bundle_sha256, accepted_terms, acknowledged_privacy,
         accepted_electronic_records, client_surface
       )
       select planner_id, id, $1, $2, $3, $4, $5, true, true, true, 'web'
       from identity
       returning public_id, planner_id::text`,
      [
        reference,
        currentLegalContract.termsVersion,
        currentLegalContract.privacyVersion,
        currentLegalContract.consentTextVersion,
        Buffer.from(currentLegalContract.bundleSha256, "hex"),
      ],
    );
    await pool.query("delete from app.planners where id = $1", [created.rows[0]!.planner_id]);
    const retained = await pool.query<{
      planner_id: string | null;
      identity_account_id: string | null;
      digest_length: number;
    }>(
      `select planner_id::text, identity_account_id::text,
              octet_length(identity_reference_sha256) as digest_length
       from app.legal_acceptances where public_id = $1`,
      [created.rows[0]!.public_id],
    );
    expect(retained.rows).toEqual([{
      planner_id: null,
      identity_account_id: null,
      digest_length: 32,
    }]);
  });

  it("exchanges a verified native access token for a typed opaque bearer session", async () => {
    const exchange = await request(app)
      .post("/auth/native/session")
      .set("Authorization", `Bearer ${"a".repeat(80)}`)
      .send({ legalAcceptance })
      .expect(201);
    expect(exchange.body.tokenType).toBe("Bearer");
    expect(exchange.body.sessionToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(exchange.body.expiresIn).toBe(28_800);
    expect(exchange.body.overview.session.plannerPublicId).toBe(exchange.body.plannerPublicId);
    expect(exchange.body.overview.session.authenticationMode).toBe("bearer");
    expect(exchange.body.overview.plan).toBeTruthy();
    expect(exchange.body.overview.matters).toEqual([]);

    const bearer = exchange.body.sessionToken as string;
    const session = await request(app)
      .get("/v1/session")
      .set("Authorization", `Bearer ${bearer}`)
      .expect(200);
    expect(session.body.authenticationMode).toBe("bearer");
    expect(session.body.authenticationMethods).toEqual(["passkey"]);

    await request(app)
      .post("/v1/simulations")
      .set("Authorization", `Bearer ${bearer}`)
      .send({ lifeEvent: "incapacity" })
      .expect(201);

    await request(app)
      .get("/v1/session")
      .set("Cookie", `continuity_session=[REDACTED_COOKIE]
      .expect(401);
    await request(app)
      .get("/v1/session")
      .set("Authorization", `Bearer ${sessionToken}`)
      .expect(401);
  });

  it("revokes every Rillora session for one planner without crossing planner boundaries", async () => {
    const firstExchange = await request(app)
      .post("/auth/native/session")
      .set("Authorization", `Bearer ${"a".repeat(80)}`)
      .send({ legalAcceptance })
      .expect(201);
    const secondExchange = await request(app)
      .post("/auth/native/session")
      .set("Authorization", `Bearer ${"a".repeat(80)}`)
      .send({ legalAcceptance })
      .expect(201);
    const firstBearer = firstExchange.body.sessionToken as string;
    const secondBearer = secondExchange.body.sessionToken as string;

    const revoked = await request(app)
      .post("/v1/auth/logout-all")
      .set("Authorization", `Bearer ${firstBearer}`)
      .expect(200);
    expect(revoked.body.revokedSessionCount).toBeGreaterThanOrEqual(2);
    expect(revoked.body.scope).toBe("rillora_sessions_only");
    expect(revoked.body.identityProviderSessionsRevoked).toBe(false);

    await request(app)
      .get("/v1/session")
      .set("Authorization", `Bearer ${firstBearer}`)
      .expect(401);
    await request(app)
      .get("/v1/session")
      .set("Authorization", `Bearer ${secondBearer}`)
      .expect(401);
    await request(app)
      .get("/v1/session")
      .set("Cookie", `continuity_session=[REDACTED_COOKIE]
      .expect(200);
  });

  it("does not present bulk session management as available to the development identity", async () => {
    const response = await asDevelopmentPlanner(
      request(app).post("/v1/auth/logout-all").send({}),
    ).expect(409);
    expect(response.body.error.code).toBe("session_management_unavailable");
  });

  it("rejects external OIDC return paths", async () => {
    const response = await request(app)
      .post("/auth/start")
      .send({
        intent: "signin",
        returnTo: "https://attacker.example",
        legalAcceptance,
      })
      .expect(400);
    expect(response.body.error.code).toBe("invalid_return_path");
  });

  it("returns the seeded plan and matters for the authenticated planner", async () => {
    const plan = await asDevelopmentPlanner(request(app).get("/v1/plan")).expect(200);
    expect(plan.body.plan.status).toBe("active");
    expect(plan.body.plan.policyVersion).toBe("mvp-2026-08-04");
    expect(plan.body.plan.firstUseState).toBe("completed");
    expect(plan.body.plan.firstUseStep).toBe(2);

    const matters = await asDevelopmentPlanner(request(app).get("/v1/matters")).expect(200);
    expect(matters.body.matters).toHaveLength(5);
    expect(matters.body.matters.map((matter: { title: string }) => matter.title)).toContain(
      "Bank account",
    );
  });

  it("ignores future and expired prices while a market remains closed", async () => {
    try {
      await pool.query(`insert into app.commerce_prices
        (price_code, plan_version_id, operator_code, service_market_code, amount_minor, currency_code, billing_interval, tax_behavior, status, effective_from, effective_to)
        select x.code, p.plan_version_id, p.operator_code, p.service_market_code, 12345, p.currency_code, p.billing_interval, p.tax_behavior, 'active', x.starts, x.ends
        from app.commerce_prices p cross join (values
          ('qa_future_price', now() + interval '1 day', null::timestamptz),
          ('qa_expired_price', now() - interval '2 days', now() - interval '1 day')
        ) x(code, starts, ends) where p.price_code = 'family_usd_annual_v4'`);
      const future = await asDevelopmentPlanner(request(app).get("/v1/commerce/status?serviceMarketCode=GLOBAL_US")).expect(200);
      expect(future.body.offers.map((offer: { priceCode: string }) => offer.priceCode).sort())
        .toEqual(["family_usd_annual_v4"]);
      await pool.query("update app.commerce_prices set effective_from = now() - interval '1 hour' where price_code = 'qa_future_price'");
      const active = await asDevelopmentPlanner(request(app).get("/v1/commerce/status?serviceMarketCode=GLOBAL_US")).expect(200);
      expect(active.body.offers.find((offer: { billingInterval: string }) => offer.billingInterval === "annual"))
        .toEqual(expect.objectContaining({ priceCode: "qa_future_price", status: "active", purchasable: false }));
      expect(active.body.billingOpen).toBe(false);
    } finally {
      await pool.query("delete from app.commerce_prices where price_code in ('qa_future_price','qa_expired_price')");
    }
  });

  it("exposes the provider-neutral catalog as disabled commercial state", async () => {
    const response = await asDevelopmentPlanner(
      request(app).get("/v1/commerce/status?serviceMarketCode=GLOBAL_US"),
    ).expect(200);

    expect(response.body.contractVersion).toBe("commerce-v1");
    expect(response.body.billingOpen).toBe(false);
    expect(response.body.currentAccess).toEqual(expect.objectContaining({
      planCode: "free",
      planVersion: 1,
      subscription: null,
      managementDestination: "none",
    }));
    expect(response.body.entitlements.map((item: { code: string }) => item.code)).toEqual(
      expect.arrayContaining(["security_controls", "data_export", "account_deletion"]),
    );
    expect(response.body.offers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        priceCode: "family_usd_annual_v4",
        planVersion: 2,
        amountMinor: 8899,
        currencyCode: "USD",
        billingInterval: "annual",
        status: "disabled_hypothesis",
        purchasable: false,
      }),
    ]));
    expect(response.body.offers).toHaveLength(1);
    const decision = JSON.parse(readFileSync(new URL("../../../config/product-catalog.json", import.meta.url), "utf8"));
    for (const interval of decision.availableBillingIntervals) {
      expect(response.body.offers.find((offer: { billingInterval: string }) => offer.billingInterval === interval))
        .toEqual(expect.objectContaining({ priceCode: decision[interval].priceCode, amountMinor: decision[interval].amountMinor, planVersion: decision.planVersion }));
    }
    const historicalPrices = await pool.query<{ price_code: string; amount_minor: string; status: string }>(
      `select price_code, amount_minor::text, status from app.commerce_prices
       where price_code in ('family_usd_monthly_v1','family_usd_annual_v1') order by price_code`,
    );
    const replacedAnnual = await pool.query("select amount_minor::text,status from app.commerce_prices where price_code='family_usd_annual_v3'");
    expect(replacedAnnual.rows).toEqual([{amount_minor:"8880",status:"retired"}]);
    expect((await pool.query("select count(*)::int as count from app.commerce_prices where price_code='family_usd_monthly_v4'")).rows[0].count).toBe(0);
    expect(historicalPrices.rows).toEqual([
      { price_code: "family_usd_annual_v1", amount_minor: "9900", status: "test_only" },
      { price_code: "family_usd_monthly_v1", amount_minor: "999", status: "retired" },
    ]);
    expect(response.body.boundaries).toEqual(expect.objectContaining({
      serverAuthoritative: true,
      providerCallbackGrantsAccess: false,
      clientPurchaseResultGrantsAccess: false,
      billingStateCanTriggerClaim: false,
      billingStateCanTriggerDisclosure: false,
      storefrontPersistedToCustomerProfile: false,
      oneActiveRenewalProviderPerHouseholdPlan: true,
    }));

    const stripeBindings = await pool.query<{
      external_product_reference: string;
      external_parent_product_reference: string;
      provider_account_reference: string;
      status: string;
    }>(
      `select external_product_reference, external_parent_product_reference,
              provider_account_reference, status
       from app.commerce_storefront_products
       where provider_code = 'stripe' and provider_environment = 'test'
       order by external_product_reference`,
    );
    expect(stripeBindings.rows).toEqual([
      {
        external_product_reference: "price_1U6BMnCxTlowhyiGJEC1w596",
        external_parent_product_reference: "prod_V6O8lAFbTCDmKd",
        provider_account_reference: "acct_1U6B2RCxTlowhyiG",
        status: "test_only",
      },
      {
        external_product_reference: "price_1U6BMoCxTlowhyiG7qsmBrdY",
        external_parent_product_reference: "prod_V6O8lAFbTCDmKd",
        provider_account_reference: "acct_1U6B2RCxTlowhyiG",
        status: "test_only",
      },
      {
        external_product_reference: "price_1UGKadCxTlowhyiGJ0bnY9Kn",
        external_parent_product_reference: "prod_V6O8lAFbTCDmKd",
        provider_account_reference: "acct_1U6B2RCxTlowhyiG",
        status: "test_only",
      },
      {
        external_product_reference: "price_1UGKXlCxTlowhyiGVLKAkfl1",
        external_parent_product_reference: "prod_V6O8lAFbTCDmKd",
        provider_account_reference: "acct_1U6B2RCxTlowhyiG",
        status: "test_only",
      },
      {
        external_product_reference: "price_1UHMkTCxTlowhyiGu3do5wps",
        external_parent_product_reference: "prod_V6O8lAFbTCDmKd",
        provider_account_reference: "acct_1U6B2RCxTlowhyiG",
        status: "test_only",
      },
      {
        external_product_reference: "price_1UHMlhCxTlowhyiGvBEPdb4x",
        external_parent_product_reference: "prod_V6O8lAFbTCDmKd",
        provider_account_reference: "acct_1U6B2RCxTlowhyiG",
        status: "test_only",
      },
      {
        external_product_reference: "price_1UJe38CxTlowhyiGdx5ypIKJ",
        external_parent_product_reference: "prod_V6O8lAFbTCDmKd",
        provider_account_reference: "acct_1U6B2RCxTlowhyiG",
        status: "test_only",
      },
    ]);
  });

  it("fails purchase routing closed while retaining the versioned US and mainland policies", async () => {
    const usIOS = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/purchase-route").send({
        clientSurface: "ios",
        serviceMarketCode: "GLOBAL_US",
        appleStorefrontCountryCode: "USA",
        intent: "plan_access",
      }),
    ).expect(200);
    expect(usIOS.body).toEqual(expect.objectContaining({
      purchaseRoute: "none",
      reason: "billing_closed",
      requiresFreshEvaluation: true,
      policy: expect.objectContaining({
        code: "global_us_ios_stripe_v1",
        version: 1,
        externalOfferAllowed: false,
      }),
    }));

    const mainlandIOS = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/purchase-route").send({
        clientSurface: "ios",
        serviceMarketCode: "MAINLAND_CN",
        appleStorefrontCountryCode: "CHN",
        intent: "family_capability",
      }),
    ).expect(200);
    expect(mainlandIOS.body).toEqual(expect.objectContaining({
      purchaseRoute: "none",
      reason: "billing_closed",
      policy: expect.objectContaining({ code: "mainland_cn_ios_storekit_v1", version: 1 }),
    }));

    const wrongStorefront = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/purchase-route").send({
        clientSurface: "ios",
        serviceMarketCode: "GLOBAL_US",
        appleStorefrontCountryCode: "CHN",
        intent: "plan_access",
      }),
    ).expect(200);
    expect(wrongStorefront.body).toEqual(expect.objectContaining({
      purchaseRoute: "none",
      reason: "storefront_not_eligible",
      policy: null,
    }));
  });

  it("keeps representative non-US Sandbox storefronts outside the US service market route", async () => {
    for (const appleStorefrontCountryCode of [
      "CAN",
      "GBR",
      "IRL",
      "JPN",
      "BRA",
      "KOR",
      "HKG",
    ]) {
      const response = await asDevelopmentPlanner(
        request(app).post("/v1/commerce/purchase-route").send({
          clientSurface: "ios",
          serviceMarketCode: "GLOBAL_US",
          appleStorefrontCountryCode,
          intent: "plan_access",
        }),
      ).expect(200);
      expect(response.body).toEqual(expect.objectContaining({
        purchaseRoute: "none",
        reason: "storefront_not_eligible",
        policy: null,
        requiresFreshEvaluation: true,
      }));
      expect(response.body.boundaries.storefrontPersistedToCustomerProfile).toBe(false);
    }
  });

  it("persists verified StoreKit client evidence without authorizing finish or access", async () => {
    const first = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/storekit/sandbox/transactions").send({
        signedTransaction: "signed.apple.sandbox.transaction",
        storefrontCountryCode: "HKG",
      }),
    ).expect(202);
    expect(first.body).toEqual({
      contractVersion: "commerce-storekit-sandbox-v1",
      result: {
        accepted: true,
        status: "needs_authoritative_snapshot",
        providerEventReference:
          "client-transaction:apple-transaction-intake-002",
        finishAuthorized: false,
        authoritativeSnapshotLoaded: false,
        entitlementChanged: false,
        sandboxOnly: true,
      },
      boundaries: {
        sandboxOnly: true,
        serverAuthoritative: true,
        authoritativeSnapshotLoaded: false,
        transactionFinishAuthorized: false,
        entitlementMutationEnabled: false,
        purchaseRouteEnabled: false,
      },
    });

    const duplicate = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/storekit/sandbox/transactions").send({
        signedTransaction: "signed.apple.sandbox.transaction",
        storefrontCountryCode: "HKG",
      }),
    ).expect(200);
    expect(duplicate.body.result.status).toBe("duplicate");
    expect(duplicate.body.result.finishAuthorized).toBe(false);

    const inbox = await pool.query<{
      account_binding_reference: string;
      commerce_account_reference: string;
      processing_status: string;
      attempt_count: number;
      last_error_code: string;
    }>(
      `select account_binding_reference::text, commerce_account_reference::text,
              processing_status, attempt_count, last_error_code
       from app.commerce_provider_event_inbox
       where provider_code = 'storekit'
         and provider_environment = 'sandbox'
         and provider_event_reference =
           'client-transaction:apple-transaction-intake-002'`,
    );
    expect(inbox.rows).toEqual([expect.objectContaining({
      account_binding_reference: developmentPlannerPublicId,
      processing_status: "needs_authoritative_snapshot",
      attempt_count: 1,
      last_error_code: "app_store_server_api_not_configured",
    })]);
    expect(inbox.rows[0]?.commerce_account_reference).not.toBe(
      developmentPlannerPublicId,
    );

    const links = await pool.query<{ provider_object_type: string }>(
      `select provider_object_type
       from app.commerce_provider_object_links
       where provider_code = 'storekit'
         and provider_environment = 'sandbox'
       order by provider_object_type`,
    );
    expect(links.rows.map((row) => row.provider_object_type)).toEqual([
      "original_transaction",
      "transaction",
    ]);
    const appliedEvents = await pool.query(
      `select 1 from app.commerce_provider_events
       where provider_code = 'storekit' and provider_environment = 'sandbox'`,
    );
    expect(appliedEvents.rowCount).toBe(0);

    const rejected = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/storekit/sandbox/transactions").send({
        signedTransaction: "signed.apple.sandbox.transaction",
        storefrontCountryCode: "CHN",
      }),
    ).expect(400);
    expect(rejected.body.error.code).toBe(
      "storekit_sandbox_transaction_rejected",
    );
  });

  it("accepts verified Sandbox notifications publicly but still waits for Server API", async () => {
    const first = await request(app)
      .post("/api/commerce/storekit/sandbox/notifications")
      .send({ signedPayload: "signed.apple.notification.payload" })
      .expect(202);
    expect(first.body).toEqual({
      contractVersion: "commerce-storekit-sandbox-notification-v1",
      result: {
        received: true,
        status: "needs_authoritative_snapshot",
        sandboxOnly: true,
      },
      boundaries: {
        sandboxOnly: true,
        authoritativeSnapshotLoaded: false,
        transactionFinishAuthorized: false,
        entitlementMutationEnabled: false,
      },
    });

    const duplicate = await request(app)
      .post("/api/commerce/storekit/sandbox/notifications")
      .send({ signedPayload: "signed.apple.notification.payload" })
      .expect(200);
    expect(duplicate.body.result.status).toBe("duplicate");

    const inbox = await pool.query<{
      account_binding_reference: string;
      commerce_account_reference: string;
      processing_status: string;
      attempt_count: number;
    }>(
      `select account_binding_reference::text, commerce_account_reference::text,
              processing_status, attempt_count
       from app.commerce_provider_event_inbox
       where provider_code = 'storekit'
         and provider_environment = 'sandbox'
         and provider_event_reference = 'apple-notification-intake-003'`,
    );
    expect(inbox.rows).toEqual([expect.objectContaining({
      account_binding_reference: developmentPlannerPublicId,
      processing_status: "needs_authoritative_snapshot",
      attempt_count: 1,
    })]);
    expect(inbox.rows[0]?.commerce_account_reference).toBeTruthy();

    const providerEvents = await pool.query(
      `select 1 from app.commerce_provider_events
       where provider_code = 'storekit' and provider_environment = 'sandbox'`,
    );
    expect(providerEvents.rowCount).toBe(0);

    const malformed = await request(app)
      .post("/api/commerce/storekit/sandbox/notifications")
      .send({ signedPayload: "" })
      .expect(400);
    expect(malformed.body.error.code).toBe("invalid_request");
  });

  it("retries a durable StoreKit signal through an authoritative snapshot before authorizing finish", async () => {
    const serverApiApp = createApp(pool, config, {
      identityProvider: fakeIdentityProvider,
      nativeIdentityVerifier: fakeNativeIdentityVerifier,
      stripeProvider: fakeStripeProvider,
      appleSignedDataVerifier: fakeAppleVerifier,
      appleSnapshotProvider: fakeAppleSnapshotProvider,
    });
    const applied = await asDevelopmentPlanner(
      request(serverApiApp).post("/v1/commerce/storekit/sandbox/transactions").send({
        signedTransaction: "signed.apple.sandbox.transaction",
        storefrontCountryCode: "HKG",
      }),
    ).expect(200);
    expect(applied.body).toEqual({
      contractVersion: "commerce-storekit-sandbox-v1",
      result: {
        accepted: true,
        status: "applied",
        providerEventReference: "client-transaction:apple-transaction-intake-002",
        finishAuthorized: true,
        authoritativeSnapshotLoaded: true,
        entitlementChanged: false,
        sandboxOnly: true,
      },
      boundaries: {
        sandboxOnly: true,
        serverAuthoritative: true,
        authoritativeSnapshotLoaded: true,
        transactionFinishAuthorized: true,
        entitlementMutationEnabled: false,
        purchaseRouteEnabled: false,
      },
    });

    const state = await pool.query<{
      subscription_state: string;
      processing_status: string;
      entitlement_mutation_applied: boolean;
    }>(
      `select subscription.state as subscription_state,
              inbox.processing_status,
              reconciliation.entitlement_mutation_applied
       from app.commerce_provider_event_inbox inbox
       join app.commerce_provider_events event
         on event.provider_code = inbox.provider_code
        and event.provider_environment = inbox.provider_environment
        and event.provider_event_reference = inbox.provider_event_reference
       join app.commerce_reconciliation_runs reconciliation
         on reconciliation.provider_event_id = event.id
       join app.commerce_subscriptions subscription
         on subscription.id = reconciliation.subscription_id
       where inbox.provider_code = 'storekit'
         and inbox.provider_environment = 'sandbox'
         and inbox.provider_event_reference =
           'client-transaction:apple-transaction-intake-002'`,
    );
    expect(state.rows).toEqual([{
      subscription_state: "expired_read_only",
      processing_status: "applied",
      entitlement_mutation_applied: false,
    }]);

    const duplicate = await asDevelopmentPlanner(
      request(serverApiApp).post("/v1/commerce/storekit/sandbox/transactions").send({
        signedTransaction: "signed.apple.sandbox.transaction",
        storefrontCountryCode: "HKG",
      }),
    ).expect(200);
    expect(duplicate.body.result).toMatchObject({
      status: "duplicate",
      finishAuthorized: true,
      authoritativeSnapshotLoaded: true,
      entitlementChanged: false,
    });
  });

  it("requires StoreKit storefront input only for the iOS routing surface", async () => {
    const missingStorefront = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/purchase-route").send({
        clientSurface: "ios",
        serviceMarketCode: "GLOBAL_US",
        intent: "plan_access",
      }),
    ).expect(400);
    expect(missingStorefront.body.error.code).toBe("invalid_request");

    const webWithStorefront = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/purchase-route").send({
        clientSurface: "web",
        serviceMarketCode: "GLOBAL_US",
        appleStorefrontCountryCode: "USA",
        intent: "plan_access",
      }),
    ).expect(400);
    expect(webWithStorefront.body.error.code).toBe("invalid_request");
  });

  it("prevents a second active Family renewal provider for the same commerce account", async () => {
    const fixture = await pool.query<{
      planner_id: string;
      plan_id: string;
      plan_version_id: string;
      free_plan_version_id: string;
      price_id: string;
    }>(
      `select planner.id::text as planner_id, plan.id::text as plan_id,
              plan_version.id::text as plan_version_id,
              free_plan_version.id::text as free_plan_version_id,
              price.id::text as price_id
       from app.planners planner
       join app.plans plan on plan.planner_id = planner.id
       join app.commerce_plan_versions plan_version
         on plan_version.plan_code = 'family' and plan_version.version = 1
       join app.commerce_plan_versions free_plan_version
         on free_plan_version.plan_code = 'free' and free_plan_version.version = 1
       join app.commerce_prices price
         on price.plan_version_id = plan_version.id
        and price.price_code = 'family_usd_monthly_v1'
       where planner.public_id = $1`,
      [developmentPlannerPublicId],
    );
    const row = fixture.rows[0]!;
    const account = await pool.query<{ id: string }>(
      `with inserted as (
         insert into app.commerce_accounts (
           planner_id, plan_id, operating_plane_code, service_market_code
         ) values ($1, $2, 'global', 'GLOBAL_US')
         on conflict (plan_id, operating_plane_code) do nothing
         returning id
       )
       select id::text from inserted
       union all
       select id::text from app.commerce_accounts
       where planner_id = $1 and plan_id = $2 and operating_plane_code = 'global'
       limit 1`,
      [row.planner_id, row.plan_id],
    );

    try {
      const subscription = await pool.query<{ id: string }>(
        `insert into app.commerce_subscriptions (
           planner_id, commerce_account_id, plan_version_id, plan_code, price_id,
           acquisition_type, renewal_provider, provider_environment, state
         ) values ($1, $2, $3, 'family', $4, 'migration', 'stripe', 'internal', 'active')
         returning id::text`,
        [row.planner_id, account.rows[0]!.id, row.plan_version_id, row.price_id],
      );

      await expect(pool.query(
        `insert into app.commerce_subscriptions (
           planner_id, commerce_account_id, plan_version_id, plan_code, price_id,
           acquisition_type, renewal_provider, provider_environment, state
         ) values ($1, $2, $3, 'family', $4, 'migration', 'storekit', 'internal', 'active')`,
        [row.planner_id, account.rows[0]!.id, row.plan_version_id, row.price_id],
      )).rejects.toMatchObject({ code: "23505" });

      await expect(pool.query(
        `insert into app.commerce_subscriptions (
           planner_id, commerce_account_id, plan_version_id, plan_code, price_id,
           acquisition_type, renewal_provider, provider_environment, state
         ) values ($1, $2, $3, 'free', $4, 'migration', 'stripe', 'internal', 'expired_read_only')`,
        [row.planner_id, account.rows[0]!.id, row.free_plan_version_id, row.price_id],
      )).rejects.toMatchObject({ code: "23503" });

      await pool.query(
        `insert into app.commerce_entitlement_grants (
           planner_id, commerce_account_id, capability_code, source_type,
           subscription_id, source_reference, effective_at
         ) values ($1, $2, 'household_coplanner', 'subscription', $3, 'synthetic-active-subscription', now())`,
        [row.planner_id, account.rows[0]!.id, subscription.rows[0]!.id],
      );
      const mainlandRoute = await asDevelopmentPlanner(
        request(app).post("/v1/commerce/purchase-route").send({
          clientSurface: "ios",
          serviceMarketCode: "MAINLAND_CN",
          appleStorefrontCountryCode: "CHN",
          intent: "plan_access",
        }),
      ).expect(200);
      expect(mainlandRoute.body).toEqual(expect.objectContaining({
        purchaseRoute: "none",
        reason: "billing_closed",
        activeSubscription: null,
      }));

      const mainlandStatus = await asDevelopmentPlanner(
        request(app).get("/v1/commerce/status?serviceMarketCode=MAINLAND_CN"),
      ).expect(200);
      expect(mainlandStatus.body.currentAccess).toEqual(expect.objectContaining({
        planCode: "free",
        subscription: null,
      }));
      expect(mainlandStatus.body.entitlements).not.toContainEqual(expect.objectContaining({
        code: "household_coplanner",
      }));

      const activeStatus = await asDevelopmentPlanner(
        request(app).get("/v1/commerce/status?serviceMarketCode=GLOBAL_US"),
      ).expect(200);
      expect(activeStatus.body.entitlements).toContainEqual(expect.objectContaining({
        code: "household_coplanner",
        source: "subscription",
      }));

      await pool.query(
        `update app.commerce_subscriptions set state = 'expired_read_only' where id = $1`,
        [subscription.rows[0]!.id],
      );
      const expiredStatus = await asDevelopmentPlanner(
        request(app).get("/v1/commerce/status?serviceMarketCode=GLOBAL_US"),
      ).expect(200);
      expect(expiredStatus.body.entitlements).not.toContainEqual(expect.objectContaining({
        code: "household_coplanner",
      }));
    } finally {
      await pool.query("delete from app.commerce_accounts where id = $1", [account.rows[0]!.id]);
    }
  });

  it("reuses an unfinished annual checkout and rejects retired monthly purchases before provider work", async () => {
    let created = 0;
    let setupUnavailable = true;
    let loseFirstProviderResponse = true;
    const providerSessions = new Map<string, string>();
    const expired: string[] = [];
    const hosted = (id: string) => ({ sessionId: id, url: `https://checkout.stripe.com/c/pay/${id}`, expiresAt: null });
    const guarded = createApp(pool, config, { identityProvider: fakeIdentityProvider,
      nativeIdentityVerifier: fakeNativeIdentityVerifier, appleSignedDataVerifier: fakeAppleVerifier,
      appleSnapshotProvider: fakeAppleSnapshotProvider, stripeProvider: {
      ...fakeStripeProvider,
      async assertCheckoutReady() { if(setupUnavailable)throw new ApiError(503,"checkout_setup_unavailable","Temporarily unavailable."); },
      async createHostedSubscriptionCheckout(input) {
        if(!providerSessions.has(input.idempotencyKey))providerSessions.set(input.idempotencyKey,`cs_test_guard_${++created}`);
        if(loseFirstProviderResponse){loseFirstProviderResponse=false;throw new Error("Synthetic lost provider response after creating a session");}
        return hosted(providerSessions.get(input.idempotencyKey)!);
      },
      async retrieveHostedCheckout(id) { return hosted(id); },
      async expireHostedCheckout(id) { expired.push(id); },
    } });
    const checkout = (period: string, seed: string) => asDevelopmentPlanner(request(guarded)
      .post("/v1/commerce/test/checkout").set("idempotency-key", seed).send({ billingPeriod: period }));
    try {
      const retired = await checkout("monthly", "guard-checkout-retired-monthly").expect(409);
      expect(retired.body.error.code).toBe("billing_period_unavailable");
      expect(created).toBe(0);
      const unavailable = await checkout("annual", "guard-checkout-setup-failure").expect(503);
      expect(unavailable.body.error.code).toBe("checkout_setup_unavailable");
      expect((await pool.query("select count(*)::int n from app.commerce_orders where planner_id=(select id from app.planners where public_id=$1)",[developmentPlannerPublicId])).rows[0].n).toBe(0);
      setupUnavailable = false;
      await checkout("annual", "guard-checkout-annual-uncertain").expect(500);
      setupUnavailable = true;
      await checkout("annual", "guard-checkout-annual-later-preflight").expect(503);
      expect((await pool.query("select count(*)::int n from app.commerce_orders where planner_id=(select id from app.planners where public_id=$1)",[developmentPlannerPublicId])).rows[0].n).toBe(1);
      setupUnavailable = false;
      const first = await checkout("annual", "guard-checkout-annual-first").expect(201);
      const next = await checkout("annual", "guard-checkout-annual-double").expect(201);
      expect(next.body.checkout.sessionId).toBe(first.body.checkout.sessionId);
      expect(created).toBe(1);
      const changed = await checkout("monthly", "guard-checkout-monthly-first").expect(409);
      expect(changed.body.error.code).toBe("billing_period_unavailable");
      await asDevelopmentPlanner(request(guarded).post("/v1/commerce/test/checkout/cancel").send({})).expect(200);
      expect(expired).toEqual([first.body.checkout.sessionId]);
      await checkout("monthly", "guard-checkout-monthly-after").expect(409);
      const annual = await checkout("annual", "guard-checkout-annual-after").expect(201);
      expect(annual.body.checkout.sessionId).not.toBe(first.body.checkout.sessionId);
      expect(created).toBe(2);
    } finally {
      await pool.query("delete from app.commerce_accounts where planner_id=(select id from app.planners where public_id=$1)",[developmentPlannerPublicId]);
    }
  });

  it("persists and reconciles the disabled Stripe test Checkout without granting Family access", async () => {
    const checkout = await asDevelopmentPlanner(
      request(app)
        .post("/v1/commerce/test/checkout")
        .set("idempotency-key", "phase1c-checkout-request-0001")
        .send({ billingPeriod: "annual" }),
    ).expect(201);
    expect(checkout.body).toEqual(expect.objectContaining({
      contractVersion: "commerce-stripe-test-v1",
      checkout: expect.objectContaining({
        sessionId: "cs_test_rillora_phase1c_001",
        testOnly: true,
        salesEnabled: false,
        orderReference: expect.stringMatching(/^[0-9a-f-]{36}$/),
        paymentAttemptReference: expect.stringMatching(/^[0-9a-f-]{36}$/),
      }),
      boundaries: expect.objectContaining({
        salesEnabled: false,
        purchaseRouteEnabled: false,
        callbackGrantsAccess: false,
        entitlementMutationEnabled: false,
      }),
    }));

    const retry = await asDevelopmentPlanner(
      request(app)
        .post("/v1/commerce/test/checkout")
        .set("idempotency-key", "phase1c-checkout-request-0001")
        .send({ billingPeriod: "annual" }),
    ).expect(201);
    expect(retry.body.checkout.orderReference).toBe(checkout.body.checkout.orderReference);
    expect(retry.body.checkout.paymentAttemptReference)
      .toBe(checkout.body.checkout.paymentAttemptReference);

    const account = await pool.query<{ public_id: string }>(
      `select account.public_id::text
       from app.commerce_accounts account
       join app.planners planner on planner.id = account.planner_id
       where planner.public_id = $1 and account.service_market_code = 'GLOBAL_US'`,
      [developmentPlannerPublicId],
    );
    const payload = JSON.stringify({
      id: "evt_rillora_phase1c_checkout_001",
      type: "checkout.session.completed",
      commerceAccountReference: account.rows[0]!.public_id,
      orderReference: checkout.body.checkout.orderReference,
      paymentAttemptReference: checkout.body.checkout.paymentAttemptReference,
      customerReference: "cus_rillora_phase1c_001",
      subscriptionReference: "sub_rillora_phase1c_001",
      checkoutReference: "cs_test_rillora_phase1c_001",
    });
    const webhook = await request(app)
      .post("/api/commerce/stripe/webhook")
      .set("content-type", "application/json")
      .set("stripe-signature", "t=1,v1=fixture")
      .send(payload)
      .expect(200);
    expect(webhook.body).toEqual({ received: true, status: "applied", testOnly: true });

    const duplicate = await request(app)
      .post("/api/commerce/stripe/webhook")
      .set("content-type", "application/json")
      .set("stripe-signature", "t=1,v1=fixture")
      .send(payload)
      .expect(200);
    expect(duplicate.body).toEqual({ received: true, status: "duplicate", testOnly: true });

    const testStatus = await asDevelopmentPlanner(
      request(app).get("/v1/commerce/test/status"),
    ).expect(200);
    expect(testStatus.body).toEqual(expect.objectContaining({
      testOnly: true,
      billingOpen: false,
      salesEnabled: false,
      entitlementMutationEnabled: false,
      orders: [expect.objectContaining({ status: "paid_reconciled" })],
      subscriptions: [expect.objectContaining({ state: "active" })],
      events: [expect.objectContaining({
        eventType: "checkout.session.completed",
        processingStatus: "applied",
      })],
      reconciliations: [expect.objectContaining({
        directive: "grant",
        targetState: "active",
        entitlementMutationApplied: false,
      })],
    }));

    const ordinaryStatus = await asDevelopmentPlanner(
      request(app).get("/v1/commerce/status?serviceMarketCode=GLOBAL_US"),
    ).expect(200);
    expect(ordinaryStatus.body.billingOpen).toBe(false);
    expect(ordinaryStatus.body.currentAccess).toEqual(expect.objectContaining({
      planCode: "free",
      subscription: null,
    }));
    expect(ordinaryStatus.body.entitlements).not.toContainEqual(expect.objectContaining({
      code: "household_coplanner",
    }));

    const portal = await asDevelopmentPlanner(
      request(app).post("/v1/commerce/test/portal").send({}),
    ).expect(201);
    expect(portal.body.portal).toEqual(expect.objectContaining({
      sessionId: "bps_test_rillora_phase1c_001",
      testOnly: true,
    }));

    const blockedSecond = await asDevelopmentPlanner(request(app).post("/v1/commerce/test/checkout")
      .set("idempotency-key", "phase1c-second-subscription-blocked").send({ billingPeriod: "annual" })).expect(409);
    expect(blockedSecond.body.error.code).toBe("existing_subscription");

    const refundPayload = JSON.stringify({
      id: "evt_rillora_phase1c_refund_001",
      type: "refund.created",
      commerceAccountReference: null,
      orderReference: checkout.body.checkout.orderReference,
      paymentAttemptReference: checkout.body.checkout.paymentAttemptReference,
      customerReference: null,
      chargeReference: "ch_rillora_phase1c_001",
      refundReference: "re_rillora_phase1c_001",
    });
    const refundWebhook = await request(app)
      .post("/api/commerce/stripe/webhook")
      .set("content-type", "application/json")
      .set("stripe-signature", "t=1,v1=fixture")
      .send(refundPayload)
      .expect(200);
    expect(refundWebhook.body).toEqual({ received: true, status: "applied", testOnly: true });

    const refundedStatus = await asDevelopmentPlanner(
      request(app).get("/v1/commerce/test/status"),
    ).expect(200);
    expect(refundedStatus.body.subscriptions[0]).toEqual(expect.objectContaining({
      state: "refunded",
      cancelAtPeriodEnd: false,
    }));
    expect(refundedStatus.body.events[0]).toEqual(expect.objectContaining({
      eventType: "refund.created",
      processingStatus: "applied",
    }));
    expect(refundedStatus.body.reconciliations[0]).toEqual(expect.objectContaining({
      directive: "revoke",
      targetState: "refunded",
      entitlementMutationApplied: false,
    }));

    // A stale refund for the previous invoice cannot revoke a newly paid invoice.
    stripeCurrentInvoiceReference = "in_phase1c_new_paid_period";
    const oldRefund = { ...JSON.parse(refundPayload), id: "evt_old_period_refund_arrived_late" };
    await request(app).post("/api/commerce/stripe/webhook").set("content-type", "application/json")
      .set("stripe-signature", "t=1,v1=fixture").send(JSON.stringify(oldRefund)).expect(200);
    const afterOldRefund = await asDevelopmentPlanner(request(app).get("/v1/commerce/test/status")).expect(200);
    expect(afterOldRefund.body.subscriptions[0].state).toBe("active");
    // Duplicate delivery of the earlier, once-valid refund remains a no-op.
    await request(app).post("/api/commerce/stripe/webhook").set("content-type", "application/json")
      .set("stripe-signature", "t=1,v1=fixture").send(refundPayload).expect(200);
    expect((await asDevelopmentPlanner(request(app).get("/v1/commerce/test/status"))).body.subscriptions[0].state).toBe("active");

    const inboxColumns = await pool.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_schema = 'app' and table_name = 'commerce_provider_event_inbox'`,
    );
    expect(inboxColumns.rows.map((row) => row.column_name)).not.toEqual(
      expect.arrayContaining(["raw_body", "payload", "customer_email"]),
    );
  });

  it("keeps the ordinary app role out of the provider inbox and the commerce role out of entitlements", async () => {
    const planner = await pool.query<{ id: string }>(
      "select id::text from app.planners where public_id = $1",
      [developmentPlannerPublicId],
    );
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local role continuity_app");
      await expect(client.query(
        `insert into app.commerce_provider_event_inbox (
           provider_code, provider_environment, provider_event_reference,
           event_type, signal_type, payload_sha256, signature_verified,
           provider_occurred_at
         ) values ('stripe', 'test', 'evt_forbidden_app_role',
                   'checkout.session.completed', 'subscription_changed',
                   decode(repeat('00', 32), 'hex'), true, now())`,
      )).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback");

      await client.query("begin");
      await client.query("set local role continuity_commerce");
      await client.query("select set_config('app.current_planner_id', $1, true)", [
        planner.rows[0]!.id,
      ]);
      await expect(client.query(
        `insert into app.commerce_entitlement_grants (
           planner_id, commerce_account_id, capability_code, source_type,
           source_reference, effective_at
         ) select app.current_planner_id(), account.id, 'household_coplanner',
                  'manual_override', 'forbidden-test-grant', now()
           from app.commerce_accounts account
          where account.planner_id = app.current_planner_id()
          limit 1`,
      )).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback");
    } finally {
      client.release();
    }
  });

  it("rejects dedicated high-risk secret fields", async () => {
    const response = await asDevelopmentPlanner(
      request(app).post("/v1/matters").send({
        category: "account",
        title: "Unsafe record",
        password: "must-not-be-stored",
      }),
    ).expect(400);
    expect(response.body.error.code).toBe("high_risk_secret_rejected");
  });

  it("rejects partial or inconsistent first-use state updates", async () => {
    const plan = await asDevelopmentPlanner(request(app).get("/v1/plan")).expect(200);
    await asDevelopmentPlanner(
      request(app).patch("/v1/plan").send({
        expectedVersion: plan.body.plan.version,
        firstUseState: "guide_in_progress",
      }),
    ).expect(400);
    await asDevelopmentPlanner(
      request(app).patch("/v1/plan").send({
        expectedVersion: plan.body.plan.version,
        firstUseState: "available",
        firstUseStep: 2,
      }),
    ).expect(400);
  });

  it("creates a matter and appends a content-minimised audit event", async () => {
    const created = await asDevelopmentPlanner(
      request(app).post("/v1/matters").send({
        category: "debt",
        title: "Student loan",
        institutionName: "Example Lender",
        accountHint: "ending 42",
        desiredOutcome: "notify",
        status: "ready",
      }),
    ).expect(201);
    expect(created.body.matter.title).toBe("Student loan");

    const audit = await asDevelopmentPlanner(request(app).get("/v1/audit-events")).expect(200);
    const event = audit.body.auditEvents.find(
      (candidate: { resourcePublicId: string }) =>
        candidate.resourcePublicId === created.body.matter.publicId,
    );
    expect(event.action).toBe("matter.created");
    expect(JSON.stringify(event.metadata)).not.toContain("Student loan");
    expect(JSON.stringify(event.metadata)).not.toContain("ending 42");
  });

  it("creates a trusted-contact record and revokes its role and invitation together", async () => {
    const created = await asDevelopmentPlanner(
      request(app).post("/v1/trusted-contacts").send({
        displayName: "Test Contact",
        relationshipLabel: "Friend",
      }),
    ).expect(201);
    expect(created.body.trustedContact.status).toBe("draft");
    expect(created.body.trustedContact.roleStatus).toBe("draft");
    expect(created.body.trustedContact.invitationStatus).toBeNull();

    await asDevelopmentPlanner(
      request(app).post("/v1/role-assignments").send({
        personPublicId: created.body.trustedContact.publicId,
        role: "executor",
        scope: "plan_wide",
        matterPublicId: null,
        acknowledgesRecordOnly: true,
        acknowledgesNoAuthority: true,
      }),
    ).expect(201);

    await pool.query(
      `insert into app.invitations (
         planner_id, person_id, role_assignment_id, delivery_channel, status
       )
       select p.planner_id, p.id, ra.id, 'simulation', 'pending'
       from app.people p
       join app.role_assignments ra on ra.person_id = p.id and ra.role = 'trusted_contact'
       where p.public_id = $1`,
      [created.body.trustedContact.publicId],
    );

    const revoked = await asDevelopmentPlanner(
      request(app)
        .patch(`/v1/trusted-contacts/${created.body.trustedContact.publicId}`)
        .send({
          expectedVersion: created.body.trustedContact.version,
          displayName: "Updated Test Contact",
          relationshipLabel: null,
          status: "revoked",
        }),
    ).expect(200);
    expect(revoked.body.trustedContact.displayName).toBe("Updated Test Contact");
    expect(revoked.body.trustedContact.relationshipLabel).toBeNull();
    expect(revoked.body.trustedContact.status).toBe("revoked");
    expect(revoked.body.trustedContact.roleStatus).toBe("revoked");
    expect(revoked.body.trustedContact.invitationStatus).toBe("revoked");
    expect(revoked.body.trustedContact.confirmationMode).toBe("simulation");
    const revokedRoles = await pool.query<{ role: string; status: string; version: number }>(
      `select ra.role, ra.status, ra.version
       from app.role_assignments ra
       join app.people p on p.id = ra.person_id and p.planner_id = ra.planner_id
       where p.public_id = $1
       order by ra.role`,
      [created.body.trustedContact.publicId],
    );
    expect(revokedRoles.rows).toEqual([
      { role: "executor", status: "revoked", version: 2 },
      { role: "trusted_contact", status: "revoked", version: 2 },
    ]);
  });

  it("records official setup only as a reversible planner self-report", async () => {
    const checks = await asDevelopmentPlanner(
      request(app).get("/v1/official-setup-checks"),
    ).expect(200);
    const apple = checks.body.officialSetupChecks.find(
      (candidate: { providerKey: string }) => candidate.providerKey === "apple",
    );
    expect(apple.completed).toBe(false);

    const completed = await asDevelopmentPlanner(
      request(app)
        .patch(`/v1/official-setup-checks/${apple.publicId}`)
        .send({ expectedVersion: apple.version, completed: true }),
    ).expect(200);
    expect(completed.body.evidence).toBe("self_reported");
    expect(completed.body.officialSetupCheck.completed).toBe(true);
    expect(completed.body.officialSetupCheck.completedAt).not.toBeNull();

    const restored = await asDevelopmentPlanner(
      request(app)
        .patch(`/v1/official-setup-checks/${apple.publicId}`)
        .send({
          expectedVersion: completed.body.officialSetupCheck.version,
          completed: false,
        }),
    ).expect(200);
    expect(restored.body.evidence).toBe("self_reported");
    expect(restored.body.officialSetupCheck.completed).toBe(false);
    expect(restored.body.officialSetupCheck.completedAt).toBeNull();
  });

  it("does not reveal whether another planner's object exists", async () => {
    const response = await asDevelopmentPlanner(
      request(app).get(`/v1/matters/${secondPlannerMatterPublicId}`),
    ).expect(404);
    expect(response.body.error.code).toBe("matter_not_found");
  });

  it("enforces tenant isolation at the PostgreSQL RLS boundary", async () => {
    const client = await pool.connect();
    try {
      const planner = await client.query<{ id: string }>(
        "select id::text from app.planners where public_id = $1",
        [developmentPlannerPublicId],
      );
      await client.query("begin");
      await client.query("set local role continuity_app");
      await client.query("select set_config('app.current_planner_id', $1, true)", [planner.rows[0]!.id]);
      const visible = await client.query<{ title: string }>("select title from app.matter_items");
      await client.query("commit");
      expect(visible.rows.map((row) => row.title)).not.toContain("Other planner private matter");
    } finally {
      client.release();
    }
  });

  it("does not grant the runtime role permission to rewrite audit history", async () => {
    const client = await pool.connect();
    try {
      const planner = await client.query<{ id: string }>(
        "select id::text from app.planners where public_id = $1",
        [developmentPlannerPublicId],
      );
      await client.query("begin");
      await client.query("set local role continuity_app");
      await client.query("select set_config('app.current_planner_id', $1, true)", [planner.rows[0]!.id]);
      await expect(
        client.query("update app.audit_events set action = 'rewritten'"),
      ).rejects.toMatchObject({ code: "42501" });
      await client.query("rollback");
    } finally {
      client.release();
    }
  });

  it("keeps authentication writes limited to the required columns", async () => {
    const result = await pool.query<{
      can_delete_transaction: boolean;
      can_select_whole_transaction: boolean;
      can_read_verifier: boolean;
      can_rewrite_verifier: boolean;
      can_consume_transaction: boolean;
      can_insert_revoked_session: boolean;
      can_insert_legal_acceptance: boolean;
      can_update_legal_acceptance: boolean;
      can_delete_legal_acceptance: boolean;
    }>(
      `select
         has_table_privilege('continuity_auth', 'app.auth_transactions', 'DELETE')
           as can_delete_transaction,
         has_table_privilege('continuity_auth', 'app.auth_transactions', 'SELECT')
           as can_select_whole_transaction,
         has_column_privilege('continuity_auth', 'app.auth_transactions', 'code_verifier', 'SELECT')
           as can_read_verifier,
         has_column_privilege('continuity_auth', 'app.auth_transactions', 'code_verifier', 'UPDATE')
           as can_rewrite_verifier,
         has_column_privilege('continuity_auth', 'app.auth_transactions', 'consumed_at', 'UPDATE')
           as can_consume_transaction,
         has_column_privilege('continuity_auth', 'app.auth_sessions', 'revoked_at', 'INSERT')
           as can_insert_revoked_session,
         has_table_privilege('continuity_auth', 'app.legal_acceptances', 'INSERT')
           as can_insert_legal_acceptance,
         has_table_privilege('continuity_auth', 'app.legal_acceptances', 'UPDATE')
           as can_update_legal_acceptance,
         has_table_privilege('continuity_auth', 'app.legal_acceptances', 'DELETE')
           as can_delete_legal_acceptance`,
    );
    expect(result.rows[0]).toEqual({
      can_delete_transaction: false,
      can_select_whole_transaction: false,
      can_read_verifier: true,
      can_rewrite_verifier: false,
      can_consume_transaction: true,
      can_insert_revoked_session: false,
      can_insert_legal_acceptance: true,
      can_update_legal_acceptance: false,
      can_delete_legal_acceptance: false,
    });
  });

  it("uses optimistic versions to prevent lost updates", async () => {
    const matters = await asDevelopmentPlanner(request(app).get("/v1/matters")).expect(200);
    const target = matters.body.matters[0];
    await asDevelopmentPlanner(
      request(app).patch(`/v1/matters/${target.publicId}`).send({
        expectedVersion: target.version,
        status: "needs_review",
      }),
    ).expect(200);
    const conflict = await asDevelopmentPlanner(
      request(app).patch(`/v1/matters/${target.publicId}`).send({
        expectedVersion: target.version,
        status: "ready",
      }),
    ).expect(409);
    expect(conflict.body.error.code).toBe("version_conflict");
  });

  it("requires CSRF proof for cookie-authenticated state changes", async () => {
    await request(app)
      .post("/v1/simulations")
      .set("Cookie", `continuity_session=[REDACTED_COOKIE]
      .send({ lifeEvent: "death" })
      .expect(403);

    const simulation = await request(app)
      .post("/v1/simulations")
      .set("Cookie", `continuity_session=[REDACTED_COOKIE]
      .set("x-csrf-token", csrfToken).set("x-rillora-planner", developmentPlannerPublicId)
      .send({ lifeEvent: "death" })
      .expect(201);
    expect(simulation.body.simulation.simulationOnly).toBe(true);
    expect(simulation.body.simulation.notificationsSent).toBe(false);
    expect(simulation.body.simulation.dataReleased).toBe(false);
  });

  it("keeps death, incapacity, and missing disclosure rehearsals separate and non-operative", async () => {
    const rehearsals = new Map<string, Record<string, unknown>>();
    for (const lifeEvent of ["death", "incapacity", "missing"] as const) {
      const response = await asDevelopmentPlanner(
        request(app).post("/v1/disclosure-rehearsals").send({ lifeEvent }),
      ).expect(201);
      rehearsals.set(lifeEvent, response.body.disclosureRehearsal);
      expect(response.body.boundaries).toEqual({
        simulationOnly: true,
        operative: false,
        identityVerified: false,
        documentsVerified: false,
        multiPartyVerified: false,
        notificationsSent: false,
        dataReleased: false,
        releaseAvailable: false,
        legalAuthorityGranted: false,
      });
      expect(response.body.disclosureRehearsal.boundaries).toEqual(response.body.boundaries);
      expect(response.body.disclosureRehearsal.snapshot.operative).toBe(false);
      expect(response.body.disclosureRehearsal.completedCheckpoints).toEqual([
        expect.objectContaining({ realEvidenceCollected: false }),
      ]);
    }

    expect(rehearsals.get("death")?.state).toBe("death_claim_opened");
    expect(rehearsals.get("incapacity")?.state).toBe("incapacity_claim_opened");
    expect(rehearsals.get("missing")?.state).toBe("missing_report_opened");

    const deathViews = rehearsals.get("death")?.projectedRoleViews as Array<Record<string, unknown>>;
    const deathTrustedContact = deathViews.find((view) => view.role === "trusted_contact")!;
    expect(deathTrustedContact.fieldPolicy).toEqual([
      "matter.title", "matter.category", "matter.desiredOutcome",
    ]);
    expect(JSON.stringify(deathTrustedContact)).not.toContain("institutionName");
    expect(JSON.stringify(deathTrustedContact)).not.toMatch(/accountHint|valueBand|currency|password/i);

    const incapacityViews = rehearsals.get("incapacity")?.projectedRoleViews as Array<Record<string, unknown>>;
    expect(incapacityViews.find((view) => view.role === "executor")).toEqual(
      expect.objectContaining({ eligibleForProjectedPreview: false, matters: [] }),
    );
    expect(incapacityViews.find((view) => view.role === "recipient")).toEqual(
      expect.objectContaining({ eligibleForProjectedPreview: false, matters: [] }),
    );

    const missingViews = rehearsals.get("missing")?.projectedRoleViews as Array<Record<string, unknown>>;
    const missingTrustedContact = missingViews.find((view) => view.role === "trusted_contact")!;
    expect(missingTrustedContact.fieldPolicy).toEqual([
      "planner.displayName", "planner.timeZone", "plan.matterCount",
    ]);
    expect(missingTrustedContact.matters).toEqual([]);
    expect((missingTrustedContact.summary as { matterCount: number }).matterCount).toBeGreaterThan(0);
  });

  it("rehearses appeal, restart, cooling-off, and planner cancellation without releasing data", async () => {
    const created = await asDevelopmentPlanner(
      request(app).post("/v1/disclosure-rehearsals").send({ lifeEvent: "death" }),
    ).expect(201);
    let rehearsal = created.body.disclosureRehearsal;

    const act = async (action: string, expectedStatus = 200) => {
      const response = await asDevelopmentPlanner(
        request(app)
          .post(`/v1/disclosure-rehearsals/${rehearsal.publicId}/actions`)
          .send({
            expectedVersion: rehearsal.version,
            action,
            acknowledgesSimulationOnly: true,
          }),
      ).expect(expectedStatus);
      if (expectedStatus === 200) rehearsal = response.body.disclosureRehearsal;
      return response;
    };

    await act("advance");
    expect(rehearsal.state).toBe("death_identity_review");
    await act("appeal");
    expect(rehearsal.state).toBe("death_appealed");
    await act("restart_review");
    expect(rehearsal.state).toBe("death_identity_review");
    await act("advance");
    await act("advance");
    await act("advance");
    expect(rehearsal.state).toBe("death_cooling_off");
    expect(rehearsal.coolingOffEndsAt).not.toBeNull();

    const invalid = await act("advance", 409);
    expect(invalid.body.error.code).toBe("invalid_rehearsal_transition");
    await act("simulate_cooling_off_elapsed");
    expect(rehearsal.state).toBe("death_preview_ready");
    expect(rehearsal.previewReady).toBe(true);
    expect(rehearsal.boundaries).toEqual(expect.objectContaining({
      simulationOnly: true,
      notificationsSent: false,
      dataReleased: false,
      releaseAvailable: false,
    }));

    const stale = await asDevelopmentPlanner(
      request(app)
        .post(`/v1/disclosure-rehearsals/${rehearsal.publicId}/actions`)
        .send({
          expectedVersion: rehearsal.version - 1,
          action: "cancel",
          acknowledgesSimulationOnly: true,
        }),
    ).expect(409);
    expect(stale.body.error.code).toBe("version_conflict");

    await act("cancel");
    expect(rehearsal.state).toBe("death_canceled");
    expect(rehearsal.availableActions).toEqual([]);
    expect(rehearsal.boundaries.dataReleased).toBe(false);
  });

  it("isolates disclosure rehearsals by planner and enforces non-operative rows in PostgreSQL", async () => {
    const created = await asDevelopmentPlanner(
      request(app).post("/v1/disclosure-rehearsals").send({ lifeEvent: "missing" }),
    ).expect(201);

    await request(app)
      .get(`/v1/disclosure-rehearsals/${created.body.disclosureRehearsal.publicId}`)
      .set("x-dev-planner-id", secondPlannerPublicId)
      .expect(404);

    await expect(pool.query(
      "update app.disclosure_rehearsals set data_released = true where public_id = $1",
      [created.body.disclosureRehearsal.publicId],
    )).rejects.toMatchObject({ code: "23514" });
  });

  it("authors record-only matter roles and invalidates stale disclosure snapshots", async () => {
    const contacts = await asDevelopmentPlanner(request(app).get("/v1/trusted-contacts")).expect(200);
    const maya = contacts.body.trustedContacts.find(
      (candidate: { displayName: string }) => candidate.displayName === "Maya Chen",
    );
    const matters = await asDevelopmentPlanner(request(app).get("/v1/matters")).expect(200);
    const targetMatter = matters.body.matters[0];

    const priorRehearsal = await asDevelopmentPlanner(
      request(app).post("/v1/disclosure-rehearsals").send({ lifeEvent: "death" }),
    ).expect(201);

    const created = await asDevelopmentPlanner(
      request(app).post("/v1/role-assignments").send({
        personPublicId: maya.publicId,
        role: "executor",
        scope: "matter_specific",
        matterPublicId: targetMatter.publicId,
        acknowledgesRecordOnly: true,
        acknowledgesNoAuthority: true,
      }),
    ).expect(201);
    expect(created.body.roleAssignment).toEqual(expect.objectContaining({
      role: "executor",
      scope: "matter_specific",
      status: "draft",
      evidence: "record_only",
      editable: true,
    }));
    expect(created.body.roleAssignment.person.displayName).toBe("Maya Chen");
    expect(created.body.roleAssignment.matter.publicId).toBe(targetMatter.publicId);
    expect(created.body.boundaries).toEqual({
      recordOnlyByDefault: true,
      invitationSent: false,
      identityBound: false,
      legalAuthorityGranted: false,
      accountAccessGranted: false,
      releaseAvailable: false,
    });
    expect(created.body.invalidatedDisclosureRehearsalCount).toBeGreaterThan(0);

    const invalidated = await asDevelopmentPlanner(
      request(app).get(`/v1/disclosure-rehearsals/${priorRehearsal.body.disclosureRehearsal.publicId}`),
    ).expect(200);
    expect(invalidated.body.disclosureRehearsal).toEqual(expect.objectContaining({
      snapshotFresh: false,
      invalidatedReason: "policy_source_changed",
      availableActions: [],
    }));
    await asDevelopmentPlanner(
      request(app)
        .post(`/v1/disclosure-rehearsals/${priorRehearsal.body.disclosureRehearsal.publicId}/actions`)
        .send({
          expectedVersion: invalidated.body.disclosureRehearsal.version,
          action: "advance",
          acknowledgesSimulationOnly: true,
        }),
    ).expect(409).expect(({ body }) => {
      expect(body.error.code).toBe("disclosure_rehearsal_invalidated");
    });

    await asDevelopmentPlanner(
      request(app).post("/v1/role-assignments").send({
        personPublicId: maya.publicId,
        role: "recipient",
        scope: "plan_wide",
        matterPublicId: null,
        acknowledgesRecordOnly: true,
        acknowledgesNoAuthority: true,
      }),
    ).expect(400);

    const freshRehearsal = await asDevelopmentPlanner(
      request(app).post("/v1/disclosure-rehearsals").send({ lifeEvent: "death" }),
    ).expect(201);
    const executorView = freshRehearsal.body.disclosureRehearsal.projectedRoleViews.find(
      (view: { role: string }) => view.role === "executor",
    );
    expect(executorView.matters).toContainEqual(expect.objectContaining({ title: targetMatter.title }));

    const updated = await asDevelopmentPlanner(
      request(app)
        .patch(`/v1/role-assignments/${created.body.roleAssignment.publicId}`)
        .send({
          expectedVersion: created.body.roleAssignment.version,
          role: "recipient",
          scope: "matter_specific",
          matterPublicId: targetMatter.publicId,
          acknowledgesRecordOnly: true,
          acknowledgesNoAuthority: true,
        }),
    ).expect(200);
    expect(updated.body.roleAssignment).toEqual(expect.objectContaining({
      role: "recipient",
      scope: "matter_specific",
      evidence: "record_only",
    }));
    expect(updated.body.invalidatedDisclosureRehearsalCount).toBeGreaterThan(0);

    await asDevelopmentPlanner(
      request(app)
        .delete(`/v1/role-assignments/${updated.body.roleAssignment.publicId}`)
        .set("If-Match", String(updated.body.roleAssignment.version)),
    ).expect(200).expect(({ body }) => {
      expect(body.revoked).toBe(true);
      expect(body.boundaries.releaseAvailable).toBe(false);
    });
    const listed = await asDevelopmentPlanner(request(app).get("/v1/role-assignments")).expect(200);
    expect(listed.body.roleAssignments).not.toContainEqual(
      expect.objectContaining({ publicId: updated.body.roleAssignment.publicId }),
    );
    const recreated = await asDevelopmentPlanner(
      request(app).post("/v1/role-assignments").send({
        personPublicId: maya.publicId,
        role: "recipient",
        scope: "matter_specific",
        matterPublicId: targetMatter.publicId,
        acknowledgesRecordOnly: true,
        acknowledgesNoAuthority: true,
      }),
    ).expect(201);
    expect(recreated.body.roleAssignment.publicId).not.toBe(updated.body.roleAssignment.publicId);
  });

  it("keeps invitation-backed and cross-tenant role assignments out of record-only editing", async () => {
    const assignments = await asDevelopmentPlanner(request(app).get("/v1/role-assignments")).expect(200);
    const invitationBacked = assignments.body.roleAssignments.find(
      (assignment: { evidence: string }) => assignment.evidence === "simulation",
    );
    expect(invitationBacked).toEqual(expect.objectContaining({ editable: false }));
    await asDevelopmentPlanner(
      request(app)
        .patch(`/v1/role-assignments/${invitationBacked.publicId}`)
        .send({
          expectedVersion: invitationBacked.version,
          role: "trusted_contact",
          scope: "plan_wide",
          matterPublicId: null,
          acknowledgesRecordOnly: true,
          acknowledgesNoAuthority: true,
        }),
    ).expect(409).expect(({ body }) => {
      expect(body.error.code).toBe("invitation_backed_assignment_locked");
    });

    const otherAssignment = await pool.query<{ public_id: string }>(
      `with person as (
         insert into app.people (planner_id, display_name)
         select id, 'Other planner role' from app.planners where public_id = $1
         returning id, planner_id
       )
       insert into app.role_assignments (planner_id, plan_id, person_id, role)
       select person.planner_id, plan.id, person.id, 'executor'
       from person join app.plans plan on plan.planner_id = person.planner_id
       returning public_id`,
      [secondPlannerPublicId],
    );
    await asDevelopmentPlanner(
      request(app)
        .patch(`/v1/role-assignments/${otherAssignment.rows[0]!.public_id}`)
        .send({
          expectedVersion: 1,
          role: "executor",
          scope: "plan_wide",
          matterPublicId: null,
          acknowledgesRecordOnly: true,
          acknowledgesNoAuthority: true,
        }),
    ).expect(404);

    const privileges = await pool.query<{
      can_update_role: boolean;
      can_update_person: boolean;
      can_update_plan: boolean;
    }>(
      `select
         has_column_privilege('continuity_app', 'app.role_assignments', 'role', 'UPDATE') as can_update_role,
         has_column_privilege('continuity_app', 'app.role_assignments', 'person_id', 'UPDATE') as can_update_person,
         has_column_privilege('continuity_app', 'app.role_assignments', 'plan_id', 'UPDATE') as can_update_plan`,
    );
    expect(privileges.rows[0]).toEqual({
      can_update_role: true,
      can_update_person: false,
      can_update_plan: false,
    });
  });

  it("revokes matter-scoped roles and invitations when their matter is archived", async () => {
    const person = await asDevelopmentPlanner(
      request(app).post("/v1/trusted-contacts").send({
        displayName: "Archive cascade contact",
        relationshipLabel: "Synthetic fixture",
      }),
    ).expect(201);
    const matter = await asDevelopmentPlanner(
      request(app).post("/v1/matters").send({
        category: "account",
        title: "Archive cascade matter",
        institutionName: "Example service",
        desiredOutcome: "close",
      }),
    ).expect(201);
    const assignment = await asDevelopmentPlanner(
      request(app).post("/v1/role-assignments").send({
        personPublicId: person.body.trustedContact.publicId,
        role: "executor",
        scope: "matter_specific",
        matterPublicId: matter.body.matter.publicId,
        acknowledgesRecordOnly: true,
        acknowledgesNoAuthority: true,
      }),
    ).expect(201);
    await pool.query(
      `insert into app.invitations (
         planner_id, person_id, role_assignment_id, delivery_channel, status
       )
       select ra.planner_id, ra.person_id, ra.id, 'simulation', 'pending'
       from app.role_assignments ra where ra.public_id = $1`,
      [assignment.body.roleAssignment.publicId],
    );

    await asDevelopmentPlanner(
      request(app)
        .delete(`/v1/matters/${matter.body.matter.publicId}`)
        .set("If-Match", String(matter.body.matter.version)),
    ).expect(204);

    const state = await pool.query<{
      assignment_status: string;
      assignment_version: number;
      invitation_status: string;
    }>(
      `select ra.status as assignment_status, ra.version as assignment_version,
              i.status as invitation_status
       from app.role_assignments ra
       join app.invitations i on i.role_assignment_id = ra.id
       where ra.public_id = $1`,
      [assignment.body.roleAssignment.publicId],
    );
    expect(state.rows[0]).toEqual({
      assignment_status: "revoked",
      assignment_version: 2,
      invitation_status: "revoked",
    });
    const listed = await asDevelopmentPlanner(request(app).get("/v1/role-assignments")).expect(200);
    expect(listed.body.roleAssignments).not.toContainEqual(
      expect.objectContaining({ publicId: assignment.body.roleAssignment.publicId }),
    );
    const audit = await asDevelopmentPlanner(request(app).get("/v1/audit-events?limit=100")).expect(200);
    expect(audit.body.auditEvents).toContainEqual(expect.objectContaining({
      action: "matter.archived",
      resourcePublicId: matter.body.matter.publicId,
      metadata: expect.objectContaining({
        revokedRoleAssignmentCount: 1,
        revokedInvitationCount: 1,
      }),
    }));
  });

  it("records only allowlisted first-party product events with a bounded retention marker", async () => {
    const plan = await asDevelopmentPlanner(request(app).get("/v1/plan")).expect(200);
    await asDevelopmentPlanner(
      request(app)
        .patch("/v1/plan")
        .set("x-rillora-client", "web")
        .send({ expectedVersion: plan.body.plan.version, motivation: "cross_border" }),
    ).expect(200);
    await asDevelopmentPlanner(
      request(app)
        .post("/v1/simulations")
        .set("x-rillora-client", "not-a-client")
        .send({ lifeEvent: "missing" }),
    ).expect(201);

    const events = await pool.query<{
      event_name: string;
      client_source: string;
      properties: Record<string, unknown>;
      occurred_at: Date;
      expires_at: Date;
    }>(
      `select event_name, client_source, properties, occurred_at, expires_at
       from app.product_events
       where planner_id = (select id from app.planners where public_id = $1)
         and event_name in ('motivation_selected', 'simulation_completed')
       order by id desc limit 2`,
      [developmentPlannerPublicId],
    );
    expect(events.rows).toEqual([
      expect.objectContaining({
        event_name: "simulation_completed",
        client_source: "unknown",
        properties: { lifeEvent: "missing", kind: "count_snapshot" },
      }),
      expect.objectContaining({
        event_name: "motivation_selected",
        client_source: "web",
        properties: { motivation: "cross_border" },
      }),
    ]);
    for (const event of events.rows) {
      expect(event.expires_at.getTime() - event.occurred_at.getTime()).toBe(90 * 24 * 60 * 60 * 1_000);
      expect(JSON.stringify(event.properties)).not.toMatch(/publicId|title|displayName|institution|contact/i);
    }

    const privileges = await pool.query<{
      can_insert: boolean;
      can_select: boolean;
      can_update: boolean;
      can_delete: boolean;
    }>(
      `select
         has_table_privilege('continuity_app', 'app.product_events', 'INSERT') as can_insert,
         has_table_privilege('continuity_app', 'app.product_events', 'SELECT') as can_select,
         has_table_privilege('continuity_app', 'app.product_events', 'UPDATE') as can_update,
         has_table_privilege('continuity_app', 'app.product_events', 'DELETE') as can_delete`,
    );
    expect(privileges.rows[0]).toEqual({
      can_insert: true,
      can_select: false,
      can_update: false,
      can_delete: false,
    });
    await expect(pool.query(
      `insert into app.product_events (planner_id, event_name, client_source, properties)
       select id, 'start_here_exported', 'web', '{"format":"plaintext","title":"leak"}'::jsonb
       from app.planners where public_id = $1`,
      [developmentPlannerPublicId],
    )).rejects.toMatchObject({ code: "23514" });
  });

  it("creates only a no-store Start Here preview, not an encrypted package", async () => {
    const excluded = await asDevelopmentPlanner(
      request(app).post("/v1/trusted-contacts").send({
        displayName: "Revoked Preview Contact",
        relationshipLabel: "Former contact",
      }),
    ).expect(201);
    await asDevelopmentPlanner(
      request(app)
        .patch(`/v1/trusted-contacts/${excluded.body.trustedContact.publicId}`)
        .send({
          expectedVersion: excluded.body.trustedContact.version,
          status: "revoked",
        }),
    ).expect(200);

    const response = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/preview").send({}),
    ).expect(201);
    expect(response.headers["cache-control"]).toContain("no-store");
    expect(response.body.export.status).toBe("previewed");
    expect(response.body.export.encryptedPackageCreated).toBe(false);
    expect(response.body.package.directionsNotPasswords).toBe(true);
    expect(response.body.package.legalAuthorityNotGranted).toBe(true);
    expect(response.body.package.trustedContacts).not.toContainEqual(
      expect.objectContaining({ displayName: "Revoked Preview Contact" }),
    );
  });

  it("generates a reviewed minimum-disclosure printable guide without retaining a server copy", async () => {
    const excludedAccountHint = "DO-NOT-PRINT-ACCOUNT-HINT";
    await asDevelopmentPlanner(
      request(app).post("/v1/matters").send({
        category: "account",
        title: "Printable account\nOne line only",
        institutionName: "Example Provider",
        accountHint: excludedAccountHint,
        locationHint: "Provider recovery page",
        desiredOutcome: "notify",
        status: "ready",
      }),
    ).expect(201);

    const preview = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/preview").send({}),
    ).expect(201);
    expect(preview.body.export.expiresAt).toBeTruthy();
    const printablePreviewMatter = preview.body.package.matters.find(
      (matter: { title: string }) => matter.title === "Printable account\nOne line only",
    );
    expect(printablePreviewMatter).toMatchObject({
      institutionName: "Example Provider",
      locationHint: "Provider recovery page",
    });
    expect(printablePreviewMatter).not.toHaveProperty("accountHint");
    expect(printablePreviewMatter).not.toHaveProperty("valueBand");
    expect(printablePreviewMatter).not.toHaveProperty("currencyCode");

    await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/printable").send({
        previewPublicId: preview.body.export.publicId,
        acknowledgesPlaintext: false,
        acknowledgesNoRevocation: true,
      }),
    ).expect(400);

    await request(app)
      .post("/v1/exports/start-here/printable")
      .set("x-dev-planner-id", secondPlannerPublicId)
      .send({
        previewPublicId: preview.body.export.publicId,
        acknowledgesPlaintext: true,
        acknowledgesNoRevocation: true,
      })
      .expect(409);

    const printable = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/printable").send({
        previewPublicId: preview.body.export.publicId,
        acknowledgesPlaintext: true,
        acknowledgesNoRevocation: true,
      }),
    ).expect(201);

    expect(printable.headers["cache-control"]).toContain("no-store");
    expect(printable.headers["content-type"]).toMatch(/^text\/plain/);
    expect(printable.headers["content-disposition"]).toMatch(
      /^attachment; filename="rillora-start-here-\d{4}-\d{2}-\d{2}\.txt"$/,
    );
    expect(printable.headers["x-rillora-export-id"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(printable.headers["x-rillora-server-copy-retained"]).toBe("false");
    expect(printable.text).toContain("Printable account One line only");
    expect(printable.text).toContain("Example Provider");
    expect(printable.text).toContain("Provider recovery page");
    expect(printable.text).toContain("Rillora cannot revoke that copy");
    expect(printable.text).not.toContain(excludedAccountHint);

    const stored = await pool.query<{
      format: string;
      status: string;
      object_locator_ciphertext: Buffer | null;
    }>(
      `select format, status, object_locator_ciphertext
       from app.export_packages where public_id = $1`,
      [printable.headers["x-rillora-export-id"]],
    );
    expect(stored.rows[0]).toMatchObject({
      format: "start_here_text",
      status: "ready",
      object_locator_ciphertext: null,
    });

    await asDevelopmentPlanner(
      request(app).post("/v1/matters").send({
        category: "document",
        title: "Changed after preview",
        locationHint: "Blue folder",
        desiredOutcome: "notify",
        status: "draft",
      }),
    ).expect(201);
    const changedPreview = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/printable").send({
        previewPublicId: preview.body.export.publicId,
        acknowledgesPlaintext: true,
        acknowledgesNoRevocation: true,
      }),
    ).expect(409);
    expect(changedPreview.body.error.code).toBe("start_here_preview_changed");

    const audit = await asDevelopmentPlanner(
      request(app).get("/v1/audit-events?limit=100"),
    ).expect(200);
    expect(audit.body.auditEvents).toContainEqual(
      expect.objectContaining({
        action: "export.generated",
        resourcePublicId: printable.headers["x-rillora-export-id"],
        metadata: expect.objectContaining({
          format: "start_here_text",
          serverCopyRetained: false,
        }),
      }),
    );
  });

  it("stores only a recovery-wrapped client-encrypted package and returns the same artifact", async () => {
    const preview = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/preview").send({}),
    ).expect(201);
    const preparation = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/encrypted/prepare").send({
        previewPublicId: preview.body.export.publicId,
      }),
    ).expect(201);
    expect(preparation.body.package.serverCanDecrypt).toBe(false);
    expect(preparation.body.package.recipientDeliveryPerformed).toBe(false);
    expect(preparation.body.eligibleRecipientKeys).toEqual([]);

    const fixture = encryptedCryptoFixture();
    const finalized = await asDevelopmentPlanner(
      request(app)
        .post(`/v1/exports/start-here/encrypted/${preparation.body.package.publicId}/finalize`)
        .send({
          previewPublicId: preview.body.export.publicId,
          cryptoVersion: "rillora-hpke-v1",
          ...fixture,
          recipients: [],
          acknowledgesOfflineRecoveryRisk: true,
          acknowledgesExternalCopiesNotRevocable: true,
        }),
    ).expect(201);
    expect(finalized.body.encryptedPackage).toMatchObject({
      status: "ready",
      recipientKeyCount: 0,
      offlineRecoveryEnvelopeCreated: true,
      offlineRecoveryPrivateKeyReceivedByServer: false,
      recipientDeliveryPerformed: false,
      serverCanDecrypt: false,
      externalCopiesRevocable: false,
    });

    const artifact = await asDevelopmentPlanner(
      request(app).get(`/v1/exports/start-here/encrypted/${preparation.body.package.publicId}`),
    ).expect(200);
    expect(artifact.headers["cache-control"]).toContain("no-store");
    expect(artifact.headers["content-type"]).toMatch(/^application\/vnd\.rillora\.encrypted\+json/);
    expect(artifact.body.content).toMatchObject({
      nonce: fixture.contentNonce,
      ciphertext: fixture.contentCiphertext,
      ciphertextSha256: fixture.ciphertextSha256,
    });
    expect(artifact.body.recovery).toEqual(fixture.recovery);
    expect(artifact.body.recipients).toEqual([]);

    const stored = await pool.query<{
      status: string;
      crypto_version: string;
      ciphertext_length: number;
      envelope_count: number;
    }>(
      `select p.status, p.crypto_version,
              octet_length(p.content_ciphertext)::int as ciphertext_length,
              count(e.id)::int as envelope_count
       from app.export_packages p
       left join app.export_key_envelopes e on e.export_package_id = p.id
       where p.public_id = $1
       group by p.id`,
      [preparation.body.package.publicId],
    );
    expect(stored.rows[0]).toEqual({
      status: "ready",
      crypto_version: "rillora-hpke-v1",
      ciphertext_length: 64,
      envelope_count: 1,
    });
  });

  it("fails closed when ciphertext or accepted recipient-key membership changes", async () => {
    const contact = await asDevelopmentPlanner(
      request(app).post("/v1/trusted-contacts").send({
        displayName: "Encrypted Recipient",
        relationshipLabel: "Sibling",
      }),
    ).expect(201);
    const recipientPoint = p256PublicPoint();
    const recipientKeyPublicId = "abababab-abab-4bab-8bab-abababababab";
    await pool.query(
      `with person_record as (
         update app.people set status = 'confirmed'
         where public_id = $1 returning id, planner_id
       ), role_record as (
         update app.role_assignments ra set status = 'accepted'
         from person_record p
         where ra.person_id = p.id and ra.planner_id = p.planner_id
         returning ra.id, ra.person_id, ra.planner_id
       ), invitation_record as (
         insert into app.invitations (
           planner_id, person_id, role_assignment_id, delivery_channel, token_hash,
           status, expires_at, accepted_at
         )
         select planner_id, person_id, id, 'email', digest('test-invitation', 'sha256'),
                'accepted', now() + interval '1 day', now()
         from role_record returning id, person_id, planner_id
       )
       insert into app.recipient_device_keys (
         public_id, planner_id, person_id, invitation_id, algorithm,
         public_key_x963, device_label
       )
       select $2, planner_id, person_id, id, 'p256_hpke_base', $3, 'Synthetic browser'
       from invitation_record`,
      [contact.body.trustedContact.publicId, recipientKeyPublicId, recipientPoint],
    );

    const scopedConnection = (await pool.query(`insert into app.sharing_connections (
      planner_id,person_id,recipient_email_hash,recipient_email_label,invitation_token_hash,invitation_expires_at,status,recipient_planner_id,accepted_at
    ) select p.planner_id,p.id,digest('crypto-recipient@example.test','sha256'),'crypto-recipient@example.test',digest('crypto-scoped-invitation','sha256'),now()+interval '1 day','accepted',r.id,now()
      from app.people p cross join app.planners r where p.public_id=$1 and r.public_id=$2 returning id,public_id,planner_id`, [contact.body.trustedContact.publicId,secondPlannerPublicId])).rows[0];
    await pool.query(`insert into app.sharing_grants(planner_id,connection_id,matter_item_id,detail_level)
      select $1,$2,id,'directions' from app.matter_items where planner_id=$1 and archived_at is null and desired_outcome<>'never_disclose' order by id limit 1`,[scopedConnection.planner_id,scopedConnection.id]);
    const preview = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/preview").send({recipientConnectionPublicId:scopedConnection.public_id}),
    ).expect(201);
    const preparation = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/encrypted/prepare").send({
        previewPublicId: preview.body.export.publicId,
      }),
    ).expect(201);
    expect(preparation.body.eligibleRecipientKeys).toEqual([
      expect.objectContaining({ publicId: recipientKeyPublicId, displayName: "Encrypted Recipient" }),
    ]);

    const fixture = encryptedCryptoFixture();
    const digestMismatch = await asDevelopmentPlanner(
      request(app)
        .post(`/v1/exports/start-here/encrypted/${preparation.body.package.publicId}/finalize`)
        .send({
          previewPublicId: preview.body.export.publicId,
          cryptoVersion: "rillora-hpke-v1",
          ...fixture,
          ciphertextSha256: Buffer.alloc(32, 9).toString("base64url"),
          recipients: [],
          acknowledgesOfflineRecoveryRisk: true,
          acknowledgesExternalCopiesNotRevocable: true,
        }),
    ).expect(400);
    expect(digestMismatch.body.error.code).toBe("ciphertext_digest_mismatch");

    const missingRecipient = await asDevelopmentPlanner(
      request(app)
        .post(`/v1/exports/start-here/encrypted/${preparation.body.package.publicId}/finalize`)
        .send({
          previewPublicId: preview.body.export.publicId,
          cryptoVersion: "rillora-hpke-v1",
          ...fixture,
          recipients: [],
          acknowledgesOfflineRecoveryRisk: true,
          acknowledgesExternalCopiesNotRevocable: true,
        }),
    ).expect(409);
    expect(missingRecipient.body.error.code).toBe("recipient_keys_changed");
  });

  it("rehearses one-time recipient acceptance, public-key enrollment, decryption access and revocation", async () => {
    const contact = await asDevelopmentPlanner(
      request(app).post("/v1/trusted-contacts").send({
        displayName: "Synthetic Rehearsal Recipient",
        relationshipLabel: "Test-only contact",
      }),
    ).expect(201);

    const created = await asDevelopmentPlanner(
      request(app).post("/v1/recipient-rehearsals").send({
        personPublicId: contact.body.trustedContact.publicId,
      }),
    ).expect(201);
    expect(created.body.acceptanceToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(created.body.boundaries).toEqual(expect.objectContaining({
      simulationOnly: true,
      identityVerified: false,
      deliveryPerformed: false,
      releasePerformed: false,
      serverCanDecrypt: false,
    }));

    const storedCapability = await pool.query<{
      hash_length: number;
      token_matches_hash: boolean;
      session_token_hash: Buffer | null;
    }>(
      `select octet_length(acceptance_token_hash)::int as hash_length,
              acceptance_token_hash = digest($2, 'sha256') as token_matches_hash,
              session_token_hash
       from app.recipient_rehearsals where public_id = $1`,
      [created.body.recipientRehearsal.publicId, created.body.acceptanceToken],
    );
    expect(storedCapability.rows[0]).toEqual({
      hash_length: 32,
      token_matches_hash: true,
      session_token_hash: null,
    });

    const accepted = await request(app)
      .post("/recipient-rehearsals/accept")
      .send({ acceptanceToken: created.body.acceptanceToken })
      .expect(201);
    const rehearsalSession = accepted.body.sessionToken as string;
    expect(rehearsalSession).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await request(app)
      .post("/recipient-rehearsals/accept")
      .send({ acceptanceToken: created.body.acceptanceToken })
      .expect(401);

    await request(app)
      .post("/recipient-rehearsals/device-keys")
      .set("authorization", `Rillora-Rehearsal ${rehearsalSession}`)
      .send({
        deviceLabel: "Synthetic browser",
        publicKey: p256PublicPoint().toString("base64url"),
        device: { privateKey: "must-never-reach-the-server" },
      })
      .expect(400);

    const recipientPoint = p256PublicPoint();
    const enrolled = await request(app)
      .post("/recipient-rehearsals/device-keys")
      .set("authorization", `Rillora-Rehearsal ${rehearsalSession}`)
      .send({
        deviceLabel: "Synthetic browser",
        publicKey: recipientPoint.toString("base64url"),
      })
      .expect(201);
    const recipientKeyPublicId = enrolled.body.deviceKey.publicId as string;
    expect(enrolled.body.deviceKey).toMatchObject({
      deviceLabel: "Synthetic browser",
      status: "active",
      simulationOnly: true,
    });

    const preview = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/preview").send({}),
    ).expect(201);
    const standardPreparation = await asDevelopmentPlanner(
      request(app).post("/v1/exports/start-here/encrypted/prepare").send({
        previewPublicId: preview.body.export.publicId,
      }),
    ).expect(201);
    expect(
      standardPreparation.body.eligibleRecipientKeys.some(
        (key: { publicId: string }) => key.publicId === recipientKeyPublicId,
      ),
    ).toBe(false);

    const preparation = await asDevelopmentPlanner(
      request(app)
        .post(`/v1/recipient-rehearsals/${created.body.recipientRehearsal.publicId}/packages/prepare`)
        .send({ previewPublicId: preview.body.export.publicId }),
    ).expect(201);
    expect(preparation.body.eligibleRecipientKeys).toEqual([
      expect.objectContaining({
        publicId: recipientKeyPublicId,
        publicKey: recipientPoint.toString("base64url"),
      }),
    ]);

    const fixture = encryptedCryptoFixture();
    await asDevelopmentPlanner(
      request(app)
        .post(
          `/v1/recipient-rehearsals/${created.body.recipientRehearsal.publicId}/packages/${preparation.body.package.publicId}/finalize`,
        )
        .send({
          previewPublicId: preview.body.export.publicId,
          cryptoVersion: "rillora-hpke-v1",
          ...fixture,
          recipients: [{
            keyPublicId: recipientKeyPublicId,
            encapsulatedKey: p256PublicPoint().toString("base64url"),
            wrappedKey: Buffer.alloc(48, 8).toString("base64url"),
          }],
          acknowledgesOfflineRecoveryRisk: true,
          acknowledgesExternalCopiesNotRevocable: true,
          acknowledgesSyntheticRehearsalOnly: true,
        }),
    ).expect(201);

    await asDevelopmentPlanner(
      request(app).get(`/v1/exports/start-here/encrypted/${preparation.body.package.publicId}`),
    ).expect(404);

    const artifact = await request(app)
      .get(`/recipient-rehearsals/packages/${preparation.body.package.publicId}`)
      .set("authorization", `Rillora-Rehearsal ${rehearsalSession}`)
      .expect(200);
    expect(artifact.body).not.toHaveProperty("recovery");
    expect(artifact.body.recipients).toEqual([
      expect.objectContaining({ keyPublicId: recipientKeyPublicId }),
    ]);
    expect(artifact.body.boundaries).toEqual(expect.objectContaining({
      simulationOnly: true,
      releasePerformed: false,
      deliveryPerformed: false,
    }));

    await request(app)
      .delete(`/recipient-rehearsals/device-keys/${recipientKeyPublicId}`)
      .set("authorization", `Rillora-Rehearsal ${rehearsalSession}`)
      .expect(204);
    await request(app)
      .get(`/recipient-rehearsals/packages/${preparation.body.package.publicId}`)
      .set("authorization", `Rillora-Rehearsal ${rehearsalSession}`)
      .expect(404);
  });

  it("returns a newly registered recipient to the original invitation before explicit acceptance", async () => {
    const contact = (await asDevelopmentPlanner(request(app).post("/v1/trusted-contacts").send({ displayName: "Signup recipient" })).expect(201)).body.trustedContact;
    const invitation = (await asDevelopmentPlanner(request(app).post("/v1/sharing/connections").send({ personPublicId: contact.publicId, email: "signup@example.test", grants: [] })).expect(201)).body;
    const token = new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get("invitation")!;
    const signedUpApp = createApp(pool, config, { appleSignedDataVerifier: fakeAppleVerifier, stripeProvider: fakeStripeProvider, nativeIdentityVerifier: fakeNativeIdentityVerifier, identityProvider: {
      ...fakeIdentityProvider,
      async exchangeAuthorizationCode() {
        return { issuer: "https://identity.example", subject: "auth0|new-invitation-recipient", displayName: "New recipient", locale: "en", authenticatedAt: new Date(), authenticationMethods: ["pwd"], verifiedEmail: "signup@example.test" };
      },
    } });
    const recipient = request.agent(signedUpApp);
    await recipient.post("/sharing/invitations/resolve").send({ invitationToken: token }).expect(200);
    const returnTo = `/invite/${invitation.connection.publicId}`;
    const start = await recipient.post("/auth/start").send({ intent: "signup", returnTo, legalAcceptance }).expect(201);
    const authorization = new URL(start.body.authorizationUrl);
    expect(authorization.searchParams.get("screen_hint")).toBe("signup");
    expect(authorization.href).not.toContain(token);
    const callback = await recipient.get(`/auth/callback?code=[REDACTED_CAPABILITY]&state=[REDACTED_CAPABILITY]"state")}`).expect(303);
    expect(callback.headers.location).toBe(`http://localhost:4173${returnTo}`);
    const resolved = await recipient.get(`/sharing/invitations/${invitation.connection.publicId}`).expect(200);
    expect(resolved.body.invitation.status).toBe("pending");
    const cookie = (callback.headers["set-cookie"] as unknown as string[]).find((value) => value.startsWith("continuity_csrf="))!;
    const csrf = decodeURIComponent(cookie.split(";")[0]!.split("=")[1]!);
    recipient.set("x-rillora-planner", (await recipient.get("/v1/session").expect(200)).body.plannerPublicId);
    await recipient.post("/v1/sharing/invitations/accept").set("x-csrf-token", csrf).send({ invitationPublicId: invitation.connection.publicId, accepted: true }).expect(200);
    expect((await recipient.get("/v1/sharing/shared-with-me").expect(200)).body.connections.some((value: { publicId: string }) => value.publicId === invitation.connection.publicId)).toBe(true);
  });

  it("rejects browser origins outside the explicit allowlist", async () => {
    const response = await asDevelopmentPlanner(
      request(app).get("/v1/plan").set("Origin", "https://attacker.example"),
    ).expect(403);
    expect(response.body.error.code).toBe("origin_not_allowed");
  });
});

function asDevelopmentPlanner(testRequest: Test): Test {
  return testRequest.set("x-dev-planner-id", developmentPlannerPublicId).on("response", response => {
    if (response.status === 403) console.warn("TEST_HTTP_403", {
      type: response.headers["content-type"], server: response.headers.server,
      code: response.body?.error?.code, text: response.text?.slice(0, 160),
    });
  });
}

async function seedSecondPlanner(database: DatabasePool): Promise<string> {
  const planner = await database.query<{ id: string }>(
    `insert into app.planners (public_id, display_name)
     values ($1, 'Second Planner') returning id::text`,
    [secondPlannerPublicId],
  );
  const plannerId = planner.rows[0]!.id;
  const plan = await database.query<{ id: string }>(
    `insert into app.plans (planner_id, status) values ($1, 'active') returning id::text`,
    [plannerId],
  );
  const matter = await database.query<{ public_id: string }>(
    `insert into app.matter_items (planner_id, plan_id, category, title)
     values ($1, $2, 'document', 'Other planner private matter') returning public_id`,
    [plannerId, plan.rows[0]!.id],
  );
  return matter.rows[0]!.public_id;
}

async function seedSession(database: DatabasePool): Promise<void> {
  await database.query(
    `with planner as (
       select id from app.planners where public_id = $1
     ), identity as (
       insert into app.identity_accounts (planner_id, issuer, subject)
       select id, 'https://identity.example', 'auth0|seeded-cookie-session' from planner
       returning id, planner_id
     ), acceptance as (
       insert into app.legal_acceptances (
         planner_id, identity_account_id, terms_version, privacy_version,
         consent_text_version, legal_bundle_sha256, accepted_terms,
         acknowledged_privacy, accepted_electronic_records, client_surface,
         identity_reference_sha256
       )
       select planner_id, id, $4, $5, $6, $7, true, true, true, 'web', $8
       from identity
       returning id, planner_id, identity_account_id
     )
     insert into app.auth_sessions (
       planner_id, identity_account_id, legal_acceptance_id,
       token_hash, csrf_token_hash, expires_at
     )
     select planner_id, identity_account_id, id, $2, $3, now() + interval '1 hour'
     from acceptance`,
    [
      developmentPlannerPublicId,
      digest(sessionToken),
      digest(csrfToken),
      currentLegalContract.termsVersion,
      currentLegalContract.privacyVersion,
      currentLegalContract.consentTextVersion,
      Buffer.from(currentLegalContract.bundleSha256, "hex"),
      digest("https://identity.example\u001fauth0|seeded-cookie-session"),
    ],
  );
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function p256PublicPoint(): Buffer {
  const key = createECDH("prime256v1");
  key.generateKeys();
  return key.getPublicKey(undefined, "uncompressed");
}

function encryptedCryptoFixture() {
  const contentCiphertext = Buffer.alloc(64, 7);
  return {
    contentNonce: Buffer.alloc(12, 3).toString("base64url"),
    contentCiphertext: contentCiphertext.toString("base64url"),
    ciphertextSha256: createHash("sha256").update(contentCiphertext).digest("base64url"),
    recovery: {
      publicKey: p256PublicPoint().toString("base64url"),
      encapsulatedKey: p256PublicPoint().toString("base64url"),
      wrappedKey: Buffer.alloc(48, 5).toString("base64url"),
    },
  };
}
