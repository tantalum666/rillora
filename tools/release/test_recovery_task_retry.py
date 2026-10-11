"""Exercise saved-invocation recovery with a fake AWS provider; no cloud calls."""
import contextlib
from datetime import datetime, timedelta, timezone
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import run_recovery_task as runner

NOW = datetime(2026, 10, 3, tzinfo=timezone.utc)


class Clock(datetime):
    @classmethod
    def now(cls, tz=None):
        return NOW


class Provider:
    def __init__(self):
        self.writes = []
        self.writer_count = 0
        self.snapshot_source = 'rillora-production'
        self.outputs = {'ProductionTrafficReady': 'false', 'ClusterName': 'fixture-cluster',
            'MigrationTaskDefinitionArn': 'migration:1', 'RecoveryTaskDefinitionArn': 'recovery:1',
            'MaintenanceSubnetIds': 'subnet-fixture', 'MigrationSecurityGroupId': 'sg-migration',
            'RecoverySecurityGroupId': 'sg-recovery', 'RuntimeApiServiceName': 'fixture-api',
            'MaintenanceBrokerFunctionName': 'fixture-broker'}

    def invoke_broker(self, name, request):
        assert name == 'fixture-broker'
        assert request['runToken'] == 'r' * 43
        assert request['operation'] == 'task'
        self.writes.append(request['request'])
        return {'tasks': [{'taskArn': 'fixture-task', 'lastStatus': 'PENDING'}]}

    def call(self, service, operation, payload=None):
        if operation == 'get-caller-identity':
            return {'Account': runner.ACCOUNT, 'Arn': f'arn:aws:sts::{runner.ACCOUNT}:assumed-role/rillora-production-operator/fixture'}
        if operation == 'describe-stacks':
            return {'Stacks': [{'StackStatus': 'UPDATE_COMPLETE', 'Outputs': [
                {'OutputKey': key, 'OutputValue': value} for key, value in self.outputs.items()]}]}
        if operation == 'run-task':
            self.writes.append(payload)
            return {'tasks': [{'taskArn': 'fixture-task', 'lastStatus': 'PENDING'}]}
        if operation == 'describe-services':
            return {'services': [{'desiredCount': self.writer_count, 'runningCount': self.writer_count, 'pendingCount': 0}]}
        raise AssertionError((service, operation))

    def database(self, name):
        return {'DBInstanceIdentifier': name, 'DBInstanceStatus': 'available', 'PubliclyAccessible': False,
            'StorageEncrypted': True, 'DBSubnetGroup': {'VpcId': 'vpc-fixture'},
            'VpcSecurityGroups': [{'VpcSecurityGroupId': 'sg-recovery-db'}],
            'Endpoint': {'Address': 'fixture.recovery.internal'}, 'TagList': self.tags()}

    def snapshot(self, name):
        return {'DBSnapshotIdentifier': name, 'DBInstanceIdentifier': self.snapshot_source, 'Encrypted': True,
            'Status': 'available', 'SnapshotCreateTime': (NOW - timedelta(days=1)).isoformat(), 'TagList': self.tags()}

    @staticmethod
    def tags():
        return [{'Key': key, 'Value': value} for key, value in {'Project': 'Rillora',
            'Environment': 'RecoveryDrill', 'RecoveryRun': 'abcdef0123456789'}.items()]


