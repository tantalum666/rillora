import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import type { ExternalIdentity } from './identity.js';
import type { AppConfig } from './config.js';
import { recentAuthenticationMilliseconds,authenticationIsRecent } from './recent-authentication.js';

const encoded=z.string().regex(/^[A-Za-z0-9_-]+$/);
const envelopeSchema=z.object({version:z.literal(1),wrappedKey:encoded.max(8192),nonce:encoded.length(16),
  ciphertext:encoded.max(40000),tag:encoded.length(22)}).strict();
export type SealedDeletionProof=z.infer<typeof envelopeSchema>;
export type DeletionProofConfig={keyArn:string;namespace:string;region:string};
export type DeletionProofJob={identities:{issuer:string;subject:string}[];proof:unknown;proofSession:string|null;requestedAt:string};

/** API may GenerateDataKey; only the separate deletion worker may Decrypt. */
export class IdentityDeletionProofVault {
  constructor(private config:DeletionProofConfig,private kms=new KMSClient({region:config.region,maxAttempts:2})){}
  private context(session:string){
    z.uuid().parse(session);
    return {rillora_application:'identity-deletion-proof-v1',rillora_environment:this.config.namespace,session_id:session};
  }
  private aad(session:string){return Buffer.from(JSON.stringify(['identity-deletion-proof',1,this.config.namespace,session]));}
  async seal(token:string,session:string):Promise<SealedDeletionProof>{
    if(token.length<80||token.length>16384)throw new Error('Invalid identity proof size');
    const generated=await this.kms.send(new GenerateDataKeyCommand({KeyId:this.config.keyArn,KeySpec:'AES_256',EncryptionContext:this.context(session)}));
    if(!generated.Plaintext||generated.Plaintext.length!==32||!generated.CiphertextBlob)throw new Error('Identity proof protection unavailable');
    const key=Buffer.from(generated.Plaintext);generated.Plaintext.fill(0);
    try{
      const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);
      cipher.setAAD(this.aad(session));
      const ciphertext=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
      return {version:1,wrappedKey:Buffer.from(generated.CiphertextBlob).toString('base64url'),
        nonce:nonce.toString('base64url'),ciphertext:ciphertext.toString('base64url'),tag:cipher.getAuthTag().toString('base64url')};
    }finally{key.fill(0);}
  }
  async open(input:unknown,session:string):Promise<string>{
    const envelope=envelopeSchema.parse(input);
    const opened=await this.kms.send(new DecryptCommand({KeyId:this.config.keyArn,
      CiphertextBlob:Buffer.from(envelope.wrappedKey,'base64url'),EncryptionContext:this.context(session)}));
    if(!opened.Plaintext||opened.Plaintext.length!==32)throw new Error('Identity proof protection unavailable');
    const key=Buffer.from(opened.Plaintext);opened.Plaintext.fill(0);
    try{
      const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(envelope.nonce,'base64url'));
      decipher.setAAD(this.aad(session));decipher.setAuthTag(Buffer.from(envelope.tag,'base64url'));
      return Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,'base64url')),decipher.final()]).toString('utf8');
    }finally{key.fill(0);}
  }
}

export async function sealSessionDeletionProof(config:AppConfig,identity:ExternalIdentity,session:string):Promise<SealedDeletionProof|null>{
  if(!config.deletionProof||!identity.signedIdentityToken||!authenticationIsRecent(identity.authenticatedAt))return null;
  return new IdentityDeletionProofVault(config.deletionProof).seal(identity.signedIdentityToken,session);
}

export class DeletionIdentityProofVerifier {
  private keySets=new Map<string,JWTVerifyGetKey>();
  constructor(private vault:Pick<IdentityDeletionProofVault,'open'>,private issuers:readonly string[],
    private clientIds:readonly string[],private testKey?:JWTVerifyGetKey){}
  async authorize(job:DeletionProofJob):Promise<void>{
    if(job.identities.length===0)return;
    if(job.identities.length!==1||!job.proof||!job.proofSession)throw new Error('Missing independently verifiable deletion identity');
    const identity=job.identities[0]!,issuer=identity.issuer.replace(/\/$/,'')+'/';
    if(!this.issuers.some(v=>v.replace(/\/$/,'')+'/'===issuer)||this.clientIds.length===0)throw new Error('Invalid deletion identity scope');
    const queued=Date.parse(job.requestedAt);
    if(!Number.isFinite(queued)||queued>Date.now()+30000)throw new Error('Invalid deletion request time');
    let keys=this.testKey??this.keySets.get(issuer);
    if(!keys){keys=createRemoteJWKSet(new URL(issuer+'.well-known/jwks.json'));this.keySets.set(issuer,keys);}
    const token=await this.vault.open(job.proof,job.proofSession);
    const {payload}=await jwtVerify(token,keys,{issuer,audience:[...this.clientIds],algorithms:['RS256'],
      requiredClaims:['sub','iat','exp','auth_time'],currentDate:new Date(queued),clockTolerance:30});
    if(payload.sub!==identity.subject||typeof payload.auth_time!=='number'||!Number.isSafeInteger(payload.auth_time)
      ||typeof payload.iat!=='number'||payload.iat*1000>queued+30000
      ||payload.auth_time*1000<queued-recentAuthenticationMilliseconds||payload.auth_time*1000>queued+30000
      ||(payload.azp!==undefined&&(typeof payload.azp!=='string'||!this.clientIds.includes(payload.azp)))){
      throw new Error('Deletion identity proof mismatch');
    }
  }
}
