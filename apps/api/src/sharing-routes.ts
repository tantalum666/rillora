import { recentAuthenticationRequired } from "./recent-authentication.js";
import { expandsSharing, requireRecentAuthentication } from "./recent-authentication.js";
import { createHash, randomBytes } from "node:crypto";
import { readSecurityCookie, securityCookieName, usesSecureCookies } from './security-cookies.js';
import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import type { SessionEmailVerification } from "./email-verification.js";
import type { PoolClient } from "pg";
import { z } from "zod";
import { requireCsrf } from "./auth.js";
import type { AppConfig } from "./config.js";
import { withAuthDatabase, withPlannerDatabase, withPlannerSnapshotDatabase, type DatabasePool } from "./db.js";
import { ApiError, asyncHandler } from "./errors.js";
import { maskedEmail, verifiedEmailDigest, scopedEmailDigest, emailMatchKey } from "./sharing-identity.js";

const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const idSchema = z.uuid().transform((value) => value.toLowerCase());
const versionSchema = z.number().int().positive();
const grantSchema = z.object({ matterPublicId: idSchema, detailLevel: z.enum(["name", "directions", "details"]) }).strict();
const grantsSchema = z.array(grantSchema).max(100).refine(
  (grants) => new Set(grants.map((grant) => grant.matterPublicId)).size === grants.length,
  "Each matter can be selected only once.",
);
const createSchema = z.object({ personPublicId: idSchema, email: z.email().max(254), grants: grantsSchema, replaceConnection: z.object({ publicId: idSchema, expectedVersion: versionSchema, expectedAccessVersion: z.number().int().min(0) }).strict().optional() }).strict();
const updateSchema = z.object({ expectedVersion: versionSchema, grants: grantsSchema }).strict();
const linkSchema = z.object({ expectedVersion: versionSchema, email: z.email().max(254).optional(), grants: grantsSchema.optional() }).strict();
const acceptSchema = z.object({ accepted: z.literal(true), invitationToken: tokenSchema.optional(), invitationPublicId: idSchema.optional() })
  .strict().refine((value) => Boolean(value.invitationToken) !== Boolean(value.invitationPublicId));
const handoffCookie = (config: AppConfig, id: string) => securityCookieName(config, `rillora_invite_${id.replaceAll("-", "")}`);
const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

type Grant = z.infer<typeof grantSchema>;
type Connection = {
  id: string; public_id: string; person_public_id: string; display_name: string;
  recipient_email_label: string; status: "pending" | "accepted" | "revoked";
  invitation_expires_at: Date; accepted_at: Date | null; version: number;
  grants: Grant[];
  access: { mode: string; isFreeRecipient: boolean; savedAt: string | null; cutoffAt: string | null };
};
type InvitationPreview = { publicId: string; ownerName: string; emailHint: string; status: string; expiresAt: string };

const connectionQuery = `select c.id::text, c.public_id, app.sharing_connection_access(c.public_id) as access, person.public_id as person_public_id,
  person.display_name, c.recipient_email_label, c.status, c.invitation_expires_at,
  c.accepted_at, c.version, coalesce((select jsonb_agg(jsonb_build_object(
    'matterPublicId', m.public_id, 'detailLevel', g.detail_level) order by g.id)
    from app.sharing_grants g join app.matter_items m on m.id = g.matter_item_id and m.planner_id = g.planner_id
    where g.connection_id = c.id and g.planner_id = c.planner_id and m.archived_at is null), '[]'::jsonb) as grants
  from app.sharing_connections c join app.people person on person.id = c.person_id and person.planner_id = c.planner_id`;

function presentConnection(row: Connection) {
  return { publicId: row.public_id, personPublicId: row.person_public_id, personName: row.display_name,
    emailHint: row.recipient_email_label, status: row.status === "pending" && row.invitation_expires_at <= new Date() ? "expired" : row.status,
    expiresAt: row.invitation_expires_at.toISOString(), acceptedAt: row.accepted_at?.toISOString() ?? null,
    version: row.version, grants: row.grants, access: row.access, readOnly: true, purpose: "planner_directed" };
}

