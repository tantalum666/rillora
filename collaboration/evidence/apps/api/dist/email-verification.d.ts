import type { Request } from "express";
import type { DatabasePool } from "./db.js";
export type EmailVerificationConfig = {
    domain: string;
    clientId: string;
    clientSecret: string;
    allowedIssuers: string[];
};
export type EmailIdentity = {
    issuer: string;
    subject: string;
};
export interface EmailIdentityVerifying {
    verifiedEmail(identity: EmailIdentity): Promise<string | null>;
}
/** Read current provider proof for one server-selected identity. Never set email_verified. */
export declare class Auth0EmailIdentityVerifier implements EmailIdentityVerifying {
    private config;
    private transport;
    private token;
    constructor(config: EmailVerificationConfig, transport?: typeof fetch);
    verifiedEmail(identity: EmailIdentity): Promise<string | null>;
}
export declare class SessionEmailVerification {
    private pool;
    private verifier;
    constructor(pool: DatabasePool, verifier: EmailIdentityVerifying | null);
    refresh(auth: Request["auth"]): Promise<Buffer | null>;
}
