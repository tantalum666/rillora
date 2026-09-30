import type { Router } from "express";
import { Router as createRouter } from "express";
import type { PoolClient } from "pg";
import { requireCsrf } from "./auth.js";
import type { DatabasePool } from "./db.js";
import { withPlannerDatabase } from "./db.js";
import { invalidateDisclosureRehearsals } from "./disclosure-policy.js";
import {
  createRoleAssignmentSchema,
  publicIdSchema,
  updateRoleAssignmentSchema,
} from "./domain.js";
import { ApiError, asyncHandler } from "./errors.js";
import { appendProductEvent, productClientSource } from "./product-events.js";

type AssignmentRow = {
  public_id: string;
  role: "trusted_contact" | "executor" | "recipient";
  status: "draft" | "invited" | "accepted" | "revoked";
  matter_item_id: string | null;
  matter_public_id: string | null;
  matter_title: string | null;
  person_public_id: string;
  display_name: string;
  relationship_label: string | null;
  invitation_status: "pending" | "accepted" | "expired" | "revoked" | null;
  delivery_channel: "simulation" | "email" | null;
  version: number;
  created_at: Date;
  updated_at: Date;
};

const boundaries = {
  recordOnlyByDefault: true,
  invitationSent: false,
  identityBound: false,
  legalAuthorityGranted: false,
  accountAccessGranted: false,
  releaseAvailable: false,
} as const;

