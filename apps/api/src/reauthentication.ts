import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router, type Request } from 'express';
import { readSecurityCookie, securityCookieName, usesSecureCookies } from './security-cookies.js';
import * as oidc from 'openid-client';
import { z } from 'zod';
import { authenticate, requireCsrf, sessionCookieName } from './auth.js';
import type { AppConfig } from './config.js';
import { withAuthDatabase, type DatabasePool } from './db.js';
import { ApiError, asyncHandler } from './errors.js';
import type { ExternalIdentity, IdentityProvider, NativeIdentityVerifier } from './identity.js';
import { currentLegalContract } from './legal-contract.js';
import { authenticationIsRecent } from './recent-authentication.js';
import type { PoolClient } from 'pg';
import { reviewAccessOpen } from './production-review-access.js';
import { admitAuthenticationTransaction, authenticationBusy } from './auth-transaction-budget.js';
import { sealSessionDeletionProof } from './identity-deletion-proof.js';
import { rememberVerifiedNetwork, sessionContextForRequest, type SessionContext, type StoredSessionContext } from './session-context.js';
import type { SessionSecurity } from './session-security.js';

const digest = (value: string) => createHash('sha256').update(value).digest();
const opaque = () => randomBytes(32).toString('base64url');
const invalid = () => new ApiError(403, 'reauthentication_failed', 'Sign in again with the same account. Your changes are still here.');
export type ReauthenticationTransaction = {
  reauth_session_public_id: string | null;
  token_hash: Buffer;
  created_at: Date;
};

async function refreshSession(client: PoolClient, config: AppConfig, publicId: string,
  identity: ExternalIdentity, context: SessionContext | null, identityStatusChecked: boolean, tokenHash?: Buffer): Promise<void> {
  if (!reviewAccessOpen(config) || !authenticationIsRecent(identity.authenticatedAt)) throw invalid();
  const previous = (await client.query<StoredSessionContext>(`select context_version,client_context_hash,network_context_hashes
    from app.auth_sessions where public_id=$1 for update`, [publicId])).rows[0];
  if (!previous) throw invalid();
  let networks: Buffer | null = null;
  if (previous.context_version === 1) {
    if (!context || !previous.client_context_hash || previous.client_context_hash.length !== 32
      || !timingSafeEqual(previous.client_context_hash, context.clientHash)) throw invalid();
    networks = rememberVerifiedNetwork(previous.network_context_hashes, context.networkHash);
  } else if (previous.context_version !== 0) throw invalid();
  const deletionProof=await sealSessionDeletionProof(config,identity,publicId);
  const result = await client.query(`update app.auth_sessions s
    set authenticated_at=$2, authentication_methods=$3::text[],deletion_identity_proof=$11::jsonb,last_seen_at=now(),
      network_context_hashes=$12,
      identity_checked_at=case when s.context_version=1 and $13 then now() else s.identity_checked_at end
    from app.legal_acceptances a, app.planners p
    where s.public_id=$1 and s.revoked_at is null and s.expires_at>now()
      and (s.last_seen_at is null or s.last_seen_at>now()-make_interval(mins=>coalesce(s.idle_timeout_minutes,$4)))
      and p.id=s.planner_id and p.status='active'
      and a.id=s.legal_acceptance_id and a.planner_id=s.planner_id
      and a.identity_reference_sha256=$5
      and a.terms_version=$6 and a.privacy_version=$7 and a.legal_bundle_sha256=$8
      and ($9::bytea is null or (s.token_hash=$9 and s.credential_kind='browser_cookie'))
      and ($10::text[] is null or encode(a.identity_reference_sha256,'hex')=any($10))
    returning s.public_id`, [publicId, identity.authenticatedAt, identity.authenticationMethods,
    config.sessionIdleMinutes, digest(`${identity.issuer}\u001f${identity.subject}`),
    currentLegalContract.termsVersion, currentLegalContract.privacyVersion,
    Buffer.from(currentLegalContract.bundleSha256,'hex'), tokenHash ?? null,
    config.productionReviewAccess?.identityDigests ?? null,deletionProof?JSON.stringify(deletionProof):null,networks,identityStatusChecked]);
  if (result.rowCount !== 1) throw invalid();
}

