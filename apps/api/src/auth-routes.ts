import { createReauthenticationRouter, completeReauthentication, failReauthentication, type ReauthenticationTransaction } from "./reauthentication.js";
import { fetchInitialOverview } from "./overview.js";
import { createHash, randomBytes } from "node:crypto";
import { Router as createRouter, type CookieOptions, type Router } from "express";
import rateLimit from "express-rate-limit";
import * as oidc from "openid-client";
import { parseCookie } from "cookie";
import { z } from "zod";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
import { withAuthDatabase } from "./db.js";
import { ApiError, asyncHandler } from "./errors.js";
import type {
  ExternalIdentity,
  IdentityProvider,
  IdentityTransaction,
  NativeIdentityVerifier,
} from "./identity.js";
import { createNativeOidcIdentityVerifier, createOidcIdentityProvider } from "./identity.js";
import { verifiedEmailDigest } from "./sharing-identity.js";
import { sessionCookieName } from "./auth.js";
import { reviewAccessOpen, reviewIdentityAllowed } from './production-review-access.js';
import { createRateLimitKeyGenerator } from "./rate-limit-key.js";
import {
  currentLegalContract,
  legalBundleDigest,
  parseLegalAcceptance,
  type LegalAcceptance,
} from "./legal-contract.js";

export const csrfCookieName = "continuity_csrf";
const transactionCookieName = "continuity_auth_tx";

type StoredTransaction = ReauthenticationTransaction & {
  code_verifier: string;
  nonce: string;
  return_to: string;
  terms_version: string;
  privacy_version: string;
  consent_text_version: string;
  legal_bundle_sha256: Buffer;
  accepted_terms: boolean;
  acknowledged_privacy: boolean;
  accepted_electronic_records: boolean;
  legal_client_surface: "web";
};

type ProvisionedIdentity = {
  planner_id: string;
  planner_public_id: string;
  identity_account_id: string;
};

export type AuthDependencies = {
  identityProvider?: IdentityProvider;
  nativeIdentityVerifier?: NativeIdentityVerifier;
};

const authStartSchema = z.object({
  intent: z.enum(["signin", "signup"]),
  returnTo: z.string().optional(),
  selectAccount: z.boolean().optional(),
  legalAcceptance: z.unknown(),
}).strict();

