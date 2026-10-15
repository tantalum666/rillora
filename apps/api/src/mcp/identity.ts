import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { OAuthError, OAuthErrorCode, type AuthInfo } from '@modelcontextprotocol/server';
import type { McpConfig } from './config.js';

export type McpActor = { issuer: string; subject: string; clientId: string; issuedAt: number; scopes: string[] };
class InvalidMcpToken extends Error {}

export function createMcpTokenVerifier(config: McpConfig,
  key: JWTVerifyGetKey = createRemoteJWKSet(new URL('.well-known/jwks.json', config.issuer))) {
  return { async verifyAccessToken(token: string): Promise<AuthInfo> {
    try {
      if (token.length > 8192) throw new InvalidMcpToken();
      const { payload } = await jwtVerify(token, key, {
        issuer: config.issuer, audience: config.resourceUrl, algorithms: ['RS256'],
        requiredClaims: ['sub', 'azp', 'iat', 'exp', 'scope'], clockTolerance: 5,
      });
      if (typeof payload.sub !== 'string' || payload.sub.length > 255 || /[\u0000-\u0020]/.test(payload.sub)
        || payload.sub.endsWith('@clients') || payload.gty === 'client-credentials'
        || typeof payload.azp !== 'string' || !config.clients.some(client => client.clientId === payload.azp)
        || typeof payload.scope !== 'string' || payload.scope.length > 2048
        || !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp)
        || payload.iat! > Date.now() / 1000 + 30 || payload.exp! <= payload.iat! || payload.exp! - payload.iat! > 3600) throw new InvalidMcpToken();
      const actor: McpActor = { issuer: config.issuer.replace(/\/$/, ''), subject: payload.sub,
        clientId: payload.azp, issuedAt: payload.iat!, scopes: payload.scope.split(/\s+/) };
      return { token, clientId: actor.clientId, scopes: actor.scopes, expiresAt: payload.exp!,
        resource: new URL(config.resourceUrl), extra: { actor } };
    } catch (error) {
      // Never return provider claims, token bytes, JWKS errors or subject details.
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      const invalid = error instanceof InvalidMcpToken || /^ERR_(JWT|JWS)_/.test(code)
        || ['ERR_JOSE_ALG_NOT_ALLOWED', 'ERR_JOSE_NOT_SUPPORTED', 'ERR_JWKS_NO_MATCHING_KEY'].includes(code);
      throw new OAuthError(invalid ? OAuthErrorCode.InvalidToken : OAuthErrorCode.ServerError,
        invalid ? 'A valid delegated Rillora access token is required.' : 'Rillora authentication is temporarily unavailable.');
    }
  } };
}
