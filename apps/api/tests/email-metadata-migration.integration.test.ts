import pg from 'pg';
import {randomBytes,createHash} from 'node:crypto';
import {mkdtemp, readdir, copyFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {assertDedicatedTestDatabase,dedicatedTestDatabaseUrl} from './dedicated-test-database.js';
import {runMigrations} from '../src/migrate.js';
import {migrateEmailMatches} from '../src/migrate-email-matches.js';
import {verifiedEmailDigest,scopedEmailDigest} from '../src/sharing-identity.js';
import {checkEmailMatchReadiness} from '../src/email-match-readiness.js';
import {withPlannerDatabase} from '../src/db.js';
import {loadConfig} from '../src/config.js';
import {currentLegalContract as legal} from '../src/legal-contract.js';

const url=dedicatedTestDatabaseUrl('postgresql:///rillora_email_metadata_test','rillora_email_metadata_test');
const key=randomBytes(48).toString('base64url'),otherKey=randomBytes(48).toString('base64url');
const email='recipient@example.test',legacy=verifiedEmailDigest(email);
const tokens=[randomBytes(32),randomBytes(32)];
let pool:pg.Pool,owners:{id:string;public_id:string}[],before:Record<string,unknown>[];
let legacyDeletion:string;
describe.sequential('owner-scoped email matching upgrades existing records',()=>{
  beforeAll(async()=>{
    await assertDedicatedTestDatabase(url,'rillora_email_metadata_test');
    pool=new pg.Pool({connectionString:url});
    await pool.query('drop schema if exists app cascade');await pool.query('drop schema if exists rillora_guard cascade');
    const directory=await mkdtemp(join(tmpdir(),'rillora-email-old-schema-'));
    try{
      for(const file of await readdir('migrations'))if(/^\d+_.*\.sql$/.test(file)&&Number(file.slice(0,4))<=100)await copyFile(join('migrations',file),join(directory,file));
      await runMigrations(url,directory);
    }finally{await rm(directory,{recursive:true,force:true});}
    owners=[];
    for(const label of ['First','Second','Recipient']){
      const owner=(await pool.query('insert into app.planners(display_name) values($1) returning id::text,public_id',[label])).rows[0];
      owners.push(owner);await pool.query('insert into app.plans(planner_id) values($1)',[owner.id]);
    }
    for(let index=0;index<2;index++){
      const owner=owners[index]!;
      const person=(await pool.query("insert into app.people(planner_id,display_name) values($1,'Existing contact') returning id",[owner.id])).rows[0];
      await pool.query(`insert into app.sharing_connections(planner_id,person_id,recipient_email_hash,recipient_email_label,invitation_token_hash,invitation_expires_at)
        values($1,$2,$3,'re***@example.test',$4,now()+interval '2 days')`,[owner.id,person.id,legacy,tokens[index]]);
    }
    const recipient=owners[2]!,identity=(await pool.query("insert into app.identity_accounts(planner_id,issuer,subject) values($1,'https://identity.example','email-upgrade') returning id",[recipient.id])).rows[0].id;
    const accepted=(await pool.query(`insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,
      accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
      values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id`,
      [recipient.id,identity,legal.termsVersion,legal.privacyVersion,legal.consentTextVersion,Buffer.from(legal.bundleSha256,'hex'),createHash('sha256').update('synthetic identity reference').digest()])).rows[0].id;
    await pool.query('insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at,verified_email_hash) values($1,$2,$3,$4,$5,now()+interval \'1 hour\',$6)',
      [recipient.id,identity,accepted,randomBytes(32),randomBytes(32),legacy]);
    before=(await pool.query("select to_jsonb(c)-'recipient_email_hash' as value from app.sharing_connections c order by id")).rows.map(row=>row.value);
    legacyDeletion=(await pool.query("insert into app.account_deletions(planner_id,receipt_hash,identities) values($1,$2,$3::jsonb) returning public_id",
      [recipient.id,randomBytes(32),JSON.stringify([{issuer:'https://identity.example',subject:'email-upgrade'}])])).rows[0].public_id;
  });
  afterAll(async()=>{await pool?.end();});
  it('refuses a cutover that would strand a legacy pending identity deletion and preserves the old rows',async()=>{
    await expect(runMigrations(url)).rejects.toThrow('pending_identity_deletions_require_reconciliation');
    expect((await pool.query('select status from app.account_deletions where public_id=$1',[legacyDeletion])).rows[0].status).toBe('queued');
    expect((await pool.query("select count(*)::int n from information_schema.columns where table_schema='app' and table_name='auth_sessions' and column_name='deletion_identity_proof'")).rows[0].n).toBe(0);
    // Only this synthetic legacy job is reconciled; no provider operation runs.
    await pool.query('delete from app.account_deletions where public_id=$1',[legacyDeletion]);
    await runMigrations(url);
  });
  it('clears persisted session digests and refuses ready before backfill',async()=>{
    expect((await pool.query('select verified_email_hash from app.auth_sessions')).rows.every(row=>row.verified_email_hash===null)).toBe(true);
    await expect(checkEmailMatchReadiness(pool,loadConfig({NODE_ENV:'test',DATABASE_URL:url,EMAIL_MATCH_KEY:key}))).rejects.toThrow();
    await expect(pool.query('update app.auth_sessions set verified_email_hash=$1',[legacy])).rejects.toThrow('session_has_no_global_email_digest');
  });
  it('upgrades the exact old digest without email recovery, preserves link/state and separates owners',async()=>{
    expect(await migrateEmailMatches(pool,key)).toBe(2);
    const records=(await pool.query('select * from app.sharing_connections order by id')).rows;
    expect(records[0].recipient_email_hash).not.toEqual(legacy);
    expect(records[0].recipient_email_hash).not.toEqual(records[1].recipient_email_hash);
    for(let i=0;i<2;i++)expect(records[i].recipient_email_hash).toEqual(scopedEmailDigest(legacy,owners[i]!.public_id,key));
    const after=(await pool.query("select to_jsonb(c)-'recipient_email_hash'-'recipient_email_hash_version' as value from app.sharing_connections c order by id")).rows.map(row=>row.value);
    expect(after).toEqual(before);
    await expect(checkEmailMatchReadiness(pool,loadConfig({NODE_ENV:'test',DATABASE_URL:url,EMAIL_MATCH_KEY:key}))).resolves.toBeUndefined();
  });
  it('accepts an old pending invitation after upgrade using current email proof',async()=>{
    const result=await withPlannerDatabase(pool,owners[2]!.id,async c=>{
      const scope=(await c.query('select app.invitation_email_scope($1) as owner',[tokens[0]])).rows[0].owner;
      expect(scope).toBe(owners[0]!.public_id);
      return (await c.query('select app.accept_sharing_invitation($1,$2) as result',[tokens[0],scopedEmailDigest(verifiedEmailDigest(' RECIPIENT@example.test '),scope,key)])).rows[0].result;
    });
    expect(result.status).toBe('accepted');
    expect(scopedEmailDigest(legacy,owners[0]!.public_id,key)).toEqual(scopedEmailDigest(verifiedEmailDigest(email.toUpperCase()),owners[0]!.public_id,key));
  });
  it('is idempotent and rejects a wrong key without rewriting existing matches',async()=>{
    const before=(await pool.query('select recipient_email_hash from app.sharing_connections order by id')).rows;
    expect(await migrateEmailMatches(pool,key)).toBe(0);
    await expect(migrateEmailMatches(pool,otherKey)).rejects.toThrow('differs');
    await expect(checkEmailMatchReadiness(pool,loadConfig({NODE_ENV:'test',DATABASE_URL:url,EMAIL_MATCH_KEY:otherKey}))).rejects.toThrow();
    expect((await pool.query('select recipient_email_hash from app.sharing_connections order by id')).rows).toEqual(before);
  });
  it('removes an expired sealed identity proof while preserving the opaque session and legal receipt',async()=>{
    const previous=(await pool.query('select token_hash,legal_acceptance_id from app.auth_sessions')).rows[0];
    await pool.query("update app.auth_sessions set authenticated_at=clock_timestamp()-interval '599.5 seconds',deletion_identity_proof=$1::jsonb",
      [JSON.stringify({fixture:'sealed nonsecret proof'})]);
    expect((await pool.query('select deletion_identity_proof from app.auth_sessions')).rows[0].deletion_identity_proof).not.toBeNull();
    await new Promise(resolve=>setTimeout(resolve,800));
    expect((await pool.query('select app.sweep_deletion_identity_proofs() as removed')).rows[0].removed).toBe(1);
    const current=(await pool.query('select token_hash,legal_acceptance_id,deletion_identity_proof,revoked_at from app.auth_sessions')).rows[0];
    expect(current).toEqual({...previous,deletion_identity_proof:null,revoked_at:null});
  });
});
