const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
let sharp;
try { sharp = require('sharp'); }
catch { sharp = require(process.env.RILLORA_SHARP_MODULE || '/Users/tantalum/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'); }
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'assets/brand/rillora-identity-20260919');
fs.mkdirSync(out, {recursive:true});
const palette={pine:'#183B31',paper:'#F5F1E8',sage:'#CBDDAF',ink:'#141B18'};
// Explicitly reconstructed Bézier contour. No image tracing or imported brand geometry.
const contour='M83 50 H203 C255 50 287 82 287 125 C287 172 253 199 207 199 H160 C206 208 233 229 258 263 C277 289 296 306 316 312 C311 332 289 344 266 344 C230 344 207 324 186 291 C165 258 145 235 120 218 C108 208 105 197 108 186 C113 162 134 151 160 151 H186 C209 151 226 137 226 118 C226 100 211 88 190 88 H93 V299 C93 319 79 331 60 331 H48 C41 331 38 327 38 320 V98 C38 68 54 50 83 50 Z';
// A more open neck and blunter tip keep small-size display clear; this is an optical variant.
const microContour='M83 50 H203 C255 50 287 82 287 125 C287 172 253 199 207 199 H163 C209 211 236 234 259 264 C277 290 295 305 312 311 C303 332 286 341 265 341 C230 341 208 322 187 290 C165 256 149 236 127 219 C117 211 113 199 116 188 C121 163 141 151 165 151 H186 C209 151 226 137 226 118 C226 100 211 88 190 88 H91 V299 C91 319 79 331 60 331 H48 C41 331 38 327 38 320 V98 C38 68 54 50 83 50 Z';
const wordSource=fs.readFileSync(path.join(out,'wordmark-source.svg'),'utf8');
const wordInner=wordSource.replace(/^.*?<svg[^>]*>/s,'').replace(/<\/svg>\s*$/,'').replace(/fill="[^"]*"/g,'fill="currentColor"');
const mark=(color=palette.pine,micro=false)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="30 42 294 310" width="294" height="310" role="img" aria-label="Rillora R symbol"><path fill="${color}" d="${micro?microContour:contour}"/></svg>`;
const markGroup=(x,y,w,color=palette.pine,micro=false)=>`<g transform="translate(${x} ${y}) scale(${w/294}) translate(-30 -42)" fill="${color}"><path d="${micro?microContour:contour}"/></g>`;
const wordGroup=(x,y,w,color=palette.pine)=>`<g color="${color}" transform="translate(${x} ${y}) scale(${w/391})">${wordInner.replaceAll('currentColor',color)}</g>`;
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const font='font-family="Helvetica, Arial, sans-serif"';
const text=(x,y,t,size=16,color='#68756E',extra='')=>`<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${color}" ${extra}>${t}</text>`;
const files={
 'symbol-pine.svg':mark(),
 'symbol-black.svg':mark('#000000'),
 'symbol-white.svg':mark('#FFFFFF'),
 'symbol-micro.svg':mark(palette.pine,true),
 'wordmark-pine.svg':svg(391,109,wordGroup(0,0,391)),
 'lockup-pine.svg':svg(850,200,markGroup(6,8,170)+wordGroup(206,10,628)),
 'lockup-white.svg':svg(850,200,markGroup(6,8,170,'#FFFFFF')+wordGroup(206,10,628,'#FFFFFF')),
 'app-icon-dark.svg':svg(1024,1024,`<rect width="1024" height="1024" fill="${palette.pine}"/>`+markGroup(222,206,580,palette.paper)),
 'app-icon-light.svg':svg(1024,1024,`<rect width="1024" height="1024" fill="${palette.paper}"/>`+markGroup(222,206,580)),
 'favicon.svg':svg(64,64,`<rect width="64" height="64" rx="13" fill="${palette.pine}"/>`+markGroup(7,5,50,palette.paper,true)),
 'app-icon-tinted.svg':svg(1024,1024,`<rect width="1024" height="1024" fill="${palette.pine}"/>`+markGroup(222,206,580,palette.sage))
};
// Review composition: identity only, not a claim that the App has been updated.
let board=`<rect width="1600" height="1060" fill="${palette.paper}"/>`;
board+=text(72,60,'RILLORA',15,palette.pine,'letter-spacing="3.2"');
board+=text(1528,60,'IDENTITY STUDY 01',12,palette.pine,'text-anchor="end" letter-spacing="2"');
board+=`<line x1="72" y1="85" x2="1528" y2="85" stroke="#D9DDD0"/>`;
board+=markGroup(138,268,145)+wordGroup(338,268,544);
board+=text(139,514,'SYMBOL + WORDMARK',11,'#68756E','letter-spacing="2"');
board+=`<rect x="1080" y="194" width="328" height="328" rx="74" fill="${palette.pine}"/>`+markGroup(1152,260,185,palette.paper);
board+=text(1244,561,'Rillora',20,palette.pine,'text-anchor="middle"');
board+=text(1244,592,'APP ICON STUDY',11,'#68756E','text-anchor="middle" letter-spacing="2"');
board+=`<line x1="72" y1="676" x2="1528" y2="676" stroke="#D9DDD0"/>`;
board+=text(72,721,'01  /  SINGLE COLOUR',11,'#68756E','letter-spacing="1.8"');
board+=markGroup(127,778,100,'#000');
board+=text(365,721,'02  /  REVERSED',11,'#68756E','letter-spacing="1.8"');
board+=`<rect x="365" y="750" width="237" height="196" rx="16" fill="${palette.pine}"/>`+markGroup(439,792,90,palette.paper);
board+=text(682,721,'03  /  SMALL SIZES',11,'#68756E','letter-spacing="1.8"');
let tx=682;for(const size of [16,24,32,64]){board+=markGroup(tx,795,size*294/310,palette.pine,size<=24);board+=text(tx+size/2,899,String(size),11,'#68756E','text-anchor="middle"');tx+=size+30;}
board+=text(1131,721,'04  /  PALETTE',11,'#68756E','letter-spacing="1.8"');
for(const [i,c] of [palette.pine,palette.paper,palette.sage].entries()){board+=`<rect x="${1131+i*128}" y="777" width="104" height="86" rx="6" fill="${c}" stroke="#D9DDD0"/>`+text(1131+i*128,897,c.toUpperCase(),12,palette.pine);}
board+=text(72,1015,'Rillora / First identity design',13,palette.pine);
board+=text(1528,1015,'19 SEPTEMBER 2026',11,'#68756E','text-anchor="end" letter-spacing="1.5"');
files['identity-board.svg']=svg(1600,1060,board);
files['hero.svg']=svg(1600,800,`<rect width="1600" height="800" fill="${palette.paper}"/>`+markGroup(282,292,204)+wordGroup(546,292,775));
// At native pixels, not scaled labels presented as optical proof.
let proof='<rect width="900" height="440" fill="white"/>';
for(const [i,s] of [16,24,32,64,128].entries()){
const x=36+i*172;proof+=text(x,32,`${s}px`,12,'#666');proof+=markGroup(x,65,s*294/310,'#000',s<=24);
proof+=`<rect x="${x-8}" y="220" width="154" height="175" fill="#000"/>`+markGroup(x,244,s*294/310,'#fff',s<=24);
}
files['optical-proof.svg']=svg(900,440,proof);
(async()=>{
 for(const [name,body] of Object.entries(files)) fs.writeFileSync(path.join(out,name),body);
 for(const name of ['identity-board','hero','optical-proof','app-icon-dark','app-icon-light','app-icon-tinted']) {
  let render=sharp(Buffer.from(files[name+'.svg']));
  if(name.startsWith('app-icon-')) render=render.removeAlpha();
  await render.png().toFile(path.join(out,name+'.png'));
 }
 for(const name of ['lockup-pine','lockup-white','wordmark-pine']) await sharp(Buffer.from(files[name+'.svg'])).resize({width:1700}).png().toFile(path.join(out,name+'.png'));
 await sharp(Buffer.from(files['favicon.svg'])).resize(32,32).removeAlpha().png().toFile(path.join(out,'favicon-32.png'));
 for(const size of [16,24,32,64,128,256,512]) await sharp(Buffer.from(mark(palette.pine,size<=24))).resize({height:size}).png().toFile(path.join(out,`symbol-${size}.png`));
 const manifest={createdAt:new Date().toISOString(),status:'FIRST_DESIGN_NOT_DEPLOYED',name:'Rillora / Flowing R',palette,
 symbol:'Agent-authored Bézier vector reconstruction informed by the built-in ImageGen R concept; not an automatic bitmap trace',
 wordmark:'Source Serif 4 SemiBold, tracked -1.4%, Figma outlined export; not a custom font claim',
 smallSize:'Use micro contour for 16/24px; source artwork remains vector',
 appIcon:'Opaque 1024px square masters; rounded masks are preview only',
 publicUse:'No product deployment, trademark clearance, App Store submission or Owner final adoption claimed',
 files:fs.readdirSync(out).filter(n=>/\.(svg|png|txt)$/.test(n)).map(n=>({name:n,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,n))).digest('hex')}))};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({out,files:manifest.files.length,review:path.join(out,'identity-board.png')},null,2));
})();
