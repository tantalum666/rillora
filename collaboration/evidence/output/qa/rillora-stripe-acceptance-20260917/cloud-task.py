from pathlib import Path
import subprocess,json,sys
q=Path(__file__).resolve().parent

def aws(*args): return json.loads(subprocess.check_output(['aws',*args,'--region','eu-central-1','--output','json'],text=True))
mode=sys.argv[1];label=sys.argv[2]
if not label.replace('-','').isalnum():raise SystemExit('Invalid task label')
if mode=='start':
 stack=aws('cloudformation','describe-stacks','--stack-name','RilloraStaging','--profile','rillora-cdk-deploy')['Stacks'][0]
 if stack['StackStatus']!='UPDATE_COMPLETE':raise SystemExit('Wait for the coordinated stack update to finish')
 outputs={x['OutputKey']:x['OutputValue'] for x in stack['Outputs']}
 command=['node','dist/migrate.js']
 if len(sys.argv)>3:
  code=Path(sys.argv[3]).read_text();check=subprocess.run(['node','--input-type=module','--check'],input=code,text=True,capture_output=True)
  if check.returncode:raise SystemExit('Cloud helper failed local syntax validation')
  command=['node','--input-type=module','-e',code]
 network={'awsvpcConfiguration':{'subnets':outputs['PublicSubnetIds'].split(','),'securityGroups':[outputs['TaskSecurityGroupId']],'assignPublicIp':'ENABLED'}}
 result=aws('ecs','run-task','--cluster',outputs['ClusterName'],'--task-definition',outputs['MigrationTaskDefinitionArn'],'--launch-type','FARGATE','--network-configuration',json.dumps(network),'--overrides',json.dumps({'containerOverrides':[{'name':'Migration','command':command}]}),'--profile','rillora-staging-operator')
 if result.get('failures'):raise SystemExit('Staging task could not start')
 task=result['tasks'][0];state={'cluster':outputs['ClusterName'],'taskArn':task['taskArn'],'taskDefinitionArn':outputs['MigrationTaskDefinitionArn']}
 (q/(label+'-task.json')).write_text(json.dumps(state,indent=2));print(json.dumps(state))
elif mode=='status':
 state=json.loads((q/(label+'-task.json')).read_text());r=aws('ecs','describe-tasks','--cluster',state['cluster'],'--tasks',state['taskArn'],'--profile','rillora-staging-operator')['tasks'][0]
 (q/(label+'-status.json')).write_text(json.dumps(r,indent=2));print(json.dumps({'status':r['lastStatus'],'containers':[{'name':c['name'],'exitCode':c.get('exitCode'),'reason':c.get('reason')} for c in r['containers']]}))
else:raise SystemExit('Use start/status')
