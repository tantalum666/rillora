import type { AppConfig } from "./config.js";
import { recentAuthenticationRequired } from "./recent-authentication.js";
import { accountBillingStatus } from "./account-billing.js";
import { createHash, randomUUID } from "node:crypto";
import { protectFields, protectMatterInput } from "./private-content.js";
import { Router } from "express";
import { z } from "zod";
import { requireCsrf } from "./auth.js";
import { withPlannerDatabase, withPlannerSnapshotDatabase, type DatabasePool } from "./db.js";
import { ApiError, asyncHandler } from "./errors.js";
import { desiredOutcomeSchema, matterCategorySchema, publicIdSchema, valueBandSchema, planMotivationSchema } from "./domain.js";
import { matterDetailsSchema, validateMatterRequirements } from "./matter-details.js";
import { getPlan, mapPlan, mapMatter, type MatterRow } from "./planner-records.js";

export const mapBackupMaxBytes = 2 * 1024 * 1024;

const nullableText = (max: number) => z.string().max(max).nullable().optional();
const backupMatter = z.object({
  publicId: publicIdSchema, category: matterCategorySchema, title: z.string().trim().min(1).max(120),
  institutionName: nullableText(160), locationHint: nullableText(500), accountHint: nullableText(160),
  valueBand: valueBandSchema.default("unknown"), currencyCode: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
  importance: z.enum(["standard", "important", "critical"]).default("important"),
  desiredOutcome: desiredOutcomeSchema.default("undecided"), status: z.enum(["draft", "ready", "needs_review", "archived"]),
  details: matterDetailsSchema.default({}), notes: nullableText(2000), archivedAt: nullableText(80),
}).superRefine((value, context) => validateMatterRequirements(value, context, true));
const backupPerson = z.object({ publicId: publicIdSchema, displayName: z.string().trim().min(1).max(120),
  relationshipLabel: nullableText(120), status: z.enum(["draft", "invited", "confirmed", "revoked", "archived"]), archivedAt: nullableText(80) });
const backupRole = z.object({ personPublicId: publicIdSchema, matterPublicId: publicIdSchema.nullable(),
  role: z.enum(["trusted_contact", "executor", "recipient"]), scope: z.enum(["plan_wide", "matter_specific"]), status: z.enum(["draft", "invited", "accepted", "revoked"]) });
export const mapBackupSchema = z.object({
  schemaVersion: z.literal("rillora-map-backup-v1"), createdAt: z.string().datetime(),
  owner: z.object({ displayName: z.string().max(120) }),
  plan: z.object({ motivation: planMotivationSchema.nullable().optional() }),
  matters: z.array(backupMatter).max(500), people: z.array(backupPerson).max(200),
  roles: z.array(backupRole).max(1000),
  officialChecks: z.array(z.object({ providerKey: z.enum(["apple","google","meta","github","password_manager"]), completed: z.boolean(), policyVersion: z.string().max(100), completedAt: z.string().datetime().nullable().optional() })).max(50),
  boundaries: z.object({ containsPrivateMap: z.literal(true), restoresAccess: z.literal(false), credentialsIncluded: z.literal(false) }),
}).superRefine((backup, context) => {
  for (const [field, values] of [["matters", backup.matters], ["people", backup.people]] as const) {
    if (new Set(values.map(item => item.publicId)).size !== values.length) context.addIssue({ code:"custom", path:[field], message:"Duplicate record identifiers." });
  }
  const people = new Set(backup.people.map(p => p.publicId)), matters = new Set(backup.matters.map(m => m.publicId));
  for (const role of backup.roles) {
    if (!people.has(role.personPublicId) || (role.matterPublicId && !matters.has(role.matterPublicId))
      || ((role.scope === "matter_specific") !== Boolean(role.matterPublicId)) || (role.role === "recipient" && role.scope !== "matter_specific")) {
      context.addIssue({code:"custom",path:["roles"],message:"A role refers to an unavailable person or matter."});
    }
  }
});

