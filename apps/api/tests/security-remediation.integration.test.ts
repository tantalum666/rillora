import pg from 'pg';
import { randomBytes } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { runMigrations } from '../src/migrate.js';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { withAuthDatabase } from '../src/db.js';
import { admitAuthenticationTransaction } from '../src/auth-transaction-budget.js';
import { currentLegalContract as legal } from '../src/legal-contract.js';
import request from './http-fixture.js';

const url=dedicatedTestDatabaseUrl('postgresql:///rillora_recent_auth_test','rillora_recent_auth_test');
const config=loadConfig({NODE_ENV:'test',DATABASE_URL:url,ALLOW_DEV_AUTH:'true'});
let pool:pg.Pool;
async function owner() {
  const p=(await pool.query("insert into app.planners(display_name) values('Synthetic bounded-operation fixture') returning id::text,public_id")).rows[0];
  const plan=(await pool.query('insert into app.plans(planner_id) values($1) returning id::text',[p.id])).rows[0];
  return {...p,plan:plan.id,headers:{'x-dev-planner-id':p.public_id}};
}
describe.sequential('reported allocation and aggregate boundaries',()=>{
  beforeAll(async()=>{await assertDedicatedTestDatabase(url,'rillora_recent_auth_test');await runMigrations(url);pool=new pg.Pool({connectionString:url,max:5});});
  afterAll(async()=>{await pool.end();});
  it('refuses oversized contact/role/export collections instead of returning a truncated or unbounded map',async()=>{
    const who=await owner(),app=createApp(pool,config);
    await pool.query(`insert into app.people(planner_id,display_name) select $1,'Synthetic person '||n from generate_series(1,1001) n`,[who.id]);
    await pool.query(`insert into app.role_assignments(planner_id,plan_id,person_id,role,status)
      select $1,$2,id,'trusted_contact','draft' from app.people where planner_id=$1`,[who.id,who.plan]);
    for(const path of ['/v1/trusted-contacts','/v1/role-assignments'])
      expect((await request(app).get(path).set(who.headers).expect(413)).body.error.code).toBe('operation_size_limit');
    await request(app).post('/v1/exports/start-here/preview').set(who.headers).send({}).expect(413);
    expect((await pool.query('select count(*)::int n from app.export_packages where planner_id=$1',[who.id])).rows[0].n).toBe(0);
  });
  it('rejects a concurrent expensive request promptly while another planner can still export',async()=>{
    const a=await owner(),b=await owner(),app=createApp(pool,config),barrier=await pool.connect();
    try {
      await barrier.query("select pg_advisory_lock(hashtextextended('snapshot:'||$1::text,0))",[a.id]);
      const start=Date.now();await request(app).post('/v1/exports/start-here/preview').set(a.headers).send({}).expect(429);
      expect(Date.now()-start).toBeLessThan(1500);
      await request(app).post('/v1/exports/start-here/preview').set(b.headers).send({}).expect(201);
    } finally {await barrier.query('select pg_advisory_unlock_all()');barrier.release();}
    await request(app).post('/v1/exports/start-here/preview').set(a.headers).send({}).expect(201);
  });
  it('bounds active preview allocation without blocking the owner from reading ordinary matters',async()=>{
    const who=await owner(),app=createApp(pool,config);
    await pool.query(`insert into app.export_packages(planner_id,plan_id,format,status,expires_at)
      select $1,$2,'start_here_json','previewed',now()+interval '15 minutes' from generate_series(1,100)`,[who.id,who.plan]);
    await request(app).post('/v1/exports/start-here/preview').set(who.headers).send({}).expect(429);
    await request(app).get('/v1/matters').set(who.headers).expect(200);
  });
  it('commits bounded expired-auth cleanup even when admission still refuses a large backlog',async()=>{
    await pool.query('truncate app.auth_transactions');
    for(let i=0;i<3100;i++) await pool.query(`insert into app.auth_transactions(token_hash,state_hash,code_verifier,nonce,
      created_at,expires_at,legal_acceptance_required,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,
      accepted_terms,acknowledged_privacy,accepted_electronic_records,legal_client_surface)
      values($1,$2,$3,$4,now()-interval '2 hours',now()+$5::interval,true,$6,$7,$8,$9,true,true,true,'web')`,
      [randomBytes(32),randomBytes(32),randomBytes(32).toString('base64url'),randomBytes(24).toString('base64url'),
       i===3099?'1 hour':'-1 hour',legal.termsVersion,legal.privacyVersion,legal.consentTextVersion,Buffer.from(legal.bundleSha256,'hex')]);
    expect(await withAuthDatabase(pool,admitAuthenticationTransaction)).toBe(false);
    expect((await pool.query('select count(*)::int n from app.auth_transactions')).rows[0].n).toBe(1100);
    expect(await withAuthDatabase(pool,admitAuthenticationTransaction)).toBe(true);
    expect((await pool.query('select count(*)::int n from app.auth_transactions')).rows[0].n).toBe(1);
  });
});
