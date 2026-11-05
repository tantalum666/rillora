import type { DatabasePool } from './db.js';
import { withAuthDatabase } from './db.js';
import type { EmailIdentity, IdentitySecurityStatus, IdentitySecurityVerifying } from './email-verification.js';
import { ApiError } from './errors.js';

export const identityRecheckMilliseconds = 4 * 60 * 60_000;
const unavailable = () => new ApiError(503, 'identity_status_unavailable', 'Account security could not be checked. Please try again shortly.');
const expired = () => new ApiError(401, 'authentication_required', 'Sign in again to continue.');

/** Existing read:users service only. No new provider permission or refresh token. */
export class SessionSecurity {
  private readonly checking = new Map<string, Promise<void>>();
  constructor(private readonly pool: DatabasePool, private readonly verifier: IdentitySecurityVerifying | null) {}

  get available(): boolean { return this.verifier !== null; }

  private async status(identity: EmailIdentity): Promise<IdentitySecurityStatus> {
    if (!this.verifier) throw unavailable();
    try { return await this.verifier.securityStatus(identity); }
    catch { throw unavailable(); }
  }

  async verifyNewIdentity(identity: EmailIdentity & { authenticatedAt: Date | null }): Promise<void> {
    const status = await this.status(identity);
    if (!status.exists || status.blocked || (status.passwordChangedAt
      && (!identity.authenticatedAt || status.passwordChangedAt > identity.authenticatedAt))) throw expired();
  }

  async verifySession(publicId: string): Promise<void> {
    const existing = this.checking.get(publicId);
    if (existing) return existing;
    if (this.checking.size >= 32) throw unavailable();
    const check = this.checkSession(publicId);
    this.checking.set(publicId, check);
    try { await check; }
    finally { if (this.checking.get(publicId) === check) this.checking.delete(publicId); }
  }

  private async checkSession(publicId: string): Promise<void> {
    const identity = await withAuthDatabase(this.pool, async client => (await client.query<EmailIdentity & {
      identity_account_id: string; authenticated_at: Date | null; identity_checked_at: Date;
    }>(`select i.id::text as identity_account_id,i.issuer,i.subject,s.authenticated_at,s.identity_checked_at
      from app.auth_sessions s join app.identity_accounts i on i.id=s.identity_account_id and i.planner_id=s.planner_id
      join app.planners p on p.id=s.planner_id
      where s.public_id=$1 and s.context_version=1 and s.revoked_at is null and s.expires_at>now()
        and s.last_seen_at>now()-make_interval(mins=>s.idle_timeout_minutes) and p.status='active'`, [publicId])).rows[0]);
    if (!identity) throw expired();
    if (identity.identity_checked_at.getTime() > Date.now() - identityRecheckMilliseconds) return;
    const status = await this.status(identity);
    await withAuthDatabase(this.pool, async client => {
      if (!status.exists || status.blocked) {
        await client.query('update app.auth_sessions set revoked_at=coalesce(revoked_at,now()) where identity_account_id=$1', [identity.identity_account_id]);
      } else if (status.passwordChangedAt) {
        // Do not invalidate a concurrent fresh login that happened after the reset.
        await client.query(`update app.auth_sessions set revoked_at=coalesce(revoked_at,now())
          where identity_account_id=$1 and (authenticated_at is null or authenticated_at<$2)`,
        [identity.identity_account_id, status.passwordChangedAt]);
      }
      await client.query(`update app.auth_sessions set identity_checked_at=now()
        where public_id=$1 and identity_account_id=$2 and context_version=1 and revoked_at is null
          and expires_at>now() and authenticated_at is not distinct from $3`,
      [publicId, identity.identity_account_id, identity.authenticated_at]);
    });
    // The caller reloads the active session after this asynchronous provider check.
    // A concurrent reauthentication must not be mistaken for a revoked new session.
  }
}
