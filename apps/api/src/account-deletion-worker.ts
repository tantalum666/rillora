import pg from 'pg';
import { z } from 'zod';
import { fileURLToPath } from 'node:url';
import { AccountDeletionProcessor, Auth0AccountIdentityDeleter } from './account-deletion.js';
import { databaseConnectionOptions } from './db.js';
import { loadDatabaseConfig } from './config.js';
import { IdentityDeletionProofVault, DeletionIdentityProofVerifier } from './identity-deletion-proof.js';
import { configureRecoveryPool, recoveryPublisherFromEnvironment } from './recovery-journal.js';

export function loadDeletionWorkerConfig(env:NodeJS.ProcessEnv=process.env){
  return z.object({
    NODE_ENV:z.literal('production'),
    AUTH0_DELETION_DOMAIN:z.string().regex(/^[a-z0-9-]+\.(?:eu\.|us\.|au\.|uk\.|jp\.|ca\.)?auth0\.com$/),
    AUTH0_DELETION_CLIENT_ID:z.string().min(1).max(255),
    AUTH0_DELETION_CLIENT_SECRET:z.string().min(16).max(2048),
    DELETION_ALLOWED_ISSUERS:z.string().transform(v=>z.array(z.url().refine(u=>u.startsWith('https://'))).min(1).max(2).parse(JSON.parse(v))),
    DELETION_ALLOWED_CLIENT_IDS:z.string().transform(v=>z.array(z.string().min(1).max(255)).min(1).max(2).parse(JSON.parse(v))),
    DELETION_PROOF_KMS_KEY_ARN:z.string().regex(/^arn:aws:kms:eu-central-1:\d{12}:key\/[a-f0-9-]{36}$/),
    CONTENT_KEY_NAMESPACE:z.enum(['rillora-production','rillora-staging']),
  }).parse(env);
}

async function main(){
  const config=loadDeletionWorkerConfig(),pool=new pg.Pool({...databaseConnectionOptions(loadDatabaseConfig()),max:2,application_name:'rillora-identity-deletion-worker'});
  const publisher=recoveryPublisherFromEnvironment();if(publisher)configureRecoveryPool(pool,publisher);
  const verifier=new DeletionIdentityProofVerifier(new IdentityDeletionProofVault({keyArn:config.DELETION_PROOF_KMS_KEY_ARN,
    namespace:config.CONTENT_KEY_NAMESPACE,region:'eu-central-1'}),config.DELETION_ALLOWED_ISSUERS,config.DELETION_ALLOWED_CLIENT_IDS);
  const processor=new AccountDeletionProcessor(pool,new Auth0AccountIdentityDeleter({domain:config.AUTH0_DELETION_DOMAIN,
    clientId:config.AUTH0_DELETION_CLIENT_ID,clientSecret:config.AUTH0_DELETION_CLIENT_SECRET,allowedIssuers:config.DELETION_ALLOWED_ISSUERS}),
    job=>verifier.authorize(job));
  let stopped=false;
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopped=true;});
  try{
    const actual=(await pool.query("select session_user as name,pg_has_role(session_user,'continuity_deletion_worker','MEMBER') as allowed")).rows[0];
    if(!actual?.allowed||!/^continuity_deletion_(production|staging)$/.test(actual.name))throw new Error('Invalid deletion worker login');
    while(!stopped){
      try{await processor.process();}catch{process.stderr.write('Identity deletion pass will retry.\n');}
      if(!stopped)await new Promise(resolve=>setTimeout(resolve,30000));
    }
  }finally{await pool.end();}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  main().catch(()=>{process.stderr.write('Isolated identity deletion worker could not start.\n');process.exitCode=1;});
}
