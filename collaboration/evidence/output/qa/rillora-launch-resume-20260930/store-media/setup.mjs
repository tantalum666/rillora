import{runMigrations}from'../../../../apps/api/dist/migrate.js';
import pg from'../../../../apps/api/node_modules/pg/lib/index.js';
const url='postgresql:///rillora_store_media_20260930';await runMigrations(url);
const db=new pg.Pool({connectionString:url});
for(const[id,name]of[['11111111-1111-4111-8111-111111111111','Alex Morgan'],['22222222-2222-4222-8222-222222222222','Casey Morgan']]){
 const p=(await db.query("insert into app.planners(public_id,display_name,locale,time_zone,residence_country_code) values($1,$2,'en','America/New_York','US') on conflict(public_id) do nothing returning id",[id,name])).rows[0];
 if(p)await db.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2)",[p.id]);
}
await db.end();console.log('Two synthetic store-media planners prepared; no provider identities or messages.');
