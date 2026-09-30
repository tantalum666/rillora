// Read-only service proof. Input mailbox is supplied through stdin and never saved.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {Auth0EmailIdentityVerifier} from '../../../apps/api/dist/email-verification.js';
try {
  const {email}=JSON.parse(readFileSync(0,'utf8'));
  if(typeof email!=='string'||email.length>254)throw Error('Invalid probe input');
  const client=JSON.parse(readFileSync(resolve('.local-secrets/email-verification/auth0-management.json'),'utf8'));
  const profiles=JSON.parse(execFileSync('auth0',['api','get',`users-by-email?email=${encodeURIComponent(email)}&fields=user_id&include_fields=true`,'--tenant',client.domain,'--no-input'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
  const candidates=profiles.filter(item=>typeof item.user_id==='string'&&item.user_id.startsWith('auth0|'));
  if(candidates.length!==1)throw Error('No unique existing database identity');
  const verifier=new Auth0EmailIdentityVerifier({domain:client.domain,clientId:client.client_id,clientSecret:client.client_secret,allowedIssuers:['https://login.rillora.xyz']});
  const result=await verifier.verifiedEmail({issuer:'https://login.rillora.xyz',subject:candidates[0].user_id});
  if(result?.trim().toLowerCase()!==email.trim().toLowerCase())throw Error('Current provider proof did not match');
  console.log(JSON.stringify({actualProviderRead:true,exactIdentityMatched:true,verifiedEmailMatched:true,profileMutation:false,credentialsOrMailboxPrinted:false,applicationSessionRefreshNotTestedHere:true}));
}catch{console.error('Read-only provider probe failed; private input and provider output suppressed.');process.exitCode=1;}
