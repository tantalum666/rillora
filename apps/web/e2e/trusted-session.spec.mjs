import { test, expect } from '@playwright/test';
import { APP, isolate, overview } from './fixtures.mjs';

for (const locale of ['en', 'zh-CN']) {
  test(`network confirmation works before the first private map without replaying mutations ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const state = await isolate(context);
    let confirmed = false;
    const writes = [];
    await context.route('**/api/v1/overview', route => confirmed ? route.fulfill({ json: overview })
      : route.fulfill({ status: 403, json: { error: { code: 'reauthentication_required' } } }));
    await context.route('**/api/auth/reauthenticate', route => {
      writes.push(route.request().url());
      return route.fulfill({ json: { authorizationUrl: 'https://identity.example/fixture', pollToken: 'synthetic-poll', expiresIn: 600 } });
    });
    await context.route('https://identity.example/fixture', route => {
      confirmed = true;
      return route.fulfill({ contentType: 'text/html', body: '<p>Synthetic same-account confirmation fixture</p>' });
    });
    await context.route('**/api/auth/reauthentication-status', route => route.fulfill({ json: { completed: confirmed } }));
    const page = await context.newPage();
    await page.goto(APP + '/?lang=' + locale);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('.workspace-chrome')).toHaveCount(0);
    await dialog.getByRole('button', { name: locale === 'en' ? 'Sign in again' : '重新登录', exact: true }).click();
    await expect(dialog.getByRole('heading')).toHaveText(locale === 'en' ? 'Sign-in complete' : '登录已完成');
    await dialog.getByRole('button', { name: locale === 'en' ? 'Return to editing' : '返回编辑' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.workspace-chrome')).toContainText('owner@example.test');
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Your map' : '我的事项地图', exact: true })).toBeVisible();
    expect(writes).toHaveLength(1); expect(state.writes).toEqual([]); expect(state.errors).toEqual([]);
    await context.close();
  });

  test(`current storage notice uses the selected language and preserves unchanged terms ${locale}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ locale, viewport: locale === 'en' ? { width: 1440, height: 1000 } : { width: 390, height: 844 } });
    const state = await isolate(context, { signedIn: false });
    const page = await context.newPage();
    await page.goto(APP + '/cookies?lang=' + locale);
    await expect(page.locator('h1')).toHaveText(locale === 'en' ? 'Cookie Notice' : '浏览器存储声明');
    await expect(page.locator('.legal-meta')).toContainText('cookies-2026-11-06-1');
    await expect(page.locator('#cookie-details')).toContainText(locale === 'en' ? '30 days' : '30天');
    await expect(page.locator('#cookie-details')).toContainText(locale === 'en' ? '7 consecutive days' : '连续7天');
    await expect(page.locator('#cookie-security')).toContainText(locale === 'en' ? 'up to five' : '最多五个');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`cookies-${locale}.png`) });
    await page.locator('.public-footer').getByRole('link', { name: locale === 'en' ? 'Terms' : '服务条款', exact: true }).click();
    await expect(page.locator('.legal-meta')).toContainText('terms-2026-10-09-1');
    expect(state.errors).toEqual([]); expect(state.writes).toEqual([]);
    await context.close();
  });
}
