import { withAuthDatabase, type DatabasePool } from './db.js';

export async function runRetentionBatch(pool: DatabasePool, limit=200): Promise<Record<string,number>> {
  return withAuthDatabase(pool,async client=>{
    await client.query("set local statement_timeout='5s'");
    const result=(await client.query('select app.run_retention_batch($1) as removed',[limit])).rows[0]?.removed;
    if(!result||Object.values(result).some(n=>!Number.isInteger(n)||Number(n)<0||Number(n)>limit))throw Error('Invalid retention result');
    return result;
  });
}

export function startRetentionWorker(pool:DatabasePool):()=>void {
  let running=false,stopped=false;
  const run=async()=>{
    if(running||stopped)return;running=true;
    let removed:Record<string,number>|null=null;
    try{removed=await runRetentionBatch(pool);}catch{ /* Emit aggregate failure; never SQL, tokens or private records. */ }
    finally{running=false;}
    process.stdout.write(JSON.stringify({_aws:{Timestamp:Date.now(),CloudWatchMetrics:[{
      Namespace:'Rillora/Retention',Dimensions:[['Environment']],Metrics:[
        {Name:'Heartbeat',Unit:'Count'},{Name:'Failures',Unit:'Count'},{Name:'RowsDeleted',Unit:'Count'},{Name:'BatchFull',Unit:'Count'}]}]},
      Environment:'production',Heartbeat:1,Failures:removed?0:1,
      RowsDeleted:removed?Object.values(removed).reduce((a,b)=>a+b,0):0,
      BatchFull:removed&&Object.values(removed).some(n=>n>=200)?1:0})+'\n');
  };
  const timer=setInterval(()=>void run(),15*60_000);timer.unref();void run();
  return ()=>{stopped=true;clearInterval(timer);};
}
