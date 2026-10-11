import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {executeMaintenance} from './core.mjs';

const config={environment:'production',source:'rillora-production',sourceHost:'production.internal',cluster:'rillora',
  migrationTask:'migration-reviewed:1',recoveryTask:'recovery-reviewed:1',subnets:['owned-subnet'],migrationSecurityGroup:'sg-migrate',
  recoveryTaskSecurityGroup:'sg-recovery-task',recoveryDatabaseSecurityGroup:'sg-quarantine',sourceDatabaseSecurityGroup:'sg-live',
  vpc:'owned-vpc',subnetGroup:'private-subnets',parameterGroup:'verified-tls',sourceService:'rillora-api'};
const run='abcdef0123456789',runToken='x'.repeat(43);
const ownerTags=[['Project','Rillora'],['Environment','RecoveryDrill'],['RecoveryRun',run],
  ['RecoveryAuthorization',createHash('sha256').update(runToken).digest('hex')]].map(([Key,Value])=>({Key,Value}));
function fixture(){
  const writes=[];
  const snapshot={DBSnapshotIdentifier:`rillora-production-recovery-${run}`,DBInstanceIdentifier:'rillora-production',Encrypted:true,
    Status:'available',SnapshotCreateTime:new Date().toISOString(),TagList:ownerTags};
  let database=null;
  const call=async(service,operation,input)=>{
    if(operation==='snapshot')return snapshot;
    if(operation==='database')return database;
    if(operation==='service')return {desiredCount:0,runningCount:0,pendingCount:0};
    writes.push({service,operation,input});return {tasks:[{taskArn:'fixture-task'}]};
  };
  return {call,writes,snapshot,setDatabase:value=>{database=value;}};
}
function task(){return {cluster:config.cluster,taskDefinition:config.migrationTask,launchType:'FARGATE',clientToken:'a'.repeat(32),
  networkConfiguration:{awsvpcConfiguration:{subnets:config.subnets,securityGroups:[config.migrationSecurityGroup],assignPublicIp:'ENABLED'}},
  overrides:{containerOverrides:[{name:'Maintenance',command:['/bin/sh','-c','node dist/migrate.js && node dist/bootstrap-runtime.js && node dist/migrate-private-content.js --enforce'],
    environment:[{name:'RECOVERY_RUN',value:run}]}]}};}

test('allows a fixed migration but rejects raw command, role, secret and network overrides before RunTask',async()=>{
  const good=fixture();await executeMaintenance({operation:'task',run,runToken,request:task()},good.call,config);
  assert.equal(good.writes.length,1);
  for(const mutate of [r=>r.overrides.containerOverrides[0].command=['node','-e','process.exit(0)'],
    r=>r.overrides.taskRoleArn='another-role',r=>r.taskDefinition='another-definition',
    r=>r.overrides.containerOverrides[0].environment.push({name:'DATABASE_PASSWORD',value:'synthetic'}),
    r=>r.networkConfiguration.awsvpcConfiguration.securityGroups=['sg-live'],r=>r.cluster='fanpass']){
    const f=fixture(),request=task();mutate(request);
    await assert.rejects(executeMaintenance({operation:'task',run,runToken,request},f.call,config));assert.equal(f.writes.length,0);
  }
});
test('a copied public run tag or authorization hash cannot delete another recovery run',async()=>{
  for(const token of ['y'.repeat(43),ownerTags.at(-1).Value]){
    const f=fixture();await assert.rejects(executeMaintenance({operation:'cleanup',run,runToken:token},f.call,config));assert.equal(f.writes.length,0);
  }
  const f=fixture();await executeMaintenance({operation:'cleanup',run,runToken},f.call,config);
  assert.equal(f.writes[0].operation,'deleteSnapshot');assert.equal(f.writes[0].input.DBSnapshotIdentifier,`rillora-production-recovery-${run}`);
});
test('restore constructs the private quarantine network from broker configuration',async()=>{
  const f=fixture();await executeMaintenance({operation:'restore',run,runToken},f.call,config);
  assert.equal(f.writes[0].input.PubliclyAccessible,false);
  assert.deepEqual(f.writes[0].input.VpcSecurityGroupIds,['sg-quarantine']);
  await assert.rejects(executeMaintenance({operation:'restore',run,runToken,network:'sg-live'},fixture().call,config));
});
test('staging accepts only its default reviewed migration',async()=>{
  const f=fixture(),staging={...config,environment:'staging'};
  await executeMaintenance({operation:'migrate',clientToken:'b'.repeat(32)},f.call,staging);
  assert.equal(f.writes[0].input.overrides,undefined);
  await assert.rejects(executeMaintenance({operation:'migrate',clientToken:'b'.repeat(32),command:'arbitrary'},fixture().call,staging));
});
