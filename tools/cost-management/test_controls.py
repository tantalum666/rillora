import unittest
from copy import deepcopy
from controls import ACCOUNT, BUDGET, budget_update, confirmed_recipient, notification_plan, anomaly_threshold


class CostControlBoundaryTests(unittest.TestCase):
    def test_budget_preserves_amount_filters_and_history(self):
        before = {'BudgetName': BUDGET, 'BudgetType': 'COST', 'BudgetLimit': {'Amount': '25', 'Unit': 'USD'},
                  'CostFilters': {'TagKeyValue': ['Project$Rillora']}, 'TimeUnit': 'MONTHLY',
                  'TimePeriod': {'Start': '2026-08-01T00:00:00Z'},
                  'CostTypes': {'IncludeCredit': True, 'IncludeRefund': True, 'IncludeTax': True},
                  'CalculatedSpend': {'ActualSpend': {'Amount': '1', 'Unit': 'USD'}}}
        retained = deepcopy(before); updated = budget_update(before)
        self.assertEqual(before, retained)
        for key in ['BudgetLimit', 'CostFilters', 'TimeUnit', 'TimePeriod']:
            self.assertEqual(updated[key], before[key])
        self.assertTrue(updated['CostTypes']['IncludeTax'])
        self.assertFalse(updated['CostTypes']['IncludeCredit'])
        self.assertFalse(updated['CostTypes']['IncludeRefund'])
        self.assertNotIn('CalculatedSpend', updated)

    def test_other_budget_is_refused(self):
        for name, kind in [('OtherProject', 'COST'), (BUDGET, 'USAGE')]:
            with self.assertRaises(ValueError):
                budget_update({'BudgetName': name, 'BudgetType': kind})

    def test_only_existing_confirmed_recipient(self):
        good = {'SubscriptionName': 'Default-Services-Subscription', 'AccountId': ACCOUNT,
                'Frequency': 'DAILY', 'Subscribers': [{'Type': 'EMAIL', 'Status': 'CONFIRMED', 'Address': 'owner@example.test'}]}
        self.assertEqual(confirmed_recipient([good])[1], 'owner@example.test')
        for override in [{'AccountId': '000000000000'}, {'Frequency': 'IMMEDIATE'}, {'Subscribers': []},
                         {'Subscribers': [{'Type': 'EMAIL', 'Status': 'PENDING', 'Address': 'owner@example.test'}]},
                         {'Subscribers': good['Subscribers']*2}]:
            with self.assertRaises(ValueError): confirmed_recipient([good | override])
        with self.assertRaises(ValueError): confirmed_recipient([good, good])

    def test_thresholds_are_notifications_not_shutdown_actions(self):
        items = notification_plan()
        self.assertEqual([(x['NotificationType'], x['Threshold']) for x in items],
                         [('ACTUAL',25),('ACTUAL',50),('ACTUAL',80),('FORECASTED',80)])
        self.assertTrue(all(x['ThresholdType']=='ABSOLUTE_VALUE' for x in items))
        self.assertTrue(all(set(x)=={'NotificationType','ComparisonOperator','Threshold','ThresholdType'} for x in items))
        self.assertEqual(anomaly_threshold()['And'][0]['Dimensions']['Values'], ['5.0'])


if __name__ == '__main__': unittest.main()
