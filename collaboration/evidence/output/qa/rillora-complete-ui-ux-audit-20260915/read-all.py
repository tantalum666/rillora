from pathlib import Path
from datetime import datetime
import json,sys
q=Path(__file__).parent;chunks=json.loads((q/'read-chunks.json').read_text());p=q/'reading-inventory.json';s=json.loads(p.read_text())
for previous in map(int,sys.argv[2:]):
 for part in chunks[previous]:
  if not any(r['file']==part['file'] and r['start']==part['start'] and r['end']==part['end'] for r in s['ranges']):s['ranges'].append({**part,'completedAt':datetime.now().astimezone().isoformat(),'evidence':f'Full tool output chunk {previous}'})
p.write_text(json.dumps(s,ensure_ascii=False,indent=2))
index=int(sys.argv[1])
w=json.loads((q/'work-state.json').read_text());w['lastEmittedChunk']=index
if len(sys.argv)>2:w['lastAcknowledgedChunk']=max(map(int,sys.argv[2:]))
w['nextReadChunk']=index+1
(q/'work-state.json').write_text(json.dumps(w,indent=2,ensure_ascii=False))
for part in chunks[index]:
 print('\nFILE:',part['file'],'LINES:',part['start'],'-',part['end'])
 print(''.join(Path(part['file']).read_text().splitlines(keepends=True)[part['start']-1:part['end']]),end='')
print('\nEND CHUNK',index,'OF',len(chunks))
