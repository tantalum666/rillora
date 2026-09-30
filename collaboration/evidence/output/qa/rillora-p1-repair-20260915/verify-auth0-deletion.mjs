import fs from 'node:fs';
import {createApp} from '../../../apps/api/src/app.ts';
import {loadConfig} from '../../../apps/api/src/config.ts';
import {createPool} from '../../../apps/api/src/db.ts';
import {Auth0AccountIdentityDeleter,AccountDeletionProcessor} from '../../../apps/api/src/account-deletion.ts';
import request from '../../../apps/api/node_modules/supertest/index.js';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=new URL('../../../',import.meta.url),secret=JSON.parse(fs.readFileSync(new URL('.local-secrets/account-deletion/auth0-management.json',root))),target=JSON.parse(fs.readFileSync(new URL('.local-secrets/account-deletion/synthetic-user.json',root)));
if(!target.email.startsWith('p1-deletion-')||!target.email.endsWith('@example.test')||!target.user_id.startsWith('auth0|'))throw Error('Not the scoped disposable fixture');
const config=loadConfig({NODE_ENV:'test',DATABASE_URL:'postgresql:///continuity_p1_repair_20260915',ALLOW_DEV_AUTH:'true'}),pool=createPool(config);
try{
 const identity=(await pool.query("select * from app.provision_oidc_planner('https://login.rillora.xyz/', $1, 'Disposable Auth0 QA', 'en', 'UTC')",[target.user_id])).rows[0];
 const id=(await pool.query('select public_id from app.planners where id=$1',[identity.planner_id])).rows[0].public_id;
 const adapter=new Auth0AccountIdentityDeleter({domain:'rillora-dev.eu.auth0.com',clientId:secret.client_id,clientSecret:secret.client_secret,allowedIssuers:['https://login.rillora.xyz/']});
 const processor=new AccountDeletionProcessor(pool,adapter),app=createApp(pool,config,{accountDeletionProcessor:processor});
 await request(app).post('/v1/matters').set('x-dev-planner-id',id).send({category:'document',title:'Deletion verification',locationHint:'QA drawer'}).expect(201);
 const receipt=randomBytes(32).toString('base64url');
 const r=await request(app).post('/v1/account/delete').set('x-dev-planner-id',id).send({confirmation:'DELETE',receipt,acknowledgesSavedCopies:true}).expect(200);
 const removed=(await pool.query('select id from app.planners where id=$1',[identity.planner_id])).rowCount===0;
 const check=spawnSync('auth0',['api','get','users/'+encodeURIComponent(target.user_id),'--no-input'],{encoding:'utf8'});
 const absent=check.status!==0 && /404|not found/i.test(check.stderr+check.stdout);
 if(r.body.deletion.status!=='completed'||!removed||!absent)throw Error('Deletion not independently confirmed');
 const result={verifiedAt:new Date().toISOString(),provider:'Auth0 synthetic database identity',scope:'Exact new disposable test user only',providerUserAbsent:absent,localMapRemoved:removed,status:'completed',notProved:['Real customer deletion','Apple upstream token revocation ceremony','Staging API deployment']};
 fs.writeFileSync(new URL('./auth0-deletion-verification.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await pool.end();}
