import pg from 'pg';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadDatabaseConfig } from './config.js';
import { databaseConnectionOptions } from './db.js';
import { scopedEmailDigest, emailMatchVerifier } from './sharing-identity.js';
import { configureRecoveryPool, publishRecoveryTransaction, recoveryPublisherFromEnvironment } from './recovery-journal.js';

/** Re-key the old one-way value; never reconstruct, export or require raw addresses. */
export async function migrateEmailMatches(pool: pg.Pool, key: string): Promise<number> {
  if (!/^[A-Za-z0-9_-]{48,128}$/.test(key)) throw new Error('Invalid email matching migration key');
  const client = await pool.connect();
  try {
    await client.query('begin');
    if (!(await client.query("select pg_has_role(session_user,'continuity_authority_service','MEMBER') as allowed")).rows[0]?.allowed) {
      throw new Error('Email matching migration requires the dedicated administrative credential');
    }
    await client.query('lock app.sharing_connections in share row exclusive mode');
    const verifier = emailMatchVerifier(key);
    const prior = (await client.query<{ key_verifier: Buffer }>('select key_verifier from app.email_match_policy where singleton')).rows[0]?.key_verifier;
    if (prior && !timingSafeEqual(prior, verifier)) throw new Error('Email matching key differs from the existing migration');
    let changed = 0;
    for (;;) {
      const batch = await client.query<{ id: string; recipient_email_hash: Buffer; owner: string }>(
        'select c.id::text,c.recipient_email_hash,p.public_id as owner from app.sharing_connections c join app.planners p on p.id=c.planner_id where c.recipient_email_hash_version=1 order by c.id limit 500 for update of c',
      );
      if (!batch.rowCount) break;
      for (const row of batch.rows) {
        await client.query('update app.sharing_connections set recipient_email_hash=$2,recipient_email_hash_version=2 where id=$1 and recipient_email_hash_version=1',
          [row.id, scopedEmailDigest(row.recipient_email_hash, row.owner, key)]);
        changed++;
      }
    }
    await client.query('insert into app.email_match_policy(singleton,key_verifier) values(true,$1) on conflict(singleton) do nothing', [verifier]);
    await publishRecoveryTransaction(pool, client);
    await client.query('commit');
    return changed;
  } catch(error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pool = new pg.Pool({...databaseConnectionOptions(loadDatabaseConfig()),max:1,application_name:'rillora-email-match-migration'});
  try {
    const publisher = recoveryPublisherFromEnvironment(); if (publisher) configureRecoveryPool(pool, publisher);
    const migrated = await migrateEmailMatches(pool, process.env.EMAIL_MATCH_KEY ?? '');
    process.stdout.write(JSON.stringify({migrated,keyPrinted:false})+'\n');
  } catch { process.stderr.write('Email matching migration failed; no key or address was printed.\n'); process.exitCode=1; }
  finally { await pool.end(); }
}
