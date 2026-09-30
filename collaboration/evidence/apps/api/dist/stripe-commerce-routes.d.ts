import type { RequestHandler, Router } from "express";
import type { DatabasePool } from "./db.js";
import { StripeCommerceExecutor } from "./stripe-commerce-executor.js";
export declare function createStripeWebhookHandler(executor: StripeCommerceExecutor): RequestHandler;
export declare function createStripeTestCommerceRouter(pool: DatabasePool, executor: StripeCommerceExecutor): Router;
