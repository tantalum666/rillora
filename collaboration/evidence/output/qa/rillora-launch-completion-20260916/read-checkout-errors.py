import json,subprocess,pathlib
q=pathlib.Path(__file__).resolve().parent;root=q.parents[2]
def aws(*a):return json.loads(subprocess.check_output(['aws',*a,'--region','eu-central-1','--output','json'],text=True))
t=json.loads((root/'infra/aws/cdk.out/RilloraStaging.template.json').read_text());logical=next(k for k,v in t['Resources'].items() if k.startswith('ApiLogGroup') and v['Type']=='AWS::Logs::LogGroup')
g=aws('cloudformation','describe-stack-resource','--stack-name','RilloraStaging','--logical-resource-id',logical,'--profile','rillora-cdk-deploy')['StackResourceDetail']['PhysicalResourceId']
r=aws('logs','get-log-events','--log-group-name',g,'--log-stream-name','api/Api/ff1a480dbae64d078cf916c7eaacb3e1','--limit','100','--profile','rillora-staging-operator')
errors=[]
for e in r['events']:
 try:
  d=json.loads(e['message'])
  if d.get('level',0)>=50:
   err=d.get('err',{});errors.append({k:err.get(k) for k in ['type','code','message','statusCode']})
 except (ValueError,TypeError):pass
(q/'checkout-cloud-errors.json').write_text(json.dumps(errors,indent=2));print(json.dumps(errors[-3:]))
