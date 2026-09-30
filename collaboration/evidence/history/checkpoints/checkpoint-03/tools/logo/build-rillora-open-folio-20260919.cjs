const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let sharp;try{sharp=require('sharp');}catch{sharp=require(process.env.RILLORA_SHARP_MODULE||'/Users/tantalum/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');}
const root=path.resolve(__dirname,'../..'),out=path.join(root,'assets/brand/rillora-identity-02-open-folio-20260919');
fs.mkdirSync(out,{recursive:true});
const palette={clay:'#AD5F43',paper:'#F6F1E8',ink:'#28322D'};
// Two separately drawn closed contours. Explicit curves reconstruct the selected concept.
const left='M42 103 C42 94 50 90 59 94 C95 111 119 109 144 125 C167 141 175 169 171 206 C167 232 170 265 175 296 C155 273 121 270 90 264 L78 261 C51 256 42 246 42 220 Z';
const right='M320 58 C320 48 312 44 303 48 C274 62 244 66 218 88 C189 111 177 138 182 174 C188 215 189 251 180 296 C211 274 251 270 283 262 C309 257 320 242 320 220 Z';
// Expanded gutter and separated lower tips survive at 16/24px and favicon sizes.
const smallLeft='M42 103 C42 94 50 90 59 94 C95 111 117 109 141 125 C164 141 170 169 166 206 C161 233 161 265 164 290 C145 273 116 270 90 264 L78 261 C51 256 42 246 42 220 Z';
const smallRight='M320 58 C320 48 312 44 303 48 C274 62 247 66 221 88 C195 111 184 138 189 174 C195 215 196 251 190 290 C215 273 253 270 283 262 C309 257 320 242 320 220 Z';
const wordSource=fs.readFileSync(path.join(out,'wordmark-source.svg'),'utf8');
const wordInner=wordSource.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'').replace(/fill="[^"]*"/g,'fill="currentColor"');
const paths=(color,micro=false)=>`<g fill="${color}"><path d="${micro?smallLeft:left}"/><path d="${micro?smallRight:right}"/></g>`;
const mark=(color=palette.clay,micro=false)=>`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="270" viewBox="32 36 300 270" role="img" aria-label="Rillora Open Folio symbol">${paths(color,micro)}</svg>`;
const markGroup=(x,y,w,color=palette.clay,micro=false)=>`<g transform="translate(${x} ${y}) scale(${w/300}) translate(-32 -36)">${paths(color,micro)}</g>`;
const wordGroup=(x,y,w,color=palette.ink)=>`<g transform="translate(${x} ${y}) scale(${w/377})">${wordInner.replaceAll('currentColor',color)}</g>`;
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const text=(x,y,t,size=16,color='#77796F',extra='')=>`<text x="${x}" y="${y}" font-family="Helvetica,Arial,sans-serif" font-size="${size}" fill="${color}" ${extra}>${t}</text>`;
const icon=(bg,fg)=>svg(1024,1024,`<rect width="1024" height="1024" fill="${bg}"/>`+markGroup(204,233,620,fg,true));
const files={
 'symbol-clay.svg':mark(),'symbol-ink.svg':mark(palette.ink),'symbol-black.svg':mark('#000'),'symbol-white.svg':mark('#fff'),'symbol-micro.svg':mark(palette.clay,true),
 'wordmark-ink.svg':svg(377,111,wordGroup(0,0,377)),
 'lockup-primary.svg':svg(860,200,markGroup(8,7,205)+wordGroup(264,12,584)),
 'lockup-white.svg':svg(860,200,markGroup(8,7,205,'#fff')+wordGroup(264,12,584,'#fff')),
 'app-icon-clay.svg':icon(palette.clay,palette.paper),'app-icon-dark.svg':icon(palette.ink,palette.paper),'app-icon-light.svg':icon(palette.paper,palette.clay),
 'favicon.svg':svg(64,64,`<rect width="64" height="64" rx="13" fill="${palette.clay}"/>`+markGroup(6,10,52,palette.paper,true))
};
let board=`<rect width="1600" height="1060" fill="${palette.paper}"/>`;
board+=text(72,60,'RILLORA',15,palette.ink,'letter-spacing="3.2"')+text(1528,60,'IDENTITY STUDY 02',12,palette.ink,'text-anchor="end" letter-spacing="2"');
board+='<line x1="72" y1="85" x2="1528" y2="85" stroke="#DDD7CE"/>';
board+=markGroup(138,263,180)+wordGroup(368,268,516);
board+=text(139,514,'OPEN FOLIO / SYMBOL + WORDMARK',11,'#77796F','letter-spacing="2"');
board+=`<rect x="1080" y="194" width="328" height="328" rx="74" fill="${palette.clay}"/>`+markGroup(1145,268,200,palette.paper,true);
board+=text(1244,561,'Rillora',20,palette.ink,'text-anchor="middle"')+text(1244,592,'APP ICON STUDY',11,'#77796F','text-anchor="middle" letter-spacing="2"');
board+='<line x1="72" y1="676" x2="1528" y2="676" stroke="#DDD7CE"/>';
board+=text(72,721,'01  /  SINGLE COLOUR',11,'#77796F','letter-spacing="1.8"')+markGroup(116,782,122,'#000');
board+=text(365,721,'02  /  REVERSED',11,'#77796F','letter-spacing="1.8"');
board+=`<rect x="365" y="750" width="237" height="196" rx="16" fill="${palette.ink}"/>`+markGroup(428,792,112,palette.paper);
board+=text(682,721,'03  /  SMALL SIZES',11,'#77796F','letter-spacing="1.8"');
let tx=682;for(const size of [16,24,32,64]){board+=markGroup(tx,795,size*300/270,palette.ink,size<=24)+text(tx+size/2,899,String(size),11,'#77796F','text-anchor="middle"');tx+=size+30;}
board+=text(1131,721,'04  /  PALETTE',11,'#77796F','letter-spacing="1.8"');
for(const [i,c] of [palette.clay,palette.paper,palette.ink].entries())board+=`<rect x="${1131+i*128}" y="777" width="104" height="86" rx="6" fill="${c}" stroke="#DDD7CE"/>`+text(1131+i*128,897,c.toUpperCase(),12,palette.ink);
board+=text(72,1015,'Rillora / Open Folio / Alternative 02',13,palette.ink)+text(1528,1015,'19 SEPTEMBER 2026',11,'#77796F','text-anchor="end" letter-spacing="1.5"');
files['identity-board.svg']=svg(1600,1060,board);
files['hero.svg']=svg(1600,800,`<rect width="1600" height="800" fill="${palette.paper}"/>`+markGroup(249,289,252)+wordGroup(561,297,750));
let proof='<rect width="900" height="440" fill="white"/>';
for(const [i,s] of [16,24,32,64,128].entries()){
 const x=32+i*172;proof+=text(x,32,`${s}px high`,12,'#666')+markGroup(x,65,s*300/270,'#000',s<=24);
 proof+=`<rect x="${x-5}" y="220" width="160" height="175" fill="#000"/>`+markGroup(x,244,s*300/270,'#fff',s<=24);
}
files['optical-proof.svg']=svg(900,440,proof);
// Read-only use of Version 1 sources for a new comparison artifact.
const first=path.join(root,'assets/brand/rillora-identity-20260919');
const embed=(file,x,y,w,h)=>`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${fs.readFileSync(file,'utf8').match(/viewBox="([^"]+)"/)[1]}">${fs.readFileSync(file,'utf8').replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'')}</svg>`;
let compare='<rect width="1600" height="850" fill="#fff"/><rect width="800" height="850" fill="#F5F1E8"/><rect x="800" width="800" height="850" fill="#F6F1E8"/>';
compare+=text(64,70,'01 / FLOWING R',17,'#183B31','letter-spacing="2"')+text(864,70,'02 / OPEN FOLIO',17,palette.ink,'letter-spacing="2"');
compare+=text(64,102,'Retained unchanged',13)+text(864,102,'New alternative',13);
compare+=embed(path.join(first,'lockup-pine.svg'),76,220,648,153);
compare+=`<svg x="866" y="220" width="668" height="155" viewBox="0 0 860 200">${files['lockup-primary.svg'].replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'')}</svg>`;
compare+='<rect x="296" y="480" width="208" height="208" rx="47" fill="#183B31"/>'+embed(path.join(first,'symbol-white.svg'),340,521,120,127);
compare+=`<rect x="1096" y="480" width="208" height="208" rx="47" fill="${palette.clay}"/>`+markGroup(1134,527,132,palette.paper,true);
compare+=text(400,744,'Name-led / serif / pine',15,'#183B31','text-anchor="middle"')+text(1200,744,'Symbol-led / sans serif / clay',15,palette.ink,'text-anchor="middle"');
files['comparison.svg']=svg(1600,850,compare);
(async()=>{
 for(const [n,b] of Object.entries(files))fs.writeFileSync(path.join(out,n),b);
 for(const n of ['identity-board','hero','optical-proof','comparison','app-icon-clay','app-icon-dark','app-icon-light']){let job=sharp(Buffer.from(files[n+'.svg']));if(n.startsWith('app-icon'))job=job.removeAlpha();await job.png().toFile(path.join(out,n+'.png'));}
 for(const n of ['lockup-primary','lockup-white','wordmark-ink'])await sharp(Buffer.from(files[n+'.svg'])).resize({width:1700}).png().toFile(path.join(out,n+'.png'));
 await sharp(Buffer.from(files['favicon.svg'])).resize(32,32).removeAlpha().png().toFile(path.join(out,'favicon-32.png'));
 for(const size of [16,24,32,64,128,256,512])await sharp(Buffer.from(mark(palette.ink,size<=24))).resize({height:size}).png().toFile(path.join(out,`symbol-${size}.png`));
 const manifest={createdAt:new Date().toISOString(),name:'Rillora / Open Folio',status:'SECOND_DESIGN_ALTERNATIVE_NOT_DEPLOYED',preserves:'../rillora-identity-20260919 — unchanged',palette,symbol:'Two explicit Agent-authored Bézier contours reconstructed from a fresh ImageGen concept',wordmark:'Inter Medium, -3% tracking; Figma outline export; font OFL included',opticalVariant:'Expanded central gutter and separated lower tips at 16/24px; also used in icons',appIcon:'1024px RGB, opaque square source; preview masks are separate',scope:'Design files only; no product change or trademark clearance',files:fs.readdirSync(out).filter(n=>/\.(svg|png|txt)$/.test(n)).map(n=>({name:n,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,n))).digest('hex')}))};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({out,files:manifest.files.length,board:path.join(out,'identity-board.png')},null,2));
})();
