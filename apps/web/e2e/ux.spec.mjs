import { test, expect } from '@playwright/test';
import { APP, PUBLIC, OWNER, isolate, identity } from './fixtures.mjs';
import { guideIdentifiers } from '../src/guideIdentifiers.js';
const routes = ['/', '/product', '/security', '/pricing', '/support', '/legal', '/legal/licenses'];
async function healthy(page, locale) {
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toMatch(/\b(?:public|common|forms|workspace|sharing)\.[a-zA-Z][\w.]+/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const broken = await page.locator('img').evaluateAll(images => images.filter(i => i.complete && !i.naturalWidth).map(i => i.src));
  expect(broken).toEqual([]);
}
for (const locale of ['en', 'zh-CN']) for (const width of [320, 390, 1280, 1440, 1920]) {
  test(`public pages ${locale} ${width}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width, height: 960 }, reducedMotion: 'reduce', colorScheme: width === 390 || width === 1920 ? 'dark' : 'light' });
    const state = await isolate(context), page = await context.newPage();
    for (const path of routes) {
      await page.goto(PUBLIC + path); await expect(page.locator('main h1')).toBeVisible();
      await healthy(page, locale);
      if (width > 1400) {
        const nav = await page.locator('.lp-nav').boundingBox(), brand = await page.locator('.lp-header > .lp-brand').boundingBox(), actions = await page.locator('.lp-header-actions').boundingBox();
        expect(Math.abs(nav.x + nav.width / 2 - width / 2)).toBeLessThan(1);
        expect(nav.x).toBeGreaterThan(brand.x + brand.width + 8);
        expect(nav.x + nav.width).toBeLessThan(actions.x + 1);
      } else {
        const toggle = page.locator('.lp-menu-toggle');
        await toggle.click(); await expect(page.locator('.lp-nav')).toBeVisible();
        await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
        await expect(page.locator('.lp-nav')).toBeHidden();
      }
    }
    expect(state.errors).toEqual([]); expect(state.unexpected).toEqual([]); expect(state.writes).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`public-${locale}-${width}.png`) }); await context.close();
  });
}
for (const locale of ['en', 'zh-CN']) for (const width of [390, 1440]) {
  test(`workspace routes and all provider identifiers ${locale} ${width}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width, height: 960 }, colorScheme: 'light', reducedMotion: 'reduce' });
    const state = await isolate(context), page = await context.newPage();
    for (const view of ['overview', 'plan', 'matters', 'contacts', 'shared', 'maintenance', 'access', 'activity', 'settings', 'more', 'guides']) {
      await page.goto(APP + '/?view=' + view); await expect(page.locator('.account-summary')).toContainText('owner@example.test');
      await healthy(page, locale);
    }
    await expect(page.locator('.guide-row')).toHaveCount(18);
    await expect(page.locator('[data-mark-kind="official"]')).toHaveCount(6);
    await expect.poll(() => page.locator('.provider-mark img').evaluateAll(images => images.length === 6 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await expect(page.locator('[data-mark-kind="fallback"]')).toHaveCount(12);
    const labels = await page.locator('.provider-mark-initials').allTextContents(); expect(new Set(labels).size).toBe(12);
    for (const key of guideIdentifiers) {
      await page.locator(`.guide-row:has([data-provider-key="${key}"])`).click();
      await expect(page.locator('dialog.drawer')).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`provider=${key}`));
      await page.reload(); await expect(page.locator('dialog.drawer')).toBeVisible();
      await page.keyboard.press('Escape'); await expect(page.locator('dialog.drawer')).toHaveCount(0);
    }
    await page.screenshot({ path: test.info().outputPath(`guides-${locale}-${width}.png`), fullPage: true });
    expect(state.errors).toEqual([]); expect(state.unexpected).toEqual([]); expect(state.writes).toEqual([]);
    await context.close();
  });
}
test('Chinese website handoff, account consent, auth return and reload stay Chinese', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 960 } });
  const state = await isolate(context, { signedIn: false }), page = await context.newPage();
  await page.goto(PUBLIC + '/product'); await page.locator('.language-control select').selectOption('zh-CN');
  await expect(page.locator('.lp-sign-in')).toHaveAttribute('href', /lang=zh-CN/);
  await page.locator('.lp-sign-in').click(); await healthy(page, 'zh-CN');
  const consent = page.locator('.account-consent input[type="checkbox"]');
  await expect(consent).not.toBeChecked();
  await consent.check();
  await page.locator('.language-control select').selectOption('en'); await expect(consent).toBeChecked();
  await page.locator('.language-control select').selectOption('zh-CN'); await expect(consent).toBeChecked();
  await page.locator('.account-action-form > .secondary-button').click();
  await expect.poll(() => state.authReturn).toContain('lang=zh-CN');
  state.signedIn = true; await page.goto(APP + state.authReturn); await expect(page.locator('.account-summary')).toBeVisible();
  await healthy(page, 'zh-CN'); await page.reload(); await healthy(page, 'zh-CN');
  expect(state.writes.map(x => x.path)).toEqual(['/api/auth/start']); expect(state.errors).toEqual([]);
  await context.close();
});
test('blocked storage, explicit app language and guide navigation preserve locale', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  await context.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  const state = await isolate(context), page = await context.newPage();
  await page.goto(APP + '/?view=guides&lang=zh-CN'); await expect(page.locator('.guide-row')).toHaveCount(18);
  await page.locator('.guide-row:has([data-provider-key="password_manager"])').click();
  await expect(page).toHaveURL(/lang=zh-CN/); await page.reload(); await healthy(page, 'zh-CN');
  await expect(page.locator('dialog.drawer')).toBeVisible(); await page.keyboard.press('Escape');
  await page.locator('.workspace-chrome .language-control select').selectOption('en');
  await page.reload(); await healthy(page, 'en'); expect(state.errors).toEqual([]); await context.close();
});
test('failed logos retain distinct local fallbacks without remote icon services', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en', colorScheme: 'dark', viewport: { width: 390, height: 960 } });
  const state = await isolate(context), page = await context.newPage();
  await context.route(/\/(?:github-invertocat-white|x-logo-white|instagram-glyph-white|facebook-primary|dropbox-glyph|coinbase-logo-white)[^/]*\.(?:svg|png)/, route => route.abort());
  await page.goto(APP + '/?view=guides');
  // Small SVGs may be inlined by Vite: dispatching the native error event covers
  // that same React failure path without adding a runtime asset override.
  await page.locator('.provider-mark img').evaluateAll(images => images.forEach(image => image.dispatchEvent(new Event('error'))));
  await expect(page.locator('[data-mark-kind="fallback"]')).toHaveCount(18);
  const initials = await page.locator('.provider-mark-initials').allTextContents(); expect(new Set(initials).size).toBe(18);
  await healthy(page, 'en'); expect(state.unexpected).toEqual([]); expect(state.errors).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('provider-failures-dark-mobile.png'), fullPage: true }); await context.close();
});
test('identity is visible, bilingual, handles missing email and never displays a stale account', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 390, height: 960 } });
  const state = await isolate(context), page = await context.newPage();
  await page.goto(APP + '/?view=settings'); await expect(page.locator('.account-identity-panel')).toContainText('owner@example.test');
  await expect(page.locator('.account-identity-panel')).toContainText(OWNER);
  await page.locator('.account-language select').selectOption('en'); await expect(page.locator('#current-account-title')).toHaveText('Current account');
  await page.screenshot({ path: test.info().outputPath('current-account-mobile.png') });
  state.identity = { account: { ...identity.account, verifiedEmail: null }, emailStatus: 'not_provided' };
  await page.reload(); await expect(page.locator('.account-identity-panel')).toContainText('did not supply a verified email');
  await expect(page.locator('body')).not.toContainText('owner@example.test');
  state.identity = { account: { ...identity.account, publicId: '33333333-3333-4333-8333-333333333333', verifiedEmail: 'wrong@example.test' }, emailStatus: 'available' };
  await page.reload(); await expect(page.locator('.workspace-gate')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('wrong@example.test'); await expect(page.locator('.account-summary')).toHaveCount(0);
  expect(state.errors).toEqual([]); await context.close();
});
