import {runHealthChecks} from './health-check.mjs';
export async function handler(){
  const config=JSON.parse(process.env.OPERATIONS_TARGETS_JSON??'null');
  const report=await runHealthChecks(config);
  console.log(JSON.stringify({
    _aws:{Timestamp:Date.now(),CloudWatchMetrics:[{Namespace:'Rillora/Operations',Dimensions:[['Environment']],Metrics:[{Name:'FailedChecks',Unit:'Count'},{Name:'Heartbeat',Unit:'Count'}]}]},
    Environment:report.environment,FailedChecks:report.failed,Heartbeat:1,report,
  }));
  return {ok:report.ok,failed:report.failed};
}
