import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { App, aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { productionConnections as contract, RilloraProductionWebStack, verifyProductionClientArtifact } from '../lib/rillora-production-web-stack.js';

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'rillora-client-'));
  mkdirSync(join(directory, 'assets'));
  const files: Record<string, string> = {};
  for (const [path, body] of Object.entries({ 'index.html': '<title>Rillora fixture</title>', 'assets/app-test.js': 'void 0' })) {
    writeFileSync(join(directory, path), body); files[path] = createHash('sha256').update(body).digest('hex');
  }
  writeFileSync(join(directory, 'production-build.json'), JSON.stringify({ version: 1, surface: 'production-client', customerAccess: 'closed', publicationCandidate: true, webOrigin: contract.webOrigin, apiBaseURL: contract.apiBaseURL,
    connectionsSha256: createHash('sha256').update(readFileSync(resolve('../../config/production-connections.json'))).digest('hex'), files }));
  return directory;
}
const certificateArn = 'arn:aws:acm:us-east-1:111111111111:certificate/11111111-1111-4111-8111-111111111111';

describe('Closed production client delivery', () => {
  it('uses only private assets and the exact API; never creates or changes the database/runtime', () => {
    const assetDirectory = fixture();
    try {
      const template = Template.fromStack(new RilloraProductionWebStack(new App(), 'ProductionWebTest', { env: { account: '111111111111', region: 'eu-central-1' }, certificateArn, assetDirectory }));
      template.hasResourceProperties('AWS::S3::Bucket', { PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true }, VersioningConfiguration: { Status: 'Enabled' } });
      const d = (Object.values(template.findResources('AWS::CloudFront::Distribution'))[0] as any).Properties.DistributionConfig;
      expect(d.Aliases).toEqual(['app.rillora.xyz']); expect(d.Origins).toHaveLength(2);
      expect(d.Origins.some((o: any) => o.DomainName === contract.originApiDomain && o.CustomOriginConfig.OriginProtocolPolicy === 'https-only')).toBe(true);
      expect(d.CacheBehaviors[0].PathPattern).toBe('/api/*');
      expect(d.CacheBehaviors[0].CachePolicyId).toBe(cloudfront.CachePolicy.CACHING_DISABLED.cachePolicyId);
      expect(d.CustomErrorResponses.every((r: any) => r.ErrorCachingMinTTL === 0)).toBe(true);
      const headers = Object.values(template.findResources('AWS::CloudFront::ResponseHeadersPolicy')) as any[];
      expect(headers.some(h => h.Properties.ResponseHeadersPolicyConfig.CustomHeadersConfig?.Items.some((i: any) => i.Header === 'Cache-Control' && i.Value === 'no-store' && i.Override))).toBe(true);
      const policies = Object.values(template.findResources('AWS::IAM::Policy')) as any[];
      const limit = policies.flatMap(p => p.Properties.PolicyDocument.Statement).find(s => s.Effect === 'Deny' && s.Action?.includes('cloudfront:CreateInvalidation'));
      expect(limit?.NotResource).toBeDefined();
      expect(JSON.stringify(limit.NotResource)).toContain('Client');
      for (const type of ['AWS::ECS::Service', 'AWS::RDS::DBInstance', 'AWS::SecretsManager::Secret', 'AWS::ApiGatewayV2::Api']) template.resourceCountIs(type, 0);
      template.hasOutput('CustomerAccess', { Value: 'closed' });
    } finally { rmSync(assetDirectory, { recursive: true }); }
  });
  it('rejects changed assets, extra files, missing files and an opened artifact', () => {
    for (const mutation of ['changed', 'extra', 'missing', 'opened', 'ci-fixture']) {
      const directory = fixture();
      try {
        if (mutation === 'changed') writeFileSync(join(directory, 'assets/app-test.js'), 'private input');
        if (mutation === 'extra') writeFileSync(join(directory, 'unexpected.json'), '{}');
        if (mutation === 'missing') rmSync(join(directory, 'assets/app-test.js'));
        if (mutation === 'opened' || mutation === 'ci-fixture') {
          const file = join(directory, 'production-build.json'), manifest = JSON.parse(readFileSync(file, 'utf8'));
          if (mutation === 'opened') manifest.customerAccess = 'open';
          else manifest.publicationCandidate = false;
          writeFileSync(file, JSON.stringify(manifest));
        }
        expect(() => verifyProductionClientArtifact(directory)).toThrow();
      } finally { rmSync(directory, { recursive: true }); }
    }
  });
  it('rejects another-account or wrong-region certificate before provisioning', () => {
    expect(() => new RilloraProductionWebStack(new App(), 'Wrong', { env: { account: '222222222222', region: 'eu-central-1' }, certificateArn })).toThrow('same-account');
  });
  it('requires an explicit review deployment and matching artifact in both directions', () => {
    const assetDirectory = fixture();
    try {
      expect(() => verifyProductionClientArtifact(assetDirectory, true)).toThrow('access mode');
      const path = join(assetDirectory, 'production-build.json');
      const manifest = JSON.parse(readFileSync(path, 'utf8'));
      manifest.reviewAccess = 'identity-allowlist';
      writeFileSync(path, JSON.stringify(manifest));
      expect(() => verifyProductionClientArtifact(assetDirectory)).toThrow('access mode');
      expect(() => verifyProductionClientArtifact(assetDirectory, true)).not.toThrow();
      const template = Template.fromStack(new RilloraProductionWebStack(new App(), 'ReviewWebTest', {
        env: { account: '111111111111', region: 'eu-central-1' }, certificateArn, assetDirectory, reviewEnabled: true,
      }));
      template.hasOutput('CustomerAccess', { Value: 'closed' });
      template.hasOutput('ReviewAccess', { Value: 'identity-allowlist' });
      manifest.customerAccess = 'open';
      writeFileSync(path, JSON.stringify(manifest));
      expect(() => verifyProductionClientArtifact(assetDirectory, true)).toThrow();
    } finally { rmSync(assetDirectory, { recursive: true }); }
  });
});
