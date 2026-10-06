import type { Request } from "express";
import { Router } from "express";
import { withAuthDatabase, withPlannerDatabase, type DatabasePool } from "./db.js";
import type { EmailIdentity, EmailIdentityVerifying } from "./email-verification.js";
import { ApiError, asyncHandler } from "./errors.js";

export type AccountIdentity = {
  account: { publicId: string; displayName: string; verifiedEmail: string | null };
  emailStatus: "available" | "not_provided" | "unavailable";
};

/** A display-only projection. It grants no access and never persists provider email. */
export async function loadAccountIdentity(pool: DatabasePool, auth: Request["auth"], verifier: EmailIdentityVerifying | null): Promise<AccountIdentity> {
  const account = await withPlannerDatabase(pool, auth.plannerId, async client =>
    (await client.query<{ public_id: string; display_name: string }>(
      `select public_id, display_name from app.planners
       where id = app.current_planner_id() and status = 'active'`,
    )).rows[0]);
  if (!account || account.public_id !== auth.plannerPublicId) throw expiredSession();
  const result: AccountIdentity = {
    account: { publicId: account.public_id, displayName: account.display_name, verifiedEmail: null },
    emailStatus: "unavailable",
  };
  // Development fixtures do not impersonate an OIDC identity or fabricate email.
  if (auth.mode === "development") return result;
  if (!auth.sessionPublicId) throw expiredSession();
  const readIdentity = () => withAuthDatabase(pool, async client =>
    (await client.query<EmailIdentity>(
      `select i.issuer, i.subject from app.auth_sessions s
       join app.identity_accounts i on i.id = s.identity_account_id and i.planner_id = s.planner_id
       join app.planners p on p.id = s.planner_id
       where s.public_id = $1 and s.planner_id = $2 and s.revoked_at is null
         and s.expires_at > now() and p.status = 'active'`,
      [auth.sessionPublicId, auth.plannerId],
    )).rows[0]);
  const identity = await readIdentity();
  if (!identity) throw expiredSession();
  if (verifier) {
    try {
      // The existing verifier allows only configured issuers, checks exact user_id,
      // requires boolean email_verified and validates email. Never accept a client hint.
      const email = await verifier.verifiedEmail(identity);
      result.account.verifiedEmail = email;
      result.emailStatus = email ? "available" : "not_provided";
    } catch {
      // The account remains identifiable and usable during provider outages.
    }
  }
  // Discard a slow provider result if the session was revoked/remapped while waiting.
  const current = await readIdentity();
  if (!current || current.issuer !== identity.issuer || current.subject !== identity.subject) throw expiredSession();
  return result;
}

function expiredSession() {
  return new ApiError(401, "authentication_required", "Sign in to view the current account.");
}

export function createAccountIdentityRouter(pool: DatabasePool, verifier: EmailIdentityVerifying | null) {
  const router = Router();
  router.get("/identity", asyncHandler(async (request, response) => {
    response.json(await loadAccountIdentity(pool, request.auth, verifier));
  }));
  return router;
}
