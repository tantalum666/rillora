import express, { type Express, type RequestHandler } from "express";
import type { AppleProductionIntake } from './apple-production-intake.js';
import { createAppleProductionNotificationHandler, createAppleProductionRouter } from './apple-production-routes.js';
import { appleReviewContext, appleProductionContext } from './apple-execution-context.js';
import { ApplePurchasePreflight } from './apple-purchase-preflight.js';
import { authenticate } from "./auth.js";
import { Auth0EmailIdentityVerifier, SessionEmailVerification, type EmailIdentityVerifying } from "./email-verification.js";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
import { checkContentKeys } from "./db.js";
import { checkRecoveryJournal } from './recovery-journal.js';
import { findForbiddenSecretField } from "./domain.js";
import { ApiError, errorHandler, notFoundHandler } from "./errors.js";
import { createApiRouter } from "./routes.js";
import { createAccountDataRouter } from "./account-data-routes.js";
import { createAccountDeletionRouter, createPublicAccountDeletionRouter, deletionProcessor, type AccountIdentityDeleting, type AccountDeletionProcessor } from "./account-deletion.js";
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
  appleReviewIntake?: AppleProductionIntake;
  appleProductionIntake?: AppleProductionIntake;
  transportReady?: () => boolean;
  emailIdentityVerifier?: EmailIdentityVerifying;
  accountIdentityDeleter?: AccountIdentityDeleting;
  accountDeletionProcessor?: AccountDeletionProcessor;
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
  // A bounded map import needs more room than ordinary mutations. Authenticate
  // before reading its larger body; the usual parser skips the already-read body.
  app.use(["/v1/account/map/import", "/api/v1/account/map/import"],
    preventCaching, authenticate(pool, config), express.json({ limit:"2mb",strict:true,type:"application/json" }));
  app.use(
    express.json({
      limit: "64kb",
      strict: true,
      type: ["application/json", "application/*+json"],
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

  if (config.allowSyntheticRecipientRehearsal) {
    const recipientRehearsalRouter = createRecipientRehearsalRouter(pool);
    for (const path of ["/recipient-rehearsals", "/api/recipient-rehearsals"]) {
      app.use(path, preventCaching, rejectForbiddenSecretFields);
      app.use(path, preventCaching, recipientRehearsalRouter);
    }
  }

  const plannerApi = express.Router();
  plannerApi.use(preventCaching, authenticate(pool, config));
  plannerApi.use(rejectForbiddenSecretFields);
  if (config.allowSyntheticRecipientRehearsal) {
    plannerApi.use(
      "/recipient-rehearsals",
      createPlannerRecipientRehearsalRouter(pool),
    );
  }
  plannerApi.use("/disclosure-rehearsals", createDisclosureRehearsalRouter(pool));
  plannerApi.use("/role-assignments", createRoleAssignmentRouter(pool));
  plannerApi.use("/sharing", createSharingRouter(pool, config, emailVerification));
  plannerApi.use("/maintenance", createFamilyMaintenanceRouter(pool, config));
  if (stripeExecutor?.providerEnvironment === 'production') {
    plannerApi.use('/commerce/stripe', createStripeProductionCommerceRouter(stripeExecutor));
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
  if(appleReviewIntake) plannerApi.use('/commerce/storekit/review',createAppleProductionRouter(appleReviewIntake,new ApplePurchasePreflight(pool,appleReviewContext)));
  if (appleProductionIntake) plannerApi.use('/commerce/storekit/production', createAppleProductionRouter(appleProductionIntake,new ApplePurchasePreflight(pool)));
  plannerApi.use("/commerce", createCommerceRouter(pool,
    new Set([...(stripeExecutor?.providerEnvironment === 'production' ? ['stripe'] : []),...(appleProductionIntake ? ['storekit'] : [])])));
  plannerApi.use("/account", createAccountDataRouter(pool));
  plannerApi.use("/account", createAccountDeletionRouter(pool, accountDeletion));
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
