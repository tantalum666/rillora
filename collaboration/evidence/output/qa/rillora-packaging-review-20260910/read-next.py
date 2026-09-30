import argparse,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--ack',default='');args=parser.parse_args()
p=Path(__file__).with_name('reading.json');s=json.loads(p.read_text());ack={int(x) for x in args.ack.split(',') if x}
for x in s['parts']:
 if x['id'] in ack:x['acknowledged']=True
p.write_text(json.dumps(s,ensure_ascii=False,indent=2))
chosen=[];weight=0
for x in [x for x in s['parts'] if not x['acknowledged']]:
 w=sum(1.5 if ord(c)>127 else .4 for c in x['text'])
 if chosen and weight+w>6500:break
 chosen.append(x);weight+=w
for x in chosen:print(f"\nDOCUMENT PART {x['id']} — {x['file']}:{x['start']}-{x['end']}\n{x['text']}")
print('DELIVERED_PARTS',','.join(str(x['id']) for x in chosen))
print('ACKNOWLEDGED',sum(x['acknowledged'] for x in s['parts']),'OF',len(s['parts']))
