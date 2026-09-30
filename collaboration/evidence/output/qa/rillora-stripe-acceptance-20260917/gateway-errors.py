from pathlib import Path
import json,subprocess,time
q=Path(__file__).resolve().parent;root=q.parents[2]
def aws(*args):return json.loads(subprocess.check_output(['aws',*args,'--region','eu-central-1','--output','json'],text=True))
s=aws('cloudformation','describe-stacks','--stack-name','RilloraStaging','--profile','rillora-cdk-deploy')['Stacks'][0]
if s['StackStatus']!='UPDATE_COMPLETE':raise SystemExit('Wait for diagnostics policy update to complete')
t=json.loads((root/'infra/aws/cdk.out/RilloraStaging.template.json').read_text());logical=next(k for k,v in t['Resources'].items() if k.startswith('HttpApiAccessLogs') and v['Type']=='AWS::Logs::LogGroup')
group=aws('cloudformation','describe-stack-resource','--stack-name','RilloraStaging','--logical-resource-id',logical,'--profile','rillora-cdk-deploy')['StackResourceDetail']['PhysicalResourceId']
r=aws('logs','filter-log-events','--log-group-name',group,'--start-time',str(int((time.time()-7200)*1000)),'--filter-pattern','{ $.status = "500" }','--limit','100','--profile','rillora-staging-operator')
errors=[]
for e in r['events']:
 d=json.loads(e['message'])
 if 'commerce/stripe/webhook' in d.get('path',''):errors.append({'timestamp':e['timestamp'],**d})
(q/'gateway-refund-errors.json').write_text(json.dumps({'total500':len(r['events']),'webhook500':errors},indent=2));print(json.dumps({'total500':len(r['events']),'webhook500':errors}))
