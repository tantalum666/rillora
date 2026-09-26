import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { requireCsrf } from './auth.js';
import { asyncHandler } from './errors.js';
import type { AppleProductionIntake } from './apple-production-intake.js';

export function createAppleProductionNotificationHandler(intake: AppleProductionIntake): RequestHandler {
  const schema = z.object({ signedPayload: z.string().min(1).max(256 * 1024) }).strict();
  return asyncHandler(async (request, response) => {
    const { signedPayload } = schema.parse(request.body);
    const result = await intake.acceptNotification(signedPayload);
    response.status(200).json({ received: result.received });
  });
}

export function createAppleProductionRouter(intake: AppleProductionIntake): Router {
  const router = Router();
  const schema = z.object({ signedTransaction: z.string().min(1).max(60 * 1024) }).strict();
  router.post('/transactions', requireCsrf, asyncHandler(async (request, response) => {
    const input = schema.parse(request.body);
    const result = await intake.acceptClientTransaction({ ...input,
      plannerId: request.auth.plannerId, plannerPublicId: request.auth.plannerPublicId });
    response.status(result.finishAuthorized ? 200 : 202).json({ contractVersion: 'commerce-apple-production-v1', result });
  }));
  return router;
}
