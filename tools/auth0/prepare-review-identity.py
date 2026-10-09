#!/usr/bin/env python3
"""Prepare one synthetic review login in the existing tenant; never send mail.

No production client is bound until the separate restricted Action is deployed
and read back. Reuse the existing database connection without changing its signup,
password or existing-client policy. The Action and API restrict review access.
Credentials go only to ignored owner-only storage, never command arguments.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
from urllib.parse import quote

ROOT=Path(__file__).resolve().parents[2]
TENANT='rillora-dev.eu.auth0.com'
NAME='Username-Password-Authentication'
ACTION='Rillora production review access'
CLIENTS=['EcevpyKt1GELKwkLnVU3aCbh3Ix2SJhz','POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4']
PRIVATE=ROOT/'.local-secrets/production-review/reviewer.json'

def api(method,path,body=None):
    result=subprocess.run(['auth0','api',method,path,'--tenant',TENANT,'--no-input'],
        input=json.dumps(body) if body is not None else None,capture_output=True,text=True,timeout=60)
    if result.returncode:
        status=re.search(r'\b(400|401|402|403|404|409|429)\b',result.stderr)
        raise RuntimeError(f'Auth0 {method} {path.split("?")[0]} failed ({status.group(1) if status else "provider/session error"}); body suppressed.')
    return json.loads(result.stdout) if result.stdout.strip() else {}

def store(data):
    PRIVATE.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    os.chmod(PRIVATE.parent,0o700)
    if PRIVATE.exists() and PRIVATE.stat().st_mode&0o077: raise RuntimeError('Protected review file permissions are too broad')
    with os.fdopen(os.open(PRIVATE,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600),'w') as f:json.dump(data,f)

def clients(connection):
    data=api('get',f'connections/{connection}/clients?take=100')
    if data.get('next'):raise RuntimeError('Incomplete connection bindings')
    return sorted(x['client_id'] for x in data.get('clients',[]))

def bindings():
    data=api('get','actions/triggers/post-login/bindings?per_page=100')
    if data.get('total',len(data.get('bindings',[])))!=len(data.get('bindings',[])):raise RuntimeError('Incomplete Action bindings')
    return data['bindings']

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    connections=api('get','connections?fields=id,name,strategy&include_fields=true&per_page=100')
    if len(connections)>=100:raise RuntimeError('Incomplete connection inventory')
    before={c['id']:clients(c['id']) for c in connections}
    for client,name in zip(CLIENTS,['Rillora Production Web','Rillora Production iOS']):
        current=api('get',f'clients/{client}?fields=client_id,name&include_fields=true')
        if current.get('name')!=name:raise RuntimeError('Wrong production client or tenant')
    matching=[c for c in connections if c['name']==NAME]
    if len(matching)>1:raise RuntimeError('Ambiguous review connection')
    print(json.dumps({'plan':'one synthetic reviewer, existing database connection, client-scoped expiring Action and API allowlist','applied':False,'sendsMail':False}))
    if not args.apply:return
    if not matching:raise RuntimeError('Expected existing database connection is missing; never create a substitute')
    connection=matching[0]
    connection_id=connection['id']
    actual=api('get',f'connections/{connection_id}?fields=id,name,strategy,options&include_fields=true')
    if actual.get('strategy')!='auth0':raise RuntimeError('Expected existing database connection')
    if PRIVATE.exists():
        if PRIVATE.stat().st_mode&0o077:raise RuntimeError('Protected file permissions')
        saved=json.loads(PRIVATE.read_text())
        if saved.get('connection')!=NAME:raise RuntimeError('Existing review credential has another purpose')
    else:
        saved={'connection':NAME,'email':'rillora-release-review-20260930@example.test',
            'password':secrets.token_urlsafe(36)+'!A1','expiresAt':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=7)).strftime('%Y-%m-%dT%H:%M:%SZ')}
        store(saved)
    users=api('get','users-by-email?email='+quote(saved['email']))
    found=[u for u in users if any(i.get('connection')==NAME for i in u.get('identities',[]))]
    if len(found)>1:raise RuntimeError('Ambiguous review identity')
    user=found[0] if found else api('post','users',{'connection':NAME,'email':saved['email'],
        'password':saved['password'],'email_verified':False,'verify_email':False,'name':'Rillora Synthetic Reviewer'})
    if user.get('email_verified') is not False:raise RuntimeError('Synthetic email must not claim verification')
    saved.update(subject=user['user_id'],connectionId=connection_id)
    saved['identityDigest']=hashlib.sha256(('https://login.rillora.xyz\x1f'+saved['subject']).encode()).hexdigest();store(saved)
    actions=api('get','actions/actions?per_page=100')
    if actions.get('total',len(actions['actions']))!=len(actions['actions']):raise RuntimeError('Incomplete Action list')
    original=next((a for a in actions['actions'] if a['name']=='Rillora hosted legal acceptance'),None)
    if not original:raise RuntimeError('Existing hosted legal Form must be retained')
    original=api('get',f"actions/actions/{original['id']}")
    form=re.search(r'const FORM_ID = "(ap_[A-Za-z0-9]+)";',original.get('deployed_version',{}).get('code',''))
    if not form:raise RuntimeError('Cannot identify the already deployed legal Form')
    form_zh=re.search(r'const FORM_ZH_ID = \"(ap_[A-Za-z0-9]+)\";',original.get('deployed_version',{}).get('code',''))
    if not form_zh:raise RuntimeError('Deploy the reviewed bilingual hosted forms first')
    code=(ROOT/'infra/auth0/hosted-consent/production-review-action.cjs').read_text().replace('__REVIEW_IDENTITY_DIGEST__',saved['identityDigest']).replace('__REVIEW_EXPIRES_AT__',saved['expiresAt']).replace('__RILLORA_FORM_ID__',form.group(1)).replace('__RILLORA_FORM_ZH_ID__',form_zh.group(1))
    target=[a for a in actions['actions'] if a['name']==ACTION]
    if len(target)>1:raise RuntimeError('Ambiguous review Action')
    prior=bindings()
    summary=lambda xs:[{'id':x['id'],'action_id':x['action']['id']} for x in xs]
    (args.output/'bindings-before.json').write_text(json.dumps(summary(prior),indent=2)+'\n')
    payload={'name':ACTION,'runtime':'node22','supported_triggers':[{'id':'post-login','version':'v3'}],'code':code}
    action=api('patch',f"actions/actions/{target[0]['id']}",payload) if target else api('post','actions/actions',payload)
    api('post',f"actions/actions/{action['id']}/deploy")
    deployed=api('get',f"actions/actions/{action['id']}")
    if deployed.get('deployed_version',{}).get('code')!=code:raise RuntimeError('Review Action deployment not verified; no client binding applied')
    if summary(bindings())!=summary(prior):raise RuntimeError('Action bindings changed concurrently')
    if action['id'] not in [x['action']['id'] for x in prior]:
        wanted=[{'ref':{'type':'binding_id','value':x['id']}} for x in prior]
        wanted.append({'ref':{'type':'action_id','value':action['id']},'display_name':ACTION})
        api('patch','actions/triggers/post-login/bindings',{'bindings':wanted})
    final=bindings()
    expected=[x['action']['id'] for x in prior]
    if action['id'] not in expected:expected.append(action['id'])
    if [x['action']['id'] for x in final]!=expected:raise RuntimeError('Action binding readback mismatch')
    api('patch',f'connections/{connection_id}/clients',[{'client_id':c,'status':True} for c in CLIENTS])
    if clients(connection_id)!=sorted(set(before[connection_id])|set(CLIENTS)):raise RuntimeError('Review connection readback mismatch')
    if api('get',f'connections/{connection_id}?fields=options&include_fields=true').get('options')!=actual.get('options'):
        raise RuntimeError('Existing database connection options changed')
    for c in connections:
        if c['id']!=connection_id and clients(c['id'])!=before[c['id']]:raise RuntimeError('An unrelated connection binding changed')
    report={'applied':True,'tenant':TENANT,'connectionId':connection_id,'productionClientIds':CLIENTS,
        'identityDigest':saved['identityDigest'],'expiresAt':saved['expiresAt'],'actionId':action['id'],
        'existingBindingsPreserved':True,'existingConnectionOptionsUnchanged':True,'syntheticEmailVerified':False,'sendsMail':False,
        'actualLoginVerified':False,'credentialPath':str(PRIVATE.relative_to(ROOT))}
    (args.output/'identity-prepared.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))

if __name__=='__main__':
    try:main()
    except (RuntimeError,subprocess.TimeoutExpired,json.JSONDecodeError) as e:raise SystemExit(str(e))
