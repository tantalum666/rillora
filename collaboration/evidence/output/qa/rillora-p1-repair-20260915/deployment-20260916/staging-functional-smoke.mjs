import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createEncryptedStartHere,decryptEncryptedStartHere} from '../../../../apps/web/src/startHereCrypto.js';
const root=new URL('../../../../',import.meta.url),q=new URL('./',import.meta.url);
const secret=JSON.parse(fs.readFileSync(new URL('.local-secrets/staging-acceptance/p1-20260916.json',root)));
assert.equal(secret.run,'p1-20260916');for(const x of secret.actors)assert.match(x.email,/^p1-staging-(owner|recipient)-[a-f0-9]+@example\.test$/);
const [A,B]=secret.actors;const base='https://app.staging.rillora.xyz/api';const checks=[];const deletions=[];
async function api(actor,path,{method='GET',body,headers={},expected=200,text=false}={}){
 const response=await fetch(base+path,{method,headers:{...(actor?{authorization:'Bearer '+actor.token}:{}),'content-type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const data=text?await response.text():response.status===204?null:await response.json();
 assert.equal(response.status,expected,path+': '+(data?.error?.code??'unexpected status'));
 return data;
}
function record(name){checks.push({name,passed:true});console.log(name+': passed');}
async function remove(actor){
 const receipt=randomBytes(32).toString('base64url');let response=await fetch(base+'/v1/account/delete',{method:'POST',headers:{authorization:'Bearer '+actor.token,'content-type':'application/json'},body:JSON.stringify({confirmation:'DELETE',receipt,acknowledgesSavedCopies:true,acknowledgesBilling:false}),signal:AbortSignal.timeout(20000)});
 if(![200,202].includes(response.status))throw Error('Deletion not accepted: '+actor.role+' '+response.status);
 let status=(await response.json()).deletion;
 for(let i=0;status?.status!=='completed'&&i<24;i++){
  await new Promise(r=>setTimeout(r,3000));status=(await api(null,'/account-deletions/status',{headers:{authorization:'Deletion-Receipt '+receipt}})).deletion;
 }
 assert.equal(status.status,'completed','Deletion completion '+actor.role);
 await api(actor,'/v1/session',{expected:401});
 const provider=spawnSync('auth0',['api','get','users/'+encodeURIComponent(actor.userId),'--no-input'],{encoding:'utf8'});
 assert.equal(provider.status===0,false);assert.match(provider.stdout+provider.stderr,/404|not found/i);
 deletions.push({role:actor.role,completed:true,sessionRevoked:true,providerAbsent:true});
}
let failure=null;
try{
 const session=await api(A,'/v1/session');assert.equal(session.authenticationMode,'bearer');record('real runtime bearer authentication; development access stays off');
 const doc=(await api(A,'/v1/matters',{method:'POST',expected:201,body:{requestId:randomUUID(),category:'document',title:'Shared staging document',locationHint:'QA blue folder',notes:'Owner-only QA note'}})).matter;
 await api(A,'/v1/matters',{method:'POST',expected:201,body:{category:'document',title:'Never disclose QA',locationHint:'Private QA drawer',desiredOutcome:'never_disclose',notes:'Private QA letter'}});
 await api(A,'/v1/matters',{method:'POST',expected:201,body:{category:'crypto_asset',title:'Unshared staging wallet',details:{cryptoCustody:'self_custody',network:'Ethereum',walletAddress:'0x000000000000000000000000000000000000dEaD'},notes:'Unshared QA wallet note'}});
 record('authenticated category-aware create and private Notes');
 const initialChecks=(await api(A,'/v1/official-setup-checks')).officialSetupChecks;
 const apple=initialChecks.find(c=>c.providerKey==='apple');
 await api(A,'/v1/official-setup-checks/'+apple.publicId,{method:'PATCH',body:{expectedVersion:apple.version,completed:true}});

 const person=(await api(A,'/v1/trusted-contacts',{method:'POST',expected:201,body:{displayName:'Staging recipient',relationshipLabel:'Synthetic test'}})).trustedContact;
 const invitation=await api(A,'/v1/sharing/connections',{method:'POST',expected:201,body:{personPublicId:person.publicId,email:B.email,grants:[{matterPublicId:doc.publicId,detailLevel:'directions'}]}});
 const token=new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation');
 await api(B,'/v1/sharing/invitations/accept',{method:'POST',body:{invitationToken:token,accepted:true}});
 const shared=await api(B,'/v1/sharing/shared-with-me');assert.equal(shared.items.length,1);assert.equal(shared.items[0].fields.locationHint,'QA blue folder');assert.equal(shared.items[0].fields.notes,undefined);record('account-bound invitation and directions-only projection');
 const preview=await api(A,'/v1/exports/start-here/preview',{method:'POST',expected:201,body:{recipientConnectionPublicId:invitation.connection.publicId}});assert.equal(preview.package.matters.length,1);assert.equal(preview.package.trustedContacts.length,0);
 const text=await api(A,'/v1/exports/start-here/printable',{method:'POST',expected:201,text:true,body:{previewPublicId:preview.export.publicId,acknowledgesPlaintext:true,acknowledgesNoRevocation:true}});assert.match(text,/QA blue folder/);assert.doesNotMatch(text,/Never disclose QA|Unshared staging wallet|Owner-only QA note|Private QA drawer/);record('recipient-scoped plaintext guide');
 const preparation=await api(A,'/v1/exports/start-here/encrypted/prepare',{method:'POST',expected:201,body:{previewPublicId:preview.export.publicId}});
 const encrypted=await createEncryptedStartHere({preview,preparation});await api(A,`/v1/exports/start-here/encrypted/${preparation.package.publicId}/finalize`,{method:'POST',expected:201,body:encrypted.submission});
 const artifact=await api(A,`/v1/exports/start-here/encrypted/${preparation.package.publicId}`);const recovered=await decryptEncryptedStartHere(artifact,encrypted.recoveryKit);assert.equal(recovered.package.matters.length,1);record('cloud encrypted artifact finalize/download/local decrypt');
 const backup=await api(A,'/v1/account/map/export',{method:'POST',body:{acknowledgesPrivateCopy:true}});assert.equal(backup.matters.length,3);assert.equal(backup.matters.find(m=>m.title==='Unshared staging wallet').details.network,'Ethereum');assert.equal(backup.matters.find(m=>m.title==='Never disclose QA').notes,'Private QA letter');record('complete private backup preserves typed fields and Notes');
 const imported=await api(B,'/v1/account/map/import',{method:'POST',expected:201,body:{backup,acknowledgesPrivateImport:true}});assert.equal(imported.matterCount,3);assert.equal(imported.sharingRestored,false);assert.equal((await api(B,'/v1/official-setup-checks')).officialSetupChecks.find(c=>c.providerKey==='apple').completed,true);assert.equal((await api(B,'/v1/sharing/connections')).connections.length,0);record('intentional backup restore into empty synthetic account grants no access');
 await api(A,'/v1/matters/'+doc.publicId,{method:'DELETE',headers:{'if-match':String(doc.version)},expected:204});assert.equal((await api(B,'/v1/sharing/shared-with-me')).items.length,0);
 const archives=await api(A,'/v1/account/archived-matters');const archived=archives.matters.find(x=>x.publicId===doc.publicId);await api(A,`/v1/account/archived-matters/${doc.publicId}/restore`,{method:'POST',body:{expectedVersion:archived.version}});assert.equal((await api(B,'/v1/sharing/shared-with-me')).items.length,0);record('archive/restore remains private');
}catch(error){failure=error.message;console.log('Functional verification failed: '+failure);}
finally{
 for(const actor of [A,B])try{await remove(actor);}catch(error){deletions.push({role:actor.role,completed:false,error:error.message});failure??=error.message;}
 const result={checkedAt:new Date().toISOString(),passed:failure===null&&deletions.every(d=>d.completed),setup:'Two disposable Auth0 database users; administrator-seeded bounded native bearer/consent fixtures in synthetic staging. Not a provider login, email-delivery or real consent ceremony.',checks,deletions,failure};
 fs.writeFileSync(new URL('staging-functional-verification.json',q),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
if(failure)process.exitCode=1;
