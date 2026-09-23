import { createHash, ECDH, randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler, Router } from "express";
import { Router as createRouter } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { requireCsrf } from "./auth.js";
import type { DatabasePool, RecipientRehearsalContext } from "./db.js";
import {
  withPlannerDatabase,
  withRecipientAcceptanceDatabase,
  withRecipientRehearsalDatabase,
} from "./db.js";
import { invalidateDisclosureRehearsals } from "./disclosure-policy.js";
import {
  acceptRecipientRehearsalSchema,
  createRecipientRehearsalSchema,
  enrollRecipientDeviceKeySchema,
  finalizeRecipientRehearsalPackageSchema,
  publicIdSchema,
} from "./domain.js";
import { ApiError, asyncHandler } from "./errors.js";
import { collectStartHerePackage, startHereSnapshotCommitment } from "./routes.js";

const rehearsalAuthorizationPattern = /^Rillora-Rehearsal ([A-Za-z0-9_-]{43})$/;

type RehearsalRow = {
  id: string;
  public_id: string;
  person_public_id: string;
  display_name: string;
  status: "pending" | "accepted" | "revoked";
  expires_at: Date;
  accepted_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
};

type RecipientKeyRow = {
  public_id: string;
  display_name: string;
  device_label: string;
  public_key_x963: Buffer;
  status: "active" | "revoked";
  created_at: Date;
  revoked_at: Date | null;
};

