from pathlib import Path
import json,re,shlex,subprocess,pdfplumber
root=Path(__file__).resolve().parents[4]
folder=root/'.local-secrets/compiled-p2-20260916/print-checks'
protected=[]
for line in (root/'.local-secrets/legal/release.env').read_text().splitlines():
 line=line.removeprefix('export ')
 if line.startswith('VITE_LEGAL_') and '=' in line:
  key,raw=line.split('=',1)
  if any(word in key for word in ['OPERATOR','ADDRESS','EMAIL']):
   parts=shlex.split(raw);value=parts[0] if parts else ''
   if len(value)>3:protected.append(re.sub(r'\s+','',value).casefold())
if len(protected)<2:raise RuntimeError('Protected-value detection unavailable; do not render pages.')
results=[];previews=[]
for path in sorted(folder.glob('*.pdf')):
 with pdfplumber.open(path) as document:
  clipped=0;clean=[]
  for index,page in enumerate(document.pages):
   for char in page.chars:
    if char['x0'] < -1 or char['x1'] > page.width+1 or char['top'] < -1 or char['bottom'] > page.height+1:clipped+=1
   text=re.sub(r'\s+','',page.extract_text() or '').casefold()
   if text and '@' not in text and 'serviceaddress' not in text and not any(value in text for value in protected):clean.append(index+1)
  results.append({'document':path.stem,'pages':len(document.pages),'outOfPageCharacters':clipped,'cleanPreviewPages':clean})
  if clean and len(previews)<2:
   page=clean[0];output=folder/(path.stem+'-review')
   subprocess.run(['pdftoppm','-f',str(page),'-singlefile','-scale-to','1200','-png',str(path),str(output)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
   previews.append(str(output)+'.png')
result={'documents':results,'representativePreviews':previews}
(root/'output/qa/rillora-p2-repair-20260916/behavior-20260916/print-layout.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
