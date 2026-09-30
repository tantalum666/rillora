const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let sharp;try{sharp=require('sharp');}catch{sharp=require(process.env.RILLORA_SHARP_MODULE||'/Users/tantalum/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');}
const root=path.resolve(__dirname,'../..'),out=path.join(root,'assets/brand/rillora-identity-03-legacy-imprint-20260919');
fs.mkdirSync(out,{recursive:true});
const palette={forest:'#23473D',paper:'#F5F1E8',bronze:'#BD9473'};
const ridges=[
'M72 91 C93 49 130 36 171 36 C213 36 250 63 267 103',
'M59 137 C73 119 88 118 109 98 C128 80 146 72 169 72 C199 72 225 95 237 126',
'M55 178 C27 208 26 248 56 278',
'M275 145 C305 187 307 239 278 276',
'M104 184 C71 211 67 248 85 282',
'M233 203 C252 223 259 251 241 278'
];
const trunk=[
'M174 303 C179 275 174 246 174 212 C174 174 166 151 146 131',
'M174 219 C194 181 219 163 245 160',
'M174 252 C166 229 143 217 120 216'
];
const rootBase='M166 268 C166 291 157 308 143 318 C160 330 190 332 207 318 C191 307 184 289 184 268 Z';
// Geometry is intentionally drawn, not a bitmap trace. Small display retains three external arcs.
const body=(color,micro=false)=>`<g fill="none" stroke="${color}" stroke-width="${micro?22:20}" stroke-linecap="round" stroke-linejoin="round">${ridges.filter((_,i)=>!micro||[0,2,3].includes(i)).map(d=>`<path d="${d}"/>`).join('')}</g><g fill="none" stroke="${color}" stroke-width="${micro?26:24}" stroke-linecap="round" stroke-linejoin="round">${trunk.map(d=>`<path d="${d}"/>`).join('')}</g><path fill="${color}" d="${rootBase}"/>`;
const mark=(color=palette.forest,micro=false)=>`<svg xmlns="http://www.w3.org/2000/svg" width="308" height="322" viewBox="16 16 308 322" role="img" aria-label="Rillora Legacy Imprint symbol">${body(color,micro)}</svg>`;
const markGroup=(x,y,w,color=palette.forest,micro=false)=>`<g transform="translate(${x} ${y}) scale(${w/308}) translate(-16 -16)">${body(color,micro)}</g>`;
const wordSrc=fs.readFileSync(path.join(out,'wordmark-source.svg'),'utf8');
const wordInner=wordSrc.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'').replace(/fill="[^"]*"/g,'fill="currentColor"');
const wordGroup=(x,y,w,color=palette.forest)=>`<g transform="translate(${x} ${y}) scale(${w/391})">${wordInner.replaceAll('currentColor',color)}</g>`;
const svg=(w,h,b)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${b}</svg>`;
const text=(x,y,t,s=16,c='#6F7870',ex='')=>`<text x="${x}" y="${y}" font-family="Helvetica,Arial,sans-serif" font-size="${s}" fill="${c}" ${ex}>${t}</text>`;
const icon=(bg,fg)=>svg(1024,1024,`<rect width="1024" height="1024" fill="${bg}"/>`+markGroup(180,160,670,fg));
const files={
 'symbol-forest.svg':mark(),'symbol-black.svg':mark('#000'),'symbol-white.svg':mark('#fff'),'symbol-micro.svg':mark(palette.forest,true),
 'wordmark-forest.svg':svg(391,109,wordGroup(0,0,391)),
 'lockup-primary.svg':svg(870,208,markGroup(8,8,184)+wordGroup(234,15,620)),
 'lockup-white.svg':svg(870,208,markGroup(8,8,184,'#fff')+wordGroup(234,15,620,'#fff')),
 'app-icon-dark.svg':icon(palette.forest,palette.paper),'app-icon-light.svg':icon(palette.paper,palette.forest),'app-icon-bronze.svg':icon(palette.forest,palette.bronze),
 'favicon.svg':svg(64,64,`<rect width="64" height="64" rx="13" fill="${palette.forest}"/>`+markGroup(6,4,52,palette.paper,true))
};
let board=`<rect width="1600" height="1060" fill="${palette.paper}"/>`;
board+=text(72,60,'RILLORA',15,palette.forest,'letter-spacing="3.2"')+text(1528,60,'IDENTITY STUDY 03',12,palette.forest,'text-anchor="end" letter-spacing="2"');
board+='<line x1="72" y1="85" x2="1528" y2="85" stroke="#D9DDD0"/>';
board+=markGroup(128,252,170)+wordGroup(355,268,529);
board+=text(139,514,'LEGACY IMPRINT / SYMBOL + WORDMARK',11,'#6F7870','letter-spacing="2"');
board+=`<rect x="1080" y="194" width="328" height="328" rx="74" fill="${palette.forest}"/>`+markGroup(1138,242,217,palette.paper);
board+=text(1244,561,'Rillora',20,palette.forest,'text-anchor="middle"')+text(1244,592,'APP ICON STUDY',11,'#6F7870','text-anchor="middle" letter-spacing="2"');
board+='<line x1="72" y1="676" x2="1528" y2="676" stroke="#D9DDD0"/>';
board+=text(72,721,'01  /  SINGLE COLOUR',11,'#6F7870','letter-spacing="1.8"')+markGroup(123,770,112,'#000');
board+=text(365,721,'02  /  REVERSED',11,'#6F7870','letter-spacing="1.8"')+`<rect x="365" y="750" width="237" height="196" rx="16" fill="${palette.forest}"/>`+markGroup(431,783,105,palette.paper);
board+=text(682,721,'03  /  SMALL SIZES',11,'#6F7870','letter-spacing="1.8"');
let tx=682;for(const s of [16,24,32,64]){board+=markGroup(tx,794,s*308/322,palette.forest,s<=24)+text(tx+s/2,899,String(s),11,'#6F7870','text-anchor="middle"');tx+=s+30;}
board+=text(1131,721,'04  /  PALETTE',11,'#6F7870','letter-spacing="1.8"');
for(const [i,c] of [palette.forest,palette.paper,palette.bronze].entries())board+=`<rect x="${1131+i*128}" y="777" width="104" height="86" rx="6" fill="${c}" stroke="#D9DDD0"/>`+text(1131+i*128,897,c.toUpperCase(),12,palette.forest);
board+=text(72,1015,'Rillora / Legacy Imprint / Alternative 03',13,palette.forest)+text(1528,1015,'19 SEPTEMBER 2026',11,'#6F7870','text-anchor="end" letter-spacing="1.5"');
files['identity-board.svg']=svg(1600,1060,board);
files['hero.svg']=svg(1600,800,`<rect width="1600" height="800" fill="${palette.paper}"/>`+markGroup(265,275,230)+wordGroup(556,293,740));
let proof='<rect width="960" height="440" fill="white"/>';
for(const [i,s] of [16,24,32,64,128].entries()){const x=36+i*184;proof+=text(x,32,`${s}px high`,12,'#666')+markGroup(x,65,s*308/322,'#000',s<=24);proof+=`<rect x="${x-8}" y="220" width="165" height="180" fill="#000"/>`+markGroup(x,244,s*308/322,'#fff',s<=24);}
files['optical-proof.svg']=svg(960,440,proof);
const first=path.join(root,'assets/brand/rillora-identity-20260919');
const embed=(file,x,y,w,h)=>{const source=fs.readFileSync(file,'utf8');return`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${source.match(/viewBox="([^"]+)"/)[1]}">${source.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'')}</svg>`;};
let compare=`<rect width="1600" height="850" fill="${palette.paper}"/>`;
compare+=text(64,70,'01 / FLOWING R',17,'#183B31','letter-spacing="2"')+text(864,70,'03 / LEGACY IMPRINT',17,palette.forest,'letter-spacing="2"');
compare+=text(64,102,'Retained unchanged',13)+text(864,102,'New alternative',13);
compare+=embed(path.join(first,'lockup-pine.svg'),76,220,648,153);
compare+=`<svg x="866" y="220" width="668" height="160" viewBox="0 0 870 208">${files['lockup-primary.svg'].replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'')}</svg>`;
compare+='<rect x="296" y="480" width="208" height="208" rx="47" fill="#183B31"/>'+embed(path.join(first,'symbol-white.svg'),340,521,120,127);
compare+=`<rect x="1096" y="480" width="208" height="208" rx="47" fill="${palette.forest}"/>`+markGroup(1131,510,141,palette.paper);
compare+=text(400,744,'Direct name recognition',15,'#183B31','text-anchor="middle"')+text(1200,744,'Personal imprint + continuity',15,palette.forest,'text-anchor="middle"');
files['comparison.svg']=svg(1600,850,compare);
(async()=>{
for(const [n,b] of Object.entries(files))fs.writeFileSync(path.join(out,n),b);
for(const n of ['identity-board','hero','optical-proof','comparison','app-icon-dark','app-icon-light','app-icon-bronze']){let job=sharp(Buffer.from(files[n+'.svg']));if(n.startsWith('app-icon'))job=job.removeAlpha();await job.png().toFile(path.join(out,n+'.png'));}
for(const n of ['lockup-primary','lockup-white','wordmark-forest'])await sharp(Buffer.from(files[n+'.svg'])).resize({width:1700}).png().toFile(path.join(out,n+'.png'));
await sharp(Buffer.from(files['favicon.svg'])).resize(32,32).removeAlpha().png().toFile(path.join(out,'favicon-32.png'));
for(const s of [16,24,32,64,128,256,512])await sharp(Buffer.from(mark(palette.forest,s<=24))).resize({height:s}).png().toFile(path.join(out,`symbol-${s}.png`));
const manifest={createdAt:new Date().toISOString(),name:'Rillora / Legacy Imprint',status:'NEW_OPTION_03_NOT_ADOPTED_OR_DEPLOYED',retained:'Identity01 unchanged',rejected:'Identity02/Open Folio is historical only',palette,design:'Simplified fingerprint-like ridges grow into a central tree; personal digital imprint and continuity are visual metaphors, not biometric features or inheritance guarantees',symbol:'Explicit editable stroke-and-path geometry reconstructed from ImageGen exploration; no automatic tracing',wordmark:'Reuses Source Serif 4 SemiBold outlined type from identity01 without modifying its files; OFL included',micro:'16/24px retain three outer arcs, the central tree and wider strokes',files:fs.readdirSync(out).filter(n=>/\.(svg|png|txt)$/.test(n)).map(n=>({name:n,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,n))).digest('hex')}))};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({out,files:manifest.files.length},null,2));
})();