export function createPlannerRecipientRehearsalRouter(pool: DatabasePool): Router {
  const router = createRouter();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const rehearsals = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<RehearsalRow>(
          `select r.id::text, r.public_id, p.public_id as person_public_id, p.display_name,
                  r.status, r.expires_at, r.accepted_at, r.revoked_at, r.created_at
           from app.recipient_rehearsals r
           join app.people p on p.id = r.person_id and p.planner_id = r.planner_id
           where r.planner_id = app.current_planner_id()
           order by r.id desc`,
        );
        return result.rows;
      });
      response.json({ recipientRehearsals: rehearsals.map(mapRehearsal) });
    }),
  );

  router.post(
    "/",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = createRecipientRehearsalSchema.parse(request.body);
      const acceptanceToken = randomBytes(32).toString("base64url");
      const acceptanceHash = tokenHash(acceptanceToken);
      const rehearsal = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const person = await client.query<{ id: string; display_name: string }>(
          `select id::text, display_name from app.people
           where planner_id = app.current_planner_id() and public_id = $1
             and archived_at is null and status not in ('revoked', 'archived')`,
          [input.personPublicId],
        );
        const personRow = person.rows[0];
        if (!personRow) {
          throw new ApiError(404, "trusted_contact_not_found", "The selected contact was not found.");
        }

        const active = await client.query(
          `select 1 from app.recipient_rehearsals
           where planner_id = app.current_planner_id() and person_id = $1
             and status in ('pending', 'accepted')`,
          [personRow.id],
        );
        if (active.rows[0]) {
          throw new ApiError(
            409,
            "recipient_rehearsal_exists",
            "Revoke the active synthetic rehearsal for this contact before creating another.",
          );
        }

        let assignment = await client.query<{ id: string }>(
          `select id::text from app.role_assignments
           where planner_id = app.current_planner_id() and person_id = $1
             and role = 'recipient' and matter_item_id is null`,
          [personRow.id],
        );
        if (!assignment.rows[0]) {
          assignment = await client.query<{ id: string }>(
            `insert into app.role_assignments (planner_id, plan_id, person_id, role, status)
             select app.current_planner_id(), id, $1, 'recipient', 'invited'
             from app.plans where planner_id = app.current_planner_id()
             returning id::text`,
            [personRow.id],
          );
        } else {
          await client.query(
            `update app.role_assignments
             set status = 'invited', version = version + 1, updated_at = now()
             where planner_id = app.current_planner_id() and id = $1`,
            [assignment.rows[0].id],
          );
        }
        const assignmentId = assignment.rows[0]?.id;
        if (!assignmentId) {
          throw new ApiError(409, "plan_missing", "Create a plan before starting a rehearsal.");
        }

        const invitation = await client.query<{ id: string }>(
          `insert into app.invitations (
             planner_id, person_id, role_assignment_id, delivery_channel,
             token_hash, status, expires_at
           ) values (
             app.current_planner_id(), $1, $2, 'simulation', $3, 'pending', now() + interval '30 minutes'
           ) returning id::text`,
          [personRow.id, assignmentId, acceptanceHash],
        );
        const created = await client.query<RehearsalRow>(
          `insert into app.recipient_rehearsals (
             planner_id, person_id, role_assignment_id, invitation_id,
             acceptance_token_hash, expires_at
           ) values (
             app.current_planner_id(), $1, $2, $3, $4, now() + interval '30 minutes'
           )
           returning id::text, public_id, $5::uuid as person_public_id, $6::text as display_name,
                     status, expires_at, accepted_at, revoked_at, created_at`,
          [personRow.id, assignmentId, invitation.rows[0]!.id, acceptanceHash, input.personPublicId, personRow.display_name],
        );
        const row = created.rows[0]!;
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendPlannerAudit(client, "recipient_rehearsal.created", row.public_id, {
          simulationOnly: true,
          deliveryPerformed: false,
          identityVerified: false,
          releasePerformed: false,
          expiresAt: row.expires_at,
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
        return row;
      });

      response.status(201).json({
        recipientRehearsal: mapRehearsal(rehearsal),
        acceptanceToken,
        boundaries: rehearsalBoundaries,
      });
    }),
  );

  router.delete(
    "/:publicId",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const revoked = await client.query<{ invitation_id: string; role_assignment_id: string }>(
          `update app.recipient_rehearsals
           set status = 'revoked', revoked_at = now(), session_token_hash = null
           where planner_id = app.current_planner_id() and public_id = $1
             and status in ('pending', 'accepted')
           returning invitation_id::text, role_assignment_id::text`,
          [publicId],
        );
        const row = revoked.rows[0];
        if (!row) throw new ApiError(404, "recipient_rehearsal_not_found", "The active rehearsal was not found.");
        await client.query(
          `update app.recipient_device_keys set status = 'revoked', revoked_at = now()
           where planner_id = app.current_planner_id() and invitation_id = $1 and status = 'active'`,
          [row.invitation_id],
        );
        await client.query(
          `update app.invitations set status = 'revoked', revoked_at = now()
           where planner_id = app.current_planner_id() and id = $1 and status <> 'revoked'`,
          [row.invitation_id],
        );
        await client.query(
          `update app.role_assignments
           set status = 'revoked', version = version + 1, updated_at = now()
           where planner_id = app.current_planner_id() and id = $1`,
          [row.role_assignment_id],
        );
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendPlannerAudit(client, "recipient_rehearsal.revoked", publicId, {
          simulationOnly: true,
          externalCopiesRevocable: false,
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
      });
      response.status(204).end();
    }),
  );

  router.post(
    "/:publicId/packages/prepare",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const rehearsalPublicId = publicIdSchema.parse(request.params.publicId);
      const input = z.object({ previewPublicId: publicIdSchema }).strict().parse(request.body);
      const prepared = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const reviewedCommitment = await freshReviewedCommitment(client, input.previewPublicId);
        const rehearsal = await client.query<{ id: string; invitation_id: string }>(
          `select id::text, invitation_id::text from app.recipient_rehearsals
           where planner_id = app.current_planner_id() and public_id = $1
             and status = 'accepted' and expires_at > now()`,
          [rehearsalPublicId],
        );
        const rehearsalRow = rehearsal.rows[0];
        if (!rehearsalRow) {
          throw new ApiError(409, "recipient_rehearsal_acceptance_required", "Accept the active synthetic rehearsal first.");
        }
        const recipients = await rehearsalRecipientKeys(client, rehearsalRow.invitation_id);
        if (recipients.length === 0) {
          throw new ApiError(409, "recipient_device_key_required", "Enroll an active recipient device key first.");
        }
        if (recipients.length > 20) {
          throw new ApiError(409, "recipient_key_limit_exceeded", "A rehearsal supports at most 20 active device keys.");
        }
        const record = await client.query<{ public_id: string; created_at: Date; expires_at: Date }>(
          `insert into app.export_packages (
             planner_id, plan_id, format, status, expires_at, preview_snapshot_sha256,
             source_preview_public_id, crypto_version, recipient_rehearsal_id
           ) values (
             app.current_planner_id(),
             (select id from app.plans where planner_id = app.current_planner_id()),
             'encrypted_start_here_v1', 'generating', now() + interval '15 minutes',
             $1, $2, 'rillora-hpke-v1', $3
           ) returning public_id, created_at, expires_at`,
          [reviewedCommitment, input.previewPublicId, rehearsalRow.id],
        );
        return { record: record.rows[0]!, recipients, reviewedCommitment };
      });
      response.status(201).json({
        package: {
          publicId: prepared.record.public_id,
          previewPublicId: input.previewPublicId,
          createdAt: prepared.record.created_at,
          expiresAt: prepared.record.expires_at,
          status: "generating",
          cryptoVersion: "rillora-hpke-v1",
          sourceCommitment: prepared.reviewedCommitment.toString("base64url"),
          contentEncryption: "AES-256-GCM",
          keyWrapping: "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
          serverCanDecrypt: false,
          recipientDeliveryPerformed: false,
          simulationOnly: true,
          releasePerformed: false,
        },
        eligibleRecipientKeys: prepared.recipients.map(mapEligibleKey),
        boundaries: rehearsalBoundaries,
      });
    }),
  );

  router.post(
    "/:publicId/packages/:packagePublicId/finalize",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const rehearsalPublicId = publicIdSchema.parse(request.params.publicId);
      const packagePublicId = publicIdSchema.parse(request.params.packagePublicId);
      const input = finalizeRecipientRehearsalPackageSchema.parse(request.body);
      const crypto = parseFinalizedCrypto(input);
      const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const pending = await client.query<{
          id: string;
          invitation_id: string;
          preview_snapshot_sha256: Buffer;
          source_preview_public_id: string;
        }>(
          `select p.id::text, r.invitation_id::text, p.preview_snapshot_sha256,
                  p.source_preview_public_id
           from app.export_packages p
           join app.recipient_rehearsals r on r.id = p.recipient_rehearsal_id
           where p.planner_id = app.current_planner_id() and p.public_id = $1
             and r.public_id = $2 and r.status = 'accepted' and r.expires_at > now()
             and p.status = 'generating' and p.expires_at > now()
           for update of p`,
          [packagePublicId, rehearsalPublicId],
        );
        const row = pending.rows[0];
        if (!row || row.source_preview_public_id !== input.previewPublicId) {
          throw new ApiError(409, "recipient_rehearsal_prepare_required", "Prepare a fresh synthetic package first.");
        }
        const currentCommitment = startHereSnapshotCommitment(await collectStartHerePackage(client));
        if (
          row.preview_snapshot_sha256.length !== currentCommitment.length
          || !timingSafeEqual(row.preview_snapshot_sha256, currentCommitment)
        ) {
          throw new ApiError(409, "start_here_preview_changed", "The plan changed after this rehearsal was prepared.");
        }
        const eligible = await rehearsalRecipientKeys(client, row.invitation_id);
        const eligibleIds = eligible.map((key) => key.public_id).sort();
        const submittedIds = crypto.recipients.map((entry) => entry.keyPublicId).sort();
        if (
          eligibleIds.length !== submittedIds.length
          || eligibleIds.some((value, index) => value !== submittedIds[index])
        ) {
          throw new ApiError(409, "recipient_keys_changed", "The rehearsal device keys changed. Prepare again.");
        }
        await persistEncryptedPackage(client, row.id, crypto);
        await appendPlannerAudit(client, "recipient_rehearsal.encrypted", packagePublicId, {
          simulationOnly: true,
          identityVerified: false,
          deliveryPerformed: false,
          releasePerformed: false,
          serverCanDecrypt: false,
          recipientKeyCount: crypto.recipients.length,
        });
        return row.preview_snapshot_sha256.toString("base64url");
      });
      response.status(201).json({
        encryptedPackage: {
          publicId: packagePublicId,
          status: "ready",
          cryptoVersion: input.cryptoVersion,
          sourceCommitment: result,
          recipientKeyCount: crypto.recipients.length,
          serverCanDecrypt: false,
          simulationOnly: true,
          releasePerformed: false,
        },
        boundaries: rehearsalBoundaries,
      });
    }),
  );

  return router;
}

