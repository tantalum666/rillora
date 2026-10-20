import { createHmac } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

export type RuntimeRole = 'continuity_app' | 'continuity_auth' | 'continuity_rehearsal' | 'continuity_commerce';
const keys = new WeakMap<Pool, string>();

export function configureDatabaseAuthority(pool: Pool, key: string | null): void {
  if (key === null) { keys.delete(pool); return; }
  if (!/^[A-Za-z0-9_-]{48,128}$/.test(key)) throw new Error('Invalid database authority configuration');
  keys.set(pool, key);
}

/** A stolen SQL password is insufficient to select an actor or privileged role.
 * The application signer remains trusted; this is not an API-RCE containment claim.
 */
export async function bindDatabaseAuthority(pool: Pool, client: PoolClient, role: RuntimeRole,
  plannerId: string | null = null): Promise<void> {
  const key = keys.get(pool);
  if (!key) return; // Administrative test/migration logins are separately checked in SQL.
  if (plannerId !== null && !/^[1-9][0-9]{0,18}$/.test(plannerId)) throw new Error('Invalid database actor');
  const result = await client.query<{ database: string; login: string; pid: string; transaction: string; expires: string }>(
    "select current_database() as database, session_user as login, pg_backend_pid()::text as pid, txid_current()::text as transaction, (floor(extract(epoch from clock_timestamp()))::bigint+120)::text as expires",
  );
  const context = result.rows[0]!;
  if (![context.database, context.login].every(value => /^[a-z][a-z0-9_]{0,62}$/.test(value))) throw new Error('Invalid database authority context');
  const actor = plannerId ?? '';
  const message = ['rillora-db-v1', context.database, context.login, context.pid, context.transaction, role, actor, context.expires].join('|');
  const signature = createHmac('sha256', key).update(message).digest('hex');
  await client.query(
    "select set_config('app.current_planner_id',$1,true), set_config('app.authority_expires',$2,true), set_config('app.authority_signature',$3,true)",
    [actor, context.expires, signature],
  );
  if (!(await client.query('select app.runtime_authority_valid() as valid')).rows[0]?.valid) {
    throw new Error('Database authority could not be established');
  }
}
