import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { parseRecoveryControl, type RecoveryControl } from './recovery-journal.js';

export type RecoveryCoverage={version:1;startedAt:string;databaseGeneration?:string};
export function validateRecoveryWindow(snapshotTime:string,coverage:RecoveryCoverage,clock=Date.now()):void{
 const snapshot=Date.parse(snapshotTime),start=Date.parse(coverage.startedAt);
 if(coverage.version!==1||!Number.isFinite(snapshot)||!Number.isFinite(start)||snapshot<start||snapshot>clock||clock-snapshot>35*86400_000){
  throw new Error('Snapshot is outside independently journaled recovery coverage');
 }
}

export async function readRecoveryJournal(table:string,client=new DynamoDBClient({region:'eu-central-1',maxAttempts:3})){
 const events:RecoveryControl[]=[];let coverage:RecoveryCoverage|null=null;
 let cursor:Record<string,any>|undefined;
 do{
  const page=await client.send(new QueryCommand({TableName:table,KeyConditionExpression:'pk=:scope',
   ExpressionAttributeValues:{':scope':{S:'rillora-production'}},ConsistentRead:true,ExclusiveStartKey:cursor}));
  for(const item of page.Items??[]){
   if(item.sk?.S==='__coverage'){
    coverage=JSON.parse(item.payload?.S??'null') as RecoveryCoverage;
   }else{
    const e=parseRecoveryControl(JSON.parse(item.payload?.S??'null'));
    if(item.sk?.S!==e.key||item.revision?.N!==e.revision)throw new Error('Journal item metadata mismatch');
    events.push(e);
   }
  }
  if(events.length>100_000)throw new Error('Journal requires a bounded offline recovery review');
  cursor=page.LastEvaluatedKey;
 }while(cursor);
 if(!coverage)throw new Error('Journal coverage is missing');
 return {events,coverage};
}

export function validateRecoveryHost(host:string,sslVerified:boolean):void{
 if(!/^rillora-recovery-[a-f0-9]{16}\.[a-z0-9]+\.eu-central-1\.rds\.amazonaws\.com$/.test(host)||!sslVerified){
  throw new Error('Recovery writes require a verified-TLS isolated RDS clone');
 }
}