export function createRecipientRehearsalRouter(pool: DatabasePool): Router {
  const router = createRouter();

  router.post(
    "/accept",
    asyncHandler(async (request, response) => {
      const input = acceptRecipientRehearsalSchema.parse(request.body);
      const acceptanceHash = tokenHash(input.acceptanceToken);
      const sessionToken = randomBytes(32).toString("base64url");
      const sessionHash = tokenHash(sessionToken);
      const accepted = await withRecipientAcceptanceDatabase(
        pool,
        acceptanceHash,
        sessionHash,
        async (client) => {
          const result = await client.query<{ public_id: string; expires_at: Date }>(
            `update app.recipient_rehearsals
             set status = 'accepted', session_token_hash = $1, accepted_at = now()
             where acceptance_token_hash = $2 and status = 'pending' and expires_at > now()
             returning public_id, expires_at`,
            [sessionHash, acceptanceHash],
          );
          return result.rows[0] ?? null;
        },
      );
      if (!accepted) {
        throw new ApiError(401, "rehearsal_acceptance_invalid", "The synthetic acceptance capability is invalid or expired.");
      }
      response.status(201).json({
        recipientRehearsal: {
          publicId: accepted.public_id,
          status: "accepted",
          expiresAt: accepted.expires_at,
        },
        sessionToken,
        boundaries: rehearsalBoundaries,
      });
    }),
  );

  router.use(requireRehearsalSession(pool));

  router.get(
    "/device-keys",
    asyncHandler(async (request, response) => {
      const keys = await withRehearsalSession(pool, request, async (client) => {
        const result = await client.query<RecipientKeyRow>(
          `select k.public_id, 'Synthetic recipient'::text as display_name, k.device_label,
                  k.public_key_x963, k.status, k.created_at, k.revoked_at
           from app.recipient_device_keys k
           where k.planner_id = app.current_planner_id()
             and k.invitation_id = (
               select invitation_id from app.recipient_rehearsals where id = app.current_rehearsal_id()
             )
           order by k.id`,
        );
        return result.rows;
      });
      response.json({ deviceKeys: keys.map(mapDeviceKey), boundaries: rehearsalBoundaries });
    }),
  );

  router.post(
    "/device-keys",
    asyncHandler(async (request, response) => {
      const input = enrollRecipientDeviceKeySchema.parse(request.body);
      const publicKey = decodeP256PublicKey(input.publicKey, "publicKey");
      const created = await withRehearsalSession(pool, request, async (client, context) => {
        const existing = await client.query<{ active_count: number; duplicate_count: number }>(
          `select count(*) filter (where status = 'active')::int as active_count,
                  count(*) filter (where status = 'active' and public_key_x963 = $1)::int as duplicate_count
           from app.recipient_device_keys
           where planner_id = app.current_planner_id() and invitation_id = $2`,
          [publicKey, context.invitationId],
        );
        if (existing.rows[0]!.duplicate_count > 0) {
          throw new ApiError(409, "recipient_device_key_exists", "This public key is already active for the rehearsal.");
        }
        if (existing.rows[0]!.active_count >= 20) {
          throw new ApiError(409, "recipient_key_limit_exceeded", "A rehearsal supports at most 20 active device keys.");
        }
        const result = await client.query<RecipientKeyRow>(
          `insert into app.recipient_device_keys (
             planner_id, person_id, invitation_id, algorithm, public_key_x963, device_label
           ) values ($1, $2, $3, 'p256_hpke_base', $4, $5)
           returning public_id, 'Synthetic recipient'::text as display_name, device_label,
                     public_key_x963, status, created_at, revoked_at`,
          [context.plannerId, context.personId, context.invitationId, publicKey, input.deviceLabel],
        );
        return result.rows[0]!;
      });
      response.status(201).json({ deviceKey: mapDeviceKey(created), boundaries: rehearsalBoundaries });
    }),
  );

  router.delete(
    "/device-keys/:publicId",
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const revoked = await withRehearsalSession(pool, request, async (client) => {
        const result = await client.query(
          `update app.recipient_device_keys set status = 'revoked', revoked_at = now()
           where planner_id = app.current_planner_id() and public_id = $1 and status = 'active'
             and invitation_id = (
               select invitation_id from app.recipient_rehearsals where id = app.current_rehearsal_id()
             )`,
          [publicId],
        );
        return (result.rowCount ?? 0) > 0;
      });
      if (!revoked) throw new ApiError(404, "recipient_device_key_not_found", "The active rehearsal key was not found.");
      response.status(204).end();
    }),
  );

  router.get(
    "/packages/:publicId",
    asyncHandler(async (request, response) => {
      const packagePublicId = publicIdSchema.parse(request.params.publicId);
      const artifact = await withRehearsalSession(pool, request, async (client) => {
        const packageResult = await client.query<{
          source_preview_public_id: string;
          preview_snapshot_sha256: Buffer;
          crypto_version: string;
          content_nonce: Buffer;
          content_ciphertext: Buffer;
          ciphertext_sha256: Buffer;
          created_at: Date;
        }>(
          `select source_preview_public_id, preview_snapshot_sha256, crypto_version,
                  content_nonce, content_ciphertext, ciphertext_sha256, created_at
           from app.export_packages
           where public_id = $1 and recipient_rehearsal_id = app.current_rehearsal_id()
             and format = 'encrypted_start_here_v1' and status = 'ready'`,
          [packagePublicId],
        );
        const packageRow = packageResult.rows[0];
        if (!packageRow) return null;
        const envelopes = await client.query<{
          key_public_id: string;
          encapsulated_key: Buffer;
          wrapped_key: Buffer;
        }>(
          `select k.public_id as key_public_id, e.encapsulated_key, e.wrapped_key
           from app.export_key_envelopes e
           join app.recipient_device_keys k on k.id = e.recipient_device_key_id
           where e.export_package_id = (
             select id from app.export_packages
             where public_id = $1 and recipient_rehearsal_id = app.current_rehearsal_id()
           ) and e.envelope_kind = 'recipient' and k.status = 'active'
           order by e.id`,
          [packagePublicId],
        );
        return { packageRow, envelopes: envelopes.rows };
      });
      if (!artifact || artifact.envelopes.length === 0) {
        throw new ApiError(404, "recipient_package_not_found", "The rehearsal package is unavailable to this active device.");
      }
      response.json({
        schemaVersion: "rillora-encrypted-start-here-v1",
        packagePublicId,
        previewPublicId: artifact.packageRow.source_preview_public_id,
        createdAt: artifact.packageRow.created_at,
        cryptoVersion: artifact.packageRow.crypto_version,
        sourceCommitment: artifact.packageRow.preview_snapshot_sha256.toString("base64url"),
        content: {
          algorithm: "AES-256-GCM",
          nonce: artifact.packageRow.content_nonce.toString("base64url"),
          ciphertext: artifact.packageRow.content_ciphertext.toString("base64url"),
          ciphertextSha256: artifact.packageRow.ciphertext_sha256.toString("base64url"),
        },
        recipients: artifact.envelopes.map((entry) => ({
          keyPublicId: entry.key_public_id,
          encapsulatedKey: entry.encapsulated_key.toString("base64url"),
          wrappedKey: entry.wrapped_key.toString("base64url"),
        })),
        boundaries: rehearsalBoundaries,
      });
    }),
  );

  return router;
}

