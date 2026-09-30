#!/usr/bin/env python3
"""Read-only SES configuration check; never sends mail or activates Auth0."""
import argparse
import datetime
import json
import math
import os
from pathlib import Path
import subprocess

ACCOUNT = '133857166372'
REGION = 'eu-central-1'
DOMAIN = 'notify.rillora.xyz'
CONFIGURATION = 'rillora-transactional'
EVENTS = {'SEND', 'DELIVERY', 'BOUNCE', 'COMPLAINT', 'REJECT',
          'RENDERING_FAILURE', 'DELIVERY_DELAY'}


def object_at(value, key):
    result = value.get(key) if isinstance(value, dict) else None
    return result if isinstance(result, dict) else {}


def string_set(value):
    return set(value) if isinstance(value, list) and all(isinstance(v, str) for v in value) else set()


def positive_number(value):
    return type(value) in (int, float) and math.isfinite(value) and value > 0


def assess(account, identity, configuration, event_data):
    dkim = object_at(identity, 'DkimAttributes')
    mail_from = object_at(identity, 'MailFromAttributes')
    quota = object_at(account, 'SendQuota')
    destinations = event_data.get('EventDestinations', [])
    if not isinstance(destinations, list):
        destinations = []
    active = [entry for entry in destinations if isinstance(entry, dict) and entry.get('Enabled') is True]
    aggregate = active[0] if len(active) == 1 else {}
    expected_dimensions = [{'DimensionName': 'ses:configuration-set',
                            'DimensionValueSource': 'MESSAGE_TAG',
                            'DefaultDimensionValue': CONFIGURATION}]
    # Unknown enabled destinations fail closed: SNS/Kinesis can include recipient
    # metadata and OPEN/CLICK would change the reviewed non-tracking contract.
    aggregate_keys = {'Name', 'Enabled', 'MatchingEventTypes', 'CloudWatchDestination'}
    checks = {
        'productionAccessEnabled': account.get('ProductionAccessEnabled') is True,
        'accountSendingEnabled': account.get('SendingEnabled') is True,
        'accountHealthy': account.get('EnforcementStatus') == 'HEALTHY',
        'positiveSendQuota': positive_number(quota.get('Max24HourSend')) and positive_number(quota.get('MaxSendRate')),
        'accountSuppression': string_set(object_at(account, 'SuppressionAttributes').get('SuppressedReasons')) == {'BOUNCE', 'COMPLAINT'},
        'domainVerified': identity.get('IdentityType') == 'DOMAIN' and identity.get('VerifiedForSendingStatus') is True and identity.get('VerificationStatus') == 'SUCCESS',
        'dkimVerified2048': dkim.get('SigningEnabled') is True and dkim.get('Status') == 'SUCCESS' and dkim.get('CurrentSigningKeyLength') == 'RSA_2048_BIT',
        'mailFromVerifiedAndRejectsFallback': mail_from.get('MailFromDomain') == 'bounce.' + DOMAIN and mail_from.get('MailFromDomainStatus') == 'SUCCESS' and mail_from.get('BehaviorOnMxFailure') == 'REJECT_MESSAGE',
        'identityDefaultConfiguration': identity.get('ConfigurationSetName') == CONFIGURATION,
        'configurationName': configuration.get('ConfigurationSetName') == CONFIGURATION,
        'tlsRequired': object_at(configuration, 'DeliveryOptions').get('TlsPolicy') == 'REQUIRE',
        'configurationSendingEnabled': object_at(configuration, 'SendingOptions').get('SendingEnabled') is True,
        'configurationSuppression': string_set(object_at(configuration, 'SuppressionOptions').get('SuppressedReasons')) == {'BOUNCE', 'COMPLAINT'},
        'engagementTrackingDisabled': object_at(object_at(configuration, 'VdmOptions'), 'DashboardOptions').get('EngagementMetrics') == 'DISABLED',
        'aggregateEventsOnly': bool(aggregate) and set(aggregate) <= aggregate_keys and string_set(aggregate.get('MatchingEventTypes')) == EVENTS and object_at(aggregate, 'CloudWatchDestination').get('DimensionConfigurations') == expected_dimensions,
    }
    blockers = [name for name, passed in checks.items() if not passed]
    return {
        'checks': checks, 'blockers': blockers,
        'domainAndConfigurationReady': all(value for key, value in checks.items() if key != 'productionAccessEnabled'),
        'sesConfigurationReady': not blockers,
        'reviewStatus': object_at(object_at(account, 'Details'), 'ReviewDetails').get('Status'),
        'customerEmailFlowVerified': False,
        'boundary': 'SES configuration only. Support replies do not grant access. Auth0 sender permissions/templates, current DNS, real verification/reset/continuation, inbox placement and alert delivery need separate evidence.',
    }


def read_aws(profile, service, operation, *arguments):
    result = subprocess.run(['aws', '--profile', profile, '--region', REGION,
                             '--output', 'json', service, operation, *arguments],
                            env={**os.environ, 'AWS_PAGER': ''},
                            capture_output=True, text=True, timeout=45)
    if result.returncode:
        raise RuntimeError('AWS read failed for ' + operation + '; inspect authentication/permissions separately. Provider output suppressed.')
    try:
        data = json.loads(result.stdout)
    except ValueError as error:
        raise RuntimeError('AWS returned invalid JSON; no readiness result.') from error
    if not isinstance(data, dict):
        raise RuntimeError('AWS returned an unexpected shape; no readiness result.')
    return data


def collect(profile):
    caller = read_aws(profile, 'sts', 'get-caller-identity')
    if caller.get('Account') != ACCOUNT:
        raise RuntimeError('Wrong AWS account; no SES resources read.')
    account = read_aws(profile, 'sesv2', 'get-account')
    identity = read_aws(profile, 'sesv2', 'get-email-identity', '--email-identity', DOMAIN)
    configuration = read_aws(profile, 'sesv2', 'get-configuration-set', '--configuration-set-name', CONFIGURATION)
    events = read_aws(profile, 'sesv2', 'get-configuration-set-event-destinations', '--configuration-set-name', CONFIGURATION)
    return assess(account, identity, configuration, events)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile', default='rillora-operator')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--report-only', action='store_true', help='Record a blocked configuration without exit code2; never changes the verdict.')
    args = parser.parse_args()
    report = {'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'account': ACCOUNT, 'region': REGION, 'identity': DOMAIN, 'configurationSet': CONFIGURATION,
              'readOnly': True, 'mailSent': False}
    try:
        report.update(collect(args.profile))
        code = 0 if report['sesConfigurationReady'] or args.report_only else 2
    except (RuntimeError, subprocess.TimeoutExpired, OSError) as error:
        report.update(sesConfigurationReady=False, customerEmailFlowVerified=False,
                      blockers=['AWS read incomplete'], error=str(error) if isinstance(error, RuntimeError) else 'AWS CLI unavailable or timed out; no readiness result.')
        code = 3
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return code


if __name__ == '__main__':
    raise SystemExit(main())
