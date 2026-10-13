import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { RilloraProductionStack, type ProductionStackProps } from '../lib/rillora-production-stack.js';

const live: ProductionStackProps = {
  env: { account: '133857166372', region: 'eu-central-1' }, runtimeEnabled: true, runtimeDesiredCount: 1,
  reviewPrepared: true, liveEnabled: true, identityServicesEnabled: true, retentionEnabled: true,
  stripeCheckoutEnabled: true,
  stripeNotificationsSecretArn: 'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/stripe-billing-ABC123',
};
function synth(overrides: Partial<ProductionStackProps> = {}) {
  return Template.fromStack(new RilloraProductionStack(new App(), 'Production', { ...live, ...overrides }));
}
function containers(t: Template) {
  return Object.values(t.findResources('AWS::ECS::TaskDefinition')).flatMap((r: any) => r.Properties.ContainerDefinitions);
}
function env(c: any) { return Object.fromEntries(c.Environment.map((e: any) => [e.Name, e.Value])); }

describe('Independent Production and scoped Sandbox Apple release contexts', () => {
  it('prepares a retained vault without loading it or changing any existing data resource', () => {
    const before = synth(), after = synth({ appleProductionPrepared: true });
    after.hasResource('AWS::SecretsManager::Secret', { DeletionPolicy: 'Retain', UpdateReplacePolicy: 'Retain',
      Properties: { Name: 'rillora/production/apple-iap' } });
    for (const c of containers(after)) expect(env(c).APPLE_PRODUCTION_SECRET_ARN).toBeUndefined();
    expect(env(containers(after).find(c => c.Name === 'Api')).ALLOW_APPLE_PRODUCTION_INTEGRATION).toBe('false');
    for (const type of ['AWS::RDS::DBInstance', 'AWS::RDS::DBSubnetGroup', 'AWS::RDS::DBParameterGroup',
      'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::KMS::Key', 'AWS::DynamoDB::Table']) {
      expect(after.findResources(type)).toEqual(before.findResources(type));
    }
    const secretId = Object.entries(after.findResources('AWS::SecretsManager::Secret'))
      .find(([, s]: any) => s.Properties.Name === 'rillora/production/apple-iap')![0];
    const statements = Object.values(after.findResources('AWS::IAM::Policy'))
      .flatMap((p: any) => p.Properties.PolicyDocument.Statement)
      .filter(s => JSON.stringify(s.Resource).includes(secretId));
    expect(statements).toHaveLength(1);
    expect(statements[0].Action).toEqual(['secretsmanager:DescribeSecret', 'secretsmanager:PutSecretValue']);
  });

  it('loads Production only for API and isolated recovery with two exact read grants', () => {
    const t = synth({ appleProductionPrepared: true, appleProductionEnabled: true });
    const api = env(containers(t).find(c => c.Name === 'Api'));
    expect(api.ALLOW_APPLE_PRODUCTION_INTEGRATION).toBe('true');
    expect(api.PRODUCTION_RUNTIME_MODE).toBe('live');
    expect(api.ALLOW_APPLE_REVIEW_INTEGRATION).toBeUndefined();
    expect(api.APPLE_REVIEW_IDENTITY_SHA256).toBeUndefined();
    const arn = api.APPLE_PRODUCTION_SECRET_ARN;
    expect(containers(t).filter(c => JSON.stringify(env(c).APPLE_PRODUCTION_SECRET_ARN) === JSON.stringify(arn))).toHaveLength(2);
    const grants = Object.values(t.findResources('AWS::IAM::Policy'))
      .flatMap((p: any) => p.Properties.PolicyDocument.Statement)
      .filter(s => JSON.stringify(s.Resource) === JSON.stringify(arn) && s.Action.includes('secretsmanager:GetSecretValue'));
    expect(grants).toHaveLength(2);
    for (const grant of grants) expect(grant.Action).toEqual(['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret']);
    const http = Object.values(t.findResources('AWS::EC2::SecurityGroup'))
      .flatMap((g: any) => g.Properties.SecurityGroupEgress ?? []).filter((r: any) => r.FromPort === 80);
    expect(http).toHaveLength(2);
    for (const rule of http) expect(rule).toMatchObject({ CidrIp: '17.0.0.0/8', ToPort: 80, IpProtocol: 'tcp' });
  });

  it('keeps live identity unrestricted while review purchase routes require separate hidden identities and expiry', () => {
    const t = synth({ appleProductionPrepared: true, appleProductionEnabled: true, appleReviewEnabled: true });
    const api = env(containers(t).find(c => c.Name === 'Api'));
    expect(api).toMatchObject({ PRODUCTION_RUNTIME_MODE: 'live', ALLOW_APPLE_REVIEW_INTEGRATION: 'true',
      ALLOW_APPLE_PRODUCTION_INTEGRATION: 'true', ALLOW_STRIPE_PRODUCTION_INTEGRATION: 'true',
      ALLOW_DEV_AUTH: 'false', ALLOW_SYNTHETIC_RECIPIENT_REHEARSAL: 'false', ALLOW_APPLE_SANDBOX_INTEGRATION: 'false',
      ALLOW_STRIPE_TEST_INTEGRATION: 'false', ALLOW_FAMILY_MAINTENANCE_PREVIEW: 'false' });
    expect(api.PRODUCTION_REVIEW_IDENTITY_SHA256).toBeUndefined();
    expect(api.PRODUCTION_REVIEW_EXPIRES_AT).toBeUndefined();
    const params = t.toJSON().Parameters;
    expect(params[api.APPLE_REVIEW_IDENTITY_SHA256.Ref]).toMatchObject({ Type: 'String', NoEcho: true,
      AllowedPattern: '[a-f0-9]{64}(,[a-f0-9]{64}){0,7}' });
    expect(params[api.APPLE_REVIEW_IDENTITY_SHA256.Ref].Default).toBeUndefined();
    expect(params[api.APPLE_REVIEW_EXPIRES_AT.Ref].Default).toBeUndefined();
    expect(api.APPLE_REVIEW_SECRET_ARN).not.toEqual(api.APPLE_PRODUCTION_SECRET_ARN);
  });

  it('rejects implicit activation and any different account before synthesis', () => {
    for (const options of [
      { appleProductionEnabled: true },
      { appleProductionPrepared: true, appleProductionEnabled: true, liveEnabled: false, stripeCheckoutEnabled: false },
      { appleReviewEnabled: true, liveEnabled: false, stripeCheckoutEnabled: false },
      { appleProductionPrepared: true, runtimeEnabled: false },
      { appleProductionPrepared: true, env: { account: '111111111111', region: 'eu-central-1' } },
    ]) expect(() => synth(options)).toThrow();
  });
});
