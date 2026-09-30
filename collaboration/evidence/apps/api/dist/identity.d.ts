import type { NativeOidcConfig, OidcConfig } from "./config.js";
export type IdentityTransaction = {
    state: string;
    nonce: string;
    codeVerifier: string;
};
export type AuthorizationIntent = {
    screenHint?: "signup";
    prompt?: "login";
    maxAge?: number;
};
export type ExternalIdentity = {
    issuer: string;
    subject: string;
    displayName: string;
    locale: string;
    authenticatedAt: Date | null;
    authenticationMethods: string[];
    verifiedEmail?: string;
};
export interface IdentityProvider {
    createAuthorizationUrl(transaction: IdentityTransaction, intent?: AuthorizationIntent): Promise<URL>;
    exchangeAuthorizationCode(callbackUrl: URL, transaction: IdentityTransaction): Promise<ExternalIdentity>;
}
export interface NativeIdentityVerifier {
    verifyAccessToken(accessToken: string, idToken?: string): Promise<ExternalIdentity>;
}
export declare function createNativeOidcIdentityVerifier(config: NativeOidcConfig): NativeIdentityVerifier;
export declare function createOidcIdentityProvider(config: OidcConfig): IdentityProvider;
export declare function verifiedAuthenticationTime(value: unknown, now?: number): Date | null;
