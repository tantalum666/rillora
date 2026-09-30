import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {randomBytes,randomUUID} from 'node:crypto';
import {Auth0AccountIdentityDeleter} from '../../../apps/api/dist/account-deletion.js';
const root='/Users/tantalum/Documents/电子遗嘱app';
const directory=root+'/.local-secrets/production-identity-services';
const receipt=root+'/output/qa/rillora-launch-resume-20260930/production-deletion-probe-result.json';
if(existsSync(receipt))throw Error('Probe already recorded; do not create another identity');
const pending=directory+'/deletion-probe.json';const domain='rillora-dev.eu.auth0.com';let user;
try{
 if(existsSync(pending))user=JSON.parse(readFileSync(pending,'utf8'));
 else{
  const body={connection:'Username-Password-Authentication',email:`rillora-delete-probe-${randomUUID()}@example.test`,password:'Aa9!'+randomBytes(36).toString('base64url'),email_verified:false,verify_email:false};
  const value=JSON.parse(execFileSync('auth0',['api','post','users','--tenant',domain,'--no-input'],{input:JSON.stringify(body),encoding:'utf8',stdio:['pipe','pipe','pipe']}));
  user={subject:value.user_id,email:body.email,createdFor:'disposable-production-deletion-probe'};
  writeFileSync(pending,JSON.stringify(user),{mode:0o600,flag:'wx'});
 }
 if(user.createdFor!=='disposable-production-deletion-probe'||!/^rillora-delete-probe-[a-f0-9-]+@example\.test$/.test(user.email))throw Error('Wrong synthetic deletion target');
 const c=JSON.parse(readFileSync(directory+'/deletion.json','utf8'));
 if(c.client_id!=='TrmdYLDKuqOxF6MhRz2YvXzZhbVvIQo0'||c.domain!==domain)throw Error('Wrong service credential');
 let deletedStatus;
 const transport=async(url,options)=>{const result=await fetch(url,options);if(options.method==='DELETE')deletedStatus=result.status;return result;};
 const deleter=new Auth0AccountIdentityDeleter({domain,clientId:c.client_id,clientSecret:c.client_secret,allowedIssuers:['https://login.rillora.xyz/']},transport);
 await deleter.deleteIdentity({issuer:'https://login.rillora.xyz',subject:user.subject});
 const after=spawnSync('auth0',['api','get','users/'+encodeURIComponent(user.subject),'--tenant',domain,'--no-input'],{encoding:'utf8'});
 if(![204,404].includes(deletedStatus)||after.status===0||!/404/.test(after.stderr))throw Error('Deletion absence not confirmed');
 writeFileSync(receipt,JSON.stringify({at:new Date().toISOString(),syntheticIdentityOnly:true,productionClientId:c.client_id,deleteStatus:deletedStatus,subsequentReadStatus:404,trailingSlashIssuerAccepted:true,rilloraPlannerCreated:false,realAccountChanged:false,mailSent:false,secretPrinted:false},null,2)+'\n');
 console.log('Dedicated production deleter removed its newly created disposable Auth0 identity; absence confirmed.');
}catch{console.error('Production deletion probe failed; target remains recorded in protected storage, provider body suppressed.');process.exitCode=1;}
