import pg from 'pg';import{readFileSync,readdirSync}from'node:fs';import{createHash}from'node:crypto';
import{loadDatabaseConfig}from'/app/dist/config.js';import{databaseConnectionOptions,withCommerceInboxDatabase}from'/app/dist/db.js';
import{runRetentionBatch}from'/app/dist/retention.js';import{loadAppleReviewQuoteRows}from'/app/dist/apple-review-catalog.js';
const database=loadDatabaseConfig();
if(!database.host?.startsWith('rillora-production.')||database.sslMode!=='verify-full'||process.env.CONTENT_KEY_NAMESPACE!=='rillora-production')throw Error('Wrong production boundary');
const admin=new pg.Pool({...databaseConnectionOptions(database),max:1});
const runtime=new pg.Pool({...databaseConnectionOptions({...database,user:process.env.RUNTIME_DATABASE_USER,password:process.env.RUNTIME_DATABASE_PASSWORD}),max:1});
try{
 const files=readdirSync('/app/migrations').filter(n=>/^\d+_[a-z0-9_]+\.sql$/.test(n)).sort();
 const rows=(await admin.query('select name,checksum from app.schema_migrations order by name')).rows;
 if(files.length!==87||rows.length!==87||files.some(n=>rows.find(r=>r.name===n)?.checksum!==createHash('sha256').update(readFileSync('/app/migrations/'+n)).digest('hex')))throw Error('Schema mismatch');
 const role=(await runtime.query("select current_user as role,pg_has_role(current_user,'continuity_retention_service','member') as can_assume_service,(select ssl from pg_stat_ssl where pid=pg_backend_pid()) as tls")).rows[0];
 if(role.can_assume_service||!role.tls)throw Error('Runtime privilege or TLS mismatch');
 const counts=(await admin.query("select (select count(*)::int from app.planners) as planners,(select count(*)::int from app.retention_holds) as holds,(select production_entitlements_enabled from app.commerce_runtime_policy) as live")).rows[0];
 if(counts.live!==false)throw Error('Live sales unexpectedly active');
 const cleanup=await runRetentionBatch(runtime);
 const quote=await withCommerceInboxDatabase(runtime,c=>loadAppleReviewQuoteRows(c,{serviceMarketCode:'GLOBAL_US',storefrontCountryCode:'USA'}));
 if(quote.length!==1||Number(quote[0].amount_minor)!==6800||quote[0].route_code!=='global_us_ios_review_20260930')throw Error('Review quote mismatch');
 const version=JSON.parse(readFileSync('/app/node_modules/ip-address/package.json','utf8')).version;
 console.log(JSON.stringify({schema:'0087',checksumsMatched:87,runtimeRole:role.role,runtimeCanAssumeRetentionService:false,verifiedTls:true,
  beforeCounts:counts,removed:cleanup,actualRuntimeRoleSweepPassed:true,reviewQuoteCount:quote.length,reviewAmountMinor:Number(quote[0].amount_minor),
  ipAddressVersion:version,customerAccessOpened:false,realAppleTransaction:false}));
}finally{await runtime.end();await admin.end();}
