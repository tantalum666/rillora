import pg from '../../../apps/api/node_modules/pg/lib/index.js';
import express from '../../../apps/api/node_modules/express/index.js';
import {runMigrations} from '../../../apps/api/dist/migrate.js';
import {loadConfig} from '../../../apps/api/dist/config.js';
import {createPool} from '../../../apps/api/dist/db.js';
import {createApp} from '../../../apps/api/dist/app.js';
import {seedDevelopmentFixture} from '../../../apps/api/dist/seed-dev.js';
import {currentLegalContract} from '../../../apps/api/dist/legal-contract.js';
const url='postgresql://127.0.0.1:5432/rillora_review_repair_20260930_test';
const admin=new pg.Client({connectionString:'postgresql://127.0.0.1:5432/postgres'});await admin.connect();
if(!(await admin.query("select 1 from pg_database where datname='rillora_review_repair_20260930_test'")).rowCount) await admin.query('create database rillora_review_repair_20260930_test');
await admin.end();await runMigrations(url);
const config=loadConfig({NODE_ENV:'test',DATABASE_URL:url,ALLOW_DEV_AUTH:'true',ALLOW_FAMILY_MAINTENANCE_PREVIEW:'true',
 CORS_ORIGINS:'http://127.0.0.1:4396',WEB_APP_ORIGIN:'http://127.0.0.1:4396',OIDC_ISSUER_URL:'https://identity.example',OIDC_CLIENT_ID:'fixture',
 OIDC_CLIENT_SECRET:'local-synthetic-only',OIDC_REDIRECT_URI:'http://127.0.0.1:4395/auth/callback'});
const pool=createPool(config);await seedDevelopmentFixture(pool);
for(const id of ['22222222-2222-4222-8222-222222222222','c6a631bb-f907-4260-aaae-58b116738a27','d30d0270-4520-49b6-bef2-9d7dc2b4376c']) {
 const p=(await pool.query("insert into app.planners(public_id,display_name) values($1,'Synthetic reviewer') on conflict(public_id) do update set updated_at=now() returning id",[id])).rows[0];
 await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2) on conflict(planner_id) do nothing",[p.id]);
}
for(const [actor,id]of [['a','11111111-1111-4111-8111-111111111111'],['b','22222222-2222-4222-8222-222222222222']]) {
 await pool.query("insert into app.identity_accounts(planner_id,issuer,subject) select id,'https://identity.example',$2 from app.planners where public_id=$1 on conflict(issuer,subject) do nothing",[id,`auth0|review-${actor}`]);
}
let chosen='a';
const api=createApp(pool,config,{identityProvider:{
 async createAuthorizationUrl(t){return new URL(`http://127.0.0.1:4395/auth/callback?state=[REDACTED_CAPABILITY]&code=[REDACTED_CAPABILITY]
 async exchangeAuthorizationCode(url){const actor=url.searchParams.get('code');if(!['a','b'].includes(actor))throw Error('Synthetic actor only');return {issuer:'https://identity.example',subject:`auth0|review-${actor}`,displayName:'Synthetic reviewer',locale:'en',authenticatedAt:new Date(),authenticationMethods:['pwd'],verifiedEmail:`review-${actor}@example.test`};}
}});
const outer=express();
outer.get('/qa/login/:actor',async(req,res)=>{
 if(!['a','b'].includes(req.params.actor))return res.sendStatus(404);chosen=req.params.actor;
 const result=await fetch('http://127.0.0.1:4395/auth/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({intent:'signin',returnTo:'/',legalAcceptance:{...currentLegalContract,acceptedTerms:true,acknowledgedPrivacy:true,acceptedElectronicRecords:true}})});
 const body=await result.json();if(!result.ok)return res.status(result.status).json({error:'synthetic login failed'});
 res.setHeader('Set-Cookie',result.headers.getSetCookie());res.redirect(303,body.authorizationUrl);
});
outer.use(api);outer.listen(4395,'127.0.0.1',()=>console.log('Dedicated synthetic review API on 127.0.0.1:4395'));
