import pg from 'pg';
import {loadDatabaseConfig,loadContentProtectionConfig} from './config.js';
import {databaseConnectionOptions,configureContentPool} from './db.js';
import {runMigrations} from './migrate.js';
import {readRecoveryJournal,replayRecoveryControls,validateRecoveryHost,validateRecoveryWindow} from './recovery-replay.js';
import {createRecoveryProviderReader} from './recovery-commerce-readers.js';
import {reconcileRecoveryCommerce} from './recovery-commerce.js';

/** Invoked only by the scoped runbook after actual source-service quiescence.
 * Never opens traffic, promotes a database or fabricates missing customer identity. */
async function main(){
 const database=loadDatabaseConfig(),content=loadContentProtectionConfig();
 validateRecoveryHost(database.host??'',database.sslMode==='verify-full');
 const frozen=Date.parse(process.env.RECOVERY_SOURCE_FROZEN_AT??'');
 if(!Number.isFinite(frozen)||frozen>Date.now()||Date.now()-frozen>10*60_000)throw Error('Fresh source-service freeze verification is required');
 if(content?.namespace!=='rillora-production'||content.mode!=='encrypted'||!process.env.RECOVERY_JOURNAL_TABLE)throw Error('Production recovery boundary required');
 const journal=await readRecoveryJournal(process.env.RECOVERY_JOURNAL_TABLE);
 validateRecoveryWindow(process.env.RECOVERY_SNAPSHOT_TIME??'',journal.coverage);
 if(!journal.coverage.databaseGeneration)throw Error('Recovery generation is missing');
 await runMigrations(database);
 const pool=new pg.Pool({...databaseConnectionOptions(database),max:3,options:'-c app.recovery_replay=true'});
 configureContentPool(pool,content);
 try{
  // Privacy restrictions are safe to reapply first, while the clone stays isolated.
  const privacy=await replayRecoveryControls(pool,journal.events.filter(e=>e.kind!=='unreconciled_access'),journal.coverage.databaseGeneration);
  const reader=createRecoveryProviderReader(pool,{appleRoots:process.env.APPLE_ROOT_CERTIFICATE_DIRECTORY??'/app/certificates/apple',
   ...(process.env.APPLE_PRODUCTION_SECRET_ARN?{appleProductionArn:process.env.APPLE_PRODUCTION_SECRET_ARN}:{}),
   ...(process.env.APPLE_REVIEW_SECRET_ARN?{appleReviewArn:process.env.APPLE_REVIEW_SECRET_ARN}:{}),
   ...(process.env.STRIPE_PRODUCTION_SECRET_ARN?{stripeProductionArn:process.env.STRIPE_PRODUCTION_SECRET_ARN}:{})});
  const commerce=await reconcileRecoveryCommerce(pool,journal.events,journal.coverage.databaseGeneration,reader);
  const current=await readRecoveryJournal(process.env.RECOVERY_JOURNAL_TABLE);
  const checkpoint=(events:typeof journal.events)=>JSON.stringify(events.map(e=>[e.key,e.revision]).sort());
  if(checkpoint(current.events)!==checkpoint(journal.events))throw Error('Source journal changed during reconciliation; repeat from current evidence');
  const final=await replayRecoveryControls(pool,current.events,journal.coverage.databaseGeneration);
  console.log(JSON.stringify({privacy,commerce,final,currentJournalStableAtCheck:true,customerTrafficEnabled:false,
   boundary:'Current access reconciliation only; missing identities/catalogs and full historical accounting need explicit recovery.'}));
 }finally{await pool.end();}
}
void main().catch(()=>{console.error('Commerce recovery is incomplete; keep the restored database isolated and inspect the required provider/identity/catalog evidence.');process.exitCode=1;});
