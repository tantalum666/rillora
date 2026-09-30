from pathlib import Path
import json,sys,datetime
q=Path(__file__).resolve().parent
rows=json.loads((q/'md-full-read-bodies.json').read_text());ledger=json.loads((q/'md-read-ledger.json').read_text())
acks=[];emits=[]
for arg in sys.argv[1:]:
    if arg.startswith('ack='):acks=[int(x) for x in arg[4:].split(',') if x]
    elif arg.startswith('emit='):emits=[int(x) for x in arg[5:].split(',') if x]
for n in acks:
    if n not in ledger['read']:ledger['read'].append(n)
ledger['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
(q/'md-read-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
statePath=q/'work-state.json'
if statePath.exists():
    state=json.loads(statePath.read_text());state['lastEmittedAwaitingAck']=emits;state['verifiedChunkCount']=len(ledger['read']);statePath.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
for n in emits:
    r=rows[n];print(f"\nREAD CHUNK {n}: {r['path']} lines {r['startLine']}-{r['endLine']}\n"+r['body'])
