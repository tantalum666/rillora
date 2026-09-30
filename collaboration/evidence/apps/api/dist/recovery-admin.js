import { createHash, randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { loadContentProtectionConfig, loadDatabaseConfig } from './config.js';
import { configureContentPool, databaseConnectionOptions, withPlannerDatabase } from './db.js';
import { configureRecoveryPool, DynamoRecoveryJournal } from './recovery-journal.js';
import { readRecoveryJournal, replayRecoveryControls, validateRecoveryHost, validateRecoveryWindow } from './recovery-replay.js';
import { protectFields } from './private-content.js';
import { inspectPrivateContent } from './migrate-private-content.js';
import { AccountDeletionProcessor } from './account-deletion.js';
import { currentLegalContract as legal } from './legal-contract.js';
const assert = (condition, message) => { if (!condition)
    throw new Error(message); };
function fixtureId(run, label) {
    const x = createHash('sha256').update(`rillora-restore:${run}:${label}`).digest('hex');
    return `${x.slice(0, 8)}-${x.slice(8, 12)}-4${x.slice(13, 16)}-8${x.slice(17, 20)}-${x.slice(20, 32)}`;
}
function markers(run) { return { title: `Recovery fixture ${run}`, provider: `Synthetic institution ${run}`, location: `Synthetic locator ${run}` }; }
async function setup(pool, table, host) {
    const client = new DynamoDBClient({ region: 'eu-central-1' });
    const generation = (await pool.query('select generation from app.recovery_policy where singleton')).rows[0].generation;
    const key = { pk: { S: 'rillora-production' }, sk: { S: '__coverage' } };
    let item = (await client.send(new GetItemCommand({ TableName: table, Key: key, ConsistentRead: true }))).Item;
    if (!item) {
        assert((await pool.query('select count(*)::int n from app.planners')).rows[0].n === 0, 'Initialize the closed empty foundation before fixtures');
        const coverage = { version: 1, startedAt: new Date().toISOString(), sourceHost: host, databaseGeneration: generation };
        await client.send(new PutItemCommand({ TableName: table, Item: { ...key, payload: { S: JSON.stringify(coverage) } }, ConditionExpression: 'attribute_not_exists(pk)' }));
        item = { ...key, payload: { S: JSON.stringify(coverage) } };
    }
    const coverage = JSON.parse(item.payload?.S ?? 'null');
    assert(coverage?.version === 1 && coverage.sourceHost === host && coverage.databaseGeneration === generation, 'Unexpected recovery coverage source');
    await pool.query('update app.recovery_policy set enforced=true,coverage_started_at=$1 where singleton', [coverage.startedAt]);
    return { journalEnforced: true, coverageStartedAt: coverage.startedAt };
}
async function seed(pool, run) {
    const ids = ['A', 'B', 'C', 'D'].map(label => fixtureId(run, label));
    assert((await pool.query('select count(*)::int n from app.planners where not(public_id=any($1::uuid[]))', [ids])).rows[0].n === 0, 'Synthetic fixture refused: unrelated accounts exist');
    assert((await pool.query('select enforced from app.recovery_policy where singleton')).rows[0]?.enforced === true, 'Journal enforcement is required');
    const owners = new Map();
    for (const label of ['A', 'B', 'C', 'D']) {
        const id = fixtureId(run, label), name = `Recovery fixture ${run} ${label}`;
        const existing = (await pool.query('select id::text,display_name from app.planners where public_id=$1', [id])).rows[0];
        if (existing)
            assert(existing.display_name === name, 'Fixture identity collision');
        const row = existing ?? (await pool.query('insert into app.planners(public_id,display_name) values($1,$2) returning id::text', [id, name])).rows[0];
        owners.set(label, row.id);
        await pool.query('insert into app.plans(planner_id) values($1) on conflict(planner_id) do nothing', [row.id]);
    }
    const m = markers(run);
    for (const label of ['A', 'D'])
        await withPlannerDatabase(pool, owners.get(label), async (c) => {
            const id = fixtureId(run, `matter-${label}`);
            if ((await c.query('select 1 from app.matter_items where public_id=$1', [id])).rowCount)
                return;
            const fields = await protectFields(c, { kind: 'matter', publicId: id }, { title: m.title, institution_name: m.provider, location_hint: m.location, value_band: 'unknown' });
            await c.query(`insert into app.matter_items(public_id,planner_id,plan_id,category,title,institution_name,location_hint,value_band)
   select $1,p.id,plan.id,'account',$2,$3,$4,$5 from app.planners p join app.plans plan on plan.planner_id=p.id where p.id=app.current_planner_id()`, [id, fields.title, fields.institution_name, fields.location_hint, fields.value_band]);
        });
    for (const label of ['B', 'C']) {
        const person = fixtureId(run, `person-${label}`), connection = fixtureId(run, `connection-${label}`);
        const invitationHash = createHash('sha256').update(`${run}:invite:${label}`).digest();
        const emailHash = createHash('sha256').update(`${run}:${label}@example.invalid`).digest();
        await withPlannerDatabase(pool, owners.get('A'), async (c) => {
            if ((await c.query('select 1 from app.sharing_connections where public_id=$1', [connection])).rowCount)
                return;
            const fields = await protectFields(c, { kind: 'person', publicId: person }, { display_name: `Synthetic recipient ${label}` });
            const pid = (await c.query('insert into app.people(public_id,planner_id,display_name) values($1,app.current_planner_id(),$2) returning id', [person, fields.display_name])).rows[0].id;
            const cid = (await c.query(`insert into app.sharing_connections(public_id,planner_id,person_id,recipient_email_hash,recipient_email_label,invitation_token_hash,invitation_expires_at)
    values($1,app.current_planner_id(),$2,$3,'synthetic@example.invalid',$4,now()+interval '1 day') returning id`, [connection, pid, emailHash, invitationHash])).rows[0].id;
            await c.query(`insert into app.sharing_grants(planner_id,connection_id,matter_item_id,detail_level)
    select app.current_planner_id(),$1,id,'details' from app.matter_items where public_id=$2`, [cid, fixtureId(run, 'matter-A')]);
        });
        await withPlannerDatabase(pool, owners.get(label), async (c) => {
            const result = (await c.query('select app.accept_sharing_invitation($1,$2) as result', [invitationHash, emailHash])).rows[0].result;
            assert(result.status === 'accepted', 'Synthetic domain acceptance failed');
        });
    }
    const sessionId = fixtureId(run, 'session');
    if (!(await pool.query('select 1 from app.auth_sessions where public_id=$1', [sessionId])).rowCount) {
        const identity = (await pool.query("insert into app.identity_accounts(planner_id,issuer,subject) values($1,'https://recovery.example.invalid',$2) returning id", [owners.get('A'), run])).rows[0].id;
        const acceptance = (await pool.query(`insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,
   accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id`, [owners.get('A'), identity, legal.termsVersion, legal.privacyVersion, legal.consentTextVersion, Buffer.from(legal.bundleSha256, 'hex'), createHash('sha256').update('https://recovery.example.invalid' + String.fromCharCode(31) + run).digest()])).rows[0].id;
        await pool.query(`insert into app.auth_sessions(public_id,planner_id,identity_account_id,token_hash,csrf_token_hash,expires_at,legal_acceptance_id)
   values($1,$2,$3,$4,$5,now()+interval '4 hours',$6)`, [sessionId, owners.get('A'), identity, randomBytes(32), randomBytes(32), acceptance]);
    }
    const inspection = await inspectPrivateContent(pool);
    assert(inspection.plaintextValues === 0 && inspection.invalidReferences === 0, 'Fixture contains unprotected content');
    return { syntheticOnly: true, planners: 4, ...inspection };
}
async function afterSnapshot(pool, run) {
    const owner = (await pool.query('select id::text from app.planners where public_id=$1', [fixtureId(run, 'A')])).rows[0];
    assert(owner, 'Fixture owner is missing');
    await withPlannerDatabase(pool, owner.id, c => c.query("update app.sharing_connections set status='revoked',revoked_at=coalesce(revoked_at,now()),version=version+1 where public_id=$1 and status<>'revoked'", [fixtureId(run, 'connection-C')]));
    const deleted = (await pool.query('select id::text,status from app.planners where public_id=$1', [fixtureId(run, 'D')])).rows[0];
    if (deleted) {
        const existing = (await pool.query('select public_id from app.account_deletions where planner_id=$1', [deleted.id])).rows[0]?.public_id;
        const job = existing ?? await withPlannerDatabase(pool, deleted.id, async (c) => (await c.query('select app.request_account_deletion($1) as id', [randomBytes(32)])).rows[0].id);
        await new AccountDeletionProcessor(pool, null).process(job);
    }
    assert(!(await pool.query('select 1 from app.planners where public_id=$1', [fixtureId(run, 'D')])).rowCount, 'Fixture deletion did not complete');
    return { revokedC: true, deletedD: true, changesUsedNormalJournalTransactions: true };
}
async function cleanupFixtures(pool, run) {
    for (const label of ['A', 'B', 'C', 'D']) {
        const planner = (await pool.query('select id::text,display_name,status from app.planners where public_id=$1', [fixtureId(run, label)])).rows[0];
        if (!planner)
            continue;
        assert(planner.display_name === `Recovery fixture ${run} ${label}`, 'Refusing to remove a non-fixture account');
        const identities = (await pool.query('select issuer,subject from app.identity_accounts where planner_id=$1', [planner.id])).rows;
        assert(identities.every(i => label === 'A' && i.issuer === 'https://recovery.example.invalid' && i.subject === run), 'Fixture acquired a real identity; cleanup refused');
        await pool.query("delete from app.identity_accounts where planner_id=$1 and issuer='https://recovery.example.invalid' and subject=$2", [planner.id, run]);
        const existing = (await pool.query('select public_id from app.account_deletions where planner_id=$1', [planner.id])).rows[0]?.public_id;
        const job = existing ?? await withPlannerDatabase(pool, planner.id, async (c) => (await c.query('select app.request_account_deletion($1) as id', [randomBytes(32)])).rows[0].id);
        await new AccountDeletionProcessor(pool, null).process(job);
    }
    const ids = ['A', 'B', 'C', 'D'].map(label => fixtureId(run, label));
    assert(!(await pool.query('select 1 from app.planners where public_id=any($1::uuid[])', [ids])).rowCount, 'Fixture cleanup is still pending');
    return { syntheticFixtureAccountsRemoved: true, remainingPlanners: (await pool.query('select count(*)::int n from app.planners')).rows[0].n,
        remainingContentKeys: (await pool.query('select count(*)::int n from app.private_content_keys')).rows[0].n,
        remainingContentValues: (await pool.query('select count(*)::int n from app.private_content_values')).rows[0].n };
}
async function inspectSchema(pool) {
    const directory = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
    const expected = (await readdir(directory)).filter(n => /^\d+_[a-z0-9_]+\.sql$/.test(n)).sort();
    const actual = new Map((await pool.query('select name,checksum from app.schema_migrations')).rows.map(r => [r.name, r.checksum]));
    for (const name of expected)
        assert(actual.get(name) === createHash('sha256').update(await readFile(join(directory, name))).digest('hex'), 'Restored migration mismatch');
    assert(actual.size === expected.length, 'Unexpected restored schema');
    return expected.length;
}
async function restore(pool, table, run, snapshotTime) {
    const migrations = await inspectSchema(pool);
    const journal = await readRecoveryJournal(table);
    validateRecoveryWindow(snapshotTime, journal.coverage);
    const deletedBefore = (await pool.query('select id::text from app.planners where public_id=$1', [fixtureId(run, 'D')])).rows[0]?.id;
    if (deletedBefore) {
        assert((await pool.query('select count(*)::int n from app.private_content_keys where planner_id=$1', [deletedBefore])).rows[0].n === 1, 'Restored deleted fixture key missing');
        assert((await pool.query('select 1 from app.auth_sessions where public_id=$1', [fixtureId(run, 'session')])).rowCount === 1, 'Pre-replay session fixture missing');
        console.log(JSON.stringify({ phase: 'pre-replay', deletedFixtureAndKeyPresent: true, oldSessionPresent: true }));
    }
    else {
        const deletion = journal.events.find(e => e.kind === 'account' && e.id === fixtureId(run, 'D') && e.facts.deleted === true);
        const checkpoint = (await pool.query('select revision::text from app.recovery_controls where entity_key=$1', [`account:${fixtureId(run, 'D')}`])).rows[0];
        assert(deletion && checkpoint?.revision === deletion.revision, 'No pre-replay fixture or verified prior replay checkpoint');
    }
    const replay = await replayRecoveryControls(pool, journal.events, journal.coverage.databaseGeneration);
    const lookup = async (label) => {
        const owner = (await pool.query('select id::text from app.planners where public_id=$1', [fixtureId(run, label)])).rows[0];
        return withPlannerDatabase(pool, owner.id, async (c) => (await c.query('select app.recipient_shared_items() as items')).rows[0].items);
    };
    const b = await lookup('B'), c = await lookup('C');
    assert(b.length === 1 && b[0].fields.title === markers(run).title, 'Unaffected recipient or production KMS decryption failed');
    assert(c.length === 0, 'Revoked recipient regained access');
    assert(!(await pool.query('select 1 from app.planners where public_id=$1', [fixtureId(run, 'D')])).rowCount, 'Deleted account resurrected');
    assert(!(await pool.query('select 1 from app.private_content_keys where planner_id=$1', [deletedBefore])).rowCount, 'Deleted account key resurrected');
    assert(!(await pool.query('select 1 from app.private_content_values where planner_id=$1', [deletedBefore])).rowCount, 'Deleted account contents resurrected');
    assert(!(await pool.query('select 1 from app.private_content_keys k left join app.planners p on p.id=k.planner_id where p.id is null')).rowCount, 'Orphaned restored keys remain');
    assert(!(await pool.query('select 1 from app.auth_sessions')).rowCount, 'Old sessions remain');
    const inspection = await inspectPrivateContent(pool);
    assert(inspection.plaintextValues === 0 && inspection.invalidReferences === 0, 'Restored encryption representation failed');
    const repeated = await replayRecoveryControls(pool, journal.events, journal.coverage.databaseGeneration);
    assert(repeated.applied === 0, 'Replay is not idempotent');
    return { syntheticOnly: true, resumedReplay: !deletedBefore, migrations, ...replay, ...inspection, productionKmsDecrypt: true, recipientBRetained: true,
        recipientCRefused: true, deletedAccountAndKeysAbsent: true, oldSessionsRemoved: true, repeatedReplayNoChanges: true, customerTrafficEnabled: false };
}
async function main() {
    const operation = process.argv[2], database = loadDatabaseConfig(), content = loadContentProtectionConfig();
    const run = process.env.RECOVERY_RUN ?? '', table = process.env.RECOVERY_JOURNAL_TABLE ?? '';
    assert(['initialize', 'seed', 'after-snapshot', 'restore', 'cleanup-fixtures'].includes(operation ?? ''), 'Explicit recovery operation required');
    assert(content?.namespace === 'rillora-production' && content.mode === 'encrypted', 'Production content namespace is required');
    assert(database.sslMode === 'verify-full' && database.host, 'Verified TLS with an explicit host is required');
    if (operation === 'restore')
        validateRecoveryHost(database.host, true);
    else
        assert(/^rillora-production\.[a-z0-9]+\.eu-central-1\.rds\.amazonaws\.com$/.test(database.host), 'Source operation requires the isolated production foundation');
    if (operation !== 'initialize')
        assert(/^[a-f0-9]{16}$/.test(run), 'Exact synthetic recovery run identifier required');
    const pool = new pg.Pool({ ...databaseConnectionOptions(database), max: 2, application_name: 'rillora-isolated-recovery' });
    configureContentPool(pool, content);
    if (operation !== 'restore')
        configureRecoveryPool(pool, new DynamoRecoveryJournal(table, 'rillora-production'));
    try {
        assert((await pool.query('select ssl from pg_stat_ssl where pid=pg_backend_pid()')).rows[0]?.ssl === true, 'Database connection is not TLS');
        let result;
        if (operation === 'initialize')
            result = await setup(pool, table, database.host);
        else if (operation === 'seed')
            result = await seed(pool, run);
        else if (operation === 'after-snapshot')
            result = await afterSnapshot(pool, run);
        else if (operation === 'cleanup-fixtures')
            result = await cleanupFixtures(pool, run);
        else
            result = await restore(pool, table, run, process.env.RECOVERY_SNAPSHOT_TIME ?? '');
        console.log(JSON.stringify(result));
    }
    finally {
        await pool.end();
    }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
    void main().catch(error => {
        // Errors are operator-only fixed messages; never dump SQL parameters or rows.
        console.error(JSON.stringify({ recoveryFailed: true, error: error instanceof Error ? error.message : 'Recovery failed' }));
        process.exitCode = 1;
    });
