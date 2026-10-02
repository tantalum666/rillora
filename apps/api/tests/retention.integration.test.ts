import {randomBytes,randomUUID} from 'node:crypto';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {loadConfig} from '../src/config.js';
import {createPool} from '../src/db.js';
import {runMigrations} from '../src/migrate.js';
import {runRetentionBatch} from '../src/retention.js';
import {currentLegalContract as legal} from '../src/legal-contract.js';
import {setRetentionHold} from '../src/retention-holds.js';
import {configureRecoveryPool,type RecoveryControl,parseRecoveryControl,DynamoRecoveryJournal} from '../src/recovery-journal.js';
import {replayRecoveryControls} from '../src/recovery-replay.js';
import type {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {assertDedicatedTestDatabase,dedicatedTestDatabaseUrl} from './dedicated-test-database.js';
const databaseUrl=dedicatedTestDatabaseUrl('postgresql:///rillora_retention_test','rillora_retention_test');
const pool=createPool(loadConfig({NODE_ENV:'test',DATABASE_URL:databaseUrl}));
let owner:string,keptEvent:string,keptAudit:string,keptLegal:string;
async function event(age:string,expiry:string){return (await pool.query(`insert into app.product_events(planner_id,event_name,client_source,occurred_at,expires_at)
 values($1,'first_item_added','unknown',now()-$2::interval,now()+$3::interval) returning public_id`,[owner,age,expiry])).rows[0].public_id;}
async function receipt(linked:boolean,age:string){return (await pool.query(`insert into app.legal_acceptances(planner_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,
 accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256,accepted_at)
 values($1,$2,$3,$4,$5,true,true,true,'web',$6,now()-$7::interval) returning public_id`,[linked?owner:null,legal.termsVersion,legal.privacyVersion,legal.consentTextVersion,Buffer.from(legal.bundleSha256,'hex'),randomBytes(32),age])).rows[0].public_id;}
describe.sequential('Purpose-specific bounded retention',()=>{
 beforeAll(async()=>{
  await assertDedicatedTestDatabase(databaseUrl,'rillora_retention_test');
  await runMigrations(databaseUrl);
  await pool.query('update app.recovery_policy set enforced=false');
  await pool.query('truncate app.recovery_controls');
  await pool.query('truncate app.planners,app.legal_acceptances,app.closed_account_payment_records,app.account_deletions,app.retention_holds,app.auth_transactions,app.sharing_handoffs cascade');
  owner=(await pool.query("insert into app.planners(display_name,created_at) values('Old active synthetic account',now()-interval '10 years') returning id::text")).rows[0].id;
  await pool.query('insert into app.plans(planner_id) values($1)',[owner]);
  await event('100 days','-10 days');keptEvent=await event('100 days','-10 days');await event('1 day','89 days');
  const audit=async()=> (await pool.query("insert into app.audit_events(planner_id,actor_type,action,resource_type,occurred_at) values($1,'system','synthetic','retention_fixture',now()-interval '13 months') returning public_id",[owner])).rows[0].public_id;
  await audit();keptAudit=await audit();
  await receipt(false,'8 years');keptLegal=await receipt(false,'8 years');await receipt(true,'8 years');await receipt(false,'1 year');
  for(const [category,id] of [['product_event',keptEvent],['audit_event',keptAudit],['legal_acceptance',keptLegal]])
   await pool.query("insert into app.retention_holds(category,record_id,reason_code) values($1,$2,'unresolved_dispute')",[category,id]);
  for(const age of ['8 years','1 year'])await pool.query("insert into app.closed_account_payment_records(deletion_public_id,records,recorded_at) values($1,'{}',now()-$2::interval)",[randomUUID(),age]);
  await pool.query("insert into app.account_deletions(receipt_hash,status,completed_at,created_at) values($1,'completed',now()-interval '31 days',now()-interval '32 days')",[randomBytes(32)]);
  await pool.query("insert into app.account_deletions(receipt_hash,status,created_at) values($1,'retrying',now()-interval '60 days')",[randomBytes(32)]);
  for(const expires of ['-1 hour','1 hour']){
   await pool.query("insert into app.auth_sessions(planner_id,token_hash,csrf_token_hash,created_at,expires_at) values($1,$2,$3,now()-interval '2 hours',now()+$4::interval)",[owner,randomBytes(32),randomBytes(32),expires]);
   await pool.query(`insert into app.auth_transactions(token_hash,state_hash,code_verifier,nonce,created_at,expires_at,
    legal_acceptance_required,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,legal_client_surface)
    values($1,$2,$3,$4,now()-interval '2 hours',now()+$5::interval,true,$6,$7,$8,$9,true,true,true,'web')`,
    [randomBytes(32),randomBytes(32),'v'.repeat(43),'n'.repeat(32),expires,legal.termsVersion,legal.privacyVersion,legal.consentTextVersion,Buffer.from(legal.bundleSha256,'hex')]);
   await pool.query("insert into app.sharing_handoffs(token_hash,invitation_token_hash,connection_public_id,expires_at) values($1,$2,$3,now()+$4::interval)",[randomBytes(32),randomBytes(32),randomUUID(),expires]);
  }
 });
 afterAll(async()=>{await pool.end();});
 it('removes only due metadata and preserves active accounts, linked receipts, fresh records and held evidence',async()=>{
  expect(await runRetentionBatch(pool)).toEqual({sessions:1,authTransactions:1,sharingHandoffs:1,productEvents:1,auditEvents:1,legalAcceptances:1,closedPayments:1,deletionReceipts:1,releasedHolds:0});
  expect((await pool.query('select count(*)::int n from app.planners')).rows[0].n).toBe(1);
  expect((await pool.query('select count(*)::int n from app.plans')).rows[0].n).toBe(1);
  expect((await pool.query('select count(*)::int n from app.legal_acceptances')).rows[0].n).toBe(3);
  expect((await pool.query("select status from app.account_deletions")).rows).toEqual([{status:'retrying'}]);
  expect(Object.values(await runRetentionBatch(pool)).every(n=>n===0)).toBe(true);
 });
 it('honors the per-category batch cap and resumes until due rows are gone',async()=>{
  for(let n=0;n<3;n++)await event('100 days','-10 days');
  expect((await runRetentionBatch(pool,2)).productEvents).toBe(2);
  expect((await runRetentionBatch(pool,2)).productEvents).toBe(1);
  expect((await runRetentionBatch(pool,2)).productEvents).toBe(0);
 });
 it('purges held evidence only after explicit administrative release, without granting hold edits to runtime roles',async()=>{
  const c=await pool.connect();
  try{await c.query('begin');await c.query('set local role continuity_auth');
   await expect(c.query('update app.retention_holds set released_at=now()')).rejects.toThrow();
  }finally{await c.query('rollback');c.release();}
  expect((await pool.query("select pg_has_role('continuity_auth','continuity_retention_service','member') as allowed")).rows[0].allowed).toBe(false);
  await pool.query('update app.retention_holds set released_at=now()');
  const removed=await runRetentionBatch(pool);expect(removed.productEvents).toBe(1);expect(removed.auditEvents).toBe(1);expect(removed.legalAcceptances).toBe(1);
 });
 it('rejects an unbounded call without removing records',async()=>{
  for(const bound of [0,-1,1001])await expect(runRetentionBatch(pool,bound)).rejects.toThrow('invalid retention batch bound');
 });
 it('journals a later hold before commit, replays it over an older state and keeps held evidence out of cleanup',async()=>{
  const record=await event('100 days','-10 days');const events:RecoveryControl[]=[];let unavailable=false;
  configureRecoveryPool(pool,{async publish(e){if(unavailable)throw Error('unavailable');events.push(e);}});
  await pool.query('update app.recovery_policy set enforced=true');
  unavailable=true;
  await expect(setRetentionHold(pool,{category:'product_event',recordId:record,reason:'legal_requirement',active:true})).rejects.toThrow();
  expect((await pool.query('select count(*)::int n from app.retention_holds where record_id=$1',[record])).rows[0].n).toBe(0);
  unavailable=false;await setRetentionHold(pool,{category:'product_event',recordId:record,reason:'legal_requirement',active:true});
  expect(events).toHaveLength(1);expect(parseRecoveryControl(events[0]).facts.active).toBe(true);
  // Model the isolated backup state before that hold; no cloud restore is claimed.
  await pool.query('update app.recovery_policy set enforced=false');await pool.query('truncate app.retention_holds,app.recovery_controls');
  await pool.query("insert into app.retention_holds(category,record_id,reason_code,released_at) values('product_event',$1,'legal_requirement',now()-interval '100 days')",[record]);
  await replayRecoveryControls(pool,events);
  expect((await pool.query('select public_id from app.retention_holds where record_id=$1',[record])).rows[0].public_id).toBe(events[0]!.id);
  expect((await runRetentionBatch(pool)).productEvents).toBe(0);
  const repeated=await replayRecoveryControls(pool,events);expect(repeated.applied).toBe(0);
  await pool.query('update app.recovery_policy set enforced=true');
  await setRetentionHold(pool,{category:'product_event',recordId:record,reason:'legal_requirement',active:false});
  expect((await runRetentionBatch(pool)).productEvents).toBe(1);
  expect((await pool.query('select count(*)::int n from app.retention_holds')).rows[0].n).toBe(1);
 });
 it('retains active hold metadata beyond the usual90day journal TTL and bounds released evidence',async()=>{
  const sent:any[]=[];const client={send:async(command:any)=>{sent.push(command.input);return {};}} as unknown as DynamoDBClient;
  const publisher=new DynamoRecoveryJournal('fixture-table','rillora-production',client);
  const id=randomUUID();const event={key:`retention_hold:${id}`,kind:'retention_hold' as const,id,revision:'1',recordedAt:new Date().toISOString(),
   facts:{category:'audit_event',recordId:randomUUID(),reason:'security_incident',active:true}};
  await publisher.publish(event);expect(sent[0].Item.expiresAt).toBeUndefined();
  await publisher.publish({...event,revision:'2',facts:{...event.facts,active:false}});expect(Number(sent[1].Item.expiresAt.N)).toBeGreaterThan(Date.now()/1000+89*86400);
  expect(()=>parseRecoveryControl({...event,facts:{...event.facts,privateCaseNotes:'must not enter the journal'}})).toThrow();
 });
 it('does not release a legal hold when a separate security hold ends',async()=>{
  const record=await event('100 days','-10 days');
  for(const reason of ['legal_requirement','security_incident'])await setRetentionHold(pool,{category:'product_event',recordId:record,reason,active:true});
  await setRetentionHold(pool,{category:'product_event',recordId:record,reason:'security_incident',active:false});
  expect((await runRetentionBatch(pool)).productEvents).toBe(0);
  await expect(setRetentionHold(pool,{category:'product_event',recordId:record,reason:'unresolved_dispute',active:false})).rejects.toThrow('Retention hold is unavailable');
  await setRetentionHold(pool,{category:'product_event',recordId:record,reason:'legal_requirement',active:false});
  expect((await runRetentionBatch(pool)).productEvents).toBe(1);
 });

 it('serializes placing a hold with the retention worker before reporting success',async()=>{
  const record=await event('100 days','-10 days'),barrier=93436170;
  const observer=await pool.connect();let holding:Promise<void>|undefined,cleaning:ReturnType<typeof runRetentionBatch>|undefined;
  let cleaned=false;
  await observer.query('select pg_advisory_lock($1)',[barrier]);
  await observer.query(`create function app.retention_test_barrier() returns trigger language plpgsql as $$
   begin perform pg_advisory_xact_lock(${barrier}); return new; end $$;
   create trigger retention_test_barrier before insert on app.retention_holds for each row execute function app.retention_test_barrier()`);
  try{
   holding=setRetentionHold(pool,{category:'product_event',recordId:record,reason:'legal_requirement',active:true});
   const waitFor=async(fragment:string)=>{
    for(let attempt=0;attempt<200;attempt++){
     const waiting=(await observer.query(`select exists(select 1 from pg_stat_activity where datname=current_database()
      and pid<>pg_backend_pid() and query like $1 and wait_event='advisory') as waiting`,[`%${fragment}%`])).rows[0].waiting;
     if(waiting)return true;if(cleaned)return false;await new Promise(resolve=>setTimeout(resolve,10));
    }return false;
   };
   expect(await waitFor('insert into app.retention_holds')).toBe(true);
   cleaning=runRetentionBatch(pool).then(result=>{cleaned=true;return result;});
   expect(await waitFor('app.run_retention_batch')).toBe(true);
  }finally{
   await observer.query('select pg_advisory_unlock($1)',[barrier]);
   await holding;await cleaning;
   await observer.query('drop trigger retention_test_barrier on app.retention_holds; drop function app.retention_test_barrier()');
   observer.release();
  }
  expect((await pool.query('select 1 from app.product_events where public_id=$1',[record])).rowCount).toBe(1);
  expect((await pool.query('select 1 from app.retention_holds where record_id=$1 and released_at is null',[record])).rowCount).toBe(1);
 });

 it('allows the constrained administrative role to hold all five categories without superuser or RLS bypass',async()=>{
  const login='continuity_retention_hold_test',password=randomBytes(32).toString('hex');
  const quoted=(await pool.query('select quote_ident($1) as name,quote_literal($2) as password',[login,password])).rows[0];
  if(!(await pool.query('select 1 from pg_roles where rolname=$1',[login])).rowCount)
   await pool.query(`create role ${quoted.name} login nosuperuser inherit nobypassrls password ${quoted.password}`);
  else await pool.query(`alter role ${quoted.name} login nosuperuser inherit nobypassrls password ${quoted.password}`);
  await pool.query(`grant continuity_recovery_service to ${quoted.name}`);
  const url=new URL(databaseUrl);url.username=login;url.password=password;
  const constrained=createPool(loadConfig({NODE_ENV:'test',DATABASE_URL:url.href}));
  configureRecoveryPool(constrained,{async publish(){}});
  try{
   expect((await constrained.query('select rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0]).toEqual({rolsuper:false,rolbypassrls:false});
   const records:Record<string,string>={product_event:await event('1 day','89 days'),legal_acceptance:await receipt(false,'1 year')};
   records.audit_event=(await pool.query("insert into app.audit_events(planner_id,actor_type,action,resource_type) values($1,'system','synthetic','hold_fixture') returning public_id",[owner])).rows[0].public_id;
   records.closed_payment=(await pool.query("insert into app.closed_account_payment_records(deletion_public_id,records) values($1,'{}') returning deletion_public_id",[randomUUID()])).rows[0].deletion_public_id;
   records.deletion_receipt=(await pool.query("insert into app.account_deletions(receipt_hash,status,completed_at) values($1,'completed',now()) returning public_id",[randomBytes(32)])).rows[0].public_id;
   for(const [category,recordId] of Object.entries(records)){
    await setRetentionHold(constrained,{category,recordId,reason:'security_incident',active:true});
    expect((await pool.query('select 1 from app.retention_holds where record_id=$1 and released_at is null',[recordId])).rowCount).toBe(1);
    await setRetentionHold(constrained,{category,recordId,reason:'security_incident',active:false});
   }
  }finally{await constrained.end();await pool.query(`drop role ${quoted.name}`);}
 });
});
