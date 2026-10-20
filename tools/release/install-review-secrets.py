#!/usr/bin/env python3
"""Install retained IAP/Web credentials into exact prepared production-review vaults.

No key is generated or rotated. The operator has write/describe permission only.
Provider responses and credential bodies never enter logs or command arguments.
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
from credential_store import CredentialStore, run_with_private_json
def aws(args,profile='rillora-production-operator',private_body=None):
    command=['aws',*args,'--region','eu-central-1','--profile',profile,'--output','json']
    p=run_with_private_json(command,private_body) if private_body is not None else subprocess.run(command,capture_output=True,text=True,timeout=60)
    if p.returncode:raise RuntimeError('AWS operation failed; provider body suppressed')
    return json.loads(p.stdout) if p.stdout.strip() else {}

def private(path):
    if path.stat().st_mode&0o077:raise RuntimeError('Source credential must be owner-only')
    if path.name in {'key-id','issuer-id'}:
        return path.read_text() # Public Apple identifiers, not credential bodies.
    return CredentialStore(ROOT).read(path).decode()

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    if args.output.exists():raise RuntimeError('An installation receipt already exists; inspect current versions instead of repeating')
    if aws(['sts','get-caller-identity'],'rillora-operator')['Account']!='133857166372':raise RuntimeError('Unexpected AWS account')
    stack=aws(['cloudformation','describe-stacks','--stack-name','RilloraProduction'],'rillora-cdk-deploy')['Stacks'][0]
    if stack['StackStatus']!='UPDATE_COMPLETE':raise RuntimeError('Wait for the reviewed preparation stack')
    outputs={x['OutputKey']:x['OutputValue'] for x in stack['Outputs']}
    resources=aws(['cloudformation','list-stack-resources','--stack-name','RilloraProduction'],'rillora-cdk-deploy')['StackResourceSummaries']
    protected=ROOT/'.local-secrets/storekit'
    apple={'schemaVersion':1,'environment':'sandbox','bundleId':'com.rillora.ios',
        'keyId':private(protected/'key-id').strip(),'issuerId':private(protected/'issuer-id').strip(),
        'privateKey':private(protected/'iap-private-key.p8'),'allowedStorefronts':['USA']}
    check=subprocess.run(['node','--input-type=module','-e',"import {readFileSync} from 'node:fs';import {parseAppleReviewSecret} from './apps/api/dist/apple-production-secret.js';parseAppleReviewSecret(readFileSync(0,'utf8'));"],
        cwd=ROOT,input=json.dumps(apple),capture_output=True,text=True)
    if check.returncode:raise RuntimeError('Application credential schema/key validation failed')
    web=json.loads(private(ROOT/'.local-secrets/production-identity/web-client.json'))
    if web['client_id']!='EcevpyKt1GELKwkLnVU3aCbh3Ix2SJhz' or web['domain']!='rillora-dev.eu.auth0.com':raise RuntimeError('Wrong protected Web identity')
    report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'records':[],'keyRotated':False,'plaintextReadback':False}
    for prefix,name,value in [('RuntimeAppleReviewSecretArn','rillora/production/apple-review',apple),('RuntimeWebOidcSecretArn','rillora/production/web-oidc',{'client_secret':web['client_secret']})]:
        arn=next(v for k,v in outputs.items() if k.startswith(prefix))
        if not re.fullmatch('arn:aws:secretsmanager:eu-central-1:133857166372:secret:'+re.escape(name)+r'-[A-Za-z0-9]{6}',arn):raise RuntimeError('Unexpected vault ARN')
        if not any(x['ResourceType']=='AWS::SecretsManager::Secret' and x.get('PhysicalResourceId')==arn for x in resources):raise RuntimeError('Vault is not owned by the prepared stack')
        if aws(['secretsmanager','describe-secret','--secret-id',arn])['Name']!=name:raise RuntimeError('Unexpected vault name')
        result=aws(['secretsmanager','put-secret-value'],private_body={'SecretId':arn,'SecretString':json.dumps(value),'ClientRequestToken':str(uuid.uuid4())})
        after=aws(['secretsmanager','describe-secret','--secret-id',arn])
        if 'AWSCURRENT' not in after['VersionIdsToStages'].get(result['VersionId'],[]):raise RuntimeError('Current version did not match the write receipt')
        report['records'].append({'name':name,'arn':arn,'versionId':result['VersionId'],'currentVersionReadback':True})
        args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'installed':len(report['records']),'currentVersionsConfirmed':True,'secretValuesPrinted':False}))

if __name__=='__main__':main()
