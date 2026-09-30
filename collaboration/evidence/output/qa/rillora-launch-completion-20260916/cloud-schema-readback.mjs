import pg from 'pg';import {readFileSync,readdirSync} from 'node:fs';import {createHash} from 'node:crypto';
import {loadDatabaseConfig} from './dist/config.js';import {databaseConnectionOptions} from './dist/db.js';
const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));await c.connect();
const files=readdirSync('./migrations').filter(x=>/^00(4[8-9]|5[0-9])_/.test(x)).sort();
const rows=(await c.query('select name,checksum from app.schema_migrations where name=any($1::text[])',[files])).rows;
const checks=files.map(name=>({name,matched:rows.find(r=>r.name===name)?.checksum===createHash('sha256').update(readFileSync('./migrations/'+name)).digest('hex')}));
if(checks.some(x=>!x.matched))throw Error('Migration checksum mismatch');
const policy=(await c.query('select * from app.commerce_runtime_policy')).rows;
const sharing=(await c.query(`with counts as (select c.planner_id,count(*) n from app.sharing_connections c
 join app.people p on p.id=c.person_id and p.status not in ('revoked','archived')
 where c.status='accepted' or (c.status='pending' and c.invitation_expires_at>now()) group by c.planner_id)
 select count(*) filter(where n=1)::int as one_person_plans,count(*) filter(where n>1)::int as multi_person_plans from counts`)).rows[0];
const prices=(await c.query(`select p.price_code,p.amount_minor::int,p.currency_code,p.status,b.external_product_reference,b.provider_environment
 from app.commerce_prices p join app.commerce_storefront_products b on b.price_id=p.id
 where p.price_code in ('family_usd_annual_v2','family_usd_monthly_v2') and b.provider_code='stripe'`)).rows;
console.log(JSON.stringify({checks,policy,sharing,prices}));await c.end();
