import { test, expect } from '@playwright/test';
import { APP, isolate } from './fixtures.mjs';
import contract from '../../../config/purchase-consent.json' with { type: 'json' };
const boundaries = { serverAuthoritative: true, providerCallbackGrantsAccess: false, clientPurchaseResultGrantsAccess: false, billingStateCanTriggerClaim: false, billingStateCanTriggerDisclosure: false, storefrontPersistedToCustomerProfile: false, oneActiveRenewalProviderPerHouseholdPlan: true };
const catalog = {
  contractVersion: 'commerce-v1', billingOpen: true, serviceMarketCode: 'GLOBAL_US', currentAccess: { planCode: 'free' },
  plans: [{ planCode: 'free', capabilities: [{ code: 'matter_map_core', enforcementMode: 'included' }] },
    { planCode: 'family', capabilities: [{ code: 'family_maintenance', enforcementMode: 'included', availability: 'available' }, { code: 'trusted_people_multiple', enforcementMode: 'included', availability: 'available' }] }],
  offers: [{ priceCode: contract.priceCode, amountMinor: contract.amountMinor, currencyCode: contract.currency, minorUnitExponent: 2, billingInterval: 'annual', purchasable: true }], boundaries,
};
async function commerceFixture(context, overrides = {}) {
  const state = await isolate(context, { catalog: structuredClone(catalog), reads: [], ...overrides });
  await context.route('**/api/v1/commerce/**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    if (req.method() !== 'GET') state.writes.push({ path, body: req.postDataJSON(), retryKey: req.headers()['idempotency-key'] });
    else state.reads.push(path);
    if (path.endsWith('/commerce/status')) return route.fulfill({ json: state.catalog });
    if (path.endsWith('/test/status') && state.testUnavailable) return route.fulfill({ status: 404, json: { error: { code: 'not_found' } } });
    if (path.endsWith('/test/status')) return route.fulfill({ json: { contractVersion: 'commerce-stripe-test-v1', testOnly: true, validationOnly: true, orders: [], subscriptions: state.subscription ? [state.subscription] : [] } });
    if (path.endsWith('/stripe/status')) return route.fulfill({ json: { contractVersion: 'commerce-stripe-production-v1', testOnly: false, subscription: state.subscription ?? null, canManage: Boolean(state.subscription), checkoutPending: false } });
    if (path.endsWith('/purchase-route')) return route.fulfill({ json: { contractVersion: 'commerce-v1', purchaseRoute: state.routeBlocked ? 'none' : 'web_direct', reason: state.routeBlocked ? 'unavailable' : 'available', requiresFreshEvaluation: true, boundaries } });
    if (path.endsWith('/stripe/quote')) return route.fulfill({ json: { contractVersion: 'commerce-stripe-production-v1', requiresFreshEvaluation: true, applicableTaxShownAtCheckout: true, purchaseConsent: { ...contract, ...state.quoteChange } } });
    if (path.endsWith('/checkout') || path.endsWith('/portal')) {
      if (state.pauseCheckout) await new Promise(resolve => { state.releaseCheckout = resolve; });
      const testOnly = path.includes('/test/'), kind = path.endsWith('/checkout') ? 'checkout' : 'portal';
      return route.fulfill({ json: { contractVersion: `commerce-stripe-${testOnly ? 'test' : 'production'}-v1`, [kind]: { testOnly: state.wrongProviderMode ? !testOnly : testOnly, url: `https://${kind === 'checkout' ? 'checkout' : 'billing'}.stripe.com/isolated-fixture` }, boundaries: { callbackGrantsAccess: false, providerSnapshotRequired: true } } });
    }
    state.unexpected.push(path); return route.fulfill({ status: 409, json: { error: { code: 'qa_mutation_blocked' } } });
  });
  // Entirely intercepted synthetic destinations. No request reaches Stripe or any real account.
  await context.route(/^https:\/\/(checkout|billing)\.stripe\.com\//, route => route.fulfill({ contentType: 'text/html', body: '<title>Isolated provider fixture</title>' }));
  return state;
}
const subscribeLabel = locale => locale === 'en' ? 'Subscribe to Family' : '订阅家庭版';
const manageLabel = locale => locale === 'en' ? 'Manage subscription' : '管理订阅';
const subscription = { state: 'active', cancelAtPeriodEnd: false, currentPeriodEndsAt: '2027-10-08T12:00:00Z' };
function clean(state) { expect(state.unexpected).toEqual([]); expect(state.errors).toEqual([]); }

