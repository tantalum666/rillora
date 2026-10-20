import type { PoolClient } from 'pg';
import { ApiError } from './errors.js';

export async function admitAuthenticationTransaction(client: PoolClient): Promise<boolean> {
  const result = await client.query<{ admitted: boolean }>('select app.admit_auth_transaction() as admitted');
  return result.rows[0]?.admitted === true;
}

export function authenticationBusy(): ApiError {
  return new ApiError(429, 'authentication_busy', 'Sign in is busy. Try again shortly.');
}