const rehearsalBoundaries = Object.freeze({
  simulationOnly: true,
  identityVerified: false,
  deliveryPerformed: false,
  releasePerformed: false,
  serverCanDecrypt: false,
  externalCopiesRevocable: false,
});

function requireRehearsalSession(pool: DatabasePool): RequestHandler {
  return (request, _response, next) => {
    (async () => {
      const sessionToken = rehearsalSessionToken(request.headers.authorization);
      const context = await withRecipientRehearsalDatabase(
        pool,
        tokenHash(sessionToken),
        async (_client, value) => value,
      );
      if (!context) {
        throw new ApiError(401, "rehearsal_session_invalid", "The synthetic recipient session is invalid or expired.");
      }
      request.rehearsalSessionToken = sessionToken;
      next();
    })().catch(next);
  };
}

async function withRehearsalSession<T>(
  pool: DatabasePool,
  request: Parameters<RequestHandler>[0],
  operation: (client: PoolClient, context: RecipientRehearsalContext) => Promise<T>,
): Promise<T> {
  const sessionToken = request.rehearsalSessionToken;
  if (!sessionToken) throw new ApiError(401, "rehearsal_session_invalid", "The synthetic recipient session is required.");
  const result = await withRecipientRehearsalDatabase(pool, tokenHash(sessionToken), operation);
  if (result === null) throw new ApiError(401, "rehearsal_session_invalid", "The synthetic recipient session is invalid or expired.");
  return result;
}

