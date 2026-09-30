import {createRequire} from 'node:module';import fs from 'node:fs';
const require=createRequire(process.cwd()+'/apps/api/package.json'),{Client}=require('pg');
const c=new Client({connectionString:'postgresql:///continuity_launch_qa'});await c.connect();
const A='11111111-1111-4111-8111-111111111111';
const owner=(await c.query('select id from app.planners where public_id=$1',[A])).rows[0].id;
const B=(await c.query("select * from app.provision_oidc_planner('https://local-qa.example.test','saved-ui-reader','Saved-copy reader','en','UTC')")).rows[0].planner_public_id;
const account=(await c.query("insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code) select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 on conflict(plan_id,operating_plane_code) do update set status='active' returning id",[owner])).rows[0].id;
const entitlement=(await c.query("insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at) values($1,$2,'trusted_people_multiple','manual_override','local-UI-acceptance-only',5,now()-interval '1 day',now()+interval '1 hour') returning id",[owner,account])).rows[0].id;
async function api(path,body,actor=A,method=body?'POST':'GET'){
 const r=await fetch('http://127.0.0.1:4271/v1'+path,{method,headers:{'content-type':'application/json','x-dev-planner-id':actor},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw Error(path+':'+r.status+':'+await r.text());return r.status===204?null:r.json();
}
const matter=(await api('/matters',{category:'document',title:'Saved-period document',locationHint:'Original shared folder',notes:'This is the original authorized note.'})).matter;
const person=(await api('/trusted-contacts',{displayName:'Saved-copy recipient'})).trustedContact;
const invitation=await api('/sharing/connections',{personPublicId:person.publicId,email:B+'@example.test',grants:[{matterPublicId:matter.publicId,detailLevel:'details'}]});
const token=new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation');
await api('/sharing/invitations/accept',{invitationToken:token,accepted:true},B);
await c.query('update app.commerce_entitlement_grants set expires_at=clock_timestamp() where id=$1',[entitlement]);
await api('/matters/'+matter.publicId,{expectedVersion:matter.version,title:'Updated after expiry',locationHint:'New private location',notes:'NEW PRIVATE NOTE AFTER EXPIRY'},A,'PATCH');
fs.writeFileSync('output/qa/rillora-launch-completion-20260916/saved-ui-fixture.json',JSON.stringify({A,B,matter: matter.publicId,person:person.publicId,connection:invitation.connection.publicId},null,2));
await c.end();console.log('Isolated local saved-copy fixture ready; no real provider identity or message.');