export function createReauthenticationRouter(pool: DatabasePool, config: AppConfig,
  provider: IdentityProvider | null, nativeVerifier: NativeIdentityVerifier | null, sessionSecurity?: SessionSecurity): Router {
  const router = Router();
  const confirmationAuth = authenticate(pool, config, { ...(sessionSecurity ? { sessionSecurity } : {}), purpose: 'identity-confirmation' });
  router.post('/reauthenticate', confirmationAuth, requireCsrf, asyncHandler(async (request, response) => {
    z.object({}).strict().parse(request.body);
    if (!provider || !config.oidc || request.auth.mode !== 'session') throw invalid();
    const cookieToken=opaque(), pollToken=opaque();
    const transaction={state:oidc.randomState(),nonce:oidc.randomNonce(),codeVerifier:oidc.randomPKCECodeVerifier()};
    const result=await withAuthDatabase(pool, async client=>{
      if (!await admitAuthenticationTransaction(client)) return null;
      return client.query(`insert into app.auth_transactions(
      token_hash,state_hash,code_verifier,nonce,return_to,expires_at,
      legal_acceptance_required,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,
      accepted_terms,acknowledged_privacy,accepted_electronic_records,legal_client_surface,
      reauth_session_public_id,reauth_poll_hash)
      select $1,$2,$3,$4,'/',now()+make_interval(secs=>$5),true,a.terms_version,a.privacy_version,
        a.consent_text_version,a.legal_bundle_sha256,a.accepted_terms,a.acknowledged_privacy,
        a.accepted_electronic_records,'web',s.public_id,$7
      from app.auth_sessions s join app.legal_acceptances a on a.id=s.legal_acceptance_id and a.planner_id=s.planner_id
      where s.public_id=$6 and s.revoked_at is null and s.expires_at>now()`,
    [digest(cookieToken),digest(transaction.state),transaction.codeVerifier,transaction.nonce,
      config.authTransactionTtlSeconds,request.auth.sessionPublicId,digest(pollToken)]);
    });
    if (!result) throw authenticationBusy();
    if (result.rowCount !== 1) throw invalid();
    const url=await provider.createAuthorizationUrl(transaction,{prompt:'login',maxAge:0});
    response.cookie(securityCookieName(config, 'continuity_auth_tx'),cookieToken,{httpOnly:true,secure:usesSecureCookies(config),
      sameSite:'lax',path:'/',maxAge:config.authTransactionTtlSeconds*1_000});
    // The poll capability is separate from the HTTP-only OAuth/PKCE transaction cookie.
    response.status(201).json({authorizationUrl:url.href,pollToken,expiresIn:config.authTransactionTtlSeconds});
  }));
  router.post('/reauthentication-status', confirmationAuth, requireCsrf, asyncHandler(async(request,response)=>{
    const input=z.object({pollToken:z.string().regex(/^[A-Za-z0-9_-]{43}$/)}).strict().parse(request.body);
    const row=await withAuthDatabase(pool,async client=>(await client.query(
      `select reauth_completed_at,reauth_failed_at from app.auth_transactions where reauth_poll_hash=$1
        and reauth_session_public_id=$2 and expires_at>now()`,
      [digest(input.pollToken),request.auth.sessionPublicId])).rows[0]);
    if (!row) throw invalid();
    response.json({completed:Boolean(row.reauth_completed_at),failed:Boolean(row.reauth_failed_at)});
  }));
  router.post('/native/reauthenticate',confirmationAuth,requireCsrf,asyncHandler(async(request,response)=>{
    if (!nativeVerifier || request.auth.mode!=='bearer' || !request.auth.sessionPublicId) throw invalid();
    const input=z.object({accessToken:z.string().min(80).max(16384),idToken:z.string().min(80).max(16384)}).strict().parse(request.body);
    let identity:ExternalIdentity;
    try { identity=await nativeVerifier.verifyAccessToken(input.accessToken,input.idToken); } catch { throw invalid(); }
    if (config.trustedUserSessions?.enabled) {
      if (!sessionSecurity) throw invalid();
      await sessionSecurity.verifyNewIdentity(identity);
    }
    const token = request.get('authorization')!.slice(7);
    const context = sessionContextForRequest(request, token, 'native_bearer', config.trustedUserSessions?.edgeProofSha256);
    await withAuthDatabase(pool,client=>refreshSession(client,config,request.auth.sessionPublicId!,identity,
      context,config.trustedUserSessions?.enabled === true));
    response.json({authenticated:true});
  }));
  return router;
}

export async function failReauthentication(pool: DatabasePool, transaction: ReauthenticationTransaction): Promise<void> {
  await withAuthDatabase(pool,client=>client.query(`update app.auth_transactions set reauth_failed_at=now()
    where token_hash=$1 and reauth_session_public_id is not null and reauth_completed_at is null`,[transaction.token_hash]));
}

export async function completeReauthentication(pool: DatabasePool, config: AppConfig,
  transaction: ReauthenticationTransaction, identity: ExternalIdentity, request: Request, sessionSecurity?: SessionSecurity): Promise<void> {
  if (!transaction.reauth_session_public_id || !authenticationIsRecent(identity.authenticatedAt)
    || identity.authenticatedAt!.getTime()<transaction.created_at.getTime()-5_000) throw invalid();
  const cookie=readSecurityCookie(request.get('cookie'),securityCookieName(config,sessionCookieName));
  if (!cookie || !/^[A-Za-z0-9_-]{43,128}$/.test(cookie)) throw invalid();
  if (config.trustedUserSessions?.enabled) {
    if (!sessionSecurity) throw invalid();
    await sessionSecurity.verifyNewIdentity(identity);
  }
  const context = sessionContextForRequest(request, cookie, 'browser_cookie', config.trustedUserSessions?.edgeProofSha256);
  await withAuthDatabase(pool,async client=>{
    await refreshSession(client,config,transaction.reauth_session_public_id!,identity,context,
      config.trustedUserSessions?.enabled === true,digest(cookie));
    await client.query(`update app.auth_transactions set reauth_completed_at=now()
      where token_hash=$1 and consumed_at is not null and expires_at>now()`,[transaction.token_hash]);
  });
}
