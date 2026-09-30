import { createHash, ECDH, timingSafeEqual } from "node:crypto";
import type { Request, Router } from "express";
import { Router as createRouter } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { requireCsrf, sessionCookieName } from "./auth.js";
import { csrfCookieName } from "./auth-routes.js";
import type { AppConfig } from "./config.js";
import type { DatabasePool } from "./db.js";
import { withAuthDatabase, withPlannerDatabase } from "./db.js";
import { invalidateDisclosureRehearsals } from "./disclosure-policy.js";
import {
  createMatterSchema,
  finalizeEncryptedStartHereSchema,
  createPrintableStartHereSchema,
  createSimulationSchema,
  createTrustedContactSchema,
  publicIdSchema,
  updateMatterSchema,
  updateOfficialSetupSchema,
  updatePlanSchema,
  updateTrustedContactSchema,
} from "./domain.js";
import { ApiError, asyncHandler } from "./errors.js";
import { appendProductEvent, productClientSource } from "./product-events.js";
import { currentLegalContract } from "./legal-contract.js";

type PlanRow = {
  public_id: string;
  motivation: string | null;
  status: string;
  first_use_state: string;
  first_use_step: number;
  policy_version: string;
  last_reviewed_at: Date | null;
  review_due_at: Date | null;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type MatterRow = {
  public_id: string;
  category: string;
  title: string;
  institution_name: string | null;
  account_hint: string | null;
  value_band: string;
  currency_code: string | null;
  location_hint: string | null;
  importance: string;
  desired_outcome: string;
  status: string;
  review_due_at: Date | null;
  version: number;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
};

type ContactRow = {
  public_id: string;
  display_name: string;
  relationship_label: string | null;
  status: string;
  role_status: string | null;
  invitation_status: string | null;
  delivery_channel: string | null;
  version: number;
  created_at: Date;
  updated_at: Date;
};

type OfficialSetupRow = {
  public_id: string;
  provider_key: string;
  policy_version: string;
  completed: boolean;
  completed_at: Date | null;
  version: number;
  updated_at: Date;
};

const paginationSchema = z
  .object({
    cursor: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

const versionHeaderSchema = z.coerce.number().int().positive();

export function createApiRouter(pool: DatabasePool, config: AppConfig): Router {
  const router = createRouter();

  router.get("/meta/capabilities", (_request, response) => {
    response.json({
      apiVersion: "v1",
      storageModel: "off_chain_mutable",
      blockchain: false,
      realClaims: false,
      realRelease: false,
      disclosurePolicyRehearsal: true,
      plannerRolePolicyEditing: true,
      encryptedAttachments: false,
      clientEncryptedStartHere: true,
      recipientKeyEnrollment: config.allowSyntheticRecipientRehearsal ? "synthetic_rehearsal_only" : false,
      recipientDelivery: false,
      syntheticRecipientRehearsal: config.allowSyntheticRecipientRehearsal,
      authenticationIssuance: config.oidc !== null,
      authenticationProtocol: "oidc_authorization_code_pkce",
      dataRegion: config.dataRegion,
      available: [
        "plan",
        "matters",
        "trusted_contact_records",
        "official_setup_self_report",
        "readiness",
        "claim_simulation",
        "role_scoped_disclosure_policy_rehearsal",
        "planner_authored_role_assignment_policy",
        "start_here_preview",
        "start_here_printable_text",
        "encrypted_start_here_owner_recovery",
        ...(config.allowSyntheticRecipientRehearsal
          ? ["synthetic_recipient_acceptance_and_decryption_rehearsal"]
          : []),
        "audit_events",
      ],
    });
  });

  router.get("/session", (request, response) => {
    response.json({
      plannerPublicId: request.auth.plannerPublicId,
      authenticationMode: request.auth.mode,
      authenticationMethods: request.auth.authenticationMethods ?? [],
      authenticatedAt: request.auth.authenticatedAt ?? null,
    });
  });

  router.get(
    "/legal/acceptance",
    asyncHandler(async (request, response) => {
      if (request.auth.mode === "development") {
        response.json({
          required: false,
          developmentBypass: true,
          currentContract: currentLegalContract,
          acceptance: null,
        });
        return;
      }
      const result = await withAuthDatabase(pool, (client) => client.query<{
        public_id: string;
        terms_version: string;
        privacy_version: string;
        consent_text_version: string;
        legal_bundle_sha256: Buffer;
        client_surface: string;
        accepted_at: Date;
      }>(
        `select public_id, terms_version, privacy_version, consent_text_version,
                legal_bundle_sha256, client_surface, accepted_at
         from app.legal_acceptances
         where planner_id = $1
           and terms_version = $2
           and privacy_version = $3
           and legal_bundle_sha256 = $4
         order by accepted_at desc
         limit 1`,
        [
          request.auth.plannerId,
          currentLegalContract.termsVersion,
          currentLegalContract.privacyVersion,
          Buffer.from(currentLegalContract.bundleSha256, "hex"),
        ],
      ));
      const acceptance = result.rows[0];
      if (!acceptance) {
        throw new ApiError(
          428,
          "legal_acceptance_required",
          "The current Terms and Privacy Policy must be accepted.",
        );
      }
      response.json({
        required: true,
        developmentBypass: false,
        currentContract: currentLegalContract,
        acceptance: {
          publicId: acceptance.public_id,
          termsVersion: acceptance.terms_version,
          privacyVersion: acceptance.privacy_version,
          consentTextVersion: acceptance.consent_text_version,
          bundleSha256: acceptance.legal_bundle_sha256.toString("hex"),
          clientSurface: acceptance.client_surface,
          acceptedAt: acceptance.accepted_at,
        },
      });
    }),
  );

  router.post(
    "/auth/logout",
    requireCsrf,
    asyncHandler(async (request, response) => {
      if (
        (request.auth.mode === "session" || request.auth.mode === "bearer") &&
        request.auth.sessionPublicId
      ) {
        await withAuthDatabase(pool, async (client) => {
          await client.query(
            "update app.auth_sessions set revoked_at = now() where public_id = $1 and revoked_at is null",
            [request.auth.sessionPublicId],
          );
        });
      }
      response.clearCookie(sessionCookieName, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        path: "/",
      });
      response.clearCookie(csrfCookieName, {
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        path: "/",
      });
      response.status(204).end();
    }),
  );

  router.post(
    "/auth/logout-all",
    requireCsrf,
    asyncHandler(async (request, response) => {
      if (request.auth.mode === "development") {
        throw new ApiError(
          409,
          "session_management_unavailable",
          "Session management is unavailable for the local development identity.",
        );
      }

      const revokedSessionCount = await withAuthDatabase(pool, async (client) => {
        const result = await client.query(
          `update app.auth_sessions
           set revoked_at = now()
           where planner_id = $1 and revoked_at is null`,
          [request.auth.plannerId],
        );
        return result.rowCount ?? 0;
      });

      response.clearCookie(sessionCookieName, {
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        path: "/",
      });
      response.clearCookie(csrfCookieName, {
        secure: config.nodeEnv === "production",
        sameSite: "lax",
        path: "/",
      });
      response.json({
        revokedSessionCount,
        scope: "rillora_sessions_only",
        identityProviderSessionsRevoked: false,
      });
    }),
  );

  router.get(
    "/plan",
    asyncHandler(async (request, response) => {
      const plan = await withPlannerDatabase(pool, request.auth.plannerId, async (client) =>
        getPlan(client),
      );
      response.json({ plan: mapPlan(plan) });
    }),
  );

  router.patch(
    "/plan",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = updatePlanSchema.parse(request.body);
      const plan = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<PlanRow>(
          `update app.plans
           set motivation = case when $2 then $3 else motivation end,
               status = case when $4 then $5 else status end,
               first_use_state = case when $6 then $7 else first_use_state end,
               first_use_step = case when $8 then $9 else first_use_step end,
               version = version + 1,
               updated_at = now()
           where planner_id = app.current_planner_id() and version = $1
           returning public_id, motivation, status, first_use_state, first_use_step,
                     policy_version, last_reviewed_at,
                     review_due_at, version, created_at, updated_at`,
          [
            input.expectedVersion,
            Object.hasOwn(input, "motivation"),
            input.motivation ?? null,
            Object.hasOwn(input, "status"),
            input.status ?? null,
            Object.hasOwn(input, "firstUseState"),
            input.firstUseState ?? null,
            Object.hasOwn(input, "firstUseStep"),
            input.firstUseStep ?? null,
          ],
        );
        const updated = result.rows[0];
        if (!updated) throw new ApiError(409, "version_conflict", "The plan changed. Refresh and try again.");
        await appendAudit(client, "plan.updated", "plan", updated.public_id, {
          version: updated.version,
        });
        if (Object.hasOwn(input, "motivation") && input.motivation !== null && input.motivation !== undefined) {
          await appendProductEvent(client, productClientSource(request), "motivation_selected", {
            motivation: input.motivation,
          });
        }
        return updated;
      });
      response.json({ plan: mapPlan(plan) });
    }),
  );

  router.get(
    "/matters",
    asyncHandler(async (request, response) => {
      const query = paginationSchema.parse(request.query);
      const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const rows = await client.query<MatterRow>(
          `select public_id, category, title, institution_name, account_hint, value_band,
                  currency_code, location_hint, importance, desired_outcome, status,
                  review_due_at, version, created_at, updated_at, archived_at
           from app.matter_items
           where planner_id = app.current_planner_id()
             and archived_at is null
             and (
               $1::uuid is null
               or id > coalesce((
                 select id from app.matter_items
                 where planner_id = app.current_planner_id() and public_id = $1
               ), 9223372036854775807)
             )
           order by id
           limit $2`,
          [query.cursor ?? null, query.limit + 1],
        );
        return rows.rows;
      });
      const hasMore = result.length > query.limit;
      const page = result.slice(0, query.limit);
      response.json({
        matters: page.map(mapMatter),
        nextCursor: hasMore ? page.at(-1)?.public_id ?? null : null,
      });
    }),
  );

  router.post(
    "/matters",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = createMatterSchema.parse(request.body);
      const matter = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<MatterRow>(
          `insert into app.matter_items (
             planner_id, plan_id, category, title, institution_name, account_hint,
             value_band, currency_code, location_hint, importance, desired_outcome, status
           )
           select app.current_planner_id(), p.id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
           from app.plans p
           where p.planner_id = app.current_planner_id()
           returning public_id, category, title, institution_name, account_hint, value_band,
                     currency_code, location_hint, importance, desired_outcome, status,
                     review_due_at, version, created_at, updated_at, archived_at`,
          [
            input.category,
            input.title,
            input.institutionName ?? null,
            input.accountHint ?? null,
            input.valueBand,
            input.currencyCode ?? null,
            input.locationHint ?? null,
            input.importance,
            input.desiredOutcome,
            input.status,
          ],
        );
        const created = result.rows[0];
        if (!created) throw new ApiError(409, "plan_missing", "Create a plan before adding matters.");
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendAudit(client, "matter.created", "matter", created.public_id, {
          category: created.category,
          status: created.status,
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
        const activeCount = await client.query<{ count: number }>(
          `select count(*)::int as count from app.matter_items
           where planner_id = app.current_planner_id() and archived_at is null`,
        );
        if (activeCount.rows[0]?.count === 1) {
          await appendProductEvent(client, productClientSource(request), "first_item_added", {});
        }
        if (activeCount.rows[0]?.count === 5) {
          await appendProductEvent(client, productClientSource(request), "five_items_completed", {});
        }
        if (created.desired_outcome !== "undecided") {
          await appendProductEvent(client, productClientSource(request), "item_outcome_assigned", {});
        }
        await client.query(
          `update app.plans
           set first_use_state = 'completed',
               first_use_step = 2,
               version = version + 1,
               updated_at = now()
           where planner_id = app.current_planner_id()
             and first_use_state <> 'completed'`,
        );
        return created;
      });
      response.status(201).json({ matter: mapMatter(matter) });
    }),
  );

  router.get(
    "/matters/:publicId",
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const matter = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<MatterRow>(
          `select public_id, category, title, institution_name, account_hint, value_band,
                  currency_code, location_hint, importance, desired_outcome, status,
                  review_due_at, version, created_at, updated_at, archived_at
           from app.matter_items
           where planner_id = app.current_planner_id() and public_id = $1`,
          [publicId],
        );
        return result.rows[0] ?? null;
      });
      if (!matter) throw new ApiError(404, "matter_not_found", "The matter was not found.");
      response.json({ matter: mapMatter(matter) });
    }),
  );

  router.patch(
    "/matters/:publicId",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const input = updateMatterSchema.parse(request.body);
      const matter = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<MatterRow>(
          `update app.matter_items
           set category = case when $3 then $4 else category end,
               title = case when $5 then $6 else title end,
               institution_name = case when $7 then $8 else institution_name end,
               account_hint = case when $9 then $10 else account_hint end,
               value_band = case when $11 then $12 else value_band end,
               currency_code = case when $13 then $14 else currency_code end,
               location_hint = case when $15 then $16 else location_hint end,
               importance = case when $17 then $18 else importance end,
               desired_outcome = case when $19 then $20 else desired_outcome end,
               status = case when $21 then $22 else status end,
               version = version + 1,
               updated_at = now()
           where planner_id = app.current_planner_id() and public_id = $1 and version = $2
           returning public_id, category, title, institution_name, account_hint, value_band,
                     currency_code, location_hint, importance, desired_outcome, status,
                     review_due_at, version, created_at, updated_at, archived_at`,
          [
            publicId,
            input.expectedVersion,
            Object.hasOwn(input, "category"),
            input.category ?? null,
            Object.hasOwn(input, "title"),
            input.title ?? null,
            Object.hasOwn(input, "institutionName"),
            input.institutionName ?? null,
            Object.hasOwn(input, "accountHint"),
            input.accountHint ?? null,
            Object.hasOwn(input, "valueBand"),
            input.valueBand ?? null,
            Object.hasOwn(input, "currencyCode"),
            input.currencyCode ?? null,
            Object.hasOwn(input, "locationHint"),
            input.locationHint ?? null,
            Object.hasOwn(input, "importance"),
            input.importance ?? null,
            Object.hasOwn(input, "desiredOutcome"),
            input.desiredOutcome ?? null,
            Object.hasOwn(input, "status"),
            input.status ?? null,
          ],
        );
        const updated = result.rows[0];
        if (!updated) await throwMissingOrConflict(client, "matter", publicId);
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendAudit(client, "matter.updated", "matter", updated!.public_id, {
          status: updated!.status,
          version: updated!.version,
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
        if (input.desiredOutcome && input.desiredOutcome !== "undecided") {
          await appendProductEvent(client, productClientSource(request), "item_outcome_assigned", {});
        }
        return updated!;
      });
      response.json({ matter: mapMatter(matter) });
    }),
  );

  router.delete(
    "/matters/:publicId",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const expectedVersion = versionHeaderSchema.parse(request.get("if-match"));
      await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<{ public_id: string }>(
          `update app.matter_items
           set status = 'archived', archived_at = now(), version = version + 1, updated_at = now()
           where planner_id = app.current_planner_id() and public_id = $1
             and version = $2 and archived_at is null
           returning public_id`,
          [publicId, expectedVersion],
        );
        if (!result.rows[0]) await throwMissingOrConflict(client, "matter", publicId);
        const revokedInvitations = await client.query(
          `update app.invitations
           set status = 'revoked', revoked_at = coalesce(revoked_at, now())
           where planner_id = app.current_planner_id()
             and role_assignment_id in (
               select ra.id from app.role_assignments ra
               join app.matter_items m
                 on m.id = ra.matter_item_id and m.planner_id = ra.planner_id
               where ra.planner_id = app.current_planner_id() and m.public_id = $1
             )
             and status <> 'revoked'`,
          [publicId],
        );
        const revokedAssignments = await client.query(
          `update app.role_assignments
           set status = 'revoked', version = version + 1, updated_at = now()
           where planner_id = app.current_planner_id()
             and matter_item_id = (
               select id from app.matter_items
               where planner_id = app.current_planner_id() and public_id = $1
             )
             and status <> 'revoked'`,
          [publicId],
        );
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendAudit(client, "matter.archived", "matter", publicId, {
          revokedRoleAssignmentCount: revokedAssignments.rowCount ?? 0,
          revokedInvitationCount: revokedInvitations.rowCount ?? 0,
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
      });
      response.status(204).end();
    }),
  );

  router.get(
    "/trusted-contacts",
    asyncHandler(async (request, response) => {
      const contacts = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<ContactRow>(
          `select p.public_id, p.display_name, p.relationship_label, p.status, p.version,
                  p.created_at, p.updated_at, ra.status as role_status,
                  i.status as invitation_status, i.delivery_channel
           from app.people p
           left join app.role_assignments ra
             on ra.person_id = p.id and ra.planner_id = p.planner_id and ra.role = 'trusted_contact'
           left join lateral (
             select status, delivery_channel
             from app.invitations
             where role_assignment_id = ra.id
             order by id desc limit 1
           ) i on true
           where p.planner_id = app.current_planner_id() and p.archived_at is null
           order by p.id`,
        );
        return result.rows;
      });
      response.json({ trustedContacts: contacts.map(mapContact) });
    }),
  );

  router.post(
    "/trusted-contacts",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = createTrustedContactSchema.parse(request.body);
      const contact = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const created = await client.query<ContactRow>(
          `insert into app.people (planner_id, display_name, relationship_label)
           values (app.current_planner_id(), $1, $2)
           returning public_id, display_name, relationship_label, status, version,
                     created_at, updated_at, null::text as role_status,
                     null::text as invitation_status, null::text as delivery_channel`,
          [input.displayName, input.relationshipLabel ?? null],
        );
        const person = created.rows[0];
        if (!person) throw new ApiError(500, "contact_create_failed", "The contact could not be created.");
        await client.query(
          `insert into app.role_assignments (planner_id, plan_id, person_id, role)
           select app.current_planner_id(), pl.id, pe.id, 'trusted_contact'
           from app.plans pl, app.people pe
           where pl.planner_id = app.current_planner_id()
             and pe.planner_id = app.current_planner_id() and pe.public_id = $1`,
          [person.public_id],
        );
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendAudit(client, "trusted_contact.created", "person", person.public_id, {
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
        const hydrated = await selectTrustedContact(client, person.public_id);
        return hydrated ?? person;
      });
      response.status(201).json({ trustedContact: mapContact(contact) });
    }),
  );

  router.patch(
    "/trusted-contacts/:publicId",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const input = updateTrustedContactSchema.parse(request.body);
      const contact = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<ContactRow>(
          `update app.people
           set display_name = case when $3 then $4 else display_name end,
               relationship_label = case when $5 then $6 else relationship_label end,
               status = case when $7 then $8 else status end,
               archived_at = case when $7 and $8 = 'archived' then now() else archived_at end,
               version = version + 1,
               updated_at = now()
           where planner_id = app.current_planner_id() and public_id = $1 and version = $2
           returning public_id, display_name, relationship_label, status, version,
                     created_at, updated_at, null::text as role_status,
                     null::text as invitation_status, null::text as delivery_channel`,
          [
            publicId,
            input.expectedVersion,
            Object.hasOwn(input, "displayName"),
            input.displayName ?? null,
            Object.hasOwn(input, "relationshipLabel"),
            input.relationshipLabel ?? null,
            Object.hasOwn(input, "status"),
            input.status ?? null,
          ],
        );
        const updated = result.rows[0];
        if (!updated) await throwMissingOrConflict(client, "person", publicId);

        if (input.status === "revoked" || input.status === "archived") {
          await client.query(
            `update app.invitations
             set status = 'revoked', revoked_at = coalesce(revoked_at, now())
             where planner_id = app.current_planner_id()
               and role_assignment_id in (
                 select id from app.role_assignments
                 where planner_id = app.current_planner_id()
                   and person_id = (
                     select id from app.people
                     where planner_id = app.current_planner_id() and public_id = $1
                   )
               )
               and status <> 'revoked'`,
            [publicId],
          );
          await client.query(
            `update app.role_assignments
             set status = 'revoked', version = version + 1, updated_at = now()
             where planner_id = app.current_planner_id()
               and person_id = (
                 select id from app.people
                 where planner_id = app.current_planner_id() and public_id = $1
               )
               and status <> 'revoked'`,
            [publicId],
          );
        }
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendAudit(client, "trusted_contact.updated", "person", publicId, {
          status: updated!.status,
          version: updated!.version,
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
        return (await selectTrustedContact(client, publicId)) ?? updated!;
      });
      response.json({ trustedContact: mapContact(contact) });
    }),
  );

  router.get(
    "/official-setup-checks",
    asyncHandler(async (request, response) => {
      const checks = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<OfficialSetupRow>(
          `select public_id, provider_key, policy_version, completed, completed_at, version, updated_at
           from app.official_setup_checks
           where planner_id = app.current_planner_id()
           order by provider_key`,
        );
        return result.rows;
      });
      response.json({ officialSetupChecks: checks.map(mapOfficialSetup) });
    }),
  );

  router.patch(
    "/official-setup-checks/:publicId",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const input = updateOfficialSetupSchema.parse(request.body);
      const check = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<OfficialSetupRow>(
          `update app.official_setup_checks
           set completed = $3,
               completed_at = case when $3 then now() else null end,
               version = version + 1,
               updated_at = now()
           where planner_id = app.current_planner_id() and public_id = $1 and version = $2
           returning public_id, provider_key, policy_version, completed, completed_at, version, updated_at`,
          [publicId, input.expectedVersion, input.completed],
        );
        const updated = result.rows[0];
        if (!updated) await throwMissingOrConflict(client, "official_setup", publicId);
        await appendAudit(client, "official_setup.self_reported", "official_setup", publicId, {
          completed: updated!.completed,
          policyVersion: updated!.policy_version,
        });
        await appendProductEvent(client, productClientSource(request), "official_setup_checked", {
          completed: updated!.completed,
        });
        return updated!;
      });
      response.json({ officialSetupCheck: mapOfficialSetup(check), evidence: "self_reported" });
    }),
  );

  router.get(
    "/readiness",
    asyncHandler(async (request, response) => {
      const readiness = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<{
          total_matters: number;
          ready_matters: number;
          assigned_outcomes: number;
          confirmed_contacts: number;
          completed_official_checks: number;
          completed_simulations: number;
        }>(
          `select
             count(*) filter (where m.archived_at is null)::int as total_matters,
             count(*) filter (where m.archived_at is null and m.status = 'ready')::int as ready_matters,
             count(*) filter (
               where m.archived_at is null and m.desired_outcome <> 'undecided'
             )::int as assigned_outcomes,
             (select count(*)::int from app.people p
              where p.planner_id = app.current_planner_id() and p.status = 'confirmed') as confirmed_contacts,
             (select count(*)::int from app.official_setup_checks o
              where o.planner_id = app.current_planner_id() and o.completed) as completed_official_checks,
             (select count(*)::int from app.claim_simulations s
              where s.planner_id = app.current_planner_id()) as completed_simulations
           from app.matter_items m
           where m.planner_id = app.current_planner_id()`,
        );
        return result.rows[0]!;
      });
      const activated =
        readiness.total_matters >= 5 &&
        readiness.assigned_outcomes >= 5 &&
        readiness.confirmed_contacts >= 1 &&
        readiness.completed_simulations >= 1;
      response.json({
        readiness: {
          totalMatters: readiness.total_matters,
          readyMatters: readiness.ready_matters,
          assignedOutcomes: readiness.assigned_outcomes,
          confirmedContacts: readiness.confirmed_contacts,
          completedOfficialChecks: readiness.completed_official_checks,
          completedSimulations: readiness.completed_simulations,
          verifiedEmergencyPlan: activated,
          confirmationEvidenceMayBeSimulated: true,
        },
      });
    }),
  );

  router.post(
    "/simulations",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = createSimulationSchema.parse(request.body);
      const simulation = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const plan = await getPlan(client);
        const counts = await client.query<{
          matter_count: number;
          outcome_count: number;
          contact_count: number;
        }>(
          `select
             count(*)::int as matter_count,
             count(*) filter (where desired_outcome <> 'undecided')::int as outcome_count,
             (select count(*)::int from app.people
              where planner_id = app.current_planner_id() and status = 'confirmed') as contact_count
           from app.matter_items
           where planner_id = app.current_planner_id() and archived_at is null`,
        );
        const snapshot = {
          schemaVersion: "simulation-v1",
          matterCount: counts.rows[0]!.matter_count,
          outcomeCount: counts.rows[0]!.outcome_count,
          trustedContactCount: counts.rows[0]!.contact_count,
          operative: false,
        };
        const result = await client.query<{ public_id: string; completed_at: Date }>(
          `insert into app.claim_simulations (
             planner_id, plan_id, life_event, policy_version, policy_snapshot
           )
           select app.current_planner_id(), id, $1, policy_version, $2::jsonb
           from app.plans where planner_id = app.current_planner_id()
           returning public_id, completed_at`,
          [input.lifeEvent, JSON.stringify(snapshot)],
        );
        const created = result.rows[0];
        if (!created) throw new ApiError(409, "plan_missing", "Create a plan before simulating it.");
        await appendAudit(client, "simulation.completed", "claim_simulation", created.public_id, {
          lifeEvent: input.lifeEvent,
          operative: false,
        });
        await appendProductEvent(client, productClientSource(request), "simulation_completed", {
          lifeEvent: input.lifeEvent,
          kind: "count_snapshot",
        });
        return { created, snapshot, policyVersion: plan.policy_version };
      });
      response.status(201).json({
        simulation: {
          publicId: simulation.created.public_id,
          lifeEvent: input.lifeEvent,
          policyVersion: simulation.policyVersion,
          completedAt: simulation.created.completed_at,
          snapshot: simulation.snapshot,
          simulationOnly: true,
          notificationsSent: false,
          dataReleased: false,
        },
      });
    }),
  );

  router.post(
    "/exports/start-here/preview",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const preview = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const packageSnapshot = await collectStartHerePackage(client);
        const snapshotCommitment = startHereSnapshotCommitment(packageSnapshot);
        const record = await client.query<{
          public_id: string;
          created_at: Date;
          expires_at: Date;
        }>(
          `insert into app.export_packages (
             planner_id, plan_id, format, status, expires_at, preview_snapshot_sha256
           )
           values (app.current_planner_id(), (
             select id from app.plans where planner_id = app.current_planner_id()
           ), 'start_here_json', 'previewed', now() + interval '15 minutes', $1)
           returning public_id, created_at, expires_at`,
          [snapshotCommitment],
        );
        const exportRecord = record.rows[0]!;
        await appendAudit(client, "export.previewed", "export_package", exportRecord.public_id, {
          format: "start_here_json",
          encryptedPackageCreated: false,
          expiresAt: exportRecord.expires_at,
          snapshotBinding: "sha256-v1",
        });
        return {
          exportRecord,
          package: packageSnapshot,
        };
      });
      response.status(201).json({
        export: {
          publicId: preview.exportRecord.public_id,
          createdAt: preview.exportRecord.created_at,
          expiresAt: preview.exportRecord.expires_at,
          status: "previewed",
          encryptedPackageCreated: false,
        },
        package: preview.package,
      });
    }),
  );

  router.post(
    "/exports/start-here/encrypted/prepare",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = z.object({ previewPublicId: publicIdSchema }).strict().parse(request.body);
      const prepared = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const preview = await client.query<{ preview_snapshot_sha256: Buffer | null }>(
          `select preview_snapshot_sha256
           from app.export_packages
           where planner_id = app.current_planner_id()
             and public_id = $1
             and format = 'start_here_json'
             and status = 'previewed'
             and expires_at > now()`,
          [input.previewPublicId],
        );
        const reviewedCommitment = preview.rows[0]?.preview_snapshot_sha256;
        if (!reviewedCommitment) {
          throw new ApiError(
            409,
            "start_here_preview_required",
            "Create and review a fresh Start Here preview before preparing encryption.",
          );
        }

        const packageSnapshot = await collectStartHerePackage(client);
        const currentCommitment = startHereSnapshotCommitment(packageSnapshot);
        if (
          reviewedCommitment.length !== currentCommitment.length
          || !timingSafeEqual(reviewedCommitment, currentCommitment)
        ) {
          throw new ApiError(
            409,
            "start_here_preview_changed",
            "The plan changed after this preview. Create and review a fresh preview before preparing encryption.",
          );
        }

        const record = await client.query<{
          public_id: string;
          created_at: Date;
          expires_at: Date;
        }>(
          `insert into app.export_packages (
             planner_id, plan_id, format, status, expires_at, preview_snapshot_sha256,
             source_preview_public_id, crypto_version
           )
           values (app.current_planner_id(), (
             select id from app.plans where planner_id = app.current_planner_id()
           ), 'encrypted_start_here_v1', 'generating', now() + interval '15 minutes',
             $1, $2, 'rillora-hpke-v1')
           returning public_id, created_at, expires_at`,
          [reviewedCommitment, input.previewPublicId],
        );

        const recipients = await eligibleRecipientKeys(client);
        if (recipients.length > 20) {
          throw new ApiError(
            409,
            "recipient_key_limit_exceeded",
            "This package has more than 20 eligible recipient device keys. Review recipient devices before encrypting.",
          );
        }
        const exportRecord = record.rows[0]!;
        await appendAudit(client, "export.encryption_prepared", "export_package", exportRecord.public_id, {
          format: "encrypted_start_here_v1",
          cryptoVersion: "rillora-hpke-v1",
          acceptedRecipientDeviceKeyCount: recipients.length,
          recipientDeliveryPerformed: false,
          serverCanDecrypt: false,
          expiresAt: exportRecord.expires_at,
        });
        return { exportRecord, recipients, reviewedCommitment };
      });

      response.status(201).json({
        package: {
          publicId: prepared.exportRecord.public_id,
          previewPublicId: input.previewPublicId,
          createdAt: prepared.exportRecord.created_at,
          expiresAt: prepared.exportRecord.expires_at,
          status: "generating",
          cryptoVersion: "rillora-hpke-v1",
          sourceCommitment: prepared.reviewedCommitment.toString("base64url"),
          contentEncryption: "AES-256-GCM",
          keyWrapping: "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
          serverCanDecrypt: false,
          recipientDeliveryPerformed: false,
        },
        eligibleRecipientKeys: prepared.recipients.map((recipient) => ({
          publicId: recipient.public_id,
          displayName: recipient.display_name,
          deviceLabel: recipient.device_label,
          publicKey: recipient.public_key_x963.toString("base64url"),
        })),
      });
    }),
  );

  router.post(
    "/exports/start-here/encrypted/:publicId/finalize",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const packagePublicId = publicIdSchema.parse(request.params.publicId);
      const input = finalizeEncryptedStartHereSchema.parse(request.body);
      const contentNonce = decodeBase64Url(input.contentNonce, 12, "contentNonce");
      const contentCiphertext = decodeBase64UrlRange(
        input.contentCiphertext,
        17,
        65_536,
        "contentCiphertext",
      );
      const ciphertextSha256 = decodeBase64Url(input.ciphertextSha256, 32, "ciphertextSha256");
      const actualCiphertextSha256 = createHash("sha256").update(contentCiphertext).digest();
      if (!timingSafeEqual(ciphertextSha256, actualCiphertextSha256)) {
        throw new ApiError(400, "ciphertext_digest_mismatch", "The ciphertext digest did not match.");
      }

      const recoveryPublicKey = decodeP256PublicKey(input.recovery.publicKey, "recovery.publicKey");
      const recoveryEncapsulatedKey = decodeP256PublicKey(
        input.recovery.encapsulatedKey,
        "recovery.encapsulatedKey",
      );
      const recoveryWrappedKey = decodeBase64Url(input.recovery.wrappedKey, 48, "recovery.wrappedKey");
      const recipientEnvelopes = input.recipients.map((recipient) => ({
        keyPublicId: recipient.keyPublicId,
        encapsulatedKey: decodeP256PublicKey(
          recipient.encapsulatedKey,
          "recipients.encapsulatedKey",
        ),
        wrappedKey: decodeBase64Url(recipient.wrappedKey, 48, "recipients.wrappedKey"),
      }));
      if (new Set(recipientEnvelopes.map((entry) => entry.keyPublicId)).size !== recipientEnvelopes.length) {
        throw new ApiError(400, "duplicate_recipient_key", "Each recipient device key may appear once.");
      }

      const finalized = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const pending = await client.query<{
          id: string;
          preview_snapshot_sha256: Buffer | null;
          source_preview_public_id: string | null;
        }>(
          `select id::text, preview_snapshot_sha256, source_preview_public_id
           from app.export_packages
           where planner_id = app.current_planner_id()
             and public_id = $1
             and format = 'encrypted_start_here_v1'
             and status = 'generating'
             and recipient_rehearsal_id is null
             and expires_at > now()
           for update`,
          [packagePublicId],
        );
        const pendingRow = pending.rows[0];
        if (!pendingRow || pendingRow.source_preview_public_id !== input.previewPublicId) {
          throw new ApiError(
            409,
            "encrypted_package_prepare_required",
            "Prepare a fresh encrypted package from the reviewed preview before finalizing it.",
          );
        }

        const currentSnapshot = await collectStartHerePackage(client);
        const currentCommitment = startHereSnapshotCommitment(currentSnapshot);
        const preparedCommitment = pendingRow.preview_snapshot_sha256;
        if (
          !preparedCommitment
          || preparedCommitment.length !== currentCommitment.length
          || !timingSafeEqual(preparedCommitment, currentCommitment)
        ) {
          throw new ApiError(
            409,
            "start_here_preview_changed",
            "The plan changed after encryption was prepared. Create and review a fresh preview.",
          );
        }

        const eligible = await eligibleRecipientKeys(client);
        const eligibleIds = eligible.map((key) => key.public_id).sort();
        const submittedIds = recipientEnvelopes.map((entry) => entry.keyPublicId).sort();
        if (
          eligibleIds.length !== submittedIds.length
          || eligibleIds.some((value, index) => value !== submittedIds[index])
        ) {
          throw new ApiError(
            409,
            "recipient_keys_changed",
            "Accepted recipient device keys changed. Prepare and encrypt the package again.",
          );
        }

        await client.query(
          `insert into app.export_key_envelopes (
             planner_id, export_package_id, envelope_kind, recovery_public_key_x963,
             crypto_suite, encapsulated_key, wrapped_key
           ) values (
             app.current_planner_id(), $1, 'recovery', $2,
             'P256-HKDF-SHA256-AES-256-GCM', $3, $4
           )`,
          [pendingRow.id, recoveryPublicKey, recoveryEncapsulatedKey, recoveryWrappedKey],
        );

        for (const envelope of recipientEnvelopes) {
          await client.query(
            `insert into app.export_key_envelopes (
               planner_id, export_package_id, envelope_kind, recipient_device_key_id,
               crypto_suite, encapsulated_key, wrapped_key
             )
             select app.current_planner_id(), $1, 'recipient', id,
                    'P256-HKDF-SHA256-AES-256-GCM', $3, $4
             from app.recipient_device_keys
             where planner_id = app.current_planner_id() and public_id = $2`,
            [pendingRow.id, envelope.keyPublicId, envelope.encapsulatedKey, envelope.wrappedKey],
          );
        }

        await client.query(
          `update app.export_packages
           set status = 'ready', expires_at = null, content_nonce = $2,
               content_ciphertext = $3, ciphertext_sha256 = $4
           where id = $1`,
          [pendingRow.id, contentNonce, contentCiphertext, ciphertextSha256],
        );
        await appendAudit(client, "export.encrypted", "export_package", packagePublicId, {
          format: "encrypted_start_here_v1",
          cryptoVersion: input.cryptoVersion,
          contentEncryption: "AES-256-GCM",
          keyWrapping: "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
          acceptedRecipientDeviceKeyCount: recipientEnvelopes.length,
          offlineRecoveryEnvelopeCreated: true,
          offlineRecoveryPrivateKeyReceivedByServer: false,
          recipientDeliveryPerformed: false,
          serverCanDecrypt: false,
          externalCopiesRevocable: false,
        });
        await appendProductEvent(client, productClientSource(request), "start_here_exported", {
          format: "encrypted",
        });

        return {
          sourceCommitment: preparedCommitment.toString("base64url"),
          recipientKeyCount: recipientEnvelopes.length,
        };
      });

      response.status(201).json({
        encryptedPackage: {
          publicId: packagePublicId,
          status: "ready",
          cryptoVersion: input.cryptoVersion,
          sourceCommitment: finalized.sourceCommitment,
          recipientKeyCount: finalized.recipientKeyCount,
          offlineRecoveryEnvelopeCreated: true,
          offlineRecoveryPrivateKeyReceivedByServer: false,
          recipientDeliveryPerformed: false,
          serverCanDecrypt: false,
          externalCopiesRevocable: false,
        },
      });
    }),
  );

  router.get(
    "/exports/start-here/encrypted/:publicId",
    asyncHandler(async (request, response) => {
      const packagePublicId = publicIdSchema.parse(request.params.publicId);
      const artifact = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
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
           where planner_id = app.current_planner_id()
             and public_id = $1
             and format = 'encrypted_start_here_v1'
             and status = 'ready'
             and recipient_rehearsal_id is null`,
          [packagePublicId],
        );
        const packageRow = packageResult.rows[0];
        if (!packageRow) {
          throw new ApiError(404, "encrypted_package_not_found", "The encrypted package was not found.");
        }
        const envelopeResult = await client.query<{
          envelope_kind: "recipient" | "recovery";
          recipient_key_public_id: string | null;
          recovery_public_key_x963: Buffer | null;
          encapsulated_key: Buffer;
          wrapped_key: Buffer;
        }>(
          `select e.envelope_kind, k.public_id as recipient_key_public_id,
                  e.recovery_public_key_x963, e.encapsulated_key, e.wrapped_key
           from app.export_key_envelopes e
           left join app.recipient_device_keys k on k.id = e.recipient_device_key_id
           where e.planner_id = app.current_planner_id() and e.export_package_id = (
             select id from app.export_packages
             where planner_id = app.current_planner_id() and public_id = $1
           )
           order by e.id`,
          [packagePublicId],
        );
        return { packageRow, envelopes: envelopeResult.rows };
      });

      const recovery = artifact.envelopes.find((entry) => entry.envelope_kind === "recovery")!;
      response.setHeader(
        "content-disposition",
        `attachment; filename="rillora-encrypted-start-here-${packagePublicId}.json"`,
      );
      response.type("application/vnd.rillora.encrypted+json").json({
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
        recovery: {
          publicKey: recovery.recovery_public_key_x963!.toString("base64url"),
          encapsulatedKey: recovery.encapsulated_key.toString("base64url"),
          wrappedKey: recovery.wrapped_key.toString("base64url"),
        },
        recipients: artifact.envelopes
          .filter((entry) => entry.envelope_kind === "recipient")
          .map((entry) => ({
            keyPublicId: entry.recipient_key_public_id,
            encapsulatedKey: entry.encapsulated_key.toString("base64url"),
            wrappedKey: entry.wrapped_key.toString("base64url"),
          })),
        boundaries: {
          serverCanDecrypt: false,
          recipientDeliveryPerformed: false,
          externalCopiesRevocable: false,
        },
      });
    }),
  );

  router.post(
    "/exports/start-here/printable",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = createPrintableStartHereSchema.parse(request.body);
      const printable = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const preview = await client.query<{ preview_snapshot_sha256: Buffer | null }>(
          `select preview_snapshot_sha256
           from app.export_packages
           where planner_id = app.current_planner_id()
             and public_id = $1
             and format = 'start_here_json'
             and status = 'previewed'
             and expires_at > now()`,
          [input.previewPublicId],
        );
        if (!preview.rows[0]) {
          throw new ApiError(
            409,
            "start_here_preview_required",
            "Create and review a fresh Start Here preview before generating a printable guide.",
          );
        }

        const packageSnapshot = await collectStartHerePackage(client);
        const currentCommitment = startHereSnapshotCommitment(packageSnapshot);
        const reviewedCommitment = preview.rows[0].preview_snapshot_sha256;
        if (
          !reviewedCommitment
          || reviewedCommitment.length !== currentCommitment.length
          || !timingSafeEqual(reviewedCommitment, currentCommitment)
        ) {
          throw new ApiError(
            409,
            "start_here_preview_changed",
            "The plan changed after this preview. Create and review a fresh preview before generating the guide.",
          );
        }
        const generatedAt = new Date();
        const text = renderPrintableStartHere(packageSnapshot, generatedAt);
        const record = await client.query<{ public_id: string }>(
          `insert into app.export_packages (planner_id, plan_id, format, status)
           values (app.current_planner_id(), (
             select id from app.plans where planner_id = app.current_planner_id()
           ), 'start_here_text', 'ready')
           returning public_id`,
        );
        const exportRecord = record.rows[0]!;
        await appendAudit(client, "export.generated", "export_package", exportRecord.public_id, {
          format: "start_here_text",
          disclosureScope: "minimum_printable",
          encrypted: false,
          serverCopyRetained: false,
          acknowledgementPreviewPublicId: input.previewPublicId,
          excludedFields: ["accountHint", "valueBand", "currencyCode"],
        });
        await appendProductEvent(client, productClientSource(request), "start_here_exported", {
          format: "plaintext",
        });
        return { exportPublicId: exportRecord.public_id, generatedAt, text };
      });

      const date = printable.generatedAt.toISOString().slice(0, 10);
      response.status(201);
      response.setHeader(
        "content-disposition",
        `attachment; filename="rillora-start-here-${date}.txt"`,
      );
      response.setHeader("x-rillora-export-id", printable.exportPublicId);
      response.setHeader("x-rillora-server-copy-retained", "false");
      response.type("text/plain; charset=utf-8").send(printable.text);
    }),
  );

  router.get(
    "/audit-events",
    asyncHandler(async (request, response) => {
      const query = paginationSchema.parse(request.query);
      const events = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<{
          public_id: string;
          actor_type: string;
          action: string;
          resource_type: string;
          resource_public_id: string | null;
          metadata: Record<string, unknown>;
          occurred_at: Date;
        }>(
          `select public_id, actor_type, action, resource_type, resource_public_id, metadata, occurred_at
           from app.audit_events
           where planner_id = app.current_planner_id()
             and (
               $1::uuid is null
               or id < coalesce((
                 select id from app.audit_events
                 where planner_id = app.current_planner_id() and public_id = $1
               ), 0)
             )
           order by id desc
           limit $2`,
          [query.cursor ?? null, query.limit + 1],
        );
        return result.rows;
      });
      const hasMore = events.length > query.limit;
      const page = events.slice(0, query.limit);
      response.json({
        auditEvents: page.map((event) => ({
          publicId: event.public_id,
          actorType: event.actor_type,
          action: event.action,
          resourceType: event.resource_type,
          resourcePublicId: event.resource_public_id,
          metadata: event.metadata,
          occurredAt: event.occurred_at,
        })),
        nextCursor: hasMore ? page.at(-1)?.public_id ?? null : null,
      });
    }),
  );

  return router;
}

export type StartHerePackageSnapshot = {
  schemaVersion: "start-here-v1";
  planner: {
    display_name: string;
    locale: string;
    time_zone: string;
  };
  plan: {
    status: string;
  };
  matters: Array<{
    publicId: string;
    category: string;
    title: string;
    institutionName: string | null;
    locationHint: string | null;
    desiredOutcome: string;
    status: string;
  }>;
  trustedContacts: Array<{
    displayName: string;
    relationshipLabel: string | null;
  }>;
  directionsNotPasswords: true;
  legalAuthorityNotGranted: true;
};

type EligibleRecipientKeyRow = {
  public_id: string;
  display_name: string;
  device_label: string;
  public_key_x963: Buffer;
};

async function eligibleRecipientKeys(client: PoolClient): Promise<EligibleRecipientKeyRow[]> {
  const result = await client.query<EligibleRecipientKeyRow>(
    `select k.public_id, p.display_name, k.device_label, k.public_key_x963
     from app.recipient_device_keys k
     join app.people p
       on p.id = k.person_id and p.planner_id = k.planner_id
     join app.invitations i
       on i.id = k.invitation_id and i.planner_id = k.planner_id
     join app.role_assignments ra
       on ra.id = i.role_assignment_id and ra.planner_id = i.planner_id
     where k.planner_id = app.current_planner_id()
       and k.status = 'active'
       and p.status not in ('revoked', 'archived')
       and i.status = 'accepted'
       and i.delivery_channel <> 'simulation'
       and ra.status = 'accepted'
     order by k.id`,
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

function decodeBase64UrlRange(
  value: string,
  minimumLength: number,
  maximumLength: number,
  field: string,
): Buffer {
  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.length < minimumLength
    || decoded.length > maximumLength
    || decoded.toString("base64url") !== value
  ) {
    throw new ApiError(400, "invalid_crypto_material", `${field} is not canonical bounded base64url data.`);
  }
  return decoded;
}

function decodeP256PublicKey(value: string, field: string): Buffer {
  const decoded = decodeBase64Url(value, 65, field);
  if (decoded[0] !== 4) {
    throw new ApiError(400, "invalid_crypto_material", `${field} is not an uncompressed P-256 key.`);
  }
  try {
    ECDH.convertKey(decoded, "prime256v1", undefined, undefined, "uncompressed");
  } catch {
    throw new ApiError(400, "invalid_crypto_material", `${field} is not a valid P-256 point.`);
  }
  return decoded;
}

export async function collectStartHerePackage(client: PoolClient): Promise<StartHerePackageSnapshot> {
  const planner = await client.query<{
    display_name: string;
    locale: string;
    time_zone: string;
  }>(
    `select display_name, locale, time_zone from app.planners
     where id = app.current_planner_id()`,
  );
  const plannerRow = planner.rows[0];
  if (!plannerRow) throw new ApiError(404, "planner_not_found", "The planner was not found.");

  const plan = await getPlan(client);
  const matters = await client.query<{
    public_id: string;
    category: string;
    title: string;
    institution_name: string | null;
    location_hint: string | null;
    desired_outcome: string;
    status: string;
  }>(
    `select public_id, category, title, institution_name, location_hint,
            desired_outcome, status
     from app.matter_items
     where planner_id = app.current_planner_id() and archived_at is null
     order by id`,
  );
  const contacts = await client.query<{
    display_name: string;
    relationship_label: string | null;
  }>(
    `select p.display_name, p.relationship_label
     from app.people p
     join app.role_assignments ra
       on ra.person_id = p.id
      and ra.planner_id = p.planner_id
      and ra.role = 'trusted_contact'
     where p.planner_id = app.current_planner_id()
       and p.archived_at is null
       and p.status not in ('revoked', 'archived')
       and ra.status <> 'revoked'
     order by p.id`,
  );

  return {
    schemaVersion: "start-here-v1",
    planner: plannerRow,
    plan: { status: plan.status },
    matters: matters.rows.map((matter) => ({
      publicId: matter.public_id,
      category: matter.category,
      title: matter.title,
      institutionName: matter.institution_name,
      locationHint: matter.location_hint,
      desiredOutcome: matter.desired_outcome,
      status: matter.status,
    })),
    trustedContacts: contacts.rows.map((contact) => ({
      displayName: contact.display_name,
      relationshipLabel: contact.relationship_label,
    })),
    directionsNotPasswords: true,
    legalAuthorityNotGranted: true,
  };
}

export function startHereSnapshotCommitment(snapshot: StartHerePackageSnapshot): Buffer {
  return createHash("sha256").update(JSON.stringify(snapshot), "utf8").digest();
}

function renderPrintableStartHere(
  snapshot: StartHerePackageSnapshot,
  generatedAt: Date,
): string {
  const lines = [
    "RILLORA — START HERE",
    "Minimum-disclosure printable guide",
    "",
    `Planner: ${printableLine(snapshot.planner.display_name)}`,
    `Generated: ${generatedAt.toISOString()}`,
    `Plan status: ${printableLabel(snapshot.plan.status)}`,
    "",
    "IMPORTANT BOUNDARY",
    "This is a plaintext directions map. It is not an encrypted package, a password vault,",
    "proof of death, legal authority, ownership transfer, or evidence that any provider accepted a request.",
    "Anyone who receives a saved or printed copy can read it, and Rillora cannot revoke that copy.",
    "Dedicated account hints, financial values, currencies, passwords and recovery secrets are excluded.",
    "",
    "MATTER DIRECTIONS",
  ];

  if (snapshot.matters.length === 0) {
    lines.push("No active matters are recorded.");
  } else {
    snapshot.matters.forEach((matter, index) => {
      lines.push("", `${index + 1}. ${printableLine(matter.title)}`);
      lines.push(`   Category: ${printableLabel(matter.category)}`);
      if (matter.institutionName) {
        lines.push(`   Institution or provider: ${printableLine(matter.institutionName)}`);
      }
      if (matter.locationHint) {
        lines.push(`   Where to look: ${printableLine(matter.locationHint)}`);
      }
      lines.push(`   Direction: ${printableLabel(matter.desiredOutcome)}`);
      lines.push(`   Rillora status: ${printableLabel(matter.status)}`);
    });
  }

  lines.push("", "TRUSTED-CONTACT RECORDS");
  if (snapshot.trustedContacts.length === 0) {
    lines.push("No active trusted-contact records are included.");
  } else {
    snapshot.trustedContacts.forEach((contact, index) => {
      const relationship = contact.relationshipLabel
        ? ` — ${printableLine(contact.relationshipLabel)}`
        : "";
      lines.push(`${index + 1}. ${printableLine(contact.displayName)}${relationship}`);
    });
  }

  lines.push(
    "",
    "NEXT STEP",
    "Use each provider's current official process. Verify identity, authority and requested action independently.",
    "Do not write passwords, PINs, recovery codes, seed phrases or private keys on this guide.",
    "",
  );
  return lines.join("\n");
}

function printableLine(value: string): string {
  const sanitized = value
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  return sanitized || "Not provided";
}

function printableLabel(value: string): string {
  return printableLine(value.replaceAll("_", " "));
}

async function getPlan(client: PoolClient): Promise<PlanRow> {
  const result = await client.query<PlanRow>(
    `select public_id, motivation, status, first_use_state, first_use_step,
            policy_version, last_reviewed_at,
            review_due_at, version, created_at, updated_at
     from app.plans where planner_id = app.current_planner_id()`,
  );
  const plan = result.rows[0];
  if (!plan) throw new ApiError(404, "plan_not_found", "The plan was not found.");
  return plan;
}

async function appendAudit(
  client: PoolClient,
  action: string,
  resourceType: string,
  resourcePublicId: string | null,
  metadata: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `insert into app.audit_events (
       planner_id, actor_type, action, resource_type, resource_public_id, metadata
     ) values (app.current_planner_id(), 'planner', $1, $2, $3, $4::jsonb)`,
    [action, resourceType, resourcePublicId, JSON.stringify(metadata)],
  );
}

async function selectTrustedContact(
  client: PoolClient,
  publicId: string,
): Promise<ContactRow | null> {
  const result = await client.query<ContactRow>(
    `select p.public_id, p.display_name, p.relationship_label, p.status, p.version,
            p.created_at, p.updated_at, ra.status as role_status,
            i.status as invitation_status, i.delivery_channel
     from app.people p
     left join app.role_assignments ra
       on ra.person_id = p.id and ra.planner_id = p.planner_id and ra.role = 'trusted_contact'
     left join lateral (
       select status, delivery_channel
       from app.invitations
       where role_assignment_id = ra.id
       order by id desc limit 1
     ) i on true
     where p.planner_id = app.current_planner_id() and p.public_id = $1`,
    [publicId],
  );
  return result.rows[0] ?? null;
}

async function throwMissingOrConflict(
  client: PoolClient,
  resource: "matter" | "person" | "official_setup",
  publicId: string,
): Promise<never> {
  const table =
    resource === "matter"
      ? "app.matter_items"
      : resource === "person"
        ? "app.people"
        : "app.official_setup_checks";
  const existing = await client.query(`select 1 from ${table} where public_id = $1`, [publicId]);
  if (existing.rows[0]) {
    throw new ApiError(409, "version_conflict", "The record changed. Refresh and try again.");
  }
  throw new ApiError(404, `${resource}_not_found`, "The requested record was not found.");
}

function mapPlan(row: PlanRow) {
  return {
    publicId: row.public_id,
    motivation: row.motivation,
    status: row.status,
    firstUseState: row.first_use_state,
    firstUseStep: row.first_use_step,
    policyVersion: row.policy_version,
    lastReviewedAt: row.last_reviewed_at,
    reviewDueAt: row.review_due_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMatter(row: MatterRow) {
  return {
    publicId: row.public_id,
    category: row.category,
    title: row.title,
    institutionName: row.institution_name,
    accountHint: row.account_hint,
    valueBand: row.value_band,
    currencyCode: row.currency_code,
    locationHint: row.location_hint,
    importance: row.importance,
    desiredOutcome: row.desired_outcome,
    status: row.status,
    reviewDueAt: row.review_due_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapContact(row: ContactRow) {
  return {
    publicId: row.public_id,
    displayName: row.display_name,
    relationshipLabel: row.relationship_label,
    status: row.status,
    roleStatus: row.role_status,
    invitationStatus: row.invitation_status,
    confirmationMode: row.delivery_channel,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOfficialSetup(row: OfficialSetupRow) {
  return {
    publicId: row.public_id,
    providerKey: row.provider_key,
    policyVersion: row.policy_version,
    completed: row.completed,
    completedAt: row.completed_at,
    version: row.version,
    updatedAt: row.updated_at,
  };
}
