import { requireRecentAuthentication } from "./recent-authentication.js";
import { createMatterSchema } from "./domain.js";
import { mapMatterInput } from "./planner-records.js";
import { createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { requireCsrf } from "./auth.js";
import { withPlannerDatabase } from "./db.js";
import { ApiError, asyncHandler } from "./errors.js";
import { invalidateDisclosureRehearsals } from "./disclosure-policy.js";
import { protectFields } from "./private-content.js";
const uuid = z.uuid().transform((id) => id.toLowerCase());
const version = z.number().int().positive();
const pair = z.object({ connectionPublicId: uuid, matterPublicId: uuid }).strict();
const startSchema = z.object({ requestKey: uuid, dueAt: z.iso.datetime({ offset: true }),
    items: z.array(pair).min(1).max(100).refine((items) => new Set(items.map((p) => `${p.connectionPublicId}:${p.matterPublicId}`)).size === items.length),
}).strict();
const proposalSchema = z.object({ institutionName: z.string().trim().min(1).max(160).optional(),
    locationHint: z.string().trim().min(1).max(500).optional() }).strict().refine((v) => Object.keys(v).length > 0);
const responseSchema = z.object({ expectedVersion: version,
    response: z.enum(["confirmed", "needs_update", "suggested"]),
    reason: z.enum(["cannot_find", "outdated", "unclear"]).optional(), proposal: proposalSchema.optional(),
}).strict().refine((v) => v.response === "suggested" ? Boolean(v.proposal) && !v.reason
    : v.response === "needs_update" ? Boolean(v.reason) && !v.proposal : !v.reason && !v.proposal);
const taskQuery = `select t.*, t.id::text, m.public_id as matter_public_id, m.version as current_version,
  m.institution_name, m.location_hint, m.archived_at, m.desired_outcome,
  c.status as connection_status, person.status as person_status,
  g.id as current_grant_id, g.detail_level, r.state as round_state,
  s.collaborator_connection_id
  from app.family_review_tasks t
  join app.family_review_rounds r on r.id=t.round_id and r.planner_id=t.planner_id
  join app.sharing_connections c on c.id=t.connection_id and c.planner_id=t.planner_id
  join app.people person on person.id=c.person_id and person.planner_id=c.planner_id
  join app.matter_items m on m.id=t.matter_item_id and m.planner_id=t.planner_id
  left join app.sharing_grants g on g.id=t.grant_id and g.connection_id=c.id and g.matter_item_id=m.id
  left join app.family_review_settings s on s.planner_id=t.planner_id
  where t.planner_id=app.current_planner_id() and t.public_id=$1`;
async function enabled(client, preview) {
    const row = await client.query("select app.family_maintenance_enabled(app.current_planner_id(),$1) as enabled", [preview]);
    return row.rows[0].enabled;
}
async function requireEnabled(client, preview) {
    if (!await enabled(client, preview))
        throw new ApiError(403, "maintenance_unavailable", "Shared reviews are not available for this plan right now. Your saved information is still available.");
}
async function event(client, action, publicId, metadata = {}) {
    await client.query(`insert into app.audit_events(planner_id,actor_type,action,resource_type,resource_public_id,metadata)
    values(app.current_planner_id(),'planner',$1,'family_review',$2,$3::jsonb)`, [action, publicId, JSON.stringify(metadata)]);
}
function changed(message = "This review changed. Reload before continuing.") {
    throw new ApiError(409, "review_changed", message);
}
async function protectDirections(client, publicId, fields, proposal = false) {
    const values = await protectFields(client, { kind: proposal ? "review_proposal" : "matter", publicId }, {
        ...(Object.hasOwn(fields, "institutionName") ? { institution_name: fields.institutionName } : {}),
        ...(Object.hasOwn(fields, "locationHint") ? { location_hint: fields.locationHint } : {}),
    });
    return { ...(Object.hasOwn(fields, "institutionName") ? { institutionName: values.institution_name } : {}),
        ...(Object.hasOwn(fields, "locationHint") ? { locationHint: values.location_hint } : {}) };
}
export function createFamilyMaintenanceRouter(pool, config) {
    const router = Router();
    const preview = config.allowFamilyMaintenancePreview === true;
    router.get("/overview", asyncHandler(async (request, response) => {
        const data = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            const active = await enabled(client, preview);
            const settings = (await client.query(`select s.version,s.cadence_days as "cadenceDays",s.next_review_at as "nextReviewAt",
        c.public_id as "collaboratorConnectionPublicId" from app.family_review_settings s
        left join app.sharing_connections c on c.id=s.collaborator_connection_id and c.status='accepted'
        where s.planner_id=app.current_planner_id()`)).rows[0] ?? { version: 0, cadenceDays: 90, nextReviewAt: null, collaboratorConnectionPublicId: null };
            const eligible = (await client.query(`select c.public_id as "connectionPublicId",person.display_name as "personName",
        m.public_id as "matterPublicId",m.title,m.version,
        (coalesce(m.location_hint,'')='') as "missingLocation"
        from app.sharing_connections c join app.people person on person.id=c.person_id and person.planner_id=c.planner_id
        join app.sharing_grants g on g.connection_id=c.id and g.planner_id=c.planner_id
        join app.matter_items m on m.id=g.matter_item_id and m.planner_id=c.planner_id
        where c.planner_id=app.current_planner_id() and c.status='accepted' and app.sharing_connection_access(c.public_id)->>'mode'='live'
        and person.status not in ('revoked','archived') and g.detail_level in ('directions','details')
        and m.archived_at is null and m.desired_outcome<>'never_disclose' order by c.id,m.id limit 100`)).rows;
            const rounds = (await client.query(`select r.public_id as "publicId",r.state,r.version,r.due_at as "dueAt",r.created_at as "createdAt",
        r.completed_at as "completedAt",coalesce((select jsonb_agg(app.family_review_task(t.id,$1) order by t.id)
        from app.family_review_tasks t where t.round_id=r.id and t.planner_id=r.planner_id),'[]'::jsonb) as tasks
        from app.family_review_rounds r where r.planner_id=app.current_planner_id() order by r.created_at desc limit 20`, [preview])).rows;
            const incoming = (await client.query("select app.family_review_incoming($1) as items", [preview])).rows[0].items;
            const history = (await client.query(`select h.public_id as "publicId",m.public_id as "matterPublicId",m.title,
        coalesce(person.display_name,'Former collaborator') as "suggestedBy",h.source_version as "sourceVersion",h.saved_version as "savedVersion",
        h.before_fields as "beforeFields",h.after_fields as "afterFields",h.created_at as "createdAt"
        from app.family_review_changes h join app.matter_items m on m.id=h.matter_item_id and m.planner_id=h.planner_id
        left join app.family_review_tasks t on t.id=h.task_id and t.planner_id=h.planner_id
        left join app.sharing_connections c on c.id=t.connection_id and c.planner_id=h.planner_id
        left join app.people person on person.id=c.person_id and person.planner_id=h.planner_id
        where h.planner_id=app.current_planner_id() order by h.id desc limit 100`)).rows;
            eligible.sort((a, b) => a.personName.localeCompare(b.personName) || a.title.localeCompare(b.title));
            const webOrigin = config.oidc?.webAppOrigin ?? [...config.corsOrigins][0];
            return { contractVersion: "family-maintenance-v1", shareUrl: webOrigin ? new URL("/account?next=reviews", webOrigin).href : null,
                access: { mode: active ? preview ? "preview" : "family" : "unavailable", canCreate: active },
                settings, eligible, rounds, incoming, history, serverTime: new Date().toISOString(),
                boundaries: { ownerApprovalRequired: true, recipientScopeEnforced: true, externalNotificationsSent: false, billingActivated: false } };
        });
        response.json(data);
    }));
    router.patch("/settings", requireCsrf, asyncHandler(async (request, response) => {
        const input = z.object({ expectedVersion: z.number().int().min(0), cadenceDays: z.union([z.literal(0), z.literal(30), z.literal(90), z.literal(180), z.literal(365)]),
            collaboratorConnectionPublicId: uuid.nullable(), nextReviewAt: z.iso.datetime({ offset: true }).nullable() }).strict().parse(request.body);
        await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            await client.query("select pg_advisory_xact_lock(hashtextextended('family-maintenance:'||app.current_planner_id()::text,0))");
            if (input.cadenceDays > 0 || input.collaboratorConnectionPublicId)
                await requireEnabled(client, preview);
            let collaborator = null;
            if (input.collaboratorConnectionPublicId) {
                collaborator = (await client.query(`select id from app.sharing_connections where public_id=$1 and planner_id=app.current_planner_id()
          and status='accepted'`, [input.collaboratorConnectionPublicId])).rows[0]?.id;
                if (!collaborator)
                    throw new ApiError(400, "collaborator_unavailable", "Choose a connected person first.");
            }
            const current = (await client.query("select version,collaborator_connection_id from app.family_review_settings where planner_id=app.current_planner_id() for update")).rows[0];
            if ((current?.version ?? 0) !== input.expectedVersion)
                changed();
            if (collaborator && String(collaborator) !== String(current?.collaborator_connection_id))
                requireRecentAuthentication(config, request.auth);
            await client.query(`insert into app.family_review_settings(planner_id,collaborator_connection_id,cadence_days,next_review_at)
        values(app.current_planner_id(),$1,$2,$3) on conflict (planner_id) do update
        set collaborator_connection_id=$1,cadence_days=$2,next_review_at=$3,version=app.family_review_settings.version+1`, [collaborator, input.cadenceDays, input.cadenceDays === 0 ? null : input.nextReviewAt ?? new Date(Date.now() + input.cadenceDays * 86_400_000).toISOString()]);
        });
        response.json({ saved: true });
    }));
    router.post("/rounds", requireCsrf, asyncHandler(async (request, response) => {
        const input = startSchema.parse(request.body);
        const due = new Date(input.dueAt).getTime();
        if (due < Date.now() - 60_000 || due > Date.now() + 366 * 86_400_000)
            throw new ApiError(400, "invalid_due_date", "Choose a review date within the next year.");
        const digest = createHash("sha256").update(JSON.stringify({ dueAt: input.dueAt,
            items: [...input.items].sort((a, b) => `${a.connectionPublicId}:${a.matterPublicId}`.localeCompare(`${b.connectionPublicId}:${b.matterPublicId}`)) })).digest("hex");
        const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:'||app.current_planner_id()::text,0))");
            await client.query("select pg_advisory_xact_lock(hashtextextended('family-maintenance:'||app.current_planner_id()::text,0))");
            await requireEnabled(client, preview);
            const old = (await client.query("select public_id,request_digest from app.family_review_rounds where planner_id=app.current_planner_id() and request_key=$1", [input.requestKey])).rows[0];
            if (old) {
                if (old.request_digest !== digest)
                    changed();
                return { publicId: old.public_id };
            }
            if ((await client.query("select id from app.family_review_rounds where planner_id=app.current_planner_id() and state='open'")).rowCount)
                changed("Finish or cancel the current review before starting another.");
            const round = (await client.query(`insert into app.family_review_rounds(planner_id,request_key,request_digest,due_at)
        values(app.current_planner_id(),$1,$2,$3) returning id,public_id`, [input.requestKey, digest, input.dueAt])).rows[0];
            for (const item of input.items) {
                const added = await client.query(`insert into app.family_review_tasks(planner_id,round_id,connection_id,matter_item_id,grant_id,source_version,source_fields)
          select app.current_planner_id(),$1,c.id,m.id,g.id,m.version,jsonb_build_object('institutionName',coalesce(m.institution_name,''),'locationHint',coalesce(m.location_hint,''))
          from app.sharing_connections c join app.people person on person.id=c.person_id and person.planner_id=c.planner_id
          join app.sharing_grants g on g.connection_id=c.id and g.planner_id=c.planner_id
          join app.matter_items m on m.id=g.matter_item_id and m.planner_id=c.planner_id
          where c.planner_id=app.current_planner_id() and c.public_id=$2 and m.public_id=$3
          and c.status='accepted' and app.sharing_connection_access(c.public_id)->>'mode'='live' and person.status not in ('revoked','archived')
          and g.detail_level in ('directions','details') and m.archived_at is null and m.desired_outcome<>'never_disclose'`, [round.id, item.connectionPublicId, item.matterPublicId]);
                if (!added.rowCount)
                    throw new ApiError(400, "review_scope_unavailable", "A selected direction is no longer shared. Review the selection.");
            }
            await event(client, "family_review.created", round.public_id, { taskCount: input.items.length, externalNotificationsSent: false });
            return { publicId: round.public_id };
        });
        response.status(201).json(result);
    }));
    router.post("/tasks/:id/respond", requireCsrf, asyncHandler(async (request, response) => {
        const id = uuid.parse(request.params.id);
        const input = responseSchema.parse(request.body);
        const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            const proposal = input.proposal ? await protectDirections(client, id, input.proposal, true) : null;
            const result = (await client.query("select app.respond_family_review($1,$2,$3,$4,$5,$6) as result", [id, input.expectedVersion, input.response, input.reason ?? null, proposal, preview])).rows[0].result;
            if (result?.error) {
                const code = result.error;
                throw new ApiError(code === 'review_changed' ? 409 : 403, code, code === 'review_changed' ? "This direction or review changed. Ask for a fresh check." : "This review action is no longer available to this account.");
            }
            return result;
        });
        response.json({ task: result });
    }));
    router.post("/tasks/:id/decide", requireCsrf, asyncHandler(async (request, response) => {
        const id = uuid.parse(request.params.id);
        const input = z.object({ expectedVersion: version, action: z.enum(['apply', 'dismiss', 'reopen']) }).strict().parse(request.body);
        const result = await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:'||app.current_planner_id()::text,0))");
            if (input.action !== 'dismiss')
                await requireEnabled(client, preview);
            const lock = (await client.query("select connection_id,round_id from app.family_review_tasks where public_id=$1 and planner_id=app.current_planner_id()", [id])).rows[0];
            if (!lock)
                throw new ApiError(404, "review_unavailable", "This review is not available.");
            await client.query("select id from app.family_review_rounds where id=$1 and planner_id=app.current_planner_id() for update", [lock.round_id]);
            await client.query("select id from app.sharing_connections where id=$1 and planner_id=app.current_planner_id() for update", [lock.connection_id]);
            const t = (await client.query(taskQuery + " for update of t,m", [id])).rows[0];
            if (!t || t.version !== input.expectedVersion || t.round_state !== 'open')
                changed();
            if (input.action === 'dismiss') {
                if (!['suggested', 'needs_update'].includes(t.state))
                    changed();
                await client.query("update app.family_review_tasks set state='dismissed',decided_at=now(),version=version+1 where id=$1", [t.id]);
            }
            else if (input.action === 'reopen') {
                const g = (await client.query(`select id from app.sharing_grants where connection_id=$1 and matter_item_id=$2
          and planner_id=app.current_planner_id() and detail_level in ('directions','details')`, [t.connection_id, t.matter_item_id])).rows[0];
                if (!g || t.connection_status !== 'accepted' || ['revoked', 'archived'].includes(t.person_status) || t.archived_at || t.desired_outcome === 'never_disclose')
                    changed("This matter is no longer shared. Update sharing first.");
                const stored = await protectDirections(client, t.matter_public_id, { institutionName: t.institution_name ?? '', locationHint: t.location_hint ?? '' });
                await client.query(`update app.family_review_tasks set state='waiting',source_version=$2,grant_id=$3,
          source_fields=$4,access_revoked_at=null,reason=null,proposal=null,responded_at=null,decided_at=null,version=version+1 where id=$1`, [t.id, t.current_version, g.id, stored]);
            }
            else {
                if (t.state === 'applied')
                    return { task: (await client.query("select app.family_review_task($1,$2) as task", [t.id, preview])).rows[0].task };
                if (t.access_revoked_at || t.state !== 'suggested' || t.current_version !== t.source_version || t.connection_status !== 'accepted'
                    || ['revoked', 'archived'].includes(t.person_status) || !t.current_grant_id || !['directions', 'details'].includes(t.detail_level)
                    || t.archived_at || t.desired_outcome === 'never_disclose' || t.collaborator_connection_id !== t.connection_id)
                    changed("The matter, sharing or collaborator changed. Request a fresh check.");
                const proposed = proposalSchema.parse(t.proposal);
                const before = { institutionName: t.institution_name ?? '', locationHint: t.location_hint ?? '' };
                const after = { ...before, ...proposed };
                const source = (await client.query("select * from app.matter_items where id=$1 and planner_id=app.current_planner_id()", [t.matter_item_id])).rows[0];
                createMatterSchema.parse({ ...mapMatterInput(source), ...after,
                    institutionName: after.institutionName || null, locationHint: after.locationHint || null });
                const protectedBefore = await protectDirections(client, t.matter_public_id, before);
                const protectedAfter = await protectDirections(client, t.matter_public_id, after);
                const saved = (await client.query(`update app.matter_items set institution_name=$2,location_hint=$3,version=version+1,updated_at=now()
          where id=$1 and planner_id=app.current_planner_id() and version=$4 returning version`, [t.matter_item_id, protectedAfter.institutionName, protectedAfter.locationHint, t.source_version])).rows[0];
                if (!saved)
                    changed();
                await client.query(`insert into app.family_review_changes(planner_id,task_id,matter_item_id,source_version,saved_version,before_fields,after_fields)
          values(app.current_planner_id(),$1,$2,$3,$4,$5,$6)`, [t.id, t.matter_item_id, t.source_version, saved.version, protectedBefore, protectedAfter]);
                await client.query("update app.family_review_tasks set state='applied',source_version=$2,source_fields=$3,proposal=null,decided_at=now(),version=version+1 where id=$1", [t.id, saved.version, protectedAfter]);
                await invalidateDisclosureRehearsals(client);
            }
            await event(client, `family_review.${input.action}`, id);
            return { task: (await client.query("select app.family_review_task($1,$2) as task", [t.id, preview])).rows[0].task };
        });
        response.json(result);
    }));
    router.post("/rounds/:id/close", requireCsrf, asyncHandler(async (request, response) => {
        const id = uuid.parse(request.params.id);
        const input = z.object({ expectedVersion: version, action: z.enum(['complete', 'cancel']) }).strict().parse(request.body);
        await withPlannerDatabase(pool, request.auth.plannerId, async (client) => {
            await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:'||app.current_planner_id()::text,0))");
            if (input.action === 'complete')
                await requireEnabled(client, preview);
            const round = (await client.query("select id,version,state from app.family_review_rounds where public_id=$1 and planner_id=app.current_planner_id() for update", [id])).rows[0];
            if (!round || round.version !== input.expectedVersion || round.state !== 'open')
                changed();
            if (input.action === 'complete') {
                const tasks = (await client.query("select app.family_review_task(id,$2) as task from app.family_review_tasks where round_id=$1 and planner_id=app.current_planner_id()", [round.id, preview])).rows;
                if (!tasks.length)
                    changed("No connected checks remain. Cancel this review and start a new one.");
                if (tasks.some(({ task }) => !task || !task.scopeAvailable || task.isStale || !['confirmed', 'applied', 'dismissed'].includes(task.state)))
                    changed("Resolve each item or request a fresh check before finishing.");
            }
            await client.query("update app.family_review_rounds set state=$2,completed_at=now(),version=version+1 where id=$1", [round.id, input.action === 'complete' ? 'completed' : 'cancelled']);
            if (input.action === 'complete')
                await client.query(`insert into app.family_review_settings(planner_id,next_review_at) values(app.current_planner_id(),now()+interval '90 days')
        on conflict(planner_id) do update set next_review_at=case when app.family_review_settings.cadence_days=0 then null
        else now()+make_interval(days=>app.family_review_settings.cadence_days) end,version=app.family_review_settings.version+1`);
            await event(client, `family_review.${input.action}`, id);
        });
        response.json({ saved: true });
    }));
    return router;
}