async function readConnection(client: PoolClient, publicId: string): Promise<Connection> {
  const result = await client.query<Connection>(`${connectionQuery} where c.planner_id = app.current_planner_id() and c.public_id = $1`, [publicId]);
  if (!result.rows[0]) throw new ApiError(404, "connection_not_found", "This connection is not available.");
  return result.rows[0];
}

async function presentMutation(client: PoolClient, publicId: string) {
  const connection = presentConnection(await readConnection(client, publicId));
  const access = (await client.query("select app.sharing_access_status() as access")).rows[0].access;
  return { connection, access };
}

async function replaceGrants(client: PoolClient, connectionId: string, grants: Grant[]) {
  const selected = await client.query<{ id: string; public_id: string }>(
    `select id::text, public_id from app.matter_items where planner_id = app.current_planner_id()
      and public_id = any($1::uuid[]) and archived_at is null and desired_outcome <> 'never_disclose'`,
    [grants.map((grant) => grant.matterPublicId)],
  );
  if (selected.rows.length !== grants.length) throw new ApiError(400, "sharing_scope_unavailable", "A selected matter is private, archived or unavailable. Review your selection.");
  const ids = new Map(selected.rows.map((matter) => [matter.public_id, matter.id]));
  // Keep unchanged grant identities: deleting/recreating them would invalidate
  // existing paid-term copies and outstanding review tasks on every save.
  await client.query("delete from app.sharing_grants where connection_id = $1 and planner_id = app.current_planner_id() and not (matter_item_id = any($2::bigint[]))", [connectionId, selected.rows.map(m => m.id)]);
  if (grants.length) await client.query(
    `insert into app.sharing_grants(planner_id, connection_id, matter_item_id, detail_level)
     select app.current_planner_id(), $1, chosen.matter_id, chosen.level
     from unnest($2::bigint[], $3::text[]) as chosen(matter_id, level)
     on conflict(connection_id, matter_item_id) do update set detail_level = excluded.detail_level
       where app.sharing_grants.detail_level is distinct from excluded.detail_level`,
    [connectionId, grants.map((grant) => ids.get(grant.matterPublicId)), grants.map((grant) => grant.detailLevel)],
  );
}

async function audit(client: PoolClient, action: string, publicId: string, metadata: Record<string, unknown> = {}) {
  await client.query(`insert into app.audit_events(planner_id, actor_type, action, resource_type, resource_public_id, metadata)
    values(app.current_planner_id(), 'planner', $1, 'sharing_connection', $2, $3::jsonb)`,
  [action, publicId, JSON.stringify({ purpose: "planner_directed", ...metadata })]);
}

function invitationUrl(config: AppConfig, token: string): string {
  const origin = config.oidc?.webAppOrigin ?? (config.nodeEnv !== "production" ? [...config.corsOrigins][0] : null);
  if (!origin) throw new ApiError(503, "sharing_not_configured", "Invitation links are not configured yet.");
  const url = new URL("/invite", origin); url.hash = `invitation=${token}`; return url.toString();
}

async function preview(pool: DatabasePool, hash: Buffer): Promise<InvitationPreview> {
  return withAuthDatabase(pool, async (client) => {
    const result = await client.query<{ invitation: InvitationPreview | null }>("select app.sharing_invitation_preview($1) as invitation", [hash]);
    const invitation = result.rows[0]?.invitation;
    if (!invitation || invitation.status !== 'pending'
      || !Number.isFinite(Date.parse(invitation.expiresAt ?? ''))
      || Date.parse(invitation.expiresAt ?? '') <= Date.now()) {
      throw new ApiError(404, "invitation_unavailable", "This invitation is not available. Ask for a new link.");
    }
    return invitation;
  });
}

function cookieOptions(config: AppConfig) {
  return { httpOnly: true, secure: usesSecureCookies(config), sameSite: "lax" as const, path: "/" };
}