function rehearsalSessionToken(authorization: string | undefined): string {
  const match = authorization?.match(rehearsalAuthorizationPattern);
  if (!match) throw new ApiError(401, "rehearsal_session_required", "A synthetic recipient session is required.");
  return match[1]!;
}

function tokenHash(token: string): Buffer {
  return createHash("sha256").update(token, "utf8").digest();
}

async function freshReviewedCommitment(client: PoolClient, previewPublicId: string): Promise<Buffer> {
  const preview = await client.query<{ preview_snapshot_sha256: Buffer | null }>(
    `select preview_snapshot_sha256 from app.export_packages
     where planner_id = app.current_planner_id() and public_id = $1
       and format = 'start_here_json' and status = 'previewed' and expires_at > now()`,
    [previewPublicId],
  );
  const reviewed = preview.rows[0]?.preview_snapshot_sha256;
  if (!reviewed) throw new ApiError(409, "start_here_preview_required", "Create and review a fresh Start Here preview first.");
  const current = startHereSnapshotCommitment(await collectStartHerePackage(client));
  if (reviewed.length !== current.length || !timingSafeEqual(reviewed, current)) {
    throw new ApiError(409, "start_here_preview_changed", "The plan changed after this preview.");
  }
  return reviewed;
}

async function rehearsalRecipientKeys(client: PoolClient, invitationId: string): Promise<RecipientKeyRow[]> {
  const result = await client.query<RecipientKeyRow>(
    `select k.public_id, p.display_name, k.device_label, k.public_key_x963,
            k.status, k.created_at, k.revoked_at
     from app.recipient_device_keys k
     join app.people p on p.id = k.person_id and p.planner_id = k.planner_id
     where k.planner_id = app.current_planner_id() and k.invitation_id = $1
       and k.status = 'active'
     order by k.id`,
    [invitationId],
  );
  return result.rows;
}

