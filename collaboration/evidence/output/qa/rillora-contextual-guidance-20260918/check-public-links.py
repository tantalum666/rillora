from pathlib import Path
import json,urllib.request,urllib.error,hashlib,concurrent.futures,datetime
root=Path(__file__).resolve().parents[3];q=Path(__file__).parent;x=json.loads((root/'config/provider-guides.json').read_text())
urls=list(dict.fromkeys(l['urlString'] for g in x['guides'] for l in g['links']))
def check(url):
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Rillora guide source check (read-only)'}),timeout=20);b=r.read();return {'url':url,'status':r.status,'finalURL':r.url,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
 except urllib.error.HTTPError as e:return {'url':url,'status':e.code}
 except Exception as e:return {'url':url,'error':type(e).__name__}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,urls))
result={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Public source reachability only. HTTP success does not prove form completion or provider approval.','links':rows};(q/'public-link-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'urls':len(rows),'http200':sum(r.get('status')==200 for r in rows),'other':[{'url':r['url'],'status':r.get('status'),'error':r.get('error')} for r in rows if r.get('status')!=200]}))
