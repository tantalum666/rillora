import { test, expect } from '@playwright/test';
import { APP, isolate } from './fixtures.mjs';

async function readOnlyEntry(browser, locale = 'en', signedIn = true) {
  const context = await browser.newContext({ locale });
  const state = await isolate(context, { signedIn });
  const reads = [];
  context.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/v1/')) reads.push(request.url());
  });
  return { context, state, reads, page: await context.newPage() };
}

for (const locale of ['en', 'zh-CN']) {
  test(`legal return rechecks an existing session without another login ${locale}`, async ({ browser }) => {
    const { context, state, reads, page } = await readOnlyEntry(browser, locale);
    await page.goto(APP + '/privacy?lang=' + locale);
    await expect(page.locator('.legal-back')).toBeVisible();
    expect(reads).toEqual([]);
    await page.locator('.legal-back').click();
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('.workspace-chrome')).toContainText('owner@example.test');
    expect(reads.some(url => new URL(url).pathname.endsWith('/overview'))).toBe(true);
    await expect(page.getByRole('heading', { name: locale === 'en' ? 'Your map' : '我的事项地图', exact: true })).toBeVisible();
    expect(state.writes).toEqual([]);
    expect(state.errors).toEqual([]);
    expect(state.unexpected).toEqual([]);
    await context.close();
  });
}

test('saved-copy Account link resumes the existing workspace', async ({ browser }) => {
  const { context, state, reads, page } = await readOnlyEntry(browser);
  await page.goto(APP + '/open-copy');
  await expect(page.locator('.public-copy-page')).toBeVisible();
  expect(reads).toEqual([]);
  await page.locator('.public-header').getByRole('link', { name: 'Account', exact: true }).click();
  await expect(page.locator('.app-shell')).toBeVisible();
  expect(state.writes).toEqual([]);
  expect(state.errors).toEqual([]);
  await context.close();
});

test('legal return keeps signed-out visitors public without accepting terms', async ({ browser }) => {
  const { context, state, reads, page } = await readOnlyEntry(browser, 'en', false);
  await page.goto(APP + '/privacy');
  await expect(page.locator('.legal-back')).toBeVisible();
  expect(reads).toEqual([]);
  await page.locator('.legal-back').click();
  await expect.poll(() => reads.some(url => new URL(url).pathname.endsWith('/overview'))).toBe(true);
  await expect(page.locator('.public-shell-home')).toBeVisible();
  await expect(page.locator('.app-shell')).toHaveCount(0);
  expect(state.writes).toEqual([]);
  expect(state.errors).toEqual([]);
  await context.close();
});

test('moving between public legal pages never fetches private workspace data', async ({ browser }) => {
  const { context, state, reads, page } = await readOnlyEntry(browser);
  await page.goto(APP + '/privacy');
  await page.locator('.public-footer').getByRole('link', { name: 'Terms', exact: true }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.locator('.legal-back')).toBeVisible();
  expect(reads).toEqual([]);
  expect(state.writes).toEqual([]);
  expect(state.errors).toEqual([]);
  await context.close();
});