function decodeBase64Url(value: string, expectedLength: number, field: string): Buffer {
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== expectedLength || decoded.toString("base64url") !== value) {
    throw new ApiError(400, "invalid_crypto_material", `${field} is not canonical base64url data.`);
  }
  return decoded;
}

function decodeBase64UrlRange(value: string, min: number, max: number, field: string): Buffer {
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length < min || decoded.length > max || decoded.toString("base64url") !== value) {
    throw new ApiError(400, "invalid_crypto_material", `${field} is not canonical bounded base64url data.`);
  }
  return decoded;
}

function decodeP256PublicKey(value: string, field: string): Buffer {
  const decoded = decodeBase64Url(value, 65, field);
  if (decoded[0] !== 4) throw new ApiError(400, "invalid_crypto_material", `${field} is not an uncompressed P-256 key.`);
  try {
    ECDH.convertKey(decoded, "prime256v1", undefined, undefined, "uncompressed");
  } catch {
    throw new ApiError(400, "invalid_crypto_material", `${field} is not a valid P-256 point.`);
  }
  return decoded;
}

function parseFinalizedCrypto(input: z.infer<typeof finalizeRecipientRehearsalPackageSchema>) {
  const contentCiphertext = decodeBase64UrlRange(input.contentCiphertext, 17, 65_536, "contentCiphertext");
  const ciphertextSha256 = decodeBase64Url(input.ciphertextSha256, 32, "ciphertextSha256");
  if (!timingSafeEqual(ciphertextSha256, createHash("sha256").update(contentCiphertext).digest())) {
    throw new ApiError(400, "ciphertext_digest_mismatch", "The ciphertext digest did not match.");
  }
  const recipients = input.recipients.map((recipient) => ({
    keyPublicId: recipient.keyPublicId,
    encapsulatedKey: decodeP256PublicKey(recipient.encapsulatedKey, "recipients.encapsulatedKey"),
    wrappedKey: decodeBase64Url(recipient.wrappedKey, 48, "recipients.wrappedKey"),
  }));
  if (new Set(recipients.map((entry) => entry.keyPublicId)).size !== recipients.length) {
    throw new ApiError(400, "duplicate_recipient_key", "Each recipient device key may appear once.");
  }
  return {
    contentNonce: decodeBase64Url(input.contentNonce, 12, "contentNonce"),
    contentCiphertext,
    ciphertextSha256,
    recoveryPublicKey: decodeP256PublicKey(input.recovery.publicKey, "recovery.publicKey"),
    recoveryEncapsulatedKey: decodeP256PublicKey(input.recovery.encapsulatedKey, "recovery.encapsulatedKey"),
    recoveryWrappedKey: decodeBase64Url(input.recovery.wrappedKey, 48, "recovery.wrappedKey"),
    recipients,
  };
}

