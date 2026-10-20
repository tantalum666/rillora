import pg from 'pg';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { dedicatedTestDatabaseUrl, assertDedicatedTestDatabase } from './dedicated-test-database.js';
import { runMigrations } from '../src/migrate.js';
import { bootstrapRuntimeRole } from '../src/bootstrap-runtime.js';
import { createPool, withPlannerDatabase } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { configureRecoveryPool, type RecoveryEnvelope } from '../src/recovery-journal.js';

const url=dedicatedTestDatabaseUrl('postgresql:///rillora_authority_test','rillora_authority_test');
const login='continuity_runtime_journal_test',password=randomBytes(32).toString('hex');
const authority=randomBytes(48).toString('base64url'),journalKey=randomBytes(48).toString('base64url');
let admin:pg.Client,pool:pg.Pool,owner:string,matter:string;
let corrupt=false;
const recorded:unknown[]=[];
function receipt(envelope:RecoveryEnvelope){
  const expected=createHmac('sha256',journalKey).update(`rillora-journal-event-v1|${envelope.generation}|${envelope.transaction}|${envelope.event}`).digest('hex');
  expect(envelope.signature).toBe(expected);
  const event=JSON.parse(envelope.event);
  recorded.push(event);
  return createHmac('sha256',journalKey).update(`rillora-journal-ack-v1|${envelope.generation}|${envelope.transaction}|${createHash('sha256').update(envelope.event).digest('hex')}|${event.revision}`).digest('hex');
}
describe.sequential('independent recovery publication acknowledgments',()=>{
  beforeAll(async()=>{
    await assertDedicatedTestDatabase(url,'rillora_authority_test');await runMigrations(url);
    admin=new pg.Client({connectionString:url});await admin.connect();
    await admin.query('update app.recovery_policy set enforced=false');
    await admin.query('truncate app.planners restart identity cascade');await admin.query('truncate app.recovery_controls');
    await bootstrapRuntimeRole(admin,login,password,true,authority);
    await admin.query('insert into rillora_guard.journal_authority(singleton,signing_key) values(true,$1) on conflict(singleton) do update set signing_key=excluded.signing_key',[journalKey]);
    owner=(await admin.query("insert into app.planners(display_name) values('Journal proof fixture') returning id::text")).rows[0].id;
    const plan=(await admin.query('insert into app.plans(planner_id) values($1) returning id',[owner])).rows[0].id;
    matter=(await admin.query("insert into app.matter_items(planner_id,plan_id,category,title) values($1,$2,'account','Protected fixture') returning public_id",[owner,plan])).rows[0].public_id;
    const runtime=new URL(url);runtime.username=login;runtime.password=password;
    pool=createPool(loadConfig({NODE_ENV:'test',DATABASE_URL:runtime.toString(),DATABASE_AUTHORITY_KEY:authority}));
  });
  beforeEach(async()=>{
    corrupt=false;recorded.length=0;
    await admin.query('update app.recovery_policy set enforced=false');
    await admin.query('update app.matter_items set archived_at=null where public_id=$1',[matter]);
    await admin.query('truncate app.recovery_controls');
    await admin.query('update app.recovery_policy set enforced=true,coverage_started_at=now()');
  });
  afterAll(async()=>{await pool?.end();if(admin){await admin.query('update app.recovery_policy set enforced=false');await admin.query(`drop role if exists ${login}`);await admin.end();}});
  const restrict=(client:pg.PoolClient)=>client.query('update app.matter_items set archived_at=now() where public_id=$1',[matter]);
  it('refuses the reported unsigned self-ack even in an otherwise authorized runtime transaction',async()=>{
    await expect(withPlannerDatabase(pool,owner,async c=>{
      await restrict(c);const event=(await c.query('select app.recovery_pending() as events')).rows[0].events[0];
      await c.query('select app.recovery_mark_published($1)',[event.revision]);
    })).rejects.toThrow('recovery_receipt_required');
    expect((await admin.query('select archived_at from app.matter_items where public_id=$1',[matter])).rows[0].archived_at).toBeNull();
  });
  it.each([null,'00'.repeat(32)])('refuses null/forged receipts and leaves the mutation rolled back',async signature=>{
    await expect(withPlannerDatabase(pool,owner,async c=>{
      await restrict(c);const e=(await c.query('select app.recovery_envelopes() as events')).rows[0].events[0] as RecoveryEnvelope;
      await c.query('select app.recovery_mark_attested($1,$2,$3)',[JSON.parse(e.event).revision,e.event,signature]);
    })).rejects.toThrow('invalid_recovery_receipt');
    expect((await admin.query('select archived_at from app.matter_items where public_id=$1',[matter])).rows[0].archived_at).toBeNull();
  });
  it('accepts the exact independent receipt and rejects a receipt from before a later mutation',async()=>{
    await expect(withPlannerDatabase(pool,owner,async c=>{
      await restrict(c);const e=(await c.query('select app.recovery_envelopes() as events')).rows[0].events[0] as RecoveryEnvelope;
      const ack=receipt(e);
      await c.query("update app.matter_items set desired_outcome='never_disclose' where public_id=$1",[matter]);
      await c.query('select app.recovery_mark_attested($1,$2,$3)',[JSON.parse(e.event).revision,e.event,ack]);
    })).rejects.toThrow('invalid_recovery_receipt');
    configureRecoveryPool(pool,{async publish(){throw Error('Unsigned disabled');},async publishAttested(e){return corrupt?'11'.repeat(32):receipt(e);}});
    await withPlannerDatabase(pool,owner,restrict);
    expect(recorded.length).toBeGreaterThan(0);
    expect((await admin.query('select published from app.recovery_controls')).rows.every(row=>row.published)).toBe(true);
    expect(JSON.stringify(recorded)).not.toContain('Protected fixture');
  });
  it('does not let an unavailable/corrupt independent publisher become a successful commit',async()=>{
    corrupt=true;
    await expect(withPlannerDatabase(pool,owner,restrict)).rejects.toThrow('Changes could not be saved safely');
    expect((await admin.query('select archived_at from app.matter_items where public_id=$1',[matter])).rows[0].archived_at).toBeNull();
  });
});
