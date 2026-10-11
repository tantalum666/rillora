import { timingSafeEqual } from 'node:crypto';
import type { DatabasePool } from './db.js';
import { withAuthDatabase } from './db.js';
import { emailMatchKey, emailMatchVerifier } from './sharing-identity.js';
import type { AppConfig } from './config.js';

export async function checkEmailMatchReadiness(pool:DatabasePool,config:AppConfig):Promise<void>{
  const expected=emailMatchVerifier(emailMatchKey(config));
  const result=await withAuthDatabase(pool,async client=>(await client.query<{state:{verifier:string|null;legacy:boolean}}>('select app.email_match_state() as state')).rows[0]?.state);
  if(!result?.verifier||result.legacy||!/^[a-f0-9]{64}$/.test(result.verifier)
    ||!timingSafeEqual(Buffer.from(result.verifier,'hex'),expected))throw new Error('Email matching migration/key is not ready');
}
