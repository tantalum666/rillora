import { createHash, timingSafeEqual } from "node:crypto";
import { parseCookie } from "cookie";
import type { RequestHandler } from "express";
import { z } from "zod";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
import { withAuthDatabase } from "./db.js";
import { ApiError } from "./errors.js";
import { currentLegalContract } from "./legal-contract.js";
import { verifiedEmailDigest } from "./sharing-identity.js";
import { reviewAccessOpen } from './production-review-access.js';

const developmentPlannerHeader = "x-dev-planner-id";
const csrfHeader = "x-csrf-token";
export const sessionCookieName = "continuity_session";

/** The header is a consistency precondition, never authority to choose a tenant. */
export const requireWorkspaceIdentity: RequestHandler = (request, _response, next) => {
  const expected = request.get('x-rillora-planner');
  if (expected !== undefined && expected.toLowerCase() !== request.auth.plannerPublicId.toLowerCase()) {
    next(new ApiError(409, 'account_changed', 'The signed-in account changed. Reload before continuing.'));
    return;
  }
  if (request.auth.mode === 'session' && !['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !expected) {
    requireCsrf(request, _response, error => next(error ?? new ApiError(409, 'workspace_identity_required', 'Reload your map before making changes.')));
    return;
  }
  next();
};

type PlannerIdentityRow = {
  planner_id: string;
  planner_public_id: string;
};

type SessionIdentityRow = PlannerIdentityRow & {
  session_public_id: string;
  csrf_token_hash: Buffer;
  authentication_methods: string[];
  authenticated_at: Date | null;
  credential_kind: "browser_cookie" | "native_bearer";
  verified_email_hash: Buffer | null;
};

function digestToken(token: string): Buffer {
  return createHash("sha256").update(token, "utf8").digest();
}

function isPlausibleOpaqueToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43,128}$/.test(token);
}

export function authenticate(pool: DatabasePool, config: AppConfig): RequestHandler {
  return async (request, _response, next) => {
    try {
      if (!reviewAccessOpen(config)) throw new ApiError(403, 'service_not_open', 'Account access is not open.');
      const developmentPlannerId = request.get(developmentPlannerHeader);
      if (developmentPlannerId !== undefined) {
        if (!config.allowDevAuth || config.nodeEnv === "production") {
          throw new ApiError(401, "authentication_required", "Authentication is required.");
        }

        const publicId = z.uuid().parse(developmentPlannerId);
        const identity = await withAuthDatabase(pool, async (client) => {
          const result = await client.query<PlannerIdentityRow>(
            `select id::text as planner_id, public_id::text as planner_public_id
             from app.planners
             where public_id = $1 and status = 'active'`,
            [publicId],
          );
          return result.rows[0] ?? null;
        });
        if (!identity) {
          throw new ApiError(401, "authentication_required", "Authentication is required.");
        }
        request.auth = { ...identityToRequest(identity), mode: "development",
          // Explicit synthetic address; never used when development auth is off.
          verifiedEmailHash: verifiedEmailDigest(`${publicId.toLowerCase()}@example.test`) };
        next();
        return;
      }

      const authorization = request.get("authorization");
      let token: string | undefined;
      let credentialKind: "browser_cookie" | "native_bearer";
      if (authorization !== undefined) {
        const match = /^Bearer ([A-Za-z0-9_-]{43,128})$/.exec(authorization);
        if (!match?.[1]) {
          throw new ApiError(401, "authentication_required", "Authentication is required.");
        }
        token = match[1];
        credentialKind = "native_bearer";
      } else {
        const cookies = parseCookie(request.get("cookie") ?? "");
        token = cookies[sessionCookieName];
        credentialKind = "browser_cookie";
      }
      if (!token || !isPlausibleOpaqueToken(token)) {
        throw new ApiError(401, "authentication_required", "Authentication is required.");
      }

      const tokenHash = digestToken(token);
      const identity = await withAuthDatabase(pool, async (client) => {
        const result = await client.query<SessionIdentityRow>(
          `select
             p.id::text as planner_id,
             p.public_id::text as planner_public_id,
             s.public_id::text as session_public_id,
             s.csrf_token_hash,
             s.authentication_methods,
             s.authenticated_at,
             s.credential_kind,
             s.verified_email_hash
           from app.auth_sessions s
           join app.planners p on p.id = s.planner_id
           join app.legal_acceptances acceptance
             on acceptance.id = s.legal_acceptance_id
            and acceptance.planner_id = s.planner_id
           where s.token_hash = $1
             and s.credential_kind = $3
             and s.revoked_at is null
             and s.expires_at > now()
             and (
               s.last_seen_at is null
               or s.last_seen_at > now() - make_interval(mins => $2)
             )
             and p.status = 'active'
             and acceptance.terms_version = $4
             and acceptance.privacy_version = $5
             and acceptance.legal_bundle_sha256 = $6
             and ($7::text[] is null or encode(acceptance.identity_reference_sha256, 'hex') = any($7))`,
          [
            tokenHash,
            config.sessionIdleMinutes,
            credentialKind,
            currentLegalContract.termsVersion,
            currentLegalContract.privacyVersion,
            Buffer.from(currentLegalContract.bundleSha256, "hex"),
            config.productionReviewAccess?.identityDigests ?? null,
          ],
        );
        const row = result.rows[0] ?? null;
        if (row) {
          await client.query(
            `update app.auth_sessions
             set last_seen_at = now()
             where public_id = $1
               and (last_seen_at is null or last_seen_at < now() - interval '5 minutes')`,
            [row.session_public_id],
          );
        }
        return row;
      });

      if (!identity) {
        throw new ApiError(401, "authentication_required", "Authentication is required.");
      }

      request.auth = {
        ...identityToRequest(identity),
        mode: identity.credential_kind === "native_bearer" ? "bearer" : "session",
        sessionPublicId: identity.session_public_id,
        csrfTokenHash: identity.csrf_token_hash,
        authenticationMethods: identity.authentication_methods,
        authenticatedAt: identity.authenticated_at,
        ...(identity.verified_email_hash ? { verifiedEmailHash: identity.verified_email_hash } : {}),
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

function identityToRequest(identity: PlannerIdentityRow): {
  plannerId: string;
  plannerPublicId: string;
} {
  return {
    plannerId: identity.planner_id,
    plannerPublicId: identity.planner_public_id,
  };
}

export const requireCsrf: RequestHandler = (request, _response, next) => {
  if (request.auth.mode === "development" || request.auth.mode === "bearer") {
    next();
    return;
  }

  const token = request.get(csrfHeader);
  const expected = request.auth.csrfTokenHash;
  if (!token || !expected || !isPlausibleOpaqueToken(token)) {
    next(new ApiError(403, "csrf_validation_failed", "The request could not be verified."));
    return;
  }

  const actual = digestToken(token);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    next(new ApiError(403, "csrf_validation_failed", "The request could not be verified."));
    return;
  }
  next();
};
