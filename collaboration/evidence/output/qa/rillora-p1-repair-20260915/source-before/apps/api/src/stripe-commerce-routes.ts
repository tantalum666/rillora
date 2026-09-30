import type { RequestHandler, Router } from "express";
import { Router as createRouter } from "express";
import type { DatabasePool } from "./db.js";
import {
  stripeTestCheckoutRequestSchema,
  stripeTestIdempotencyKeySchema,
} from "./domain.js";
import { ApiError, asyncHandler } from "./errors.js";
import { StripeCommerceExecutor } from "./stripe-commerce-executor.js";

export function createStripeWebhookHandler(
  executor: StripeCommerceExecutor,
): RequestHandler {
  return asyncHandler(async (request, response) => {
    if (!Buffer.isBuffer(request.body)) {
      throw new ApiError(400, "stripe_raw_body_required", "Stripe webhook requires a raw body.");
    }
    const signature = request.header("stripe-signature");
    if (!signature) {
      throw new ApiError(
        400,
        "stripe_signature_required",
        "Stripe webhook signature is required.",
      );
    }
    const result = await executor.acceptWebhook(request.body, signature);
    response.status(result.status === "needs_mapping" ? 202 : 200).json(result);
  });
}

export function createStripeTestCommerceRouter(
  _pool: DatabasePool,
  executor: StripeCommerceExecutor,
): Router {
  const router = createRouter();

  router.post(
    "/checkout",
    asyncHandler(async (request, response) => {
      const input = stripeTestCheckoutRequestSchema.parse(request.body);
      const idempotencySeed = stripeTestIdempotencyKeySchema.parse(
        request.header("idempotency-key"),
      );
      const checkout = await executor.createCheckout({
        plannerId: request.auth.plannerId,
        billingPeriod: input.billingPeriod,
        idempotencySeed,
      });
      response.status(201).json({
        contractVersion: "commerce-stripe-test-v1",
        checkout,
        boundaries: {
          testOnly: true,
          salesEnabled: false,
          purchaseRouteEnabled: false,
          callbackGrantsAccess: false,
          entitlementMutationEnabled: false,
        },
      });
    }),
  );

  router.post(
    "/portal",
    asyncHandler(async (request, response) => {
      const portal = await executor.createPortal(request.auth.plannerId);
      response.status(201).json({
        contractVersion: "commerce-stripe-test-v1",
        portal,
        boundaries: { testOnly: true, salesEnabled: false },
      });
    }),
  );

  router.get(
    "/status",
    asyncHandler(async (request, response) => {
      response.json(await executor.loadTestStatus(request.auth.plannerId));
    }),
  );

  return router;
}
