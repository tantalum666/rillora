import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { createPool } from '../src/db.js';
import { runMigrations } from '../src/migrate.js';
import { configureRecoveryPool, type RecoveryControl } from '../src/recovery-journal.js';
import { replayRecoveryControls } from '../src/recovery-replay.js';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import request from './http-fixture.js';

const sourceName = 'rillora_recovery_history_test', restoreName = 'rillora_recovery_history_restore_test';
const sourceUrl = dedicatedTestDatabaseUrl(`postgresql://127.0.0.1/${sourceName}`, sourceName);
const restoreUrl = dedicatedTestDatabaseUrl(`postgresql://127.0.0.1/${restoreName}`, restoreName);
const config = loadConfig({ NODE_ENV: 'test', DATABASE_URL: sourceUrl, ALLOW_DEV_AUTH: 'true' });
const pool = createPool(config), app = createApp(pool, config), journal = new Map<string, RecoveryControl>();
const directory = mkdtempSync(join(tmpdir(), 'rillora-permission-history-')), dump = join(directory, 'snapshot.dump');
const A = '91111111-1111-4111-8111-111111111111';
const recipients = ['92222222-2222-4222-8222-222222222222', '93333333-3333-4333-8333-333333333333', '94444444-4444-4444-8444-444444444444'];
const actor = { 'x-dev-planner-id': A }, connections: string[] = [];
const operator = 'continuity_recovery_history_test', password = randomBytes(32).toString('hex');
let owner: string, matter: string, restored: pg.Pool;

async function scope(connection: string, level: string | null) {
  const version = (await pool.query('select version from app.sharing_connections where public_id=$1', [connection])).rows[0].version;
  await request(app).patch(`/v1/sharing/connections/${connection}`).set(actor).send({
    expectedVersion: version, grants: level ? [{ matterPublicId: matter, detailLevel: level }] : [],
  }).expect(200);
}

