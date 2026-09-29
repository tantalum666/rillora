import {readFileSync} from 'node:fs';
import pg from 'pg';
import {loadDatabaseConfig} from './config.js';
import {databaseConnectionOptions} from './db.js';
import {configureRecoveryPool,DynamoRecoveryJournal} from './recovery-journal.js';
import {setRetentionHold} from './retention-holds.js';

// Explicit maintenance-task operation. No HTTP route, arbitrary SQL or automatic
// legal judgement. Input is the minimum record reference, reason and hold/release.
async function main(){
 const database=loadDatabaseConfig();
 if(database.sslMode!=='verify-full'||!database.host
   ||!/^rillora-production\.[a-z0-9]+\.eu-central-1\.rds\.amazonaws\.com$/.test(database.host)
   ||process.env.CONTENT_KEY_NAMESPACE!=='rillora-production'||!process.env.RECOVERY_JOURNAL_TABLE)
   throw Error('Exact production maintenance environment is required');
 const input=readFileSync(0,'utf8');if(Buffer.byteLength(input)>2048)throw Error('Hold input is too large');
 const pool=new pg.Pool({...databaseConnectionOptions(database),max:1});
 configureRecoveryPool(pool,new DynamoRecoveryJournal(process.env.RECOVERY_JOURNAL_TABLE,'rillora-production'));
 try{await setRetentionHold(pool,JSON.parse(input));console.log(JSON.stringify({retentionHoldRecorded:true,journaledBeforeCommit:true}));}
 finally{await pool.end();}
}
void main().catch(()=>{console.error('Retention hold operation failed; no unverified result is claimed.');process.exitCode=1;});
