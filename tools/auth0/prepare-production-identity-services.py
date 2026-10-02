#!/usr/bin/env python3
"""Create separate, least-scope production service clients; preserve staging clients.

Credentials are written directly to ignored0700/0600storage. No user mail, login,
deletion, old-grant retirement or interactive-client connection change occurs.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[2]
DOMAIN='rillora-dev.eu.auth0.com'
DIRECTORY=ROOT/'.local-secrets/production-identity-services'
SERVICES=[('deletion','Rillora production account deletion','delete:users'),
          ('verification','Rillora production current-session email verification','read:users')]

def api(method,path,body=None):
    result=subprocess.run(['auth0','api',method,path,'--tenant',DOMAIN,'--no-input'],
        input=None if body is None else json.dumps(body),text=True,capture_output=True,timeout=60)
    if result.returncode:raise RuntimeError('Auth0 service preparation failed; credential/provider body suppressed. Check actual CLI permission/session result.')
    return json.loads(result.stdout) if result.stdout.strip() else {}

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    clients=api('get','clients?fields=client_id,name,app_type&include_fields=true&per_page=100')
    if not isinstance(clients,list) or len(clients)>=100:raise RuntimeError('Incomplete client inventory; stop before creating service identities')
    DIRECTORY.mkdir(parents=True,exist_ok=True,mode=0o700);os.chmod(DIRECTORY,0o700)
    report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'services':[],
            'oldClientsChanged':False,'userDataChanged':False,'secretPrinted':False}
    for key,name,scope in SERVICES:
        target=DIRECTORY/(key+'.json');matches=[x for x in clients if x['name']==name]
        if len(matches)>1:raise RuntimeError('Duplicate production service name; stop instead of guessing')
        if matches:
            if not target.exists() or target.stat().st_mode&0o077:raise RuntimeError('Existing client requires its protected credential; do not rotate or recreate')
            client=json.loads(target.read_text())
            if client['client_id']!=matches[0]['client_id'] or client['domain']!=DOMAIN:raise RuntimeError('Protected client mismatch')
        else:
            if target.exists():raise RuntimeError('Protected credential exists without matching remote client')
            value=api('post','clients',{'name':name,'app_type':'non_interactive','grant_types':['client_credentials'],
                'token_endpoint_auth_method':'client_secret_post','description':'Production Rillora only. Exact server-owned session/deletion job identity. Independent of Preview credentials.'})
            client={'client_id':value['client_id'],'client_secret':value['client_secret'],'domain':DOMAIN}
            with os.fdopen(os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'w') as out:json.dump(client,out)
        grants=api('get','client-grants?client_id='+client['client_id'])
        if not grants:
            api('post','client-grants',{'client_id':client['client_id'],'audience':f'https://{DOMAIN}/api/v2/','scope':[scope]})
            grants=api('get','client-grants?client_id='+client['client_id'])
        if len(grants)!=1 or grants[0]['audience']!=f'https://{DOMAIN}/api/v2/' or grants[0]['scope']!=[scope]:
            raise RuntimeError('Unexpected service scope; no broadening permitted')
        report['services'].append({'service':key,'clientId':client['client_id'],'scopes':[scope],'grantReadback':True})
        args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__=='__main__':main()
