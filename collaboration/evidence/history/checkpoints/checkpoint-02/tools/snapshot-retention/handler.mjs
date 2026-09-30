import {RDSClient,DescribeDBSnapshotsCommand,DescribeDBInstancesCommand,ListTagsForResourceCommand,DeleteDBSnapshotCommand} from '@aws-sdk/client-rds';
import {retireSnapshots} from './retention.mjs';
const rds=new RDSClient({region:'eu-central-1',maxAttempts:2});
const send=command=>rds.send(command,{abortSignal:AbortSignal.timeout(8000)});
const provider={
 async snapshot(id){try{const rows=(await send(new DescribeDBSnapshotsCommand({DBSnapshotIdentifier:id}))).DBSnapshots;
   if(rows?.length!==1)throw Error('Unexpected snapshot response');return rows[0];}
  catch(e){if(e.name==='DBSnapshotNotFoundFault')return null;throw e;}},
 async database(id){return (await send(new DescribeDBInstancesCommand({DBInstanceIdentifier:id}))).DBInstances?.[0]??null;},
 async tags(arn){return Object.fromEntries(((await send(new ListTagsForResourceCommand({ResourceName:arn}))).TagList??[]).map(t=>[t.Key,t.Value]));},
 async remove(id){await send(new DeleteDBSnapshotCommand({DBSnapshotIdentifier:id}));},
};
export async function handler(){
 const policy=JSON.parse(process.env.SNAPSHOT_RETENTION_POLICY??'null');
 const report=await retireSnapshots(policy,provider,{allowDelete:process.env.ALLOW_SNAPSHOT_RETIREMENT==='true'});
 console.log(JSON.stringify({_aws:{Timestamp:Date.now(),CloudWatchMetrics:[{Namespace:'Rillora/Retention',Dimensions:[['Environment']],Metrics:[
  {Name:'SnapshotHeartbeat',Unit:'Count'},{Name:'SnapshotFailures',Unit:'Count'},{Name:'SnapshotOverdue',Unit:'Count'}]}]},
  Environment:'production',SnapshotHeartbeat:1,SnapshotFailures:report.failed,SnapshotOverdue:report.overdue,report}));
 return report;
}
