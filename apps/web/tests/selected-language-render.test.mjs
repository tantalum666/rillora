import { build } from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { disclosureStateLabel, disclosureStageLabel, disclosureReasonLabel } from '../src/disclosurePresentation.js';

test('all seven legal pages and both consent sentences render only the selected language', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rillora-language-render-'));
  try {
    const output = join(directory, 'render.cjs');
    await build({ stdin: { contents: `
      import React from 'react';
      import { renderToStaticMarkup } from 'react-dom/server';
      import { I18nStoreProvider } from './src/i18n/I18nProvider.jsx';
      import { createLocaleStore } from './src/i18n/localeStore.js';
      import { publicCatalogs } from './src/i18n/publicCatalogs.js';
      import { LegalDocumentPage, legalDocumentSectionIds } from './src/LegalDocumentPage.jsx';
      import { RegistrationConsentText, SubscriptionConsentText } from './src/LegalConsentText.jsx';
      import { LanguageControl } from './src/i18n/LanguageControl.jsx';
      export { legalDocumentSectionIds };
      export function render(locale, key) {
        const content = key === 'consent' ? <><RegistrationConsentText external /><SubscriptionConsentText /><LanguageControl /></>
          : <LegalDocumentPage documentKey={key} onBack={()=>{}} />;
        return renderToStaticMarkup(<I18nStoreProvider catalogs={publicCatalogs} locale={locale} store={createLocaleStore()}>{content}</I18nStoreProvider>);
      }
    `, resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'jsx' },
      bundle: true, platform: 'node', format: 'cjs', outfile: output, jsx: 'automatic', loader: { '.css': 'empty' },
      define: { 'import.meta.env': JSON.stringify({ VITE_LEGAL_OPERATOR_NAME: 'Test Operator', VITE_LEGAL_OPERATOR_COUNTRY: 'Hong Kong', VITE_LEGAL_SERVICE_ADDRESS: 'Test address' }) } });
    const { render, legalDocumentSectionIds } = createRequire(import.meta.url)(output);
    assert.equal(Object.keys(legalDocumentSectionIds).length, 7);
    let sections = 0;
    for (const [key, ids] of Object.entries(legalDocumentSectionIds)) {
      assert.deepEqual(ids.en, ids['zh-CN']); sections += ids.en.length;
      const en = render('en', key), zh = render('zh-CN', key);
      assert.doesNotMatch(en.replace(/<[^>]*>/g, ''), /[\u3400-\u9fff]/);
      assert.match(zh, /返回 Rillora/);
      assert.doesNotMatch(zh, /English controls|English version|中文参考|英文为准|英文原文|Back to Rillora|Privacy Policy|Terms of Service/);
      assert.equal((en.match(/<section id=/g) ?? []).length, ids.en.length);
      assert.equal((zh.match(/<section id=/g) ?? []).length, ids.en.length);
      for (const href of [...zh.matchAll(/href="([^"#][^"]*)"/g)].map(match => match[1])) {
        if (href.startsWith('/')) assert.match(href, /lang=zh-CN/);
      }
    }
    assert.equal(sections, 60);
    const en = render('en', 'consent'), zh = render('zh-CN', 'consent');
    assert.match(en, /I agree to the/); assert.doesNotMatch(en, /[\u3400-\u9fff]/);
    assert.match(zh, /我同意/); assert.match(zh, /电子记录/); assert.match(zh, /lang=zh-CN/);
    assert.doesNotMatch(zh, /I agree|English|Language \/|中文参考|英文/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('shared disclosure vocabulary localizes codes without using arbitrary server text as a translation key', () => {
  assert.equal(disclosureStateLabel('death_identity_review', 'zh-CN'), '身份核验');
  assert.equal(disclosureStateLabel('missing_appealed', 'zh-CN'), '申诉处理中');
  assert.equal(disclosureStageLabel('locator', 'en'), 'Locator');
  assert.match(disclosureReasonLabel('Only matter-specific recipient assignments are projected.', 'zh-CN'), /接收人/);
  assert.equal(disclosureReasonLabel('private unrecognized user content', 'zh-CN'), '暂无补充说明。');
});
