from pathlib import Path
import json,base64,hashlib,html,shutil
from font_outline import ROOT,text,MEASUREMENTS
OUT=ROOT/'output/release/rillora-store-design-20260930/v1';OUT.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'output/release/rillora-20260930/screenshots';BRAND=ROOT/'assets/brand/rillora'
PAPER='#F5F1E8';FOREST='#23473D';DARK='#163D32';SAGE='#E1E5D9';BRONZE='#BD9473'
items=[]
def data(path,mime):return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode()
def image(path,x,y,w,h,mime='image/jpeg',extra=''):
 return f'<image href="{data(path,mime)}" x="{x}" y="{y}" width="{w}" height="{h}" {extra}/>'
def defs():
 return '''<defs><filter id="device-shadow" x="-60%" y="-30%" width="240%" height="180%"><feDropShadow dx="0" dy="44" stdDeviation="32" flood-color="#071C14" flood-opacity=".24"/></filter><filter id="card-shadow" x="-30%" y="-60%" width="160%" height="220%"><feDropShadow dx="0" dy="24" stdDeviation="18" flood-color="#173E30" flood-opacity=".16"/></filter><linearGradient id="edge" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#5D6761"/><stop offset=".32" stop-color="#161C19"/><stop offset=".76" stop-color="#414C46"/><stop offset="1" stop-color="#111814"/></linearGradient></defs>'''
def logo(reverse=False,x=126,y=118,w=330):
 return image(BRAND/('lockup-reversed.svg' if reverse else 'lockup-primary.svg'),x,y,w,w*208/870,'image/svg+xml')
def phone(file,x,y,w,angle=0,tablet=False):
 pad=22 if not tablet else 25;inner=w-pad*2;h=inner*(2868/1320 if not tablet else 2752/2064)+pad*2;r=119 if not tablet else 82;unique='screen-'+file.replace('.jpg','')
 return f'''<g transform="rotate({angle} {x+w/2} {y+h/2})"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#edge)" filter="url(#device-shadow)"/><rect x="{x+6}" y="{y+6}" width="{w-12}" height="{h-12}" rx="{r-6}" fill="#101713"/><clipPath id="{unique}"><rect x="{x+pad}" y="{y+pad}" width="{inner}" height="{h-2*pad}" rx="{r-pad}"/></clipPath>'''+image(SRC/file,x+pad,y+pad,inner,h-pad*2,extra=f'clip-path="url(#{unique})"')+'</g>'
def write(name,w,h,body,title,source,copy):
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{html.escape(title)}</title>'+defs()+body+'</svg>'
 (OUT/(name+'.svg')).write_text(svg)
 items.append({'id':name,'title':title,'output':name+'.jpg','svg':name+'.svg','width':w,'height':h,'copy':copy,'sourceScreenshot':str((SRC/source).relative_to(ROOT)),'sourceSha256':hashlib.sha256((SRC/source).read_bytes()).hexdigest(),'route':'authentic UI / deterministic type and device composition','selectedBrand':'Legacy Imprint03','uploaded':False})
# 01 — a dark editorial cover with the real private map doing the work.
b=f'<rect width="1320" height="2868" fill="{DARK}"/><path d="M1150 760 C1630 1030 1580 1990 1230 2490 C960 2890 1160 3100 1560 3190" fill="none" stroke="#517064" stroke-width="2" opacity=".8"/><ellipse cx="1280" cy="2390" rx="735" ry="910" fill="#285447"/><ellipse cx="1325" cy="2370" rx="658" ry="834" fill="none" stroke="#668375" stroke-width="2" opacity=".6"/>'+logo(True)
b+=text('Leave less',120,430,162,PAPER,tracking=-2)+text('to figure out.',120,611,162,PAPER,tracking=-2)
b+=text('A private map of what matters.',126,765,47,'#D9E1D5','sans',-.2)
b+='<path d="M128 826 H269" stroke="#BD9473" stroke-width="5" stroke-linecap="round"/>'
b+=phone('iphone-matters.jpg',238,947,846,-2.8)
write('iphone-01-private-map',1320,2868,b,'Leave less to figure out.','iphone-matters.jpg',['Leave less','to figure out.','A private map of what matters.'])
# 02 — warm paper with a single exact UI detail brought forward.
b=f'<rect width="1320" height="2868" fill="{PAPER}"/><path d="M1010 820 C1410 1160 1330 1980 1480 2600 L1480 3100 L-200 3100 C-170 2490 1010 2130 1010 820Z" fill="#E3E7DD"/>'+logo()
b+=text('Their view.',122,427,168,FOREST,tracking=-2)+text('Your choice.',122,609,168,FOREST,tracking=-2)
b+=text('Share selected matters,',127,765,48,'#54695D','sans',-.2)+text('at the level you choose.',127,830,48,'#54695D','sans',-.2)
b+=phone('iphone-sharing.jpg',236,1050,846,2)
b+='<rect x="60" y="1755" width="1200" height="270" rx="46" fill="#FFFCF7" stroke="#CBD2C5" stroke-width="2" filter="url(#card-shadow)"/>'
b+='<svg x="102" y="1800" width="1116" height="172" viewBox="120 1298 1080 166">'+image(SRC/'iphone-sharing.jpg',0,0,1320,2868)+'</svg>'

