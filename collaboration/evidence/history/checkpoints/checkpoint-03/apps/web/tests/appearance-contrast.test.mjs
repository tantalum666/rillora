import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const css=await readFile(new URL('../src/appearance.css',import.meta.url),'utf8');
function luminance(hex){
  const rgb=hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(a,b){const l=[luminance(a),luminance(b)].sort((x,y)=>x-y);return(l[1]+.05)/(l[0]+.05);}
const blocks=[...css.matchAll(/:root(?:\[data-appearance="light"\])?\s*\{([^}]+)\}/g)];
for(const [index,block] of blocks.entries()){
  const colors=Object.fromEntries([...block[1].matchAll(/--([\w-]+):\s*(#[\da-f]{6});/gi)].map(m=>[m[1],m[2]]));
  test(`${index?'light':'dark'} semantic text and primary actions meet 4.5:1`,()=>{
    for(const background of ['canvas','surface','surface-muted'])for(const foreground of ['ink','body','muted','sage']){
      assert.ok(contrast(colors[background],colors[foreground])>=4.5,`${foreground} on ${background}`);
    }
    for(const background of ['clay','clay-hover','accent'])assert.ok(contrast(colors[background],colors[background==='accent'?'on-accent':'on-clay'])>=4.5,background);
  });
}
