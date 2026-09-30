import { Router, type RequestHandler } from 'express';
import type { AppleProductionIntake } from './apple-production-intake.js';
import type { ApplePurchasePreflight } from './apple-purchase-preflight.js';
export declare function createAppleProductionNotificationHandler(intake: AppleProductionIntake): RequestHandler;
export declare function createAppleProductionRouter(intake: AppleProductionIntake, purchases: ApplePurchasePreflight): Router;