async function persistEncryptedPackage(
  client: PoolClient,
  packageId: string,
  crypto: ReturnType<typeof parseFinalizedCrypto>,
): Promise<void> {
  await client.query(
    `insert into app.export_key_envelopes (
       planner_id, export_package_id, envelope_kind, recovery_public_key_x963,
       crypto_suite, encapsulated_key, wrapped_key
     ) values (
       app.current_planner_id(), $1, 'recovery', $2,
       'P256-HKDF-SHA256-AES-256-GCM', $3, $4
     )`,
    [packageId, crypto.recoveryPublicKey, crypto.recoveryEncapsulatedKey, crypto.recoveryWrappedKey],
  );
  for (const envelope of crypto.recipients) {
    await client.query(
      `insert into app.export_key_envelopes (
         planner_id, export_package_id, envelope_kind, recipient_device_key_id,
         crypto_suite, encapsulated_key, wrapped_key
       ) select app.current_planner_id(), $1, 'recipient', id,
                'P256-HKDF-SHA256-AES-256-GCM', $3, $4
         from app.recipient_device_keys
         where planner_id = app.current_planner_id() and public_id = $2 and status = 'active'`,
      [packageId, envelope.keyPublicId, envelope.encapsulatedKey, envelope.wrappedKey],
    );
  }
  await client.query(
    `update app.export_packages set status = 'ready', expires_at = null,
       content_nonce = $2, content_ciphertext = $3, ciphertext_sha256 = $4
     where id = $1`,
    [packageId, crypto.contentNonce, crypto.contentCiphertext, crypto.ciphertextSha256],
  );
}

async function appendPlannerAudit(
  client: PoolClient,
  action: string,
  resourcePublicId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `insert into app.audit_events (
       planner_id, actor_type, action, resource_type, resource_public_id, metadata
     ) values (app.current_planner_id(), 'planner', $1, 'recipient_rehearsal', $2, $3::jsonb)`,
    [action, resourcePublicId, JSON.stringify(metadata)],
  );
}

function mapRehearsal(row: RehearsalRow) {
  return {
    publicId: row.public_id,
    personPublicId: row.person_public_id,
    displayName: row.display_name,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    simulationOnly: true,
  };
}

function mapDeviceKey(row: RecipientKeyRow) {
  return {
    publicId: row.public_id,
    deviceLabel: row.device_label,
    publicKey: row.public_key_x963.toString("base64url"),
    status: row.status,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    simulationOnly: true,
  };
}

function mapEligibleKey(row: RecipientKeyRow) {
  return {
    publicId: row.public_id,
    displayName: row.display_name,
    deviceLabel: row.device_label,
    publicKey: row.public_key_x963.toString("base64url"),
  };
}

declare global {
  namespace Express {
    interface Request {
      rehearsalSessionToken?: string;
    }
  }
}
