from pathlib import Path
import argparse,datetime,hashlib,json
QA=Path(__file__).resolve().parent
ROOT=QA.parents[2]
p=argparse.ArgumentParser();p.add_argument('--ack-last',action='store_true');p.add_argument('--bytes',type=int,default=28000);args=p.parse_args()
manifest=QA/'full-read.json';state=json.loads(manifest.read_text())
if args.ack_last and state.get('pendingBatch'):
    for item in state['pendingBatch']['ranges']:
        f=next(x for x in state['files'] if x['path']==item['path'])
        assert hashlib.sha256((ROOT/f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']+' changed while reading'
        f['readRanges'].append([item['start'],item['end']])
    state.setdefault('acknowledgedBatches',[]).append({**state.pop('pendingBatch'),'acknowledgedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()})
assert not state.get('pendingBatch'),'Read the pending output fully and acknowledge it before proceeding'
priority=['docs/product.md','AGENTS.md','docs/handoff.md','docs/production-apple-20260926.md','docs/storekit.md','docs/platform-contract.md','docs/backend.md','SECURITY.md','docs/quality-gates.md']
order=sorted(state['files'],key=lambda f:(priority.index(f['path']) if f['path'] in priority else len(priority),f['path']))
remaining=args.bytes;ranges=[];parts=[]
for f in order:
    lines=(ROOT/f['path']).read_text().splitlines(keepends=True)
    start=max((r[1] for r in f['readRanges']),default=0)
    if start>=len(lines):continue
    end=start;size=0
    while end<len(lines):
        n=len(lines[end].encode())
        if size+n>remaining and end>start:break
        if n>remaining and parts:break
        size+=n;end+=1
        if size>=remaining:break
    if end==start:break
    ranges.append({'path':f['path'],'start':start+1,'end':end})
    parts.append('\n===== '+f['path']+' lines '+str(start+1)+'-'+str(end)+' of '+str(len(lines))+' =====\n'+''.join(lines[start:end]))
    remaining-=size
    if remaining<=0 or end<len(lines):break
if ranges:
    batch=len(state.get('acknowledgedBatches',[]))+1
    state['pendingBatch']={'number':batch,'emittedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ranges':ranges}
    print(''.join(parts));print('\n===== END OF FULL READ BATCH '+str(batch)+' =====')
else:
    state['complete']=True;state['completedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    for f in state['files']:assert hashlib.sha256((ROOT/f['path']).read_bytes()).hexdigest()==f['sha256']
    print('FULL READ COMPLETE: '+str(len(state['files']))+' files')
manifest.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
