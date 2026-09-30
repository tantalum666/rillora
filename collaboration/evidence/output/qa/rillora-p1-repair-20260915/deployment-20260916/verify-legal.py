from pathlib import Path
from urllib.request import Request,urlopen,build_opener,HTTPRedirectHandler
from urllib.error import HTTPError
import json,hashlib,re,concurrent.futures
Q=Path(__file__).resolve().parent
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=build_opener(NoRedirect)
def read(path,method='GET'):
 try:r=opener.open(Request('https://legal.rillora.xyz'+path,method=method,headers={'User-Agent':'Rillora-Legal-Verification'}),timeout=25)
 except HTTPError as e:r=e
 with r:return r.status,{k.lower():v for k,v in r.headers.items()},r.read()
results=[]
for path in ['/terms','/privacy','/subscription-terms','/refund-policy','/acceptable-use','/cookies','/legal']:
 status,h,b=read(path);ok=status==200 and 'text/html' in h.get('content-type','') and all(k in h for k in ['content-security-policy','strict-transport-security','x-content-type-options','referrer-policy']);results.append({'path':path,'status':status,'securityHeaders':ok,'passed':ok})
for path,expected in [('/',308),('/account',404),('/api/auth/session-status',404),('/unknown',404)]:
 status,_,_=read(path);results.append({'path':path,'status':status,'passed':status==expected})
status,_,_=read('/privacy','POST');results.append({'path':'POST /privacy','status':status,'passed':status==404})
assets=list((Q.parents[3]/'.local-secrets/compiled-p1-20260916/legal-release-artifact/client/assets').iterdir())
def asset(p):
 status,_,b=read('/assets/'+p.name);return {'path':'/assets/'+p.name,'status':status,'passed':status==200 and hashlib.sha256(b).digest()==hashlib.sha256(p.read_bytes()).digest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:results+=list(pool.map(asset,assets))
js=''.join(p.read_text() for p in assets if p.suffix=='.js');results.append({'path':'compiled legal version','passed':'privacy-2026-09-15-1' in js and 'cookies-2026-09-15-1' in js and 'rillora.matter-draft.v1' in js and 'rillora.deletion-reference.v1' in js})
v={'passed':sum(r['passed'] for r in results),'total':len(results),'checks':results};(Q/'legal-http-verification.json').write_text(json.dumps(v,indent=2)+'\n');print(json.dumps({'passed':v['passed'],'total':v['total'],'failures':[r for r in results if not r['passed']]}));raise SystemExit(0 if v['passed']==v['total'] else 1)
