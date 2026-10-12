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
const ignored={
  auth_sessions:['verified_email_hash','deletion_identity_proof'],
  sharing_connections:['recipient_email_hash','recipient_email_hash_version'],
  account_deletions:['identity_proof','proof_session'],
  commerce_apple_purchase_sessions:['app_account_token','original_transaction_reference','legacy_planner_token','started_at'],
  commerce_apple_transaction_receipts:['app_account_token'],
};
const omittedTables=new Set(['schema_migrations','recovery_controls','email_match_policy']);
const quote=value=>'"'+value.replaceAll('"','""')+'"';
async function run(){
  await admin.connect();
  try{
    await admin.query('begin isolation level repeatable read read only');
    await admin.query("set local statement_timeout='20s'");
    requireFact((await admin.query('select ssl from pg_stat_ssl where pid=pg_backend_pid()')).rows[0]?.ssl===true,'TLS verification failed');
    const migrations=(await admin.query('select name,checksum from app.schema_migrations order by name')).rows;
    const hardened=migrations.some(m=>m.name==='0103_isolated_identity_deletion.sql');
    const tables=(await admin.query("select relname,relrowsecurity,relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app' and c.relkind='r' order by relname")).rows;
    const fingerprints=[];
    for(const table of tables){
      if(omittedTables.has(table.relname))continue;
      requireFact(/^[a-z][a-z0-9_]+$/.test(table.relname),'Unexpected table identifier');
      const target='app.'+quote(table.relname);
      phase='fingerprint:'+table.relname;
      const count=Number((await admin.query('select count(*)::text as count from '+target)).rows[0].count);
      requireFact(count<=50000,'Audit requires a separately reviewed large-table batch');
      const digest=(await admin.query(`select encode(public.digest(convert_to(coalesce(string_agg(h,'' order by h),''),'UTF8'),'sha256'),'hex') as digest
        from(select encode(public.digest(convert_to((to_jsonb(t)-$1::text[])::text,'UTF8'),'sha256'),'hex') as h from ${target} t) hashes`,[ignored[table.relname]??[]])).rows[0].digest;
      fingerprints.push({table:table.relname,count,sha256:digest});
    }
    const pending=Number((await admin.query("select count(*)::text as n from app.account_deletions where status<>'completed' and jsonb_array_length(identities)>0")).rows[0].n);
    const roles=(await admin.query("select rolname,rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolinherit,rolbypassrls,rolreplication from pg_roles where rolname like 'continuity_%' order by rolname")).rows;
    phase='policy';
    const protection=(await admin.query('select require_encrypted_writes from app.private_content_policy where singleton')).rows[0];
    const report={readOnly:true,namespace,verifiedTLS:true,migrations,pendingIdentityDeletions:pending,
      fingerprints,roles,contentProtectionEnforced:protection?.require_encrypted_writes===true,
      everyApplicationTableForcedRls:tables.filter(t=>t.relname!=='schema_migrations').every(t=>t.relrowsecurity&&t.relforcerowsecurity),
      hardenedSchema:hardened,checks:{}};
    if(hardened){
      phase='schema-authority';
      report.checks.noGlobalSessionEmailDigest=Number((await admin.query('select count(*)::text as n from app.auth_sessions where verified_email_hash is not null')).rows[0].n)===0;
      report.checks.noLegacyEmailMatches=Number((await admin.query('select count(*)::text as n from app.sharing_connections where recipient_email_hash_version<>2')).rows[0].n)===0;
      report.checks.apiCannotClaimDeletion=(await admin.query("select not has_function_privilege('continuity_auth','app.claim_account_deletion(uuid)','EXECUTE') as denied")).rows[0].denied;
      requireFact(Object.values(report.checks).every(Boolean)&&report.everyApplicationTableForcedRls,'Hardened schema checks failed');
    }
    await admin.query('commit');
    console.log(JSON.stringify(report));
  }finally{await admin.end();}
}
await run().catch(error=>{console.error(JSON.stringify({auditFailed:true,phase,
  databaseErrorCode:/^[A-Z0-9]{5}$/.test(error?.code??'')?error.code:null,privateValuesSuppressed:true}));process.exitCode=1;});
