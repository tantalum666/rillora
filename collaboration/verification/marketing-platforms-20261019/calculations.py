#!/usr/bin/env python3
"""Recompute planning arithmetic; never calls an ad platform or predicts demand."""
from pathlib import Path
import csv
import json
import math

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
plan = json.loads((ROOT / 'config/marketing/acquisition-budget-20261019.json').read_text())
assert plan['executionEnabled'] is False
assert plan['currentApprovedPaidAdBudgetUsd'] == 0
assert plan['campaignsCreated'] is False
budgets = []
for scenario in plan['scenarios']:
    media = sum(row.get('mediaUsd', 0) for row in scenario['allocations'])
    reserve = sum(row.get('uncommittedUsd', 0) for row in scenario['allocations'])
    assert media + reserve == scenario['cashCeilingUsd']
    assert scenario['allocations'][0]['mediaUsd'] == 50
    budgets.append({'cashCeilingUsd': scenario['cashCeilingUsd'],
                    'conditionalMediaCeilingUsd': media,
                    'feesAndUncommittedReserveUsd': reserve})

arithmetic = []
for cpc, conversion in [(0.5, 0.02), (1, 0.02), (2, 0.02), (1, 0.04)]:
    arithmetic.append({'assumedCpcUsd': cpc,
                       'assumedClickToNetPaidRate': conversion,
                       'mediaCacUsd': cpc / conversion})
zero_payer_probability = math.pow(1 - 0.02, 50)
assert abs(zero_payer_probability - 0.36416968008711675) < 1e-12

with (ROOT / 'config/marketing/paid-experiments-template-20261019.csv').open(newline='') as f:
    experiments = list(csv.DictReader(f))
assert experiments and all(None not in row for row in experiments)
for row in experiments:
    assert row['approved'] == 'false'
    for metric in ['actual_media_spend_usd', 'paid_clicks', 'new_external_net_paid_households']:
        assert row[metric] == '', 'Planned rows must not manufacture performance data'
execution = json.loads((ROOT / 'config/content-program.json').read_text())
assert execution['publishEnabled'] is False
assert execution['initialPaidAdBudgetUsd'] == 0

result = {'passed': True, 'budgets': budgets, 'cacArithmetic': arithmetic,
          'illustrationOnly': {'spendUsd': 200, 'assumedCpcUsd': 1,
                              'assumedClickToNetPaidRate': 0.02,
                              'expectedPayersNotGuaranteed': 4,
                              'mediaCacUsd': 50,
                              'grossAnnualSalesNotProfitUsd': round(4 * 88.99, 2),
                              'probabilityOfZeroPayersIn50IndependentClicks': zero_payer_probability},
          'proposedCacCaps': [{'assumedFirstYearContributionUsd': c, 'capUsd': min(25, 0.4*c)}
                              for c in [40, 60]],
          'measuredMarketingResults': False, 'trackingImplemented': False,
          'campaignExecutionEnabled': False, 'actualMetricsRemainBlank': True}
(OUT / 'calculations.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
