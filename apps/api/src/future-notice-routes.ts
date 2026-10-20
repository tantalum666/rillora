import { createHash, randomBytes } from "node:crypto";
import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import type { PoolClient } from "pg";
import { z } from "zod";
import { requireCsrf } from "./auth.js";
import type { AppConfig } from "./config.js";
import { withAuthDatabase, withPlannerDatabase, type DatabasePool } from "./db.js";
import type { SessionEmailVerification } from "./email-verification.js";
import { ApiError, asyncHandler } from "./errors.js";
import { recentAuthenticationRequired } from "./recent-authentication.js";
import { readSecurityCookie, securityCookieName, usesSecureCookies } from "./security-cookies.js";
import { emailMatchKey, maskedEmail, scopedEmailDigest, verifiedEmailDigest } from "./sharing-identity.js";

const id = z.uuid().transform(value => value.toLowerCase());
const version = z.number().int().positive();
const token = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const challenge = z.object({ invitationToken: token.optional(), invitationPublicId: id.optional() }).strict()
  .refine(input => Boolean(input.invitationToken) !== Boolean(input.invitationPublicId));
const respond = z.object({
  invitationToken: token.optional(), invitationPublicId: id.optional(),
  action: z.enum(["acknowledge", "decline"]), expectedVersion: version,
}).strict().refine(input => Boolean(input.invitationToken) !== Boolean(input.invitationPublicId));
const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
const cookieName = (config: AppConfig, publicId: string) => securityCookieName(config, `rillora_future_${publicId.replaceAll("-", "")}`);
const cookieOptions = (config: AppConfig) => ({ httpOnly: true, secure: usesSecureCookies(config), sameSite: "lax" as const, path: "/" });

export function futureNoticesEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.RILLORA_FUTURE_NOTICES_ENABLED ?? "false";
  if (value !== "true" && value !== "false") throw new Error("Future notices flag must be true or false");
  return value === "true";
}

type OwnerNotice = {
  publicId: string; personPublicId: string; emailHint: string; status: string;
  expiresAt: Date; acknowledgedAt: Date | null; version: number;
};
type PublicNotice = { publicId: string; status: string; expiresAt: string; purpose: string; contentAvailable: false };
type Result = { error?: string; publicId?: string; status?: string; version?: number };
const ownerProjection = `select n.public_id as "publicId",person.public_id as "personPublicId",
 n.recipient_email_label as "emailHint",n.status,n.invitation_expires_at as "expiresAt",
 n.acknowledged_at as "acknowledgedAt",n.version
 from app.future_recipient_notices n join app.people person on person.id=n.person_id and person.planner_id=n.planner_id`;