export function createAuthRouter(
  pool: DatabasePool,
  config: AppConfig,
  dependencies: AuthDependencies = {},
): Router {
  const router = createRouter();
  const provider = config.oidc
    ? dependencies.identityProvider ?? createOidcIdentityProvider(config.oidc)
    : null;
  const nativeVerifier = config.nativeOidc
    ? dependencies.nativeIdentityVerifier ?? createNativeOidcIdentityVerifier(config.nativeOidc)
    : null;
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1_000,
    limit: config.nodeEnv === "test" ? 10_000 : 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: createRateLimitKeyGenerator(config.trustProxyHops),
  });

  router.use(["/reauthenticate", "/native/reauthenticate"], authLimiter);
  router.use(createReauthenticationRouter(pool, config, provider, nativeVerifier));

  router.get("/legal-contract", (_request, response) => {
    response.json({
      ...currentLegalContract,
      termsUrl: "https://legal.rillora.xyz/terms",
      privacyUrl: "https://legal.rillora.xyz/privacy",
      registrationRequiresAcceptance: true,
      recurringChargeRequiresSeparateConsent: true,
    });
  });

  router.get(
    "/session-status",
    asyncHandler(async (request, response) => {
      const sessionToken = parseCookie(request.get("cookie") ?? "")[sessionCookieName] ?? "";
      if (!isPlausibleOpaqueToken(sessionToken) || !reviewAccessOpen(config)) {
        response.json({ authenticated: false });
        return;
      }
      const result = await withAuthDatabase(pool, (client) => client.query<{ authenticated: boolean }>(
        `select exists (
           select 1
           from app.auth_sessions s
           join app.planners p on p.id = s.planner_id
           join app.legal_acceptances acceptance
             on acceptance.id = s.legal_acceptance_id
            and acceptance.planner_id = s.planner_id
           where s.token_hash = $1
             and s.credential_kind = 'browser_cookie'
             and s.revoked_at is null
             and s.expires_at > now()
             and (
               s.last_seen_at is null
               or s.last_seen_at > now() - make_interval(mins => $2)
             )
             and p.status = 'active'
             and acceptance.terms_version = $3
             and acceptance.privacy_version = $4
             and acceptance.legal_bundle_sha256 = $5
             and ($6::text[] is null or encode(acceptance.identity_reference_sha256, 'hex') = any($6))
         ) as authenticated`,
        [
          digestToken(sessionToken),
          config.sessionIdleMinutes,
          currentLegalContract.termsVersion,
          currentLegalContract.privacyVersion,
          Buffer.from(currentLegalContract.bundleSha256, "hex"),
          config.productionReviewAccess?.identityDigests ?? null,
        ],
      ));
      response.json({ authenticated: result.rows[0]?.authenticated === true });
    }),
  );

  router.get(
    "/login",
    authLimiter,
    asyncHandler(async () => {
      throw new ApiError(
        428,
        "legal_acceptance_required",
        "Open the Rillora account page and accept the current Terms and Privacy Policy first.",
      );
    }),
  );

  router.post(
    "/start",
    authLimiter,
    asyncHandler(async (request, response) => {
      if (!config.oidc || !provider) {
        throw new ApiError(503, "identity_not_configured", "Sign in is not configured.");
      }
      if (!reviewAccessOpen(config)) throw new ApiError(503, 'service_not_open', 'Account access is not open.');
      const parsed = authStartSchema.parse(request.body);
      const acceptance = parseLegalAcceptance(parsed.legalAcceptance);
      const returnTo = normalizeReturnPath(parsed.returnTo);
      const screenHint = parsed.intent === "signup" ? "signup" : undefined;
      const transactionToken = randomOpaqueToken();
      const transaction: IdentityTransaction = {
        state: oidc.randomState(),
        nonce: oidc.randomNonce(),
        codeVerifier: oidc.randomPKCECodeVerifier(),
      };

      await withAuthDatabase(pool, async (client) => {
        await client.query(
          `insert into app.auth_transactions (
             token_hash, state_hash, code_verifier, nonce, return_to, expires_at,
             legal_acceptance_required, terms_version, privacy_version,
             consent_text_version, legal_bundle_sha256, accepted_terms,
             acknowledged_privacy, accepted_electronic_records, legal_client_surface
           ) values (
             $1, $2, $3, $4, $5, now() + make_interval(secs => $6),
             true, $7, $8, $9, $10, true, true, true, 'web'
           )`,
          [
            digestToken(transactionToken),
            digestToken(transaction.state),
            transaction.codeVerifier,
            transaction.nonce,
            returnTo,
            config.authTransactionTtlSeconds,
            acceptance.termsVersion,
            acceptance.privacyVersion,
            acceptance.consentTextVersion,
            legalBundleDigest(acceptance),
          ],
        );
      });

      response.cookie(transactionCookieName, transactionToken, {
        ...baseCookieOptions(config),
        httpOnly: true,
        maxAge: config.authTransactionTtlSeconds * 1_000,
      });
      const authorizationUrl = await provider.createAuthorizationUrl(
        transaction,
        { ...(screenHint ? { screenHint } : {}), ...(parsed.selectAccount ? { prompt: "login" as const } : {}) },
      );
      response.status(201).json({ authorizationUrl: authorizationUrl.href });
    }),
  );

  router.get(
    "/callback",
    authLimiter,
    asyncHandler(async (request, response) => {
      if (!config.oidc || !provider) {
        throw new ApiError(503, "identity_not_configured", "Sign in is not configured.");
      }
      if (typeof request.query.error === "string") {
        const token = parseCookie(request.get("cookie") ?? "")[transactionCookieName] ?? "";
        const state = typeof request.query.state === "string" ? request.query.state : "";
        if (isPlausibleOpaqueToken(token) && isPlausibleOpaqueToken(state)) {
          const cancelled = await consumeTransaction(pool, token, state);
          if (cancelled?.reauth_session_public_id) await failReauthentication(pool, cancelled);
        }
        clearTransactionCookie(response, config);
        throw new ApiError(401, "identity_rejected", "Sign in was not completed.");
      }
      const state = typeof request.query.state === "string" ? request.query.state : "";
      const code = typeof request.query.code === "string" ? request.query.code : "";
      const transactionToken = parseCookie(request.get("cookie") ?? "")[transactionCookieName] ?? "";
      if (!isPlausibleOpaqueToken(transactionToken) || !isPlausibleOpaqueToken(state) || !code) {
        clearTransactionCookie(response, config);
        throw new ApiError(401, "identity_transaction_invalid", "Sign in could not be verified.");
      }

      const stored = await consumeTransaction(pool, transactionToken, state);
      clearTransactionCookie(response, config);
      if (!stored) {
        throw new ApiError(401, "identity_transaction_invalid", "Sign in could not be verified.");
      }

      const callbackUrl = new URL(config.oidc.redirectUri);
      callbackUrl.search = new URL(request.originalUrl, "http://local.invalid").search;
      let identity: ExternalIdentity;
      try {
        identity = await provider.exchangeAuthorizationCode(callbackUrl, {
          state, nonce: stored.nonce, codeVerifier: stored.code_verifier,
        });
        if (stored.reauth_session_public_id) {
          await completeReauthentication(pool, config, stored, identity, request);
          response.type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sign-in complete · Rillora</title><main><h1>Sign-in complete</h1><p>Return to your Rillora window and try your action again. You can close this window.</p></main></html>');
          return;
        }
      } catch (error) {
        if (stored.reauth_session_public_id) {
          await failReauthentication(pool, stored);
          response.status(403).type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><title>Sign in again · Rillora</title><main><h1>Sign in could not be verified</h1><p>Return to Rillora and sign in with the same account. Your changes have not been submitted. You can close this window.</p></main></html>');
          return;
        }
        throw error;
      }
      const session = await issueSession(
        pool,
        config,
        identity,
        "browser_cookie",
        storedLegalAcceptance(stored),
        "web",
      );

      response.cookie(sessionCookieName, session.sessionToken, {
        ...baseCookieOptions(config),
        httpOnly: true,
        maxAge: config.sessionTtlMinutes * 60 * 1_000,
      });
      response.cookie(csrfCookieName, session.csrfToken, {
        ...baseCookieOptions(config),
        httpOnly: false,
        maxAge: config.sessionTtlMinutes * 60 * 1_000,
      });
      response.redirect(303, new URL(stored.return_to, config.oidc.webAppOrigin).href);
    }),
  );

  router.post(
    "/native/session",
    authLimiter,
    asyncHandler(async (request, response) => {
      if (!config.nativeOidc || !nativeVerifier) {
        throw new ApiError(503, "native_identity_not_configured", "Native sign in is not configured.");
      }
      const authorization = request.get("authorization") ?? "";
      const match = /^Bearer ([A-Za-z0-9._~-]{80,16384})$/.exec(authorization);
      if (!match?.[1]) {
        throw new ApiError(401, "identity_token_invalid", "Sign in could not be verified.");
      }

      let identity: ExternalIdentity;
      try {
        const idToken = request.body?.idToken;
        if (idToken !== undefined && (typeof idToken !== "string" || idToken.length > 16384)) throw new Error("Invalid identity proof");
        identity = await nativeVerifier.verifyAccessToken(match[1], idToken);
      } catch {
        throw new ApiError(401, "identity_token_invalid", "Sign in could not be verified.");
      }
      const acceptance = parseLegalAcceptance(request.body?.legalAcceptance);
      const session = await issueSession(
        pool,
        config,
        identity,
        "native_bearer",
        acceptance,
        "ios",
      );
      // A verified native session can carry its first screen in the same response.
      // Failure to load records does not discard the successfully issued session; the app can retry.
      const overview = await fetchInitialOverview(pool, session.plannerId, {
        plannerPublicId: session.plannerPublicId, authenticationMode: "bearer",
        authenticationMethods: identity.authenticationMethods, authenticatedAt: identity.authenticatedAt,
      }).catch(() => null);
      response.status(201).json({
        overview,
        tokenType: "Bearer",
        sessionToken: session.sessionToken,
        expiresIn: config.sessionTtlMinutes * 60,
        plannerPublicId: session.plannerPublicId,
        authenticatedAt: identity.authenticatedAt,
        authenticationMethods: identity.authenticationMethods,
      });
    }),
  );

  return router;
}

