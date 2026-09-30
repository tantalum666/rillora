import { type Router as ExpressRouter } from 'express';
import type { StripeCommerceExecutor } from './stripe-commerce-executor.js';
export declare function createStripeProductionCommerceRouter(executor: StripeCommerceExecutor): ExpressRouter;
