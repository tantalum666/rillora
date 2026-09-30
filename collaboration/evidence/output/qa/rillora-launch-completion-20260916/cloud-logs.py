from pathlib import Path
import subprocess,json,sys
q=Path(__file__).resolve().parent;root=q.parents[2];label=sys.argv[1]
def aws(*args):return json.loads(subprocess.check_output(['aws',*args,'--region','eu-central-1','--output','json'],text=True))
state=json.loads((q/(label+'-task.json')).read_text())
template=json.loads((root/'infra/aws/cdk.out/RilloraStaging.template.json').read_text())
logical=next(k for k,v in template['Resources'].items() if k.startswith('MigrationLogGroup') and v['Type']=='AWS::Logs::LogGroup')
name=aws('cloudformation','describe-stack-resource','--stack-name','RilloraStaging','--logical-resource-id',logical,'--profile','rillora-cdk-deploy')['StackResourceDetail']['PhysicalResourceId']
stream='migration/Migration/'+state['taskArn'].rsplit('/',1)[-1]
data=aws('logs','get-log-events','--log-group-name',name,'--log-stream-name',stream,'--start-from-head','--profile','rillora-staging-operator')
messages=[x['message'] for x in data['events']]
(q/(label+'-logs.json')).write_text(json.dumps(messages,indent=2)+'\n')
print('\n'.join(messages))
