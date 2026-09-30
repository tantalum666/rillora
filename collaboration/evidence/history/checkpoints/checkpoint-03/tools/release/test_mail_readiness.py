import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('mail_readiness', Path(__file__).with_name('check_mail_readiness.py'))
mail = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mail)


def ready_fixture():
    account = {'ProductionAccessEnabled': True, 'SendingEnabled': True, 'EnforcementStatus': 'HEALTHY',
               'SendQuota': {'Max24HourSend': 200, 'MaxSendRate': 1},
               'SuppressionAttributes': {'SuppressedReasons': ['BOUNCE', 'COMPLAINT']}}
    identity = {'IdentityType': 'DOMAIN', 'VerifiedForSendingStatus': True, 'VerificationStatus': 'SUCCESS',
                'DkimAttributes': {'SigningEnabled': True, 'Status': 'SUCCESS', 'CurrentSigningKeyLength': 'RSA_2048_BIT'},
                'MailFromAttributes': {'MailFromDomain': 'bounce.notify.rillora.xyz', 'MailFromDomainStatus': 'SUCCESS', 'BehaviorOnMxFailure': 'REJECT_MESSAGE'},
                'ConfigurationSetName': mail.CONFIGURATION}
    config = {'ConfigurationSetName': mail.CONFIGURATION, 'DeliveryOptions': {'TlsPolicy': 'REQUIRE'},
              'SendingOptions': {'SendingEnabled': True}, 'SuppressionOptions': {'SuppressedReasons': ['BOUNCE', 'COMPLAINT']},
              'VdmOptions': {'DashboardOptions': {'EngagementMetrics': 'DISABLED'}}}
    events = {'EventDestinations': [{'Name': 'aggregate-delivery', 'Enabled': True,
                'MatchingEventTypes': sorted(mail.EVENTS), 'CloudWatchDestination': {'DimensionConfigurations': [
                    {'DimensionName': 'ses:configuration-set', 'DimensionValueSource': 'MESSAGE_TAG', 'DefaultDimensionValue': mail.CONFIGURATION}]}}]}
    return account, identity, config, events


class MailReadinessTests(unittest.TestCase):
    def test_sandbox_cannot_pass_even_when_dns_and_mail_configuration_are_ready(self):
        account, identity, config, events = ready_fixture()
        account.update(ProductionAccessEnabled=False, Details={'ReviewDetails': {'Status': 'DENIED'}})
        result = mail.assess(account, identity, config, events)
        self.assertTrue(result['domainAndConfigurationReady'])
        self.assertEqual(result['blockers'], ['productionAccessEnabled'])
        self.assertFalse(result['sesConfigurationReady'])

    def test_provider_approval_is_not_customer_email_acceptance(self):
        result = mail.assess(*ready_fixture())
        self.assertTrue(result['sesConfigurationReady'])
        self.assertFalse(result['customerEmailFlowVerified'])

    def test_tls_fallback_and_suppression_changes_block_preparation(self):
        account, identity, config, events = ready_fixture()
        identity['MailFromAttributes']['BehaviorOnMxFailure'] = 'USE_DEFAULT_VALUE'
        config['DeliveryOptions']['TlsPolicy'] = 'OPTIONAL'
        config['SuppressionOptions']['SuppressedReasons'] = ['BOUNCE']
        result = mail.assess(account, identity, config, events)
        self.assertEqual(set(result['blockers']), {'mailFromVerifiedAndRejectsFallback', 'tlsRequired', 'configurationSuppression'})

    def test_unknown_recipient_destination_or_tracking_events_cannot_pass(self):
        for mutation in ('second-destination', 'click', 'wrong-dimension', 'disabled'):
            with self.subTest(mutation=mutation):
                account, identity, config, events = ready_fixture()
                dest = events['EventDestinations'][0]
                if mutation == 'second-destination':
                    events['EventDestinations'].append({'Enabled': True, 'SnsDestination': {'TopicArn': 'fixture'}})
                elif mutation == 'click':
                    dest['MatchingEventTypes'].append('CLICK')
                elif mutation == 'wrong-dimension':
                    dest['CloudWatchDestination']['DimensionConfigurations'][0]['DefaultDimensionValue'] = 'another-project'
                else:
                    dest['Enabled'] = False
                self.assertIn('aggregateEventsOnly', mail.assess(account, identity, config, events)['blockers'])

    def test_missing_and_invalid_values_fail_closed(self):
        self.assertFalse(mail.assess({}, {}, {}, {})['sesConfigurationReady'])
        for value in (None, 0, -1, '200', True, float('nan'), float('inf')):
            with self.subTest(value=value):
                account, identity, config, events = ready_fixture()
                account['SendQuota']['Max24HourSend'] = value
                self.assertIn('positiveSendQuota', mail.assess(account, identity, config, events)['blockers'])

    def test_wrong_account_stops_before_any_ses_read(self):
        with patch.object(mail, 'read_aws', return_value={'Account': '111111111111'}) as read:
            with self.assertRaisesRegex(RuntimeError, 'Wrong AWS account'):
                mail.collect('fixture')
            self.assertEqual(read.call_count, 1)

    def test_collection_only_reads_the_named_configuration_and_never_returns_raw_account_details(self):
        account, identity, config, events = ready_fixture()
        account['Details'] = {'UseCaseDescription': 'private fixture', 'AdditionalContactEmailAddresses': ['fixture@example.invalid']}
        with patch.object(mail, 'read_aws', side_effect=[{'Account': mail.ACCOUNT}, account, identity, config, events]) as read:
            result = mail.collect('fixture')
        self.assertEqual([call.args[2] for call in read.call_args_list], ['get-caller-identity', 'get-account', 'get-email-identity', 'get-configuration-set', 'get-configuration-set-event-destinations'])
        self.assertNotIn('private fixture', str(result))
        self.assertNotIn('fixture@example.invalid', str(result))


if __name__ == '__main__':
    unittest.main()
