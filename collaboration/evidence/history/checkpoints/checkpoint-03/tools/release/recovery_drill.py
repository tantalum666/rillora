#!/usr/bin/env python3
"""Resumable, quarantined RDS drill. No traffic switch or recovery-success claim."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import uuid

REGION = 'eu-central-1'
SOURCE = 'rillora-production'
ACCOUNT = '133857166372'


def now():
    return datetime.now(timezone.utc).isoformat()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def tags(resource):
    return {item['Key']: item['Value'] for item in resource.get('TagList', [])}


def validate_source(database):
    require(database['DBInstanceIdentifier'] == SOURCE, 'Unexpected source database')
    require(database['DBInstanceStatus'] == 'available', 'Source is not available')
    require(database['PubliclyAccessible'] is False, 'Source must be private')
    require(database['StorageEncrypted'] is True, 'Source storage must be encrypted')
    require(database['DeletionProtection'] is True, 'Source deletion protection is required')
    require(database['BackupRetentionPeriod'] >= 7, 'Seven-day source retention is required')
    require(database['Engine'] == 'postgres', 'Unexpected source engine')
    require(tags(database).get('Project') == 'Rillora', 'Unexpected project')
    require(tags(database).get('Environment') == 'Production', 'Unexpected environment')


def validate_state(state):
    require(state['schemaVersion'] == 1 and state['region'] == REGION, 'Invalid drill manifest')
    require(state['account'] == ACCOUNT and state['source'] == SOURCE, 'Wrong account or source')
    require(re.fullmatch(r'[a-f0-9]{16}', state['run']) is not None, 'Invalid run identifier')
    require(state['target'] == 'rillora-recovery-' + state['run'], 'Unexpected recovery target')
    require(state['snapshot'] == 'rillora-production-recovery-' + state['run'], 'Unexpected snapshot')


def validate_owned(resource, state):
    expected = {'Project': 'Rillora', 'Environment': 'RecoveryDrill', 'RecoveryRun': state['run']}
    require(all(tags(resource).get(k) == v for k, v in expected.items()), 'Drill ownership tags do not match')


def validate_snapshot(snapshot, state):
    validate_state(state)
    require(snapshot['DBSnapshotIdentifier'] == state['snapshot'], 'Unexpected snapshot identity')
    require(snapshot['DBInstanceIdentifier'] == SOURCE, 'Snapshot belongs to another source')
    require(snapshot['Encrypted'] is True, 'Snapshot encryption is required')
    validate_owned(snapshot, state)


def validate_target(database, state):
    validate_state(state)
    require(database['DBInstanceIdentifier'] == state['target'], 'Cannot operate on source or another target')
    require(database['PubliclyAccessible'] is False, 'Recovery target must remain private')
    require(database['StorageEncrypted'] is True, 'Recovery encryption is required')
    require(database['DBSubnetGroup']['VpcId'] == state['vpc'], 'Recovery target is outside the isolated VPC')
    require({g['VpcSecurityGroupId'] for g in database['VpcSecurityGroups']} == {state['recoverySecurityGroup']},
            'Recovery target does not use the isolated recovery security group')
    validate_owned(database, state)


def drill_tags(state):
    return [{'Key': k, 'Value': v} for k, v in {
        'Project': 'Rillora', 'Environment': 'RecoveryDrill', 'RecoveryRun': state['run']}.items()]


def restore_request(state):
    validate_state(state)
    return {'DBInstanceIdentifier': state['target'], 'DBSnapshotIdentifier': state['snapshot'],
            'DBInstanceClass': 'db.t4g.micro', 'DBSubnetGroupName': state['subnetGroup'],
            'DBParameterGroupName': state['parameterGroup'], 'OptionGroupName': 'default:postgres-16',
            'VpcSecurityGroupIds': [state['recoverySecurityGroup']], 'PubliclyAccessible': False,
            'MultiAZ': False, 'DeletionProtection': False, 'CopyTagsToSnapshot': True,
            'Tags': drill_tags(state)}


class Aws:
    def __init__(self, profile):
        self.profile = profile

    def call(self, service, operation, payload=None, missing=None):
        command = ['aws', '--profile', self.profile, '--region', REGION, '--output', 'json',
                   service, operation]
        if payload is not None:
            command += ['--cli-input-json', json.dumps(payload)]
        result = subprocess.run(command, text=True, capture_output=True)
        if result.returncode:
            if missing and '(' + missing + ')' in result.stderr:
                return None
            raise RuntimeError(result.stderr.strip())
        return json.loads(result.stdout) if result.stdout.strip() else {}

    def database(self, name):
        result = self.call('rds', 'describe-db-instances', {'DBInstanceIdentifier': name}, 'DBInstanceNotFound')
        return result['DBInstances'][0] if result else None

    def snapshot(self, name):
        result = self.call('rds', 'describe-db-snapshots', {'DBSnapshotIdentifier': name}, 'DBSnapshotNotFound')
        return result['DBSnapshots'][0] if result else None


def save(path, state):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as stream:
        json.dump(state, stream, indent=2)
        stream.write('\n')
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['plan', 'snapshot', 'restore', 'status', 'cleanup'])
    parser.add_argument('--state', required=True, type=Path)
    parser.add_argument('--profile', default='rillora-production-operator')
    args = parser.parse_args()
    aws = Aws(args.profile)
    identity = aws.call('sts', 'get-caller-identity')
    require(identity['Account'] == ACCOUNT, 'Wrong AWS account')
    require(':assumed-role/rillora-production-operator/' in identity['Arn'], 'Use the scoped production operator role')
    if args.operation == 'plan':
        require(not args.state.exists(), 'Manifest already exists; resume it instead')
        stack = aws.call('cloudformation', 'describe-stacks', {'StackName': 'RilloraProduction'})['Stacks'][0]
        require(stack['StackStatus'] in ['CREATE_COMPLETE', 'UPDATE_COMPLETE'], 'Production foundation is not deployed')
        outputs = {v['OutputKey']: v['OutputValue'] for v in stack['Outputs']}
        require(outputs['ProductionTrafficReady'] == 'false', 'This synthetic drill is for the closed foundation')
        database = aws.database(SOURCE)
        require(database is not None, 'Production database does not exist')
        validate_source(database)
        run = uuid.uuid4().hex[:16]
        state = {'schemaVersion': 1, 'createdAt': now(), 'account': ACCOUNT, 'region': REGION,
                 'source': SOURCE, 'run': run, 'target': 'rillora-recovery-' + run,
                 'snapshot': 'rillora-production-recovery-' + run, 'stage': 'planned',
                 'vpc': outputs['ProductionVpcId'], 'subnetGroup': outputs['DatabaseSubnetGroup'],
                 'parameterGroup': outputs['DatabaseParameterGroup'],
                 'recoverySecurityGroup': outputs['RecoveryDatabaseSecurityGroupId'],
                 'sourceHost': outputs['DatabaseHost'], 'acceptancePassed': False,
                 'boundary': 'Resource orchestration only. Decryption, deletion/authorization replay and session invalidation still require separate evidence.'}
    else:
        state = json.loads(args.state.read_text())
        validate_state(state)
        snapshot = aws.snapshot(state['snapshot'])
        database = aws.database(state['target'])
        state['snapshotStatus'] = snapshot['Status'] if snapshot else 'absent'
        state['targetStatus'] = database['DBInstanceStatus'] if database else 'absent'
        if snapshot:
            validate_snapshot(snapshot, state)
        if database:
            validate_target(database, state)
        if args.operation == 'snapshot':
            source = aws.database(SOURCE)
            require(source is not None, 'Production database does not exist')
            validate_source(source)
            if not snapshot:
                # Persist exact names before a remote write so an interrupted call is resumable.
                state.update(stage='snapshot_requested', snapshotRequestedAt=now())
                save(args.state, state)
                snapshot = aws.call('rds', 'create-db-snapshot', {'DBInstanceIdentifier': SOURCE,
                    'DBSnapshotIdentifier': state['snapshot'], 'Tags': drill_tags(state)})['DBSnapshot']
            state['snapshotStatus'] = snapshot['Status']
        elif args.operation == 'restore':
            require(snapshot is not None and snapshot['Status'] == 'available', 'Snapshot is not available')
            if not database:
                state.update(stage='restore_requested', restoreRequestedAt=now())
                save(args.state, state)
                database = aws.call('rds', 'restore-db-instance-from-db-snapshot', restore_request(state))['DBInstance']
            state['targetStatus'] = database['DBInstanceStatus']
        elif args.operation == 'cleanup':
            # Removing an owned disposable clone is separate from deleting its source/snapshot.
            if database:
                if database['DBInstanceStatus'] != 'deleting':
                    require(database['DeletionProtection'] is False, 'Protected target requires manual review')
                    result = aws.call('rds', 'delete-db-instance', {'DBInstanceIdentifier': state['target'],
                                     'SkipFinalSnapshot': True, 'DeleteAutomatedBackups': True})
                    state['targetStatus'] = result.get('DBInstance', {}).get('DBInstanceStatus', 'deletion_requested')
                state['stage'] = 'cleanup_waiting_for_target_removal'
            elif snapshot:
                if snapshot['Status'] != 'deleting':
                    result = aws.call('rds', 'delete-db-snapshot', {'DBSnapshotIdentifier': state['snapshot']})
                    state['snapshotStatus'] = result.get('DBSnapshot', {}).get('Status', 'deletion_requested')
                state['stage'] = 'cleanup_waiting_for_snapshot_removal'
            else:
                state.update(stage='cleaned', cleanupVerifiedAt=now())
        else:
            state['snapshotStatus'] = snapshot['Status'] if snapshot else 'absent'
            state['targetStatus'] = database['DBInstanceStatus'] if database else 'absent'
            if snapshot:
                state['snapshotCreatedAt'] = snapshot['SnapshotCreateTime']
            if database and database['DBInstanceStatus'] == 'available':
                state.setdefault('targetAvailableObservedAt', now())
                state['targetHost'] = database['Endpoint']['Address']
                state['stage'] = 'quarantined_pending_data_acceptance'
    state['lastCheckedAt'] = now()
    save(args.state, state)
    print(json.dumps({k: state.get(k) for k in ['stage', 'snapshotStatus', 'targetStatus', 'acceptancePassed']}))


if __name__ == '__main__':
    main()
