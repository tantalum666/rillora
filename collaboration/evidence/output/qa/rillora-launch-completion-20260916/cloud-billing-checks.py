from pathlib import Path
import json,subprocess,tempfile,sys,uuid
from urllib.parse import urlparse,parse_qs
q=Path(__file__).resolve().parent;root=q.parents[2]
p=root/'.local-secrets/launch-completion-20260916/commerce-fixtures.json'
state=json.loads(p.read_text());assert state['run']=='commercial-20260917'
base='https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com/v1'
def call(role,path,body=None,method=None,headers=None):
 actor=next(a for a in state['actors'] if a['role']==role)
 hdr={'authorization':'Bearer '+actor['token'],'x-rillora-client':'ios','content-type':'application/json',**(headers or {})}
 method=method or ('POST' if body is not None else 'GET')
 with tempfile.TemporaryDirectory(prefix='rillora-qa-http-') as tmp:
  out=Path(tmp)/'body';args=['curl','-sS','--max-time','35','--connect-timeout','10','-o',str(out),'-w','%{http_code}','-X',method,base+path]
  for k,v in hdr.items():args+=['-H',k+': '+v]
  if body is not None:args+=['--data-binary',json.dumps(body)]
  r=subprocess.run(args,text=True,capture_output=True)
  if r.returncode:raise RuntimeError('HTTPS transport failed; credentials omitted')
  code=int(r.stdout[-3:]);data=json.loads(out.read_text()) if out.read_text() else None
  if code>=400:raise RuntimeError(json.dumps({'path':path,'status':code,'error':data.get('error')}))
  return data
def save():p.write_text(json.dumps(state,indent=2));p.chmod(0o600)
def check(name,condition):
 if not condition:raise RuntimeError(name+' failed')
 state.setdefault('checks',[]).append(name)
def snapshot(role):
 result={'billing':call(role,'/commerce/test/status'),'commerce':call(role,'/commerce/status?serviceMarketCode=GLOBAL_US'),'sharing':call(role,'/sharing/access')}
 (q/('cloud-'+role+'-status.json')).write_text(json.dumps(result,indent=2))
 print(json.dumps({'role':role,'access':result['commerce']['currentAccess'],'sharing':result['sharing']['access'],'subscriptions':result['billing']['subscriptions'],'reconciliations':result['billing']['reconciliations'][:2]}))
 return result
mode=sys.argv[1];role=sys.argv[2] if len(sys.argv)>2 else 'annual'
if mode=='checkout':
 first=call(role,'/commerce/test/checkout',{'billingPeriod':role},headers={'idempotency-key':str(uuid.uuid4())})
 second=call(role,'/commerce/test/checkout',{'billingPeriod':role},headers={'idempotency-key':str(uuid.uuid4())})
 check(role+' duplicate checkout reused',first['checkout']['sessionId']==second['checkout']['sessionId'])
 state.setdefault('checkout',{})[role]=first;save();print(first['checkout']['url'])
elif mode=='portal':
 result=call(role,'/commerce/test/portal',{});state.setdefault('portal',{})[role]=result;save();print(result['portal']['url'])
elif mode=='status':snapshot(role)
elif mode=='prepare-sharing':
 if state.get('sharing'):raise SystemExit('Sharing fixture already prepared')
 matter=call(role,'/matters',{'category':'document','title':'Paid-period cloud QA','locationHint':'Original synthetic folder','notes':'Original permitted test note','requestId':str(uuid.uuid4())})['matter']
 contact=call(role,'/trusted-contacts',{'displayName':'Included synthetic person'})['trustedContact']
 result=call(role,'/sharing/connections',{'personPublicId':contact['publicId'],'email':'included-commercial-20260917@example.test','grants':[{'matterPublicId':matter['publicId'],'detailLevel':'name'}]})
 state['sharing']={'owner':role,'matter':matter,'included':result['connection']};save()
 s=call(role,'/sharing/access')['access'];check('Free one slot reserved',s['limit']==1 and s['used']==1);save();print('Free fixture prepared')
