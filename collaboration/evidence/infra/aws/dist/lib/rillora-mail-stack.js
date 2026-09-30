import { CfnOutput, RemovalPolicy, Stack, Tags, aws_ses as ses } from 'aws-cdk-lib';
export const TRANSACTIONAL_MAIL = Object.freeze({
    domain: 'notify.rillora.xyz',
    from: '[REDACTED_EMAIL]',
    mailFrom: 'bounce.notify.rillora.xyz',
    configurationSet: 'rillora-transactional',
});
/** DNS-verifiable mail foundation; no sender key, recipient or customer access. */
export class RilloraMailStack extends Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        if (props.env?.region !== 'eu-central-1')
            throw new Error('Mail must remain in Frankfurt');
        Tags.of(this).add('Project', 'Rillora');
        Tags.of(this).add('Environment', 'Production');
        const configuration = new ses.ConfigurationSet(this, 'Transactional', {
            configurationSetName: TRANSACTIONAL_MAIL.configurationSet,
            tlsPolicy: ses.ConfigurationSetTlsPolicy.REQUIRE,
            suppressionReasons: ses.SuppressionReasons.BOUNCES_AND_COMPLAINTS,
            reputationMetrics: true,
            // SES sandbox and the absence of a sender credential still prevent public activation.
            sendingEnabled: true,
            vdmOptions: { engagementMetrics: false, optimizedSharedDelivery: false },
            disableAutoValidation: true,
        });
        configuration.applyRemovalPolicy(RemovalPolicy.RETAIN);
        configuration.addEventDestination('AggregateDelivery', {
            configurationSetEventDestinationName: 'aggregate-delivery',
            destination: ses.EventDestination.cloudWatchDimensions([{
                    name: 'ses:configuration-set', source: ses.CloudWatchDimensionSource.MESSAGE_TAG,
                    defaultValue: TRANSACTIONAL_MAIL.configurationSet,
                }]),
            events: [ses.EmailSendingEvent.SEND, ses.EmailSendingEvent.DELIVERY,
                ses.EmailSendingEvent.BOUNCE, ses.EmailSendingEvent.COMPLAINT,
                ses.EmailSendingEvent.REJECT, ses.EmailSendingEvent.RENDERING_FAILURE,
                ses.EmailSendingEvent.DELIVERY_DELAY],
        });
        const identity = new ses.EmailIdentity(this, 'Identity', {
            identity: ses.Identity.domain(TRANSACTIONAL_MAIL.domain),
            configurationSet: configuration,
            dkimSigning: true,
            dkimIdentity: ses.DkimIdentity.easyDkim(ses.EasyDkimSigningKeyLength.RSA_2048_BIT),
            mailFromDomain: TRANSACTIONAL_MAIL.mailFrom,
            mailFromBehaviorOnMxFailure: ses.MailFromBehaviorOnMxFailure.REJECT_MESSAGE,
            // Aggregate event publishing plus SES suppression replace forwarded recipient mail.
            feedbackForwarding: false,
        });
        identity.applyRemovalPolicy(RemovalPolicy.RETAIN);
        new CfnOutput(this, 'IdentityArn', { value: identity.emailIdentityArn });
        new CfnOutput(this, 'ConfigurationSet', { value: configuration.configurationSetName });
        for (const [index, record] of identity.dkimRecords.entries()) {
            new CfnOutput(this, `Dkim${index + 1}Name`, { value: record.name });
            new CfnOutput(this, `Dkim${index + 1}Value`, { value: record.value });
        }
        new CfnOutput(this, 'MailFromMx', { value: '10 feedback-smtp.eu-central-1.amazonses.com' });
        new CfnOutput(this, 'MailFromSpf', { value: 'v=spf1 include:amazonses.com -all' });
        new CfnOutput(this, 'ActivationBoundary', {
            value: 'Domain verification is not production access, Auth0 configuration or end-user delivery',
        });
    }
}
