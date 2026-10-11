#!/usr/bin/env python3
"""Install the dedicated read-only credential into its exact staging secret; no readback."""
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
        raise RuntimeError('AWS operation failed or session expired; credential/provider output suppressed.')
    return json.loads(result.stdout) if result.stdout.strip() else {}

def main():
    if aws('rillora-operator','sts','get-caller-identity')['Account'] != ACCOUNT:
        raise RuntimeError('Unexpected AWS account')
    stack=aws('rillora-cdk-deploy','cloudformation','describe-stacks','--stack-name','RilloraStaging')['Stacks'][0]
    arn={item['OutputKey']:item['OutputValue'] for item in stack['Outputs']}['EmailVerificationClientSecretArn']
    resources=aws('rillora-cdk-deploy','cloudformation','list-stack-resources','--stack-name','RilloraStaging')['StackResourceSummaries']
    matches=[item for item in resources if item['ResourceType']=='AWS::SecretsManager::Secret' and item['LogicalResourceId'].startswith('EmailVerificationClientSecret') and item.get('PhysicalResourceId')==arn]
    if not arn.startswith(f'arn:aws:secretsmanager:eu-central-1:{ACCOUNT}:secret:') or len(matches)!=1:
        raise RuntimeError('Unexpected secret resource')
    source=ROOT/'.local-secrets/email-verification/auth0-management.json'
    if source.stat().st_mode & 0o077:
        raise RuntimeError('Protected credential must be mode0600')
    client=read_secret_json(source,root=ROOT)
    if client['client_id']!='85FI2tG6AtD7pvzxrxVOIeVqhDPhrANc' or client['domain']!='rillora-dev.eu.auth0.com':
        raise RuntimeError('Unexpected service client')
    aws('rillora-staging-operator','secretsmanager','put-secret-value',private_body={'SecretId':arn,'SecretString':client['client_secret']})
    print('Dedicated read-only email verification credential installed; no secret readback.')

if __name__=='__main__': main()
