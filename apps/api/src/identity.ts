import { createHash, timingSafeEqual } from "node:crypto";
import * as oidc from "openid-client";
import { createRemoteJWKSet, jwtVerify } from "jose";
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
  createAuthorizationUrl(
    transaction: IdentityTransaction,
    intent?: AuthorizationIntent,
  ): Promise<URL>;
  exchangeAuthorizationCode(
    callbackUrl: URL,
    transaction: IdentityTransaction,
  ): Promise<ExternalIdentity>;
}

export interface NativeIdentityVerifier {
  verifyAccessToken(accessToken: string, idToken?: string): Promise<ExternalIdentity>;
}

export function createNativeOidcIdentityVerifier(
  config: NativeOidcConfig,
): NativeIdentityVerifier {
  const issuer = `${config.issuerUrl.replace(/\/$/, "")}/`;
  const keySet = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));

  return {
    async verifyAccessToken(accessToken, idToken) {
      const { payload } = await jwtVerify(accessToken, keySet, {
        issuer,
        audience: config.audience,
        algorithms: ["RS256"],
        requiredClaims: ["sub", "iat", "exp", "azp", "scope"],
      });
      if (payload.azp !== config.clientId) {
        throw new Error("The access token was issued to a different client");
      }
      const scopes = typeof payload.scope === "string" ? payload.scope.split(/\s+/) : [];
      if (!scopes.includes("session:create")) {
        throw new Error("The access token is missing the session scope");
      }
      if (!payload.sub || typeof payload.iat !== "number") {
        throw new Error("The access token does not contain a valid subject");
      }
      const rawMethods = payload.amr;
      const authenticationMethods = Array.isArray(rawMethods)
        ? rawMethods.filter((value): value is string => typeof value === "string").slice(0, 10)
        : [];
      let authenticatedAt = verifiedAuthenticationTime(payload.auth_time);
      if (idToken !== undefined) {
        const { payload: id } = await jwtVerify(idToken, keySet, {
          issuer, audience: config.clientId, algorithms: ['RS256'], requiredClaims: ['sub', 'iat', 'exp'],
        });
        if (id.sub !== payload.sub || (id.azp !== undefined && id.azp !== config.clientId)) throw new Error('Identity proof mismatch');
        if (id.at_hash !== undefined) {
          const expected = createHash('sha256').update(accessToken).digest().subarray(0, 16).toString('base64url');
          if (typeof id.at_hash !== 'string' || id.at_hash.length !== expected.length
            || !timingSafeEqual(Buffer.from(expected), Buffer.from(id.at_hash))) throw new Error('Access token proof mismatch');
        }
        authenticatedAt = verifiedAuthenticationTime(id.auth_time);
      }
      let verifiedEmail: string | undefined;
      if (scopes.includes("openid") && scopes.includes("email")) {
        try {
          const response = await fetch(`${issuer}userinfo`, {
            headers: { authorization: `Bearer ${accessToken}` },
            signal: AbortSignal.timeout(5_000), redirect: "error",
          });
          if (response.ok) {
            const profile = await response.json() as Record<string, unknown>;
            if (profile.sub === payload.sub && profile.email_verified === true && typeof profile.email === "string" && profile.email.length <= 254) {
              verifiedEmail = profile.email;
            }
          }
        } catch {
          // Ordinary planning remains available; targeted acceptance fails closed.
        }
      }

      return {
        issuer: issuer.replace(/\/$/, ""),
        subject: payload.sub,
        displayName: "Planner",
        locale: "en",
        authenticatedAt,
        authenticationMethods,
        ...(verifiedEmail ? { verifiedEmail } : {}),
      };
    },
  };
}

export function createOidcIdentityProvider(config: OidcConfig): IdentityProvider {
  let discovered: Promise<oidc.Configuration> | undefined;
  const getConfiguration = () => {
    discovered ??= oidc.discovery(
      new URL(config.issuerUrl),
      config.clientId,
      config.clientSecret,
      oidc.ClientSecretPost(config.clientSecret),
    ).catch(error => {
      // Share concurrent discovery, but let the next explicit login attempt
      // recover after a transient provider or network failure.
      discovered = undefined;
      throw error;
    });
    return discovered;
  };

  return {
    async createAuthorizationUrl(transaction, intent) {
      const provider = await getConfiguration();
      const challenge = await oidc.calculatePKCECodeChallenge(transaction.codeVerifier);
      return oidc.buildAuthorizationUrl(provider, {
        redirect_uri: config.redirectUri,
        scope: "openid profile email",
        response_type: "code",
        code_challenge: challenge,
        code_challenge_method: "S256",
        state: transaction.state,
        nonce: transaction.nonce,
        max_age: String(intent?.maxAge ?? 86_400),
        ...(intent?.screenHint ? { screen_hint: intent.screenHint } : {}),
        ...(intent?.prompt ? { prompt: intent.prompt } : {}),
      });
    },

    async exchangeAuthorizationCode(callbackUrl, transaction) {
      const provider = await getConfiguration();
      const tokens = await oidc.authorizationCodeGrant(provider, callbackUrl, {
        expectedState: transaction.state,
        expectedNonce: transaction.nonce,
        pkceCodeVerifier: transaction.codeVerifier,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (!claims?.sub || !claims.iss) {
        throw new Error("The identity provider did not return a valid subject");
      }

      const rawName = claims.name ?? claims.nickname ?? claims.preferred_username;
      const displayName = typeof rawName === "string" ? rawName.trim().slice(0, 120) : "Planner";
      const rawLocale = claims.locale;
      const locale = typeof rawLocale === "string" && rawLocale.length <= 35 ? rawLocale : "en";
      const rawMethods = claims.amr;
      const authenticationMethods = Array.isArray(rawMethods)
        ? rawMethods.filter((value): value is string => typeof value === "string").slice(0, 10)
        : [];
      const authenticatedAt = verifiedAuthenticationTime(claims.auth_time);

      return {
        issuer: claims.iss.replace(/\/$/, ""),
        subject: claims.sub,
        displayName: displayName || "Planner",
        locale,
        authenticatedAt,
        authenticationMethods,
        ...(claims.email_verified === true && typeof claims.email === "string" && claims.email.length <= 254 ? { verifiedEmail: claims.email } : {}),
      };
    },
  };
}

export function verifiedAuthenticationTime(value: unknown, now = Date.now()): Date | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value * 1_000 <= now + 30_000
    ? new Date(value * 1_000) : null;
}
