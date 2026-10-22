"""Prepare or inspect an image-only rollback; NEVER executes it or runs tasks.

The old digest restores Node 22.22.3 and its vulnerability. Use only for an
assessed recovery need. Existing AWS profiles/roles are required; no new IAM.
"""
import argparse
import copy
import datetime
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PRIVATE = HERE.parents[2] / '.local/node-security-deployment-20261022'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def restore_images(live, changes):
    target = copy.deepcopy(live)
    for change in changes:
        containers = target['Resources'][change['path'][1]]['Properties']['ContainerDefinitions']
        require(len(containers) == 1 and containers[0]['Image'] == change['after'],
                'Current image differs from this release; stop and assess.')
        containers[0]['Image'] = change['rollbackImage']
    check = copy.deepcopy(target)
    for change in changes:
        check['Resources'][change['path'][1]]['Properties']['ContainerDefinitions'][0]['Image'] = change['after']
    require(check == live, 'Non-image rollback drift')
    return target


def aws(*args):
    result = subprocess.run(['aws', '--profile', 'rillora-cdk-deploy', '--region', 'eu-central-1',
                             '--output', 'json', '--no-cli-pager', *args],
                            capture_output=True, text=True, timeout=55)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout.strip() else {}


def body(value):
    return json.loads(value) if isinstance(value, str) else value


def save(path, value):
    path.write_text(json.dumps(value, indent=2) + '\n')
    path.chmod(0o600)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('environment', choices=['staging', 'production'])
    parser.add_argument('action', choices=['prepare', 'inspect'])
    args = parser.parse_args()
    PRIVATE.mkdir(parents=True, exist_ok=True, mode=0o700)
    state_file = PRIVATE / (args.environment + '-rollback-plan.json')
    stack_name = 'Rillora' + args.environment.title()
    release = next(r for r in json.loads((HERE / 'rollback-images.json').read_text()) if r['stack'] == stack_name)
    stack = aws('cloudformation', 'describe-stacks', '--stack-name', stack_name)['Stacks'][0]
    require(stack['StackStatus'] == 'UPDATE_COMPLETE', 'Stack is not stable; inspect its operation first.')
    live = body(aws('cloudformation', 'get-template', '--stack-name', stack_name,
                    '--template-stage', 'Original')['TemplateBody'])
    if args.action == 'prepare':
        require(not state_file.exists(), 'Saved request exists. Inspect its AWS state before any retry.')
        target = restore_images(live, release['imageChanges'])
        file = PRIVATE / (stack_name + '-template-rollback.json')
        save(file, target)
        upload = json.loads(subprocess.check_output([sys.executable, str(HERE / 'publish_template.py'), str(file)], text=True))
        name = 'node22-rollback-' + args.environment + '-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        request = {'StackName': stack_name, 'ChangeSetName': name, 'ChangeSetType': 'UPDATE',
                   'TemplateURL': upload['templateUrl'], 'Capabilities': stack.get('Capabilities', []),
                   'RoleARN': stack['RoleARN'], 'ClientToken': name,
                   'Parameters': [{'ParameterKey': p['ParameterKey'], 'UsePreviousValue': True} for p in stack.get('Parameters', [])],
                   'Description': 'Recovery only: previous immutable images; Node22.22.3 vulnerability returns; no data/schema change'}
        request_file = PRIVATE / (args.environment + '-rollback-create.json')
        save(request_file, request)
        state = {'request': request, 'liveBefore': live, 'target': target, 'parameters': stack.get('Parameters', [])}
        save(state_file, state)  # Preserve intent before the write; uncertain outcomes must be inspected.
        result = aws('cloudformation', 'create-change-set', '--cli-input-json', 'file://' + str(request_file))
        state['changeSetId'] = result['Id']; save(state_file, state)
        print(json.dumps({'changeSetId': result['Id'], 'executed': False,
                          'next': 'Run inspect after change-set creation completes. Do not repeat prepare.'}, indent=2))
        return
    state = json.loads(state_file.read_text())
    require(live == state['liveBefore'] and stack.get('Parameters', []) == state['parameters'],
            'Live template or parameters changed after preparation; stop and assess.')
    change = aws('cloudformation', 'describe-change-set', '--stack-name', stack_name,
                 '--change-set-name', state.get('changeSetId', state['request']['ChangeSetName']))
    if change['Status'] == 'CREATE_IN_PROGRESS':
        print(json.dumps({'status': change['Status'], 'executed': False})); return
    require(change['Status'] == 'CREATE_COMPLETE' and change['ExecutionStatus'] == 'AVAILABLE',
            'Change set is not available; inspect its status, do not retry execution.')
    actual = body(aws('cloudformation', 'get-template', '--stack-name', stack_name,
                      '--change-set-name', change['ChangeSetId'], '--template-stage', 'Original')['TemplateBody'])
    require(actual == state['target'] == restore_images(live, release['imageChanges']), 'AWS TemplateBody mismatch')
    require(change['Parameters'] == state['parameters'], 'Parameter mismatch')
    approved = json.loads((HERE / (args.environment + '-reviewed-changeset.json')).read_text())
    allowed = {c['LogicalResourceId'] for c in approved['changes']}
    for item in change['Changes']:
        resource = item['ResourceChange']
        require(resource['Action'] == 'Modify' and resource['LogicalResourceId'] in allowed,
                'Unexpected resource change; stop and assess.')
    save(PRIVATE / (args.environment + '-rollback-inspected.json'), change)
    print(json.dumps({'changeSetId': change['ChangeSetId'], 'templateMatches': True, 'onlyImageChanges': True,
                      'parametersPreserved': True, 'executed': False,
                      'executeOnlyIfRecoveryRequired': ['aws', '--profile', 'rillora-cdk-deploy', '--region', 'eu-central-1',
                         'cloudformation', 'execute-change-set', '--stack-name', stack_name,
                         '--change-set-name', change['ChangeSetId'], '--client-request-token', state['request']['ClientToken'] + '-execute']}, indent=2))


if __name__ == '__main__':
    main()
