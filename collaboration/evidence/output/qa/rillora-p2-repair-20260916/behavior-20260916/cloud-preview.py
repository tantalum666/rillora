from pathlib import Path
import json,subprocess,secrets,hashlib,uuid,sys,datetime,urllib.request,urllib.error
root=Path(__file__).resolve().parents[4];q=Path(__file__).resolve().parent
private=root/'.local-secrets/staging-acceptance/p2-preview-20260916.json';private.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
issuer='https://synthetic-qa.rillora.invalid/'
def aws(*args):return json.loads(subprocess.check_output(['aws',*args,'--region','eu-central-1','--output','json'],text=True))
def run_task(code,label):
 validation=subprocess.run(['node','--input-type=module','--check'],input=code,text=True,capture_output=True)
 if validation.returncode:raise RuntimeError('Fixture JavaScript failed local syntax validation; no cloud task started')
 stack=aws('cloudformation','describe-stacks','--stack-name','RilloraStaging','--profile','rillora-cdk-deploy')['Stacks'][0]
 if stack['StackStatus']!='UPDATE_COMPLETE':raise RuntimeError('Wait for completed deployment')
 outputs={x['OutputKey']:x['OutputValue'] for x in stack['Outputs']}
 network={'awsvpcConfiguration':{'subnets':outputs['PublicSubnetIds'].split(','),'securityGroups':[outputs['TaskSecurityGroupId']],'assignPublicIp':'ENABLED'}}
 override={'containerOverrides':[{'name':'Migration','command':['node','--input-type=module','-e',code]}]}
 response=aws('ecs','run-task','--cluster',outputs['ClusterName'],'--task-definition',outputs['MigrationTaskDefinitionArn'],'--launch-type','FARGATE','--network-configuration',json.dumps(network),'--overrides',json.dumps(override),'--profile','rillora-staging-operator')
 if response.get('failures'):raise RuntimeError('Fixture task did not start')
 task=response['tasks'][0];state={'cluster':outputs['ClusterName'],'taskArn':task['taskArn'],'outputs':outputs}
 (q/('cloud-'+label+'-task.json')).write_text(json.dumps(state,indent=2)+'\n');print(label+' task started')
base="import pg from 'pg';import {loadDatabaseConfig} from './dist/config.js';import {databaseConnectionOptions} from './dist/db.js';import {currentLegalContract as l} from './dist/legal-contract.js';const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));await c.connect();await c.query('begin');"
mode=sys.argv[1]
if mode=='seed':
 if private.exists() and (q/'cloud-seed-task.json').exists():raise RuntimeError('Existing fixture task; inspect it instead of creating duplicates')
 actors=json.loads(private.read_text())['actors'] if private.exists() else [{'role':role,'subject':'p2-preview-20260916-'+str(uuid.uuid4()),'token':secrets.token_urlsafe(32),'csrf':secrets.token_urlsafe(32)} for role in ['A','B']]
 private.write_text(json.dumps({'run':'p2-preview-20260916','issuer':issuer,'actors':actors},indent=2));private.chmod(0o600)
 values=[{'role':a['role'],'subject':a['subject'],'tokenHash':hashlib.sha256(a['token'].encode()).hexdigest(),'csrfHash':hashlib.sha256(a['csrf'].encode()).hexdigest(),'identityHash':hashlib.sha256((issuer+'\x1f'+a['subject']).encode()).hexdigest()} for a in actors]
 code=base+"const out=[];for(const f of "+json.dumps(values)+"){const i=(await c.query('select * from app.provision_oidc_planner($1,$2,$3,$4,$5)',["+json.dumps(issuer)+",f.subject,'Synthetic P2 preview '+f.role,'en','UTC'])).rows[0];const a=(await c.query(\"insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'ios',$7) returning id\",[i.planner_id,i.identity_account_id,l.termsVersion,l.privacyVersion,l.consentTextVersion,Buffer.from(l.bundleSha256,'hex'),Buffer.from(f.identityHash,'hex')])).rows[0];await c.query(\"insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,credential_kind,authentication_methods,authenticated_at,expires_at,last_seen_at) values($1,$2,$3,$4,$5,'native_bearer',array['synthetic_qa'],now(),now()+interval '20 minutes',now())\",[i.planner_id,i.identity_account_id,a.id,Buffer.from(f.tokenHash,'hex'),Buffer.from(f.csrfHash,'hex')]);out.push({role:f.role,plannerPublicId:i.planner_public_id});}await c.query('commit');console.log(JSON.stringify({purpose:'Admin-seeded synthetic sessions, not provider login or a consent ceremony',actors:out}));await c.end();"
 run_task(code,'seed')
