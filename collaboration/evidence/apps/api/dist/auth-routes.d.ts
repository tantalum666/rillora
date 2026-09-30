import { type Router } from "express";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
import type { IdentityProvider, NativeIdentityVerifier } from "./identity.js";
export declare const csrfCookieName = "continuity_csrf";
export type AuthDependencies = {
    identityProvider?: IdentityProvider;
    nativeIdentityVerifier?: NativeIdentityVerifier;
};
export declare function createAuthRouter(pool: DatabasePool, config: AppConfig, dependencies?: AuthDependencies): Router;
