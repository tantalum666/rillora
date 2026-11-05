import { App, Stack, aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { userSessionEnvironment, userSessionOriginHeaders } from '../lib/rillora-user-sessions.js';

describe('Authenticated session edge configuration', () => {
  it('keeps raw origin proof out of API environment and disables issuance until explicit activation', () => {
    const stack = new Stack(new App(), 'UserSessionTest');
    const env = userSessionEnvironment(stack, true);
    const origin = userSessionOriginHeaders(stack);
    const template = Template.fromStack(stack).toJSON();
    expect(template.Parameters.SessionEdgeProof.NoEcho).toBe(true);
    expect(template.Parameters.SessionEdgeProof.Default).toBe('disabled');
    expect(template.Parameters.TrustedUserSessionsEnabled.Default).toBe('false');
    expect(Object.keys(env)).toEqual(['SESSION_EDGE_PROOF_SHA256', 'TRUSTED_USER_SESSIONS_ENABLED']);
    expect(Object.keys(origin)).toEqual(['x-rillora-session-edge-proof']);
    expect(template.Rules.TrustedSessionPrerequisites.Assertions).toHaveLength(2);
    expect(template.Resources).toBeUndefined(); // no extra paid identity/secret resource
  });
  for (const file of ['session-edge.js', 'production-router.js']) it(`${file} removes spoofed metadata and preserves authentication`, () => {
    const handler = runInNewContext(readFileSync(`../../apps/web/worker/${file}`, 'utf8') + '\nhandler');
    const request = { uri: '/api/v1/overview', method: 'GET', headers: {
      'x-rillora-session-edge-proof': { value: 'attacker' }, 'cloudfront-viewer-country': { value: 'US' },
      'cloudfront-viewer-asn': { value: '1' }, 'cloudfront-viewer-address': { value: '192.0.2.1:44' },
      authorization: { value: 'synthetic-authorization' }, 'user-agent': { value: 'real client' },
    }, querystring: {} };
    const output = handler({ request });
    expect(Object.keys(output.headers)).toEqual(['authorization', 'user-agent']);
    expect(output.uri).toBe(file === 'production-router.js' ? '/v1/overview' : '/api/v1/overview');
    expect(cloudfront.CachePolicy.CACHING_DISABLED.cachePolicyId).toBeTruthy();
  });
});
