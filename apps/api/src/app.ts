import express, { type Express, type RequestHandler } from "express";
import type { ContentContext } from './legacy-content/context.js';
import { contentNoticeHandler, contentUploadHandlers, createContentRouter } from './legacy-content/routes.js';
import { createFutureNoticeRouter, createPublicFutureNoticeRouter } from "./future-notice-routes.js";
import type { McpIntegration } from './mcp/integration.js';
import type { AppleProductionIntake } from './apple-production-intake.js';
import { createAppleProductionNotificationHandler, createAppleProductionRouter } from './apple-production-routes.js';
import { appleReviewContext, appleProductionContext } from './apple-execution-context.js';
import { ApplePurchasePreflight } from './apple-purchase-preflight.js';
import { appleReviewAccessRequired } from './apple-review-access.js';
import { authenticate, requireWorkspaceIdentity } from "./auth.js";
import { Auth0EmailIdentityVerifier, SessionEmailVerification, type EmailIdentityVerifying } from "./email-verification.js";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
import { checkContentKeys, withAuthDatabase } from "./db.js";
import { checkRecoveryJournal } from './recovery-journal.js';
import { findForbiddenSecretField } from "./domain.js";
import { ApiError, errorHandler, notFoundHandler } from "./errors.js";
import { createApiRouter } from "./routes.js";
import { createAccountDataRouter, mapBackupMaxBytes } from "./account-data-routes.js";
import { createAccountIdentityRouter } from "./account-identity.js";
import { createAccountDeletionRouter, createPublicAccountDeletionRouter, deletionProcessor, type AccountIdentityDeleting, type AccountDeletionHandling } from "./account-deletion.js";
import {checkEmailMatchReadiness} from './email-match-readiness.js';
import { createDisclosureRehearsalRouter } from "./disclosure-rehearsal-routes.js";
import { createCommerceRouter } from "./commerce-routes.js";
import { createFamilyMaintenanceRouter } from "./family-maintenance-routes.js";
import { createRoleAssignmentRouter } from "./role-assignment-routes.js";
import { createPublicSharingRouter, createSharingRouter } from "./sharing-routes.js";
import {
  createPlannerRecipientRehearsalRouter,
  createRecipientRehearsalRouter,
} from "./recipient-rehearsal-routes.js";
import { createAuthRouter, type AuthDependencies } from "./auth-routes.js";
import { installSecurityMiddleware, preventCaching } from "./security.js";
import {
  createStripeTestCommerceRouter,
  createStripeWebhookHandler,
} from "./stripe-commerce-routes.js";
import {
  StripeCommerceExecutor,
  type StripeCommerceProvider,
} from "./stripe-commerce-executor.js";
import { StripeTestAdapter } from "./stripe-test-adapter.js";
import { StripeProductionAdapter, type StripeProductionConfig } from './stripe-production-adapter.js';
import { productionExecutionConfig } from './stripe-execution-config.js';
import { createStripeProductionCommerceRouter } from './stripe-production-routes.js';
import {
  createRilloraAppleSandboxVerifier,
  type AppleSignedDataVerifying,
} from "./apple-storekit-adapter.js";
import {
  AppleStoreKitSandboxSnapshotAdapter,
  createRilloraAppleSandboxServerApi,
  type AppleAppStoreServerApi,
  type StoreKitSandboxSnapshotProvider,
} from "./apple-storekit-server-api.js";
import { StoreKitSandboxIntake } from "./storekit-sandbox-intake.js";
import {
  createStoreKitSandboxNotificationHandler,
  createStoreKitSandboxRouter,
} from "./storekit-sandbox-routes.js";

export type AppDependencies = AuthDependencies & {
  legacyContent?: ContentContext;
  futureNoticesEnabled?: boolean;
  mcp?: McpIntegration;
  appleReviewIntake?: AppleProductionIntake;
  appleProductionIntake?: AppleProductionIntake;
  transportReady?: () => boolean;
  emailIdentityVerifier?: EmailIdentityVerifying;
  accountIdentityDeleter?: AccountIdentityDeleting;
  accountDeletionProcessor?: AccountDeletionHandling;
  stripeProvider?: StripeCommerceProvider;
  stripeExecutor?: StripeCommerceExecutor;
  stripeProductionConfig?: StripeProductionConfig;
  appleSignedDataVerifier?: AppleSignedDataVerifying;
  appleServerApi?: AppleAppStoreServerApi;
  appleSnapshotProvider?: StoreKitSandboxSnapshotProvider;
};

