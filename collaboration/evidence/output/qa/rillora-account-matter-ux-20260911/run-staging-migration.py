from pathlib import Path
import json,subprocess
q=Path(__file__).parent

def aws(args,profile='rillora-cdk-deploy'):
 return json.loads(subprocess.check_output(['aws',*args,'--profile',profile,'--output','json'],text=True))
s=aws(['cloudformation','describe-stacks','--stack-name','RilloraStaging'])['Stacks'][0]
assert s['StackStatus']=='UPDATE_COMPLETE',s['StackStatus']
o={v['OutputKey']:v['OutputValue'] for v in s['Outputs']}
assert o['ServiceDesiredCount']=='0'
net={'awsvpcConfiguration':{'subnets':o['PublicSubnetIds'].split(','),'securityGroups':[o['TaskSecurityGroupId']],'assignPublicIp':'ENABLED'}}
args=['ecs','run-task','--cluster',o['ClusterName'],'--task-definition',o['MigrationTaskDefinitionArn'],'--launch-type','FARGATE','--network-configuration',json.dumps(net)]
r=aws(args,'rillora-staging-operator')
assert not r.get('failures'),r.get('failures')
t=r['tasks'][0];result={'cluster':o['ClusterName'],'taskArn':t['taskArn'],'taskDefinitionArn':t['taskDefinitionArn'],'lastStatus':t['lastStatus']}
(q/'migration-task.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
