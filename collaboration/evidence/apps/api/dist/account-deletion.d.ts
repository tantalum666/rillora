import type { AppConfig } from "./config.js";
import { type DatabasePool } from "./db.js";
export type AccountDeletionConfig = {
    domain: string;
    clientId: string;
    clientSecret: string;
    allowedIssuers: string[];
};
export type DeletionIdentity = {
    issuer: string;
    subject: string;
};
export interface AccountIdentityDeleting {
    deleteIdentity(identity: DeletionIdentity): Promise<void>;
}
export declare class Auth0AccountIdentityDeleter implements AccountIdentityDeleting {
    private config;
    private transport;
    private token;
    constructor(config: AccountDeletionConfig, transport?: typeof fetch);
    deleteIdentity(identity: DeletionIdentity): Promise<void>;
}
export declare class AccountDeletionProcessor {
    private pool;
    private deleter;
    private running;
    constructor(pool: DatabasePool, deleter: AccountIdentityDeleting | null);
    get identityCleanupConfigured(): boolean;
    process(publicId?: string | null): Promise<void>;
}
export declare function createAccountDeletionRouter(pool: DatabasePool, processor: AccountDeletionProcessor, config: AppConfig): import("express-serve-static-core").Router;
export declare function createPublicAccountDeletionRouter(pool: DatabasePool): import("express-serve-static-core").Router;
export declare function deletionProcessor(pool: DatabasePool, config: AppConfig, override?: AccountIdentityDeleting): AccountDeletionProcessor;