write('iphone-02-chosen-sharing',1320,2868,b,'Their view. Your choice.','iphone-sharing.jpg',['Their view.','Your choice.','Share selected matters,','at the level you choose.'])
# 03 — a slightly greener paper; the actual audience-bound preview is the subject.
b=f'<rect width="1320" height="2868" fill="{SAGE}"/><rect x="-92" y="978" width="1570" height="2180" rx="510" fill="#F1EEE4" transform="rotate(-9 660 2020)"/><path d="M-200 1030 C320 670 1120 820 1470 1200" fill="none" stroke="#A3B4A1" stroke-width="2"/>'+logo()
b+=text('A copy to',122,427,168,FOREST,tracking=-2)+text('keep close.',122,609,168,FOREST,tracking=-2)
b+=text('Preview a guide for you',127,765,48,'#506657','sans',-.2)+text('or someone you choose.',127,830,48,'#506657','sans',-.2)
b+=phone('iphone-export-preview.jpg',237,1030,846,-1.8)
write('iphone-03-keep-a-copy',1320,2868,b,'A copy to keep close.','iphone-export-preview.jpg',['A copy to','keep close.','Preview a guide for you','or someone you choose.'])
# 04 — a calm closing invitation; the public screen is retained in full.
b=f'<rect width="1320" height="2868" fill="{DARK}"/><path d="M-100 1100 C450 780 1000 1130 1530 1820 L1530 3100 L-100 3100Z" fill="#2E5749"/><path d="M-170 1260 C390 940 850 1180 1480 1820" fill="none" stroke="#668171" stroke-width="2"/>'+logo(True)
b+=text('Start with',122,427,168,PAPER,tracking=-2)+text('what matters.',122,609,168,PAPER,tracking=-2)
b+=text('Add one thing now.',127,765,48,'#D5DFD0','sans',-.2)+text('Keep your map growing.',127,830,48,'#D5DFD0','sans',-.2)
b+=phone('iphone-home.jpg',237,1030,846,2.5)
write('iphone-04-start-small',1320,2868,b,'Start with what matters.','iphone-home.jpg',['Start with','what matters.','Add one thing now.','Keep your map growing.'])
# Tablet compositions use their own genuine iPad capture, not a stretched phone UI.
for name,source,lines,sub,dark in [('ipad-01-private-map','ipad-matters.jpg',['Leave less','to figure out.'],'A private map of what matters.',True),('ipad-02-start-small','ipad-home.jpg',['Start with','what matters.'],'Your important things, at your own pace.',False)]:
 color=PAPER if dark else FOREST;bg=DARK if dark else PAPER
 b=f'<rect width="2064" height="2752" fill="{bg}"/><ellipse cx="2090" cy="2200" rx="1130" ry="1560" fill="'+('#285447' if dark else '#E1E5D9')+'"/>'+logo(dark,x=178,y=135,w=375)
 b+=text(lines[0],172,456,204,color,tracking=-2)+text(lines[1],172,678,204,color,tracking=-2)+text(sub,180,816,54,'#D9E1D5' if dark else '#54695D','sans',-.2)
 b+=phone(source,122,990,1820,0,True)
 write(name,2064,2752,b,' '.join(lines),source,lines+[sub])
for m in MEASUREMENTS:
 limit=1890 if m['x']>=170 else 1210
 if m['x']+m['width']>limit:raise ValueError('Headline overflow '+repr(m))
(OUT/'manifest.json').write_text(json.dumps({'version':'1','format':'designed App Store screenshot set','items':items,'appUiChanged':False,'realUserDataUsed':False,'priceOrSecurityClaimsAdded':False,'nativeImageGeneration':False,'fontRendering':'Exact bundled font outlines; no font substitution','sourceScreenshotsUnmodified':True,'published':False},indent=2)+'\n')
(OUT/'review-manifest.json').write_text(json.dumps(items,indent=2)+'\n')
(OUT/'type-measurements.json').write_text(json.dumps(MEASUREMENTS,indent=2)+'\n')
for name in ['Source-Serif-4-Google-Fonts-OFL.txt','Inter-OFL.txt']:shutil.copy2(BRAND/name,OUT/'fonts'/name)
print('Created six editable vector compositions from preserved screenshots.')
