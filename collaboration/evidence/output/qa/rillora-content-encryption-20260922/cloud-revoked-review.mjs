import pg from '/app/node_modules/pg/lib/index.js';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {loadDatabaseConfig,loadContentProtectionConfig} from '/app/dist/config.js';
import {databaseConnectionOptions,configureContentPool,withPlannerDatabase} from '/app/dist/db.js';
import {protectMatterInput,KmsContentKeyProvider} from '/app/dist/private-content.js';
import {verifiedEmailDigest} from '/app/dist/sharing-identity.js';
import {currentLegalContract as legal} from '/app/dist/legal-contract.js';

const pool=new pg.Pool({...databaseConnectionOptions(loadDatabaseConfig()),max:2});
const run='content-encryption-20260923-'+randomUUID(),issuer='https://synthetic-qa.rillora.invalid/';
const people=[],checks=[],timings=[];
const hash=s=>createHash('sha256').update(s).digest();
const origin='https://app.staging.rillora.xyz/api';
async function api(who,path,method='GET',body,status=200){
 const publicHealth=path.startsWith('/health/');
 const response=await fetch((publicHealth?'https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com':origin)+path,{method,headers:{...(publicHealth?{}:{authorization:'Bearer '+who.token}),'content-type':'application/json','x-rillora-client':'ios'},
  ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 if(response.status!==status)throw Error(method+' '+path+' returned '+response.status);
 return response.status===204?null:response.json();
}
async function identity(index){
 const subject=run+'-'+index,email=subject+'@example.invalid',token=randomBytes(32).toString('base64url');
 const p=(await pool.query('select * from app.provision_oidc_planner($1,$2,$3,$4,$5)',[issuer,subject,'Synthetic encryption '+index,'en','UTC'])).rows[0];
 people.push({id:String(p.planner_id),publicId:p.planner_public_id,token,email});
 const acceptance=(await pool.query("insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'ios',$7) returning id",
 [p.planner_id,p.identity_account_id,legal.termsVersion,legal.privacyVersion,legal.consentTextVersion,Buffer.from(legal.bundleSha256,'hex'),hash(issuer+'\x1f'+subject)])).rows[0];
 await pool.query("insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,credential_kind,authentication_methods,authenticated_at,expires_at,last_seen_at,verified_email_hash) values($1,$2,$3,$4,$5,'native_bearer',array['synthetic_qa'],now(),now()+interval '20 minutes',now(),$6)",
 [p.planner_id,p.identity_account_id,acceptance.id,hash(token),hash(randomBytes(32)),verifiedEmailDigest(email)]);
 return people.at(-1);
}
try{
 const A=await identity(0),B=await identity(1);
 const account=(await pool.query("insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code) select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id",[A.id])).rows[0].id;
 for(const capability of ['trusted_people_multiple','family_maintenance'])await pool.query("insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at) values($1,$2,$3,'manual_override',$4,5,now()-interval '1 day',now()+interval '1 hour')",[A.id,account,capability,run]);
 const matter=(await api(A,'/v1/matters','POST',{category:'account',title:'Synthetic review',institutionName:'Synthetic provider',locationHint:'Synthetic locator'},201)).matter;
 const person=(await api(A,'/v1/trusted-contacts','POST',{displayName:'Synthetic review recipient'},201)).trustedContact;
 const invite=await api(A,'/v1/sharing/connections','POST',{personPublicId:person.publicId,email:B.email,grants:[{matterPublicId:matter.publicId,detailLevel:'directions'}]},201);
 const invitationToken=new URLSearchParams(new URL(invite.invitationUrl).hash.slice(1)).get('invitation');
 await api(B,'/v1/sharing/invitations/accept','POST',{invitationToken,accepted:true});
 await api(A,'/v1/maintenance/settings','PATCH',{expectedVersion:0,cadenceDays:90,collaboratorConnectionPublicId:invite.connection.publicId,nextReviewAt:null});
 await api(A,'/v1/maintenance/rounds','POST',{requestKey:randomUUID(),dueAt:new Date(Date.now()+86400000).toISOString(),items:[{connectionPublicId:invite.connection.publicId,matterPublicId:matter.publicId}]},201);
 const task=(await api(B,'/v1/maintenance/overview')).incoming[0];assert(task);
 const connection=(await api(A,'/v1/sharing/connections')).connections[0];
 const removed=await fetch(origin+'/v1/sharing/connections/'+connection.publicId,{method:'DELETE',headers:{authorization:'Bearer '+A.token,'if-match':String(connection.version)}});assert.equal(removed.status,200);
 const response=await api(B,'/v1/maintenance/tasks/'+task.publicId+'/respond','POST',{expectedVersion:task.version,response:'suggested',proposal:{locationHint:'Synthetic blocked change'}},403);
 assert.equal(response.error.code,'review_unavailable');
 const current=(await api(A,'/v1/matters/'+matter.publicId)).matter;assert.equal(current.locationHint,'Synthetic locator');
 assert.equal((await api(A,'/health/ready')).status,'ready');
 console.log(JSON.stringify({run,checks:['Accepted Directions review works with encrypted fields','Revoked recipient suggestion returns403/review_unavailable','Matter unchanged after refusal','Runtime KMS health ready'],synthetic:true}));
}catch(error){console.error(JSON.stringify({run,error:error?.message?.startsWith('GET ')||error?.message?.startsWith('POST ')||error?.message?.startsWith('PATCH ')?error.message:error?.code??error?.name??'review_regression_failed'}));process.exitCode=1;}
finally{
 try{
  const ids=people.map(p=>p.id);
  await pool.query('begin');
  for(const id of ids)await pool.query('delete from app.planners p where id=$1 and exists(select 1 from app.identity_accounts i where i.planner_id=p.id and i.issuer=$2 and i.subject like $3)',[id,issuer,run+'-%']);
  const remaining=(await pool.query('select count(*)::int n from app.planners where id=any($1::bigint[])',[ids])).rows[0].n;
  const values=(await pool.query('select count(*)::int n from app.private_content_values where planner_id=any($1::bigint[])',[ids])).rows[0].n;
  assert.equal(remaining,0);assert.equal(values,0);await pool.query('commit');
  console.log(JSON.stringify({removedSyntheticUsers:people.length,remaining,remainingCiphertextValues:values}));
 }catch{await pool.query('rollback');console.error('Synthetic fixture cleanup requires follow-up');process.exitCode=1;}
 await pool.end();
}
