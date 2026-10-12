#!/usr/bin/env python3
"""Invoke only the deployed staging migration broker; no task/container overrides."""
import argparse
import json
import re
import uuid
from pathlib import Path
from recovery_drill import Aws, ACCOUNT, require

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile',default='rillora-staging-operator')
    parser.add_argument('--client-token',default=uuid.uuid4().hex)
    audit=parser.add_mutually_exclusive_group()
    audit.add_argument('--audit',action='store_true',help='Run only the fixed read-only deployment probe')
    audit.add_argument('--audit-authority',action='store_true',help='Run only the fixed post-migration authority probe')
    args=parser.parse_args()
    require(re.fullmatch(r'[a-f0-9]{32}',args.client_token) is not None,'Invalid idempotency token')
    aws=Aws(args.profile);identity=aws.call('sts','get-caller-identity')
    require(identity['Account']==ACCOUNT and ':assumed-role/rillora-staging-operator/' in identity['Arn'],'Use the scoped staging operator')
    stack=aws.call('cloudformation','describe-stacks',{'StackName':'RilloraStaging'})['Stacks'][0]
    require(stack['StackStatus'] in ['CREATE_COMPLETE','UPDATE_COMPLETE'],'Staging is not stable')
    outputs={row['OutputKey']:row['OutputValue'] for row in stack['Outputs']}
    request={'operation':'audit' if args.audit or args.audit_authority else 'migrate','clientToken':args.client_token}
    if args.audit or args.audit_authority:
        name='probe_security_authority.mjs' if args.audit_authority else 'probe_security_rollout.mjs'
        request['script']=Path(__file__).with_name(name).read_text()
    print(json.dumps(aws.invoke_broker(outputs['MaintenanceBrokerFunctionName'],request)))

if __name__=='__main__':main()
