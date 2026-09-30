from pathlib import Path
from urllib.parse import unquote,urlsplit
import subprocess,re,json
from datetime import datetime,timezone
root=Path.cwd(); qa=root/'output/qa/rillora-automation-foundation-20260911'
raw=subprocess.check_output(['rg','--files','--hidden','-g','*.md','-g','!.git','-g','!node_modules','-g','!output','-g','!DerivedData','-g','!SourcePackages','-g','!dist','-g','!build','-g','!.build','-g','!cdk.out*','-g','!.playwright*'],text=True)
files=[root/x for x in raw.splitlines()]
extra=[qa/'README.md']
issues=[];checked=0
for p in files+extra:
    text=p.read_text()
    # Real inline Markdown targets only, excluding fenced code examples.
    text=re.sub(r'^```.*?^```\s*$', '', text, flags=re.S|re.M)
    for m in re.finditer(r'!?\[[^\]\n]*\]\((<[^>]+>|[^)]+)\)',text):
        target=m.group(1).strip().strip('<>')
        if target.startswith(('#','http:','https:','mailto:','app:','codex:','data:','sandbox:')):continue
        # Optional Markdown title; all project's generated links use unambiguous targets.
        target=re.sub(r'\s+"[^"]*"$','',target)
        target=unquote(target.split('#',1)[0].split('?',1)[0])
        if not target:continue
        if '${' in target or '{{' in target:continue
        path=Path(target) if target.startswith('/') else p.parent/target
        checked+=1
        if not path.exists():issues.append({'file':str(p.relative_to(root)),'target':target})
# Ensure every registry implementation exists and project docs have the latest pricing routes.
for name in ['product-catalog','service-registry','automation-registry','operations-targets','content-program']:
    d=json.loads((root/f'config/{name}.json').read_text());assert d['schemaVersion']==1
    if name=='automation-registry':
        assert len({j['id'] for j in d['jobs']})==len(d['jobs'])
        for j in d['jobs']:
            if j.get('implementation'):assert (root/j['implementation']).exists()
    if name=='service-registry':assert len({x['id'] for x in d['services']})==len(d['services'])
assert len(re.findall(r'^## Next step', (root/'docs/handoff.md').read_text(),flags=re.M))==1
assert 'Status: HISTORICAL' in (root/'docs/pricing-band-20260910.md').read_text()
result={'checkedAt':datetime.now(timezone.utc).isoformat(),'ownedMarkdownFiles':len(files),'extraQaFiles':len(extra),'linksChecked':checked,'issues':issues,'registryValidation':'pass','handoffActiveNextSteps':1,'inventory':[str(x.relative_to(root)) for x in sorted(files)],'excluded':['dependencies','caches','build output','third party packages','generated output except this QA README'],'scope':'Link/registry/status validation only; not a replacement for body reading'}
(qa/'document-checks.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='inventory'},indent=2,ensure_ascii=False))
raise SystemExit(bool(issues))
