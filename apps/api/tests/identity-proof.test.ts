import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createNativeOidcIdentityVerifier, hostedLegalAcceptanceClaim } from '../src/identity.js';
import { currentLegalContract } from '../src/legal-contract.js';

const legalProof = { ...currentLegalContract, acceptedTerms:true, acknowledgedPrivacy:true, acceptedElectronicRecords:true } as const;

const server=createServer();
let issuer:string;
let key:Awaited<ReturnType<typeof generateKeyPair>>;
let verifier:ReturnType<typeof createNativeOidcIdentityVerifier>;
beforeAll(async()=>{
  key=await generateKeyPair('RS256');
  const jwk={...await exportJWK(key.publicKey),kid:'ephemeral-test-key',alg:'RS256',use:'sig'};
  server.on('request',(req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify(req.url?.includes('jwks')?{keys:[jwk]}:{sub:'auth0|fixture',email_verified:false}));});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();if(!address||typeof address==='string')throw Error('Test server address unavailable');
  issuer=`http://127.0.0.1:${address.port}`;
  verifier=createNativeOidcIdentityVerifier({issuerUrl:issuer,clientId:'native-fixture',audience:'urn:fixture'});
});
afterAll(async()=>{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));});
async function token(audience:string,extra:Record<string,unknown>={}) {
  return new SignJWT({[hostedLegalAcceptanceClaim]:legalProof,...extra}).setProtectedHeader({alg:'RS256',kid:'ephemeral-test-key'}).setIssuer(`${issuer}/`)
    .setSubject('auth0|fixture').setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(key.privateKey);
}
it('a newly issued access token without auth_time is not recent authentication',async()=>{
  const access=await token('urn:fixture',{azp:'native-fixture',scope:'session:create'});
  expect((await verifier.verifyAccessToken(access)).authenticatedAt).toBeNull();
});
it('requires current signed hosted consent rather than client-authored acceptance',async()=>{
  const claims={azp:'native-fixture',scope:'session:create'};
  for(const proof of [undefined,{...legalProof,acceptedTerms:false},{...legalProof,bundleSha256:'0'.repeat(64)}, {...legalProof,extra:true}]) {
    await expect(verifier.verifyAccessToken(await token('urn:fixture',{...claims,[hostedLegalAcceptanceClaim]:proof}))).rejects.toThrow();
  }
  expect((await verifier.verifyAccessToken(await token('urn:fixture',claims))).legalAcceptance).toEqual(legalProof);
});
it('accepts only a signed matching ID-token time, audience and access-token hash',async()=>{
  const access=await token('urn:fixture',{azp:'native-fixture',scope:'session:create'});
  const at_hash=createHash('sha256').update(access).digest().subarray(0,16).toString('base64url');
  const now=Math.floor(Date.now()/1000);
  const id=await token('native-fixture',{auth_time:now,at_hash});
  expect((await verifier.verifyAccessToken(access,id)).authenticatedAt?.getTime()).toBe(now*1000);
  await expect(verifier.verifyAccessToken(access,await token('wrong-client',{auth_time:now}))).rejects.toThrow();
  await expect(verifier.verifyAccessToken(access,await token('native-fixture',{auth_time:now,at_hash:'wrong'}))).rejects.toThrow();
  const other=await new SignJWT({auth_time:now}).setProtectedHeader({alg:'RS256',kid:'ephemeral-test-key'})
    .setIssuer(`${issuer}/`).setSubject('auth0|other').setAudience('native-fixture').setIssuedAt().setExpirationTime('5m').sign(key.privateKey);
  await expect(verifier.verifyAccessToken(access,other)).rejects.toThrow();
});
