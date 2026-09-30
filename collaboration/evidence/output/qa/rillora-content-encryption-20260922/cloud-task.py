from pathlib import Path
import json, subprocess, sys, tempfile, gzip, base64
q=Path(__file__).resolve().parent

def aws(profile,*args):
 r=subprocess.run(['aws','--profile',profile,'--region','eu-central-1',*args,'--output','json'],capture_output=True,text=True)
 if r.returncode:raise RuntimeError('Scoped AWS operation failed: '+args[0]+'/'+args[1])
 return json.loads(r.stdout) if r.stdout.strip() else {}

mode,name=sys.argv[1:3]
if not name.replace('-','').isalnum():raise SystemExit('Invalid task label')
path=q/(name+'-task.json')
if mode=='start':
 if path.exists():raise SystemExit('Task already recorded; inspect it instead of starting a duplicate.')
 stack=aws('rillora-cdk-deploy','cloudformation','describe-stacks','--stack-name','RilloraStaging')['Stacks'][0]
 out={x['OutputKey']:x['OutputValue'] for x in stack['Outputs']}
 spec={'cluster':out['ClusterName'],'taskDefinition':out['MigrationTaskDefinitionArn'],'launchType':'FARGATE',
  'networkConfiguration':{'awsvpcConfiguration':{'subnets':out['PublicSubnetIds'].split(','),'securityGroups':[out['TaskSecurityGroupId']],'assignPublicIp':'ENABLED'}}}
 if len(sys.argv)>3:
  script=Path(sys.argv[3]).read_text()
  spec['overrides']={'containerOverrides':[{'name':'Migration','command':['node','--input-type=module','-e',script]}]}
  if len(json.dumps(spec['overrides']))>8000:
   if "from './" in script:raise RuntimeError('Large task scripts require absolute module paths')
   encoded=base64.b64encode(gzip.compress(script.encode())).decode()
   runner="const f=await import('node:fs'),z=await import('node:zlib');f.writeFileSync('/tmp/rillora-content-qa.mjs',z.gunzipSync(Buffer.from('"+encoded+"','base64')),{mode:0o600});await import('/tmp/rillora-content-qa.mjs');"
   spec['overrides']['containerOverrides'][0]['command']=['node','--input-type=module','-e',runner]
  if len(json.dumps(spec['overrides']))>8192:raise RuntimeError('Task override exceeds AWS limit')
 with tempfile.NamedTemporaryFile(mode='w',suffix='.json') as body:
  json.dump(spec,body);body.flush()
  result=aws('rillora-staging-operator','ecs','run-task','--cli-input-json','file://'+body.name)
 if result.get('failures') or len(result.get('tasks',[]))!=1:raise RuntimeError('Migration task was not started')
 task=result['tasks'][0];record={'cluster':out['ClusterName'],'taskArn':task['taskArn'],'taskDefinitionArn':task['taskDefinitionArn']}
 path.write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
elif mode=='status':
 spec=json.loads(path.read_text());snapshot=aws('rillora-staging-operator','ecs','describe-tasks','--cluster',spec['cluster'],'--tasks',spec['taskArn'])
 task=snapshot['tasks'][0] if snapshot.get('tasks') else {'taskArn':spec['taskArn'],'taskDefinitionArn':spec['taskDefinitionArn'],'lastStatus':'NOT_RETAINED_BY_ECS','containers':[]}
 result={key:task.get(key) for key in ['taskArn','taskDefinitionArn','lastStatus','stopCode','stoppedReason']}
 result['containers']=[{key:c.get(key) for key in ['name','lastStatus','exitCode','reason']} for c in task['containers']]
 (q/(name+'-status.json')).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
 if task['lastStatus'] in ['STOPPED','NOT_RETAINED_BY_ECS']:
  resources=aws('rillora-cdk-deploy','cloudformation','list-stack-resources','--stack-name','RilloraStaging')['StackResourceSummaries']
  groups=[r['PhysicalResourceId'] for r in resources if r['ResourceType']=='AWS::Logs::LogGroup' and r['LogicalResourceId'].startswith('MigrationLogGroup')]
  if len(groups)!=1:raise RuntimeError('Unexpected migration log group')
  stream='migration/Migration/'+spec['taskArn'].split('/')[-1]
  logs=aws('rillora-staging-operator','logs','get-log-events','--log-group-name',groups[0],'--log-stream-name',stream)
  messages=[e['message'] for e in logs.get('events',[])]
  (q/(name+'-logs.json')).write_text(json.dumps(messages,indent=2)+'\n');print(json.dumps(messages))
else:raise SystemExit('Use start or status')
