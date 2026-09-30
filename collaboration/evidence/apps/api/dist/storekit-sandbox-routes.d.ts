import type { RequestHandler, Router } from "express";
import { StoreKitSandboxIntake } from "./storekit-sandbox-intake.js";
export declare function createStoreKitSandboxNotificationHandler(intake: StoreKitSandboxIntake): RequestHandler;
export declare function createStoreKitSandboxRouter(intake: StoreKitSandboxIntake): Router;
