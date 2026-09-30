import { randomUUID, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "./http-fixture.js";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool,withPlannerDatabase,type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { TestContentKeys } from "./content-test-keys.js";

const databaseUrl="postgresql:///continuity_content_test";
const A="91111111-1111-4111-8111-111111111111",B="92222222-2222-4222-8222-222222222222",C="93333333-3333-4333-8333-333333333333",D="94444444-4444-4444-8444-444444444444";
const config=loadConfig({NODE_ENV:"test",DATABASE_URL:databaseUrl,ALLOW_DEV_AUTH:"true",ALLOW_FAMILY_MAINTENANCE_PREVIEW:"true",CORS_ORIGINS:"http://localhost:4261",
 CONTENT_PROTECTION_MODE:"encrypted",CONTENT_KEY_NAMESPACE:"content-test",CONTENT_KMS_KEY_ARN:"arn:aws:kms:eu-central-1:000000000000:key/11111111-1111-4111-8111-111111111111"});
const keyService=new TestContentKeys();const owner={"x-dev-planner-id":A};
let pool:DatabasePool,app:ReturnType<typeof createApp>,matter:string,person:string,connection:string,invitation:string,reviewTask:string;
const ids=new Map<string,string>();
const input={category:"account",title:"sentinel title 银行",institutionName:"sentinel provider",locationHint:"sentinel locator",accountHint:"sentinel hint",notes:"sentinel notes",valueBand:"10k_100k",currencyCode:"USD",details:{}};

describe.sequential("Application-encrypted content and authorization",()=>{
 beforeAll(async()=>{
  if(databaseUrl!=="postgresql:///continuity_content_test")throw Error("Dedicated local database only");
  await runMigrations(databaseUrl);pool=createPool(config,keyService);
  await pool.query("truncate app.planners restart identity cascade");
  await pool.query("update app.private_content_policy set require_encrypted_writes=true");
  for(const [id,name] of [[A,"Owner metadata"],[B,"Recipient metadata"],[C,"Other recipient"],[D,"Backup owner"]] as const){
   const p=(await pool.query("insert into app.planners(public_id,display_name) values($1,$2) returning id::text",[id,name])).rows[0]!;
   ids.set(id,p.id);await pool.query("insert into app.plans(planner_id) values($1)",[p.id]);
  }
  app=createApp(pool,config);
 });
 afterAll(async()=>{await pool?.end();});

 it("roundtrips Matter and contact content without putting their bodies in business rows",async()=>{
  const created=(await request(app).post("/v1/matters").set(owner).send(input).expect(201)).body.matter;
  matter=created.publicId;expect(created).toMatchObject(input);
  const contact=(await request(app).post("/v1/trusted-contacts").set(owner).send({displayName:"sentinel parent",relationshipLabel:"sentinel relationship"}).expect(201)).body.trustedContact;
  person=contact.publicId;expect(contact.displayName).toBe("sentinel parent");
  const raw=(await pool.query("select title,institution_name,location_hint,notes,value_band,currency_code from app.matter_items where public_id=$1",[matter])).rows[0];
  expect(Object.values(raw).every(v=>typeof v==="string" && v.startsWith("rce1_"))).toBe(true);
  expect(JSON.stringify(raw)).not.toContain("sentinel");
  const people=(await pool.query("select display_name,relationship_label from app.people where public_id=$1",[person])).rows[0];
  expect(JSON.stringify(people)).not.toContain("sentinel");
  expect((await pool.query("select count(*)::int n from app.private_content_keys where planner_id=$1",[ids.get(A)])).rows[0].n).toBe(1);
  const count=keyService.unwrapped;
  expect((await request(app).get('/v1/overview').set(owner).expect(200)).body.matters[0].title).toBe(input.title);
  expect(keyService.unwrapped-count).toBe(1);
 });

 it("keeps Name-only sharing exact and refuses direct lookup of known secret references",async()=>{
  const result=(await request(app).post('/v1/sharing/connections').set(owner).send({personPublicId:person,email:`${B}@example.test`,grants:[{matterPublicId:matter,detailLevel:'name'}]}).expect(201)).body;
  connection=result.connection.publicId;invitation=new URLSearchParams(new URL(result.invitationUrl).hash.slice(1)).get('invitation')!;
  await request(app).post('/v1/sharing/invitations/accept').set('x-dev-planner-id',B).send({invitationToken:invitation,accepted:true}).expect(200);
  const data=(await request(app).get('/v1/sharing/shared-with-me').set('x-dev-planner-id',B).expect(200)).body;
  expect(data.items[0].fields).toEqual({title:input.title,category:'account'});
  const noteRef=(await pool.query("select notes from app.matter_items where public_id=$1",[matter])).rows[0].notes.slice(5);
  const leaked=await withPlannerDatabase(pool,ids.get(B)!,async client=>(await client.query("select app.content_read_values($1::uuid[],true) as data",[[noteRef]])).rows[0].data);
  expect(leaked.values).toEqual([]);expect(leaked.keys).toEqual([]);
  expect((await request(app).get('/v1/sharing/shared-with-me').set('x-dev-planner-id',C).expect(200)).body.items).toEqual([]);
 });

 it("treats ciphertext-looking user input as literal data, without recursive decryption",async()=>{
  const raw=(await pool.query("select notes from app.matter_items where public_id=$1",[matter])).rows[0].notes;
  const made=(await request(app).post('/v1/matters').set('x-dev-planner-id',B).send({...input,title:'Own matter',notes:raw}).expect(201)).body.matter;
  expect(made.notes).toBe(raw);
  const read=(await request(app).get(`/v1/matters/${made.publicId}`).set('x-dev-planner-id',B).expect(200)).body.matter;
  expect(read.notes).toBe(raw);expect(read.notes).not.toBe(input.notes);
 });

 it("rejects plaintext/cross-owner references at the DB write boundary",async()=>{
  await expect(withPlannerDatabase(pool,ids.get(A)!,async client=>client.query("update app.matter_items set notes=$2 where public_id=$1",[matter,'unsealed plaintext']))).rejects.toThrow('content_plaintext_rejected');
  const ref=(await pool.query("select notes from app.matter_items where public_id=$1",[matter])).rows[0].notes;
  await expect(withPlannerDatabase(pool,ids.get(B)!,async client=>client.query("update app.matter_items set notes=$1 where planner_id=app.current_planner_id()",[ref]))).rejects.toThrow('content_reference_invalid');
  await expect(withPlannerDatabase(pool,ids.get(A)!,async client=>client.query("select * from app.private_content_values"))).rejects.toThrow();
 });

 it("fails closed on key-service outage and tampering, with no plaintext write fallback",async()=>{
  const before=(await pool.query("select count(*)::int n from app.matter_items")).rows[0].n;
  keyService.fail=true;
  await request(app).get('/health/ready').expect(503);
  await request(app).get(`/v1/matters/${matter}`).set(owner).expect(503);
  await request(app).post('/v1/matters').set(owner).send({...input,title:'No fallback'}).expect(503);
  keyService.fail=false;
  await request(app).get('/health/ready').expect(200);
  expect((await pool.query("select count(*)::int n from app.matter_items")).rows[0].n).toBe(before);
  const value=(await pool.query("select v.* from app.private_content_values v join app.matter_items m on m.notes='rce1_'||v.public_id::text where m.public_id=$1",[matter])).rows[0];
  await pool.query("update app.private_content_values set auth_tag=$2 where public_id=$1",[value.public_id,Buffer.alloc(16)]);
  await request(app).get(`/v1/matters/${matter}`).set(owner).expect(503);
  await pool.query("update app.private_content_values set auth_tag=$2 where public_id=$1",[value.public_id,value.auth_tag]);
  await pool.query("update app.private_content_values set source_public_id=$2 where public_id=$1",[value.public_id,randomUUID()]);
  await request(app).get(`/v1/matters/${matter}`).set(owner).expect(503);
  await pool.query("update app.private_content_values set source_public_id=$2 where public_id=$1",[value.public_id,value.source_public_id]);
  expect((await request(app).get(`/v1/matters/${matter}`).set(owner).expect(200)).body.matter.notes).toBe(input.notes);
 });

 it("preserves protected review suggestions, approval and history",async()=>{
  let current=(await request(app).get('/v1/sharing/connections').set(owner).expect(200)).body.connections.find((c:any)=>c.publicId===connection);
  current=(await request(app).patch(`/v1/sharing/connections/${connection}`).set(owner).send({expectedVersion:current.version,grants:[{matterPublicId:matter,detailLevel:'details'}]}).expect(200)).body.connection;
  await request(app).patch('/v1/maintenance/settings').set(owner).send({expectedVersion:0,cadenceDays:90,collaboratorConnectionPublicId:connection,nextReviewAt:null}).expect(200);
  await request(app).post('/v1/maintenance/rounds').set(owner).send({requestKey:randomUUID(),dueAt:new Date(Date.now()+86400000).toISOString(),items:[{connectionPublicId:connection,matterPublicId:matter}]}).expect(201);
  const incoming=(await request(app).get('/v1/maintenance/overview').set('x-dev-planner-id',B).expect(200)).body.incoming[0];
  reviewTask=incoming.publicId;
  expect(incoming.fields.locationHint).toBe(input.locationHint);
  const response=(await request(app).post(`/v1/maintenance/tasks/${incoming.publicId}/respond`).set('x-dev-planner-id',B).send({expectedVersion:incoming.version,response:'suggested',proposal:{locationHint:'sentinel revised location'}}).expect(200)).body.task;
  const raw=(await pool.query("select source_fields,proposal from app.family_review_tasks where public_id=$1",[incoming.publicId])).rows[0];
  expect(JSON.stringify(raw)).not.toContain('sentinel');expect(raw.proposal.locationHint).toMatch(/^rce1_/);
  await request(app).post(`/v1/maintenance/tasks/${incoming.publicId}/decide`).set(owner).send({expectedVersion:response.version,action:'apply'}).expect(200);
  const history=(await request(app).get('/v1/maintenance/overview').set(owner).expect(200)).body.history[0];
  expect(history.beforeFields.locationHint).toBe(input.locationHint);expect(history.afterFields.locationHint).toBe('sentinel revised location');
  expect(JSON.stringify((await pool.query('select before_fields,after_fields from app.family_review_changes')).rows)).not.toContain('sentinel');
 });

 it("keeps disclosure snapshots and full backup/import compatible",async()=>{
  const snapshot=(await request(app).post('/v1/disclosure-rehearsals').set(owner).send({lifeEvent:'death'}).expect(201)).body;
  expect(JSON.stringify((await pool.query('select policy_snapshot from app.disclosure_rehearsals')).rows)).not.toContain('sentinel');
  expect(JSON.stringify(snapshot)).toContain('sentinel');
  const backup=(await request(app).post('/v1/account/map/export').set(owner).send({acknowledgesPrivateCopy:true}).expect(200)).body;
  expect(backup.matters[0].notes).toBe(input.notes);
  await request(app).post('/v1/account/map/import').set('x-dev-planner-id',D).send({backup,acknowledgesPrivateImport:true}).expect(201);
  expect((await request(app).get('/v1/matters').set('x-dev-planner-id',D).expect(200)).body.matters[0].notes).toBe(input.notes);
  const bodies=(await pool.query("select title,details,notes from app.matter_items where planner_id=$1",[ids.get(D)])).rows;
  expect(JSON.stringify(bodies)).not.toContain('sentinel');
 });

 it("removes an account's wrapped keys and encrypted values with self-service deletion",async()=>{
  expect((await pool.query('select count(*)::int n from app.private_content_values where planner_id=$1',[ids.get(D)])).rows[0].n).toBeGreaterThan(0);
  const response=await request(app).post('/v1/account/delete').set('x-dev-planner-id',D)
   .send({confirmation:'DELETE',receipt:randomBytes(32).toString('base64url'),acknowledgesSavedCopies:true}).expect(200);
  expect(response.body.deletion.status).toBe('completed');
  for(const table of ['private_content_keys','private_content_values'])
   expect((await pool.query(`select count(*)::int n from app.${table} where planner_id=$1`,[ids.get(D)])).rows[0].n).toBe(0);
 });

 it("orders names after decryption for role lists and disclosure previews",async()=>{
  for(const name of ['Zulu encrypted person','Alpha encrypted person']){
   const person=(await request(app).post('/v1/trusted-contacts').set(owner).send({displayName:name}).expect(201)).body.trustedContact;
   await request(app).post('/v1/role-assignments').set(owner).send({personPublicId:person.publicId,role:'executor',scope:'plan_wide',matterPublicId:null,acknowledgesRecordOnly:true,acknowledgesNoAuthority:true}).expect(201);
  }
  const assignments=(await request(app).get('/v1/role-assignments').set(owner).expect(200)).body.roleAssignments;
  expect(assignments.filter((a:any)=>a.role==='executor').map((a:any)=>a.person.displayName)).toEqual(['Alpha encrypted person','Zulu encrypted person']);
  const preview=(await request(app).post('/v1/disclosure-rehearsals').set(owner).send({lifeEvent:'death'}).expect(201)).body;
  const text=JSON.stringify(preview);
  expect(text.indexOf('Alpha encrypted person')).toBeLessThan(text.indexOf('Zulu encrypted person'));
 });

 it("revocation denies future recipient reads and key resolution",async()=>{
  const current=(await request(app).get('/v1/sharing/connections').set(owner).expect(200)).body.connections.find((c:any)=>c.publicId===connection);
  await request(app).delete(`/v1/sharing/connections/${connection}`).set(owner).set('if-match',String(current.version)).expect(200);
  expect((await request(app).get('/v1/sharing/shared-with-me').set('x-dev-planner-id',B).expect(200)).body.items).toEqual([]);
  const ref=(await pool.query("select title from app.matter_items where public_id=$1",[matter])).rows[0].title.slice(5);
  const result=await withPlannerDatabase(pool,ids.get(B)!,async client=>(await client.query("select app.content_read_values($1,true) as data",[[ref]])).rows[0].data);
  expect(result.values).toEqual([]);
  const unavailable=await request(app).post(`/v1/maintenance/tasks/${reviewTask}/respond`).set('x-dev-planner-id',B)
   .send({expectedVersion:1,response:'suggested',proposal:{locationHint:'No longer permitted'}}).expect(403);
  expect(unavailable.body.error.code).toBe('review_unavailable');
 });
});
