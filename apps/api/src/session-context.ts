import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

export const edgeSessionProofHeader = 'x-rillora-session-edge-proof';
export const maximumRememberedNetworks = 5;
export type SessionCredentialKind = 'browser_cookie' | 'native_bearer';
export type SessionContext = { clientHash: Buffer; networkHash: Buffer };
export type StoredSessionContext = {
  context_version: number;
  client_context_hash: Buffer | null;
  network_context_hashes: Buffer | null;
};
type ContextRequest = Pick<Request, 'headers'>;

function header(request: ContextRequest, name: string, maximumLength: number): string | null {
  const value = request.headers[name];
  return typeof value === 'string' && value.length > 0 && value.length <= maximumLength ? value : null;
}

/** Browser updates and mobile privacy-address rotations are not new clients. */
export function sessionClientFamily(kind: SessionCredentialKind, userAgent: string | null): string | null {
  if (!userAgent) return null;
  if (kind === 'native_bearer') {
    return /^Rillora\/[\w.-]+\s+CFNetwork\/[\w.-]+\s+Darwin\/[\w.-]+$/.test(userAgent)
      ? 'rillora-native-apple' : null;
  }
  const ua = userAgent.toLowerCase();
  const browser = /edg(?:e|a|ios)?\//.test(ua) ? 'edge'
    : /(?:firefox|fxios)\//.test(ua) ? 'firefox'
    : /(?:chrome|crios)\//.test(ua) ? 'chrome'
    : /version\/.+safari\//.test(ua) ? 'safari' : null;
  const platform = /iphone|ipad|ipod/.test(ua) ? 'ios'
    : /android/.test(ua) ? 'android' : /windows/.test(ua) ? 'windows'
    : /macintosh|mac os x/.test(ua) ? 'mac' : /linux/.test(ua) ? 'linux' : null;
  return browser && platform ? `${browser}:${platform}` : null;
}

function contextHash(token: string, purpose: string, value: string): Buffer {
  return createHmac('sha256', token).update(`rillora-session-${purpose}-v1\u0000${value}`).digest();
}

/** Only this project's authenticated edge may supply network metadata.
 * The API holds a one-way verifier, never the edge credential. No raw IP,
 * country, ASN or user-agent is persisted in the session context.
 */
export function sessionContextForRequest(request: ContextRequest, token: string,
  kind: SessionCredentialKind, edgeProofSha256: string | null | undefined): SessionContext | null {
  const family = sessionClientFamily(kind, header(request, 'user-agent', 1024));
  const proof = header(request, edgeSessionProofHeader, 43);
  if (!family || !proof || !/^[A-Za-z0-9_-]{43}$/.test(proof)
    || !edgeProofSha256 || !/^[a-f0-9]{64}$/.test(edgeProofSha256)
    || !timingSafeEqual(createHash('sha256').update(proof).digest(), Buffer.from(edgeProofSha256, 'hex'))) return null;
  const country = header(request, 'cloudfront-viewer-country', 2);
  const asn = header(request, 'cloudfront-viewer-asn', 10);
  if (!country || !/^[A-Z]{2}$/.test(country) || !asn || !/^[1-9][0-9]{0,9}$/.test(asn)
    || Number(asn) > 4_294_967_295) return null;
  return { clientHash: contextHash(token, 'client', `${kind}:${family}`),
    networkHash: contextHash(token, 'network', `${country}:${asn}`) };
}

export function rememberedNetworks(value: Buffer | null): Buffer[] {
  if (!value || value.length < 32 || value.length > 32 * maximumRememberedNetworks || value.length % 32 !== 0) return [];
  return Array.from({ length: value.length / 32 }, (_, index) => value.subarray(index * 32, (index + 1) * 32));
}

export function rememberVerifiedNetwork(previous: Buffer | null, network: Buffer): Buffer {
  if (network.length !== 32) throw new Error('Invalid verified session context');
  const retained = rememberedNetworks(previous).filter(value => !timingSafeEqual(value, network));
  return Buffer.concat([...retained, network].slice(-maximumRememberedNetworks));
}

export function evaluateSessionContext(stored: StoredSessionContext, current: SessionContext | null): 'legacy' | 'trusted' | 'verify-network' | 'verify-client' {
  if (stored.context_version === 0) return 'legacy';
  if (stored.context_version !== 1 || !stored.client_context_hash || stored.client_context_hash.length !== 32) return 'verify-client';
  if (!current) return 'verify-network';
  if (!timingSafeEqual(stored.client_context_hash, current.clientHash)) return 'verify-client';
  return rememberedNetworks(stored.network_context_hashes).some(value => timingSafeEqual(value, current.networkHash))
    ? 'trusted' : 'verify-network';
}
