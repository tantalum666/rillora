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
const cryptoConfig=loadContentProtectionConfig();
assert.equal(cryptoConfig?.namespace,'rillora-staging');
configureContentPool(pool,cryptoConfig);
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
 const A=await identity(0),B=await identity(1),C=await identity(2);
 const account=(await pool.query("insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code) select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id",[A.id])).rows[0].id;
 const entitlement=(await pool.query("insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at) values($1,$2,'trusted_people_multiple','manual_override',$3,5,now()-interval '1 day',now()+interval '1 hour') returning id",[A.id,account,run])).rows[0].id;
 const input={category:'crypto_asset',title:'Synthetic on-chain wallet',institutionName:'Synthetic wallet provider',locationHint:'Synthetic locator',notes:'Synthetic protected notes '+run,
  details:{cryptoCustody:'self_custody',network:'Synthetic network',walletAddress:'SyntheticPublicAddress'},valueBand:'unknown',currencyCode:'USD'};
 let matter=(await api(A,'/v1/matters','POST',input,201)).matter;
 assert.equal(matter.notes,input.notes);
 let raw=(await pool.query('select title,notes,details from app.matter_items where public_id=$1',[matter.publicId])).rows[0];
 assert.match(raw.notes,/^rce1_/);assert(!JSON.stringify(raw).includes('Synthetic'));
 checks.push('HTTPS create/read uses encrypted storage and real runtime KMS');
 const connections=[];
 for(const [recipient,level] of [[B,'details'],[C,'name']]){
  const person=(await api(A,'/v1/trusted-contacts','POST',{displayName:'Synthetic contact '+level},201)).trustedContact;
  const invitation=await api(A,'/v1/sharing/connections','POST',{personPublicId:person.publicId,email:recipient.email,grants:[{matterPublicId:matter.publicId,detailLevel:level}]},201);
  const invitationToken=new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation');
  await api(recipient,'/v1/sharing/invitations/accept','POST',{invitationToken,accepted:true});
  connections.push(invitation.connection);
 }
 assert.equal((await api(B,'/v1/sharing/shared-with-me')).items[0].fields.notes,input.notes);
 assert.deepEqual((await api(C,'/v1/sharing/shared-with-me')).items[0].fields,{title:input.title,category:'crypto_asset'});
 const denied=await withPlannerDatabase(pool,C.id,async c=>(await c.query('select app.content_read_values($1,false) as data',[[raw.notes.slice(5)]])).rows[0].data);
 assert.equal(denied.values.length,0);checks.push('A/B/C exact scopes and known-reference denial');
 await pool.query('update app.commerce_entitlement_grants set expires_at=clock_timestamp() where id=$1',[entitlement]);
 matter=(await api(A,'/v1/matters/'+matter.publicId,'PATCH',{expectedVersion:matter.version,notes:'Synthetic new after cutoff'})).matter;
 const saved=(await api(B,'/v1/sharing/shared-with-me')).items[0];
 assert.equal(saved.accessMode,'saved');assert.equal(saved.fields.notes,input.notes);
 raw=(await pool.query('select notes from app.matter_items where public_id=$1',[matter.publicId])).rows[0];
 const rejected=await withPlannerDatabase(pool,B.id,async c=>(await c.query('select app.content_read_values($1,false) as data',[[raw.notes.slice(5)]])).rows[0].data);
 assert.equal(rejected.values.length,0);checks.push('Paid cutoff keeps old copy and denies current private value');
 const key=(await pool.query('select k.*,p.public_id as owner from app.private_content_keys k join app.planners p on p.id=k.planner_id where k.planner_id=$1 and k.active',[A.id])).rows[0];
 const provider=new KmsContentKeyProvider(cryptoConfig);
 await assert.rejects(()=>provider.unwrap(key.wrapped_key,key.wrapping_key_ref,{namespace:key.namespace,owner:randomUUID(),id:key.public_id}));
 const mismatched=new KmsContentKeyProvider({...cryptoConfig,namespace:'wrong-environment'});
 await assert.rejects(()=>mismatched.unwrap(key.wrapped_key,key.wrapping_key_ref,{namespace:'wrong-environment',owner:key.owner,id:key.public_id}));
 checks.push('Real KMS rejects wrong owner and wrong environment');
 assert.equal((await api(A,'/health/ready')).status,'ready');checks.push('Runtime health probes real KMS');
 assert.equal((await pool.query('select require_encrypted_writes from app.private_content_policy')).rows[0].require_encrypted_writes,false);
 const plain=await identity(3),encrypted=await identity(4);
 for(const count of [20,200]){
  for(const [person,mode] of [[plain,'plaintext-baseline'],[encrypted,'encrypted']]){
   const existing=Number((await pool.query('select count(*) n from app.matter_items where planner_id=$1',[person.id])).rows[0].n);
   await withPlannerDatabase(pool,person.id,async c=>{
   const plan=(await c.query('select id from app.plans where planner_id=app.current_planner_id()')).rows[0].id;
   for(let i=existing;i<count;i++){
    const id=randomUUID(),body={title:'Synthetic batch '+i,institutionName:'Example',notes:'Synthetic batch body '+i,valueBand:'unknown'};
    const sealed=mode==='encrypted'?await protectMatterInput(c,id,body):body;
    await c.query("insert into app.matter_items(public_id,planner_id,plan_id,category,title,institution_name,notes,value_band) values($1,app.current_planner_id(),$2,'account',$3,$4,$5,$6)",[id,plan,sealed.title,sealed.institutionName,sealed.notes,sealed.valueBand]);
   }
   });
  }
  // Alternate equivalent synthetic accounts, same service/region. This is a
  // bounded sequential comparison, not a concurrent-user capacity benchmark.
  for(let iteration=0;iteration<20;iteration++)for(const [person,mode] of [[plain,'plaintext-baseline'],[encrypted,'encrypted']]){
   const start=performance.now();let cursor=null;const matters=[];let pages=0;
   do{const result=await api(person,'/v1/matters?limit=100'+(cursor?'&cursor='+cursor:''));matters.push(...result.matters);cursor=result.nextCursor;pages++;}while(cursor&&pages<3);
   assert.equal(matters.length,count);assert(matters.every(m=>!m.title.startsWith('rce1_')));
   timings.push({mode,matters:count,pages,ms:Math.round(performance.now()-start)});
  }
 }
 checks.push('20/200-item HTTPS protected reads and matched synthetic plaintext baseline');
 for(const connection of connections){
  const current=(await api(A,'/v1/sharing/connections')).connections.find(c=>c.publicId===connection.publicId);
  const response=await fetch(origin+'/v1/sharing/connections/'+connection.publicId,{method:'DELETE',headers:{authorization:'Bearer '+A.token,'if-match':String(current.version)}});
  assert.equal(response.status,200);
 }
 assert.equal((await api(B,'/v1/sharing/shared-with-me')).items.length,0);
 assert.equal((await api(C,'/v1/sharing/shared-with-me')).items.length,0);checks.push('Revocation denies subsequent reads');
 const bodies=(await pool.query('select title,notes,details from app.matter_items where planner_id=$1',[A.id])).rows;
 assert(!JSON.stringify(bodies).includes('Synthetic'));checks.push('Raw database contains no synthetic private body');
 console.log(JSON.stringify({run,checks,timings,externalProviderLoginTested:false,realLegalConsentTested:false}));
}catch(error){console.error(JSON.stringify({run,completedChecks:checks,error:error?.message?.startsWith('GET ')||error?.message?.startsWith('POST ')||error?.message?.startsWith('PATCH ')?error.message:error?.code??error?.name??'content_acceptance_failed'}));process.exitCode=1;}
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
