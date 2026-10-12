import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {executeMaintenance} from './core.mjs';

const config={environment:'production',source:'rillora-production',sourceHost:'production.internal',cluster:'rillora',
  migrationTask:'migration-reviewed:1',recoveryTask:'recovery-reviewed:1',subnets:['owned-subnet'],migrationSecurityGroup:'sg-migrate',
  recoveryTaskSecurityGroup:'sg-recovery-task',recoveryDatabaseSecurityGroup:'sg-quarantine',sourceDatabaseSecurityGroup:'sg-live',
  vpc:'owned-vpc',subnetGroup:'private-subnets',parameterGroup:'verified-tls',sourceServices:['rillora-api','rillora-deletion']};
const run='abcdef0123456789',runToken='x'.repeat(43);
const ownerTags=[['Project','Rillora'],['Environment','RecoveryDrill'],['RecoveryRun',run],
  ['RecoveryAuthorization',createHash('sha256').update(runToken).digest('hex')]].map(([Key,Value])=>({Key,Value}));
function fixture(){
  const writes=[],serviceReads=[],serviceStates={};
  const snapshot={DBSnapshotIdentifier:`rillora-production-recovery-${run}`,DBInstanceIdentifier:'rillora-production',Encrypted:true,
    Status:'available',SnapshotCreateTime:new Date().toISOString(),TagList:ownerTags};
  let database=null;
  const call=async(service,operation,input)=>{
    if(operation==='snapshot')return snapshot;
    if(operation==='database')return database;
    if(operation==='service'){
      serviceReads.push(input.service);
      return {serviceName:input.service,desiredCount:0,runningCount:0,pendingCount:0,...serviceStates[input.service]};
    }
    writes.push({service,operation,input});return {tasks:[{taskArn:'fixture-task'}]};
  };
  return {call,writes,snapshot,serviceReads,serviceStates,setDatabase:value=>{database=value;}};
}
function task(){return {cluster:config.cluster,taskDefinition:config.migrationTask,launchType:'FARGATE',clientToken:'a'.repeat(32),
  networkConfiguration:{awsvpcConfiguration:{subnets:config.subnets,securityGroups:[config.migrationSecurityGroup],assignPublicIp:'ENABLED'}},
  overrides:{containerOverrides:[{name:'Maintenance',command:['/bin/sh','-c','node dist/migrate.js && node dist/bootstrap-runtime.js && node dist/migrate-private-content.js --enforce && node dist/migrate-email-matches.js'],
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

test('the actual Python migration caller produces a request accepted by the real broker',async()=>{
  const result=spawnSync('python3',['-c',`
import json,sys
from datetime import timedelta
sys.path.insert(0,sys.argv[1])
from test_recovery_task_retry import RecoveryTaskRetryTests,Provider
case=RecoveryTaskRetryTests(); state=case.fixture(timedelta(minutes=1)); state['maintenanceTasks']={}
provider=Provider(); case.invoke(state,provider)
print(json.dumps(provider.writes[0]))
`,fileURLToPath(new URL('../release/',import.meta.url))],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const request=JSON.parse(result.stdout),f=fixture();
  const callerConfig={...config,cluster:'fixture-cluster',migrationTask:'migration:1',subnets:['subnet-fixture'],migrationSecurityGroup:'sg-migration'};
  await executeMaintenance({operation:'task',run,runToken,request},f.call,callerConfig);
  assert.equal(f.writes.length,1);
  assert.match(request.overrides.containerOverrides[0].command[2],/migrate-email-matches\.js$/);
});

function recoveryRequest(f){
  f.setDatabase({DBInstanceIdentifier:`rillora-recovery-${run}`,DBInstanceStatus:'available',PubliclyAccessible:false,
    StorageEncrypted:true,DBSubnetGroup:{VpcId:config.vpc},VpcSecurityGroups:[{VpcSecurityGroupId:config.recoveryDatabaseSecurityGroup}],
    Endpoint:{Address:'clone.internal'},TagList:ownerTags});
  const request=task();request.taskDefinition=config.recoveryTask;
  request.networkConfiguration.awsvpcConfiguration.securityGroups=[config.recoveryTaskSecurityGroup];
  const container=request.overrides.containerOverrides[0];
  container.command=['node','dist/recovery-commerce-admin.js'];
  container.environment.push({name:'DATABASE_HOST',value:'clone.internal'},
    {name:'RECOVERY_SNAPSHOT_TIME',value:f.snapshot.SnapshotCreateTime},
    {name:'RECOVERY_SOURCE_FROZEN_AT',value:new Date().toISOString()});
  return request;
}

test('recovery refuses any active source writer, including a deletion-only worker',async()=>{
  for(const name of config.sourceServices){
    for(const count of ['desiredCount','runningCount','pendingCount']){
      const f=fixture();f.serviceStates[name]={[count]:1};
      await assert.rejects(executeMaintenance({operation:'task',run,runToken,request:recoveryRequest(f)},f.call,config),/source writers/);
      assert.equal(f.writes.length,0);
    }
  }
  const good=fixture();
  await executeMaintenance({operation:'task',run,runToken,request:recoveryRequest(good)},good.call,config);
  assert.deepEqual(good.serviceReads,config.sourceServices);assert.equal(good.writes.length,1);
});

test('recovery fails closed without a complete valid source service configuration',async()=>{
  for(const sourceServices of [undefined,[],['rillora-api','rillora-api']]){
    const f=fixture();
    await assert.rejects(executeMaintenance({operation:'task',run,runToken,request:recoveryRequest(f)},f.call,{...config,sourceServices}),/source services/);
    assert.equal(f.writes.length,0);
  }
});

test('only exact stack-reviewed read-only audit bytes run in either environment',async()=>{
  const scripts=['probe_security_rollout.mjs','probe_security_authority.mjs'].map(name=>readFileSync(new URL('../release/'+name,import.meta.url),'utf8'));
  const audited={...config,securityAuditScriptSha256:createHash('sha256').update(scripts[0]).digest('hex'),
    securityAuthorityScriptSha256:createHash('sha256').update(scripts[1]).digest('hex')};
  for(const script of scripts){
  for(const environment of ['production','staging']){
    const good=fixture(),settings={...audited,environment};
    const request=task();request.overrides.containerOverrides[0].command=['node','--input-type=module','-e',script];
    const input=environment==='staging'?{operation:'audit',clientToken:'c'.repeat(32),script}:{operation:'task',run,runToken,request};
    await executeMaintenance(input,good.call,settings);assert.equal(good.writes.length,1);
    assert.ok(Buffer.byteLength(JSON.stringify(good.writes[0].input.overrides))<=8192,'ECS container overrides must stay bounded');
    for(const text of [script+'\nprocess.exit(0)', 'console.log(process.env)']){
      const bad=structuredClone(input),f=fixture();
      if(environment==='staging')bad.script=text;else bad.request.overrides.containerOverrides[0].command[3]=text;
      await assert.rejects(executeMaintenance(bad,f.call,settings));assert.equal(f.writes.length,0);
    }
  }
  }
});
