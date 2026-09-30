from pathlib import Path
import difflib
import hashlib
import json
import re
import subprocess
from datetime import datetime

ROOT=Path(__file__).resolve().parents[3]
QA=Path(__file__).parent
cmd=['rg','--files','--hidden','-g','*.md','-g','!output/**','-g','!outputs/**','-g','!**/node_modules/**','-g','!**/.git/**','-g','!**/.build/**','-g','!**/build/**','-g','!**/dist/**','-g','!**/DerivedData/**','-g','!**/SourcePackages/**','-g','!**/.cache/**']
files=[ROOT/p for p in subprocess.check_output(cmd,cwd=ROOT,text=True).splitlines()]
broken=[];links=0
for p in files:
    for match in re.finditer(r'\[[^\]\n]+\]\(([^)\n]+)\)',p.read_text()):
        target=match.group(1).strip().strip('<>')
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',target) or target.startswith('#'): continue
        target=target.split('#')[0]
        if not target: continue
        links+=1
        destination=Path(target) if target.startswith('/') else p.parent/target
        if not destination.exists():broken.append({'file':str(p.relative_to(ROOT)),'target':target})
changes=[];patch=[]
for old in sorted((QA/'before').rglob('*.md')):
    rel=old.relative_to(QA/'before');new=ROOT/rel
    if old.read_bytes()!=new.read_bytes():
        changes.append(str(rel))
        patch.extend(difflib.unified_diff(old.read_text().splitlines(keepends=True),new.read_text().splitlines(keepends=True),fromfile='before/'+str(rel),tofile='after/'+str(rel)))
for rel in ['docs/unit-economics-history-20260910.md']:
    changes.append(rel)
    patch.extend(difflib.unified_diff([], (ROOT/rel).read_text().splitlines(keepends=True),fromfile='/dev/null',tofile='after/'+rel))
(QA/'document-changes.patch').write_text(''.join(patch))
git=[]
for directory in [ROOT,ROOT/'apps/web']:
    result=subprocess.run(['git','diff','--check'],cwd=directory,text=True,capture_output=True)
    git.append({'cwd':str(directory),'exit':result.returncode,'output':result.stdout+result.stderr})
handoff=(ROOT/'docs/handoff.md').read_text()
assert handoff.count('## Next step')==1
assert 'US$49/year' in handoff and 'US$6.99/month' in handoff
assert 'HISTORICAL' in (ROOT/'docs/unit-economics-history-20260910.md').read_text().splitlines()[0]
assert 'reprice' in (ROOT/'docs/decision-log.md').read_text().lower()
recovery=json.loads((QA/'recovery.json').read_text())
recovery['recovered']['AGENTS.md']='1-82'
recovery['recovered']['docs/family-maintenance.md']='1-106 before pricing edit'
recovery['completedAt']=datetime.now().astimezone().isoformat()
(QA/'recovery.json').write_text(json.dumps(recovery,ensure_ascii=False,indent=2))
result={'completedAt':datetime.now().astimezone().isoformat(),'projectMarkdownFiles':len(files),'localLinks':links,'brokenLinks':broken,'changedDocuments':changes,'gitDiffCheck':git,'handoffNextSteps':1,'runtimeTestsRerun':False,'workbookSha256':hashlib.sha256((ROOT/'output/finance/rillora-pricing-reset-20260910/Rillora_Pricing_Reset.xlsx').read_bytes()).hexdigest()}
(QA/'documentation-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False,indent=2))
if broken or any(x['exit'] for x in git):raise SystemExit(1)
