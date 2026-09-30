import express, { type Express, type RequestHandler } from "express";
import { authenticate } from "./auth.js";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
import { findForbiddenSecretField } from "./domain.js";
import { ApiError, errorHandler, notFoundHandler } from "./errors.js";
import { createApiRouter } from "./routes.js";
import { createDisclosureRehearsalRouter } from "./disclosure-rehearsal-routes.js";
import { createCommerceRouter } from "./commerce-routes.js";
import { createRoleAssignmentRouter } from "./role-assignment-routes.js";
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
  stripeProvider?: StripeCommerceProvider;
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
  installSecurityMiddleware(app, config);

  app.get("/health/live", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/health/ready", async (_request, response) => {
    try {
      await pool.query("select 1");
      response.json({ status: "ready" });
    } catch {
      response.status(503).json({ status: "not_ready" });
    }
  });

  const stripeExecutor = config.stripeTest
    ? new StripeCommerceExecutor(
        pool,
        config.stripeTest,
        dependencies.stripeProvider ?? new StripeTestAdapter(config.stripeTest),
      )
    : null;
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
      "/api/commerce/stripe/webhook",
      preventCaching,
      express.raw({ type: "application/json", limit: "256kb" }),
      createStripeWebhookHandler(stripeExecutor),
    );
  }
  if (storeKitSandboxIntake) {
    app.post(
      "/api/commerce/storekit/sandbox/notifications",
      preventCaching,
      express.json({ limit: "256kb", strict: true, type: "application/json" }),
      createStoreKitSandboxNotificationHandler(storeKitSandboxIntake),
    );
  }
  app.use(
    express.json({
      limit: "64kb",
      strict: true,
      type: ["application/json", "application/*+json"],
    }),
  );

  const authRouter = createAuthRouter(pool, config, dependencies);
  app.use("/auth", preventCaching, authRouter);
  app.use("/api/auth", preventCaching, authRouter);

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
  if (stripeExecutor) {
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
  plannerApi.use("/commerce", createCommerceRouter(pool));
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