async function consumeTransaction(
  pool: DatabasePool,
  transactionToken: string,
  state: string,
): Promise<StoredTransaction | null> {
  return withAuthDatabase(pool, async (client) => {
    const result = await client.query<StoredTransaction>(
      `update app.auth_transactions
       set consumed_at = now()
       where token_hash = $1 and state_hash = $2
         and consumed_at is null and expires_at > now()
         and legal_acceptance_required is true
       returning code_verifier, nonce, return_to, token_hash, created_at, reauth_session_public_id,
         terms_version, privacy_version, consent_text_version,
         legal_bundle_sha256, accepted_terms, acknowledged_privacy,
         accepted_electronic_records, legal_client_surface`,
      [digestToken(transactionToken), digestToken(state)],
    );
    return result.rows[0] ?? null;
  });
}

async function issueSession(
  pool: DatabasePool,
  config: AppConfig,
  identity: ExternalIdentity,
  credentialKind: "browser_cookie" | "native_bearer",
  acceptance: LegalAcceptance,
  clientSurface: "web" | "ios",
): Promise<{ sessionToken: string; csrfToken: string; plannerPublicId: string; plannerId: string }> {
  if (!reviewIdentityAllowed(config, digestIdentityReference(identity).toString('hex'))) {
    throw new ApiError(403, 'service_not_open', 'Account access is not open for this identity.');
  }
  const sessionToken = randomOpaqueToken();
  const csrfToken = randomOpaqueToken();
  const accountIds = await withAuthDatabase(pool, async (client) => {
    const deletion = await client.query<{ pending: boolean }>("select app.identity_deletion_pending($1,$2) as pending", [identity.issuer, identity.subject]);
    if (deletion.rows[0]?.pending) throw new ApiError(409, "account_deletion_pending", "Account deletion is in progress. Use your deletion reference to check its status.");
    const provisioned = await client.query<ProvisionedIdentity>(
      `select planner_id::text, planner_public_id::text, identity_account_id::text
       from app.provision_oidc_planner($1, $2, $3, $4, $5)`,
      [identity.issuer, identity.subject, identity.displayName, identity.locale, "UTC"],
    );
    const account = provisioned.rows[0];
    if (!account) throw new Error("Unable to provision the authenticated planner");
    const accepted = await client.query<{ id: string }>(
      `with inserted as (
         insert into app.legal_acceptances (
           planner_id, identity_account_id, terms_version, privacy_version,
           consent_text_version, legal_bundle_sha256, accepted_terms,
           acknowledged_privacy, accepted_electronic_records, client_surface,
           identity_reference_sha256
         ) values ($1, $2, $3, $4, $5, $6, true, true, true, $7, $8)
         on conflict (
           identity_account_id, terms_version, privacy_version,
           legal_bundle_sha256, client_surface
         ) do nothing
         returning id
       )
       select id::text from inserted
       union all
       select id::text from app.legal_acceptances
       where identity_account_id = $2
         and terms_version = $3
         and privacy_version = $4
         and legal_bundle_sha256 = $6
         and client_surface = $7
       limit 1`,
      [
        account.planner_id,
        account.identity_account_id,
        acceptance.termsVersion,
        acceptance.privacyVersion,
        acceptance.consentTextVersion,
        legalBundleDigest(acceptance),
        clientSurface,
        digestIdentityReference(identity),
      ],
    );
    const legalAcceptanceId = accepted.rows[0]?.id;
    if (!legalAcceptanceId) throw new Error("Unable to persist legal acceptance");
    await client.query(
      `insert into app.auth_sessions (
         planner_id, identity_account_id, token_hash, csrf_token_hash,
         authenticated_at, authentication_methods, credential_kind,
         legal_acceptance_id, last_seen_at, expires_at, verified_email_hash
       ) values (
         $1, $2, $3, $4, $5, $6::text[], $7, $8, now(),
         now() + make_interval(mins => $9), $10
       )`,
      [
        account.planner_id,
        account.identity_account_id,
        digestToken(sessionToken),
        digestToken(csrfToken),
        identity.authenticatedAt,
        identity.authenticationMethods,
        credentialKind,
        legalAcceptanceId,
        config.sessionTtlMinutes,
        identity.verifiedEmail ? verifiedEmailDigest(identity.verifiedEmail) : null,
      ],
    );
    await client.query(
      `with stale as (
         select id from app.auth_sessions
         where planner_id = $1 and revoked_at is null
         order by created_at desc offset 10
       )
       update app.auth_sessions set revoked_at = now()
       where id in (select id from stale)`,
      [account.planner_id],
    );
    return { plannerPublicId: account.planner_public_id, plannerId: account.planner_id };
  });
  return { sessionToken, csrfToken, ...accountIds };
}