for (const locale of ['en', 'zh-CN']) for (const width of [320, 390, 768, 1280, 1920]) {
  test(`One paid plan, price and subscribe action ${locale} ${width}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width, height: 1000 }, colorScheme: width === 390 || width === 1920 ? 'dark' : 'light' });
    const state = await commerceFixture(context); const page = await context.newPage(); await page.goto(APP + '/?view=access');
    const card = page.locator('.family-plan-feature'), action = card.locator('.primary-button');
    await expect(action).toHaveText(subscribeLabel(locale)); await expect(action).toBeEnabled();
    await expect(card.locator('.commercial-feature-list li')).toHaveCount(3);
    await expect(card.locator('.family-plan-price')).toContainText('88.99');
    await expect(card.locator('.family-plan-price')).toContainText(/USD|US\$|美元/);
    await expect(page.locator('.current-access-status, .plan-disclosure, input[type=checkbox]')).toHaveCount(0);
    await expect(card.getByRole('button')).toHaveCount(1);
    await expect(card.locator('.billing-disclosure a')).toHaveCount(2);
    for (const link of await card.locator('.billing-disclosure a').all()) await expect(link).toHaveAttribute('href', new RegExp(`lang=${locale}`));
    await expect(card).not.toContainText(/Free|免费版|Refresh|刷新|Later roadmap|后续规划/);
    const cardBox = await card.boundingBox(), buttonBox = await action.boundingBox();
    expect(buttonBox.x).toBeGreaterThanOrEqual(cardBox.x); expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`plans-${locale}-${width}.png`), fullPage: true });
    expect(state.writes).toEqual([]); clean(state); await context.close();
  });
}
for (const locale of ['en', 'zh-CN']) {
  test(`Closed sales still show the paid offer and disabled subscribe ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const state = await commerceFixture(context, { catalog: { ...structuredClone(catalog), billingOpen: false } });
    const page = await context.newPage(); await page.goto(APP + '/?view=access');
    await expect(page.getByRole('button', { name: subscribeLabel(locale), exact: true })).toBeDisabled();
    await expect(page.locator('.family-plan-feature')).toContainText(locale === 'en' ? 'New subscriptions are not available' : '暂未开放新订阅');
    await expect(page.locator('.family-plan-price')).toContainText('88.99');
    expect(state.writes).toEqual([]); clean(state); await context.close();
  });
  test(`One explicit click accepts the displayed annual offer and creates one checkout ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const state = await commerceFixture(context, { pauseCheckout: true }); const page = await context.newPage(); await page.goto(APP + '/?view=access');
    const action = page.getByRole('button', { name: subscribeLabel(locale), exact: true }); await expect(action).toBeEnabled();
    expect(state.writes).toEqual([]);
    await action.click({ clickCount: 2 });
    await expect.poll(() => Boolean(state.releaseCheckout)).toBe(true);
    await expect(page.locator('.family-plan-feature .primary-button')).toBeDisabled();
    const checkout = state.writes.filter(x => x.path.endsWith('/stripe/checkout'));
    expect(checkout).toHaveLength(1); expect(checkout[0].retryKey).toBeTruthy();
    const { label, taxNotice, planCode, planVersion, ...receiptFields } = contract;
    expect(checkout[0].body).toEqual({ billingPeriod: 'annual', locale, purchaseConsent: { ...receiptFields, acceptedSubscriptionTerms: true, acceptedAnnualRenewal: true, acknowledgedCancellation: true } });
    state.releaseCheckout(); await expect(page).toHaveURL('https://checkout.stripe.com/isolated-fixture');
    expect(state.writes.map(x => x.path)).toEqual(['/api/v1/commerce/purchase-route', '/api/v1/commerce/stripe/checkout']); clean(state); await context.close();
  });
  test(`Existing Stripe and Apple subscriptions retain the correct management destination ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const state = await commerceFixture(context, { catalog: { ...structuredClone(catalog), currentAccess: { planCode: 'family' } }, subscription });
    const page = await context.newPage(); await page.goto(APP + '/?view=access');
    await expect(page.locator('.family-plan-feature .primary-button')).toHaveText(manageLabel(locale));
    await page.getByRole('button', { name: manageLabel(locale), exact: true }).click();
    await expect(page).toHaveURL('https://billing.stripe.com/isolated-fixture');
    expect(state.writes.filter(x => x.path.endsWith('/checkout'))).toHaveLength(0);
    state.catalog.currentAccess = { planCode: 'family', managementDestination: 'app_store_subscriptions' }; state.reads.length = 0;
    await page.goto(APP + '/?view=access');
    await expect(page.locator('.family-plan-feature .primary-button')).toHaveAttribute('href', 'https://apps.apple.com/account/subscriptions');
    await expect(page.getByRole('button', { name: subscribeLabel(locale), exact: true })).toHaveCount(0);
    expect(state.reads.filter(x => x.endsWith('/stripe/status'))).toEqual([]); clean(state); await context.close();
  });
  test(`Enrolled TEST uses the same single annual action without charging ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width: 390, height: 960 } });
    const state = await commerceFixture(context, { catalog: { ...structuredClone(catalog), billingOpen: false, validationOnly: true } });
    const page = await context.newPage(); await page.goto(APP + '/?view=access');
    const card = page.locator('.family-plan-feature');
    await expect(card.getByRole('button', { name: subscribeLabel(locale), exact: true })).toBeEnabled();
    await expect(card).toContainText(locale === 'en' ? 'No charge' : '不会扣款');
    await expect(card.locator('input')).toHaveCount(0); expect(state.writes).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`stripe-test-entry-${locale}.png`), fullPage: true });
    await card.getByRole('button', { name: subscribeLabel(locale), exact: true }).click();
    await expect(page).toHaveURL('https://checkout.stripe.com/isolated-fixture');
    expect(state.writes).toHaveLength(1); expect(state.writes[0].body).toMatchObject({ billingPeriod: 'annual', locale });
    state.testUnavailable = true; await page.goto(APP + '/?view=access');
    await expect(card.getByRole('alert')).toContainText(locale === 'en' ? 'not available in this environment' : '当前环境未提供');
    await expect(card.getByRole('button', { name: subscribeLabel(locale), exact: true })).toBeDisabled();
    clean(state); await context.close();
  });
}
for (const overrides of [{ quoteChange: { amountMinor: 6800 } }, { quoteChange: { termsVersion: 'old' } }, { routeBlocked: true }, { wrongProviderMode: true }]) {
  test(`Checkout stops on an unverified route, quote or response ${JSON.stringify(overrides)}`, async ({ browser }) => {
    const context = await browser.newContext({ locale: 'zh-CN' }); const state = await commerceFixture(context, overrides);
    const page = await context.newPage(); await page.goto(APP + '/?view=access');
    await page.getByRole('button', { name: subscribeLabel('zh-CN'), exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible(); await expect(page).toHaveURL(/view=access/);
    expect(state.writes.filter(x => x.path.endsWith('/checkout'))).toHaveLength(overrides.wrongProviderMode ? 1 : 0);
    clean(state); await context.close();
  });
}
test('Old prices and continuing renewal never enable a duplicate checkout', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en' });
  const state = await commerceFixture(context, { subscription: { ...subscription, state: 'refunded' } });
  const page = await context.newPage(); await page.goto(APP + '/?view=access');
  await expect(page.locator('.family-plan-feature .primary-button')).toHaveText(manageLabel('en'));
  await expect(page.locator('.family-plan-feature')).toContainText('renewal');
  state.subscription.renewalIsPossible = false; await page.reload();
  await expect(page.getByRole('button', { name: subscribeLabel('en'), exact: true })).toBeEnabled();
  state.catalog.offers = [{ ...catalog.offers[0], amountMinor: 6800 }]; await page.reload();
  await expect(page.getByRole('button', { name: subscribeLabel('en'), exact: true })).toBeDisabled();
  await expect(page.locator('.family-plan-price')).not.toContainText(/68\.00|88\.99/);
  expect(state.writes).toEqual([]); clean(state); await context.close();
});
