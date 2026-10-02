import request from "./http-fixture.js";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { createPool, withPlannerDatabase, type DatabasePool } from "../src/db.js";
import { loadConfig } from "../src/config.js";
import { runMigrations } from "../src/migrate.js";
import { createHash, randomBytes } from "node:crypto";
import { AccountDeletionProcessor, Auth0AccountIdentityDeleter } from "../src/account-deletion.js";
import { currentLegalContract } from "../src/legal-contract.js";
import {assertDedicatedTestDatabase,dedicatedTestDatabaseUrl} from './dedicated-test-database.js';

const databaseUrl=dedicatedTestDatabaseUrl("postgresql:///continuity_p1_repair_final_test","continuity_p1_repair_final_test");
const A="11111111-1111-4111-8111-111111111111",B="22222222-2222-4222-8222-222222222222",C="33333333-3333-4333-8333-333333333333",D="44444444-4444-4444-8444-444444444444";
const owner={"x-dev-planner-id":A};
const config=loadConfig({NODE_ENV:"test",DATABASE_URL:databaseUrl,ALLOW_DEV_AUTH:"true",CORS_ORIGINS:"http://localhost:4261"});
let pool:DatabasePool,app:ReturnType<typeof createApp>,bank:string,wallet:string,privateLetter:string,connection:any,second:any,backup:any;
async function connect(personName:string,recipient:string,grants:any[]){
 const person=(await request(app).post("/v1/trusted-contacts").set(owner).send({displayName:personName}).expect(201)).body.trustedContact;
 const response=(await request(app).post("/v1/sharing/connections").set(owner).send({personPublicId:person.publicId,email:`${recipient}@example.test`,grants}).expect(201)).body;
 const token=new URLSearchParams(new URL(response.invitationUrl).hash.slice(1)).get("invitation");
 await request(app).post("/v1/sharing/invitations/accept").set("x-dev-planner-id",recipient).send({invitationToken:token,accepted:true}).expect(200);
 return (await request(app).get("/v1/sharing/connections").set(owner)).body.connections.find((x:any)=>x.publicId===response.connection.publicId);
}
describe.sequential("P1 map reliability and export privacy",()=>{
 beforeAll(async()=>{
  await assertDedicatedTestDatabase(databaseUrl,"continuity_p1_repair_final_test");
  await runMigrations(databaseUrl);pool=createPool(config);await pool.query("truncate app.planners restart identity cascade");
  for(const [id,name] of [[A,"Alex QA"],[B,"Parent QA"],[C,"Friend QA"],[D,"Restored QA"]]){
   const p=(await pool.query("insert into app.planners(public_id,display_name) values($1,$2) returning id",[id,name])).rows[0];
   await pool.query("insert into app.plans(planner_id) values($1)",[p.id]);
  }
  await pool.query(`insert into app.official_setup_checks(planner_id,plan_id,provider_key,policy_version,completed,completed_at)
    select p.id,plan.id,'github','qa-policy',true,'2026-09-10T00:00:00Z' from app.planners p join app.plans plan on plan.planner_id=p.id where p.public_id=$1`,[A]);
  await pool.query(`insert into app.official_setup_checks(planner_id,plan_id,provider_key,policy_version,completed,completed_at)
    select p.id,plan.id,'google','qa-policy',false,null from app.planners p join app.plans plan on plan.planner_id=p.id where p.public_id=$1`,[A]);
  await pool.query(`insert into app.official_setup_checks(planner_id,plan_id,provider_key,policy_version,completed,completed_at,version)
    select p.id,plan.id,'google','existing-policy',true,'2026-09-12T00:00:00Z',2 from app.planners p join app.plans plan on plan.planner_id=p.id where p.public_id=$1`,[D]);
  app=createApp(pool,config);
  bank=(await request(app).post("/v1/matters").set(owner).send({category:"financial_asset",title:"Family bank",institutionName:"QA Bank",locationHint:"Green folder",desiredOutcome:"notify",notes:"Private bank note"}).expect(201)).body.matter.publicId;
  wallet=(await request(app).post("/v1/matters").set(owner).send({category:"crypto_asset",title:"Friend-only wallet",details:{cryptoCustody:"self_custody",network:"Ethereum",walletAddress:"0x000000000000000000000000000000000000dEaD"},notes:"Friend-only note"}).expect(201)).body.matter.publicId;
  privateLetter=(await request(app).post("/v1/matters").set(owner).send({category:"document",title:"Private letter",locationHint:"Private drawer",desiredOutcome:"never_disclose",notes:"Keep this private"}).expect(201)).body.matter.publicId;
  connection=await connect("Parent",B,[{matterPublicId:bank,detailLevel:"directions"}]);
  second=await connect("Friend",C,[{matterPublicId:wallet,detailLevel:"details"}]);
 });
 afterAll(async()=>{await pool?.end();});
 it("recipient exports omit unselected/private matter existence and other people",async()=>{
  const preview=(await request(app).post("/v1/exports/start-here/preview").set(owner).send({recipientConnectionPublicId:connection.publicId}).expect(201)).body;
  expect(preview.package.audience.name).toBe("Parent");expect(preview.package.matters.map((x:any)=>x.publicId)).toEqual([bank]);expect(preview.package.trustedContacts).toEqual([]);
  const text=(await request(app).post("/v1/exports/start-here/printable").set(owner).send({previewPublicId:preview.export.publicId,acknowledgesPlaintext:true,acknowledgesNoRevocation:true}).expect(201)).text;
  expect(text).toContain("Green folder");for(const value of ["Private letter","Private drawer","Friend-only wallet","Friend-only note","Private bank note","Friend"]){expect(text).not.toContain(value);}
  await request(app).post("/v1/exports/start-here/preview").set("x-dev-planner-id",B).send({recipientConnectionPublicId:connection.publicId}).expect(409);
 });
 it("name-only grants reveal no directions and changed audiences invalidate review",async()=>{
  const old=(await request(app).post("/v1/exports/start-here/preview").set(owner).send({recipientConnectionPublicId:connection.publicId}).expect(201)).body;
  connection=(await request(app).patch(`/v1/sharing/connections/${connection.publicId}`).set(owner).send({expectedVersion:connection.version,grants:[{matterPublicId:bank,detailLevel:"name"}]}).expect(200)).body.connection;
  await request(app).post("/v1/exports/start-here/printable").set(owner).send({previewPublicId:old.export.publicId,acknowledgesPlaintext:true,acknowledgesNoRevocation:true}).expect(409);
  const current=(await request(app).post("/v1/exports/start-here/preview").set(owner).send({recipientConnectionPublicId:connection.publicId}).expect(201)).body;
  expect(current.package.matters[0].institutionName).toBeNull();expect(current.package.matters[0].desiredOutcome).toBeNull();expect(current.package.matters[0].status).toBeNull();
 });
 it("personal guide excludes Never disclose and prepares a recovery-only package",async()=>{
  const preview=(await request(app).post("/v1/exports/start-here/preview").set(owner).send({}).expect(201)).body;
  expect(preview.package.matters.some((m:any)=>m.publicId===privateLetter)).toBe(false);
  const encrypted=(await request(app).post("/v1/exports/start-here/encrypted/prepare").set(owner).send({previewPublicId:preview.export.publicId}).expect(201)).body;
  expect(encrypted.eligibleRecipientKeys).toEqual([]);
 });
 it("complete personal backup includes Notes, typed details and private records",async()=>{
  await request(app).post("/v1/account/map/export").set(owner).send({}).expect(400);
  backup=(await request(app).post("/v1/account/map/export").set(owner).send({acknowledgesPrivateCopy:true}).expect(200)).body;
  expect(backup.matters.find((m:any)=>m.publicId===wallet).details.network).toBe("Ethereum");
  expect(backup.matters.find((m:any)=>m.publicId===privateLetter).notes).toBe("Keep this private");
  expect(JSON.stringify(backup)).not.toMatch(/token_hash|csrf|identity_accounts|recipient_email_hash/);
  await request(app).post("/v1/account/map/export").send({acknowledgesPrivateCopy:true}).expect(401);
 });
 it("imports are atomic, repeatable and never restore live sharing or replace data",async()=>{
  const invalid=structuredClone(backup);invalid.roles[0].personPublicId=A;
  await request(app).post("/v1/account/map/import").set("x-dev-planner-id",D).send({backup:invalid,acknowledgesPrivateImport:true}).expect(400);
  const response=(await request(app).post("/v1/account/map/import").set("x-dev-planner-id",D).send({backup,acknowledgesPrivateImport:true}).expect(201)).body;
  expect(response).toMatchObject({matterCount:3,personCount:2,sharingRestored:false});
  expect((await request(app).post("/v1/account/map/import").set("x-dev-planner-id",D).send({backup,acknowledgesPrivateImport:true}).expect(200)).body.alreadyImported).toBe(true);
  const restored=(await request(app).get("/v1/matters").set("x-dev-planner-id",D)).body.matters;
  expect(restored.find((m:any)=>m.title==="Friend-only wallet").notes).toBe("Friend-only note");
  const checks=(await request(app).get("/v1/official-setup-checks").set("x-dev-planner-id",D)).body.officialSetupChecks;
  expect(checks.find((c:any)=>c.providerKey==="github")).toMatchObject({completed:true,completedAt:"2026-09-10T00:00:00.000Z"});
  expect(checks.find((c:any)=>c.providerKey==="google")).toMatchObject({completed:true,policyVersion:"existing-policy",completedAt:"2026-09-12T00:00:00.000Z"});
  expect((await request(app).get("/v1/sharing/connections").set("x-dev-planner-id",D)).body.connections).toEqual([]);
  await request(app).post("/v1/account/map/import").set(owner).send({backup,acknowledgesPrivateImport:true}).expect(409);
 });
 it("provider-check import rights stay confined to the current planner",async()=>{
  const a=(await pool.query("select id from app.planners where public_id=$1",[A])).rows[0].id;
  const d=(await pool.query("select p.id,plan.id as plan_id from app.planners p join app.plans plan on plan.planner_id=p.id where p.public_id=$1",[D])).rows[0];
  await expect(withPlannerDatabase(pool,a,client=>client.query("insert into app.official_setup_checks(planner_id,plan_id,provider_key,policy_version,completed) values($1,$2,'apple','not allowed',false)",[d.id,d.plan_id]))).rejects.toMatchObject({code:"42501"});
 });
 it("lost-response retries create one matter and never silently replace newer draft text",async()=>{
  const input={requestId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",category:"document",title:"Retry-safe document",locationHint:"Blue folder"};
  const first=(await request(app).post("/v1/matters").set(owner).send(input).expect(201)).body.matter;
  const results=await Promise.all([request(app).post("/v1/matters").set(owner).send(input),request(app).post("/v1/matters").set(owner).send(input)]);
  expect(results.map(r=>r.body.matter.publicId)).toEqual([first.publicId,first.publicId]);
  const changed=await request(app).post("/v1/matters").set(owner).send({...input,title:"Edited after uncertain save"}).expect(409);
  expect(changed.body.error.code).toBe("saved_draft_changed");
  const other=(await request(app).post("/v1/matters").set("x-dev-planner-id",B).send(input).expect(201)).body.matter;
  expect(other.publicId).not.toBe(first.publicId);
  expect((await request(app).get(`/v1/matters/creation/${input.requestId}`).set(owner).expect(200)).body.matter.publicId).toBe(first.publicId);
  expect((await request(app).get(`/v1/matters/creation/${input.requestId}`).set("x-dev-planner-id",B).expect(200)).body.matter.publicId).toBe(other.publicId);
  await request(app).get(`/v1/matters/creation/${input.requestId}`).set("x-dev-planner-id",C).expect(404);
 });
 it("restoring an archive is private and old export access stays invalid",async()=>{
  const item=(await request(app).get(`/v1/matters/${bank}`).set(owner)).body.matter;
  await request(app).delete(`/v1/matters/${bank}`).set(owner).set("if-match",String(item.version)).expect(204);
  const archived=(await request(app).get("/v1/account/archived-matters").set(owner).expect(200)).body.matters[0];
  await request(app).post(`/v1/account/archived-matters/${bank}/restore`).set(owner).send({expectedVersion:archived.version}).expect(200);
  expect((await request(app).get("/v1/sharing/shared-with-me").set("x-dev-planner-id",B)).body.items).toEqual([]);
  expect((await request(app).get("/v1/sharing/shared-with-me").set("x-dev-planner-id",C)).body.items).toHaveLength(1);
 });
 it("account removal revokes access and exposes only an opaque status receipt",async()=>{
  const receipt=randomBytes(32).toString("base64url");
  await request(app).post("/v1/account/delete").set("x-dev-planner-id",D).send({confirmation:"WRONG",receipt,acknowledgesSavedCopies:true,acknowledgesBilling:true}).expect(400);
  const response=await request(app).post("/v1/account/delete").set("x-dev-planner-id",D).send({confirmation:"DELETE",receipt,acknowledgesSavedCopies:true,acknowledgesBilling:true});
  expect(response.status,response.text).toBe(200);expect(response.body.deletion.status).toBe("completed");
  await request(app).get("/v1/account/profile").set("x-dev-planner-id",D).expect(401);
  const status=(await request(app).get("/account-deletions/status").set("authorization",`Deletion-Receipt ${receipt}`).expect(200)).body.deletion;
  expect(Object.keys(status).sort()).toEqual(["completedAt","publicId","requestedAt","status"]);
  await request(app).get("/account-deletions/status").expect(401);
  await request(app).get("/account-deletions/status").set("authorization",`Deletion-Receipt ${randomBytes(32).toString("base64url")}`).expect(404);
  expect((await request(app).get("/v1/matters").set(owner)).body.matters).toHaveLength(4);
 });
 it("failed provider cleanup remains pending, retries, and retains minimal consent evidence",async()=>{
  const identity=(await pool.query("select * from app.provision_oidc_planner('https://identity.example/','auth0|erase-fixture','Erase QA','en','UTC')")).rows[0];
  const receipt=randomBytes(32).toString("base64url"),session=randomBytes(32).toString("base64url"),csrf=randomBytes(32).toString("base64url");
  const sha=(v:string)=>createHash("sha256").update(v).digest();
  const consent=(await pool.query(`insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
    values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id`,[identity.planner_id,identity.identity_account_id,currentLegalContract.termsVersion,currentLegalContract.privacyVersion,currentLegalContract.consentTextVersion,Buffer.from(currentLegalContract.bundleSha256,"hex"),sha("test deletion consent")])).rows[0];
  await pool.query(`insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at,last_seen_at) values($1,$2,$3,$4,$5,now()+interval '1 hour',now())`,[identity.planner_id,identity.identity_account_id,consent.id,sha(session),sha(csrf)]);
  let calls=0;const processor=new AccountDeletionProcessor(pool,{async deleteIdentity(value){expect(value.subject).toBe("auth0|erase-fixture");if(++calls===1)throw Error("transient");}});
  const instance=createApp(pool,config,{accountDeletionProcessor:processor});
  const body={confirmation:"DELETE",receipt,acknowledgesSavedCopies:true,acknowledgesBilling:true};
  const unavailable=await request(app).post("/v1/account/delete").set({cookie:`continuity_session=${session}`,"x-csrf-token":csrf,"x-rillora-planner":identity.planner_public_id}).send(body).expect(409);
  expect(unavailable.body.error.code).toBe("account_deletion_unavailable");
  expect((await pool.query("select status from app.planners where id=$1",[identity.planner_id])).rows[0].status).toBe("active");
  await request(instance).post("/v1/account/delete").set("cookie",`continuity_session=${session}`).send(body).expect(403);
  const result=await request(instance).post("/v1/account/delete").set({cookie:`continuity_session=${session}`,"x-csrf-token":csrf,"x-rillora-planner":identity.planner_public_id}).send(body).expect(202);
  expect(result.body.deletion.status).toBe("pending");
  expect((await pool.query("select status from app.planners where id=$1",[identity.planner_id])).rows[0].status).toBe("deletion_pending");
  await request(instance).get("/v1/overview").set("cookie",`continuity_session=${session}`).expect(401);
  await pool.query("update app.account_deletions set next_attempt_at=now()-interval '1 second' where public_id=$1",[result.body.deletion.publicId]);
  await processor.process(result.body.deletion.publicId);
  expect(calls).toBe(2);expect((await pool.query("select id from app.planners where id=$1",[identity.planner_id])).rows).toHaveLength(0);
  const retained=(await pool.query("select planner_id,identity_account_id,identity_reference_sha256 from app.legal_acceptances where id=$1",[consent.id])).rows[0];
  expect(retained.planner_id).toBeNull();expect(retained.identity_account_id).toBeNull();expect(retained.identity_reference_sha256).toEqual(sha("test deletion consent"));
  expect((await request(instance).get("/account-deletions/status").set("authorization",`Deletion-Receipt ${receipt}`)).body.deletion.status).toBe("completed");
 });
 it("the Auth0 adapter rejects foreign issuers and treats exact-user retries idempotently",async()=>{
  const calls:any[]=[];
  const adapter=new Auth0AccountIdentityDeleter({domain:"tenant.eu.auth0.com",clientId:"service",clientSecret:"private-test-secret",allowedIssuers:["https://login.example/"]},(async(url:any,init:any)=>{
   calls.push({url,method:init.method});return url.endsWith('/oauth/token')?new Response(JSON.stringify({access_token:"test-token",expires_in:3600}),{status:200,headers:{"content-type":"application/json"}}):new Response(null,{status:404});
  }) as typeof fetch);
  await expect(adapter.deleteIdentity({issuer:"https://foreign.example/",subject:"auth0|other"})).rejects.toThrow("identity_scope_mismatch");expect(calls).toHaveLength(0);
  await adapter.deleteIdentity({issuer:"https://login.example/",subject:"auth0|one"});await adapter.deleteIdentity({issuer:"https://login.example",subject:"auth0|one"});
  expect(calls.map(c=>c.method)).toEqual(["POST","DELETE","DELETE"]);expect(calls[1].url).toContain("auth0%7Cone");
 });

 it('round-trips an actual exported backup at the 2 MiB boundary with its import envelope',async()=>{
  const source='55555555-5555-4555-8555-555555555555',target='66666666-6666-4666-8666-666666666666';
  let sourceId:string|undefined;
  for(const publicId of [source,target]){
   const id=(await pool.query("insert into app.planners(public_id,display_name) values($1,'Large map fixture') returning id::text",[publicId])).rows[0].id;
   if(publicId===source)sourceId=id;
   await pool.query('insert into app.plans(planner_id) values($1)',[id]);
  }
  await pool.query(`insert into app.matter_items(planner_id,plan_id,category,title,location_hint,desired_outcome,notes)
   select $1,p.id,'document','Backup '||n,'Box','notify',repeat('界',1500)
   from app.plans p cross join generate_series(1,350) n where p.planner_id=$1`,[sourceId]);
  const exported=await request(app).post('/v1/account/map/export').set('x-dev-planner-id',source).send({acknowledgesPrivateCopy:true}).expect(200);
  const limit=2*1024*1024;let remaining=limit-16-Buffer.byteLength(exported.text);
  expect(remaining).toBeGreaterThan(0);
  const changes=exported.body.matters.map((m:{publicId:string;notes:string})=>{
   const wide=Math.min(500,Math.floor(remaining/3));remaining-=wide*3;
   const ascii=Math.min(500-wide,remaining);remaining-=ascii;
   return {id:m.publicId,notes:m.notes+'界'.repeat(wide)+'x'.repeat(ascii)};
  });
  expect(remaining).toBe(0);
  await pool.query(`update app.matter_items m set notes=x.notes from jsonb_to_recordset($1::jsonb) x(id uuid,notes text)
   where m.public_id=x.id and m.planner_id=$2`,[JSON.stringify(changes),sourceId]);
  const large=await request(app).post('/v1/account/map/export').set('x-dev-planner-id',source).send({acknowledgesPrivateCopy:true}).expect(200);
  expect(Buffer.byteLength(large.text)).toBe(limit-16);
  const envelope={backup:large.body,acknowledgesPrivateImport:true};
  expect(Buffer.byteLength(JSON.stringify(envelope))).toBeGreaterThan(limit);
  await request(app).post('/api/v1/account/map/import').send({}).expect(401);
  const imported=await request(app).post('/api/v1/account/map/import').set('x-dev-planner-id',target)
   .set('Content-Type','application/vnd.rillora.backup+json').send(envelope).expect(201);
  expect(imported.body).toMatchObject({matterCount:350,sharingRestored:false});
  const room=large.body.matters.find((m:{notes:string})=>m.notes.length<1983);
  room.notes+='x'.repeat(17);
  const tooLarge=await request(app).post('/v1/account/map/import').set('x-dev-planner-id',target)
   .send({backup:large.body,acknowledgesPrivateImport:true}).expect(413);
  expect(tooLarge.body.error.code).toBe('backup_size_limit');
 });

 it('reports oversized ordinary request bodies as 413',async()=>{
  const response=await request(app).post('/v1/matters').set(owner).send({notes:'x'.repeat(66_000)}).expect(413);
  expect(response.body.error.code).toBe('request_body_too_large');
 });

 it('rechecks billing atomically when a concurrent checkout commits before deletion',async()=>{
  const publicId='77777777-7777-4777-8777-777777777777';
  const id=(await pool.query("insert into app.planners(public_id,display_name) values($1,'Checkout race fixture') returning id::text",[publicId])).rows[0].id;
  const plan=(await pool.query('insert into app.plans(planner_id) values($1) returning id',[id])).rows[0].id;
  const account=(await pool.query("insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code) values($1,$2,'global','GLOBAL_US') returning id",[id,plan])).rows[0].id;
  const checkout=await pool.connect();let deletion:Promise<any>|undefined;
  try{
   await checkout.query('begin');
   await checkout.query("select pg_advisory_xact_lock(hashtextextended('checkout:'||$1::text,0))",[id]);
   await checkout.query(`insert into app.commerce_orders(planner_id,commerce_account_id,operator_code,price_id,
    purchase_route_policy_code,purchase_route_policy_version,provider_code,provider_environment,amount_minor,currency_code,status)
    select $1,$2,operator_code,id,'global_us_web_stripe_v1',1,'stripe','test',amount_minor,currency_code,'pending'
    from app.commerce_prices where price_code='family_usd_annual_v1'`,[id,account]);
   deletion=request(app).post('/v1/account/delete').set('x-dev-planner-id',publicId)
    .send({confirmation:'DELETE',receipt:randomBytes(32).toString('base64url'),acknowledgesSavedCopies:true}).then(response=>response);
   let waiting=false;
   for(let attempt=0;attempt<100&&!waiting;attempt++){
    waiting=(await pool.query("select exists(select 1 from pg_stat_activity where datname=current_database() and state='active' and wait_event_type='Lock' and pid<>pg_backend_pid()) as waiting")).rows[0].waiting;
    if(!waiting)await new Promise(resolve=>setTimeout(resolve,10));
   }
   expect(waiting).toBe(true);
   await checkout.query('commit');
   const result=await deletion;
   expect(result.status).toBe(400);expect(result.body.error.code).toBe('billing_confirmation_required');
   expect((await pool.query('select status from app.planners where id=$1',[id])).rows[0].status).toBe('active');
   const profile=(await request(app).get('/v1/account/profile').set('x-dev-planner-id',publicId).expect(200)).body;
   expect(profile.billing).toMatchObject({hasSubscription:false,hasPendingPurchase:true,providers:['stripe']});
  }finally{await checkout.query('rollback');checkout.release();await deletion;}
 });
});
