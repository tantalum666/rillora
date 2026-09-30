from pathlib import Path
import json,subprocess,sys
q=Path(__file__).resolve().parent
mode=sys.argv[1]
name='rillora-content-encryption-before-20260923'
def aws(profile,*args):
 r=subprocess.run(['aws','--profile',profile,'--region','eu-central-1',*args,'--output','json'],capture_output=True,text=True)
 if r.returncode:raise RuntimeError(r.stderr[-1500:])
 return json.loads(r.stdout)
if mode=='create':
 resources=aws('rillora-cdk-deploy','cloudformation','list-stack-resources','--stack-name','RilloraStaging')['StackResourceSummaries']
 target=[r['PhysicalResourceId'] for r in resources if r['ResourceType']=='AWS::RDS::DBInstance']
 if len(target)!=1:raise RuntimeError('Database target ambiguous')
 snapshot=aws('rillora-staging-operator','rds','create-db-snapshot','--db-instance-identifier',target[0],'--db-snapshot-identifier',name)['DBSnapshot']
elif mode=='status':
 snapshot=aws('rillora-staging-operator','rds','describe-db-snapshots','--db-snapshot-identifier',name)['DBSnapshots'][0]
else:raise SystemExit('Use create or status')
result={k:snapshot.get(k) for k in ['DBSnapshotIdentifier','DBInstanceIdentifier','Status','Encrypted','SnapshotCreateTime','StorageType']}
if not result['Encrypted']:raise RuntimeError('Unencrypted backup is not acceptable')
(q/('before-content-snapshot-'+mode+'.json')).write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
