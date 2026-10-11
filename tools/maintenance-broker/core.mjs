import { createHash, timingSafeEqual } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

const assert=(condition,reason)=>{if(!condition)throw new Error(`Maintenance request refused: ${reason}`);};
const hash=value=>createHash('sha256').update(value).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
function exact(value,keys){assert(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>keys.includes(k)),'unsupported fields');}
const tags=resource=>Object.fromEntries((resource.TagList??[]).map(t=>[t.Key,t.Value]));
function identity(input){
  assert(/^[a-f0-9]{16}$/.test(input.run??''),'run identity');
  assert(/^[A-Za-z0-9_-]{43}$/.test(input.runToken??''),'run capability');
  return {run:input.run,target:`rillora-recovery-${input.run}`,snapshot:`rillora-production-recovery-${input.run}`,
    tags:[{Key:'Project',Value:'Rillora'},{Key:'Environment',Value:'RecoveryDrill'},
      {Key:'RecoveryRun',Value:input.run},{Key:'RecoveryAuthorization',Value:hash(input.runToken)}]};
}
function owned(resource,id,input){
  const values=tags(resource);
  assert(values.Project==='Rillora'&&values.Environment==='RecoveryDrill'&&values.RecoveryRun===id.run
    &&equal(values.RecoveryAuthorization,hash(input.runToken)),'resource ownership');
}
function targetSafe(database,id,input,config){
  owned(database,id,input);
  assert(database.DBInstanceIdentifier===id.target&&database.PubliclyAccessible===false&&database.StorageEncrypted===true
    &&database.DBSubnetGroup?.VpcId===config.vpc
    &&database.VpcSecurityGroups?.length===1&&database.VpcSecurityGroups[0].VpcSecurityGroupId===config.recoveryDatabaseSecurityGroup,
    'quarantined database');
}
async function snapshotFor(call,id,input,config){
  const snapshot=await call('rds','snapshot',id.snapshot);
  if(snapshot){owned(snapshot,id,input);assert(snapshot.DBSnapshotIdentifier===id.snapshot&&snapshot.DBInstanceIdentifier===config.source&&snapshot.Encrypted===true,'snapshot source');}
  return snapshot;
}

