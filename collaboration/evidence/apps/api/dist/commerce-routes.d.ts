import type { Router } from "express";
import type { DatabasePool } from "./db.js";
export declare function createCommerceRouter(pool: DatabasePool, configuredPurchaseProviders?: ReadonlySet<string>): Router;
