import { runMigrations } from '../../../apps/api/src/migrate.ts';
import pg from '../../../apps/api/node_modules/pg/lib/index.js';
const database='postgresql:///rillora_uiux_20260929';
await runMigrations(database);
const pool=new pg.Pool({connectionString:database});
for(const [id,name] of [
 ['11111111-1111-4111-8111-111111111111','Alex Audit'],
 ['22222222-2222-4222-8222-222222222222','Parent Audit'],
 ['33333333-3333-4333-8333-333333333333','Friend Audit'],
 ['44444444-4444-4444-8444-444444444444','Empty Audit']]){
 const r=await pool.query("insert into app.planners(public_id,display_name,locale,time_zone,residence_country_code) values($1,$2,'en','Asia/Hong_Kong','US') on conflict(public_id) do nothing returning id",[id,name]);
 if(r.rows[0])await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'draft','available',0)",[r.rows[0].id]);
}
await pool.end();console.log('Four isolated synthetic planners ready');
