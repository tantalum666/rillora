from pathlib import Path
from datetime import datetime
import json,hashlib,sys
q=Path(__file__).parent;s=json.loads((q/'reading-inventory.json').read_text())
if not (q/'read-chunks.json').exists():
 chunks=[];parts=[];size=0
 for f in s['files']:
  name=f['file'];lines=Path(name).read_text().splitlines(keepends=True)
  f['sha256']=hashlib.sha256(Path(name).read_bytes()).hexdigest()
  start=99 if name=='docs/product.md' else 82 if name=='AGENTS.md' else 0
  if start:s['ranges'].append({'file':name,'start':1,'end':start,'completedAt':datetime.now().astimezone().isoformat(),'evidence':'full tool output in initial calls'})
  while start<len(lines):
   end=start;n=0
   while end<len(lines) and n+len(lines[end].encode())<=min(28000-size,28000):n+=len(lines[end].encode());end+=1
   if end==start:
    chunks.append(parts);parts=[];size=0;continue
   parts.append({'file':name,'start':start+1,'end':end});size+=n;start=end
   if size>26000:chunks.append(parts);parts=[];size=0
 if parts:chunks.append(parts)
 (q/'read-chunks.json').write_text(json.dumps(chunks,indent=2))
 (q/'reading-inventory.json').write_text(json.dumps(s,indent=2,ensure_ascii=False))
chunks=json.loads((q/'read-chunks.json').read_text())
if len(sys.argv)==1:
 print(json.dumps({'chunks':len(chunks),'next':0}));raise SystemExit
index=int(sys.argv[1]);ack=[int(x) for x in sys.argv[2:]]
for a in ack:
 for part in chunks[a]:
  if not any(x['file']==part['file'] and x['start']==part['start'] and x['end']==part['end'] for x in s['ranges']):s['ranges'].append({**part,'completedAt':datetime.now().astimezone().isoformat(),'evidence':f'complete tool output chunk {a}'})
(q/'reading-inventory.json').write_text(json.dumps(s,indent=2,ensure_ascii=False))
for part in chunks[index]:
 print('\nFILE:',part['file'],'LINES:',part['start'],'-',part['end'])
 print(''.join(Path(part['file']).read_text().splitlines(keepends=True)[part['start']-1:part['end']]),end='')
print('\nEND CHUNK',index,'of',len(chunks))