async function handoffHash(pool: DatabasePool, request: Request, invitationId: string, config: AppConfig): Promise<Buffer> {
  const token = readSecurityCookie(request.get('cookie'),handoffCookie(config, invitationId));
  if (!token || !tokenSchema.safeParse(token).success) throw new ApiError(404, "invitation_unavailable", "Open the original invitation link again.");
  return withAuthDatabase(pool, async (client) => {
    const result = await client.query<{ invitation_token_hash: Buffer }>(
      "select invitation_token_hash from app.sharing_handoffs where token_hash = $1 and connection_public_id = $2 and expires_at > now()",
      [digest(token), invitationId],
    );
    if (!result.rows[0]) throw new ApiError(404, "invitation_unavailable", "Open the original invitation link again.");
    return result.rows[0].invitation_token_hash;
  });
}

export function createPublicSharingRouter(pool: DatabasePool, config: AppConfig): Router {
  const router = Router();
  router.post("/invitations/resolve", asyncHandler(async (request, response) => {
    const input = z.object({ invitationToken: tokenSchema }).strict().parse(request.body);
    const hash = digest(input.invitationToken); const invitation = await preview(pool, hash);
    if (invitation.status === "pending") {
      const handoff = randomBytes(32).toString("base64url");
      await withAuthDatabase(pool, async (client) => {
        await client.query("delete from app.sharing_handoffs where expires_at <= now()");
        await client.query(`insert into app.sharing_handoffs(token_hash, invitation_token_hash, connection_public_id, expires_at)
          values($1, $2, $3, now() + interval '1 hour')`, [digest(handoff), hash, invitation.publicId]);
      });
      response.cookie(handoffCookie(config, invitation.publicId), handoff, { ...cookieOptions(config), maxAge: 3_600_000 });
    }
    response.json({ invitation });
  }));
  router.get("/invitations/:publicId", asyncHandler(async (request, response) => {
    const id = idSchema.parse(request.params.publicId);
    response.json({ invitation: await preview(pool, await handoffHash(pool, request, id, config)) });
  }));
  return router;
}

