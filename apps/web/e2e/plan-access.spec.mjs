import { test, expect } from '@playwright/test';
import { APP, isolate } from './fixtures.mjs';
import contract from '../../../config/purchase-consent.json' with { type: 'json' };
const boundaries = { serverAuthoritative: true, providerCallbackGrantsAccess: false, clientPurchaseResultGrantsAccess: false, billingStateCanTriggerClaim: false, billingStateCanTriggerDisclosure: false, storefrontPersistedToCustomerProfile: false, oneActiveRenewalProviderPerHouseholdPlan: true };
const catalog = {
  contractVersion: 'commerce-v1', billingOpen: true, serviceMarketCode: 'GLOBAL_US', currentAccess: { planCode: 'free' },
  plans: [{ planCode: 'free', capabilities: [{ code: 'matter_map_core', enforcementMode: 'included' }, { code: 'data_export', enforcementMode: 'included' }] },
    { planCode: 'family', capabilities: [{ code: 'family_maintenance', enforcementMode: 'included', availability: 'available' }, { code: 'trusted_people_multiple', enforcementMode: 'included', availability: 'available' }, { code: 'adaptive_reviews', enforcementMode: 'planned', availability: 'planned' }] }],
  offers: [{ priceCode: contract.priceCode, amountMinor: contract.amountMinor, currencyCode: contract.currency, minorUnitExponent: 2, billingInterval: 'annual', purchasable: true }], boundaries,
};
async function commerceFixture(context, state) {
  await context.route('**/api/v1/commerce/**', route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (req.method() !== 'GET') state.writes.push({ path, body: req.postDataJSON() });
    if (path.endsWith('/commerce/status')) return route.fulfill({ json: state.catalog });
    if (path.endsWith('/test/status') && state.testUnavailable) return route.fulfill({ status: 404, json: { error: { code: 'not_found' } } });
    if (path.endsWith('/test/status')) return route.fulfill({ json: { contractVersion: 'commerce-stripe-test-v1', testOnly: true, validationOnly: true, orders: [], subscriptions: [] } });
    if (path.endsWith('/stripe/status')) return route.fulfill({ json: { contractVersion: 'commerce-stripe-production-v1', testOnly: false, subscription: state.subscription ?? null, canManage: Boolean(state.subscription), checkoutPending: false } });
    if (path.endsWith('/purchase-route')) return route.fulfill({ json: { contractVersion: 'commerce-v1', purchaseRoute: 'web_direct', reason: 'available', requiresFreshEvaluation: true, boundaries } });
    if (path.endsWith('/stripe/quote')) return route.fulfill({ json: { contractVersion: 'commerce-stripe-production-v1', requiresFreshEvaluation: true, applicableTaxShownAtCheckout: true, purchaseConsent: contract } });
    state.unexpected.push(path); return route.fulfill({ status: 409, json: { error: { code: 'qa_mutation_blocked' } } });
  });
}
for (const locale of ['en', 'zh-CN']) for (const width of [320, 390, 768, 1280, 1920]) {
  test(`Family-first plans and settings ${locale} ${width}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width, height: 1000 }, colorScheme: width === 390 || width === 1920 ? 'dark' : 'light' });
    const state = await isolate(context, { catalog: structuredClone(catalog) }); await commerceFixture(context, state);
    const page = await context.newPage(); await page.goto(APP + '/?view=access');
    const card = page.locator('.family-plan-feature'), status = page.locator('.current-access-status');
    await expect(card).toBeVisible(); await expect(card.locator('.primary-button')).toBeVisible();
    const cardBox = await card.boundingBox();
    for (const button of await card.locator('button').all()) { const box = await button.boundingBox(); if (box) { expect(box.x).toBeGreaterThanOrEqual(cardBox.x); expect(box.x + box.width).toBeLessThanOrEqual(cardBox.x + cardBox.width); } }
    await expect(status).toContainText(locale === 'en' ? 'Free' : '免费版');
    await expect(card.locator('.family-plan-price')).toContainText('88.99');
    await expect(card.locator('.commercial-feature-list li')).toHaveCount(2);
    await expect(page.locator('body')).not.toContainText(/Later roadmap|后续规划|Adaptive review reminders|自适应复核/);
    expect(await card.locator('h2').first().evaluate(e => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(await status.evaluate(e => parseFloat(getComputedStyle(e).fontSize)));
    await expect(page.getByRole('button', { name: /My plan|我的计划/, exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const freeDetails = page.locator('.plan-disclosure').first(); await freeDetails.locator('summary').focus(); await page.keyboard.press('Enter'); await expect(freeDetails).toHaveAttribute('open', ''); await page.keyboard.press('Enter'); await expect(freeDetails).not.toHaveAttribute('open', '');
    await page.screenshot({ path: test.info().outputPath(`plans-${locale}-${width}.png`), fullPage: true });
    await page.goto(APP + '/?view=settings'); await expect(page.locator('.account-identity-panel')).toContainText('owner@example.test');
    await expect(page.locator('.language-control select')).toHaveCount(1); await expect(page.locator('.account-language select')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`settings-${locale}-${width}.png`), fullPage: true });
    await page.locator('.settings-card button').nth(1).click(); await expect(page.locator('dialog.drawer')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.locator('dialog.drawer')).toHaveCount(0); await expect(page).toHaveURL(/view=settings/);
    await page.locator('.settings-card button').first().click(); await expect(card).toBeVisible(); await page.goBack(); await expect(page.locator('.account-identity-panel')).toBeVisible();
    await page.goto(APP + '/?view=plan'); await expect(page).not.toHaveURL(/view=plan/); await expect(page.locator('.family-plan-feature')).toHaveCount(0);
    expect(state.writes).toEqual([]); expect(state.unexpected).toEqual([]); expect(state.errors).toEqual([]); await context.close();
  });
}
for (const locale of ['en', 'zh-CN']) {
  test(`Plan lifecycle presentation preserves purchase consent and management ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width: 1280, height: 1000 } });
    const state = await isolate(context, { catalog: structuredClone(catalog) }); await commerceFixture(context, state); const page = await context.newPage();
    await page.goto(APP + '/?view=access');
    const billing = page.locator('.production-billing-controls');
    await billing.locator('.primary-button').click(); const consent = billing.locator('input[type=checkbox]');
    await expect(consent).not.toBeChecked(); await expect(billing.locator('button[type=submit]')).toBeDisabled();
    await consent.check(); await expect(billing.locator('button[type=submit]')).toBeEnabled();
    await billing.locator('form button[type=button]').click(); await expect(consent).toHaveCount(0);
    await billing.locator('.primary-button').click(); await expect(consent).not.toBeChecked();
    await billing.locator('form button[type=button]').click();
    state.catalog.currentAccess = { planCode: 'family' }; state.subscription = { state: 'active', cancelAtPeriodEnd: false, currentPeriodEndsAt: '2027-10-08T12:00:00Z' };
    await page.reload(); await expect(billing.locator('.primary-button')).toHaveCount(0); await expect(billing.getByRole('button', { name: locale === 'en' ? 'Manage subscription' : '管理订阅' })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`subscribed-${locale}.png`), fullPage: true });
    state.catalog.currentAccess = { planCode: 'free' }; state.catalog.billingOpen = false; state.subscription = { state: 'expired_read_only', cancelAtPeriodEnd: false, currentPeriodEndsAt: '2026-01-01T12:00:00Z' };
    await page.reload(); await expect(billing.locator('.primary-button')).toHaveCount(0); await expect(page.locator('.current-access-status')).toContainText(locale === 'en' ? 'Free' : '免费版');
    await expect(page.locator('.family-plan-price')).toContainText('88.99');
    state.catalog.plans[1].capabilities = state.catalog.plans[1].capabilities.map(item => ({ ...item, enforcementMode: 'planned', availability: 'planned' }));
    await page.reload(); await expect(page.locator('.family-plan-feature .commercial-feature-list li')).toHaveCount(2);
    await expect(page.locator('.family-plan-feature .commercial-feature-list svg')).toHaveCount(0);
    await expect(page.locator('.family-plan-availability')).toContainText(locale === 'en' ? 'not available' : '暂不开放');
    await expect(billing.locator('.primary-button')).toHaveCount(0);
    state.catalog.offers = [{ ...catalog.offers[0], priceCode: 'family_usd_annual_v1', amountMinor: 9900 }];
    await page.reload(); await expect(page.locator('.family-plan-price')).not.toContainText(/99.00|88.99/); await expect(page.locator('.family-plan-price')).toContainText(locale === 'en' ? 'unavailable' : '无法获取');
    expect(state.writes.map(x => x.path)).toEqual(['/api/v1/commerce/purchase-route', '/api/v1/commerce/purchase-route']);
    expect(state.unexpected).toEqual([]); expect(state.errors).toEqual([]); await context.close();
  });
}

for (const locale of ['en', 'zh-CN']) {
  test(`Enrolled Stripe TEST entry remains visible while ordinary sales are closed ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 960 } });
    const state = await isolate(context, { catalog: { ...structuredClone(catalog), billingOpen: false, validationOnly: true } });
    await commerceFixture(context, state); const page = await context.newPage(); await page.goto(APP + '/?view=access');
    const testBilling = page.locator('.test-billing-controls');
    await expect(testBilling).toBeVisible(); await expect(page.locator('.production-billing-controls')).toHaveCount(0);
    await expect(testBilling.locator('.primary-button')).toBeDisabled();
    await testBilling.locator('input[type=checkbox]').check(); await expect(testBilling.locator('.primary-button')).toBeEnabled();
    await page.screenshot({ path: test.info().outputPath(`stripe-test-entry-${locale}.png`), fullPage: true });
    state.testUnavailable = true; await page.reload(); await expect(testBilling.getByRole('alert')).toContainText(locale === 'en' ? 'not available in this environment' : '当前环境未提供');
    await expect(testBilling.locator('.primary-button')).toBeDisabled();
    expect(state.writes).toEqual([]); expect(state.errors).toEqual([]); await context.close();
  });
}