export function createApp(
  pool: DatabasePool,
  config: AppConfig,
  dependencies: AppDependencies = {},
): Express {
  if (dependencies.futureNoticesEnabled && (config.productionRuntimeClosed || config.productionReviewAccess)) {
    throw new Error("Future notices cannot be enabled in a closed or review-only runtime");
  }
  if (dependencies.legacyContent && (config.productionRuntimeClosed || config.productionReviewAccess)) throw new Error('Content cannot be enabled in a closed or review-only runtime');
  const app = express();
  const emailVerifier = dependencies.emailIdentityVerifier
    ?? (config.emailVerification ? new Auth0EmailIdentityVerifier(config.emailVerification) : null);
  const emailVerification = emailVerifier ? new SessionEmailVerification(pool, emailVerifier) : null;
  const accountDeletion = dependencies.accountDeletionProcessor ?? deletionProcessor(pool, config, dependencies.accountIdentityDeleter);
  installSecurityMiddleware(app, config);

  app.get("/health/live", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/health/ready", async (_request, response) => {
    try {
      if (dependencies.transportReady && !dependencies.transportReady()) throw new Error("Transport not ready");
      await pool.query("select 1");
      await checkContentKeys(pool);
      await checkRecoveryJournal(pool);
      await dependencies.mcp?.checkReady();
      if (dependencies.legacyContent || dependencies.futureNoticesEnabled) {
        // Production logins deliberately do not inherit schema privileges.
        // Use the existing signed role transaction even for catalog metadata.
        const ready = await withAuthDatabase(pool, async client => (await client.query(
          "select to_regclass('app.legacy_content_assets') is not null as content, to_regclass('app.future_recipient_notices') is not null as notices",
        )).rows[0]);
        if (dependencies.legacyContent && !ready?.content) throw new Error('Content migration is unavailable');
        if (dependencies.futureNoticesEnabled && !ready?.notices) throw new Error('Future notice migration is unavailable');
      }
      if(config.nodeEnv==='production')await checkEmailMatchReadiness(pool,config);
      response.json({ status: "ready" });
    } catch {
      response.status(503).json({ status: "not_ready" });
    }
  });

  // This preparation mode is intentionally not an authentication bypass.
  // Only the two health routes above exist; no identity, private data, invitation,
  // legal acceptance, webhook or account-deletion router is mounted.
  if (config.productionRuntimeClosed) {
    app.use(preventCaching, (_request, response) => {
      response.status(503).json({ error: { code: "service_not_open", message: "Rillora is not open for account access yet." } });
    });
    app.use(errorHandler);
    return app;
  }

  dependencies.mcp?.mountPublic(app);

  if (config.stripeProductionSecretArn && (!dependencies.stripeProductionConfig || config.stripeTest)) throw new Error('Production billing requires isolated loaded credentials');
  if (Boolean(config.appleProduction) !== Boolean(dependencies.appleProductionIntake)
    || (config.appleProduction && config.appleSandbox)) throw new Error('Production Apple requires isolated loaded credentials');
  const appleProductionIntake = dependencies.appleProductionIntake;
  const appleReviewIntake = dependencies.appleReviewIntake;
  if(Boolean(config.appleReview)!==Boolean(appleReviewIntake) || (appleReviewIntake && config.appleSandbox)
    || (appleReviewIntake && appleReviewIntake.context!==appleReviewContext)
    || (appleProductionIntake && appleProductionIntake.context!==appleProductionContext)) throw new Error('Apple execution contexts do not match their configured routes');
  const stripeExecutor = dependencies.stripeExecutor ?? (config.stripeProductionSecretArn && dependencies.stripeProductionConfig
    ? new StripeCommerceExecutor(pool, productionExecutionConfig(dependencies.stripeProductionConfig),
      dependencies.stripeProvider ?? new StripeProductionAdapter(dependencies.stripeProductionConfig))
    : config.stripeTest
    ? new StripeCommerceExecutor(
        pool,
        config.stripeTest,
        dependencies.stripeProvider ?? new StripeTestAdapter(config.stripeTest),
      )
    : null);
  if (stripeExecutor && stripeExecutor.providerEnvironment !== (config.stripeProductionSecretArn ? 'production' : 'test')) throw new Error('Stripe executor environment mismatch');
  const stripeCheckoutEnabled = stripeExecutor?.providerEnvironment === 'production'
    && config.stripeProductionCheckoutEnabled === true
    && dependencies.stripeProductionConfig?.tax.mode !== 'not_configured';
  const appleVerifier = config.appleSandbox
    ? dependencies.appleSignedDataVerifier
      ?? createRilloraAppleSandboxVerifier({
        rootCertificateDirectory: config.appleSandbox.rootCertificateDirectory,
      })
    : null;
  const storeKitSandboxIntake = config.appleSandbox && appleVerifier
    ? new StoreKitSandboxIntake(
        pool,
        appleVerifier,
        dependencies.appleSnapshotProvider
          ?? (config.appleSandbox.serverApi
          ? new AppleStoreKitSandboxSnapshotAdapter(
              dependencies.appleServerApi
                ?? createRilloraAppleSandboxServerApi(config.appleSandbox.serverApi),
              appleVerifier,
            )
          : null),
      )
    : null;

  if (stripeExecutor) {
    app.post(
      ["/api/commerce/stripe/webhook", "/commerce/stripe/webhook"],
      preventCaching,
      express.raw({ type: "application/json", limit: "256kb" }),
      createStripeWebhookHandler(stripeExecutor),
    );
  }
  if (storeKitSandboxIntake) {
    app.post(
      ["/api/commerce/storekit/sandbox/notifications", "/commerce/storekit/sandbox/notifications"],
      preventCaching,
      express.json({ limit: "256kb", strict: true, type: "application/json" }),
      createStoreKitSandboxNotificationHandler(storeKitSandboxIntake),
    );
  }
  if (appleProductionIntake) {
    app.post(['/api/commerce/storekit/production/notifications', '/commerce/storekit/production/notifications'],
      preventCaching, express.json({ limit: '256kb', strict: true, type: 'application/json' }),
      createAppleProductionNotificationHandler(appleProductionIntake));
  }
  if(appleReviewIntake) {
    app.post(['/api/commerce/storekit/review/notifications','/commerce/storekit/review/notifications'],
      preventCaching,express.json({limit:'256kb',strict:true,type:'application/json'}),
      createAppleProductionNotificationHandler(appleReviewIntake));
  }
  // File endpoints keep separate, authenticated transport bounds. Base64 adds
  // one third to ciphertext size; the import envelope also sits outside the
  // backup's own 2 MiB limit, which the handler enforces independently.
  const jsonTypes = ["application/json", "application/*+json"];
  const fileAuthentication = [preventCaching, authenticate(pool, config), requireWorkspaceIdentity];
  if (dependencies.legacyContent) {
    app.get(['/legacy-content/notice', '/api/legacy-content/notice'], contentNoticeHandler());
    app.post(['/v1/legacy-content/assets', '/api/v1/legacy-content/assets'], ...fileAuthentication, ...contentUploadHandlers(dependencies.legacyContent));
  }
  app.post(["/v1/account/map/import", "/api/v1/account/map/import"],
    ...fileAuthentication, express.json({ limit: mapBackupMaxBytes + 1024, strict: true, type: jsonTypes }));
  const encryptedPaths = ["/v1/exports/start-here/encrypted/:publicId/finalize", "/api/v1/exports/start-here/encrypted/:publicId/finalize"];
  if (config.allowSyntheticRecipientRehearsal) encryptedPaths.push(
    "/v1/recipient-rehearsals/:publicId/packages/:packagePublicId/finalize",
    "/api/v1/recipient-rehearsals/:publicId/packages/:packagePublicId/finalize",
  );
  app.post(encryptedPaths, ...fileAuthentication, express.json({ limit: "128kb", strict: true, type: jsonTypes }));
  app.use(
    express.json({
      limit: "64kb",
      strict: true,
      type: jsonTypes,
    }),
  );

  const authRouter = createAuthRouter(pool, config, dependencies);
  const publicDeletions = createPublicAccountDeletionRouter(pool);
  app.use("/account-deletions", preventCaching, publicDeletions);
  app.use("/api/account-deletions", preventCaching, publicDeletions);
  app.use("/auth", preventCaching, authRouter);
  app.use("/api/auth", preventCaching, authRouter);
  const publicSharing = createPublicSharingRouter(pool, config);
  app.use("/sharing", preventCaching, publicSharing);
  app.use("/api/sharing", preventCaching, publicSharing);
  if (dependencies.futureNoticesEnabled) {
    const futureNotices = createPublicFutureNoticeRouter(pool, config);
    app.use("/future-notices", preventCaching, futureNotices);
    app.use("/api/future-notices", preventCaching, futureNotices);
  }

  if (config.allowSyntheticRecipientRehearsal) {
    const recipientRehearsalRouter = createRecipientRehearsalRouter(pool);
    for (const path of ["/recipient-rehearsals", "/api/recipient-rehearsals"]) {
      app.use(path, preventCaching, rejectForbiddenSecretFields);
      app.use(path, preventCaching, recipientRehearsalRouter);
    }
  }

  const plannerApi = express.Router();
  plannerApi.use(preventCaching, authenticate(pool, config));
  plannerApi.use(requireWorkspaceIdentity, rejectForbiddenSecretFields);
  if (dependencies.legacyContent) plannerApi.use('/legacy-content', createContentRouter(dependencies.legacyContent));
  if (config.allowSyntheticRecipientRehearsal) {
    plannerApi.use(
      "/recipient-rehearsals",
      createPlannerRecipientRehearsalRouter(pool),
    );
  }
  plannerApi.use("/disclosure-rehearsals", createDisclosureRehearsalRouter(pool));
  plannerApi.use("/role-assignments", createRoleAssignmentRouter(pool));
  plannerApi.use("/sharing", createSharingRouter(pool, config, emailVerification));
  if (dependencies.futureNoticesEnabled) plannerApi.use("/future-notices", createFutureNoticeRouter(pool, config, emailVerification));
  plannerApi.use("/maintenance", createFamilyMaintenanceRouter(pool, config));
  if (stripeExecutor?.providerEnvironment === 'production') {
    plannerApi.use('/commerce/stripe', createStripeProductionCommerceRouter(stripeExecutor, { checkoutEnabled: stripeCheckoutEnabled }, config));
  } else if (stripeExecutor) {
    plannerApi.use(
      "/commerce/test",
      createStripeTestCommerceRouter(pool, stripeExecutor),
    );
  }
  if (storeKitSandboxIntake) {
    plannerApi.use(
      "/commerce/storekit/sandbox",
      createStoreKitSandboxRouter(storeKitSandboxIntake),
    );
  }
  if(appleReviewIntake) plannerApi.use('/commerce/storekit/review',appleReviewAccessRequired(pool,config),
    createAppleProductionRouter(appleReviewIntake,new ApplePurchasePreflight(pool,appleReviewContext),config));
  if (appleProductionIntake) plannerApi.use('/commerce/storekit/production', createAppleProductionRouter(appleProductionIntake,new ApplePurchasePreflight(pool),config));
  plannerApi.use("/commerce", createCommerceRouter(pool,
    new Set([...(stripeCheckoutEnabled ? ['stripe'] : []),...(appleProductionIntake ? ['storekit'] : [])]),
    stripeExecutor?.providerEnvironment ?? null));
  plannerApi.use("/account", createAccountIdentityRouter(pool, emailVerifier));
  if (dependencies.mcp) plannerApi.use('/account/ai-connections', dependencies.mcp.connections);
  plannerApi.use("/account", createAccountDataRouter(pool, config));
  plannerApi.use("/account", createAccountDeletionRouter(pool, accountDeletion, config));
  plannerApi.use(createApiRouter(pool, config));
  app.use("/v1", plannerApi);
  app.use("/api/v1", plannerApi);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const rejectForbiddenSecretFields: RequestHandler = (request, _response, next) => {
  if (!["POST", "PUT", "PATCH"].includes(request.method)) {
    next();
    return;
  }
  const field = findForbiddenSecretField(request.body);
  if (field) {
    next(
      new ApiError(
        400,
        "high_risk_secret_rejected",
        "Passwords, recovery codes, seed phrases and private keys are not accepted.",
        { field },
      ),
    );
    return;
  }
  next();
};