describe.sequential('restore preserves permanent permission reductions', () => {
  beforeAll(async () => {
    const adminUrl = new URL(sourceUrl); adminUrl.pathname = '/postgres';
    const admin = new pg.Client({ connectionString: adminUrl.href }); await admin.connect();
    try {
      for (const name of [sourceName, restoreName]) {
        if (!(await admin.query('select 1 from pg_database where datname=$1', [name])).rowCount) {
          await admin.query(`create database ${name}`);
          await admin.query(`comment on database ${name} is 'rillora-disposable-test:${name}'`);
        }
      }
    } finally { await admin.end(); }
    await assertDedicatedTestDatabase(sourceUrl, sourceName);
    await assertDedicatedTestDatabase(restoreUrl, restoreName);
    await runMigrations(sourceUrl);
    await pool.query('update app.recovery_policy set enforced=false');
    await pool.query('truncate app.planners restart identity cascade');
    await pool.query('truncate app.recovery_controls');
    await pool.query('update app.commerce_runtime_policy set sharing_limits_enabled=true');
    for (const id of [A, ...recipients]) {
      const row = (await pool.query("insert into app.planners(public_id,display_name) values($1,'Synthetic history fixture') returning id::text", [id])).rows[0];
      if (id === A) owner = row.id;
      await pool.query('insert into app.plans(planner_id) values($1)', [row.id]);
    }
    const account = (await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code)
      select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1 returning id`, [owner])).rows[0].id;
    const entitlement = (await pool.query(`insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at)
      values($1,$2,'trusted_people_multiple','manual_override','isolated-history-fixture',5,now()-interval '1 day',now()+interval '1 day') returning id`, [owner, account])).rows[0].id;
    matter = (await request(app).post('/v1/matters').set(actor).send({ category: 'document', title: 'Saved title', locationHint: 'Paid folder', notes: 'Withdrawn private note', desiredOutcome: 'notify' }).expect(201)).body.matter.publicId;
    for (const recipient of recipients) {
      const person = (await request(app).post('/v1/trusted-contacts').set(actor).send({ displayName: 'Fixture person' }).expect(201)).body.trustedContact.publicId;
      const invitation = (await request(app).post('/v1/sharing/connections').set(actor).send({ personPublicId: person, email: `${recipient}@example.test`, grants: [{ matterPublicId: matter, detailLevel: 'details' }] }).expect(201)).body;
      const token = new URLSearchParams(new URL(invitation.invitationUrl).hash.slice(1)).get('invitation');
      await request(app).post('/v1/sharing/invitations/accept').set('x-dev-planner-id', recipient).send({ invitationToken: token, accepted: true }).expect(200);
      connections.push(invitation.connection.publicId);
    }
    await pool.query(`with round as (insert into app.family_review_rounds(planner_id,request_key,request_digest,due_at)
      values($1,gen_random_uuid(),'synthetic',now()+interval '1 day') returning id)
      insert into app.family_review_tasks(planner_id,round_id,connection_id,matter_item_id,grant_id,source_version,source_fields)
      select $1,round.id,g.connection_id,g.matter_item_id,g.id,1,'{"locationHint":"Paid folder"}'::jsonb from app.sharing_grants g cross join round where g.planner_id=$1`, [owner]);
    await pool.query('update app.commerce_entitlement_grants set expires_at=clock_timestamp() where id=$1', [entitlement]);
    expect((await pool.query('select count(*)::int n from app.sharing_saved_items')).rows[0].n).toBe(3);
    configureRecoveryPool(pool, { async publish(event) { journal.set(event.key, structuredClone(event)); } });
    await pool.query('update app.recovery_policy set enforced=true,coverage_started_at=now()');
    execFileSync('pg_dump', ['--format=custom', '--dbname', sourceUrl, '--file', dump]);
    const quoted = (await pool.query('select quote_ident($1) as name,quote_literal($2) as password', [operator, password])).rows[0];
    if (!(await pool.query('select 1 from pg_roles where rolname=$1', [operator])).rowCount) await pool.query(`create role ${quoted.name} login nosuperuser inherit nobypassrls password ${quoted.password}`);
    else await pool.query(`alter role ${quoted.name} password ${quoted.password}`);
    await pool.query(`grant continuity_recovery_service,continuity_content_service,continuity_app,continuity_auth to ${quoted.name}`);
  });
  afterAll(async () => { await pool.end(); await restored?.end(); rmSync(directory, { recursive: true, force: true }); });

  it('does not resurrect saved fields, removed grant identities or withdrawn review tasks', async () => {
    await scope(connections[0]!, 'name'); await scope(connections[0]!, 'details');
    await scope(connections[1]!, null); await scope(connections[1]!, 'details');
    expect(JSON.stringify([...journal.values()])).not.toMatch(/Paid folder|Withdrawn private note|Saved title/);
    execFileSync('pg_restore', ['--clean', '--if-exists', '--dbname', restoreUrl, dump]);
    const loginUrl = new URL(restoreUrl); loginUrl.username = operator; loginUrl.password = password;
    restored = new pg.Pool({ connectionString: loginUrl.href });
    expect((await restored.query('select rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
    await replayRecoveryControls(restored, [...journal.values()]);
    const rows = (await restored.query(`select c.public_id,s.fields from app.sharing_connections c
      join app.sharing_grants g on g.connection_id=c.id join app.sharing_saved_items s on s.grant_id=g.id order by c.id`)).rows;
    expect(rows).toEqual([
      { public_id: connections[0], fields: { title: 'Saved title', category: 'document' } },
      { public_id: connections[2], fields: expect.objectContaining({ notes: 'Withdrawn private note', locationHint: 'Paid folder' }) },
    ]);
    const tasks = (await restored.query('select connection_id,access_revoked_at from app.family_review_tasks order by id')).rows;
    expect(tasks[0].access_revoked_at).not.toBeNull();
    expect(tasks[1].access_revoked_at).not.toBeNull();
    expect(tasks[2].access_revoked_at).toBeNull();
    expect((await replayRecoveryControls(restored, [...journal.values()])).applied).toBe(0);
  }, 30_000);

  it('quarantines an ambiguous legacy connection update without changing the clone', async () => {
    const current = journal.get(`connection:${connections[0]}`)!;
    const legacy: RecoveryControl = { ...current, revision: String(BigInt(current.revision) + 1000n), facts: {
      status: current.facts.status, recipient: current.facts.recipient, version: current.facts.version,
      grants: (current.facts.grants as { matter: string; level: string }[]).map(({ matter, level }) => ({ matter, level })),
    } };
    await expect(replayRecoveryControls(restored, [legacy])).rejects.toThrow('permission-history reconciliation');
    expect((await restored.query('select revision::text from app.recovery_controls where entity_key=$1', [current.key])).rows[0].revision).toBe(current.revision);
  });
});
