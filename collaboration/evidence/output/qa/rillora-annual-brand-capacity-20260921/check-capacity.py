"""Bounded private-API smoke load, never Auth0 or payment-provider traffic."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import json, math, os, subprocess, sys, tempfile, time

QA = Path(__file__).resolve().parent
ROOT = QA.parents[2]
state = json.loads((ROOT / '.local-secrets/annual-capacity/fixture.json').read_text())
BASE = 'https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com'
paths = ['/v1/overview', '/v1/matters?limit=50', '/v1/commerce/status?serviceMarketCode=GLOBAL_US']
results = []

def perform(index, path):
    with tempfile.TemporaryDirectory(prefix='rillora-capacity-') as directory:
        root = Path(directory)
        config = root / 'request.cfg'
        config.write_text('header = "Authorization: Bearer ' + state['tokens'][index] + '"\n')
        os.chmod(config, 0o600)
        command = ['curl','--config',str(config),'--silent','--show-error','--connect-timeout','5',
                   '--max-time','10','--output',str(root/'body'),'--write-out','%{http_code} %{time_total}',BASE+path]
        started_request=time.monotonic()
        process = subprocess.run(command,capture_output=True,text=True)
        if process.returncode:
            return {'path':path,'status':0,'seconds':time.monotonic()-started_request,'valid':False,'curlExitCode':process.returncode,'transportError':process.stderr[:350]}
        status, seconds = process.stdout.split()
        status = int(status)
        body = json.loads((root/'body').read_text()) if status==200 else {}
        valid = status==200
        if path.startswith('/v1/matters'):
            valid = valid and len(body.get('matters',[]))==20 and all(m['title'].startswith('Synthetic account ') for m in body['matters'])
        elif path=='/v1/overview':
            valid = valid and len(body.get('matters',[]))==20
        elif path.startswith('/v1/commerce/status'):
            valid = valid and body.get('billingOpen') is False and len(body.get('offers',[]))==1 and body['offers'][0]['billingInterval']=='annual' and body['offers'][0]['amountMinor']==8880
            # Full catalog shape is recorded only for the first disposable caller.
            if index in (0,2):(QA/'annual-catalog-response.json').write_text(json.dumps(body,indent=2)+'\n')
        return {'path':path,'status':status,'seconds':float(seconds),'valid':valid}

started = datetime.now(timezone.utc).isoformat()
# Retest only after the existing IP window resets; keep the failed original report.
retest = '--retest' in sys.argv
phases = [('normal',5,180),('short_peak',10,60)] if retest else [('normal',5,300),('short_peak',10,100)]
if '--peak-only' in sys.argv:phases=[('short_peak',10,60)]
for phase, rate, count in phases:
    futures=[]
    with ThreadPoolExecutor(max_workers=10) as pool:
        next_at=time.monotonic()
        for n in range(count):
            for f in futures[-20:]:
                if f.done() and (not f.result()['valid'] or f.result()['seconds']>5):
                    raise SystemExit('Stopped the bounded check after an error or excessive latency; no retries.')
            delay=next_at-time.monotonic()
            if delay>0:time.sleep(delay)
            path = paths[n%3] if retest and phase=='normal' else (paths[(n//100)%3] if phase=='normal' else paths[0])
            futures.append(pool.submit(perform,n%100,path))
            next_at+=1/rate
        rows=[f.result() for f in futures]
    for row in rows:row['phase']=phase
    results+=rows
    print(json.dumps({'phase':phase,'requests':len(rows),'ok':sum(x['valid'] for x in rows)}),flush=True)
    if not all(row['valid'] for row in rows):break

def summarize(rows):
    times=sorted(row['seconds']*1000 for row in rows)
    return {'requests':len(rows),'successes':sum(row['valid'] for row in rows),
            'p50Ms':round(times[math.ceil(len(times)*.5)-1],1),
            'p95Ms':round(times[math.ceil(len(times)*.95)-1],1),
            'maxMs':round(max(times),1),'httpCodes':sorted(set(row['status'] for row in rows))}
report={'startedAt':started,'finishedAt':datetime.now(timezone.utc).isoformat(),
        'fixture':{'users':100,'mattersPerUser':20,'totalMatters':2000},
        'normalRequestsPerSecond':5,'shortPeakRequestsPerSecond':10,'maxWorkers':10,
        'summary':summarize(results),'phases':{p:summarize([r for r in results if r['phase']==p]) for p in set(r['phase'] for r in results)},
        'boundary':'HTTPS private API reads through API Gateway with administrator-seeded disposable native sessions; no Auth0 login, browser rendering, payment, email or 100-simultaneous-user claim.',
        'requests':results}
filename = 'capacity-peak.json' if '--peak-only' in sys.argv else ('capacity-retest.json' if retest else 'capacity-load.json')
(QA/filename).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report['summary']))
assert all(row['valid'] for row in results)
