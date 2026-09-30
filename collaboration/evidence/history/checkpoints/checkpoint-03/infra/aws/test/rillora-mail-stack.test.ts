import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { describe, expect, it } from 'vitest';
import { RilloraMailStack } from '../lib/rillora-mail-stack.js';

const template = () => Template.fromStack(new RilloraMailStack(new App(), 'MailTest', {
  env: { account: '111111111111', region: 'eu-central-1' },
}));

describe('Isolated transactional mail foundation', () => {
  it('requires encrypted delivery and suppresses bounces and complaints', () => {
    template().hasResourceProperties('AWS::SES::ConfigurationSet', {
      Name: 'rillora-transactional', DeliveryOptions: { TlsPolicy: 'REQUIRE' },
      SuppressionOptions: { SuppressedReasons: ['BOUNCE', 'COMPLAINT'] },
      ReputationOptions: { ReputationMetricsEnabled: true },
    });
  });
  it('never modifies root mail, trusts a sender before DNS, or falls back to another envelope domain', () => {
    template().hasResourceProperties('AWS::SES::EmailIdentity', {
      EmailIdentity: 'notify.rillora.xyz',
      DkimSigningAttributes: { NextSigningKeyLength: 'RSA_2048_BIT' },
      DkimAttributes: { SigningEnabled: true },
      MailFromAttributes: { MailFromDomain: 'bounce.notify.rillora.xyz', BehaviorOnMxFailure: 'REJECT_MESSAGE' },
    });
    template().resourceCountIs('AWS::Route53::RecordSet', 0);
    const identity = Object.values(template().findResources('AWS::SES::EmailIdentity'))[0]!;
    expect(identity.DeletionPolicy).toBe('Retain');
  });
  it('publishes bounded aggregate outcomes without tracking user opens/clicks or storing mail content', () => {
    const event = Object.values(template().findResources('AWS::SES::ConfigurationSetEventDestination'))[0]!.Properties.EventDestination;
    expect(event.MatchingEventTypes).toEqual(['send', 'delivery', 'bounce', 'complaint', 'reject', 'renderingFailure', 'deliveryDelay']);
    expect(event.CloudWatchDestination.DimensionConfigurations).toEqual([{
      DefaultDimensionValue: 'rillora-transactional', DimensionName: 'ses:configuration-set', DimensionValueSource: 'messageTag',
    }]);
    expect(event.SnsDestination).toBeUndefined();
    expect(event.KinesisFirehoseDestination).toBeUndefined();
  });
  it('creates no credential or runtime and refuses another region', () => {
    for (const type of ['AWS::IAM::User', 'AWS::IAM::AccessKey', 'AWS::SecretsManager::Secret', 'AWS::ECS::Service', 'AWS::RDS::DBInstance']) template().resourceCountIs(type, 0);
    expect(() => new RilloraMailStack(new App(), 'WrongRegion', { env: { region: 'us-east-1' } })).toThrow('Frankfurt');
  });
});
