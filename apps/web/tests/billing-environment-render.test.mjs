import { build } from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

test('Apple review enrollment never turns a production Web plan into Stripe test checkout', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'rillora-billing-environment-'));
  try {
    const bundle = join(temporary, 'render.cjs');
    await build({ stdin: { contents: `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from './src/i18n/I18nProvider.jsx';
import { createLocaleStore } from './src/i18n/localeStore.js';
import { appCatalogs } from './src/i18n/appCatalogs.js';
import { PlanAccessPreview } from './src/PlanAccessPreview.jsx';
import { normalizeCommercialStatus, commercialPlanLabel } from './src/commercialAccess.js';
const boundaries = { serverAuthoritative:true, providerCallbackGrantsAccess:false, clientPurchaseResultGrantsAccess:false, billingStateCanTriggerClaim:false, billingStateCanTriggerDisclosure:false, storefrontPersistedToCustomerProfile:false, oneActiveRenewalProviderPerHouseholdPlan:true };
export function render(locale, environment, enrolled) {
  const commerce = normalizeCommercialStatus({ contractVersion:'commerce-v1', billingOpen:true,
    serviceMarketCode:'GLOBAL_US', validationOnly:enrolled, webBillingEnvironment:environment,
    currentAccess:{planCode:'free', subscription:null, managementDestination:'none'}, boundaries,
    plans:[{planCode:'family',capabilities:[{code:'family_maintenance',enforcementMode:'included'}]}],
    offers:[{priceCode:'family_usd_annual_v4',amountMinor:8899,minorUnitExponent:2,currencyCode:'USD',billingInterval:'annual',purchasable:true}] });
  return { label:commercialPlanLabel(commerce), html:renderToStaticMarkup(
    <I18nProvider catalogs={appCatalogs} locale={locale} store={createLocaleStore()}>
      <PlanAccessPreview commerce={commerce} onAccessChanged={()=>{}}/>
    </I18nProvider>) };
}`, resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader:'jsx' },
      bundle:true, platform:'node', format:'cjs', outfile:bundle, jsx:'automatic',
      loader:{'.css':'empty'}, define:{'import.meta.env':'{}'} });
    const { render } = createRequire(import.meta.url)(bundle);
    for (const locale of ['en', 'zh-CN']) {
      for (const environment of ['production', null, undefined]) {
        const { html, label } = render(locale, environment, true);
        assert.match(html, /production-billing-controls/);
        assert.doesNotMatch(html, /test-billing-controls|Test subscription|No charge|测试订阅|不会扣款/);
        assert.equal(label, 'Rillora Free');
      }
      assert.match(render(locale, 'test', true).html, /test-billing-controls/);
      assert.doesNotMatch(render(locale, 'test', false).html, /test-billing-controls/);
      assert.match(render(locale, 'production', false).html, /production-billing-controls/);
    }
  } finally {
    await rm(temporary, {recursive:true, force:true});
  }
});
