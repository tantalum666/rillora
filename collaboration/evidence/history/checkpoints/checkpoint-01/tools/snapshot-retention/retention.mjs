const day=86400000;
const instant=value=>value instanceof Date?value.getTime():Date.parse(value);
const held=tags=>tags.RilloraLegalHold!==undefined&&tags.RilloraLegalHold!=='false';
export function validateSnapshotPolicy(policy){
 if(policy?.schemaVersion!==1||policy.account!=='133857166372'||policy.region!=='eu-central-1'
  ||!Array.isArray(policy.snapshots)||!policy.snapshots.length||policy.snapshots.length>20)throw Error('Invalid snapshot policy');
 const seen=new Set();
 for(const s of policy.snapshots){
  if(!/^rillora-[a-z0-9-]+$/.test(s.id)||seen.has(s.id)||s.arn!==`arn:aws:rds:eu-central-1:133857166372:snapshot:${s.id}`
   ||!/^rillora[a-z0-9-]+$/.test(s.database)||!Number.isFinite(Date.parse(s.createdAt))
   ||Date.parse(s.retireAfter)-Date.parse(s.createdAt)!==90*day)throw Error('Invalid snapshot boundary');
  seen.add(s.id);
 }
 return policy;
}

/** Provider metadata only. No database connection, secret, snapshot export or
 * arbitrary event-selected resource. Deletion remains an asynchronous request. */
export async function retireSnapshots(policy,provider,{now=Date.now(),allowDelete=false}={}){
 validateSnapshotPolicy(policy);const results=[];
 for(const expected of policy.snapshots){
  try{
   const s=await provider.snapshot(expected.id);
   if(!s){results.push({id:expected.id,state:'absent',overdue:false});continue;}
   if(s.DBSnapshotArn!==expected.arn||s.DBInstanceIdentifier!==expected.database||s.SnapshotType!=='manual'
    ||s.Encrypted!==true||instant(s.SnapshotCreateTime)!==Date.parse(expected.createdAt))throw Error('snapshot_boundary');
   if(s.Status==='deleting'){results.push({id:expected.id,state:'deletion_pending',overdue:now>Date.parse(expected.retireAfter)+day});continue;}
   if(s.Status!=='available')throw Error('snapshot_unavailable');
   const due=now>=Date.parse(expected.retireAfter);
   const tags=await provider.tags(expected.arn);
   if(held(tags)){results.push({id:expected.id,state:'held',overdue:false});continue;}
   if(!due){results.push({id:expected.id,state:'retained_until_due',overdue:false,retireAfter:expected.retireAfter});continue;}
   if(tags.RilloraRetirementManaged!=='true'||tags.RilloraRetireAfter!==expected.retireAfter){
    results.push({id:expected.id,state:'unmanaged',overdue:true});continue;
   }
   const db=await provider.database(expected.database);
   const latest=instant(db?.LatestRestorableTime);
   if(db?.DBInstanceIdentifier!==expected.database||db.DBInstanceStatus!=='available'||db.StorageEncrypted!==true
    ||!(db.BackupRetentionPeriod>=1)||!Number.isFinite(latest)||latest>now||now-latest>day){
    results.push({id:expected.id,state:'current_backup_unverified',overdue:true});continue;
   }
   // Recheck the hold at the last moment. IAM independently requires the managed
   // tag, forbids an active hold and enforces the fixed not-before timestamp.
   const current=await provider.tags(expected.arn);
   if(held(current)){results.push({id:expected.id,state:'held',overdue:false});continue;}
   if(current.RilloraRetirementManaged!=='true'||current.RilloraRetireAfter!==expected.retireAfter)throw Error('policy_changed');
   if(!allowDelete){results.push({id:expected.id,state:'eligible_dry_run',overdue:true});continue;}
   await provider.remove(expected.id);
   results.push({id:expected.id,state:'deletion_requested',overdue:false});
  }catch(error){results.push({id:expected.id,state:'check_failed',overdue:now>=Date.parse(expected.retireAfter),
    reason:['snapshot_boundary','snapshot_unavailable','policy_changed'].includes(error?.message)?error.message:'provider_metadata_unavailable'});}
 }
 return {results,failed:results.filter(r=>r.state==='check_failed').length,overdue:results.filter(r=>r.overdue).length,
  deletedConfirmed:results.filter(r=>r.state==='absent').length,deletionRequested:results.filter(r=>r.state==='deletion_requested').length};
}
