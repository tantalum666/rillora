import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as oidc from 'openid-client';
import { createOidcIdentityProvider } from '../src/identity.js';

vi.mock('openid-client', async importOriginal => ({
  ...await importOriginal<typeof import('openid-client')>(),
  discovery: vi.fn(),
}));

const config = {
  issuerUrl: 'https://identity.example', clientId: 'discovery-fixture',
  clientSecret: 'synthetic-discovery-test-only',
  redirectUri: 'https://app.example/auth/callback', webAppOrigin: 'https://app.example',
};
const transaction = { state: 's'.repeat(43), nonce: 'n'.repeat(43), codeVerifier: 'v'.repeat(43) };
const configuration = () => new oidc.Configuration({
  issuer: config.issuerUrl, authorization_endpoint: `${config.issuerUrl}/authorize`,
  token_endpoint: `${config.issuerUrl}/oauth/token`,
}, config.clientId, config.clientSecret);

describe('OIDC discovery recovery', () => {
  beforeEach(() => vi.mocked(oidc.discovery).mockReset());

  it('shares one in-flight lookup, then retries after a temporary discovery failure', async () => {
    const failure = new Error('synthetic discovery outage');
    vi.mocked(oidc.discovery).mockRejectedValueOnce(failure).mockResolvedValueOnce(configuration());
    const provider = createOidcIdentityProvider(config);
    const failed = await Promise.allSettled([
      provider.createAuthorizationUrl(transaction), provider.createAuthorizationUrl(transaction),
    ]);
    expect(failed.map(result => result.status)).toEqual(['rejected', 'rejected']);
    expect(oidc.discovery).toHaveBeenCalledTimes(1);

    const recovered = await provider.createAuthorizationUrl(transaction);
    expect(recovered.origin).toBe(config.issuerUrl);
    expect(recovered.searchParams.get('redirect_uri')).toBe(config.redirectUri);
    expect(recovered.searchParams.get('code_challenge_method')).toBe('S256');
    expect(oidc.discovery).toHaveBeenCalledTimes(2);
    await provider.createAuthorizationUrl(transaction);
    expect(oidc.discovery).toHaveBeenCalledTimes(2);
  });
});
