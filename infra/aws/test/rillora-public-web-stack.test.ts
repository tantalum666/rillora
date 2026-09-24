import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { PUBLIC_CSP, RilloraPublicWebStack } from '../lib/rillora-public-web-stack.js';

const certificateArn = 'arn:aws:acm:us-east-1:111111111111:certificate/11111111-1111-4111-8111-111111111111';
function fixture(mutated = false) {
  const directory = mkdtempSync(join(tmpdir(), 'rillora-public-'));
  const html = '<!doctype html><title>Public fixture</title>';
  writeFileSync(join(directory, 'index.html'), html);
  writeFileSync(join(directory, 'public-build.json'), JSON.stringify({ surface: 'public-information', accountsEnabled: mutated,
    apiEnabled: false, cookiesOrStorage: false, htmlSha256: createHash('sha256').update(html).digest('hex') }));
  return directory;
}
describe('Public information hosting', () => {
  it('keeps storage private and has no API/database/customer secret origin', () => {
    const assetDirectory = fixture();
    try {
      const t = Template.fromStack(new RilloraPublicWebStack(new App(), 'PublicWebTest', {
        env: { account: '111111111111', region: 'eu-central-1' }, certificateArn, assetDirectory,
      }));
      t.hasResourceProperties('AWS::S3::Bucket', { PublicAccessBlockConfiguration: {
        BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true,
      }, VersioningConfiguration: { Status: 'Enabled' } });
      t.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
        ResponseHeadersPolicyConfig: Match.objectLike({ SecurityHeadersConfig: Match.objectLike({
          ContentSecurityPolicy: { ContentSecurityPolicy: PUBLIC_CSP, Override: true },
        }) }),
      });
      const distribution = Object.values(t.findResources('AWS::CloudFront::Distribution'))[0]!.Properties.DistributionConfig;
      expect(distribution.Aliases).toEqual(['www.rillora.xyz']);
      expect(distribution.Origins).toHaveLength(1);
      expect(distribution.CacheBehaviors).toBeUndefined();
      for (const type of ['AWS::RDS::DBInstance', 'AWS::ECS::Service', 'AWS::SecretsManager::Secret', 'AWS::ApiGatewayV2::Api']) t.resourceCountIs(type, 0);
    } finally { rmSync(assetDirectory, { recursive: true }); }
  });
  it('refuses a private application artifact or non-CloudFront certificate', () => {
    const assetDirectory = fixture(true);
    try {
      expect(() => new RilloraPublicWebStack(new App(), 'Private', { certificateArn, assetDirectory })).toThrow('public-information');
      expect(() => new RilloraPublicWebStack(new App(), 'WrongRegion', { certificateArn: certificateArn.replace('us-east-1', 'eu-central-1'), assetDirectory })).toThrow('us-east-1');
    } finally { rmSync(assetDirectory, { recursive: true }); }
  });
});
