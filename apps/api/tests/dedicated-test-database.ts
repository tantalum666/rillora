import { userInfo } from 'node:os';
import pg from 'pg';

/** Resolve ambient pg defaults before connecting; never pass them through to migrations. */
export function dedicatedTestDatabaseUrl(input: string, expectedName: string): string {
  const url = new URL(input);
  const host = url.hostname || process.env.PGHOST || 'localhost';
  const user = decodeURIComponent(url.username) || process.env.PGUSER || userInfo().username;
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(host)
    || url.pathname !== `/${expectedName}` || url.search || url.hash
    || !['postgres', userInfo().username].includes(user)) {
    throw new Error(`Tests require the dedicated local ${expectedName} database and test credentials`);
  }
  url.hostname = host;
  url.port = url.port || process.env.PGPORT || '5432';
  url.username = user;
  return url.toString();
}

/** Only read-only identity checks may run before this function succeeds. */
export async function assertDedicatedTestDatabase(input: string, expectedName: string): Promise<string> {
  const connectionString = dedicatedTestDatabaseUrl(input, expectedName);
  const client = new pg.Client({ connectionString, application_name: 'dedicated-test-database-guard' });
  await client.connect();
  try {
    const result = await client.query<{ name: string; user: string; local: boolean }>(
      `select current_database() as name, session_user as "user",
       inet_server_addr() is null or inet_server_addr() in ('127.0.0.1'::inet, '::1'::inet) as local`,
    );
    const row = result.rows[0];
    if (row?.name !== expectedName || !row.local
      || row.user !== decodeURIComponent(new URL(connectionString).username)) {
      throw new Error(`Tests refuse to modify an unverified ${expectedName} database`);
    }
    return connectionString;
  } finally {
    await client.end();
  }
}
