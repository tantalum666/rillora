import type { RequestHandler, Router } from "express";
import { Router as createRouter } from "express";
import { z } from "zod";
import { requireCsrf } from "./auth.js";
import { asyncHandler } from "./errors.js";
import { StoreKitSandboxIntake } from "./storekit-sandbox-intake.js";

const clientTransactionSchema = z.object({
  signedTransaction: z.string().min(1).max(64 * 1024),
  storefrontCountryCode: z.string().regex(/^[A-Z]{3}$/),
}).strict();

const notificationSchema = z.object({
  signedPayload: z.string().min(1).max(256 * 1024),
}).strict();

export function createStoreKitSandboxNotificationHandler(
  intake: StoreKitSandboxIntake,
): RequestHandler {
  return asyncHandler(async (request, response) => {
    const input = notificationSchema.parse(request.body);
    const result = await intake.acceptNotification(input.signedPayload);
    response.status(
      ["applied", "duplicate", "ignored"].includes(result.status) ? 200 : 202,
    ).json({
      contractVersion: "commerce-storekit-sandbox-notification-v1",
      result,
      boundaries: {
        sandboxOnly: true,
        authoritativeSnapshotLoaded: result.status === "applied",
        transactionFinishAuthorized: false,
        entitlementMutationEnabled: false,
      },
    });
  });
}

export function createStoreKitSandboxRouter(
  intake: StoreKitSandboxIntake,
): Router {
  const router = createRouter();
  router.post(
    "/transactions",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = clientTransactionSchema.parse(request.body);
      const result = await intake.acceptClientTransaction({
        plannerId: request.auth.plannerId,
        plannerPublicId: request.auth.plannerPublicId,
        signedTransaction: input.signedTransaction,
        storefrontCountryCode: input.storefrontCountryCode,
      });
      response.status(
        result.status === "applied" || result.status === "duplicate" ? 200 : 202,
      ).json({
        contractVersion: "commerce-storekit-sandbox-v1",
        result,
        boundaries: {
          sandboxOnly: true,
          serverAuthoritative: true,
          authoritativeSnapshotLoaded: result.authoritativeSnapshotLoaded,
          transactionFinishAuthorized: result.finishAuthorized,
          entitlementMutationEnabled: false,
          purchaseRouteEnabled: false,
        },
      });
    }),
  );
  return router;
}
