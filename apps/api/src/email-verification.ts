import type { Request } from "express";
import { z } from "zod";
import type { DatabasePool } from "./db.js";
import { withAuthDatabase } from "./db.js";
import { ApiError } from "./errors.js";
import { verifiedEmailDigest } from "./sharing-identity.js";

export type EmailVerificationConfig = {
  domain: string;
  clientId: string;
  clientSecret: string;
  allowedIssuers: string[];
};
export type EmailIdentity = { issuer: string; subject: string };
export interface EmailIdentityVerifying {
  verifiedEmail(identity: EmailIdentity): Promise<string | null>;
}
export type IdentitySecurityStatus = { exists: boolean; blocked: boolean; passwordChangedAt: Date | null };
export interface IdentitySecurityVerifying {
  securityStatus(identity: EmailIdentity): Promise<IdentitySecurityStatus>;
}

/** Read current provider proof for one server-selected identity. Never set email_verified. */
export class Auth0EmailIdentityVerifier implements EmailIdentityVerifying, IdentitySecurityVerifying {
  private token: { value: string; expiresAt: number } | null = null;
  private tokenLoading: Promise<string> | null = null;
  constructor(private config: EmailVerificationConfig, private transport: typeof fetch = fetch) {}

  async verifiedEmail(identity: EmailIdentity): Promise<string | null> {
    const profile = await this.readProfile(identity, 'user_id,email,email_verified', false);
    if (!profile) throw new Error('email_verification_unavailable');
    if (profile.email_verified !== true) return null;
    const email = z.email().max(254).safeParse(profile.email);
    if (!email.success) throw new Error('email_verification_unavailable');
    return email.data;
  }

  async securityStatus(identity: EmailIdentity): Promise<IdentitySecurityStatus> {
    const profile = await this.readProfile(identity, 'user_id,blocked,last_password_reset', true);
    if (!profile) return { exists: false, blocked: true, passwordChangedAt: null };
    if (profile.blocked !== undefined && typeof profile.blocked !== 'boolean') throw new Error('identity_status_unavailable');
    const reset = profile.last_password_reset;
    if (reset !== undefined && reset !== null && !z.iso.datetime({ offset: true }).safeParse(reset).success) {
      throw new Error('identity_status_unavailable');
    }
    const passwordChangedAt = typeof reset === 'string' ? new Date(reset) : null;
    if (passwordChangedAt && passwordChangedAt.getTime() > Date.now() + 30_000) throw new Error('identity_status_unavailable');
    return { exists: true, blocked: profile.blocked === true, passwordChangedAt };
  }

  private async readProfile(identity: EmailIdentity, fields: string, allowMissing: boolean): Promise<Record<string, unknown> | null> {
    const issuer = identity.issuer.replace(/\/$/, "");
    if (!this.config.allowedIssuers.some(value => value.replace(/\/$/, "") === issuer)
      || !identity.subject || identity.subject.length > 255) throw new Error("identity_scope_mismatch");
    const accessToken = await this.accessToken();
    const url = new URL(`https://${this.config.domain}/api/v2/users/${encodeURIComponent(identity.subject)}`);
    url.searchParams.set("fields", fields);
    url.searchParams.set("include_fields", "true");
    const response = await this.transport(url, {
      headers: { authorization: `Bearer ${accessToken}` }, redirect: "error", signal: AbortSignal.timeout(5_000),
    });
    if (response.status === 401 && this.token?.value === accessToken) this.token = null;
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      if (response.status === 404 && allowMissing) return null;
      throw new Error("email_verification_unavailable");
    }
    const profile = await readIdentityJson(response);
    if (profile.user_id !== identity.subject) throw new Error("identity_scope_mismatch");
    return profile;
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    if (this.tokenLoading) return this.tokenLoading;
    const loading = this.loadAccessToken(); this.tokenLoading = loading;
    try { return await loading; }
    finally { if (this.tokenLoading === loading) this.tokenLoading = null; }
  }

  private async loadAccessToken(): Promise<string> {
    const response = await this.transport(`https://${this.config.domain}/oauth/token`, {
      method: "POST", headers: { "content-type": "application/json" }, redirect: "error",
      signal: AbortSignal.timeout(5_000),
      body: JSON.stringify({ grant_type: "client_credentials", client_id: this.config.clientId,
        client_secret: this.config.clientSecret, audience: `https://${this.config.domain}/api/v2/`, scope: "read:users" }),
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new Error("email_verification_unavailable");
    }
    const token = await readIdentityJson(response) as { access_token?: unknown; expires_in?: unknown };
    if (typeof token.access_token !== "string" || !token.access_token || token.access_token.length > 16384 || typeof token.expires_in !== "number"
      || !Number.isFinite(token.expires_in) || token.expires_in <= 60) throw new Error("email_verification_unavailable");
    this.token = { value: token.access_token, expiresAt: Date.now() + (Math.min(token.expires_in, 86_400) - 60) * 1_000 };
    return this.token!.value;
  }

}