/** Only this fixed broker holds RunTask/PassRole and recovery mutation authority. */
export async function executeMaintenance(input,call,config,clock=Date.now){
  assert(Buffer.byteLength(JSON.stringify(input))<=64*1024,'request size');
  if(config.environment==='staging'){
    exact(input,['operation','clientToken']);
    assert(input.operation==='migrate'&&/^[a-f0-9]{32}$/.test(input.clientToken??''),'staging operation');
    return call('ecs','run',{cluster:config.cluster,taskDefinition:config.migrationTask,launchType:'FARGATE',clientToken:input.clientToken,
      networkConfiguration:{awsvpcConfiguration:{subnets:config.subnets,securityGroups:[config.migrationSecurityGroup],assignPublicIp:'ENABLED'}}});
  }
  exact(input,['operation','run','runToken','request']);
  assert(config.environment==='production'&&config.source==='rillora-production'
    &&config.recoveryDatabaseSecurityGroup!==config.sourceDatabaseSecurityGroup,'production configuration');
  const id=identity(input);
  if(input.operation==='snapshot'){
    const prior=await snapshotFor(call,id,input,config);if(prior)return {snapshot:prior};
    const source=await call('rds','database',config.source);
    assert(source?.DBInstanceStatus==='available'&&source.PubliclyAccessible===false&&source.StorageEncrypted===true
      &&source.DeletionProtection===true&&source.BackupRetentionPeriod>=7&&tags(source).Project==='Rillora'
      &&tags(source).Environment==='Production','source protection');
    return {snapshot:await call('rds','createSnapshot',{DBInstanceIdentifier:config.source,DBSnapshotIdentifier:id.snapshot,Tags:id.tags})};
  }
  if(input.operation==='restore'){
    const snapshot=await snapshotFor(call,id,input,config);assert(snapshot?.Status==='available','available snapshot');
    const prior=await call('rds','database',id.target);if(prior){targetSafe(prior,id,input,config);return {database:prior};}
    return {database:await call('rds','restore',{DBInstanceIdentifier:id.target,DBSnapshotIdentifier:id.snapshot,
      DBInstanceClass:'db.t4g.micro',DBSubnetGroupName:config.subnetGroup,DBParameterGroupName:config.parameterGroup,
      OptionGroupName:'default:postgres-16',VpcSecurityGroupIds:[config.recoveryDatabaseSecurityGroup],PubliclyAccessible:false,
      MultiAZ:false,DeletionProtection:false,CopyTagsToSnapshot:true,Tags:id.tags})};
  }
  if(input.operation==='cleanup'){
    const database=await call('rds','database',id.target);
    if(database){
      targetSafe(database,id,input,config);assert(database.DeletionProtection===false,'deletion protection');
      if(database.DBInstanceStatus!=='deleting')await call('rds','deleteDatabase',{DBInstanceIdentifier:id.target,SkipFinalSnapshot:true,DeleteAutomatedBackups:true});
      return {stage:'cleanup_waiting_for_target_removal'};
    }
    const snapshot=await snapshotFor(call,id,input,config);
    if(snapshot){if(snapshot.Status!=='deleting')await call('rds','deleteSnapshot',{DBSnapshotIdentifier:id.snapshot});return {stage:'cleanup_waiting_for_snapshot_removal'};}
    return {stage:'cleaned'};
  }
  assert(input.operation==='task','operation');
  const request=input.request;exact(request,['cluster','taskDefinition','launchType','clientToken','networkConfiguration','overrides']);
  assert(request.cluster===config.cluster&&request.launchType==='FARGATE'&&/^[a-f0-9]{32}$/.test(request.clientToken??''),'task scope');
  exact(request.overrides,['containerOverrides']);
  assert(request.overrides.containerOverrides?.length===1,'one container');
  const container=request.overrides.containerOverrides[0];exact(container,['name','command','environment']);
  assert(container.name==='Maintenance'&&Array.isArray(container.command)&&Array.isArray(container.environment),'container shape');
  const values={};for(const pair of container.environment){exact(pair,['name','value']);assert(typeof pair.name==='string'&&typeof pair.value==='string'&&!(pair.name in values),'environment');values[pair.name]=pair.value;}
  assert(values.RECOVERY_RUN===id.run,'task run identity');
  const command=container.command;let operation;
  if(JSON.stringify(command)===JSON.stringify(['/bin/sh','-c','node dist/migrate.js && node dist/bootstrap-runtime.js && node dist/migrate-private-content.js --enforce']))operation='migrate';
  else if(command.length===3&&command[0]==='node'&&command[1]==='dist/recovery-admin.js'
    &&['initialize','seed','after-snapshot','restore','cleanup-fixtures'].includes(command[2]))operation=command[2];
  else if(JSON.stringify(command)===JSON.stringify(['node','dist/recovery-commerce-admin.js']))operation='reconcile-commerce';
  else if(command.length===4&&command[0]==='node'&&command[1]==='--input-type=module'&&command[2]==='-e'
    &&typeof command[3]==='string'&&hash(command[3])===config.isolationScriptSha256)operation='isolation';
  assert(operation,'fixed reviewed command');
  const recovery=['restore','reconcile-commerce','isolation'].includes(operation);
  assert(request.taskDefinition===(recovery?config.recoveryTask:config.migrationTask),'exact task definition');
  const allowed=['RECOVERY_RUN'];
  if(['restore','reconcile-commerce','after-snapshot','cleanup-fixtures','isolation'].includes(operation)){
    const snapshot=await snapshotFor(call,id,input,config);assert(snapshot?.Status==='available','owned available snapshot');
    if(['restore','reconcile-commerce'].includes(operation)){
      const target=await call('rds','database',id.target);assert(target?.DBInstanceStatus==='available','available clone');targetSafe(target,id,input,config);
      assert(values.DATABASE_HOST===target.Endpoint?.Address&&Date.parse(values.RECOVERY_SNAPSHOT_TIME)===new Date(snapshot.SnapshotCreateTime).getTime(),'server-selected clone');
      allowed.push('DATABASE_HOST','RECOVERY_SNAPSHOT_TIME');
    }
  }
  if(operation==='isolation'){assert(values.RECOVERY_SOURCE_HOST===config.sourceHost,'source host');allowed.push('RECOVERY_SOURCE_HOST');}
  if(operation==='reconcile-commerce'){
    assert(config.sourceService,'source service');const service=await call('ecs','service',{cluster:config.cluster,service:config.sourceService});
    assert(service?.desiredCount===0&&service.runningCount===0&&service.pendingCount===0,'source writers are not frozen');
    const frozen=Date.parse(values.RECOVERY_SOURCE_FROZEN_AT);
    assert(Number.isFinite(frozen)&&clock()>=frozen&&clock()-frozen<8*60_000,'fresh source-freeze evidence');allowed.push('RECOVERY_SOURCE_FROZEN_AT');
  }
  assert(Object.keys(values).length===allowed.length&&allowed.every(name=>typeof values[name]==='string'),'exact environment allowlist');
  const network={awsvpcConfiguration:{subnets:config.subnets,securityGroups:[recovery?config.recoveryTaskSecurityGroup:config.migrationSecurityGroup],assignPublicIp:'ENABLED'}};
  assert(isDeepStrictEqual(request.networkConfiguration,network),'fixed task network');
  return call('ecs','run',{...request,networkConfiguration:network});
}
