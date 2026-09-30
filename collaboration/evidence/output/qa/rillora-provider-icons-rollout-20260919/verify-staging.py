"""Read-only publication verification for the platform-guidance Web artifact."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,subprocess
from curl_transport import request_url
Q=Path(__file__).resolve().parent;ROOT=Q.parents[2]
WEB='https://app.staging.rillora.xyz';API='https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com'
local=ROOT/'apps/web/dist/client'
def check(item):
 name,url,expected,kind,path=item
 status,headers,body=request_url(url)
 checks={'status':status==expected,'https':bool(headers.get('strict-transport-security'))}
 if kind=='spa':checks.update(csp=bool(headers.get('content-security-policy')),matchesBuild=hashlib.sha256(body).digest()==hashlib.sha256((local/'index.html').read_bytes()).digest())
 if kind=='asset':checks['matchesBuild']=hashlib.sha256(body).digest()==hashlib.sha256(path.read_bytes()).digest()
 if kind=='private':checks['noStore']='no-store' in headers.get('cache-control','')
 if kind=='session':checks['signedOut']=json.loads(body)=={'authenticated':False}
 return {'name':name,'url':url,'status':status,'checks':checks,'passed':all(checks.values())}
cases=[(p,WEB+p,200,'spa',None) for p in ['/','/guides','/guides?service=binance','/guides?service=adobe','/?view=access','/?view=settings','/invite','/open-copy']]
cases += [('live',API+'/health/live',200,'health',None),('ready',API+'/health/ready',200,'health',None),('session',WEB+'/api/auth/session-status',200,'session',None)]
cases += [(p,WEB+p,401,'private',None) for p in ['/api/v1/overview','/api/v1/sharing/shared-with-me','/api/v1/maintenance/overview']]
cases += [(p.name,WEB+'/assets/'+p.name,200,'asset',p) for p in sorted((local/'assets').iterdir()) if p.suffix in {'.js','.css','.txt'}]
with ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,cases))
result={'passed':sum(x['passed'] for x in rows),'total':len(rows),'checks':rows}
(Q/'aws-http-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:result[k] for k in ['passed','total']}));assert all(r['passed'] for r in rows),json.dumps([r for r in rows if not r['passed']])
