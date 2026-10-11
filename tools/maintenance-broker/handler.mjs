import {ECSClient,RunTaskCommand,DescribeServicesCommand} from '@aws-sdk/client-ecs';
import {RDSClient,DescribeDBInstancesCommand,DescribeDBSnapshotsCommand,CreateDBSnapshotCommand,
  RestoreDBInstanceFromDBSnapshotCommand,DeleteDBInstanceCommand,DeleteDBSnapshotCommand} from '@aws-sdk/client-rds';
import {executeMaintenance} from './core.mjs';

const ecs=new ECSClient({maxAttempts:2}),rds=new RDSClient({maxAttempts:2});
const config=JSON.parse(process.env.BROKER_SETTINGS);
async function call(service,operation,input){
  const send=(client,command)=>client.send(command,{abortSignal:AbortSignal.timeout(15_000)});
  if(service==='ecs'&&operation==='run'){
    const result=await send(ecs,new RunTaskCommand(input));
    if(result.failures?.length||result.tasks?.length!==1)throw Error('Maintenance task was not accepted');
    return {tasks:result.tasks.map(t=>({taskArn:t.taskArn,lastStatus:t.lastStatus})),failures:[]};
  }
  if(service==='ecs'&&operation==='service'){
    const result=await send(ecs,new DescribeServicesCommand({cluster:input.cluster,services:[input.service]}));
    if(result.failures?.length||result.services?.length!==1)throw Error('Source service state unavailable');
    return result.services[0];
  }
  if(service==='rds'&&operation==='database'){
    try{return(await send(rds,new DescribeDBInstancesCommand({DBInstanceIdentifier:input}))).DBInstances?.[0]??null;}
    catch(error){if(error.name==='DBInstanceNotFoundFault')return null;throw error;}
  }
  if(service==='rds'&&operation==='snapshot'){
    try{return(await send(rds,new DescribeDBSnapshotsCommand({DBSnapshotIdentifier:input}))).DBSnapshots?.[0]??null;}
    catch(error){if(error.name==='DBSnapshotNotFoundFault')return null;throw error;}
  }
  const actions={createSnapshot:[CreateDBSnapshotCommand,'DBSnapshot'],restore:[RestoreDBInstanceFromDBSnapshotCommand,'DBInstance'],
    deleteDatabase:[DeleteDBInstanceCommand,'DBInstance'],deleteSnapshot:[DeleteDBSnapshotCommand,'DBSnapshot']};
  if(service!=='rds'||!actions[operation])throw Error('Unsupported maintenance operation');
  const [Command,key]=actions[operation];return(await send(rds,new Command(input)))[key];
}
export async function handler(event){
  // Do not log request bodies: the per-run cleanup capability belongs only in
  // the caller's protected manifest, not CloudWatch or an evidence archive.
  return executeMaintenance(event,call,config);
}
