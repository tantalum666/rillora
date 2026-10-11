import pg from 'pg';
import { randomBytes } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { runMigrations } from '../src/migrate.js';
import { bootstrapRuntimeRole,bootstrapDeletionWorkerRole } from '../src/bootstrap-runtime.js';
import { createPool, withPlannerDatabase, withAuthDatabase, withCommercePlannerDatabase,withDeletionWorkerDatabase } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import request from './http-fixture.js';

const url = dedicatedTestDatabaseUrl('postgresql:///rillora_authority_test','rillora_authority_test');
const role = 'continuity_runtime_authority_test', password = randomBytes(32).toString('hex');
const key = randomBytes(48).toString('base64url');
let admin: pg.Client, pool: pg.Pool, raw: pg.Client,worker:pg.Pool;
const workerRole='continuity_deletion_production_test',workerPassword=randomBytes(32).toString('hex');
let a: { id: string; public_id: string }, b: { id: string; public_id: string };
describe.sequential('SQL credentials are not transaction authority', () => {
  beforeAll(async () => {
    await assertDedicatedTestDatabase(url, 'rillora_authority_test');
    await runMigrations(url);
    admin = new pg.Client({connectionString:url}); await admin.connect();
    await bootstrapRuntimeRole(admin, role, password, true, key);
    await bootstrapDeletionWorkerRole(admin,workerRole,workerPassword,true);
    await admin.query('truncate app.planners restart identity cascade');
    a = (await admin.query("insert into app.planners(display_name) values('Owner A') returning id::text,public_id")).rows[0];
    b = (await admin.query("insert into app.planners(display_name) values('Owner B') returning id::text,public_id")).rows[0];
    for (const p of [a,b]) await admin.query('insert into app.plans(planner_id) values($1)',[p.id]);
    const runtime = new URL(url); runtime.username=role; runtime.password=password;
    const config=loadConfig({NODE_ENV:'test',DATABASE_URL:runtime.toString(),ALLOW_DEV_AUTH:'true',DATABASE_AUTHORITY_KEY:key});
    pool=createPool(config);raw=new pg.Client({connectionString:runtime.toString()});await raw.connect();
    runtime.username=workerRole;runtime.password=workerPassword;worker=new pg.Pool({connectionString:runtime.toString()});
  });
  afterAll(async () => { await raw?.end();await pool?.end();await worker?.end();if(admin){await admin.query(`drop role if exists ${role}`);await admin.query(`drop role if exists ${workerRole}`);await admin.end();} });
  it('denies raw tenant changes, auth/session minting and cross-role commerce writes',async()=>{
    for (const name of ['continuity_app','continuity_auth','continuity_commerce']) {
      await raw.query('begin');
      try {
        await raw.query(`set local role ${name}`);
        await raw.query("select set_config('app.current_planner_id',$1,true)",[b.id]);
        expect((await raw.query('select app.runtime_authority_valid() as valid')).rows[0].valid).toBe(false);
        if(name!=='continuity_auth') expect((await raw.query('select app.current_planner_id() as id')).rows[0].id).toBeNull();
        if(name==='continuity_app') await expect(raw.query('select app.request_account_deletion($1)',[randomBytes(32)])).rejects.toThrow();
        if(name==='continuity_auth') await expect(raw.query("select * from app.provision_oidc_planner('https://forged.example','victim','Forged','en','UTC')")).rejects.toThrow();
        if(name==='continuity_commerce') expect((await raw.query('select * from app.resolve_storekit_account_binding($1)',[b.public_id])).rows).toEqual([]);
      } finally {await raw.query('rollback');}
    }
    expect((await admin.query("select count(*)::int n from app.identity_accounts where issuer='https://forged.example'")).rows[0].n).toBe(0);
    await raw.query('set role continuity_auth');
    expect((await raw.query('select token_hash from app.auth_sessions')).rows).toEqual([]);
    await expect(raw.query('select signing_key from rillora_guard.runtime_authority')).rejects.toThrow('permission denied');
    await raw.query('reset role');
  });
  it('preserves legitimate signed owner/auth/commerce operations and binds actor and role',async()=>{
    const own=await withPlannerDatabase(pool,a.id,c=>c.query('select public_id from app.planners'));
    expect(own.rows).toEqual([{public_id:a.public_id}]);
    await withPlannerDatabase(pool,a.id,async c=>{
      await c.query("select set_config('app.current_planner_id',$1,true)",[b.id]);
      expect((await c.query('select public_id from app.planners')).rows).toEqual([]);
    });
    await withPlannerDatabase(pool,a.id,async c=>{
      await c.query('set local role continuity_auth');
      expect((await c.query('select app.runtime_authority_valid() valid')).rows[0].valid).toBe(false);
      expect((await c.query('select token_hash from app.auth_sessions')).rows).toEqual([]);
    });
    const identity=await withAuthDatabase(pool,c=>c.query("select * from app.provision_oidc_planner('https://valid.example','owned','Valid','en','UTC')"));
    expect(identity.rowCount).toBe(1);
    expect(await withCommercePlannerDatabase(pool,a.id,async c=>(await c.query('select app.commerce_planner_can_purchase() as valid')).rows[0].valid)).toBe(true);
  });
  it('rejects copied proofs on another connection/transaction and expiry tampering',async()=>{
    const proof=await withPlannerDatabase(pool,a.id,async c=>(await c.query("select current_setting('app.authority_signature') as signature,current_setting('app.authority_expires') as expires")).rows[0]);
    await raw.query('begin');await raw.query('set local role continuity_app');
    await raw.query("select set_config('app.current_planner_id',$1,true),set_config('app.authority_expires',$2,true),set_config('app.authority_signature',$3,true)",[a.id,proof.expires,proof.signature]);
    expect((await raw.query('select app.runtime_authority_valid() valid')).rows[0].valid).toBe(false);
    await raw.query('rollback');
    await withPlannerDatabase(pool,a.id,async c=>{
      await c.query("select set_config('app.authority_expires','9999999999',true)");
      expect((await c.query('select app.runtime_authority_valid() valid')).rows[0].valid).toBe(false);
    });
  });
  it('has no runtime-reachable administrator/BYPASSRLS definers and protects formerly column-only tables',async()=>{
    const unsafe=await admin.query(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_roles owner on owner.oid=p.proowner
      where n.nspname='app' and p.prosecdef and (owner.rolsuper or owner.rolbypassrls)
      and exists(select 1 from unnest(array['continuity_app','continuity_auth','continuity_commerce','continuity_rehearsal']) role where has_function_privilege(role,p.oid,'EXECUTE'))`);
    expect(unsafe.rows).toEqual([]);
    const tables=await admin.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='app' and relkind='r' and relname<>'schema_migrations' and (not relrowsecurity or not relforcerowsecurity)");
    expect(tables.rows).toEqual([]);
  });
  it('serves the ordinary authenticated HTTP CRUD path with a real runtime login',async()=>{
    const app=createApp(pool,loadConfig({NODE_ENV:'test',DATABASE_URL:url,ALLOW_DEV_AUTH:'true'}));
    const created=await request(app).post('/v1/matters').set('x-dev-planner-id',a.public_id)
      .send({category:'account',title:'Scoped authority control',institutionName:'Synthetic',locationHint:'Local fixture',details:{}}).expect(201);
    const result=await request(app).get('/v1/matters').set('x-dev-planner-id',a.public_id).expect(200);
    expect(JSON.stringify(result.body)).toContain(created.body.matter.publicId);
    const other=await request(app).get('/v1/matters').set('x-dev-planner-id',b.public_id).expect(200);
    expect(JSON.stringify(other.body)).not.toContain(created.body.matter.publicId);
  });
  it('keeps deletion claim/finish on the separate login and requests reauthentication before changing a proofless account',async()=>{
    await expect(withAuthDatabase(pool,c=>c.query('select app.claim_account_deletion(null)'))).rejects.toThrow('permission denied');
    await expect(withAuthDatabase(pool,c=>c.query('select app.finish_account_deletion(gen_random_uuid(),gen_random_uuid(),true)'))).rejects.toThrow('permission denied');
    await expect(worker.query('set role continuity_auth')).rejects.toThrow('permission denied');
    expect(await withDeletionWorkerDatabase(worker,async c=>(await c.query('select app.claim_account_deletion(null) as job')).rows[0].job)).toBeNull();
    await expect(withDeletionWorkerDatabase(worker,c=>c.query('select * from app.planners'))).rejects.toThrow('permission denied');
    const app=createApp(pool,{...loadConfig({NODE_ENV:'test',DATABASE_URL:url,ALLOW_DEV_AUTH:'true'}),deletionWorkerEnabled:true});
    const result=await request(app).post('/v1/account/delete').set('x-dev-planner-id',a.public_id)
      .send({confirmation:'DELETE',receipt:randomBytes(32).toString('base64url'),acknowledgesSavedCopies:true}).expect(403);
    expect(result.body.error.code).toBe('reauthentication_required');
    expect((await admin.query('select status from app.planners where id=$1',[a.id])).rows[0].status).toBe('active');
    expect((await admin.query('select count(*)::int n from app.account_deletions')).rows[0].n).toBe(0);
  });
});
