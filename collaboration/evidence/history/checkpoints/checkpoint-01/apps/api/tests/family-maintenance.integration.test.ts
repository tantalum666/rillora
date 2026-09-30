import { createHash, randomUUID } from "node:crypto";
import request from "./http-fixture.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool, withPlannerDatabase, type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { seedDevelopmentFixture, developmentPlannerPublicId as A } from "../src/seed-dev.js";
import { currentLegalContract } from "../src/legal-contract.js";
import { verifiedEmailDigest } from "../src/sharing-identity.js";

const databaseUrl="postgresql:///continuity_family_test";
const config=loadConfig({NODE_ENV:"test",DATABASE_URL:databaseUrl,ALLOW_DEV_AUTH:"true",ALLOW_FAMILY_MAINTENANCE_PREVIEW:"true",CORS_ORIGINS:"http://localhost:4211"});
const hash=(s:string)=>createHash('sha256').update(s).digest();
const csrf='r'.repeat(43); const owner={"x-dev-planner-id":A};
let pool:DatabasePool; let app:ReturnType<typeof createApp>; let closed:typeof app;
type Actor={id:string;headers:{cookie:string;'x-csrf-token':string}};
let B:Actor;let C:Actor;let X:Actor; let ownId:string;
let bm:string;let cm:string;let privateMatter:string;
let bc:string;let cc:string;let pending:string;let roundId:string;
let startInput:{requestKey:string;dueAt:string;items:{connectionPublicId:string;matterPublicId:string}[]};
async function actor(name:string) {
  const row=(await pool.query("select * from app.provision_oidc_planner($1,$2,$3,'en','UTC')",['https://family.example',`review|${name}`,name])).rows[0];
  const token=name.repeat(43).slice(0,43);
  await pool.query(`with a as (insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,
    consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
    values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id)
    insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at,verified_email_hash)
    select $1,$2,id,$8,$9,now()+interval '1 hour',$10 from a`,[row.planner_id,row.identity_account_id,currentLegalContract.termsVersion,
    currentLegalContract.privacyVersion,currentLegalContract.consentTextVersion,Buffer.from(currentLegalContract.bundleSha256,'hex'),
    hash(`https://family.example\u001freview|${name}`),hash(token),hash(csrf),verifiedEmailDigest(`${name.toLowerCase()}@family.test`)]);
  return {id:String(row.planner_id),headers:{cookie:`continuity_session=[REDACTED_COOKIE]'x-csrf-token':csrf,'x-rillora-planner':row.planner_public_id}};
}
async function matter(title:string) {
  return (await request(app).post('/v1/matters').set(owner).send({category:'document',title,institutionName:'Archive',locationHint:'Blue folder',
    accountHint:'ending 42',valueBand:'unknown',currencyCode:'USD',importance:'important',desiredOutcome:'notify',status:'draft'}).expect(201)).body.matter.publicId as string;
}
async function connect(name:string,matterId:string,who?:Actor) {
  const person=(await request(app).post('/v1/trusted-contacts').set(owner).send({displayName:name}).expect(201)).body.trustedContact.publicId;
  const result=(await request(app).post('/v1/sharing/connections').set(owner).send({personPublicId:person,email:`${name.toLowerCase()}@family.test`,grants:[{matterPublicId:matterId,detailLevel:'directions'}]}).expect(201)).body;
  if(who) await request(app).post('/v1/sharing/invitations/accept').set(who.headers).send({accepted:true,invitationToken:new URLSearchParams(new URL(result.invitationUrl).hash.slice(1)).get('invitation')}).expect(200);
  return result.connection.publicId as string;
}
async function overview(headers=owner,server=app) {return(await request(server).get('/v1/maintenance/overview').set(headers).expect(200)).body;}
async function incoming(who:Actor) {return(await request(app).get('/v1/maintenance/overview').set(who.headers).expect(200)).body.incoming;}
async function settings(collab:string|null, cadence=90) {
  const current=await overview();return request(app).patch('/v1/maintenance/settings').set(owner).send({expectedVersion:current.settings.version,
    collaboratorConnectionPublicId:collab,cadenceDays:cadence,nextReviewAt:null});
}
const due=()=>new Date(Date.now()+7*86_400_000).toISOString();

describe.sequential('Family maintenance — scoped ongoing work',()=>{
  beforeAll(async()=>{
    if(!databaseUrl.endsWith('/continuity_family_test'))throw new Error('Dedicated Family database required');
    await runMigrations(databaseUrl);pool=createPool(config);await pool.query('truncate app.planners restart identity cascade');
    await seedDevelopmentFixture(pool);app=createApp(pool,config);closed=createApp(pool,{...config,allowFamilyMaintenancePreview:false});
    B=await actor('B');C=await actor('C');X=await actor('X');ownId=String((await pool.query('select id from app.planners where public_id=$1',[A])).rows[0].id);
    bm=await matter('Family folder');cm=await matter('Friend project');privateMatter=await matter('Owner private');
    bc=await connect('B',bm,B);cc=await connect('C',cm,C);pending=await connect('Pending',bm);
  });
  afterAll(async()=>{await pool?.end();});

  it('has authenticated preview evidence and a closed default without changing ordinary commerce',async()=>{
    await request(app).get('/v1/maintenance/overview').expect(401);
    const data=await overview();expect(data.access).toEqual({mode:'preview',canCreate:true});
    expect(data.boundaries).toEqual({ownerApprovalRequired:true,recipientScopeEnforced:true,externalNotificationsSent:false,billingActivated:false});
    expect(data.eligible).toHaveLength(2);expect(data.rounds).toEqual([]);
    expect((await overview(owner,closed)).access.canCreate).toBe(false);
    expect((await request(app).get('/v1/commerce/status').set(owner).expect(200)).body.currentAccess.planCode).toBe('free');
  });
  it('requires a connected collaborator and persists a versioned cadence',async()=>{
    await settings(pending).then(r=>expect(r.status).toBe(400));await settings(bc).then(r=>expect(r.status).toBe(200));
    const data=await overview();expect(data.settings.collaboratorConnectionPublicId).toBe(bc);expect(data.settings.nextReviewAt).toBeTruthy();
    await request(app).patch('/v1/maintenance/settings').set(owner).send({expectedVersion:0,cadenceDays:90,nextReviewAt:null,collaboratorConnectionPublicId:cc}).expect(409);
  });
  it('rejects unshared/private and pending scope atomically',async()=>{
    for(const item of [{connectionPublicId:bc,matterPublicId:privateMatter},{connectionPublicId:pending,matterPublicId:bm}]){
      await request(app).post('/v1/maintenance/rounds').set(owner).send({requestKey:randomUUID(),dueAt:due(),items:[item]}).expect(400);
    }
    expect((await overview()).rounds).toHaveLength(0);
  });
  it('creates an idempotent review and isolates every receiving account',async()=>{
    await settings(null).then(r=>expect(r.status).toBe(200));
    startInput={requestKey:randomUUID(),dueAt:due(),items:[{connectionPublicId:bc,matterPublicId:bm},{connectionPublicId:cc,matterPublicId:cm}]};
    roundId=(await request(app).post('/v1/maintenance/rounds').set(owner).send(startInput).expect(201)).body.publicId;
    expect((await request(app).post('/v1/maintenance/rounds').set(owner).send(startInput).expect(201)).body.publicId).toBe(roundId);
    await request(app).post('/v1/maintenance/rounds').set(owner).send({...startInput,requestKey:randomUUID()}).expect(409);
    const b=await incoming(B),c=await incoming(C);expect(b).toHaveLength(1);expect(c).toHaveLength(1);expect(await incoming(X)).toEqual([]);
    expect(b[0].title).toBe('Family folder');expect(c[0].title).toBe('Friend project');
    expect(JSON.stringify(b)).not.toContain(cm);expect(JSON.stringify(c)).not.toContain(bm);
    expect(Object.keys(b[0].fields).sort()).toEqual(['institutionName','locationHint']);
    expect(b[0].canSuggest).toBe(false);expect(c[0].canSuggest).toBe(false);
    await settings(bc).then(r=>expect(r.status).toBe(200));
  });
  it('does not let read-only recipients suggest, impersonate others or bypass CSRF',async()=>{
    const b=(await incoming(B))[0],c=(await incoming(C))[0];
    await request(app).post(`/v1/maintenance/tasks/${b.publicId}/respond`).set(C.headers).send({expectedVersion:b.version,response:'confirmed'}).expect(403);
    await request(app).post(`/v1/maintenance/tasks/${c.publicId}/respond`).set(C.headers).send({expectedVersion:c.version,response:'suggested',proposal:{locationHint:'Red folder'}}).expect(403);
    await request(app).post(`/v1/maintenance/tasks/${b.publicId}/respond`).set('cookie',B.headers.cookie).send({expectedVersion:b.version,response:'confirmed'}).expect(403);
    await request(app).post(`/v1/maintenance/tasks/${b.publicId}/respond`).set(B.headers).send({expectedVersion:b.version,response:'suggested',proposal:{desiredOutcome:'transfer'}}).expect(400);
    await request(app).get(`/v1/matters/${bm}`).set(B.headers).expect(404);
  });
  it('persists confirmation and issue flags without pretending everything is ready',async()=>{
    const b=(await incoming(B))[0],c=(await incoming(C))[0];
    await request(app).post(`/v1/maintenance/tasks/${b.publicId}/respond`).set(B.headers).send({expectedVersion:b.version,response:'confirmed'}).expect(200);
    await request(app).post(`/v1/maintenance/tasks/${c.publicId}/respond`).set(C.headers).send({expectedVersion:c.version,response:'needs_update',reason:'cannot_find'}).expect(200);
    await request(app).post(`/v1/maintenance/rounds/${roundId}/close`).set(owner).send({expectedVersion:1,action:'complete'}).expect(409);
  });
  it('applies exactly one approved correction and keeps before/after history',async()=>{
    let b=(await incoming(B))[0];
    await request(app).post(`/v1/maintenance/tasks/${b.publicId}/respond`).set(B.headers).send({expectedVersion:b.version,response:'suggested',proposal:{locationHint:'Red folder'}}).expect(200);
    b=(await incoming(B))[0];
    const attempts=await Promise.all([1,2].map(()=>request(app).post(`/v1/maintenance/tasks/${b.publicId}/decide`).set(owner).send({expectedVersion:b.version,action:'apply'})));
    expect(attempts.map(r=>r.status).sort()).toEqual([200,409]);
    const data=await overview();expect(data.history).toHaveLength(1);expect(data.history[0].beforeFields.locationHint).toBe('Blue folder');expect(data.history[0].afterFields.locationHint).toBe('Red folder');
    expect((await request(app).get(`/v1/matters/${bm}`).set(owner).expect(200)).body.matter.locationHint).toBe('Red folder');
    const bData=(await request(app).get('/v1/maintenance/overview').set(B.headers).expect(200)).body;expect(bData.history).toEqual([]);
    expect(bData.incoming[0].fields.locationHint).toBe('Red folder');expect(bData.incoming[0].proposal).toBeNull();
  });
  it('detects a source change, requires a fresh check and cannot close stale work',async()=>{
    let c=(await incoming(C))[0];
    await request(app).patch(`/v1/matters/${cm}`).set(owner).send({expectedVersion:1,locationHint:'New drawer'}).expect(200);
    await request(app).post(`/v1/maintenance/tasks/${c.publicId}/respond`).set(C.headers).send({expectedVersion:c.version,response:'confirmed'}).expect(409);
    c=(await incoming(C))[0];expect(c.isStale).toBe(true);
    await request(app).post(`/v1/maintenance/tasks/${c.publicId}/decide`).set(owner).send({expectedVersion:c.version,action:'reopen'}).expect(200);
    c=(await incoming(C))[0];expect(c.fields.locationHint).toBe('New drawer');
    await request(app).post(`/v1/maintenance/tasks/${c.publicId}/respond`).set(C.headers).send({expectedVersion:c.version,response:'confirmed'}).expect(200);
    await request(app).post(`/v1/maintenance/rounds/${roundId}/close`).set(owner).send({expectedVersion:1,action:'complete'}).expect(200);
    expect((await overview()).rounds[0].state).toBe('completed');
  });
  it('fails closed when preview ends while retaining owner history and data',async()=>{
    await request(closed).post('/v1/maintenance/rounds').set(owner).send({...startInput,requestKey:randomUUID(),dueAt:due()}).expect(403);
    const data=await overview(owner,closed);expect(data.history).toHaveLength(1);expect(data.access.canCreate).toBe(false);
    expect((await request(closed).get('/v1/maintenance/overview').set(B.headers).expect(200)).body.incoming[0].canRespond).toBe(false);
  });
  it('removes old task access after scope reduction and cannot revive it by restoring a grant',async()=>{
    const connection=(await request(app).get('/v1/sharing/connections').set(owner).expect(200)).body.connections.find((c:any)=>c.publicId===bc);
    await request(app).patch(`/v1/sharing/connections/${bc}`).set(owner).send({expectedVersion:connection.version,grants:[{matterPublicId:bm,detailLevel:'name'}]}).expect(200);
    expect(await incoming(B)).toEqual([]);
    await request(app).patch(`/v1/sharing/connections/${bc}`).set(owner).send({expectedVersion:connection.version+1,grants:[{matterPublicId:bm,detailLevel:'directions'}]}).expect(200);
    expect(await incoming(B)).toEqual([]);
  });
  it('uses the owner capability without requiring the receiver to pay, and stops at its expiry',async()=>{
    const account=(await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code)
      select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id`,[ownId])).rows[0];
    const grant=(await pool.query(`insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,effective_at,expires_at)
      values($1,$2,'family_maintenance','manual_override','synthetic-test-only',now()-interval '2 hours',now()+interval '1 hour') returning id`,[ownId,account.id])).rows[0];
    expect((await overview(owner,closed)).access.mode).toBe('family');
    const data=(await request(closed).get('/v1/maintenance/overview').set(B.headers).expect(200)).body;
    expect(data.access.mode).toBe('unavailable');
    const fresh=(await request(closed).post('/v1/maintenance/rounds').set(owner).send({requestKey:randomUUID(),dueAt:due(),items:[{connectionPublicId:bc,matterPublicId:bm}]}).expect(201)).body.publicId;
    let t=(await request(closed).get('/v1/maintenance/overview').set(B.headers).expect(200)).body.incoming.find((x:any)=>x.roundPublicId===fresh);
    expect(t.canRespond).toBe(true);
    await request(closed).post(`/v1/maintenance/tasks/${t.publicId}/respond`).set(B.headers).send({expectedVersion:t.version,response:'confirmed'}).expect(200);
    await pool.query("update app.commerce_accounts set status='locked' where id=$1",[account.id]);
    expect((await overview(owner,closed)).access.canCreate).toBe(false);
    await pool.query("update app.commerce_accounts set status='active' where id=$1",[account.id]);
    await pool.query("update app.commerce_entitlement_grants set expires_at=now()-interval '1 minute' where id=$1",[grant.id]);
    t=(await request(closed).get('/v1/maintenance/overview').set(B.headers).expect(200)).body.incoming.find((x:any)=>x.roundPublicId===fresh);
    expect(t.canRespond).toBe(false);
    await request(closed).post(`/v1/maintenance/tasks/${t.publicId}/respond`).set(B.headers).send({expectedVersion:t.version,response:'needs_update',reason:'outdated'}).expect(403);
    await request(closed).post(`/v1/maintenance/rounds/${fresh}/close`).set(owner).send({expectedVersion:1,action:'cancel'}).expect(200);
  });
  it('serializes final completion against a late recipient suggestion',async()=>{
    const id=(await request(app).post('/v1/maintenance/rounds').set(owner).send({requestKey:randomUUID(),dueAt:due(),items:[{connectionPublicId:bc,matterPublicId:bm}]}).expect(201)).body.publicId;
    let t=(await incoming(B)).find((x:any)=>x.roundPublicId===id);
    await request(app).post(`/v1/maintenance/tasks/${t.publicId}/respond`).set(B.headers).send({expectedVersion:t.version,response:'confirmed'}).expect(200);
    t=(await incoming(B)).find((x:any)=>x.roundPublicId===id);
    const [finish,respond]=await Promise.all([
      request(app).post(`/v1/maintenance/rounds/${id}/close`).set(owner).send({expectedVersion:1,action:'complete'}),
      request(app).post(`/v1/maintenance/tasks/${t.publicId}/respond`).set(B.headers).send({expectedVersion:t.version,response:'suggested',proposal:{locationHint:'Late proposed location'}}),
    ]);
    expect([finish.status,respond.status].sort()).toEqual([200,409]);
    const current=(await overview()).rounds.find((r:any)=>r.publicId===id);
    if(current.state==='open') await request(app).post(`/v1/maintenance/rounds/${id}/close`).set(owner).send({expectedVersion:1,action:'cancel'}).expect(200);
  });
  it('preserves private RLS and makes revocation win over old review links',async()=>{
    const rows=await withPlannerDatabase(pool,B.id,async(c)=>(await c.query('select public_id from app.family_review_tasks where planner_id=$1',[ownId])).rows);
    expect(rows).toEqual([]);
    const c=(await incoming(C))[0];
    const connection=(await request(app).get('/v1/sharing/connections').set(owner).expect(200)).body.connections.find((x:any)=>x.publicId===cc);
    await request(app).delete(`/v1/sharing/connections/${cc}`).set(owner).set('if-match',String(connection.version)).expect(200);
    expect(await incoming(C)).toEqual([]);
    await request(app).post(`/v1/maintenance/tasks/${c.publicId}/respond`).set(C.headers).send({expectedVersion:c.version,response:'confirmed'}).expect(403);
    await request(closed).patch('/v1/maintenance/settings').set(owner).send({expectedVersion:(await overview()).settings.version,cadenceDays:0,nextReviewAt:null,collaboratorConnectionPublicId:null}).expect(200);
    expect((await overview()).settings.nextReviewAt).toBe(null);
  });
  it('keeps owner-approved history and cadence when a contributor deletes their account',async()=>{
    await settings(bc,30).then(r=>expect(r.status).toBe(200));
    const before=await overview();expect(before.history.length).toBeGreaterThan(0);
    await pool.query('delete from app.planners where id=$1',[B.id]);
    const after=await overview();
    expect(after.settings.cadenceDays).toBe(30);
    expect(after.settings.nextReviewAt).toBe(before.settings.nextReviewAt);
    expect(after.settings.collaboratorConnectionPublicId).toBeNull();
    expect(after.history).toHaveLength(before.history.length);
    expect(after.history[0].suggestedBy).toBe('Former collaborator');
    expect(after.history[0].afterFields.locationHint).toBe('Red folder');
    expect((await request(app).get(`/v1/matters/${bm}`).set(owner).expect(200)).body.matter.locationHint).toBe('Red folder');
  });
});
