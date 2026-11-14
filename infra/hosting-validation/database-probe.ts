import pg from 'pg';

/** Read-only against the already isolated synthetic project. Never accepts SQL. */
export async function probeDatabase(env: Env) {
  const pool = new pg.Pool({ connectionString: env.DATABASE.connectionString,
    max: 1, connectionTimeoutMillis: 10000, statement_timeout: 10000,
    application_name: 'rillora-hosting-validation-readonly' });
  let client: pg.PoolClient | undefined;
  const start = performance.now();
  try {
    client = await pool.connect();
    await client.query('begin read only');
    const result = await client.query(`select current_database() as database, session_user as login,
      rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolinherit
      from pg_roles where rolname=session_user`);
    const row = result.rows[0];
    if (row?.database !== 'rillora_ai_candidate' || !/^continuity_runtime/.test(row.login)
      || row.rolsuper || row.rolbypassrls || row.rolcreaterole || row.rolcreatedb || row.rolinherit) {
      throw new Error('Synthetic database boundary did not match');
    }
    await client.query('set local role continuity_app');
    const valid = (await client.query('select app.runtime_authority_valid() as valid')).rows[0]?.valid;
    await client.query('rollback');
    // Do not return database names, role names, identities, secrets or row data.
    return { evidence: 'live-synthetic-hyperdrive-postgres-readonly',
      leastPrivilegeLogin: true, unsignedAuthorityRejected: valid === false,
      elapsedMs: Math.round(performance.now() - start), passed: valid === false };
  } finally {
    await client?.query('rollback').catch(() => undefined);
    client?.release();
    await pool.end();
  }
}
