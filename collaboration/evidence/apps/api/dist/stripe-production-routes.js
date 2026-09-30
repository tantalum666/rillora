import { Router } from 'express';
import { z } from 'zod';
import { requireCsrf } from './auth.js';
import { asyncHandler } from './errors.js';
import { stripeTestIdempotencyKeySchema } from './domain.js';
import { purchaseConsentContract, purchaseConsentSchema } from './purchase-consent.js';
const checkoutInput = z.object({ billingPeriod: z.literal('annual'), purchaseConsent: purchaseConsentSchema }).strict();
export function createStripeProductionCommerceRouter(executor) {
    if (executor.providerEnvironment !== 'production')
        throw new Error('Production billing requires a production executor');
    const router = Router();
    router.get('/status', asyncHandler(async (request, response) => {
        response.json(await executor.loadProductionStatus(request.auth.plannerId));
    }));
    router.get('/quote', (_request, response) => {
        response.json({ contractVersion: 'commerce-stripe-production-v1', purchaseConsent: purchaseConsentContract,
            requiresFreshEvaluation: true, applicableTaxShownAtCheckout: true });
    });
    router.post('/checkout', requireCsrf, asyncHandler(async (request, response) => {
        const input = checkoutInput.parse(request.body);
        const result = await executor.createCheckout({ plannerId: request.auth.plannerId, billingPeriod: input.billingPeriod,
            idempotencySeed: stripeTestIdempotencyKeySchema.parse(request.header('idempotency-key')), purchaseConsent: input.purchaseConsent });
        response.status(201).json({ contractVersion: 'commerce-stripe-production-v1', checkout: result,
            boundaries: { testOnly: false, callbackGrantsAccess: false, providerSnapshotRequired: true } });
    }));
    router.post('/portal', requireCsrf, asyncHandler(async (request, response) => {
        response.status(201).json({ contractVersion: 'commerce-stripe-production-v1', portal: await executor.createPortal(request.auth.plannerId) });
    }));
    router.post('/checkout/cancel', requireCsrf, asyncHandler(async (request, response) => {
        await executor.cancelPendingCheckout(request.auth.plannerId);
        response.json({ canceled: true });
    }));
    return router;
}