export class SessionEmailVerification {
  constructor(private pool: DatabasePool, private verifier: EmailIdentityVerifying | null) {}

  async refresh(auth: Request["auth"], requireCurrentProof = false): Promise<Buffer | null> {
    if (auth.verifiedEmailHash && !requireCurrentProof) return auth.verifiedEmailHash;
    if (!auth.sessionPublicId || !this.verifier) {
      throw new ApiError(503, "email_verification_unavailable", "Email verification could not be checked. Keep this invitation open and try again.");
    }
    const identity = await withAuthDatabase(this.pool, async client => (await client.query<EmailIdentity>(
      `select i.issuer, i.subject from app.auth_sessions s
       join app.identity_accounts i on i.id = s.identity_account_id and i.planner_id = s.planner_id
       join app.planners p on p.id = s.planner_id
       where s.public_id = $1 and s.planner_id = $2 and s.revoked_at is null
         and s.expires_at > now() and p.status = 'active'`,
      [auth.sessionPublicId, auth.plannerId],
    )).rows[0]);
    if (!identity) throw new ApiError(401, "authentication_required", "Sign in to continue with this invitation.");
    let email: string | null;
    try { email = await this.verifier.verifiedEmail(identity); }
    catch {
      delete auth.verifiedEmailHash;
      await withAuthDatabase(this.pool, client => client.query(
        'update app.auth_sessions set verified_email_hash=null where public_id=$1 and planner_id=$2',
        [auth.sessionPublicId, auth.plannerId],
      ));
      throw new ApiError(503, "email_verification_unavailable", "Email verification could not be checked. Keep this invitation open and try again.");
    }
    const hash = email ? verifiedEmailDigest(email) : null;
    const updated = await withAuthDatabase(this.pool, client => client.query(
      `update app.auth_sessions s set verified_email_hash = null
       from app.identity_accounts i, app.planners p
       where s.public_id = $1 and s.planner_id = $2 and s.revoked_at is null and s.expires_at > now()
         and i.id = s.identity_account_id and i.planner_id = s.planner_id and i.issuer = $3 and i.subject = $4
         and p.id = s.planner_id and p.status = 'active'`,
      [auth.sessionPublicId, auth.plannerId, identity.issuer, identity.subject],
    ));
    if (updated.rowCount !== 1) throw new ApiError(401, "authentication_required", "Sign in to continue with this invitation.");
    // The same cookie/bearer and legal receipt remain in force; no account is provisioned or linked.
    if (hash) auth.verifiedEmailHash = hash;
    else delete auth.verifiedEmailHash;
    return hash;
  }
}


/** Provider failures never turn into an unbounded response or a positive proof. */
async function readIdentityJson(response: Response): Promise<Record<string, unknown>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('identity_status_unavailable');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32 * 1024) throw new Error('identity_status_unavailable');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('identity_status_unavailable');
  return value as Record<string, unknown>;
}