elif mode=='paid-sharing':
 info=state['sharing'];role=info['owner'];matter=info['matter'];s=call(role,'/sharing/access')['access'];check('Paid family five slots',s['limit']==5)
 if info.get('reader'):raise SystemExit('Paid reader already prepared')
 person=call(role,'/trusted-contacts',{'displayName':'Paid synthetic reader'})['trustedContact']
 result=call(role,'/sharing/connections',{'personPublicId':person['publicId'],'email':'reader-commercial-20260917@example.test','grants':[{'matterPublicId':matter['publicId'],'detailLevel':'details'}]})
 token=parse_qs(urlparse(result['invitationUrl']).fragment)['invitation'][0]
 call('reader','/sharing/invitations/accept',{'invitationToken':token,'accepted':True})
 info['reader']=result['connection'];save()
 shared=call('reader','/sharing/shared-with-me');check('Paid reader sees original',any(i['fields'].get('notes')=='Original permitted test note' for i in shared['items']));save();print('Paid sharing accepted through synthetic session')
elif mode=='free-guards':
 info=state['sharing'];role=info['owner'];person=call(role,'/trusted-contacts',{'displayName':'Unreserved synthetic contact'})['trustedContact']
 check('Free still permits contact records',bool(person['publicId']))
 try:
  call(role,'/sharing/connections',{'personPublicId':person['publicId'],'email':'extra-commercial-20260917@example.test','grants':[]})
  raise AssertionError('Second Free reservation unexpectedly allowed')
 except RuntimeError as failure:check('Second Free reservation rejected', 'sharing_limit_reached' in str(failure))
 check('Incoming reading remains available',isinstance(call('reader','/sharing/shared-with-me')['items'],list))
 check('Purchase failure did not grant Family',call(role,'/commerce/status?serviceMarketCode=GLOBAL_US')['currentAccess']['planCode']=='free')
 save();print('Cloud Free reservation and failure guards passed')
elif mode=='after-end':
 info=state['sharing'];role=info['owner'];m=call(role,'/matters/'+info['matter']['publicId'])['matter']
 call(role,'/matters/'+m['publicId'],{'expectedVersion':m['version'],'title':'Edited after subscription ended','locationHint':'New post-end locator','notes':'NEW POST-END NOTE'},method='PATCH')
 s=call('reader','/sharing/shared-with-me');items=[i for i in s['items'] if i['fields'].get('title')=='Paid-period cloud QA']
 check('Ended-period reader only receives saved copy',len(items)==1 and items[0]['accessMode']=='saved')
 check('Post-end values absent from reader', 'NEW POST-END NOTE' not in json.dumps(s) and 'New post-end locator' not in json.dumps(s))
 (q/'cloud-saved-copy-check.json').write_text(json.dumps({'items':items,'noPostEndValues':True},indent=2));save();print('Saved cutoff projection passed')
elif mode=='cancel-checkout':
 call(role,'/commerce/test/checkout/cancel',{});check(role+' pending checkout canceled',True);save();print('Unfinished test checkout canceled')
elif mode=='saved-privacy':
 info=state['sharing'];role=info['owner'];connection=info['reader']['publicId']
 def current():return next(x for x in call(role,'/sharing/connections')['connections'] if x['publicId']==connection)
 access=call(role,'/sharing/access')['access'];c=current()
 call(role,'/sharing/connections/'+connection+'/live',{'expectedVersion':c['version'],'expectedAccessVersion':access['version'],'useFreeSlot':True})
 shared=call('reader','/sharing/shared-with-me');check('Explicit Free choice resumes current fields',any(i['fields'].get('notes')=='NEW POST-END NOTE' for i in shared['items']))
 access=call(role,'/sharing/access')['access'];c=current()
 call(role,'/sharing/connections/'+connection+'/pause',{'expectedVersion':c['version'],'expectedAccessVersion':access['version']})
 for level in ['name','details']:
  c=current();call(role,'/sharing/connections/'+connection,{'expectedVersion':c['version'],'grants':[{'matterPublicId':info['matter']['publicId'],'detailLevel':level}]},method='PATCH')
  shared=call('reader','/sharing/shared-with-me');check('Saved copy stays redacted after '+level,all('notes' not in i['fields'] and 'locationHint' not in i['fields'] for i in shared['items']))
 c=current();call(role,'/sharing/connections/'+connection,method='DELETE',headers={'if-match':str(c['version'])})
 check('Revocation removes recipient items',call('reader','/sharing/shared-with-me')['items']==[])
 save();print('Explicit resume, permanent saved redaction and revoke passed')
else:raise SystemExit('Unknown operation')
