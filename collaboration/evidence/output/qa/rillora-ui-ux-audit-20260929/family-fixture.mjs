import pg from '../../../apps/api/node_modules/pg/lib/index.js';
import {writeFile} from 'node:fs/promises';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const pool=new pg.Pool({connectionString:'postgresql:///rillora_uiux_20260929'});
const owner=(await pool.query('select id from app.planners where public_id=$1',[A])).rows[0].id;
let account=(await pool.query('select id from app.commerce_accounts where planner_id=$1',[owner])).rows[0];
if(!account)account=(await pool.query("insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code) select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id",[owner])).rows[0];
await pool.query("insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,effective_at,expires_at) values($1,$2,'family_maintenance','manual_override','uiux-audit-local-only',now()-interval '1 minute',now()+interval '3 hours')",[owner,account.id]);
async function api(actor,path,body){const r=await fetch('http://127.0.0.1:4280/v1'+path,{method:body?'POST':'GET',headers:{'x-dev-planner-id':actor,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error(path+' '+r.status+' '+await r.text());return r.json();}
const matters=(await api(A,'/matters')).matters;
const matter=matters.find(m=>m.title==='Family bank account');
const person=(await api(A,'/trusted-contacts',{displayName:'Family Review Audit'})).trustedContact;
const created=await api(A,'/sharing/connections',{personPublicId:person.publicId,email:B+'@example.test',grants:[{matterPublicId:matter.publicId,detailLevel:'directions'}]});
const token=new URLSearchParams(new URL(created.invitationUrl).hash.slice(1)).get('invitation');
await api(B,'/sharing/invitations/accept',{accepted:true,invitationToken:token});
const report={localDatabase:'rillora_uiux_20260929',syntheticOnly:true,connection:created.connection.publicId,person:person.publicId,matter:matter.publicId,entitlementExpires:'3 hours',billingActivated:false};
await writeFile(new URL('./family-fixture.json',import.meta.url),JSON.stringify(report,null,2));await pool.end();console.log(report);
