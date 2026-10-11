#!/usr/bin/env python3
"""Install separately prepared production M2M credentials into stack-owned vaults.
Read back version metadata, never secret values. Resume a partial receipt safely.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import uuid

ROOT=Path(__file__).resolve().parents[2]
import sys
sys.path.insert(0,str(ROOT/'tools/security'))
from credential_store import read_secret_json, run_with_private_json
DIRECTORY=ROOT/'.local-secrets/production-identity-services'
SERVICES=[('deletion','account-deletion','RuntimeAccountDeletionServiceSecretArn','TrmdYLDKuqOxF6MhRz2YvXzZhbVvIQo0'),
          ('verification','email-verification','RuntimeEmailVerificationServiceSecretArn','dFELApIxWsoJbsSm9ScWTRTy4NtlcglP')]

def aws(args,profile='rillora-production-operator',private_body=None):
    command=['aws',*args,'--profile',profile,'--region','eu-central-1','--output','json']
    result=run_with_private_json(command,private_body) if private_body is not None else subprocess.run(command,text=True,capture_output=True,timeout=60)
    if result.returncode:raise RuntimeError('AWS installation operation failed; credential/provider body suppressed')
    return json.loads(result.stdout) if result.stdout.strip() else {}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    if aws(['sts','get-caller-identity'],'rillora-operator')['Account']!='133857166372':raise RuntimeError('Unexpected AWS account')
    stack=aws(['cloudformation','describe-stacks','--stack-name','RilloraProduction'],'rillora-cdk-deploy')['Stacks'][0]
    if stack['StackStatus']!='UPDATE_COMPLETE':raise RuntimeError('Wait for preparation stack completion')
    outputs={x['OutputKey']:x['OutputValue'] for x in stack['Outputs']}
    resources=aws(['cloudformation','list-stack-resources','--stack-name','RilloraProduction'],'rillora-cdk-deploy')['StackResourceSummaries']
    report=json.loads(args.output.read_text()) if args.output.exists() else {'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'records':[],'oldClientsChanged':False,'plaintextReadback':False}
    for key,name,prefix,expected in SERVICES:
        source=DIRECTORY/(key+'.json')
        if source.stat().st_mode&0o077 or DIRECTORY.stat().st_mode&0o077:raise RuntimeError('Credential storage must remain owner-only')
        value=read_secret_json(source,root=ROOT)
        if value['client_id']!=expected or value['domain']!='rillora-dev.eu.auth0.com' or not value['client_secret']:raise RuntimeError('Unexpected service identity')
        arn=next(v for k,v in outputs.items() if k.startswith(prefix))
        if not re.fullmatch(r'arn:aws:secretsmanager:eu-central-1:133857166372:secret:rillora/production/'+name+r'-[A-Za-z0-9]{6}',arn):raise RuntimeError('Unexpected vault ARN')
        if not any(x['ResourceType']=='AWS::SecretsManager::Secret' and x.get('PhysicalResourceId')==arn for x in resources):raise RuntimeError('Vault not owned by prepared production stack')
        previous=next((x for x in report['records'] if x['arn']==arn),None)
        if previous:
            after=aws(['secretsmanager','describe-secret','--secret-id',arn])
            if 'AWSCURRENT' not in after['VersionIdsToStages'].get(previous['versionId'],[]):raise RuntimeError('Existing receipt differs from current vault version')
            continue
        result=aws(['secretsmanager','put-secret-value'],private_body={'SecretId':arn,'SecretString':json.dumps(value),'ClientRequestToken':str(uuid.uuid4())})
        after=aws(['secretsmanager','describe-secret','--secret-id',arn])
        if 'AWSCURRENT' not in after['VersionIdsToStages'].get(result['VersionId'],[]):raise RuntimeError('Vault version does not match the write receipt')
        report['records'].append({'service':key,'clientId':expected,'arn':arn,'versionId':result['VersionId'],'currentVersionReadback':True})
        args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'installed':len(report['records']),'currentVersionsConfirmed':True,'secretValuesPrinted':False}))

if __name__=='__main__':main()
