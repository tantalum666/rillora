import { randomUUID } from "node:crypto";
import { afterAll,beforeAll,describe,it,expect } from "vitest";
import request from "./http-fixture.js";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool,withPlannerDatabase,sweepContentOrphans,type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { migratePrivateContent,inspectPrivateContent,enforcePrivateContent } from "../src/migrate-private-content.js";
import { TestContentKeys } from "./content-test-keys.js";

const databaseUrl='postgresql:///continuity_content_migration_test';
const A='a1111111-1111-4111-8111-111111111111',B='b2222222-2222-4222-8222-222222222222';
const env={NODE_ENV:'test',DATABASE_URL:databaseUrl,ALLOW_DEV_AUTH:'true',ALLOW_FAMILY_MAINTENANCE_PREVIEW:'true',CORS_ORIGINS:'http://localhost:4261'};
const base=loadConfig(env),config=loadConfig({...env,CONTENT_PROTECTION_MODE:'encrypted',CONTENT_KEY_NAMESPACE:'content-migration-test',CONTENT_KMS_KEY_ARN:'arn:aws:kms:eu-central-1:000000000000:key/11111111-1111-4111-8111-111111111111'});
const service=new TestContentKeys();const owner={'x-dev-planner-id':A},recipient={'x-dev-planner-id':B};
let plainPool:DatabasePool,pool:DatabasePool,app:ReturnType<typeof createApp>,ownerId:string,matter:string,connection:string,entitlement:string,preview:any,before:any;
const content={category:'account',title:'Historical sentinel title',institutionName:'Historical sentinel provider',locationHint:'Historical sentinel location',notes:'Historical sentinel notes',details:{}};
describe.sequential('Existing-data migration and paid ciphertext snapshots',()=>{
 beforeAll(async()=>{
  if(databaseUrl!=='postgresql:///continuity_content_migration_test')throw Error('Dedicated local database only');
  await runMigrations(databaseUrl);plainPool=createPool(base);pool=createPool(config,service);
  await plainPool.query('truncate app.planners restart identity cascade');
  await plainPool.query('update app.private_content_policy set require_encrypted_writes=false');
  await plainPool.query('update app.commerce_runtime_policy set sharing_limits_enabled=true');
  for(const id of [A,B]){
   const row=(await plainPool.query("insert into app.planners(public_id,display_name) values($1,'Fixture identity metadata') returning id::text",[id])).rows[0];
   if(id===A)ownerId=row.id;
   await plainPool.query('insert into app.plans(planner_id) values($1)',[row.id]);
  }
  const account=(await plainPool.query("insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code) select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id",[ownerId!])).rows[0].id;
  entitlement=(await plainPool.query("insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at) values($1,$2,'trusted_people_multiple','manual_override','content-migration-test',5,now()-interval '1 day',now()+interval '1 day') returning id",[ownerId!,account])).rows[0].id;
  await plainPool.query("insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,effective_at,expires_at) values($1,$2,'family_maintenance','manual_override','content-migration-test',now()-interval '1 day',now()+interval '1 day')",[ownerId!,account]);
  const oldApp=createApp(plainPool,base);
  matter=(await request(oldApp).post('/v1/matters').set(owner).send(content).expect(201)).body.matter.publicId;
  const person=(await request(oldApp).post('/v1/trusted-contacts').set(owner).send({displayName:'Historical sentinel contact'}).expect(201)).body.trustedContact.publicId;
  const invite=(await request(oldApp).post('/v1/sharing/connections').set(owner).send({personPublicId:person,email:`${B}@example.test`,grants:[{matterPublicId:matter,detailLevel:'details'}]}).expect(201)).body;
  connection=invite.connection.publicId;
  await request(oldApp).post('/v1/sharing/invitations/accept').set(recipient).send({invitationToken:new URLSearchParams(new URL(invite.invitationUrl).hash.slice(1)).get('invitation'),accepted:true}).expect(200);
  await request(oldApp).patch('/v1/maintenance/settings').set(owner).send({expectedVersion:0,cadenceDays:90,collaboratorConnectionPublicId:connection,nextReviewAt:null}).expect(200);
  await request(oldApp).post('/v1/maintenance/rounds').set(owner).send({requestKey:randomUUID(),dueAt:new Date(Date.now()+86400000).toISOString(),items:[{connectionPublicId:connection,matterPublicId:matter}]}).expect(201);
  const task=(await request(oldApp).get('/v1/maintenance/overview').set(recipient).expect(200)).body.incoming[0];
  const proposed=(await request(oldApp).post(`/v1/maintenance/tasks/${task.publicId}/respond`).set(recipient).send({expectedVersion:task.version,response:'suggested',proposal:{locationHint:'Historical sentinel approved location'}}).expect(200)).body.task;
  await request(oldApp).post(`/v1/maintenance/tasks/${task.publicId}/decide`).set(owner).send({expectedVersion:proposed.version,action:'apply'}).expect(200);
  await request(oldApp).post('/v1/disclosure-rehearsals').set(owner).send({lifeEvent:'death'}).expect(201);
  preview=(await request(oldApp).post('/v1/exports/start-here/preview').set(owner).send({}).expect(201)).body;
  before=(await request(oldApp).post('/v1/account/map/export').set(owner).send({acknowledgesPrivateCopy:true}).expect(200)).body;
  app=createApp(pool,config);
 });
 afterAll(async()=>{await pool?.end();await plainPool?.end();});

 it('migrates every current/copy path without changing logical content or timestamps',async()=>{
  expect((await inspectPrivateContent(pool)).plaintextValues).toBeGreaterThan(0);
  const saved=(await pool.query('select saved_at,cutoff_at from app.sharing_saved_items')).rows;
  service.fail=true;
  try{await expect(migratePrivateContent(pool)).rejects.toThrow();}finally{service.fail=false;}
  expect((await pool.query('select title from app.matter_items where public_id=$1',[matter])).rows[0].title).toBe(content.title);
  expect((await pool.query('select count(*)::int n from app.private_content_values')).rows[0].n).toBe(0);
  const result=await migratePrivateContent(pool);
  expect(result.verifiedOwners).toBe(2);expect(result.changedRows).toBeGreaterThan(4);
  expect(await inspectPrivateContent(pool)).toMatchObject({plaintextValues:0,invalidReferences:0});
  expect((await pool.query('select saved_at,cutoff_at from app.sharing_saved_items')).rows).toEqual(saved);
  const after=(await request(app).post('/v1/account/map/export').set(owner).send({acknowledgesPrivateCopy:true}).expect(200)).body;
  expect(after.matters).toEqual(before.matters);expect(after.people).toEqual(before.people);expect(after.plan).toEqual(before.plan);
  const printed=await request(app).post('/v1/exports/start-here/printable').set(owner).send({previewPublicId:preview.export.publicId,acknowledgesPlaintext:true,acknowledgesNoRevocation:true}).expect(201);
  expect(printed.text).toContain(content.title);
 });

 it('is idempotent, enforces protected writes and does not grant app migration authority',async()=>{
  expect((await migratePrivateContent(pool)).changedRows).toBe(0);
  expect(await enforcePrivateContent(pool)).toMatchObject({enforced:true,plaintextValues:0});
  expect((await pool.query("select pg_has_role('continuity_app','continuity_content_service','MEMBER') as member")).rows[0].member).toBe(false);
 });

 it('preserves saved paid-period contents and denies known post-cutoff references',async()=>{
  await pool.query('update app.commerce_entitlement_grants set expires_at=clock_timestamp() where id=$1',[entitlement]);
  const current=(await request(app).get(`/v1/matters/${matter}`).set(owner).expect(200)).body.matter;
  await request(app).patch(`/v1/matters/${matter}`).set(owner).send({expectedVersion:current.version,notes:'NEW POST-CUTOFF SECRET'}).expect(200);
  const shared=(await request(app).get('/v1/sharing/shared-with-me').set(recipient).expect(200)).body.items[0];
  expect(shared.accessMode).toBe('saved');expect(shared.fields.notes).toBe(content.notes);
  const latest=(await pool.query('select notes from app.matter_items where public_id=$1',[matter])).rows[0].notes.slice(5);
  const recipientId=(await pool.query('select id::text from app.planners where public_id=$1',[B])).rows[0].id;
  const rejected=await withPlannerDatabase(pool,recipientId,async client=>(await client.query('select app.content_read_values($1,true) as data',[[latest]])).rows[0].data);
  expect(rejected.values).toEqual([]);
 });

 it('sweeps only unreferenced values and preserves legitimate old paid copies',async()=>{
  await pool.query("update app.private_content_values set created_at=now()-interval '1 hour'");
  const orphan=randomUUID(),key=(await pool.query('select public_id from app.private_content_keys where planner_id=$1',[ownerId])).rows[0].public_id;
  await pool.query("insert into app.private_content_values(public_id,planner_id,key_id,source_kind,source_public_id,field_name,nonce,ciphertext,auth_tag,created_at) values($1,$2,$3,'matter',$4,'notes',$5,$6,$7,now()-interval '1 hour')",[orphan,ownerId,key,matter,Buffer.alloc(12),Buffer.from('not a real encrypted value'),Buffer.alloc(16)]);
  expect(await sweepContentOrphans(pool)).toBeGreaterThanOrEqual(1);
  expect((await pool.query('select 1 from app.private_content_values where public_id=$1',[orphan])).rowCount).toBe(0);
  expect((await request(app).get('/v1/sharing/shared-with-me').set(recipient).expect(200)).body.items[0].fields.notes).toBe(content.notes);
 });

 it('can reconstruct the wrapping service and read data after a process restart',async()=>{
  const restored=createPool(config,new TestContentKeys(service.root));
  try{const restoredApp=createApp(restored,config);expect((await request(restoredApp).get(`/v1/matters/${matter}`).set(owner).expect(200)).body.matter.notes).toBe('NEW POST-CUTOFF SECRET');}
  finally{await restored.end();}
 });

 it('can verify locked owners during admin migration without reopening their account',async()=>{
  await pool.query("update app.planners set status='locked' where id=$1",[ownerId]);
  try{
   expect((await migratePrivateContent(pool)).changedRows).toBe(0);
   expect((await pool.query('select status from app.planners where id=$1',[ownerId])).rows[0].status).toBe('locked');
   await request(app).get(`/v1/matters/${matter}`).set(owner).expect(401);
  }finally{await pool.query("update app.planners set status='active' where id=$1",[ownerId]);}
 });
});
