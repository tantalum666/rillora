import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { requireCsrf } from './auth.js';
import { ApiError, asyncHandler } from './errors.js';
import type { AppleProductionIntake } from './apple-production-intake.js';
import type { ApplePurchasePreflight } from './apple-purchase-preflight.js';
import { appleQuoteSchema, applePurchaseConsentSchema } from './apple-purchase-consent.js';

export function createAppleProductionNotificationHandler(intake: AppleProductionIntake): RequestHandler {
  const schema = z.object({ signedPayload: z.string().min(1).max(256 * 1024) }).strict();
  return asyncHandler(async (request, response) => {
    const { signedPayload } = schema.parse(request.body);
    const result = await intake.acceptNotification(signedPayload);
    response.status(200).json({ received: result.received });
  });
}

export function createAppleProductionRouter(intake: AppleProductionIntake, purchases: ApplePurchasePreflight): Router {
  const router = Router();
  router.get('/purchases/current',asyncHandler(async(request,response)=>{
    response.json(await purchases.current(request.auth.plannerId));
  }));
  const selection = z.object({ serviceMarketCode:z.string().regex(/^[A-Z][A-Z0-9_]{1,39}$/),
    storefrontCountryCode:z.string().regex(/^[A-Z]{3}$/) }).strict();
  router.get('/quote',asyncHandler(async(request,response)=>{
    response.json(await purchases.quote(request.auth.plannerId,selection.parse(request.query)));
  }));
  router.post('/prepare',requireCsrf,asyncHandler(async(request,response)=>{
    const body=z.object({quote:appleQuoteSchema,consent:applePurchaseConsentSchema,expectedAppAccountToken:z.uuid()}).strict().parse(request.body);
    if(body.expectedAppAccountToken.toLowerCase()!==request.auth.plannerPublicId.toLowerCase()) {
      throw new ApiError(409,'purchase_account_changed','Your account changed. Review the purchase again.');
    }
    response.status(201).json(await purchases.prepare({...body,plannerId:request.auth.plannerId,
      plannerPublicId:request.auth.plannerPublicId,nonce:z.uuid().parse(request.header('idempotency-key'))}));
  }));
  router.post('/purchases/:reference',requireCsrf,asyncHandler(async(request,response)=>{
    const {action}=z.object({action:z.enum(['start','pending','cancel'])}).strict().parse(request.body);
    response.json(await purchases.transition({plannerId:request.auth.plannerId,
      orderReference:z.uuid().parse(request.params.reference),action}));
  }));
  const schema = z.object({ signedTransaction: z.string().min(1).max(60 * 1024) }).strict();
  router.post('/transactions', requireCsrf, asyncHandler(async (request, response) => {
    const input = schema.parse(request.body);
    const result = await intake.acceptClientTransaction({ ...input,
      plannerId: request.auth.plannerId, plannerPublicId: request.auth.plannerPublicId });
    response.status(result.finishAuthorized ? 200 : 202).json({ contractVersion: 'commerce-apple-production-v1', result });
  }));
  return router;
}
