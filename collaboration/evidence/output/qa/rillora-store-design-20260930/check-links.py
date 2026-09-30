from pathlib import Path
import subprocess,re,json,urllib.parse,datetime
root=Path('/Users/tantalum/Documents/电子遗嘱app')
files=sorted(set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z','--','*.md'],cwd=root).decode().strip('\0').split('\0')))
files=sorted(set(files)|{entry['path'] for entry in json.loads((root/'output/qa/rillora-launch-resume-20260930/markdown-inventory.json').read_text())['files']})
broken=[];count=0;fragments=[]
for name in files:
 if not name:continue
 p=root/name
 if not p.is_file():continue
 body=re.sub(r'```[\s\S]*?```','',p.read_text())
 links=re.findall(r'\]\((<[^>]+>|[^\n)]+)\)',body)+re.findall(r'^\s*\[[^]]+\]:\s*(\S+)',body,re.M)
 for raw in links:
  target=raw.strip().strip('<>').split(' "')[0]
  if not target or re.match(r'^[a-zA-Z][a-zA-Z+.-]*:',target):continue
  path,_,fragment=target.partition('#');dest=(p.parent/urllib.parse.unquote(path)).resolve() if path else p
  count+=1
  if not dest.exists():broken.append({'file':name,'target':target})
  elif fragment and dest.suffix=='.md':fragments.append({'file':name,'target':str(dest.relative_to(root))+'#'+urllib.parse.unquote(fragment)})
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'ownedFiles':len(files),'localLinks':count,'missing':broken,'markdownFragments':fragments}
(root/'output/qa/rillora-store-design-20260930/markdown-links.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(bool(broken))
