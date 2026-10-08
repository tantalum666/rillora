import { build } from 'esbuild';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

test('actual Family component shows factual product features without promising planned access', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'rillora-plan-render-'));
  try {
    const bundle = join(temporary, 'render.cjs');
    await build({ stdin: { contents: `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from './src/i18n/I18nProvider.jsx';
import { createLocaleStore } from './src/i18n/localeStore.js';
import { appCatalogs } from './src/i18n/appCatalogs.js';
import { PlanAccessPreview } from './src/PlanAccessPreview.jsx';
import { normalizeCommercialStatus } from './src/commercialAccess.js';
const boundaries = { serverAuthoritative:true, providerCallbackGrantsAccess:false, clientPurchaseResultGrantsAccess:false, billingStateCanTriggerClaim:false, billingStateCanTriggerDisclosure:false, storefrontPersistedToCustomerProfile:false, oneActiveRenewalProviderPerHouseholdPlan:true };
export function render(locale, plan='free', price=true) {
const commerce = normalizeCommercialStatus({ contractVersion:'commerce-v1', billingOpen:false, serviceMarketCode:'GLOBAL_US', currentAccess:{planCode:plan}, boundaries,
 plans:[{planCode:'free',capabilities:[{code:'matter_map_core',enforcementMode:'included'}]}, {planCode:'family',capabilities:[
  {code:'family_maintenance',enforcementMode:'planned',availability:'planned'},
  {code:'trusted_people_multiple',enforcementMode:'planned',availability:'planned'},
  {code:'adaptive_reviews',enforcementMode:'planned',availability:'planned'}]}],
 offers: price ? [{priceCode:'family_usd_annual_v4',amountMinor:8899,minorUnitExponent:2,currencyCode:'USD',billingInterval:'annual',purchasable:false}] : [],
});
return renderToStaticMarkup(<I18nProvider catalogs={appCatalogs} locale={locale} store={createLocaleStore()}><PlanAccessPreview commerce={commerce} onAccessChanged={()=>{}}/></I18nProvider>);
}`, resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'jsx' }, bundle: true, platform: 'node', format: 'cjs', outfile: bundle, jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'import.meta.env': '{}' } });
    const { render } = createRequire(import.meta.url)(bundle);
    for (const locale of ['en', 'zh-CN']) for (const plan of ['free', 'family']) {
      const html = render(locale, plan);
      assert.match(html, /family-plan-feature/); assert.match(html, /88\.99/);
      assert.equal((html.match(/family-feature-bullet/g) ?? []).length, 2);
      assert.doesNotMatch(html, /Later roadmap|后续规划|Adaptive review reminders|自适应复核提醒|Everything in Free, plus/);
      assert.match(html, locale === 'en' ? /New subscriptions are not available/ : /暂不开放新订阅/);
      assert.doesNotMatch(html, /workspace\.[a-z]+\./);
      assert.doesNotMatch(render(locale, plan, false), /88\.99/);
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
