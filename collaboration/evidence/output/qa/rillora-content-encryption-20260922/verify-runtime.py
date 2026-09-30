from pathlib import Path
import json,subprocess,datetime
q=Path(__file__).resolve().parent
def aws(profile,*args):
 r=subprocess.run(['aws','--profile',profile,'--region','eu-central-1',*args,'--output','json'],capture_output=True,text=True)
 if r.returncode:raise RuntimeError('Scoped read failed: '+args[0]+'/'+args[1])
 return json.loads(r.stdout)
s=aws('rillora-cdk-deploy','cloudformation','describe-stacks','--stack-name','RilloraStaging')['Stacks'][0]
assert s['StackStatus']=='UPDATE_COMPLETE'
o={v['OutputKey']:v['OutputValue'] for v in s['Outputs']}
assert o['ContentProtectionMode']=='encrypted' and o['ContentMigrationEnabled']=='false'
resources=aws('rillora-cdk-deploy','cloudformation','list-stack-resources','--stack-name','RilloraStaging')['StackResourceSummaries']
services=[r['PhysicalResourceId'] for r in resources if r['ResourceType']=='AWS::ECS::Service']
assert len(services)==1
service=aws('rillora-staging-operator','ecs','describe-services','--cluster',o['ClusterName'],'--services',services[0])['services'][0]
assert service['desiredCount']==service['runningCount']==1 and service['pendingCount']==0
assert len(service['deployments'])==1 and service['deployments'][0]['rolloutState']=='COMPLETED'
api=aws('rillora-staging-operator','ecs','describe-task-definition','--task-definition',service['taskDefinition'])['taskDefinition']
migration=aws('rillora-staging-operator','ecs','describe-task-definition','--task-definition',o['MigrationTaskDefinitionArn'])['taskDefinition']
apiEnvironment={v['name']:v['value'] for v in api['containerDefinitions'][0]['environment']}
assert apiEnvironment['CONTENT_PROTECTION_MODE']=='encrypted'
assert apiEnvironment['CONTENT_KMS_KEY_ARN']==o['PrivateContentKeyArn']
assert apiEnvironment['CONTENT_KEY_NAMESPACE']=='rillora-staging'
assert apiEnvironment['ALLOW_DEV_AUTH']=='false' and apiEnvironment['ALLOW_APPLE_SANDBOX_INTEGRATION']=='false'
assert not any(e['name'].startswith('CONTENT_') for c in migration['containerDefinitions'] for e in c.get('environment',[]))
key=aws('rillora-staging-operator','kms','describe-key','--key-id',o['PrivateContentKeyArn'])['KeyMetadata']
rotation=aws('rillora-staging-operator','kms','get-key-rotation-status','--key-id',o['PrivateContentKeyArn'])
assert key['KeyState']=='Enabled' and rotation['KeyRotationEnabled']
now=datetime.datetime.now(datetime.timezone.utc)
metrics={}
for metric in ['CPUUtilization','MemoryUtilization']:
 data=aws('rillora-staging-operator','cloudwatch','get-metric-statistics','--namespace','AWS/ECS','--metric-name',metric,
  '--dimensions',f"Name=ClusterName,Value={o['ClusterName']}",f"Name=ServiceName,Value={service['serviceName']}",
  '--start-time',(now-datetime.timedelta(minutes=35)).isoformat(),'--end-time',now.isoformat(),'--period','60','--statistics','Average','Maximum')
 metrics[metric]={'samples':len(data['Datapoints']),'maximumPercent':max((v['Maximum'] for v in data['Datapoints']),default=None)}
report={'checkedAt':now.isoformat(),'stackStatus':s['StackStatus'],'apiTaskDefinition':api['taskDefinitionArn'],
 'migrationTaskDefinition':migration['taskDefinitionArn'],'apiImage':api['containerDefinitions'][0]['image'],
 'running':service['runningCount'],'desired':service['desiredCount'],'rolloutState':service['deployments'][0]['rolloutState'],
 'cpu':api['cpu'],'memoryMiB':api['memory'],'databasePoolMax':apiEnvironment['DATABASE_POOL_MAX'],
 'contentMode':apiEnvironment['CONTENT_PROTECTION_MODE'],'migrationKeyConfigurationRemoved':True,'keyState':key['KeyState'],
 'rotationEnabled':rotation['KeyRotationEnabled'],'metricsLast35Minutes':metrics,'productionRelease':False}
(q/'final-runtime.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
