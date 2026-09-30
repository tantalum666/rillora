from pathlib import Path
import json, hashlib, datetime, sys

ROOT = Path(__file__).resolve().parents[3]
QA = Path(__file__).resolve().parent
manifest = json.loads((QA / 'markdown-inventory.json').read_text())
state_path = QA / 'markdown-reading-ranges.json'
now = lambda: datetime.datetime.now().astimezone().isoformat()
if state_path.exists():
    state = json.loads(state_path.read_text())
else:
    state = {'read': {'AGENTS.md': 82, 'docs/product.md': 400}, 'batches': [], 'initial_read': [
        {'path': 'AGENTS.md', 'ranges': [[1,82]], 'completed_at': now()},
        {'path': 'docs/product.md', 'ranges': [[1,135],[136,215],[216,340],[341,400]], 'completed_at': now()}]}
if len(sys.argv) > 1 and sys.argv[1] == 'ack':
    batch = state['batches'][-1]
    batch['read_confirmed_at'] = now()
    for r in batch['ranges']:
        state['read'][r['path']] = r['end']
paths = [x for x in manifest['files'] if x['path'] not in ('docs/chat-resume-20260930.md','docs/handoff.md')]
paths += [x for p in ('docs/chat-resume-20260930.md','docs/handoff.md') for x in manifest['files'] if x['path']==p]
budget = 28000
ranges = []
parts = []
for item in paths:
    start = state['read'].get(item['path'],0)
    if start >= item['lines']: continue
    p = ROOT / item['path']
    data = p.read_bytes()
    if hashlib.sha256(data).hexdigest() != item['sha256']:
        raise SystemExit('File changed during reading: '+item['path'])
    lines = data.decode().splitlines(keepends=True)
    selected = []
    while start + len(selected) < len(lines):
        s = lines[start+len(selected)]
        n = len(s.encode())
        if n > budget and selected: break
        if n > budget and parts: break
        selected.append(s); budget -= n
        if budget <= 0: break
    if selected:
        end=start+len(selected)
        ranges.append({'path':item['path'],'start':start+1,'end':end,'sha256':item['sha256']})
        parts.append(f'\n===== {item["path"]} lines {start+1}-{end} / {len(lines)} =====\n'+''.join(selected))
    if budget < 1500 or (selected and end < len(lines)):break
if ranges:
    state['batches'].append({'batch':len(state['batches'])+1,'emitted_at':now(),'ranges':ranges})
else:
    state['completed_at']=now()
state_path.write_text(json.dumps(state,ensure_ascii=False,indent=2))
print('READ BATCH',len(state['batches']), 'CONFIRMED FILES',sum(state['read'].get(x['path'],0)>=x['lines'] for x in manifest['files']), '/',len(manifest['files']))
print(''.join(parts) if parts else 'ALL PROJECT MARKDOWN READ AND ACKNOWLEDGED')