function present(row: OwnerNotice) {
  return { ...row, status: row.status === "pending" && row.expiresAt <= new Date() ? "expired" : row.status,
    expiresAt: row.expiresAt.toISOString(), acknowledgedAt: row.acknowledgedAt?.toISOString() ?? null,
    purpose: "future_notice" as const, contentAvailable: false as const };
}
async function owned(client: PoolClient, publicId: string) {
  const result = await client.query<OwnerNotice>(`${ownerProjection}
   where n.planner_id=app.current_planner_id() and n.public_id=$1 and person.status not in('archived','revoked')`, [publicId]);
  if (!result.rows[0]) throw new ApiError(404, "future_notice_unavailable", "This arrangement notice is not available.");
  return present(result.rows[0]);
}
async function audit(client: PoolClient, action: string, publicId: string) {
  await client.query(`insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
   values(app.current_planner_id(),'planner',$1,'future_notice',$2,
    '{"purpose":"future_notice","contentAvailable":false,"deliveryConfirmed":false}'::jsonb)`, [action, publicId]);
}
function invitationUrl(config: AppConfig, value: string) {
  const origin = config.oidc?.webAppOrigin ?? (config.nodeEnv !== "production" ? [...config.corsOrigins][0] : null);
  if (!origin) throw new ApiError(503, "sharing_not_configured", "Invitation links are not configured.");
  const url = new URL("/future-invite", origin);
  url.hash = `invitation=${value}`;
  return url.toString();
}
async function publicPreview(pool: DatabasePool, hash: Buffer) {
  const value = await withAuthDatabase(pool, async client =>
    (await client.query<{ notice: PublicNotice | null }>("select app.future_notice_public_preview($1) as notice", [hash])).rows[0]?.notice);
  if (!value) throw new ApiError(404, "invitation_unavailable", "This invitation is not available. Ask for a new link.");
  return value;
}
async function challengeHash(pool: DatabasePool, request: Request, input: z.infer<typeof challenge>, config: AppConfig) {
  if (input.invitationToken) return digest(input.invitationToken);
  const handoff = readSecurityCookie(request.get("cookie"), cookieName(config, input.invitationPublicId!));
  if (!handoff || !token.safeParse(handoff).success) throw new ApiError(404, "invitation_unavailable", "Open the original invitation again.");
  return withAuthDatabase(pool, async client => {
    const result = await client.query<{ invitation_token_hash: Buffer }>(
      "select invitation_token_hash from app.future_notice_handoffs where token_hash=$1 and notice_public_id=$2 and expires_at>now()",
      [digest(handoff), input.invitationPublicId]);
    if (!result.rows[0]) throw new ApiError(404, "invitation_unavailable", "Open the original invitation again.");
    return result.rows[0].invitation_token_hash;
  });
}
function throwResultError(result: Result | undefined): asserts result is Result {
  if (!result || result.error) {
    const code = result?.error ?? "invitation_unavailable";
    const messages: Record<string, string> = {
      verified_email_required: "Verify the invited email, then return here.",
      invitation_account_mismatch: "Use the account with the invited email address.",
      self_invitation: "Use the recipient's account to respond.",
      invitation_expired: "This invitation expired. Ask for a new link.",
      future_notice_changed: "This arrangement changed. Reload before continuing.",
    };
    throw new ApiError(code === "future_notice_changed" ? 409 : 403, code, messages[code] ?? "This invitation is not available.");
  }
}

export function createPublicFutureNoticeRouter(pool: DatabasePool, config: AppConfig) {
  const router = Router();
  router.use(rateLimit({ windowMs: 60_000, limit: config.nodeEnv === "test" ? 10_000 : 30,
    standardHeaders: "draft-8", legacyHeaders: false }));
  router.post("/invitations/resolve", asyncHandler(async (request, response) => {
    const input = z.object({ invitationToken: token }).strict().parse(request.body);
    const hash = digest(input.invitationToken);
    const notice = await publicPreview(pool, hash);
    const handoff = randomBytes(32).toString("base64url");
    await withAuthDatabase(pool, async client => {
      await client.query(`delete from app.future_notice_handoffs where token_hash in
       (select token_hash from app.future_notice_handoffs where expires_at<=now() order by expires_at limit 1000)`);
      await client.query(`insert into app.future_notice_handoffs(token_hash,invitation_token_hash,notice_public_id,expires_at)
       values($1,$2,$3,now()+interval '1 hour')`, [digest(handoff), hash, notice.publicId]);
    });
    response.cookie(cookieName(config, notice.publicId), handoff, { ...cookieOptions(config), maxAge: 3_600_000 });
    response.json({ notice });
  }));
  router.get("/invitations/:publicId", asyncHandler(async (request, response) => {
    const publicId = id.parse(request.params.publicId);
    response.json({ notice: await publicPreview(pool, await challengeHash(pool, request, { invitationPublicId: publicId }, config)) });
  }));
  return router;
}