export function createAccountDataRouter(pool: DatabasePool, config: AppConfig) {
  const router = Router();
  router.get("/profile", asyncHandler(async (request, response) => {
    const account = await withPlannerDatabase(pool, request.auth.plannerId, async client => {
      const result = await client.query(`select public_id,display_name,locale,time_zone from app.planners where id=app.current_planner_id()`);
      return result.rows[0];
    });
    const billing = await withPlannerDatabase(pool, request.auth.plannerId, accountBillingStatus);
    response.json({ account: { publicId:account.public_id,displayName:account.display_name,locale:account.locale,timeZone:account.time_zone },
      session: { mode:request.auth.mode,authenticatedAt:request.auth.authenticatedAt??null },
      billing,
      mapBackup: { version:"rillora-map-backup-v1",maxMatters:500,importRequiresEmptyMap:true,restoresAccess:false } });
  }));

  router.post("/map/export", recentAuthenticationRequired(config), requireCsrf, asyncHandler(async (request,response) => {
    z.object({ acknowledgesPrivateCopy:z.literal(true) }).strict().parse(request.body);
    const backup = await withPlannerSnapshotDatabase(pool, request.auth.plannerId, async client => {
      const planner = (await client.query(`select public_id,display_name,locale,time_zone from app.planners where id=app.current_planner_id()`)).rows[0];
      const plan = await getPlan(client);
      const matters = (await client.query<MatterRow>(`select * from app.matter_items where planner_id=app.current_planner_id() order by id limit 501`)).rows;
      const people = (await client.query(`select public_id,display_name,relationship_label,status,archived_at from app.people where planner_id=app.current_planner_id() order by id limit 201`)).rows;
      if (matters.length>500 || people.length>200) throw new ApiError(413,"backup_size_limit","This map exceeds the current single-file backup limit.");
      const roles = (await client.query(`select p.public_id as person_public_id,m.public_id as matter_public_id,ra.role,case when ra.matter_item_id is null then 'plan_wide' else 'matter_specific' end as scope,ra.status
        from app.role_assignments ra join app.people p on p.id=ra.person_id and p.planner_id=ra.planner_id
        left join app.matter_items m on m.id=ra.matter_item_id and m.planner_id=ra.planner_id
        where ra.planner_id=app.current_planner_id() order by ra.id`)).rows;
      const checks = (await client.query(`select provider_key,completed,policy_version,completed_at from app.official_setup_checks where planner_id=app.current_planner_id() order by provider_key`)).rows;
      if (roles.length>1000 || checks.length>50) throw new ApiError(413,"backup_size_limit","This map exceeds the current single-file backup limit.");
      return { schemaVersion:"rillora-map-backup-v1",createdAt:new Date().toISOString(),
        owner:{ publicId:planner.public_id,displayName:planner.display_name,locale:planner.locale,timeZone:planner.time_zone },
        plan:mapPlan(plan),matters:matters.map(mapMatter),
        people:people.map(p=>({publicId:p.public_id,displayName:p.display_name,relationshipLabel:p.relationship_label,status:p.status,archivedAt:p.archived_at})),
        roles:roles.map(r=>({personPublicId:r.person_public_id,matterPublicId:r.matter_public_id,role:r.role,scope:r.scope,status:r.status})),
        officialChecks:checks.map(c=>({providerKey:c.provider_key,completed:c.completed,policyVersion:c.policy_version,completedAt:c.completed_at})),
        boundaries:{containsPrivateMap:true,restoresAccess:false,credentialsIncluded:false},
        excluded:["Authentication credentials","Active invitations and access grants","Billing and security records","Copies held by other people"] };
    });
    const serialized = JSON.stringify(backup);
    const document = JSON.parse(serialized);
    mapBackupSchema.parse(document);
    if (Buffer.byteLength(serialized, "utf8") > mapBackupMaxBytes) throw new ApiError(413,"backup_size_limit","This map exceeds the current 2 MB single-file backup limit. No records were omitted.");
    response.setHeader("x-rillora-server-copy-retained","false");
    response.json(document);
  }));

  router.post("/map/import", recentAuthenticationRequired(config), requireCsrf, asyncHandler(async(request,response)=>{
    const input=z.object({backup:mapBackupSchema,acknowledgesPrivateImport:z.literal(true)}).strict().parse(request.body);
    if (Buffer.byteLength(JSON.stringify(request.body.backup), "utf8") > mapBackupMaxBytes) {
      throw new ApiError(413,"backup_size_limit","This backup exceeds the current 2 MB single-file limit.");
    }
    const backup=input.backup;
    const hash=createHash("sha256").update(JSON.stringify(backup)).digest();
    const result=await withPlannerDatabase(pool,request.auth.plannerId,async client=>{
      await client.query("select pg_advisory_xact_lock(hashtextextended('sharing:'||app.current_planner_id()::text,0))");
      const plan=(await client.query(`select id from app.plans where planner_id=app.current_planner_id() for update`)).rows[0];
      const prior=(await client.query(`select matter_count,person_count from app.map_import_receipts where planner_id=app.current_planner_id() and source_sha256=$1`,[hash])).rows[0];
      if(prior)return {matterCount:prior.matter_count,personCount:prior.person_count,alreadyImported:true};
      const occupied=(await client.query(`select exists(select 1 from app.matter_items where planner_id=app.current_planner_id()) or exists(select 1 from app.people where planner_id=app.current_planner_id()) as occupied`)).rows[0].occupied;
      if(occupied)throw new ApiError(409,"map_not_empty","Import needs an empty map. Existing records will not be replaced.");
      const matters=new Map<string,string>(),people=new Map<string,string>();
      for(const m of backup.matters){
        const publicId=randomUUID();const stored=await protectMatterInput(client,publicId,m);
        const row=(await client.query(`insert into app.matter_items(public_id,planner_id,plan_id,category,title,institution_name,account_hint,value_band,currency_code,location_hint,importance,desired_outcome,status,details,notes,archived_at)
          values($15::uuid,app.current_planner_id(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14) returning id::text`,
          [plan.id,m.category,stored.title,stored.institutionName||null,stored.accountHint||null,stored.valueBand,stored.currencyCode||null,stored.locationHint||null,m.importance,m.desiredOutcome,m.archivedAt||m.status==="archived"?"archived":"draft",JSON.stringify(stored.details),stored.notes||null,m.archivedAt||m.status==="archived"?new Date():null,publicId])).rows[0];
        matters.set(m.publicId,row.id);
      }
      for(const p of backup.people){
        const inactive=["revoked","archived"].includes(p.status);
        const publicId=randomUUID();const stored=await protectFields(client,{kind:"person",publicId},{display_name:p.displayName,relationship_label:p.relationshipLabel||null});
        const row=(await client.query(`insert into app.people(public_id,planner_id,display_name,relationship_label,status,archived_at) values($5::uuid,app.current_planner_id(),$1,$2,$3,$4) returning id::text`,[stored.display_name,stored.relationship_label,inactive?p.status:"draft",p.archivedAt?new Date():null,publicId])).rows[0];people.set(p.publicId,row.id);
      }
      for(const role of backup.roles){
        await client.query(`insert into app.role_assignments(planner_id,plan_id,person_id,matter_item_id,role,status) values(app.current_planner_id(),$1,$2,$3,$4,$5) on conflict do nothing`,
          [plan.id,people.get(role.personPublicId),role.matterPublicId?matters.get(role.matterPublicId):null,role.role,role.status==="revoked"?"revoked":"draft"]);
      }
      for(const [_,personId] of people){
        await client.query(`insert into app.role_assignments(planner_id,plan_id,person_id,role,status) select app.current_planner_id(),$1,$2,'trusted_contact','draft' where not exists(select 1 from app.role_assignments where planner_id=app.current_planner_id() and person_id=$2 and role='trusted_contact')`,[plan.id,personId]);
      }
      for(const check of backup.officialChecks){
        await client.query(`insert into app.official_setup_checks(planner_id,plan_id,provider_key,policy_version,completed,completed_at) values(app.current_planner_id(),$1,$2,$3,$4,$5)
          on conflict(plan_id,provider_key) do update set completed=excluded.completed,completed_at=excluded.completed_at,policy_version=excluded.policy_version,version=app.official_setup_checks.version+1,updated_at=now()
          where app.official_setup_checks.version=1 and app.official_setup_checks.completed=false and app.official_setup_checks.completed_at is null`,[plan.id,check.providerKey,check.policyVersion,check.completed,check.completed?check.completedAt??null:null]);
      }
      await client.query(`update app.plans set motivation=coalesce(motivation,$1),first_use_state=$2,first_use_step=$3,version=version+1,updated_at=now() where planner_id=app.current_planner_id()`,[backup.plan.motivation??null,backup.matters.length?"completed":"available",backup.matters.length?2:0]);
      await client.query(`insert into app.map_import_receipts(planner_id,source_sha256,matter_count,person_count) values(app.current_planner_id(),$1,$2,$3)`,[hash,backup.matters.length,backup.people.length]);
      return {matterCount:backup.matters.length,personCount:backup.people.length,alreadyImported:false};
    });
    response.status(result.alreadyImported?200:201).json({...result,sharingRestored:false});
  }));

  router.get("/archived-matters",asyncHandler(async(request,response)=>{
    const matters=await withPlannerDatabase(pool,request.auth.plannerId,async client=>(await client.query<MatterRow>(`select * from app.matter_items where planner_id=app.current_planner_id() and archived_at is not null order by id limit 501`)).rows);
    if(matters.length>500)throw new ApiError(413,"archive_size_limit","There are too many archived records for one request.");
    response.json({matters:matters.map(mapMatter)});
  }));
  router.post("/archived-matters/:publicId/restore",requireCsrf,asyncHandler(async(request,response)=>{
    const id=publicIdSchema.parse(request.params.publicId),input=z.object({expectedVersion:z.number().int().positive()}).strict().parse(request.body);
    const matter=await withPlannerDatabase(pool,request.auth.plannerId,async client=>{
      const result=await client.query<MatterRow>(`update app.matter_items set status='draft',archived_at=null,version=version+1,updated_at=now() where planner_id=app.current_planner_id() and public_id=$1 and version=$2 and archived_at is not null returning *`,[id,input.expectedVersion]);
      if(!result.rows[0])throw new ApiError(409,"version_conflict","This archive changed. Refresh and try again.");
      await client.query(`with removed as (delete from app.sharing_grants where planner_id=app.current_planner_id() and matter_item_id=(select id from app.matter_items where public_id=$1 and planner_id=app.current_planner_id()) returning connection_id)
        update app.sharing_connections set version=version+1,updated_at=now() where planner_id=app.current_planner_id() and id in(select connection_id from removed)`,[id]);
      return mapMatter(result.rows[0]);
    });response.json({matter,sharingRestored:false});
  }));
  return router;
}
