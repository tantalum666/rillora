import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retireSnapshots,validateSnapshotPolicy} from './retention.mjs';
const policy=JSON.parse(readFileSync(new URL('../../config/manual-snapshot-retention.json',import.meta.url),'utf8'));
const entry=policy.snapshots[0],due=Date.parse(entry.retireAfter)+1000;
function fixture(){
 const state={deleted:[],snapshot:{DBSnapshotArn:entry.arn,DBSnapshotIdentifier:entry.id,DBInstanceIdentifier:entry.database,
  SnapshotCreateTime:entry.createdAt,SnapshotType:'manual',Encrypted:true,Status:'available'},
  tags:{RilloraRetirementManaged:'true',RilloraRetireAfter:entry.retireAfter},
  database:{DBInstanceIdentifier:entry.database,DBInstanceStatus:'available',StorageEncrypted:true,BackupRetentionPeriod:7,LatestRestorableTime:new Date(due-10000)}};
 const provider={snapshot:async()=>state.snapshot,tags:async()=>state.tags,database:async()=>state.database,remove:async id=>state.deleted.push(id)};
 return {state,provider};
}
test('never deletes before the pinned90day deadline or from a dry run',async()=>{
 const {state,provider}=fixture();
 assert.equal((await retireSnapshots(policy,provider,{now:Date.parse(entry.createdAt)+86400000,allowDelete:true})).results[0].state,'retained_until_due');
 assert.equal((await retireSnapshots(policy,provider,{now:due})).results[0].state,'eligible_dry_run');assert.deepEqual(state.deleted,[]);
});
test('preserves the milliseconds in real AWS SDK Date values when validating the pinned snapshot',async()=>{
 const {state,provider}=fixture();state.snapshot.SnapshotCreateTime=new Date(entry.createdAt);
 assert.equal((await retireSnapshots(policy,provider,{now:Date.parse(entry.createdAt)+86400000,allowDelete:true})).results[0].state,'retained_until_due');
 state.snapshot.SnapshotCreateTime=new Date(Date.parse(entry.createdAt)+1);
 const result=await retireSnapshots(policy,provider,{now:Date.parse(entry.createdAt)+86400000,allowDelete:true});
 assert.equal(result.failed,1);assert.equal(result.overdue,0);assert.equal(state.deleted.length,0);
});
test('deletes only the exact due managed snapshot with a healthy current recovery window',async()=>{
 const {state,provider}=fixture();const report=await retireSnapshots(policy,provider,{now:due,allowDelete:true});
 assert.equal(report.deletionRequested,1);assert.equal(report.deletedConfirmed,0);assert.deepEqual(state.deleted,[entry.id]);
 state.snapshot=null;assert.equal((await retireSnapshots(policy,provider,{now:due,allowDelete:true})).results[0].state,'absent');assert.equal(state.deleted.length,1);
});
test('preserves holds, changed resources and a missing or stale current backup',async()=>{
 for(const change of [f=>f.state.tags.RilloraLegalHold='true',f=>delete f.state.tags.RilloraRetirementManaged,
  f=>f.state.snapshot.DBInstanceIdentifier='fanpass',f=>f.state.snapshot.SnapshotCreateTime=new Date(),
  f=>f.state.database.BackupRetentionPeriod=0,f=>f.state.database.LatestRestorableTime=new Date(due-2*86400000),
  f=>f.state.database.DBInstanceStatus='deleting',f=>f.state.snapshot.Encrypted=false]){
  const f=fixture();change(f);await retireSnapshots(policy,f.provider,{now:due,allowDelete:true});assert.equal(f.state.deleted.length,0);
 }
});
test('rechecks a newly placed hold immediately before deletion',async()=>{
 const f=fixture();let reads=0;f.provider.tags=async()=>({...f.state.tags,...(++reads===2?{RilloraLegalHold:'true'}:{})});
 assert.equal((await retireSnapshots(policy,f.provider,{now:due,allowDelete:true})).results[0].state,'held');assert.equal(f.state.deleted.length,0);
});
test('treats misspelled or unknown hold values as a hold',async()=>{
 for(const hold of ['True','yes','0','']){
  const f=fixture();f.state.tags.RilloraLegalHold=hold;
  assert.equal((await retireSnapshots(policy,f.provider,{now:due,allowDelete:true})).results[0].state,'held');assert.equal(f.state.deleted.length,0);
 }
});
test('rejects a foreign account, unknown resource or shortened retention policy',()=>{
 for(const p of [{...policy,account:'000000000000'},{...policy,snapshots:[{...entry,id:'fanpass-backup'}]},
  {...policy,snapshots:[{...entry,retireAfter:entry.createdAt}]},{...policy,snapshots:[{...entry,arn:entry.arn.replace('eu-central-1','us-east-1')}]}])
  assert.throws(()=>validateSnapshotPolicy(p));
});
