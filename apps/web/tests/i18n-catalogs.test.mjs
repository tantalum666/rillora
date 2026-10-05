import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { appCatalogs } from '../src/i18n/appCatalogs.js';
import { publicCatalogs } from '../src/i18n/publicCatalogs.js';
import { createTranslator, validateCatalogs } from '../src/i18n/core.js';

const root=new URL('../src/',import.meta.url);
async function sources(directory=root) {
  const result=[];
  for(const item of await readdir(directory,{withFileTypes:true})) {
    if(item.name==='assets'||item.name==='messages') continue;
    const url=new URL(item.name+(item.isDirectory()?'/':''),directory);
    if(item.isDirectory()) result.push(...await sources(url));
    else if(/\.(jsx?|mjs)$/.test(item.name)) result.push([url,await readFile(url,'utf8')]);
  }
  return result;
}

test('all application and public messages have complete, parameter-compatible bilingual catalogs',()=>{
  assert.deepEqual(validateCatalogs(appCatalogs),[]);
  assert.deepEqual(validateCatalogs(publicCatalogs),[]);
  assert.ok(Object.keys(appCatalogs.en).length>1000);
  assert.ok(Object.keys(publicCatalogs.en).every(key=>key.startsWith('common.')||key.startsWith('public.')));
});
test('literal translation references and stored local-message keys resolve in both languages',async()=>{
  const missing=[];
  for(const [url,source] of await sources()) {
    for(const match of source.matchAll(/["']((?:common|forms|public|workspace|sharing)\.[A-Za-z0-9_.-]+)["']/g)) {
      // Runtime code uses some namespace prefixes when constructing an enum key.
      if(match[1].endsWith('.')) continue;
      // Audit action enums are API data, not message IDs. The view prefixes workspace.audit.
      if(/^sharing\.(invitation_created|invitation_regenerated|invitation_accepted|scope_updated|connection_revoked)$/.test(match[1])) continue;
      if(!Object.hasOwn(appCatalogs.en,match[1])) missing.push(`${url.pathname.split('/src/')[1]}: ${match[1]}`);
    }
  }
  assert.deepEqual(missing,[]);
});
test('catalog lookup preserves arbitrary user text literally as interpolation data',()=>{
  for(const locale of ['en','zh-CN']) {
    const t=createTranslator(locale,appCatalogs);
    const sample='Keep 原文 <script>alert(1)</script> {name}';
    assert.ok(t('common.appearance.current',{mode:sample}).includes(sample));
  }
});
