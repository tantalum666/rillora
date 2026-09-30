from pathlib import Path
import subprocess,re,json,urllib.parse
root=Path.cwd();files=subprocess.check_output(['rg','--files','--hidden','-g','*.md','-g','!output/**','-g','!.git/**','-g','!.local/**','-g','!**/node_modules/**','-g','!**/.build/**'],text=True).splitlines();broken=[];count=0
for name in files:
 p=Path(name);body=re.sub(r'```[\s\S]*?```','',p.read_text())
 links=re.findall(r'\]\((<[^>]+>|[^\n)]+)\)',body)+re.findall(r'^\s*\[[^]]+\]:\s*(\S+)',body,re.M)
 for raw in links:
  target=raw.strip().strip('<>').split(' "')[0]
  if not target or target.startswith('#') or re.match(r'^[a-zA-Z][a-zA-Z+.-]*:',target):continue
  target=urllib.parse.unquote(target.split('#')[0]);count+=1
  if not (p.parent/target).resolve().exists():broken.append({'file':name,'target':target})
report={'files':len(files),'localLinks':count,'missing':broken};Path('output/qa/rillora-ui-ux-audit-20260929/markdown-links.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(bool(broken))
