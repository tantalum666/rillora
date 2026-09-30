import { Router as createRouter } from "express";
import { requireCsrf } from "./auth.js";
import { withPlannerDatabase } from "./db.js";
import { createDisclosureRehearsalSchema, publicIdSchema, updateDisclosureRehearsalSchema, } from "./domain.js";
import { ApiError, asyncHandler } from "./errors.js";
import { appendProductEvent, productClientSource } from "./product-events.js";
import { randomUUID } from "node:crypto";
import { protectSnapshot } from "./private-content.js";
const policyVersion = "disclosure-rehearsal-2026-08-10-v1";
const machines = {
    death: {
        lifeEvent: "death",
        policyLabel: "Death claim rehearsal",
        coolingOffHours: 336,
        states: [
            { key: "death_claim_opened", label: "Death claim opened", checkpoint: "Claim recorded only inside the rehearsal" },
            { key: "death_identity_review", label: "Identity review", checkpoint: "Identity-review guardrail simulated" },
            { key: "death_document_review", label: "Death and authority document review", checkpoint: "Document-review guardrail simulated" },
            { key: "death_multi_party_confirmation", label: "Multi-party confirmation", checkpoint: "Independent-confirmation guardrail simulated" },
            { key: "death_cooling_off", label: "Illustrative 14-day cooling-off", checkpoint: "Cooling-off guardrail entered" },
            { key: "death_preview_ready", label: "Staged disclosure preview ready", checkpoint: "Planner-only staged preview enabled" },
        ],
        appealedState: "death_appealed",
        canceledState: "death_canceled",
    },
    incapacity: {
        lifeEvent: "incapacity",
        policyLabel: "Incapacity claim rehearsal",
        coolingOffHours: 168,
        states: [
            { key: "incapacity_claim_opened", label: "Incapacity claim opened", checkpoint: "Claim recorded only inside the rehearsal" },
            { key: "incapacity_identity_review", label: "Identity review", checkpoint: "Identity-review guardrail simulated" },
            { key: "incapacity_authority_review", label: "Authority and capacity evidence review", checkpoint: "Authority-review guardrail simulated" },
            { key: "incapacity_multi_party_confirmation", label: "Multi-party confirmation", checkpoint: "Independent-confirmation guardrail simulated" },
            { key: "incapacity_cooling_off", label: "Illustrative 7-day cooling-off", checkpoint: "Cooling-off guardrail entered" },
            { key: "incapacity_preview_ready", label: "Limited support preview ready", checkpoint: "Planner-only limited preview enabled" },
        ],
        appealedState: "incapacity_appealed",
        canceledState: "incapacity_canceled",
    },
    missing: {
        lifeEvent: "missing",
        policyLabel: "Missing-person support rehearsal",
        coolingOffHours: 72,
        states: [
            { key: "missing_report_opened", label: "Missing report opened", checkpoint: "Report recorded only inside the rehearsal" },
            { key: "missing_identity_review", label: "Reporter identity review", checkpoint: "Identity-review guardrail simulated" },
            { key: "missing_contact_attempts_review", label: "Contact-attempt review", checkpoint: "Reversible contact-attempt guardrail simulated" },
            { key: "missing_multi_party_confirmation", label: "Multi-party confirmation", checkpoint: "Independent-confirmation guardrail simulated" },
            { key: "missing_support_cooling_off", label: "Illustrative 72-hour support hold", checkpoint: "Limited-support hold entered" },
            { key: "missing_limited_preview_ready", label: "Limited support preview ready", checkpoint: "Planner-only limited support preview enabled" },
        ],
        appealedState: "missing_appealed",
        canceledState: "missing_canceled",
    },
};
const boundaries = {
    simulationOnly: true,
    operative: false,
    identityVerified: false,
    documentsVerified: false,
    multiPartyVerified: false,
    notificationsSent: false,
    dataReleased: false,
    releaseAvailable: false,
    legalAuthorityGranted: false,
};
export function createDisclosureRehearsalRouter(pool) {
    const router = createRouter();
    router.get("/", asyncHandler(async (request, response) => {
        const rows = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            const result = await client.query(`${rehearsalSelect}
           where planner_id = app.current_planner_id()
           order by updated_at desc, id desc
           limit 20`);
            return result.rows;
        });
        response.json({
            disclosureRehearsals: rows.map(serializeRehearsal),
            boundaries,
        });
    }));
    router.get("/:publicId", asyncHandler(async (request, response) => {
        const publicId = publicIdSchema.parse(request.params.publicId);
        const row = await withPlannerDatabase(pool, request.auth.plannerId, (client) => getRehearsal(client, publicId));
        if (!row)
            throw new ApiError(404, "disclosure_rehearsal_not_found", "Disclosure rehearsal not found.");
        response.json({ disclosureRehearsal: serializeRehearsal(row), boundaries });
    }));
    router.post("/", requireCsrf, asyncHandler(async (request, response) => {
        const input = createDisclosureRehearsalSchema.parse(request.body);
        const machine = machines[input.lifeEvent];
        const created = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            const snapshot = await collectDisclosureSnapshot(client, input.lifeEvent, machine);
            const publicId = randomUUID();
            const storedSnapshot = await protectSnapshot(client, publicId, snapshot);
            const firstState = machine.states[0];
            const checkpoint = checkpointFor(firstState);
            const result = await client.query(`insert into app.disclosure_rehearsals (
             public_id, planner_id, plan_id, life_event, state, policy_version,
             policy_snapshot, completed_checkpoints
           )
           select $6::uuid, app.current_planner_id(), id, $1, $2, $3, $4::jsonb, $5::jsonb
           from app.plans where planner_id = app.current_planner_id()
           returning ${rehearsalColumns}`, [input.lifeEvent, firstState.key, policyVersion, JSON.stringify(storedSnapshot), JSON.stringify([checkpoint]), publicId]);
            const row = result.rows[0];
            if (!row)
                throw new ApiError(409, "plan_missing", "Create a plan before rehearsing disclosure.");
            await appendAudit(client, "disclosure_rehearsal.created", row.public_id, {
                lifeEvent: input.lifeEvent,
                state: firstState.key,
                simulationOnly: true,
            });
            return row;
        });
        response.status(201).json({ disclosureRehearsal: serializeRehearsal(created), boundaries });
    }));
    router.post("/:publicId/actions", requireCsrf, asyncHandler(async (request, response) => {
        const publicId = publicIdSchema.parse(request.params.publicId);
        const input = updateDisclosureRehearsalSchema.parse(request.body);
        const updated = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            const current = await getRehearsal(client, publicId);
            if (!current)
                throw new ApiError(404, "disclosure_rehearsal_not_found", "Disclosure rehearsal not found.");
            if (current.invalidated_at) {
                throw new ApiError(409, "disclosure_rehearsal_invalidated", "Role policy changed after this snapshot. Create a fresh disclosure rehearsal.");
            }
            if (current.version !== input.expectedVersion) {
                throw new ApiError(409, "version_conflict", "The disclosure rehearsal changed. Reload and try again.");
            }
            const transition = nextTransition(current, input.action);
            const checkpoint = checkpointFor(transition.definition);
            const result = await client.query(`update app.disclosure_rehearsals
           set state = $2,
               completed_checkpoints = completed_checkpoints || $3::jsonb,
               cooling_off_ends_at = $4,
               cooling_off_simulated_at = $5,
               appealed_at = $6,
               canceled_at = $7,
               version = version + 1,
               updated_at = now()
           where public_id = $1 and planner_id = app.current_planner_id() and version = $8
           returning ${rehearsalColumns}`, [
                publicId,
                transition.state,
                JSON.stringify([checkpoint]),
                transition.coolingOffEndsAt,
                transition.coolingOffSimulatedAt,
                transition.appealedAt,
                transition.canceledAt,
                input.expectedVersion,
            ]);
            const row = result.rows[0];
            if (!row)
                throw new ApiError(409, "version_conflict", "The disclosure rehearsal changed. Reload and try again.");
            await appendAudit(client, `disclosure_rehearsal.${input.action}`, row.public_id, {
                lifeEvent: row.life_event,
                fromState: current.state,
                toState: row.state,
                simulationOnly: true,
            });
            if (row.state.endsWith("preview_ready")) {
                await appendProductEvent(client, productClientSource(request), "simulation_completed", {
                    lifeEvent: row.life_event,
                    kind: "role_disclosure",
                });
            }
            return row;
        });
        response.json({ disclosureRehearsal: serializeRehearsal(updated), boundaries });
    }));
    return router;
}
const rehearsalColumns = `
  public_id, life_event, state, policy_version, policy_snapshot, completed_checkpoints,
  simulation_only, operative, identity_verified, documents_verified,
  multi_party_verified, notifications_sent, data_released,
  cooling_off_ends_at, cooling_off_simulated_at, appealed_at, canceled_at,
  invalidated_at, invalidated_reason,
  version, created_at, updated_at`;