class RecoveryTaskRetryTests(unittest.TestCase):
    def fixture(self, age, operation='migrate'):
        run = 'abcdef0123456789'
        token = 'a' * 32
        request = {'cluster': 'fixture-cluster', 'taskDefinition': 'migration:1', 'launchType': 'FARGATE',
            'clientToken': token, 'networkConfiguration': {'awsvpcConfiguration': {
                'subnets': ['subnet-fixture'], 'securityGroups': ['sg-migration'], 'assignPublicIp': 'ENABLED'}},
            'overrides': {'containerOverrides': [{'name': 'Maintenance',
                'command': ['/bin/sh', '-c', 'node dist/migrate.js && node dist/bootstrap-runtime.js && node dist/migrate-private-content.js --enforce'],
                'environment': [{'name': 'RECOVERY_RUN', 'value': run}]}]}}
        if operation != 'migrate':
            request['taskDefinition'] = 'recovery:1'
            request['networkConfiguration']['awsvpcConfiguration']['securityGroups'] = ['sg-recovery']
            container = request['overrides']['containerOverrides'][0]
            container['command'] = ['node', 'dist/recovery-commerce-admin.js'] if operation == 'reconcile-commerce' else ['node', 'dist/recovery-admin.js', operation]
            container['environment'] += [{'name': 'DATABASE_HOST', 'value': 'fixture.recovery.internal'},
                {'name': 'RECOVERY_SNAPSHOT_TIME', 'value': (NOW - timedelta(days=1)).isoformat()}]
            if operation == 'reconcile-commerce':
                container['environment'].append({'name': 'RECOVERY_SOURCE_FROZEN_AT', 'value': (NOW - timedelta(minutes=2)).isoformat()})
        return {'schemaVersion': 1, 'region': 'eu-central-1', 'account': runner.ACCOUNT,
            'source': 'rillora-production', 'run': run, 'runToken': 'r' * 43, 'target': 'rillora-recovery-' + run,
            'snapshot': 'rillora-production-recovery-' + run, 'vpc': 'vpc-fixture', 'recoverySecurityGroup': 'sg-recovery-db',
            'maintenanceTasks': {operation: {'clientToken': token, 'requestedAt': (NOW - age).isoformat(), 'request': request}}}

    def invoke(self, state, provider, operation='migrate'):
        with tempfile.TemporaryDirectory() as temporary:
            protected = Path(temporary) / '.local-secrets'; protected.mkdir(mode=0o700)
            path = protected / 'state.json'; path.write_text(json.dumps(state)); path.chmod(0o600)
            with patch.object(runner, 'Aws', return_value=provider), patch.object(runner, 'datetime', Clock), \
                 patch('sys.argv', ['fixture', operation, '--state', str(path)]), contextlib.redirect_stdout(io.StringIO()):
                runner.main()
            return json.loads(path.read_text())

    def test_old_future_or_missing_invocation_time_cannot_reissue_a_task(self):
        for age in [timedelta(days=2), timedelta(hours=2), timedelta(minutes=55), timedelta(minutes=-1), None]:
            with self.subTest(age=age):
                state = self.fixture(age or timedelta())
                if age is None: del state['maintenanceTasks']['migrate']['requestedAt']
                provider = Provider()
                with self.assertRaisesRegex(ValueError, 'idempotency|invocation time'):
                    self.invoke(state, provider)
                self.assertEqual(provider.writes, [])

    def test_recent_retry_cannot_change_saved_scope_or_lose_its_token(self):
        for mutation in ['cluster', 'token', 'command']:
            with self.subTest(mutation=mutation):
                state = self.fixture(timedelta(minutes=1))
                request = state['maintenanceTasks']['migrate']['request']
                if mutation == 'cluster': request['cluster'] = 'another-cluster'
                if mutation == 'token': del request['clientToken']
                if mutation == 'command': request['overrides']['containerOverrides'][0]['command'] = ['unexpected-command']
                provider = Provider()
                with self.assertRaisesRegex(ValueError, 'saved request'):
                    self.invoke(state, provider)
                self.assertEqual(provider.writes, [])

    def test_recent_identical_request_reconciles_the_same_token(self):
        state = self.fixture(timedelta(minutes=1)); provider = Provider()
        updated = self.invoke(state, provider)
        self.assertEqual(provider.writes, [state['maintenanceTasks']['migrate']['request']])
        self.assertEqual(updated['maintenanceTasks']['migrate']['arn'], 'fixture-task')

    def test_known_task_is_not_reissued_without_a_verified_failure(self):
        state = self.fixture(timedelta(days=2)); provider = Provider()
        state['maintenanceTasks']['migrate']['arn'] = 'already-recorded-task'
        with self.assertRaisesRegex(ValueError, 'already recorded'):
            self.invoke(state, provider)
        self.assertEqual(provider.writes, [])

    def test_uncertain_commerce_request_rechecks_current_source_writers(self):
        provider = Provider(); provider.writer_count = 1
        with self.assertRaisesRegex(ValueError, 'source writers'):
            self.invoke(self.fixture(timedelta(minutes=1), 'reconcile-commerce'), provider, 'reconcile-commerce')
        self.assertEqual(provider.writes, [])

    def test_uncertain_restore_rechecks_snapshot_identity(self):
        provider = Provider(); provider.snapshot_source = 'another-project'
        with self.assertRaisesRegex(ValueError, 'another source'):
            self.invoke(self.fixture(timedelta(minutes=1), 'restore'), provider, 'restore')
        self.assertEqual(provider.writes, [])

    def test_recent_restore_and_commerce_retries_keep_exact_verified_inputs(self):
        for operation in ['restore', 'reconcile-commerce']:
            with self.subTest(operation=operation):
                state = self.fixture(timedelta(minutes=1), operation); provider = Provider()
                updated = self.invoke(state, provider, operation)
                self.assertEqual(provider.writes, [state['maintenanceTasks'][operation]['request']])
                self.assertEqual(updated['maintenanceTasks'][operation]['arn'], 'fixture-task')

    def test_expired_freeze_evidence_cannot_start_an_uncertain_commerce_task(self):
        state = self.fixture(timedelta(minutes=1), 'reconcile-commerce'); provider = Provider()
        environment = state['maintenanceTasks']['reconcile-commerce']['request']['overrides']['containerOverrides'][0]['environment']
        next(item for item in environment if item['name'] == 'RECOVERY_SOURCE_FROZEN_AT')['value'] = (NOW - timedelta(minutes=8)).isoformat()
        with self.assertRaisesRegex(ValueError, 'source-freeze evidence expired'):
            self.invoke(state, provider, 'reconcile-commerce')
        self.assertEqual(provider.writes, [])


if __name__ == '__main__':
    unittest.main()
