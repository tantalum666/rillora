import assert from 'node:assert/strict';
import test from 'node:test';
import { providerFallback, providerFallbacks } from '../src/providerMarkModel.js';
import { guideIdentifiers } from '../src/guideIdentifiers.js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
test('every provider has a stable distinct neutral fallback including both Binance entities',()=>{
  assert.deepEqual(Object.keys(providerFallbacks).sort(),[...guideIdentifiers].sort());
  assert.equal(new Set(guideIdentifiers.map(key=>providerFallback(key).initials)).size,guideIdentifiers.length);
  assert.notEqual(providerFallback('binance').initials,providerFallback('binance_us').initials);
  assert.equal(providerFallback('__proto__').initials,'?');
});
test('all six local approved original assets are present, distinct and not remote icon URLs',async()=>{
  const files=['github-invertocat-white.svg','x-logo-white.png','instagram-glyph-white.svg','facebook-primary.png','dropbox-glyph.svg','coinbase-logo-white.svg'];
  const hashes=[];
  for(const file of files){const bytes=await readFile(new URL('../src/assets/official-brands/'+file,import.meta.url));assert.ok(bytes.length>100);hashes.push(createHash('sha256').update(bytes).digest('hex'));}
  assert.equal(new Set(hashes).size,6);
});