export function createFutureNoticeRouter(pool: DatabasePool, config: AppConfig, emailVerification: SessionEmailVerification | null) {
  const router = Router();
  router.use(rateLimit({ windowMs: 60_000, limit: config.nodeEnv === "test" ? 10_000 : 30,
    keyGenerator: request => request.auth.sessionPublicId ?? request.auth.plannerPublicId,
    standardHeaders: "draft-8", legacyHeaders: false }));

  router.get("/people/:publicId", asyncHandler(async (request, response) => {
    const publicId = id.parse(request.params.publicId);
    const notice = await withPlannerDatabase(pool, request.auth.plannerId, async client => {
      const person = await client.query(`select id from app.people where planner_id=app.current_planner_id()
       and public_id=$1 and status not in('archived','revoked')`, [publicId]);
      if (!person.rowCount) throw new ApiError(404, "contact_not_found", "This contact is not available.");
      const result = await client.query<OwnerNotice>(`${ownerProjection}
       where n.planner_id=app.current_planner_id() and person.public_id=$1 order by n.id desc limit 1`, [publicId]);
      return result.rows[0] ? present(result.rows[0]) : null;
    });
    response.json({ notice });
  }));
  router.post("/", requireCsrf, recentAuthenticationRequired(config), asyncHandler(async (request, response) => {
    const input = z.object({ personPublicId: id, email: z.email().max(254), acknowledgedNoAccess: z.literal(true) }).strict().parse(request.body);
    const value = randomBytes(32).toString("base64url");
    const url = invitationUrl(config, value);
    const notice = await withPlannerDatabase(pool, request.auth.plannerId, async client => {
      await client.query("select pg_advisory_xact_lock(hashtextextended('future-notice:'||app.current_planner_id()::text,0))");
      const person = (await client.query<{ id: string }>(`select id::text from app.people where planner_id=app.current_planner_id()
       and public_id=$1 and status not in('archived','revoked') for update`, [input.personPublicId])).rows[0];
      if (!person) throw new ApiError(404, "contact_not_found", "This contact is not available.");
      const hash = scopedEmailDigest(verifiedEmailDigest(input.email), request.auth.plannerPublicId, emailMatchKey(config));
      const active = await client.query(`select id from app.future_recipient_notices where planner_id=app.current_planner_id()
       and status in('pending','acknowledged') and (person_id=$1 or recipient_email_hash=$2)`, [person.id, hash]);
      if (active.rowCount) throw new ApiError(409, "future_notice_exists", "An arrangement notice already exists for this person or email.");
      const count = (await client.query<{ count: number }>(`select count(*)::int as count from app.future_recipient_notices
       where planner_id=app.current_planner_id() and status in('pending','acknowledged')`)).rows[0]!.count;
      if (count >= 100) throw new ApiError(413, "operation_size_limit", "Manage an existing arrangement before adding another.");
      const row = (await client.query<{ public_id: string }>(`insert into app.future_recipient_notices
       (planner_id,person_id,recipient_email_hash,recipient_email_label,invitation_token_hash,invitation_expires_at)
       values(app.current_planner_id(),$1,$2,$3,$4,now()+interval '7 days') returning public_id`,
      [person.id, hash, maskedEmail(input.email), digest(value)])).rows[0]!;
      await audit(client, "future_notice.created", row.public_id);
      return owned(client, row.public_id);
    });
    response.status(201).json({ notice, invitationUrl: url });
  }));
  router.post("/:publicId/link", requireCsrf, recentAuthenticationRequired(config), asyncHandler(async (request, response) => {
    const publicId = id.parse(request.params.publicId);
    const input = z.object({ expectedVersion: version }).strict().parse(request.body);
    const value = randomBytes(32).toString("base64url"), url = invitationUrl(config, value);
    const notice = await withPlannerDatabase(pool, request.auth.plannerId, async client => {
      const result = await client.query(`update app.future_recipient_notices set invitation_token_hash=$3,
       invitation_expires_at=now()+interval '7 days',version=version+1,updated_at=now()
       where planner_id=app.current_planner_id() and public_id=$1 and version=$2 and status='pending' returning public_id`,
      [publicId, input.expectedVersion, digest(value)]);
      if (!result.rowCount) throw new ApiError(409, "future_notice_changed", "This arrangement changed. Reload before continuing.");
      await audit(client, "future_notice.link_regenerated", publicId);
      return owned(client, publicId);
    });
    response.json({ notice, invitationUrl: url });
  }));
  router.delete("/:publicId", requireCsrf, asyncHandler(async (request, response) => {
    const publicId = id.parse(request.params.publicId), expectedVersion = z.coerce.number().int().positive().parse(request.get("if-match"));
    const notice = await withPlannerDatabase(pool, request.auth.plannerId, async client => {
      const result = await client.query(`update app.future_recipient_notices set status='revoked',closed_at=now(),version=version+1,updated_at=now()
       where planner_id=app.current_planner_id() and public_id=$1 and version=$2 and status<>'revoked' returning public_id`, [publicId, expectedVersion]);
      if (!result.rowCount) throw new ApiError(409, "future_notice_changed", "This arrangement changed. Reload before continuing.");
      await audit(client, "future_notice.revoked", publicId);
      return owned(client, publicId);
    });
    response.json({ notice });
  }));

  async function verifiedMatch(request: Request, hash: Buffer) {
    if (emailVerification && request.auth.mode !== "development") await emailVerification.refresh(request.auth, true);
    else if (config.nodeEnv === "production") throw new ApiError(503, "email_verification_unavailable", "Email verification is temporarily unavailable.");
    return withPlannerDatabase(pool, request.auth.plannerId, async client => {
      const owner = (await client.query<{ owner: string | null }>("select app.future_notice_email_scope($1) as owner", [hash])).rows[0]?.owner;
      return owner && request.auth.verifiedEmailHash ? scopedEmailDigest(request.auth.verifiedEmailHash, owner, emailMatchKey(config)) : null;
    });
  }
  router.post("/invitations/review", requireCsrf, recentAuthenticationRequired(config), asyncHandler(async (request, response) => {
    const hash = await challengeHash(pool, request, challenge.parse(request.body), config);
    const match = await verifiedMatch(request, hash);
    const notice = await withPlannerDatabase(pool, request.auth.plannerId, async client =>
      (await client.query<{ notice: Result }>("select app.future_notice_review($1,$2) as notice", [hash, match])).rows[0]?.notice);
    throwResultError(notice);
    response.json({ notice });
  }));
  router.post("/invitations/respond", requireCsrf, recentAuthenticationRequired(config), asyncHandler(async (request, response) => {
    const input = respond.parse(request.body), hash = await challengeHash(pool, request, input, config);
    const match = await verifiedMatch(request, hash);
    const result = await withPlannerDatabase(pool, request.auth.plannerId, async client =>
      (await client.query<{ result: Result }>("select app.future_notice_respond($1,$2,$3,$4) as result",
        [hash, match, input.action, input.expectedVersion])).rows[0]?.result);
    throwResultError(result);
    if (result.publicId) response.clearCookie(cookieName(config, result.publicId), cookieOptions(config));
    response.json({ result });
  }));
  router.get("/received", asyncHandler(async (request, response) => {
    const notices = await withPlannerDatabase(pool, request.auth.plannerId, async client =>
      (await client.query<{ notices: unknown[] }>("select app.future_notices_received() as notices")).rows[0]!.notices);
    if (notices.length > 100) throw new ApiError(413, "operation_size_limit", "This collection is too large for one request. No records were omitted.");
    response.json({ notices, contentAvailable: false });
  }));
  router.delete("/received/:publicId", requireCsrf, asyncHandler(async (request, response) => {
    const publicId = id.parse(request.params.publicId), expectedVersion = z.coerce.number().int().positive().parse(request.get("if-match"));
    const left = await withPlannerDatabase(pool, request.auth.plannerId, async client =>
      (await client.query<{ left: boolean }>("select app.future_notice_leave($1,$2) as left", [publicId, expectedVersion])).rows[0]?.left);
    if (!left) throw new ApiError(409, "future_notice_changed", "This arrangement changed. Reload before continuing.");
    response.json({ left: true, contentAvailable: false });
  }));
  return router;
}
