import type { RequestHandler } from "express";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
export declare const sessionCookieName = "continuity_session";
/** The header is a consistency precondition, never authority to choose a tenant. */
export declare const requireWorkspaceIdentity: RequestHandler;
export declare function authenticate(pool: DatabasePool, config: AppConfig): RequestHandler;
export declare const requireCsrf: RequestHandler;
