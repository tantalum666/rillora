import { Router } from "express";
import type { SessionEmailVerification } from "./email-verification.js";
import type { AppConfig } from "./config.js";
import { type DatabasePool } from "./db.js";
export declare function createPublicSharingRouter(pool: DatabasePool, config: AppConfig): Router;
export declare function createSharingRouter(pool: DatabasePool, config: AppConfig, emailVerification?: SessionEmailVerification | null): Router;
