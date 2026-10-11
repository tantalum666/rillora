#!/usr/bin/env python3
"""Install the prepared dedicated M2M secret into the exact existing staging resource.
Run only after deploying the disabled AccountDeletionClientSecret resource. No value is printed.
"""
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
import sys
sys.path.insert(0,str(ROOT/'tools/security'))
from credential_store import read_secret_json, run_with_private_json
ACCOUNT = '133857166372'

def aws(profile, *args, private_body=None):
    command=['aws','--profile',profile,'--region','eu-central-1',*args,'--output','json']
    result=run_with_private_json(command,private_body) if private_body is not None else subprocess.run(command,text=True,capture_output=True)
    if result.returncode:
        raise RuntimeError('AWS operation failed or its personal session expired; secret and provider response suppressed.')
    return json.loads(result.stdout) if result.stdout.strip() else {}

def main():
    if aws('rillora-operator', 'sts', 'get-caller-identity')['Account'] != ACCOUNT:
        raise RuntimeError('Unexpected AWS account')
    stack = aws('rillora-cdk-deploy', 'cloudformation', 'describe-stacks', '--stack-name', 'RilloraStaging')['Stacks'][0]
    outputs = {item['OutputKey']: item['OutputValue'] for item in stack['Outputs']}
    secret_arn = outputs['AccountDeletionClientSecretArn']
    resources = aws('rillora-cdk-deploy', 'cloudformation', 'list-stack-resources', '--stack-name', 'RilloraStaging')['StackResourceSummaries']
    matches = [item for item in resources if item['ResourceType'] == 'AWS::SecretsManager::Secret' and item['LogicalResourceId'].startswith('AccountDeletionClientSecret') and item.get('PhysicalResourceId') == secret_arn]
    if not secret_arn.startswith(f'arn:aws:secretsmanager:eu-central-1:{ACCOUNT}:secret:') or len(matches) != 1:
        raise RuntimeError('Unexpected deletion secret resource')
    source = ROOT / '.local-secrets/account-deletion/auth0-management.json'
    if source.stat().st_mode & 0o077:
        raise RuntimeError('Protected local secret must be mode0600')
    client = read_secret_json(source,root=ROOT)
    if client['client_id'] != '8PNcymHitFBsqlqfsHqvkp3fzQF8KXK7' or not client.get('client_secret'):
        raise RuntimeError('Unexpected Auth0 service identity')
    aws('rillora-staging-operator','secretsmanager','put-secret-value',private_body={'SecretId':secret_arn,'SecretString':client['client_secret']})
    print('Dedicated deletion secret installed into the verified staging resource; no secret readback performed.')

if __name__ == '__main__':
    main()
