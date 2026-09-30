import subprocess,tempfile,json
from pathlib import Path

def request_url(url,method='GET',payload=None,headers=None):
 with tempfile.TemporaryDirectory(prefix='rillora-http-') as directory:
  root=Path(directory);h=root/'headers';b=root/'body'
  args=['curl','--silent','--show-error','--connect-timeout','10','--max-time','30','--retry','2','--retry-delay','1','--retry-all-errors','-X',method,'-D',str(h),'-o',str(b),'-w','%{http_code}',url]
  for key,value in (headers or {}).items():args+=['-H',key+': '+value]
  if payload is not None:args+=['-H','Content-Type: application/json','--data-binary',json.dumps(payload)]
  result=subprocess.run(args,text=True,capture_output=True)
  if result.returncode:raise RuntimeError("HTTPS transport unavailable; no credentials logged")
  blocks=h.read_text().replace('\r','').strip().split('\n\n');lines=blocks[-1].splitlines()
  parsed={k.strip().lower():v.strip() for line in lines[1:] if ':' in line for k,v in [line.split(':',1)]}
  return int(result.stdout[-3:]),parsed,b.read_bytes()