/** Only an isolated administrative clone connection may call this function. */
export async function replayRecoveryControls(pool:Pool,events:RecoveryControl[],expectedGeneration?:string):Promise<{applied:number;sessionsInvalidated:number}>{
 if(process.env.NODE_ENV!=='test'){
  if(!expectedGeneration)throw new Error('Independent recovery generation is required');
  const ssl=pool.options.ssl;validateRecoveryHost(pool.options.host??'',typeof ssl==='object'&&ssl.rejectUnauthorized===true);
 }
 const client=await pool.connect();
 try{
  await client.query('begin');
  const permission=await client.query("select pg_has_role(session_user,'continuity_recovery_service','member') as allowed");
  if(!permission.rows[0]?.allowed)throw new Error('Recovery replay requires the isolated administrative credential');
  if(expectedGeneration&&(await client.query('select generation from app.recovery_policy where singleton')).rows[0]?.generation!==expectedGeneration)throw new Error('Journal belongs to a different database generation');
  await client.query("select set_config('app.recovery_replay','true',true)");
  const checkpoints=new Map((await client.query('select entity_key,revision::text from app.recovery_controls')).rows.map(r=>[r.entity_key,BigInt(r.revision)]));
  const pending=events.map(parseRecoveryControl).filter(e=>BigInt(e.revision)>(checkpoints.get(e.key)??0n))
   .sort((a,b)=>BigInt(a.revision)<BigInt(b.revision)?-1:1);
  // All or nothing: external billing/control state must be reconciled before
  // traffic, not silently reset to the values in an old backup.
  if(pending.some(e=>e.kind==='unreconciled_access'))throw new Error('Post-snapshot entitlement changes require provider reconciliation');
  let applied=0;
  for(const event of pending){
   const facts=event.facts;
   if(event.kind==='retention_hold'){
    await client.query(`insert into app.retention_holds(public_id,category,record_id,reason_code,released_at)
     values($1,$2,$3,$4,case when $5 then null else now() end)
     on conflict(category,record_id,reason_code) do update set public_id=excluded.public_id,released_at=excluded.released_at`,
     [event.id,facts.category,facts.recordId,facts.reason,facts.active]);
   }else if(event.kind==='account'){
    const planner=(await client.query('select id::text,status from app.planners where public_id=$1',[event.id])).rows[0];
    if(planner){
     if(facts.deleted===true||facts.status==='deletion_pending'){
      let job=(await client.query('select public_id from app.account_deletions where planner_id=$1',[planner.id])).rows[0]?.public_id;
      if(!job){
       await client.query("update app.planners set status='active' where id=$1",[planner.id]);
       await client.query('set local role continuity_app');
       await client.query("select set_config('app.current_planner_id',$1,true)",[planner.id]);
       job=(await client.query('select app.request_account_deletion($1) as id',[randomBytes(32)])).rows[0].id;
       await client.query('reset role');
      }
      if(facts.deleted===true){
       // The durable terminal deletion proves the source already completed its
       // identity cleanup. Preserve snapshot financial records via the existing
       // erasure function, rather than raw-cascading that retention away.
       await client.query("update app.account_deletions set lease_until=null,next_attempt_at=now() where public_id=$1",[job]);
       await client.query('set local role continuity_auth');
       const claimed=(await client.query('select app.claim_account_deletion($1) as job',[job])).rows[0].job;
       if(!claimed)throw new Error('Restored deletion job could not be reclaimed');
       const finished=(await client.query('select app.finish_account_deletion($1,$2,true) as finished',[job,claimed.leaseToken])).rows[0].finished;
       if(!finished)throw new Error('Restored account erasure did not complete');
       await client.query('reset role');
      }
     }else if(['locked','closed'].includes(String(facts.status))){
      await client.query('update app.planners set status=$2 where id=$1',[planner.id,facts.status]);
     }
    }
   }else if(event.kind==='connection'){
    const connection=(await client.query(`select c.id::text,c.status,p.public_id as recipient from app.sharing_connections c
     left join app.planners p on p.id=c.recipient_planner_id where c.public_id=$1`,[event.id])).rows[0];
    if(connection){
     if(facts.deleted===true||facts.status!=='accepted'||connection.status!=='accepted'||facts.recipient!==connection.recipient){
      await client.query("update app.sharing_connections set status='revoked',revoked_at=coalesce(revoked_at,now()),version=version+1 where id=$1",[connection.id]);
     }else{
      const grants=facts.grants as {matter:string;level:string}[];
      if(!Array.isArray(grants)||grants.some(g=>!['name','directions','details'].includes(g.level)))throw new Error('Invalid journal grant ceiling');
      await client.query(`delete from app.sharing_grants g using app.matter_items m where g.connection_id=$1 and m.id=g.matter_item_id
       and not exists(select 1 from jsonb_to_recordset($2::jsonb) x(matter uuid,level text) where x.matter=m.public_id)`,[connection.id,JSON.stringify(grants)]);
      await client.query(`update app.sharing_grants g set detail_level=x.level from app.matter_items m,
       jsonb_to_recordset($2::jsonb) x(matter uuid,level text) where g.connection_id=$1 and m.id=g.matter_item_id and m.public_id=x.matter
       and array_position(array['name','directions','details'],x.level)<array_position(array['name','directions','details'],g.detail_level)`,[connection.id,JSON.stringify(grants)]);
     }
    }
   }else if(event.kind==='matter'){
    if(facts.deleted===true)await client.query('delete from app.matter_items where public_id=$1',[event.id]);
    else if(facts.archived===true||facts.private===true)await client.query(`update app.matter_items set
     archived_at=case when $2 then coalesce(archived_at,now()) else archived_at end,
     desired_outcome=case when $3 then 'never_disclose' else desired_outcome end,version=version+1 where public_id=$1`,[event.id,facts.archived===true,facts.private===true]);
   }else if(event.kind==='person'){
    if(facts.deleted===true)await client.query('delete from app.people where public_id=$1',[event.id]);
    else if(facts.restricted===true)await client.query("update app.people set status='archived',archived_at=coalesce(archived_at,now()),version=version+1 where public_id=$1",[event.id]);
   }else if(event.kind==='free_slot'){
    await client.query(`update app.sharing_preferences f set free_connection_id=null,version=f.version+1 from app.planners p
     where p.id=f.planner_id and p.public_id=$1 and f.free_connection_id is not null
     and not exists(select 1 from app.sharing_connections c where c.id=f.free_connection_id and c.public_id=$2::uuid)`,[event.id,facts.connection??null]);
   }
   await client.query(`insert into app.recovery_controls(entity_key,kind,entity_public_id,revision,published)
    values($1,$2,$3,$4,true) on conflict(entity_key) do update set revision=excluded.revision,published=true`,[event.key,event.kind,event.id,event.revision]);
   applied++;
  }
  const invalidated=await client.query('delete from app.auth_sessions');
  await client.query('delete from app.auth_transactions');
  await client.query('delete from app.sharing_handoffs');
  await client.query("update app.recipient_rehearsals set status='revoked',revoked_at=coalesce(revoked_at,now()) where status<>'revoked'");
  await client.query("update app.sharing_connections set invitation_expires_at=least(invitation_expires_at,now()-interval '1 second') where status='pending'");
  // The clone has no live readers. Purge orphaned ciphertext now rather than
  // relying on the normal reader grace period or the planner returning later.
  await client.query('set local role continuity_content_service');
  const owners=(await client.query('select distinct planner_id::text from app.private_content_values')).rows;
  for(const owner of owners)await client.query(`with used as materialized(select app.content_used_references($1::bigint) as id)
   delete from app.private_content_values v where v.planner_id=$1 and not exists(select 1 from used where used.id=v.public_id)`,[owner.planner_id]);
  await client.query('reset role');
  const maximum=events.reduce((max,e)=>BigInt(e.revision)>max?BigInt(e.revision):max,1n);
  await client.query("select setval('app.recovery_revision_seq',greatest($1::bigint,(select last_value from app.recovery_revision_seq)))",[maximum.toString()]);
  await client.query('commit');
  return {applied,sessionsInvalidated:invalidated.rowCount??0};
 }catch(error){await client.query('rollback');throw error;}finally{client.release();}
}
