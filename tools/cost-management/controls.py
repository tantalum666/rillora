#!/usr/bin/env python3
"""Inspect or apply bounded cost notifications and free recommendations for Rillora.

No service stop, deletion, purchase, commitment, paid metric preference or new
recipient is supported. Provider JSON is written only to an ignored QA directory.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess

ACCOUNT = '133857166372'
BUDGET = 'Rillora-Staging-Monthly-25'
PROFILE = 'rillora-operator'


def budget_update(current):
    if current.get('BudgetName') != BUDGET or current.get('BudgetType') != 'COST':
        raise ValueError('Unexpected budget')
    # Fields accepted by UpdateBudget; derived spend/health fields are read-only.
    allowed = {'BudgetName', 'BudgetLimit', 'PlannedBudgetLimits', 'CostFilters',
               'CostTypes', 'TimeUnit', 'TimePeriod', 'BudgetType', 'AutoAdjustData',
               'FilterExpression', 'Metrics'}
    candidate = {k: deepcopy(v) for k, v in current.items() if k in allowed}
    candidate.setdefault('CostTypes', {}).update(IncludeCredit=False, IncludeRefund=False)
    return candidate


def notification_plan():
    return [dict(NotificationType=kind, ComparisonOperator='GREATER_THAN',
                 Threshold=amount, ThresholdType='ABSOLUTE_VALUE')
            for kind, amount in [('ACTUAL', 25), ('ACTUAL', 50), ('ACTUAL', 80), ('FORECASTED', 80)]]


def notification_key(notification):
    return tuple(notification.get(k) for k in
                 ('NotificationType', 'ComparisonOperator', 'Threshold', 'ThresholdType'))


def confirmed_recipient(subscriptions):
    matches = [s for s in subscriptions if s.get('SubscriptionName') == 'Default-Services-Subscription']
    if len(matches) != 1:
        raise ValueError('Expected the existing default cost-anomaly subscription')
    sub = matches[0]
    if sub.get('AccountId') != ACCOUNT or sub.get('Frequency') != 'DAILY':
        raise ValueError('Unexpected subscription scope')
    emails = [r['Address'] for r in sub.get('Subscribers', [])
              if r.get('Type') == 'EMAIL' and r.get('Status') == 'CONFIRMED']
    if len(emails) != 1 or '@' not in emails[0]:
        raise ValueError('One existing confirmed email is required; never invent a recipient')
    return sub, emails[0]


def anomaly_threshold():
    return {'And': [
        {'Dimensions': {'Key': 'ANOMALY_TOTAL_IMPACT_ABSOLUTE', 'Values': ['5.0'],
                        'MatchOptions': ['GREATER_THAN_OR_EQUAL']}},
        {'Dimensions': {'Key': 'ANOMALY_TOTAL_IMPACT_PERCENTAGE', 'Values': ['40.0'],
                        'MatchOptions': ['GREATER_THAN_OR_EQUAL']}},
    ]}


def aws(service, operation, *args):
    region = 'eu-central-1' if service == 'compute-optimizer' else 'us-east-1'
    result = subprocess.run(['aws', service, operation, *args, '--profile', PROFILE,
                             '--region', region, '--output', 'json', '--no-cli-pager'],
                            capture_output=True, text=True, check=False)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout.strip() else {}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--report-dir', type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    out = args.report_dir.resolve()
    if not out.is_relative_to(root / 'output' / 'qa'):
        raise ValueError('Provider receipts must remain under ignored output/qa')
    out.mkdir(parents=True, exist_ok=True); os.chmod(out, 0o700)
    if aws('sts', 'get-caller-identity')['Account'] != ACCOUNT:
        raise ValueError('Refusing another account')
    original = aws('budgets', 'describe-budget', '--account-id', ACCOUNT, '--budget-name', BUDGET)['Budget']
    notifications = aws('budgets', 'describe-notifications-for-budget', '--account-id', ACCOUNT,
                        '--budget-name', BUDGET)['Notifications']
    subs = aws('ce', 'get-anomaly-subscriptions')['AnomalySubscriptions']
    sub, recipient = confirmed_recipient(subs)
    desired = budget_update(original)
    requested = notification_plan()
    enrollment = aws('compute-optimizer', 'get-enrollment-status')
    plan = {'budgetName': BUDGET, 'budgetLimitUnchanged': original.get('BudgetLimit'),
            'excludeCreditsAndRefunds': True, 'notifications': requested,
            'recipientSha256': hashlib.sha256(recipient.lower().encode()).hexdigest(),
            'anomalyThreshold': anomaly_threshold(), 'optimizerBefore': enrollment.get('status'),
            'freeStandardRecommendationsOnly': True, 'applied': args.apply, 'actions': []}
    # Preserve full prechange records privately for exact rollback.
    before = out / 'before.private.json'
    if not before.exists():
        before.write_text(json.dumps({'budget': original, 'notifications': notifications,
                                     'subscription': sub, 'optimizer': enrollment}, indent=2)+'\n')
        os.chmod(before, 0o600)
    if args.apply:
        def apply(name, action):
            try:
                action(); plan['actions'].append({'name': name, 'success': True})
            except RuntimeError as error:
                plan['actions'].append({'name': name, 'success': False, 'error': str(error)})
        if any(original.get('CostTypes', {}).get(k) is not False for k in ['IncludeCredit', 'IncludeRefund']):
            apply('gross-cost-budget', lambda: aws('budgets', 'update-budget', '--account-id', ACCOUNT,
                                                   '--new-budget', json.dumps(desired)))
        existing = {notification_key(n) for n in notifications}
        for notification in requested:
            if notification_key(notification) not in existing:
                apply('notification-'+notification['NotificationType']+'-'+str(notification['Threshold']),
                      lambda n=notification: aws('budgets', 'create-notification', '--account-id', ACCOUNT,
                         '--budget-name', BUDGET, '--notification', json.dumps(n),
                         '--subscribers', json.dumps([{'SubscriptionType': 'EMAIL', 'Address': recipient}])))
        if sub.get('ThresholdExpression') != anomaly_threshold():
            apply('anomaly-threshold', lambda: aws('ce', 'update-anomaly-subscription',
                  '--subscription-arn', sub['SubscriptionArn'], '--threshold-expression', json.dumps(anomaly_threshold())))
        if enrollment.get('status') == 'Inactive':
            apply('free-compute-optimizer', lambda: aws('compute-optimizer', 'update-enrollment-status',
                                                       '--status', 'Active', '--no-include-member-accounts'))
    plan['at'] = datetime.now(timezone.utc).isoformat()
    plan['allRequestedActionsSucceeded'] = all(x['success'] for x in plan['actions'])
    receipt = out / ('apply.json' if args.apply else 'plan.json')
    receipt.write_text(json.dumps(plan, indent=2)+'\n'); os.chmod(receipt, 0o600)
    print(json.dumps(plan, indent=2))
    if not plan['allRequestedActionsSucceeded']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
