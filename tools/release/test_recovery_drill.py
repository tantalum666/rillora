import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('drill', Path(__file__).with_name('recovery_drill.py'))
drill = importlib.util.module_from_spec(spec)
spec.loader.exec_module(drill)


class RecoveryIsolationTests(unittest.TestCase):
    def setUp(self):
        run = 'abcdef0123456789'
        self.state = {'schemaVersion': 1, 'region': drill.REGION, 'account': drill.ACCOUNT,
                      'source': drill.SOURCE, 'run': run, 'target': 'rillora-recovery-' + run,
                      'snapshot': 'rillora-production-recovery-' + run, 'vpc': 'vpc-test',
                      'recoverySecurityGroup': 'sg-recovery', 'subnetGroup': 'isolated', 'parameterGroup': 'tls'}
        self.database = {'DBInstanceIdentifier': self.state['target'], 'PubliclyAccessible': False,
                         'StorageEncrypted': True, 'DBSubnetGroup': {'VpcId': 'vpc-test'},
                         'VpcSecurityGroups': [{'VpcSecurityGroupId': 'sg-recovery'}],
                         'TagList': drill.drill_tags(self.state)}

    def test_source_requires_all_safety_properties(self):
        source = {'DBInstanceIdentifier': drill.SOURCE, 'DBInstanceStatus': 'available', 'Engine': 'postgres',
                  'PubliclyAccessible': False, 'StorageEncrypted': True, 'DeletionProtection': True,
                  'BackupRetentionPeriod': 7, 'TagList': [{'Key': 'Project', 'Value': 'Rillora'},
                  {'Key': 'Environment', 'Value': 'Production'}]}
        drill.validate_source(source)
        for key, value in [('BackupRetentionPeriod', 1), ('PubliclyAccessible', True), ('StorageEncrypted', False),
                           ('DeletionProtection', False), ('DBInstanceIdentifier', 'fanpass')]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                drill.validate_source({**source, key: value})

    def test_cannot_substitute_live_or_other_target(self):
        for target in [drill.SOURCE, 'rillora-recovery-another', 'fanpass']:
            with self.subTest(target=target), self.assertRaises(ValueError):
                drill.validate_state({**self.state, 'target': target})

    def test_target_ownership_network_and_encryption_are_all_required(self):
        drill.validate_target(self.database, self.state)
        changes = [{'DBInstanceIdentifier': drill.SOURCE}, {'PubliclyAccessible': True},
                   {'StorageEncrypted': False}, {'DBSubnetGroup': {'VpcId': 'vpc-staging'}},
                   {'VpcSecurityGroups': [{'VpcSecurityGroupId': 'sg-production'}]}, {'TagList': []}]
        for change in changes:
            with self.subTest(change=change), self.assertRaises(ValueError):
                drill.validate_target({**self.database, **change}, self.state)

    def test_other_drill_cannot_be_adopted_by_prefix_only(self):
        target = copy.deepcopy(self.database)
        target['TagList'][-1]['Value'] = 'different-run'
        with self.assertRaises(ValueError):
            drill.validate_target(target, self.state)

    def test_restore_explicitly_uses_quarantined_private_target(self):
        request = drill.restore_request(self.state)
        self.assertFalse(request['PubliclyAccessible'])
        self.assertFalse(request['MultiAZ'])
        self.assertEqual(request['DBInstanceClass'], 'db.t4g.micro')
        self.assertEqual(request['VpcSecurityGroupIds'], ['sg-recovery'])
        self.assertEqual(request['DBParameterGroupName'], 'tls')
        self.assertNotEqual(request['DBInstanceIdentifier'], drill.SOURCE)

    def test_snapshot_must_be_encrypted_and_come_from_exact_production_source(self):
        snapshot = {'DBSnapshotIdentifier': self.state['snapshot'], 'DBInstanceIdentifier': drill.SOURCE,
                    'Encrypted': True, 'TagList': drill.drill_tags(self.state)}
        drill.validate_snapshot(snapshot, self.state)
        for change in [{'Encrypted': False}, {'DBInstanceIdentifier': 'staging'}, {'TagList': []}]:
            with self.subTest(change=change), self.assertRaises(ValueError):
                drill.validate_snapshot({**snapshot, **change}, self.state)

    def test_manifest_network_must_match_independent_stack_outputs(self):
        state = {**self.state, 'sourceHost': 'rillora-production.internal'}
        outputs = {'ProductionVpcId':'vpc-test','DatabaseSubnetGroup':'isolated',
                   'DatabaseParameterGroup':'tls','RecoveryDatabaseSecurityGroupId':'sg-recovery',
                   'DatabaseSecurityGroupId':'sg-live','DatabaseHost':'rillora-production.internal'}
        drill.validate_trusted_network(state, outputs)
        for field in ['vpc','subnetGroup','parameterGroup','recoverySecurityGroup','sourceHost']:
            with self.subTest(field=field), self.assertRaises(ValueError):
                drill.validate_trusted_network({**state,field:'attacker-selected'}, outputs)
        with self.assertRaises(ValueError):
            drill.validate_trusted_network({**state,'recoverySecurityGroup':'sg-live'},
                                          {**outputs,'RecoveryDatabaseSecurityGroupId':'sg-live'})


if __name__ == '__main__':
    unittest.main()
