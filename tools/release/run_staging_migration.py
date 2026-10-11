#!/usr/bin/env python3
"""Invoke only the deployed staging migration broker; no task/container overrides."""
import argparse
import json
import re
import uuid
from recovery_drill import Aws, ACCOUNT, require

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile',default='rillora-staging-operator')
    parser.add_argument('--client-token',default=uuid.uuid4().hex)
    args=parser.parse_args()
    require(re.fullmatch(r'[a-f0-9]{32}',args.client_token) is not None,'Invalid idempotency token')
    aws=Aws(args.profile);identity=aws.call('sts','get-caller-identity')
    require(identity['Account']==ACCOUNT and ':assumed-role/rillora-staging-operator/' in identity['Arn'],'Use the scoped staging operator')
    stack=aws.call('cloudformation','describe-stacks',{'StackName':'RilloraStaging'})['Stacks'][0]
    require(stack['StackStatus'] in ['CREATE_COMPLETE','UPDATE_COMPLETE'],'Staging is not stable')
    outputs={row['OutputKey']:row['OutputValue'] for row in stack['Outputs']}
    print(json.dumps(aws.invoke_broker(outputs['MaintenanceBrokerFunctionName'],{'operation':'migrate','clientToken':args.client_token})))

if __name__=='__main__':main()