export function createRoleAssignmentRouter(pool: DatabasePool): Router {
  const router = createRouter();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const assignments = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const result = await client.query<AssignmentRow>(
          `${assignmentSelect}
           where ra.planner_id = app.current_planner_id()
             and ra.status <> 'revoked'
             and p.status not in ('revoked', 'archived')
           order by ra.id`,
        );
        return result.rows.sort((a,b)=>a.display_name.localeCompare(b.display_name)
          || a.role.localeCompare(b.role) || (a.matter_title??'').localeCompare(b.matter_title??''));
      });
      response.json({ roleAssignments: assignments.map(serializeAssignment), boundaries });
    }),
  );

  router.post(
    "/",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const input = createRoleAssignmentSchema.parse(request.body);
      const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const ids = await resolveAssignmentIds(client, input.personPublicId, input.matterPublicId);
        try {
          const created = await client.query<{ public_id: string }>(
            `insert into app.role_assignments (
               planner_id, plan_id, person_id, matter_item_id, role, status
             ) values (
               app.current_planner_id(), $1, $2, $3, $4, 'draft'
             ) returning public_id`,
            [ids.planId, ids.personId, ids.matterId, input.role],
          );
          const publicId = created.rows[0]?.public_id;
          if (!publicId) throw new ApiError(500, "role_assignment_create_failed", "The role assignment could not be created.");
          const invalidatedCount = await invalidateDisclosureRehearsals(client);
          await appendAudit(client, "role_assignment.created", publicId, {
            role: input.role,
            scope: input.scope,
            matterPublicId: input.matterPublicId,
            evidence: "record_only",
            invalidatedDisclosureRehearsalCount: invalidatedCount,
          });
          await appendProductEvent(client, productClientSource(request), "item_role_assigned", {
            role: input.role,
            scope: input.scope,
          });
          const assignment = await getAssignment(client, publicId);
          if (!assignment) throw new ApiError(500, "role_assignment_create_failed", "The role assignment could not be read back.");
          return { assignment, invalidatedCount };
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new ApiError(409, "role_assignment_exists", "That person already has this role at the selected scope.");
          }
          throw error;
        }
      });
      response.status(201).json({
        roleAssignment: serializeAssignment(result.assignment),
        invalidatedDisclosureRehearsalCount: result.invalidatedCount,
        boundaries,
      });
    }),
  );

  router.patch(
    "/:publicId",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const input = updateRoleAssignmentSchema.parse(request.body);
      const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const ids = await resolveAssignmentIds(client, null, input.matterPublicId);
        try {
          const updated = await client.query<{ public_id: string }>(
            `update app.role_assignments ra
             set role = $2,
                 matter_item_id = $3,
                 version = version + 1,
                 updated_at = now()
             where ra.planner_id = app.current_planner_id()
               and ra.public_id = $1
               and ra.version = $4
               and ra.status = 'draft'
               and not exists (
                 select 1 from app.invitations i where i.role_assignment_id = ra.id
               )
             returning public_id`,
            [publicId, input.role, ids.matterId, input.expectedVersion],
          );
          if (!updated.rows[0]) await throwAssignmentMutationFailure(client, publicId, input.expectedVersion);
          const invalidatedCount = await invalidateDisclosureRehearsals(client);
          await appendAudit(client, "role_assignment.updated", publicId, {
            role: input.role,
            scope: input.scope,
            matterPublicId: input.matterPublicId,
            evidence: "record_only",
            invalidatedDisclosureRehearsalCount: invalidatedCount,
          });
          const assignment = await getAssignment(client, publicId);
          if (!assignment) throw new ApiError(500, "role_assignment_update_failed", "The role assignment could not be read back.");
          return { assignment, invalidatedCount };
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new ApiError(409, "role_assignment_exists", "That person already has this role at the selected scope.");
          }
          throw error;
        }
      });
      response.json({
        roleAssignment: serializeAssignment(result.assignment),
        invalidatedDisclosureRehearsalCount: result.invalidatedCount,
        boundaries,
      });
    }),
  );

  router.delete(
    "/:publicId",
    requireCsrf,
    asyncHandler(async (request, response) => {
      const publicId = publicIdSchema.parse(request.params.publicId);
      const expectedVersion = Number(request.get("if-match"));
      if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
        throw new ApiError(400, "invalid_version", "If-Match must contain the current positive version.");
      }
      const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
        const current = await getAssignment(client, publicId);
        if (!current) throw new ApiError(404, "role_assignment_not_found", "Role assignment not found.");
        if (current.version !== expectedVersion) {
          throw new ApiError(409, "version_conflict", "The role assignment changed. Reload and try again.");
        }
        const revoked = await client.query<{ public_id: string }>(
          `update app.role_assignments
           set status = 'revoked', version = version + 1, updated_at = now()
           where planner_id = app.current_planner_id() and public_id = $1
             and version = $2 and status <> 'revoked'
           returning public_id`,
          [publicId, expectedVersion],
        );
        if (!revoked.rows[0]) throw new ApiError(409, "version_conflict", "The role assignment changed. Reload and try again.");
        await client.query(
          `update app.invitations
           set status = 'revoked', revoked_at = coalesce(revoked_at, now())
           where planner_id = app.current_planner_id()
             and role_assignment_id = (
               select id from app.role_assignments
               where planner_id = app.current_planner_id() and public_id = $1
             )
             and status <> 'revoked'`,
          [publicId],
        );
        const invalidatedCount = await invalidateDisclosureRehearsals(client);
        await appendAudit(client, "role_assignment.revoked", publicId, {
          role: current.role,
          scope: current.matter_item_id === null ? "plan_wide" : "matter_specific",
          matterPublicId: current.matter_public_id,
          invitationAlsoRevoked: current.invitation_status !== null,
          invalidatedDisclosureRehearsalCount: invalidatedCount,
        });
        return { invalidatedCount };
      });
      response.json({
        revoked: true,
        invalidatedDisclosureRehearsalCount: result.invalidatedCount,
        boundaries,
      });
    }),
  );

  return router;
}

