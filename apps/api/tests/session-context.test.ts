import { createHash, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sessionContextForRequest, sessionClientFamily, evaluateSessionContext, rememberVerifiedNetwork, rememberedNetworks } from '../src/session-context.js';

const proof = randomBytes(32).toString('base64url');
const verifier = createHash('sha256').update(proof).digest('hex');
const credential = randomBytes(32).toString('base64url');
const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36';
const request = (changes: Record<string, string | string[]> = {}) => ({ headers: {
  'user-agent': ua, 'x-rillora-session-edge-proof': proof,
  'cloudfront-viewer-country': 'HK', 'cloudfront-viewer-asn': '64512', ...changes,
} });
const context = () => sessionContextForRequest(request(), credential, 'browser_cookie', verifier)!;

describe('bounded session network and client context', () => {
  it('requires the project edge proof instead of trusting caller IP headers', () => {
    for (const value of ['', verifier, 'x'.repeat(43), [proof, proof]]) {
      expect(sessionContextForRequest(request({ 'x-rillora-session-edge-proof': value,
        'x-forwarded-for': '1.1.1.1', forwarded: 'for=1.1.1.1' }), credential, 'browser_cookie', verifier)).toBeNull();
    }
    expect(context().networkHash).toHaveLength(32);
  });
  it('does not force a new login for a browser update or an IP change within the same network', () => {
    const changed = sessionContextForRequest(request({ 'user-agent': ua.replace('142.0', '143.0'),
      'cloudfront-viewer-address': '203.0.113.42:51621' }), credential, 'browser_cookie', verifier)!;
    expect(changed).toEqual(context());
  });
  it('requires same-account verification for a new network or country', () => {
    const first = context();
    const stored = { context_version: 1, client_context_hash: first.clientHash, network_context_hashes: first.networkHash };
    for (const change of [{ 'cloudfront-viewer-country': 'AU' }, { 'cloudfront-viewer-asn': '64513' }]) {
      const next = sessionContextForRequest(request(change), credential, 'browser_cookie', verifier)!;
      expect(evaluateSessionContext(stored, next)).toBe('verify-network');
      expect(evaluateSessionContext({ ...stored, network_context_hashes: rememberVerifiedNetwork(first.networkHash, next.networkHash) }, next)).toBe('trusted');
    }
  });
  it('keeps client changes separate from network changes', () => {
    const first = context();
    const next = sessionContextForRequest(request({ 'user-agent': ua.replace('Macintosh; Intel Mac OS X 10_15_7', 'Windows NT 10.0; Win64; x64') }), credential, 'browser_cookie', verifier)!;
    expect(evaluateSessionContext({ context_version: 1, client_context_hash: first.clientHash, network_context_hashes: first.networkHash }, next)).toBe('verify-client');
  });
  it('remembers at most five verified networks and never duplicates one', () => {
    let previous: Buffer | null = null;
    const networks = Array.from({ length: 6 }, () => randomBytes(32));
    for (const network of networks) previous = rememberVerifiedNetwork(previous, network);
    expect(rememberedNetworks(previous)).toEqual(networks.slice(1));
    previous = rememberVerifiedNetwork(previous, networks[5]!);
    expect(rememberedNetworks(previous)).toEqual(networks.slice(1));
  });
  it('does not share fingerprints between sessions or credential channels', () => {
    expect(sessionContextForRequest(request(), randomBytes(32).toString('base64url'), 'browser_cookie', verifier)).not.toEqual(context());
    expect(sessionContextForRequest(request(), credential, 'native_bearer', verifier)).toBeNull();
    expect(sessionClientFamily('native_bearer', 'Rillora/18 CFNetwork/3860.2 Darwin/25.2.0')).toBe('rillora-native-apple');
    expect(sessionClientFamily('native_bearer', 'Rillora/19 CFNetwork/3900.1 Darwin/26.0.0')).toBe('rillora-native-apple');
  });
});
