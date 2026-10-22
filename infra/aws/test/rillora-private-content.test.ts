import { App, Stack, aws_ecs as ecs, aws_iam as iam } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { RilloraPrivateContent } from '../lib/rillora-private-content.js';
import { RilloraProductionStack } from '../lib/rillora-production-stack.js';
import { RilloraStagingStack } from '../lib/rillora-staging-stack.js';

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
});