const assignmentSelect = `
  select ra.public_id, ra.role, ra.status, ra.matter_item_id::text,
         m.public_id as matter_public_id, m.title as matter_title,
         p.public_id as person_public_id, p.display_name, p.relationship_label,
         invitation.status as invitation_status,
         invitation.delivery_channel,
         ra.version, ra.created_at, ra.updated_at
  from app.role_assignments ra
  join app.people p on p.id = ra.person_id and p.planner_id = ra.planner_id
  left join app.matter_items m on m.id = ra.matter_item_id and m.planner_id = ra.planner_id
  left join lateral (
    select i.status, i.delivery_channel
    from app.invitations i
    where i.role_assignment_id = ra.id
    order by i.id desc limit 1
  ) invitation on true`;

async function getAssignment(client: PoolClient, publicId: string): Promise<AssignmentRow | null> {
  const result = await client.query<AssignmentRow>(
    `${assignmentSelect}
     where ra.planner_id = app.current_planner_id() and ra.public_id = $1`,
    [publicId],
  );
  return result.rows[0] ?? null;
}

async function resolveAssignmentIds(
  client: PoolClient,
  personPublicId: string | null,
  matterPublicId: string | null,
): Promise<{ planId: string; personId: string | null; matterId: string | null }> {
  const plan = await client.query<{ id: string }>(
    "select id::text from app.plans where planner_id = app.current_planner_id()",
  );
  const planId = plan.rows[0]?.id;
  if (!planId) throw new ApiError(409, "plan_missing", "Create a plan before assigning roles.");

  let personId: string | null = null;
  if (personPublicId) {
    const person = await client.query<{ id: string }>(
      `select id::text from app.people
       where planner_id = app.current_planner_id() and public_id = $1
         and status not in ('revoked', 'archived')`,
      [personPublicId],
    );
    personId = person.rows[0]?.id ?? null;
    if (!personId) throw new ApiError(404, "person_not_found", "The selected person record was not found.");
  }

  let matterId: string | null = null;
  if (matterPublicId) {
    const matter = await client.query<{ id: string }>(
      `select id::text from app.matter_items
       where planner_id = app.current_planner_id() and public_id = $1 and archived_at is null`,
      [matterPublicId],
    );
    matterId = matter.rows[0]?.id ?? null;
    if (!matterId) throw new ApiError(404, "matter_not_found", "The selected matter was not found.");
  }
  return { planId, personId, matterId };
}

async function throwAssignmentMutationFailure(
  client: PoolClient,
  publicId: string,
  expectedVersion: number,
): Promise<never> {
  const current = await getAssignment(client, publicId);
  if (!current) throw new ApiError(404, "role_assignment_not_found", "Role assignment not found.");
  if (current.version !== expectedVersion) {
    throw new ApiError(409, "version_conflict", "The role assignment changed. Reload and try again.");
  }
  throw new ApiError(
    409,
    "invitation_backed_assignment_locked",
    "Invitation-backed or accepted assignments cannot be repurposed. Revoke them explicitly instead.",
  );
}

async function appendAudit(
  client: PoolClient,
  action: string,
  resourcePublicId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `insert into app.audit_events (
       planner_id, actor_type, action, resource_type, resource_public_id, metadata
     ) values (
       app.current_planner_id(), 'planner', $1, 'role_assignment', $2, $3::jsonb
     )`,
    [action, resourcePublicId, JSON.stringify(metadata)],
  );
}

function serializeAssignment(row: AssignmentRow) {
  const evidence = row.invitation_status === null
    ? "record_only"
    : row.delivery_channel === "simulation"
      ? "simulation"
      : row.invitation_status === "accepted"
        ? "invitation_accepted"
        : "invitation_pending";
  return {
    publicId: row.public_id,
    person: {
      publicId: row.person_public_id,
      displayName: row.display_name,
      relationshipLabel: row.relationship_label,
    },
    role: row.role,
    scope: row.matter_item_id === null ? "plan_wide" : "matter_specific",
    matter: row.matter_public_id === null ? null : {
      publicId: row.matter_public_id,
      title: row.matter_title,
    },
    status: row.status,
    evidence,
    invitationStatus: row.invitation_status,
    editable: row.status === "draft" && row.invitation_status === null,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
