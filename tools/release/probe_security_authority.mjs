// Fixed, read-only deployment probe. The broker pins these exact bytes; no SQL,
// account selector, credential, host override or provider mutation is accepted.
import pg from 'pg';
import {loadDatabaseConfig} from './dist/config.js';
import {databaseConnectionOptions} from './dist/db.js';

const requireFact=(value,message)=>{if(!value)throw Error(message);};
const config=loadDatabaseConfig();
const namespace=process.env.CONTENT_KEY_NAMESPACE??(process.env.RILLORA_DEPLOYMENT_AUDIT_ENVIRONMENT==='staging'?'rillora-staging':null);
requireFact(['rillora-production','rillora-staging'].includes(namespace),'Unexpected deployment environment');
requireFact(config.sslMode==='verify-full'&&config.host?.endsWith('.eu-central-1.rds.amazonaws.com'),'Verified Frankfurt database is required');
requireFact(!config.connectionString,'An explicit stack-selected database is required');
const admin=new pg.Client({...databaseConnectionOptions(config),connectionTimeoutMillis:10000,application_name:'rillora-security-rollout-audit'});
let phase='connect';
async function rejected(client,sql,expectedCode='42501'){
  await client.query('begin read only');
  try{await client.query('set local role continuity_auth');await client.query(sql);return false;}
  catch(error){return error.code===expectedCode;}
  finally{await client.query('rollback');}
}
async function run(){
  await admin.connect();
  try{
    await admin.query('begin read only');
    await admin.query("set local statement_timeout='20s'");
    requireFact((await admin.query('select ssl from pg_stat_ssl where pid=pg_backend_pid()')).rows[0]?.ssl===true,'TLS verification failed');
    const hardened=(await admin.query("select 1 from app.schema_migrations where name='0103_isolated_identity_deletion.sql'")).rowCount===1;
    requireFact(hardened,'Authority inspection requires the new schema');
    const owners=(await admin.query('select id::text as id from app.planners order by id limit 2')).rows.map(r=>r.id);
    const report={readOnly:true,namespace,verifiedTLS:true,hardenedSchema:true,checks:{}};
    await admin.query('commit');
    if(hardened){
      requireFact(/^continuity_runtime(?:_[a-z0-9]+)?$/.test(process.env.RUNTIME_DATABASE_USER??'')&&process.env.RUNTIME_DATABASE_PASSWORD,'Runtime verification credential is required');
      const options={...databaseConnectionOptions(config),user:process.env.RUNTIME_DATABASE_USER,password:process.env.RUNTIME_DATABASE_PASSWORD,max:1};
      phase='runtime-authority';
      const runtime=new pg.Client(options);await runtime.connect();
      try{
        report.checks.sqlCannotReadAuthority=await rejected(runtime,'select signing_key from rillora_guard.runtime_authority');
        report.checks.sqlCannotAcknowledgeJournal=await rejected(runtime,'select app.recovery_mark_published(0)');
        await runtime.query('begin read only');await runtime.query('set local role continuity_app');
        await runtime.query("select set_config('app.current_planner_id',$1,true)",[owners[0]??'1']);
        report.checks.unsignedTenantSelectionDenied=Number((await runtime.query('select count(*)::text as n from app.planners')).rows[0].n)===0;
        await runtime.query('rollback');
      }finally{await runtime.end();}
      const {configureDatabaseAuthority,bindDatabaseAuthority}=await import('./dist/database-authority.js');
      const pool=new pg.Pool(options);configureDatabaseAuthority(pool,process.env.DATABASE_AUTHORITY_KEY??null);
      try{
        const client=await pool.connect();
        try{
          await client.query('begin read only');await client.query('set local role continuity_app');
          await bindDatabaseAuthority(pool,client,'continuity_app',owners[0]??'1');
          const count=Number((await client.query('select count(*)::text as n from app.planners')).rows[0].n);
          report.checks.signedOwnerReadWorks=count===(owners.length?1:0);
          await client.query("select set_config('app.current_planner_id',$1,true)",[owners[1]??'9223372036854775807']);
          report.checks.changedOwnerDenied=Number((await client.query('select count(*)::text as n from app.planners')).rows[0].n)===0;
          await client.query('rollback');
        }finally{client.release();}
      }finally{await pool.end();}
      if(namespace==='rillora-production'){
        phase='journal-attestation';
        requireFact(process.env.RECOVERY_JOURNAL_BROKER_ARN,'Independent journal writer is required');
        const {LambdaClient,InvokeCommand}=await import('@aws-sdk/client-lambda');
        const response=await new LambdaClient({region:'eu-central-1'}).send(new InvokeCommand({FunctionName:process.env.RECOVERY_JOURNAL_BROKER_ARN,
          Payload:Buffer.from(JSON.stringify({operation:'publish',envelope:{version:1,generation:'00000000-0000-4000-8000-000000000000',transaction:'1',event:'{}',signature:'0'.repeat(64)}}))}));
        const body=JSON.parse(Buffer.from(response.Payload??[]).toString());
        report.checks.forgedJournalEnvelopeDenied=Boolean(response.FunctionError)&&body.errorType==='ValueError'&&body.errorMessage==='Invalid journal proof';
      }
      requireFact(Object.values(report.checks).every(Boolean),'Runtime authority checks failed');
    }
    console.log(JSON.stringify(report));
  }finally{await admin.end();}
}
await run().catch(error=>{console.error(JSON.stringify({auditFailed:true,phase,
  databaseErrorCode:/^[A-Z0-9]{5}$/.test(error?.code??'')?error.code:null,privateValuesSuppressed:true}));process.exitCode=1;});