function storedLegalAcceptance(stored: StoredTransaction): LegalAcceptance {
  return parseLegalAcceptance({
    termsVersion: stored.terms_version,
    privacyVersion: stored.privacy_version,
    consentTextVersion: stored.consent_text_version,
    bundleSha256: stored.legal_bundle_sha256.toString("hex"),
    acceptedTerms: stored.accepted_terms,
    acknowledgedPrivacy: stored.acknowledged_privacy,
    acceptedElectronicRecords: stored.accepted_electronic_records,
  });
}

function digestIdentityReference(identity: ExternalIdentity): Buffer {
  return createHash("sha256")
    .update(`${identity.issuer}\u001f${identity.subject}`, "utf8")
    .digest();
}

function normalizeReturnPath(value: unknown): string {
  if (value === undefined) return "/";
  if (
    typeof value !== "string" ||
    value.length > 500 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    throw new ApiError(400, "invalid_return_path", "The return path is invalid.");
  }
  return value;
}

function randomOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

function digestToken(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function isPlausibleOpaqueToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/.test(value);
}

function baseCookieOptions(config: AppConfig): CookieOptions {
  return {
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  };
}

function clearTransactionCookie(response: import("express").Response, config: AppConfig): void {
  response.clearCookie(transactionCookieName, {
    ...baseCookieOptions(config),
    httpOnly: true,
  });
}
