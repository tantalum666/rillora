import assert from 'node:assert/strict';
import test from 'node:test';
import { browserLocale, createTranslator, createFormatters, mergeCatalogs, validateCatalogs } from '../src/i18n/core.js';
import { createLocaleStore, withLocale, LOCALE_STORAGE_KEY } from '../src/i18n/localeStore.js';
import { errorMessage } from '../src/i18n/errors.js';
import * as common from '../src/i18n/messages/common.js';

const sample = { en: { hello: 'Hello {name}', count: { one: '{count} item', other: '{count} items' }, fallback: 'English fallback' }, 'zh-CN': { hello: '你好，{name}', count: { other: '{count} 项' } } };
const memory = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value), removeItem: key => values.delete(key), values };
};

test('supported browser languages resolve in preference order with English fallback', () => {
  assert.equal(browserLocale(['fr-FR','zh-Hans-CN','en-US']), 'zh-CN');
  assert.equal(browserLocale(['en-GB','zh-CN']), 'en');
  assert.equal(browserLocale(['zh-Hant-HK']), 'zh-CN'); // Honest Simplified Chinese fallback, not a Traditional translation.
  assert.equal(browserLocale(['ja-JP', null]), 'en');
});
test('translation uses named interpolation, plural rules and safe English fallback', () => {
  const en = createTranslator('en', sample), zh = createTranslator('zh-CN', sample);
  assert.equal(en('hello',{name:'Ada'}),'Hello Ada');
  assert.equal(zh('hello',{name:'<img src=x>'}),'你好，<img src=x>'); // String only; React escapes at rendering, never HTML.
  assert.equal(en('count',{count:1}),'1 item');
  assert.equal(en('count',{count:2}),'2 items');
  assert.equal(zh('count',{count:1}),'1 项');
  assert.equal(zh('count',{count:2000}),'2,000 项');
  assert.equal(zh('fallback'),'English fallback');
  assert.equal(createTranslator('zh-CN',{en:sample.en,'zh-CN':{}})('count',{count:1}),'1 item');
  assert.equal(zh('missing'),'missing');
  assert.equal(zh('hello'),'你好，{name}');
  assert.equal(createTranslator('invalid',sample)('fallback'),'English fallback');
});
test('catalog checks catch omissions, untranslated parameter drift and duplicate keys', () => {
  assert.deepEqual(validateCatalogs(mergeCatalogs(common)), []);
  assert.match(validateCatalogs(sample).join(' '), /missing fallback/);
  assert.match(validateCatalogs({en:{x:'Hello {name}'},'zh-CN':{x:'你好 {person}'}}).join(' '), /placeholder mismatch/);
  assert.throws(() => mergeCatalogs(common,common), /Duplicate translation key/);
});
test('formatters retain actual currency and minor-unit amount', () => {
  const zh = createFormatters('zh-CN');
  assert.match(zh.formatMoney(8899,'USD',2), /USD\s*88\.99/);
  assert.match(zh.formatMoney(1000,'JPY',0), /JPY\s*1,000/);
  assert.throws(() => zh.formatMoney(1.5), /Invalid/);
  assert.equal(zh.formatDate('not-a-date'),'—');
  assert.equal(zh.formatDate(null),'—');
  assert.match(zh.formatDate('2026-10-05T00:00:00Z',{timeZone:'UTC',dateStyle:'long'}), /2026年10月5日/);
});
test('manual choice persists without changing any account or appearance preference', () => {
  const storage=memory({'other-setting':'keep'}), attributes={};
  const store=createLocaleStore({getStorage:()=>storage,languages:['en-US'],document:{documentElement:{setAttribute:(k,v)=>{attributes[k]=v;}}}});
  let updates=0;const unsubscribe=store.subscribe(()=>updates++);
  assert.equal(store.getSnapshot().locale,'en');
  assert.equal(store.getSnapshot().preference,null);
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY),null);
  assert.equal(store.setLocale('zh-CN'),true);
  assert.equal(attributes.lang,'zh-CN');
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY),'zh-CN');
  assert.equal(storage.getItem('other-setting'),'keep');
  assert.equal(createLocaleStore({getStorage:()=>storage,languages:['en-US']}).getSnapshot().locale,'zh-CN');
  assert.equal(store.setLocale('arbitrary'),false);
  assert.equal(updates,1);
  unsubscribe();store.reset();
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY),null);
  assert.equal(store.getSnapshot().locale,'en');
});
test('blocked storage still allows switching and exposes accurate persistence state', () => {
  const store=createLocaleStore({getStorage:()=>{throw new Error('blocked');},languages:['zh-CN']});
  assert.equal(store.getSnapshot().locale,'zh-CN');
  store.setLocale('en');
  assert.deepEqual(store.getSnapshot(),{locale:'en',persistenceAvailable:false,preference:'en'});
  const writeBlocked=createLocaleStore({getStorage:()=>({getItem:()=>null,setItem:()=>{throw new Error('quota');}})});
  writeBlocked.setLocale('zh-CN');
  assert.equal(writeBlocked.getSnapshot().persistenceAvailable,false);
});
test('invalid stored values fall back to browser language without affecting other storage', () => {
  const storage=memory({[LOCALE_STORAGE_KEY]:'<script>',private:'untouched'});
  const store=createLocaleStore({getStorage:()=>storage,languages:['zh-CN']});
  assert.equal(store.getSnapshot().locale,'zh-CN');
  assert.equal(storage.getItem('private'),'untouched');
});
test('locale link handoff is origin-bounded and preserves invitation/query state', () => {
  const source='https://app.rillora.xyz/invite/abc?appearance=dark&next=shared#invitation=opaque';
  const url=new URL(withLocale(source,'zh-CN'));
  assert.equal(url.searchParams.get('lang'),'zh-CN');
  assert.equal(url.searchParams.get('appearance'),'dark');
  assert.equal(url.hash,'#invitation=opaque');
  for(const value of ['/account','https://legal.rillora.xyz/terms','https://login.rillora.xyz/authorize','https://evil.test/?url=https://app.rillora.xyz','https://app.rillora.xyz.evil.test/','javascript:alert(1)']) assert.equal(withLocale(value,'zh-CN'),value);
  assert.equal(withLocale(source,'bad'),source);
});
test('received locale handoff consumes only lang and preserves history identity', () => {
  const storage=memory(), state={navigation:'preserved'};let replaced;
  const store=createLocaleStore({getStorage:()=>storage,languages:['en'],location:{href:'https://app.rillora.xyz/invite/abc?lang=zh-CN&appearance=dark&next=shared#invitation=opaque'},history:{state,replaceState:(...args)=>{replaced=args;}}});
  assert.equal(store.getSnapshot().locale,'zh-CN');
  assert.deepEqual(replaced,[state,'','/invite/abc?appearance=dark&next=shared#invitation=opaque']);
});
test('cross-tab changes and reset update subscribers and remove their listener on disposal', () => {
  const target=new EventTarget(),storage=memory();const store=createLocaleStore({getStorage:()=>storage,languages:['en'],eventTarget:target});
  const change=(key,newValue)=>{const event=new Event('storage');Object.defineProperties(event,{key:{value:key},newValue:{value:newValue}});target.dispatchEvent(event);};
  change('unrelated','zh-CN');assert.equal(store.getSnapshot().locale,'en');
  change(LOCALE_STORAGE_KEY,'zh-CN');assert.equal(store.getSnapshot().locale,'zh-CN');
  change(null,null);assert.equal(store.getSnapshot().locale,'en');
  store.dispose();change(LOCALE_STORAGE_KEY,'zh-CN');assert.equal(store.getSnapshot().locale,'en');
});
test('errors localize known codes without interpreting arbitrary server content', () => {
  const t=createTranslator('zh-CN',mergeCatalogs(common));
  assert.match(errorMessage({code:'reauthentication_required'},t),/重新登录/);
  assert.match(errorMessage({message:'private body <script>'},t),/未能完成请求/);
  assert.match(errorMessage({status:429},t),/频繁/);
});

test('automatic browser language is not persisted or carried as an explicit choice', () => {
  const storage=memory();const store=createLocaleStore({getStorage:()=>storage,languages:['zh-CN']});
  assert.equal(store.getSnapshot().locale,'zh-CN');
  assert.equal(store.getSnapshot().preference,null);
  assert.equal(storage.getItem(LOCALE_STORAGE_KEY),null);
  assert.equal(withLocale('https://app.rillora.xyz/account',store.getSnapshot().preference),'https://app.rillora.xyz/account');
  store.setLocale('zh-CN');assert.equal(store.getSnapshot().preference,'zh-CN');
  store.reset();assert.equal(store.getSnapshot().preference,null);
});
