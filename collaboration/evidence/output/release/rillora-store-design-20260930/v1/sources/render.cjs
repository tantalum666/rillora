const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
let sharp;try{sharp=require('sharp');}catch{sharp=require(process.env.RILLORA_SHARP_MODULE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));}
const out=path.resolve(__dirname,'..');
(async()=>{const all=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))).items;
for(const item of all){await sharp(path.join(out,item.svg)).flatten({background:'#f5f1e8'}).jpeg({quality:96,chromaSubsampling:'4:4:4'}).toFile(path.join(out,item.output));}
for(const device of ['iphone','ipad']){const items=all.filter(x=>x.id.startsWith(device));const width=device==='iphone'?330:480,pad=24,height=Math.round(width*items[0].height/items[0].width),overlays=[];
for(let i=0;i<items.length;i++)overlays.push({input:await sharp(path.join(out,items[i].output)).resize({width}).toBuffer(),left:pad+i*(width+pad),top:pad});
await sharp({create:{width:pad+(width+pad)*items.length,height:height+pad*2,channels:3,background:'#E9EAE6'}}).composite(overlays).jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(path.join(out,device+'-series-preview.jpg'));}
console.log('Rendered six final JPEGs and two supplemental preview sheets.');})().catch(e=>{console.error(e.message);process.exitCode=1;});
