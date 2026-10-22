"""Upload only reviewed template bytes through the existing CDK file-publishing role."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

file=Path(sys.argv[1]).resolve()
assert file.name in ['RilloraStaging-template-patched.json','RilloraProduction-template-patched.json','RilloraStaging-template-before.json','RilloraProduction-template-before.json','RilloraStaging-template-rollback.json','RilloraProduction-template-rollback.json']
region='eu-central-1';account='133857166372'
role=f'arn:aws:iam::{account}:role/cdk-hnb659fds-file-publishing-role-{account}-{region}'
process=subprocess.run(['aws','--profile','rillora-cdk-session','--region',region,'sts','assume-role','--role-arn',role,'--role-session-name','rillora-node-templates','--duration-seconds','900','--output','json','--no-cli-pager'],text=True,capture_output=True,check=True)
credentials=json.loads(process.stdout)['Credentials'];del process
environment={k:v for k,v in os.environ.items() if k not in ['AWS_PROFILE','AWS_DEFAULT_PROFILE','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_SESSION_TOKEN']}
environment.update(AWS_ACCESS_KEY_ID=credentials['AccessKeyId'],AWS_SECRET_ACCESS_KEY=credentials['SecretAccessKey'],AWS_SESSION_TOKEN=credentials['SessionToken'],AWS_DEFAULT_REGION=region)
del credentials
bucket=f'cdk-hnb659fds-assets-{account}-{region}'
key='node-security-20261022/'+hashlib.sha256(file.read_bytes()).hexdigest()+'.json'
subprocess.run(['aws','s3','cp',str(file),'s3://'+bucket+'/'+key,'--only-show-errors','--region',region],env=environment,check=True)
print(json.dumps({'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'templateUrl':f'https://{bucket}.s3.{region}.amazonaws.com/{key}'}))
