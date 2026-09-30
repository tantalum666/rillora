import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash,randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { createPool,withPlannerDatabase } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { configureRecoveryPool,parseRecoveryControl,type RecoveryControl } from '../src/recovery-journal.js';
import { replayRecoveryControls,validateRecoveryHost,validateRecoveryWindow } from '../src/recovery-replay.js';
import { TestContentKeys } from './content-test-keys.js';
import request from './http-fixture.js';
import { currentLegalContract as legal } from '../src/legal-contract.js';

const sourceUrl='postgresql:///continuity_recovery_test',restoreUrl='postgresql:///continuity_recovery_restore_test';
const config=loadConfig({NODE_ENV:'test',DATABASE_URL:sourceUrl,ALLOW_DEV_AUTH:'true',
 CONTENT_PROTECTION_MODE:'encrypted',CONTENT_KEY_NAMESPACE:'recovery-test',
 CONTENT_KMS_KEY_ARN:'arn:aws:kms:eu-central-1:000000000000:key/11111111-1111-4111-8111-111111111111'});
const A='81111111-1111-4111-8111-111111111111',B='82222222-2222-4222-8222-222222222222';
const C='83333333-3333-4333-8333-333333333333',D='84444444-4444-4444-8444-444444444444';
const keys=new TestContentKeys(),pool=createPool(config,keys),journal=new Map<string,RecoveryControl>();
const app=createApp(pool,config),actor={'x-dev-planner-id':A};
let fail=false,ownerId:string,deletedOwnerId:string,matter:string,revoked:string,kept:string,sourceState:any;
const oldSession=randomBytes(32).toString('base64url');
const recoveryLogin='continuity_recovery_operator_test',recoveryPassword=randomBytes(32).toString('hex');
const directory=mkdtempSync(join(tmpdir(),'rillora-recovery-test-')),dump=join(directory,'snapshot.dump');
let restored:ReturnType<typeof createPool>|undefined;

