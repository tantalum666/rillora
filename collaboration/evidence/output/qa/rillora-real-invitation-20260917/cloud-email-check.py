from pathlib import Path
import hashlib,json,os,secrets,subprocess,sys,tempfile,uuid
q=Path(__file__).resolve().parent;root=q.parents[2]
private=root/'.local-secrets/email-verification/cloud-fixtures.json'
domain='rillora-dev.eu.auth0.com';base='https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com/v1'

def auth0(method,path,body=None):
 args=['auth0','api',method,path,'--tenant',domain,'--no-input']
 if method=='delete':args+=['--force']
 r=subprocess.run(args,input=None if body is None else json.dumps(body),text=True,capture_output=True)
 if r.returncode:raise RuntimeError('Auth0 fixture operation failed; response suppressed')
 return json.loads(r.stdout) if r.stdout.strip() else None

def save(state):
 fd=os.open(private,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
 with os.fdopen(fd,'w') as out:json.dump(state,out,indent=2)

def call(state,role,path,body=None,method=None,expected=200,extraHeaders=None):
 actor=next(a for a in state['actors'] if a['role']==role)
 with tempfile.TemporaryDirectory(prefix='rillora-email-qa-') as tmp:
  config=Path(tmp)/'curl.conf';output=Path(tmp)/'response.json'
  settings={'url':base+path,'request':method or ('POST' if body is not None else 'GET'),'output':str(output),'write-out':'%{http_code}'}
  lines=[k+' = '+json.dumps(v) for k,v in settings.items()]
  lines+=['header = '+json.dumps('authorization: Bearer '+actor['token']),'header = "x-rillora-client: ios"','header = "content-type: application/json"','silent','show-error','max-time = 30','connect-timeout = 10']
  lines+=['header = '+json.dumps(k+': '+v) for k,v in (extraHeaders or {}).items()]
  if body is not None:lines+=['data-binary = '+json.dumps(json.dumps(body))]
  config.write_text('\n'.join(lines));config.chmod(0o600)
  result=subprocess.run(['curl','--config',str(config)],text=True,capture_output=True)
  if result.returncode:raise RuntimeError('Fixture HTTPS call failed; credentials suppressed')
  status=int(result.stdout);payload=json.loads(output.read_text())
  if status!=expected:raise RuntimeError(json.dumps({'path':path,'status':status,'expected':expected,'code':payload.get('error',{}).get('code')}))
  return payload

mode=sys.argv[1]
if mode=='prepare':
 if private.exists():raise SystemExit('Fixture already exists; inspect before creating another')
 run=str(uuid.uuid4());email='rillora-email-qa-'+run+'@example.invalid'
 user=auth0('post','users',{'connection':'Username-Password-Authentication','email':email,'password':'A7!'+secrets.token_urlsafe(24),'verify_email':False,'email_verified':False,'name':'Disposable Rillora email QA','app_metadata':{'rillora_qa_run':run}})
 state={'run':run,'providerUserId':user['user_id'],'email':email,'actors':[]}
 for role,issuer,subject in [('owner','https://synthetic-qa.rillora.invalid/','email-proof-'+run),('recipient','https://login.rillora.xyz',user['user_id'])]:
  state['actors'].append({'role':role,'issuer':issuer,'subject':subject,'token':secrets.token_urlsafe(32),'csrf':secrets.token_urlsafe(32)})
 save(state)
 fixtures=[{'role':a['role'],'issuer':a['issuer'],'subject':a['subject'],'tokenHash':hashlib.sha256(a['token'].encode()).hexdigest(),'csrfHash':hashlib.sha256(a['csrf'].encode()).hexdigest(),'identityHash':hashlib.sha256((a['issuer']+'\x1f'+a['subject']).encode()).hexdigest()} for a in state['actors']]
 script="""import pg from 'pg';import {loadDatabaseConfig} from './dist/config.js';import {databaseConnectionOptions} from './dist/db.js';import {currentLegalContract as l} from './dist/legal-contract.js';import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';
const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));await c.connect();await c.query('begin');
const migration='0060_session_email_verification.sql';const checksum=createHash('sha256').update(readFileSync('migrations/'+migration)).digest('hex');if((await c.query('select checksum from app.schema_migrations where name=$1',[migration])).rows[0]?.checksum!==checksum)throw Error('Migration checksum mismatch');
const out=[];for(const f of FIXTURES){const i=(await c.query('select * from app.provision_oidc_planner($1,$2,$3,$4,$5)',[f.issuer,f.subject,'Synthetic email QA '+f.role,'en','UTC'])).rows[0];const a=(await c.query("insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256) values($1,$2,$3,$4,$5,$6,true,true,true,'ios',$7) returning id",[i.planner_id,i.identity_account_id,l.termsVersion,l.privacyVersion,l.consentTextVersion,Buffer.from(l.bundleSha256,'hex'),Buffer.from(f.identityHash,'hex')])).rows[0];await c.query("insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,credential_kind,authentication_methods,authenticated_at,expires_at,last_seen_at) values($1,$2,$3,$4,$5,'native_bearer',array['synthetic_qa'],now(),now()+interval '1 hour',now())",[i.planner_id,i.identity_account_id,a.id,Buffer.from(f.tokenHash,'hex'),Buffer.from(f.csrfHash,'hex')]);out.push({role:f.role,plannerPublicId:i.planner_public_id});}
await c.query('commit');console.log(JSON.stringify({purpose:'Admin-seeded disposable sessions; not a provider login or consent ceremony',migrationChecksumMatches:true,actors:out}));await c.end();""".replace('FIXTURES',json.dumps(fixtures))
 (q/'email-seed.mjs').write_text(script)
 print('Disposable Auth0 profile prepared without requesting a verification email; hashed cloud seed ready.')
elif mode=='check':
 state=json.loads(private.read_text());checks=[]
 result=call(state,'recipient','/sharing/email-verification',{})
 if result['verified'] is not False:raise RuntimeError('Unverified profile was accepted')
 checks.append('provider false stays unverified')
 matter=call(state,'owner','/matters',{'category':'document','title':'Disposable email continuation QA','locationHint':'Synthetic test folder','notes':'Synthetic permitted note','requestId':str(uuid.uuid4())},expected=201)['matter']
 contact=call(state,'owner','/trusted-contacts',{'displayName':'Disposable verification reader'},expected=201)['trustedContact']
 invite=call(state,'owner','/sharing/connections',{'personPublicId':contact['publicId'],'email':state['email'],'grants':[{'matterPublicId':matter['publicId'],'detailLevel':'details'}]},expected=201)
 from urllib.parse import urlparse,parse_qs,quote
 invitationToken=parse_qs(urlparse(invite['invitationUrl']).fragment)['invitation'][0]
 response=call(state,'recipient','/sharing/invitations/accept',{'invitationToken':invitationToken,'accepted':True},expected=403)
 if response['error']['code']!='verified_email_required':raise RuntimeError('Wrong unverified denial')
 checks.append('unverified targeted acceptance denied')
 profile=auth0('get','users/'+quote(state['providerUserId'],safe='')+'?fields=user_id,app_metadata&include_fields=true')
 if profile.get('app_metadata',{}).get('rillora_qa_run')!=state['run']:raise RuntimeError('Not the disposable fixture')
 auth0('patch','users/'+quote(state['providerUserId'],safe=''),{'email_verified':True})
 accepted=call(state,'recipient','/sharing/invitations/accept',{'invitationToken':invitationToken,'accepted':True})
 if accepted['connection']['publicId']!=invite['connection']['publicId']:raise RuntimeError('Wrong accepted connection')
 checks.append('same bearer accepts after current provider proof changes')
 if call(state,'recipient','/sharing/email-verification',{})['verified'] is not True:raise RuntimeError('Proof was not retained')
 data=call(state,'recipient','/sharing/shared-with-me')
 if len(data['items'])!=1 or data['items'][0]['fields'].get('notes')!='Synthetic permitted note':raise RuntimeError('Wrong allowed projection')
 checks.append('permitted read-only projection available')
 current=next(c for c in call(state,'owner','/sharing/connections')['connections'] if c['publicId']==invite['connection']['publicId'])
 call(state,'owner','/sharing/connections/'+current['publicId'],method='DELETE',extraHeaders={'if-match':str(current['version'])})
 if call(state,'recipient','/sharing/shared-with-me')['items']:raise RuntimeError('Revoked fields remained readable')
 old=call(state,'recipient','/sharing/invitations/accept',{'invitationToken':invitationToken,'accepted':True},expected=403)
 if old['error']['code']!='invitation_unavailable':raise RuntimeError('Old capability was not rejected')
 checks.append('revocation removes reads and the same old capability cannot reaccept')
 state['checks']=checks;save(state)
 (q/'cloud-email-checks.json').write_text(json.dumps({'syntheticSessions':True,'actualAuth0ManagementRead':True,'providerFlagChangedOnlyByTestAdministrator':True,'emailDeliveryTested':False,'sameOpaqueTokenUsed':True,'checks':checks},indent=2)+'\n')
 print(json.dumps({'checks':checks,'providerAndCloudAPI':True,'realSignupCeremony':False}))
elif mode=='cleanup-script':
 state=json.loads(private.read_text());fixtures=[{k:a[k] for k in ['issuer','subject']} for a in state['actors']]
 script="""import pg from 'pg';import {loadDatabaseConfig} from './dist/config.js';import {databaseConnectionOptions} from './dist/db.js';const c=new pg.Client(databaseConnectionOptions(loadDatabaseConfig()));await c.connect();await c.query('begin');const results=[];for(const f of FIXTURES){const rows=(await c.query('select i.planner_id,p.display_name from app.identity_accounts i join app.planners p on p.id=i.planner_id where i.issuer=$1 and i.subject=$2',[f.issuer,f.subject])).rows;if(rows.length>1||rows.some(r=>!r.display_name.startsWith('Synthetic email QA ')))throw Error('Not a disposable fixture');let sessionCount=0,receiptCount=0;if(rows.length){sessionCount=(await c.query('select count(*)::int as count from app.auth_sessions where planner_id=$1',[rows[0].planner_id])).rows[0].count;receiptCount=(await c.query('select count(*)::int as count from app.legal_acceptances where planner_id=$1',[rows[0].planner_id])).rows[0].count;if(sessionCount!==1||receiptCount!==1)throw Error('Unexpected new session or consent receipt');await c.query('delete from app.planners where id=$1',[rows[0].planner_id]);}const left=(await c.query('select count(*)::int as count from app.identity_accounts where issuer=$1 and subject=$2',[f.issuer,f.subject])).rows[0].count;results.push({remaining:left,sessionCount,receiptCount});}await c.query('commit');console.log(JSON.stringify({disposableCloudCleanup:results}));await c.end();""".replace('FIXTURES',json.dumps(fixtures))
 (q/'email-cleanup.mjs').write_text(script);print('Exact-fixture cleanup script ready.')
elif mode=='finish-cleanup':
 from urllib.parse import quote
 state=json.loads(private.read_text())
 for role in ['owner','recipient']:call(state,role,'/sharing/shared-with-me',expected=401)
 profile=auth0('get','users/'+quote(state['providerUserId'],safe='')+'?fields=user_id,app_metadata&include_fields=true')
 if profile.get('app_metadata',{}).get('rillora_qa_run')!=state['run']:raise RuntimeError('Refusing unrelated identity deletion')
 auth0('delete','users/'+quote(state['providerUserId'],safe=''))
 remaining=auth0('get','users-by-email?email='+quote(state['email'],safe='')+'&fields=user_id&include_fields=true')
 if any(p['user_id']==state['providerUserId'] for p in remaining):raise RuntimeError('Temporary provider identity remains')
 private.unlink()
 result={'oldFixtureTokensDenied':True,'temporaryAuth0IdentityAbsent':True,'protectedFixtureTokensRemoved':True,'realAAndBAccountsUntouched':True}
 (q/'cleanup-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
else:raise SystemExit('Unknown mode')