elif mode=='refresh':
 state=json.loads(private.read_text());assert state['run']=='p2-preview-20260916' and state['issuer']==issuer
 values=[{'subject':a['subject'],'hash':hashlib.sha256(a['token'].encode()).hexdigest()} for a in state['actors']]
 code=base+"let refreshed=0;for(const f of "+json.dumps(values)+"){const r=await c.query(\"update app.auth_sessions s set expires_at=now()+interval '20 minutes' from app.identity_accounts i where i.id=s.identity_account_id and i.issuer=$1 and i.subject=$2 and s.token_hash=$3 and s.revoked_at is null\",["+json.dumps(issuer)+",f.subject,Buffer.from(f.hash,'hex')]);refreshed+=r.rowCount;}if(refreshed!==2)throw Error('Expected exactly two synthetic sessions');await c.query('commit');console.log(JSON.stringify({refreshedSyntheticSessions:refreshed}));await c.end();"
 run_task(code,'refresh')
elif mode=='status':
 label=sys.argv[2];state=json.loads((q/('cloud-'+label+'-task.json')).read_text());data=aws('ecs','describe-tasks','--cluster',state['cluster'],'--tasks',state['taskArn'],'--profile','rillora-staging-operator');task=data['tasks'][0]
 (q/('cloud-'+label+'-status.json')).write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({'status':task['lastStatus'],'containers':[{'name':c['name'],'exitCode':c.get('exitCode'),'reason':c.get('reason')} for c in task['containers']]}))
elif mode=='check':
 state=json.loads(private.read_text());assert state['issuer']==issuer
 endpoint='https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com/v1'
 def call(path,actor=None,body=None):
  headers={'content-type':'application/json','x-rillora-client':'ios'}
  if actor:headers['authorization']='Bearer '+actor['token']
  from curl_transport import request_url
  status,response_headers,content=request_url(endpoint+path,'POST' if body is not None else 'GET',body,headers)
  return status,json.loads(content)

 a,b=state['actors'];result=[]
 def checked(name,condition):
  if not condition:raise RuntimeError(name+' failed')
  result.append(name)
 checked('anonymous preview denied',call('/sharing/preview',body={'grants':[]})[0]==401)
 made=[]
 for actor in [a,b]:
  status,data=call('/matters',actor,{'title':'Synthetic scope fixture '+actor['role'],'category':'document','locationHint':'Synthetic QA drawer','notes':'Synthetic QA notes','requestId':str(uuid.uuid4())})
  checked('create isolated '+actor['role'],status==201);made.append(data['matter'])
 for level,fields in [('name',{'title','category'}),('directions',{'title','category','locationHint','desiredOutcome'}),('details',None)]:
  status,data=call('/sharing/preview',a,{'grants':[{'matterPublicId':made[0]['publicId'],'detailLevel':level}]})
  checked(level+' server preview',status==200 and data['preview'] is True and data['readOnly'] is True and len(data['items'])==1)
  content=data['items'][0]['fields']
  if fields is not None:checked(level+' exact fields',set(content)==fields)
  else:checked('details contains chosen notes',content.get('notes')=='Synthetic QA notes')
 checked('other-owner record denied',call('/sharing/preview',a,{'grants':[{'matterPublicId':made[1]['publicId'],'detailLevel':'details'}]})[0]==400)
 status,current=call('/matters/'+made[0]['publicId'],a);checked('preview did not mutate matter',status==200 and current['matter']['version']==made[0]['version'])
 checked('preview did not create a sharing connection',call('/sharing/connections',a)[1]['connections']==[])
 (q/'cloud-preview-result.json').write_text(json.dumps({'passed':result,'count':len(result),'scope':'Authenticated admin-seeded synthetic staging sessions; no provider login/consent ceremony.'},indent=2)+'\n');print(str(len(result))+' cloud preview checks passed')
elif mode=='cleanup':
 state=json.loads(private.read_text());assert state['issuer']==issuer and state['run']=='p2-preview-20260916'
 subjects=[a['subject'] for a in state['actors']];assert all(x.startswith('p2-preview-20260916-') for x in subjects)
 code=base+"const ids=(await c.query('select planner_id from app.identity_accounts where issuer=$1 and subject=any($2::text[])',["+json.dumps(issuer)+","+json.dumps(subjects)+"])).rows;for(const item of ids)await c.query('delete from app.planners where id=$1',[item.planner_id]);const remaining=(await c.query('select count(*)::int as count from app.identity_accounts where issuer=$1 and subject=any($2::text[])',["+json.dumps(issuer)+","+json.dumps(subjects)+"])).rows[0].count;if(remaining!==0)throw Error('Synthetic cleanup incomplete');await c.query('commit');console.log(JSON.stringify({removedSyntheticPlanners:ids.length,remainingSyntheticIdentities:remaining,retainedMinimizedSyntheticLegalEvidence:true}));await c.end();"
 run_task(code,'cleanup')
else:raise RuntimeError('Unknown mode')