describe.sequential('Durable restrictions and quarantined restore',()=>{
 beforeAll(async()=>{
  await runMigrations(sourceUrl);
  await pool.query('update app.recovery_policy set enforced=false');
  await pool.query('truncate app.planners restart identity cascade');
  await pool.query('truncate app.recovery_controls');
  await pool.query('update app.private_content_policy set require_encrypted_writes=true');
  for(const id of [A,B,C,D]){
   const row=(await pool.query("insert into app.planners(public_id,display_name) values($1,'Recovery test metadata') returning id::text",[id])).rows[0];
   if(id===A)ownerId=row.id;
   if(id===D)deletedOwnerId=row.id;
   await pool.query('insert into app.plans(planner_id) values($1)',[row.id]);
  }
  configureRecoveryPool(pool,{async publish(event){if(fail)throw Error('journal unavailable');journal.set(event.key,structuredClone(event));},async checkCoverage(){if(fail)throw Error('journal unavailable');}});
  await pool.query('update app.recovery_policy set enforced=true,coverage_started_at=now()');
  const identity=(await pool.query("insert into app.identity_accounts(planner_id,issuer,subject) values($1,'https://identity.example.test',$2) returning id",[ownerId,A])).rows[0].id;
  const acceptance=(await pool.query(`insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,
   accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id`,
   [ownerId,identity,legal.termsVersion,legal.privacyVersion,legal.consentTextVersion,Buffer.from(legal.bundleSha256,'hex'),createHash('sha256').update('https://identity.example.test'+String.fromCharCode(31)+A).digest()])).rows[0].id;
  await pool.query(`insert into app.auth_sessions(planner_id,identity_account_id,token_hash,csrf_token_hash,expires_at,legal_acceptance_id)
   values($1,$2,$3,$4,now()+interval '2 hours',$5)`,[ownerId,identity,createHash('sha256').update(oldSession).digest(),randomBytes(32),acceptance]);
  await request(app).get('/v1/session').set('Cookie',`continuity_session=[REDACTED_COOKIE];
  const quoted=(await pool.query('select quote_ident($1) as name,quote_literal($2) as password',[recoveryLogin,recoveryPassword])).rows[0];
  if(!(await pool.query('select 1 from pg_roles where rolname=$1',[recoveryLogin])).rowCount)await pool.query(`create role ${quoted.name} login nosuperuser nocreatedb nocreaterole inherit nobypassrls password ${quoted.password}`);
  else await pool.query(`alter role ${quoted.name} login nosuperuser nocreatedb nocreaterole inherit nobypassrls password ${quoted.password}`);
  await pool.query(`grant continuity_recovery_service,continuity_content_service,continuity_app,continuity_auth to ${quoted.name}`);
 });
 afterAll(async()=>{await pool.end();await restored?.end();rmSync(directory,{recursive:true,force:true});});

 it('journals the exact permission ceiling without private matter bodies',async()=>{
  matter=(await request(app).post('/v1/matters').set(actor).send({category:'account',title:'Private restore sentinel',institutionName:'Secret institution',locationHint:'Secret location',notes:'Secret note',details:{}}).expect(201)).body.matter.publicId;
  await request(app).post('/v1/matters').set('x-dev-planner-id',D).send({category:'account',title:'Private body to erase',institutionName:'Secret institution',locationHint:'Secret location',details:{}}).expect(201);
  for(const recipient of [B,C]){
   const person=(await request(app).post('/v1/trusted-contacts').set(actor).send({displayName:'Private person',relationshipLabel:'Private relationship'}).expect(201)).body.trustedContact.publicId;
   const invite=(await request(app).post('/v1/sharing/connections').set(actor).send({personPublicId:person,email:`${recipient}@example.test`,grants:[{matterPublicId:matter,detailLevel:'details'}]}).expect(201)).body;
   const token=new URLSearchParams(new URL(invite.invitationUrl).hash.slice(1)).get('invitation');
   await request(app).post('/v1/sharing/invitations/accept').set('x-dev-planner-id',recipient).send({invitationToken:token,accepted:true}).expect(200);
   if(recipient===B)kept=invite.connection.publicId;else revoked=invite.connection.publicId;
  }
  expect([...journal.values()].some(e=>e.kind==='connection'&&e.facts.status==='accepted')).toBe(true);
  expect(JSON.stringify([...journal.values()])).not.toMatch(/Private|Secret|example.test|rce1_|wrappedKey/);
  sourceState=(await pool.query('select public_id,status,version from app.sharing_connections order by id')).rows;
 });

 it('rolls back a mutation if journal publication fails',async()=>{
  const before=(await pool.query('select version from app.sharing_connections where public_id=$1',[revoked])).rows[0].version;
  fail=true;
  await request(app).get('/health/ready').expect(503);
  await request(app).delete(`/v1/sharing/connections/${revoked}`).set(actor).set('if-match',String(before)).expect(503);
  fail=false;
  await request(app).get('/health/ready').expect(200);
  expect((await pool.query('select status,version from app.sharing_connections where public_id=$1',[revoked])).rows[0]).toEqual({status:'accepted',version:before});
 });

 it('rejects raw unjournaled commits even if the client forgets the publisher',async()=>{
  const unconfigured=createPool(config,keys);
  try{
   await expect(withPlannerDatabase(unconfigured,ownerId,c=>c.query("update app.sharing_connections set status='revoked',revoked_at=now() where public_id=$1",[revoked]))).rejects.toThrow('recovery_journal_unavailable');
  }finally{await unconfigured.end();}
 });

 it('takes a database snapshot before later revocation and account erasure',async()=>{
  execFileSync('pg_dump',['--format=custom','--dbname',sourceUrl,'--file',dump]);
  const version=(await pool.query('select version from app.sharing_connections where public_id=$1',[revoked])).rows[0].version;
  await request(app).delete(`/v1/sharing/connections/${revoked}`).set(actor).set('if-match',String(version)).expect(200);
  await request(app).post('/v1/account/delete').set('x-dev-planner-id',D).send({confirmation:'DELETE',receipt:randomBytes(32).toString('base64url'),acknowledgesSavedCopies:true}).expect(200);
  expect(journal.get(`account:${D}`)?.facts.deleted).toBe(true);
 });

 it('replays a real database copy without regranting C or disturbing B',async()=>{
  execFileSync('pg_restore',['--clean','--if-exists','--dbname',restoreUrl,dump]);
  const constrainedUrl=`postgresql://${recoveryLogin}:${recoveryPassword}@127.0.0.1:${process.env.PGPORT??'5432'}/continuity_recovery_restore_test`;
  restored=createPool({...config,database:{connectionString:constrainedUrl,sslMode:'disable',sslCaPath:null}},keys);
  expect((await restored.query('select rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0]).toEqual({rolsuper:false,rolbypassrls:false});
  expect((await restored.query('select public_id,status,version from app.sharing_connections order by id')).rows).toEqual(sourceState);
  expect((await restored.query('select count(*)::int n from app.private_content_keys where planner_id=$1',[deletedOwnerId])).rows[0].n).toBe(1);
  const restoredApp=createApp(restored,{...config,database:{connectionString:restoreUrl,sslMode:'disable',sslCaPath:null}});
  await request(restoredApp).get('/v1/session').set('Cookie',`continuity_session=[REDACTED_COOKIE];
  const result=await replayRecoveryControls(restored,[...journal.values()]);
  expect(result.applied).toBeGreaterThan(0);
  expect(result.sessionsInvalidated).toBeGreaterThan(0);
  await request(restoredApp).get('/v1/session').set('Cookie',`continuity_session=[REDACTED_COOKIE];
  const shared=(await request(restoredApp).get('/v1/sharing/shared-with-me').set('x-dev-planner-id',B).expect(200)).body.items;
  expect(shared[0].connectionPublicId).toBe(kept);
  expect(shared[0].fields.title).toBe('Private restore sentinel');
  expect((await request(restoredApp).get('/v1/sharing/shared-with-me').set('x-dev-planner-id',C).expect(200)).body.items).toEqual([]);
  expect((await restored.query('select count(*)::int n from app.planners where public_id=$1',[D])).rows[0].n).toBe(0);
  expect((await restored.query('select count(*)::int n from app.private_content_keys where planner_id=$1',[deletedOwnerId])).rows[0].n).toBe(0);
  expect((await restored.query('select count(*)::int n from app.private_content_values where planner_id=$1',[deletedOwnerId])).rows[0].n).toBe(0);
  expect((await restored.query('select count(*)::int n from app.auth_sessions')).rows[0].n).toBe(0);
  expect((await replayRecoveryControls(restored,[...journal.values()])).applied).toBe(0);
 },30_000);

 it('keeps an unsupported post-snapshot billing change quarantined',async()=>{
  const unknown:RecoveryControl={key:`unreconciled_access:${A}`,kind:'unreconciled_access',id:A,revision:'999999',recordedAt:new Date().toISOString(),facts:{}};
  await expect(replayRecoveryControls(restored!,[unknown])).rejects.toThrow('provider reconciliation');
  expect((await restored!.query('select count(*)::int n from app.recovery_controls where revision=999999')).rows[0].n).toBe(0);
 });

 it('rejects mismatched metadata, private body fields and unsafe recovery targets/windows',()=>{
  const event=[...journal.values()][0]!;
  expect(()=>parseRecoveryControl({...event,key:'another'})).toThrow();
  expect(()=>parseRecoveryControl({...event,facts:{...event.facts,notes:'private body'}})).toThrow();
  expect(()=>validateRecoveryHost('rillora-production.example',true)).toThrow();
  expect(()=>validateRecoveryHost('rillora-recovery-abcdef0123456789.test.eu-central-1.rds.amazonaws.com',false)).toThrow();
  expect(()=>validateRecoveryHost('rillora-recovery-abcdef0123456789.test.eu-central-1.rds.amazonaws.com',true)).not.toThrow();
  const clock=Date.now();
  expect(()=>validateRecoveryWindow(new Date(clock-1000).toISOString(),{version:1,startedAt:new Date(clock-2000).toISOString()},clock)).not.toThrow();
  expect(()=>validateRecoveryWindow(new Date(clock-36*86400_000).toISOString(),{version:1,startedAt:new Date(clock-40*86400_000).toISOString()},clock)).toThrow();
 });
});
