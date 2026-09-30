import { Router, type Request } from 'express';
import type { AppConfig } from './config.js';
import { type DatabasePool } from './db.js';
import type { ExternalIdentity, IdentityProvider, NativeIdentityVerifier } from './identity.js';
export type ReauthenticationTransaction = {
    reauth_session_public_id: string | null;
    token_hash: Buffer;
    created_at: Date;
};
export declare function createReauthenticationRouter(pool: DatabasePool, config: AppConfig, provider: IdentityProvider | null, nativeVerifier: NativeIdentityVerifier | null): Router;
export declare function failReauthentication(pool: DatabasePool, transaction: ReauthenticationTransaction): Promise<void>;
export declare function completeReauthentication(pool: DatabasePool, config: AppConfig, transaction: ReauthenticationTransaction, identity: ExternalIdentity, request: Request): Promise<void>;
