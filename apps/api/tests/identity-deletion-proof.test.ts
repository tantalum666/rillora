import {randomUUID,randomBytes} from 'node:crypto';
import {generateKeyPair,SignJWT,createLocalJWKSet,exportJWK} from 'jose';
import {describe,it,expect,beforeAll} from 'vitest';
import {DeletionIdentityProofVerifier,IdentityDeletionProofVault,type DeletionProofJob} from '../src/identity-deletion-proof.js';
import type {KMSClient} from '@aws-sdk/client-kms';

let signer:Awaited<ReturnType<typeof generateKeyPair>>['privateKey'],keySet:ReturnType<typeof createLocalJWKSet>;
const issuer='https://identity.example/',client='rillora-fixture-client',now=Math.floor(Date.now()/1000);
beforeAll(async()=>{const pair=await generateKeyPair('RS256');signer=pair.privateKey;keySet=createLocalJWKSet({keys:[{...await exportJWK(pair.publicKey),kid:'fixture'}]});});
async function token(subject='owned',claims:Record<string,unknown>={}){
  return new SignJWT({auth_time:now,...claims}).setProtectedHeader({alg:'RS256',kid:'fixture'}).setIssuer(issuer).setAudience(client)
    .setSubject(subject).setIssuedAt(now).setExpirationTime(now+900).sign(signer);
}
const job=(proof:unknown):DeletionProofJob=>({identities:[{issuer,subject:'owned'}],proof,proofSession:randomUUID(),requestedAt:new Date(now*1000).toISOString()});
describe('isolated identity deletion proof',()=>{
  it('accepts an exact recently authenticated provider identity and preserves delayed retries at the original request time',async()=>{
    const jwt=await token(),v=new DeletionIdentityProofVerifier({async open(){return jwt;}},[issuer],[client],keySet);
    await expect(v.authorize(job({sealed:true}))).resolves.toBeUndefined();
    const delayed=await new SignJWT({auth_time:now-3600}).setProtectedHeader({alg:'RS256',kid:'fixture'}).setIssuer(issuer).setAudience(client)
      .setSubject('owned').setIssuedAt(now-3600).setExpirationTime(now-2700).sign(signer);
    const queued=job({sealed:true});queued.requestedAt=new Date((now-3550)*1000).toISOString();
    await expect(new DeletionIdentityProofVerifier({async open(){return delayed;}},[issuer],[client],keySet).authorize(queued)).resolves.toBeUndefined();
  });
  it.each(['foreign','missing','old','wrong-client','unsigned'])('rejects %s proof before an Auth0 DELETE can occur',async kind=>{
    let jwt=await token(kind==='foreign'?'another':'owned',kind==='old'?{auth_time:now-7200}:{});
    if(kind==='wrong-client')jwt=await new SignJWT({auth_time:now}).setProtectedHeader({alg:'RS256',kid:'fixture'}).setIssuer(issuer).setAudience('unrelated-client').setSubject('owned').setIssuedAt(now).setExpirationTime(now+600).sign(signer);
    if(kind==='unsigned')jwt=jwt.slice(0,-8)+'modified';
    const input=job(kind==='missing'?null:{sealed:true});
    await expect(new DeletionIdentityProofVerifier({async open(){return jwt;}},[issuer],[client],keySet).authorize(input)).rejects.toThrow();
  });
  it('seals proof bytes without retaining plaintext and binds the envelope to its exact session',async()=>{
    const key=randomBytes(32),wrapped=randomBytes(64),contexts:unknown[]=[];
    const kms={async send(command:any){
      contexts.push(command.input.EncryptionContext);
      return command.constructor.name==='GenerateDataKeyCommand'?{Plaintext:Buffer.from(key),CiphertextBlob:wrapped}:{Plaintext:Buffer.from(key)};
    }} as unknown as KMSClient;
    const vault=new IdentityDeletionProofVault({keyArn:'fixture-key',namespace:'rillora-production',region:'eu-central-1'},kms);
    const session=randomUUID(),jwt=await token(),sealed=await vault.seal(jwt,session);
    expect(JSON.stringify(sealed)).not.toContain(jwt);expect(await vault.open(sealed,session)).toBe(jwt);
    await expect(vault.open(sealed,randomUUID())).rejects.toThrow();
    expect(contexts.every((value:any)=>value.rillora_application==='identity-deletion-proof-v1')).toBe(true);
  });
});