const rehearsalSelect = `select id, ${rehearsalColumns} from app.disclosure_rehearsals`;
async function getRehearsal(client, publicId) {
    const result = await client.query(`${rehearsalSelect}
     where public_id = $1 and planner_id = app.current_planner_id()`, [publicId]);
    return result.rows[0] ?? null;
}
function serializeRehearsal(row) {
    const machine = machines[row.life_event];
    return {
        publicId: row.public_id,
        lifeEvent: row.life_event,
        state: row.state,
        stateLabel: stateLabel(machine, row.state),
        policyVersion: row.policy_version,
        policyLabel: machine.policyLabel,
        stateSequence: machine.states.map((state) => ({ key: state.key, label: state.label })),
        completedCheckpoints: row.completed_checkpoints,
        projectedRoleViews: row.policy_snapshot.roleViews,
        snapshot: row.policy_snapshot,
        availableActions: row.invalidated_at ? [] : availableActions(machine, row.state),
        previewReady: row.state === machine.states.at(-1)?.key,
        snapshotFresh: row.invalidated_at === null,
        invalidatedAt: row.invalidated_at,
        invalidatedReason: row.invalidated_reason,
        coolingOffEndsAt: row.cooling_off_ends_at,
        coolingOffSimulatedAt: row.cooling_off_simulated_at,
        appealedAt: row.appealed_at,
        canceledAt: row.canceled_at,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        boundaries,
    };
}
function stateLabel(machine, state) {
    if (state === machine.appealedState)
        return "Appeal hold";
    if (state === machine.canceledState)
        return "Canceled by planner";
    return machine.states.find((candidate) => candidate.key === state)?.label ?? state;
}
function availableActions(machine, state) {
    if (state === machine.canceledState)
        return [];
    if (state === machine.appealedState)
        return ["restart_review", "cancel"];
    const index = machine.states.findIndex((candidate) => candidate.key === state);
    if (index < 0)
        return [];
    const coolingState = machine.states.at(-2).key;
    const finalState = machine.states.at(-1).key;
    if (state === coolingState)
        return ["simulate_cooling_off_elapsed", "appeal", "cancel"];
    if (state === finalState)
        return ["appeal", "cancel"];
    return index === 0 ? ["advance", "cancel"] : ["advance", "appeal", "cancel"];
}
function nextTransition(current, action) {
    const machine = machines[current.life_event];
    if (!availableActions(machine, current.state).includes(action)) {
        throw new ApiError(409, "invalid_rehearsal_transition", "That action is not available from the current rehearsal state.");
    }
    let state;
    let definition;
    let coolingOffEndsAt = current.cooling_off_ends_at;
    let coolingOffSimulatedAt = current.cooling_off_simulated_at;
    let appealedAt = current.appealed_at;
    let canceledAt = current.canceled_at;
    if (action === "cancel") {
        state = machine.canceledState;
        definition = { key: state, label: "Canceled by planner", checkpoint: "Planner cancellation simulated" };
        canceledAt = new Date();
    }
    else if (action === "appeal") {
        state = machine.appealedState;
        definition = { key: state, label: "Appeal hold", checkpoint: "Appeal hold simulated" };
        appealedAt = new Date();
    }
    else if (action === "restart_review") {
        definition = machine.states[1];
        state = definition.key;
        coolingOffEndsAt = null;
        coolingOffSimulatedAt = null;
    }
    else if (action === "simulate_cooling_off_elapsed") {
        definition = machine.states.at(-1);
        state = definition.key;
        coolingOffSimulatedAt = new Date();
    }
    else {
        const index = machine.states.findIndex((candidate) => candidate.key === current.state);
        definition = machine.states[index + 1];
        state = definition.key;
        if (state === machine.states.at(-2).key) {
            coolingOffEndsAt = new Date(Date.now() + machine.coolingOffHours * 60 * 60 * 1000);
        }
    }
    return {
        state,
        definition,
        coolingOffEndsAt,
        coolingOffSimulatedAt,
        appealedAt,
        canceledAt,
    };
}
function checkpointFor(definition) {
    return {
        code: definition.key,
        label: definition.checkpoint,
        simulatedAt: new Date().toISOString(),
        realEvidenceCollected: false,
    };
}
async function collectDisclosureSnapshot(client, lifeEvent, machine) {
    const planner = await client.query(`select display_name, time_zone from app.planners where id = app.current_planner_id()`);
    const matters = await client.query(`select id::text, public_id, category, title, institution_name, location_hint, desired_outcome
     from app.matter_items
     where planner_id = app.current_planner_id() and archived_at is null
     order by id`);
    const assignments = await client.query(`select ra.public_id, ra.role, ra.status, ra.matter_item_id::text,
            p.public_id as person_public_id, p.display_name, p.relationship_label,
            coalesce(invitation_evidence.confirmation_mode, 'record_only') as confirmation_mode
     from app.role_assignments ra
     join app.people p on p.id = ra.person_id and p.planner_id = ra.planner_id
     left join lateral (
       select case when i.delivery_channel = 'simulation' then 'simulation' else 'real' end as confirmation_mode
       from app.invitations i
       where i.role_assignment_id = ra.id and i.status = 'accepted'
       order by i.accepted_at desc nulls last, i.id desc limit 1
     ) invitation_evidence on true
     where ra.planner_id = app.current_planner_id()
       and ra.status <> 'revoked'
       and p.status not in ('revoked', 'archived')
     order by ra.id`);
    const owner = planner.rows[0];
    if (!owner)
        throw new ApiError(409, "planner_missing", "Planner profile is unavailable.");
    return {
        schemaVersion: "disclosure-rehearsal-v1",
        capturedAt: new Date().toISOString(),
        lifeEvent,
        policyIllustrative: true,
        operative: false,
        planner: { displayName: owner.display_name, timeZone: owner.time_zone },
        coolingOffDurationHours: machine.coolingOffHours,
        guardrails: machine.states.slice(1, -1).map((state) => ({
            code: state.key,
            label: state.label,
            realEvidenceCollected: false,
        })),
        roleViews: buildRoleViews(lifeEvent, matters.rows, assignments.rows.sort((a, b) => a.role.localeCompare(b.role) || a.display_name.localeCompare(b.display_name))),
    };
}
function buildRoleViews(lifeEvent, matters, assignments) {
    return ["trusted_contact", "executor", "recipient"].map((role) => {
        const roleAssignments = assignments.filter((assignment) => assignment.role === role);
        const assignedPeople = roleAssignments
            .filter((assignment, index, source) => source.findIndex((candidate) => candidate.person_public_id === assignment.person_public_id) === index)
            .map((assignment) => ({
            publicId: assignment.person_public_id,
            displayName: assignment.display_name,
            relationshipLabel: assignment.relationship_label,
            assignmentStatus: assignment.status,
            invitationEvidence: assignment.confirmation_mode,
        }));
        const policy = rolePolicy(lifeEvent, role, roleAssignments.length > 0);
        const eligibleMatters = assignedMatters(role, matters, roleAssignments);
        const projectedMatters = policy.previewStage === "none" || policy.summaryOnly
            ? []
            : eligibleMatters.map((matter) => projectMatter(matter, policy.fieldPolicy));
        return {
            role,
            previewStage: policy.previewStage,
            eligibleForProjectedPreview: policy.eligible,
            reason: policy.reason,
            assignedPeople,
            fieldPolicy: policy.fieldPolicy,
            matters: projectedMatters,
            summary: { matterCount: policy.summaryOnly ? matters.length : projectedMatters.length },
        };
    });
}
function rolePolicy(lifeEvent, role, hasAssignment) {
    if (!hasAssignment) {
        return {
            previewStage: "none",
            eligible: false,
            reason: "No active Rillora role assignment exists for this policy preview.",
            fieldPolicy: [],
            summaryOnly: false,
        };
    }
    if (lifeEvent === "death" && role === "trusted_contact") {
        return {
            previewStage: "guidance",
            eligible: true,
            reason: "Projected guidance only; no account access or legal authority.",
            fieldPolicy: ["matter.title", "matter.category", "matter.desiredOutcome"],
            summaryOnly: false,
        };
    }
    if (lifeEvent === "death" && role === "executor") {
        return {
            previewStage: "locator",
            eligible: true,
            reason: "Projected locator view remains subject to real authority review.",
            fieldPolicy: [
                "matter.title", "matter.category", "matter.institutionName",
                "matter.locationHint", "matter.desiredOutcome",
            ],
            summaryOnly: false,
        };
    }
    if (lifeEvent === "death" && role === "recipient") {
        return {
            previewStage: "locator",
            eligible: true,
            reason: "Only matter-specific recipient assignments are projected.",
            fieldPolicy: ["matter.title", "matter.category", "matter.locationHint", "matter.desiredOutcome"],
            summaryOnly: false,
        };
    }
    if (lifeEvent === "incapacity" && role === "trusted_contact") {
        return {
            previewStage: "guidance",
            eligible: true,
            reason: "Limited support guidance only; incapacity authority is not inferred.",
            fieldPolicy: ["matter.title", "matter.category"],
            summaryOnly: false,
        };
    }
    if (lifeEvent === "missing" && role === "trusted_contact") {
        return {
            previewStage: "guidance",
            eligible: true,
            reason: "Missing-person policy exposes only planner/time-zone and matter-count context.",
            fieldPolicy: ["planner.displayName", "planner.timeZone", "plan.matterCount"],
            summaryOnly: true,
        };
    }
    return {
        previewStage: "none",
        eligible: false,
        reason: lifeEvent === "incapacity"
            ? "An executor or recipient role does not establish incapacity authority."
            : "Missing-person support does not enter executor or recipient disclosure.",
        fieldPolicy: [],
        summaryOnly: false,
    };
}
function assignedMatters(role, matters, assignments) {
    if (role === "recipient") {
        const matterIds = new Set(assignments
            .map((assignment) => assignment.matter_item_id)
            .filter((value) => value !== null));
        return matters.filter((matter) => matterIds.has(matter.id));
    }
    if (assignments.some((assignment) => assignment.matter_item_id === null))
        return matters;
    const matterIds = new Set(assignments
        .map((assignment) => assignment.matter_item_id)
        .filter((value) => value !== null));
    return matters.filter((matter) => matterIds.has(matter.id));
}
function projectMatter(matter, fields) {
    const projected = {};
    if (fields.includes("matter.title"))
        projected.title = matter.title;
    if (fields.includes("matter.category"))
        projected.category = matter.category;
    if (fields.includes("matter.institutionName"))
        projected.institutionName = matter.institution_name;
    if (fields.includes("matter.locationHint"))
        projected.locationHint = matter.location_hint;
    if (fields.includes("matter.desiredOutcome"))
        projected.desiredOutcome = matter.desired_outcome;
    return projected;
}
async function appendAudit(client, action, resourcePublicId, metadata) {
    await client.query(`insert into app.audit_events (
       planner_id, actor_type, action, resource_type, resource_public_id, metadata
     ) values (
       app.current_planner_id(), 'planner', $1, 'disclosure_rehearsal', $2, $3::jsonb
     )`, [action, resourcePublicId, JSON.stringify(metadata)]);
}
