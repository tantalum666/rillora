import pg from '/app/node_modules/pg/lib/index.js';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {loadDatabaseConfig} from '/app/dist/config.js';
import {databaseConnectionOptions} from '/app/dist/db.js';
import {inspectPrivateContent} from '/app/dist/migrate-private-content.js';
import {currentLegalContract as l} from '/app/dist/legal-contract.js';
const require=createRequire('/app/package.json');const {KMSClient,DecryptCommand,GenerateDataKeyCommand}=require('@aws-sdk/client-kms');
const pool=new pg.Pool({...databaseConnectionOptions(loadDatabaseConfig()),max:1});
const run='content-final-20260923-'+randomUUID(),issuer='https://synthetic-qa.rillora.invalid/',token=randomBytes(32).toString('base64url');
const hash=v=>createHash('sha256').update(v).digest();let planner=null;
try{
 const migrationChecks=[];
 for(const name of ['0064_private_content_envelopes.sql','0065_content_maintenance.sql','0066_content_migration_representation.sql','0067_content_migration_grant_lookup.sql']){
  const checksum=hash(await readFile('/app/migrations/'+name)).toString('hex');
  assert.equal((await pool.query('select checksum from app.schema_migrations where name=$1',[name])).rows[0].checksum,checksum);
  migrationChecks.push({name,checksum});
 }
 console.log(JSON.stringify({migrationChecks}));
 assert.equal(process.env.CONTENT_KMS_KEY_ARN,undefined);
 assert.equal((await pool.query('select require_encrypted_writes from app.private_content_policy')).rows[0].require_encrypted_writes,true);
 const p=(await pool.query('select * from app.provision_oidc_planner($1,$2,$3,$4,$5)',[issuer,run,'Synthetic final encryption','en','UTC'])).rows[0];planner=String(p.planner_id);
 const a=(await pool.query("insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'ios',$7) returning id",[planner,p.identity_account_id,l.termsVersion,l.privacyVersion,l.consentTextVersion,Buffer.from(l.bundleSha256,'hex'),hash(issuer+'\x1f'+run)])).rows[0];
 await pool.query("insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,credential_kind,authentication_methods,authenticated_at,expires_at,last_seen_at) values($1,$2,$3,$4,$5,'native_bearer',array['synthetic_qa'],now(),now()+interval '10 minutes',now())",[planner,p.identity_account_id,a.id,hash(token),hash(randomBytes(32))]);
 const response=await fetch('https://app.staging.rillora.xyz/api/v1/matters',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({category:'account',title:'Synthetic final protected account',institutionName:'Synthetic provider',notes:'Synthetic final protected notes'}),signal:AbortSignal.timeout(15000)});
 assert.equal(response.status,201);const made=(await response.json()).matter;assert.equal(made.notes,'Synthetic final protected notes');
 const row=(await pool.query('select notes from app.matter_items where public_id=$1',[made.publicId])).rows[0];assert.match(row.notes,/^rce1_/);
 const key=(await pool.query('select k.*,p.public_id as owner from app.private_content_keys k join app.planners p on p.id=k.planner_id where k.planner_id=$1',[planner])).rows[0];
 const kms=new KMSClient({region:'eu-central-1',maxAttempts:1});
 const context={rillora_application:'content-v1',rillora_environment:key.namespace,owner_id:key.owner,key_id:key.public_id};
 for(const command of [new GenerateDataKeyCommand({KeyId:key.wrapping_key_ref,KeySpec:'AES_256',EncryptionContext:context}),new DecryptCommand({KeyId:key.wrapping_key_ref,CiphertextBlob:key.wrapped_key,EncryptionContext:context})]){
  let denied=false;
  try{const result=await kms.send(command,{abortSignal:AbortSignal.timeout(5000)});result.Plaintext?.fill(0);}catch(error){denied=error.name==='AccessDeniedException';}
  assert.equal(denied,true);
 }
 await assert.rejects(()=>pool.query("update app.matter_items set notes='Synthetic prohibited plaintext' where public_id=$1",[made.publicId]),error=>error.message==='content_plaintext_rejected');
 const report=await inspectPrivateContent(pool);assert.equal(report.plaintextValues,0);assert.equal(report.invalidReferences,0);
 console.log(JSON.stringify({checks:['API creates and reads encrypted content after final rollout','Migration role denied GenerateDataKey and Decrypt','DB rejects plaintext writes','Current data has zero plaintext and invalid refs'],report,externalProviderLoginTested:false}));
}catch(error){console.error(JSON.stringify({run,error:error?.code??error?.name??'verification_failed'}));process.exitCode=1;}
finally{
 if(planner){
  try{
   await pool.query('delete from app.planners p where id=$1 and exists(select 1 from app.identity_accounts i where i.planner_id=p.id and i.issuer=$2 and i.subject=$3)',[planner,issuer,run]);
   assert.equal((await pool.query('select count(*)::int n from app.private_content_values where planner_id=$1',[planner])).rows[0].n,0);
   assert.equal((await pool.query('select count(*)::int n from app.planners where id=$1',[planner])).rows[0].n,0);
   const report=await inspectPrivateContent(pool);console.log(JSON.stringify({removedSyntheticUsers:1,remainingFixtureCiphertext:0,finalReport:report}));
  }catch{console.error('Final synthetic cleanup requires follow-up');process.exitCode=1;}
 }
 await pool.end();
}
