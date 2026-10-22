import { App, Stack, aws_ecs as ecs, aws_iam as iam } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { RilloraPrivateContent } from '../lib/rillora-private-content.js';
import { RilloraProductionStack } from '../lib/rillora-production-stack.js';
import { RilloraStagingStack } from '../lib/rillora-staging-stack.js';
import { createHash } from 'node:crypto';

describe('Private file custody has separate readers and erasers', () => {
  it('retains private encrypted versions and restricts API and cleanup to their own capabilities', () => {
    const stack = new Stack(new App(), 'ContentTest', { env: { account: '111111111111', region: 'eu-central-1' } });
    const files = new RilloraPrivateContent(stack, 'Content', 'staging');
    const api = new iam.Role(stack, 'Api', { assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com') });
    const cleaner = new ecs.FargateTaskDefinition(stack, 'Cleaner');
    cleaner.addContainer('Worker', { image: ecs.ContainerImage.fromRegistry('example.test/synthetic'), memoryLimitMiB: 256 });
    files.allowApi(api); files.allowCleanup(cleaner, true);
    const template = Template.fromStack(stack), buckets = Object.values(template.findResources('AWS::S3::Bucket')) as any[];
    expect(buckets).toHaveLength(1); const bucket = buckets[0];
    expect(bucket.DeletionPolicy).toBe('Retain'); expect(bucket.UpdateReplacePolicy).toBe('Retain');
    expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    expect(Object.values(bucket.Properties.PublicAccessBlockConfiguration).every(value => value === true)).toBe(true);
    expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    const policies = Object.values(template.findResources('AWS::IAM::Policy')) as any[];
    const apiPolicy = policies.find(policy => JSON.stringify(policy.Properties.Roles).includes('Api')).Properties.PolicyDocument.Statement;
    expect(apiPolicy.map((s: any) => s.Action).sort()).toEqual(['s3:GetObject', 's3:PutObject']);
    expect(apiPolicy.find((s: any) => s.Action === 's3:PutObject').Condition.StringEquals['s3:x-amz-server-side-encryption']).toBe('AES256');
    const cleanerPolicy = policies.find(policy => JSON.stringify(policy.Properties.Roles).includes('Cleaner')).Properties.PolicyDocument.Statement;
    expect(cleanerPolicy.map((s: any) => s.Action).sort()).toEqual(['s3:DeleteObjectVersion', 's3:ListBucketVersions']);
    expect(cleanerPolicy.find((s: any) => s.Action === 's3:ListBucketVersions').Condition.StringLike['s3:prefix']).toEqual(['content/*']);
    expect(JSON.stringify(cleanerPolicy)).not.toContain('kms:Decrypt');
    expect(JSON.stringify(template.findResources('AWS::S3::BucketPolicy'))).toContain('aws:SecureTransport');
    expect(files.environmentValues(false).RILLORA_LEGACY_CONTENT_ENABLED).toBe('false');
  });
  it('refuses to enable content before compatible encrypted runtime and cleanup are prepared', () => {
    expect(() => new RilloraProductionStack(new App(), 'Closed', {env: {account:'133857166372',region:'eu-central-1'},legacyContentEnabled:true})).toThrow('Content requires');
    expect(() => new RilloraStagingStack(new App(), 'Unprepared', {env: {account:'111111111111',region:'eu-central-1'},legacyContentEnabled:true})).toThrow();
    expect(() => new RilloraStagingStack(new App(), 'Plain', {env: {account:'111111111111',region:'eu-central-1'},legacyContentEnabled:true,legacyContentPrepared:true,accountDeletionEnabled:true,contentProtectionMode:'read-compatible'})).toThrow();
  });
  it('keeps content QA closed by default and limits its scope to the maintenance broker', () => {
    const props = { env: { account: '133857166372', region: 'eu-central-1' }, runtimeEnabled: true,
      reviewPrepared: true, liveEnabled: true, identityServicesEnabled: true, retentionEnabled: true,
      legacyContentPrepared: true, legacyContentEnabled: true,
      stripeNotificationsSecretArn: 'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/stripe-billing-ABC123' };
    const subject = 'auth0|' + 'a'.repeat(24);
    const scope = { subject, identitySha256: createHash('sha256').update('https://login.rillora.xyz\u001f'+subject).digest('hex'),
      label: 'Rillora Web Content QA 2026-10-22', expiresAt: new Date(Date.now()+3600_000).toISOString() };
    const before = Template.fromStack(new RilloraProductionStack(new App(), 'Production', props));
    const after = Template.fromStack(new RilloraProductionStack(new App(), 'Production', { ...props, contentQaScope: scope }));
    const broker = (t:Template) => Object.values(t.findResources('AWS::Lambda::Function')).find((r:any)=>r.Properties.Environment?.Variables?.BROKER_SETTINGS) as any;
    expect(JSON.stringify(broker(before))).not.toContain('contentQaScope');
    expect(JSON.stringify(broker(after))).toContain('contentQaScope');
    expect(JSON.stringify(broker(after))).toContain(scope.identitySha256);
    for (const type of ['AWS::ECS::TaskDefinition','AWS::ECS::Service','AWS::IAM::Policy','AWS::RDS::DBInstance','AWS::KMS::Key']) {
      expect(after.findResources(type)).toEqual(before.findResources(type));
    }
    for (const patch of [{ subject:'google-oauth2|personal' }, { identitySha256:'b'.repeat(64) }, { label:'Rillora App Review' },
      { expiresAt:new Date(Date.now()-1000).toISOString() }, { expiresAt:new Date(Date.now()+5*3600_000).toISOString() }]) {
      expect(()=>new RilloraProductionStack(new App(),'Refused',{...props,contentQaScope:{...scope,...patch}})).toThrow('Content QA');
    }
  });
});