export function createSharingRouter(pool: DatabasePool, config: AppConfig, emailVerification: SessionEmailVerification | null = null): Router {
  const router = Router();
  const verificationLimiter = rateLimit({
    windowMs: 60_000, limit: config.nodeEnv === "test" ? 10_000 : 10,
    keyGenerator: request => request.auth.sessionPublicId ?? request.auth.plannerPublicId,
    standardHeaders: "draft-8", legacyHeaders: false,
    handler: (_request, response) => { response.status(429).json({ error: {
      code: "email_verification_rate_limited", message: "Wait a moment before checking your email again.",
    } }); },
  });
  router.post("/email-verification", requireCsrf, verificationLimiter, asyncHandler(async (request, response) => {
    z.object({}).strict().parse(request.body);
    if (!emailVerification) throw new ApiError(503, "email_verification_unavailable", "Email verification could not be checked. Keep this invitation open and try again.");
    response.json({ verified: Boolean(await emailVerification.refresh(request.auth)) });
  }));
  router.get("/access", asyncHandler(async (request, response) => {
    const access = await withPlannerDatabase(pool, request.auth.plannerId, async client =>
      (await client.query("select app.sharing_access_status() as access")).rows[0].access);
    response.json({ access });
  }));
  router.post("/connections/:publicId/live", recentAuthenticationRequired(config), requireCsrf, asyncHandler(async (request, response) => {
    const id = idSchema.parse(request.params.publicId);
    const input = z.object({ expectedVersion: versionSchema, expectedAccessVersion: z.number().int().min(0),
      useFreeSlot: z.boolean() }).strict().parse(request.body);
    const result = await withPlannerDatabase(pool, request.auth.plannerId, async client => {
      const access = (await client.query("select app.sharing_select_live($1,$2,$3,$4) as access",
        [id, input.expectedVersion, input.expectedAccessVersion, input.useFreeSlot])).rows[0].access;
      return { access, connection: presentConnection(await readConnection(client, id)) };
    });
    response.json(result);
  }));
  router.post("/connections/:publicId/pause", requireCsrf, asyncHandler(async (request, response) => {
    const id = idSchema.parse(request.params.publicId);
    const input = z.object({ expectedVersion: versionSchema, expectedAccessVersion: z.number().int().min(0) }).strict().parse(request.body);
    const result = await withPlannerDatabase(pool, request.auth.plannerId, async client => {
      await client.query("select app.sharing_pause_live($1,$2,$3)", [id, input.expectedVersion, input.expectedAccessVersion]);
      return presentMutation(client, id);
    });
    response.json(result);
  }));
  router.get("/connections", asyncHandler(async (request, response) => {
    const connections = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
      const result = await client.query<Connection>(`${connectionQuery} where c.planner_id = app.current_planner_id()
        and person.status not in ('archived', 'revoked') order by c.id desc limit 200`);
      return result.rows.map(presentConnection);
    });
    response.json({ connections });
  }));

  // Same explicit projection as recipient_shared_items; the integration test compares every level.
  router.post("/preview", requireCsrf, asyncHandler(async (request, response) => {
    const input = z.object({ grants: grantsSchema, connectionPublicId: idSchema.optional() }).strict().parse(request.body);
    const items = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
      const result = await client.query(`select m.public_id as "matterPublicId", chosen.level as "detailLevel",
        jsonb_strip_nulls(jsonb_build_object('title', m.title, 'category', m.category)
      || case when chosen.level in ('directions', 'details') then jsonb_build_object(
        'institutionName', m.institution_name, 'locationHint', m.location_hint, 'desiredOutcome', m.desired_outcome) else '{}'::jsonb end
      || case when chosen.level = 'details' then jsonb_build_object(
        'accountHint', m.account_hint, 'valueBand', m.value_band, 'currencyCode', m.currency_code, 'importance', m.importance, 'notes', m.notes) || jsonb_build_object(
        'assetType', m.details->'assetType',
        'debtType', m.details->'debtType',
        'documentType', m.details->'documentType',
        'deviceModel', m.details->'deviceModel',
        'billingCycle', m.details->'billingCycle',
        'renewalDate', m.details->'renewalDate',
        'cryptoCustody', m.details->'cryptoCustody',
        'network', m.details->'network',
        'walletAddress', m.details->'walletAddress',
        'walletLabel', m.details->'walletLabel',
        'assetSymbol', m.details->'assetSymbol') else '{}'::jsonb end) as fields
        from unnest($1::uuid[], $2::text[]) with ordinality as chosen(public_id, level, ordinal)
        join app.matter_items m on m.public_id = chosen.public_id and m.planner_id = app.current_planner_id()
        where m.archived_at is null and m.desired_outcome <> 'never_disclose' order by chosen.ordinal`,
        [input.grants.map(grant => grant.matterPublicId), input.grants.map(grant => grant.detailLevel)]);
      if (result.rowCount !== input.grants.length) throw new ApiError(400, "sharing_scope_unavailable", "A selected matter is private, archived or unavailable. Review your selection.");
      if (input.connectionPublicId) {
        const connection = await readConnection(client, input.connectionPublicId);
        if (connection.status === "revoked") throw new ApiError(404, "connection_not_found", "This connection is not available.");
        if (connection.access.mode !== "live") {
          const saved = await client.query("select app.owner_saved_sharing_preview($1,$2::jsonb) as items", [input.connectionPublicId, JSON.stringify(input.grants)]);
          return { items: saved.rows[0].items, accessMode: connection.access.mode };
        }
      }
      return { items: result.rows, accessMode: "live" };
    });
    response.json({ ...items, readOnly: true, purpose: "planner_directed", preview: true });
  }));

  router.post("/connections", recentAuthenticationRequired(config), requireCsrf, asyncHandler(async (request, response) => {
    const input = createSchema.parse(request.body); const token = randomBytes(32).toString("base64url");
    const url = invitationUrl(config, token);
    const connection = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
      if (input.replaceConnection) await client.query("select app.sharing_pause_live($1,$2,$3)",
        [input.replaceConnection.publicId, input.replaceConnection.expectedVersion, input.replaceConnection.expectedAccessVersion]);
      await client.query("select app.sharing_reserve(null)");
      const person = await client.query<{ id: string }>(`select id::text from app.people where public_id = $1
        and planner_id = app.current_planner_id() and status not in ('archived', 'revoked') for update`, [input.personPublicId]);
      if (!person.rows[0]) throw new ApiError(404, "contact_not_found", "This contact is not available.");
      const existing = await client.query("select id from app.sharing_connections where person_id = $1 and planner_id = app.current_planner_id() and status <> 'revoked'", [person.rows[0].id]);
      if (existing.rowCount) throw new ApiError(409, "connection_exists", "This person already has an invitation or connection. Reload to manage it.");
      const result = await client.query<{ id: string; public_id: string }>(`insert into app.sharing_connections(
        planner_id, person_id, recipient_email_hash, recipient_email_label, invitation_token_hash, invitation_expires_at,recipient_email_hash_version)
        values(app.current_planner_id(), $1, $2, $3, $4, now() + interval '7 days',2) returning id::text, public_id`,
      [person.rows[0].id, scopedEmailDigest(verifiedEmailDigest(input.email),request.auth.plannerPublicId,emailMatchKey(config)), maskedEmail(input.email), digest(token)]);
      const row = result.rows[0]!; await replaceGrants(client, row.id, input.grants);
      await audit(client, "sharing.invitation_created", row.public_id, { matterCount: input.grants.length, linkGenerated: true, deliveryConfirmed: false });
      return presentMutation(client, row.public_id);
    });
    response.status(201).json({ ...connection, invitationUrl: url });
  }));

  router.patch("/connections/:publicId", requireCsrf, asyncHandler(async (request, response) => {
    const id = idSchema.parse(request.params.publicId); const input = updateSchema.parse(request.body);
    const connection = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:' || app.current_planner_id()::text,0))");
      const result = await client.query<{ id: string }>(`update app.sharing_connections set version = version + 1, updated_at = now()
        where public_id = $1 and planner_id = app.current_planner_id() and version = $2 and status <> 'revoked' returning id::text`, [id, input.expectedVersion]);
      if (!result.rows[0]) throw new ApiError(409, "sharing_changed", "Sharing changed. Reload before saving.");
      const current = await readConnection(client, id);
      if (expandsSharing(current.grants, input.grants)) requireRecentAuthentication(config, request.auth);
      await replaceGrants(client, result.rows[0].id, input.grants);
      await audit(client, "sharing.scope_updated", id, { matterCount: input.grants.length });
      return presentMutation(client, id);
    }); response.json(connection);
  }));

  router.post("/connections/:publicId/link", recentAuthenticationRequired(config), requireCsrf, asyncHandler(async (request, response) => {
    const id = idSchema.parse(request.params.publicId); const input = linkSchema.parse(request.body);
    const token = randomBytes(32).toString("base64url"); const url = invitationUrl(config, token);
    const connection = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:' || app.current_planner_id()::text,0))");
      const current = await readConnection(client, id);
      const reserved = (await client.query("select app.sharing_reserve($1) as id", [current.id])).rows[0].id;
      const result = await client.query<{ id: string }>(`update app.sharing_connections set invitation_token_hash = $3,
        invitation_expires_at = now() + interval '7 days', live_entitlement_id = $6, version = version + 1, updated_at = now(),
        recipient_email_hash = coalesce($4, recipient_email_hash), recipient_email_label = coalesce($5, recipient_email_label)
        where public_id = $1 and planner_id = app.current_planner_id() and version = $2 and status = 'pending' returning id::text`,
      [id, input.expectedVersion, digest(token), input.email ? scopedEmailDigest(verifiedEmailDigest(input.email),request.auth.plannerPublicId,emailMatchKey(config)) : null, input.email ? maskedEmail(input.email) : null, reserved]);
      if (!result.rowCount) throw new ApiError(409, "sharing_changed", "This invitation changed or was already accepted. Reload to continue.");
      if (input.grants) await replaceGrants(client, result.rows[0]!.id, input.grants);
      await audit(client, "sharing.invitation_regenerated", id, { deliveryConfirmed: false });
      return presentMutation(client, id);
    }); response.json({ ...connection, invitationUrl: url });
  }));

  router.delete("/connections/:publicId", requireCsrf, asyncHandler(async (request, response) => {
    const id = idSchema.parse(request.params.publicId); const version = z.coerce.number().int().positive().parse(request.get("if-match"));
    const connection = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
      await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:' || app.current_planner_id()::text,0))");
      const result = await client.query(`update app.sharing_connections set status = 'revoked', revoked_at = now(),
        version = version + 1, updated_at = now() where public_id = $1 and planner_id = app.current_planner_id()
        and version = $2 and status <> 'revoked' returning id`, [id, version]);
      if (!result.rowCount) throw new ApiError(409, "sharing_changed", "This connection changed. Reload to continue.");
      await audit(client, "sharing.connection_revoked", id);
      return presentMutation(client, id);
    }); response.json(connection);
  }));

  router.post("/invitations/accept", recentAuthenticationRequired(config), requireCsrf, verificationLimiter, asyncHandler(async (request, response) => {
    const input = acceptSchema.parse(request.body);
    const hash = input.invitationToken ? digest(input.invitationToken) : await handoffHash(pool, request, input.invitationPublicId!, config);
    if (emailVerification && request.auth.mode !== 'development') await emailVerification.refresh(request.auth, true);
    else if (config.nodeEnv === 'production') {
      throw new ApiError(503, 'email_verification_unavailable', 'Email verification could not be checked. Keep this invitation open and try again.');
    }
    const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
      const owner=(await client.query<{owner:string|null}>('select app.invitation_email_scope($1) as owner',[hash])).rows[0]?.owner;
      if (!owner) return {error:'invitation_unavailable'};
      const match=request.auth.verifiedEmailHash ? scopedEmailDigest(request.auth.verifiedEmailHash,owner,emailMatchKey(config)) : null;
      const row = await client.query<{ result: { error?: string; publicId?: string; status?: string } }>(
        "select app.accept_sharing_invitation($1, $2) as result", [hash, match]);
      return row.rows[0]!.result;
    });
    const messages: Record<string, string> = {
      invitation_unavailable: "This invitation is no longer available. Ask for a new link.",
      invitation_expired: "This invitation expired. Ask for a new link.",
      self_invitation: "This is your own invitation. Use the recipient's account to accept it.",
      verified_email_required: "Open the verification email, then return here to continue. Your invitation is saved.",
      invitation_account_mismatch: "Use the account with the invited email address, or ask for a corrected invitation.",
      sharing_updates_paused: "The sender needs to resume this invitation or choose it as their included connection. Your account is ready.",
    };
    if (result.error) throw new ApiError(403, result.error, messages[result.error] ?? "This invitation could not be accepted.");
    if (result.publicId) response.clearCookie(handoffCookie(config, result.publicId), cookieOptions(config));
    response.json({ connection: result, readOnly: true, purpose: "planner_directed" });
  }));

  router.get("/shared-with-me", asyncHandler(async (request, response) => {
    const result = await withPlannerSnapshotDatabase(pool, request.auth.plannerId, async (client) => {
      await client.query("set local statement_timeout = '5s'");
      if (!(await client.query('select app.recipient_sharing_work_is_bounded() as allowed')).rows[0]?.allowed) {
        throw new ApiError(413,'operation_size_limit','This collection is too large for one request. No records were omitted.');
      }
      const row = await client.query<{ connections: unknown[]; items: unknown[] }>(
        "select app.recipient_sharing_connections() as connections, app.recipient_shared_items() as items");
      return row.rows[0]!;
    }); response.json({ ...result, readOnly: true, purpose: "planner_directed" });
  }));
  return router;
}
