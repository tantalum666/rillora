import { test, expect } from '@playwright/test';
import { PUBLIC, isolate } from './fixtures.mjs';
import { publicPages, publicPath } from '../src/publicSeo.js';

// Flow: public localized URL -> real readable HTML -> working controls and same-language links.
for (const locale of ['en', 'zh-CN']) {
  test(`all public pages and FAQ are readable without JavaScript: ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    for (const path of Object.keys(publicPages)) {
      const response = await page.goto(PUBLIC + publicPath(path, locale));
      expect(response.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('main h1')).toBeVisible();
      await expect(page.locator('main')).not.toContainText(/public\.(learn|seo|title)\./);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.rillora.xyz' + publicPath(path, locale));
      await expect(page.locator('.lp-nav a').first()).toHaveAttribute('href', publicPath('/', locale));
    }
    await page.goto(PUBLIC + publicPath('/security', locale));
    const faq = page.locator('details.lp-faq-item').first();
    await faq.locator('summary').click();
    await expect(faq).toHaveAttribute('open', '');
    await expect(faq.locator('p')).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`no-js-security-${locale}.png`) });
    await context.close();
  });

  for (const width of [390, 1440]) {
    test(`hydration, language, navigation and sharing example: ${locale} ${width}`, async ({ browser }) => {
      const context = await browser.newContext({ locale, viewport: { width, height: 960 }, colorScheme: 'dark', reducedMotion: 'reduce' });
      const state = await isolate(context);
      const page = await context.newPage();
      await page.goto(PUBLIC + publicPath('/', locale));
      await expect(page).toHaveTitle(locale === 'en' ? /digital legacy/ : /数字遗产/);
      await expect(page.locator('.lp-hero-copy h1')).toBeVisible();
      await page.locator('.lp-demo-people button').nth(1).click();
      await expect(page.locator('.lp-demo-people button').nth(1)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.lp-shared-sheet')).toContainText('Alex');
      await page.locator('.lp-hero-actions a').first().click();
      await expect(page).toHaveURL(PUBLIC + publicPath('/product', locale));
      await page.locator('.lp-category-choices button').nth(1).click();
      await expect(page.locator('.lp-category-choices button').nth(1)).toHaveAttribute('aria-pressed', 'true');
      const next = locale === 'en' ? 'zh-CN' : 'en';
      await page.locator('.lp-language select').selectOption(next);
      await expect(page).toHaveURL(PUBLIC + publicPath('/product', next));
      await expect(page.locator('html')).toHaveAttribute('lang', next);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.rillora.xyz' + publicPath('/product', next));
      await page.locator('.lp-footer a[href$="/learn"]').click();
      await page.locator('.lp-document-links a').first().click();
      await expect(page.locator('article h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: test.info().outputPath(`learning-${next}-${width}.png`) });
      expect(state.errors).toEqual([]);
      expect(state.unexpected).toEqual([]);
      expect(state.writes).toEqual([]);
      await context.close();
    });
  }
}

test('old language links, discovery files and guide redirects use the packaged edge behavior', async ({ request }) => {
  const old = await request.get(PUBLIC + '/pricing?lang=zh-CN&return_to=https://example.invalid', { maxRedirects: 0 });
  expect(old.status()).toBe(302);
  expect(old.headers().location).toBe('/zh-CN/pricing');
  const guide = await request.get(PUBLIC + '/guides?lang=zh-CN&service=google&token=do-not-forward', { maxRedirects: 0 });
  expect(guide.status()).toBe(302);
  expect(guide.headers().location).toBe('https://app.rillora.xyz/account?next=guides&service=google&lang=zh-CN');
  expect((await request.get(PUBLIC + '/sitemap.xml')).headers()['content-type']).toContain('application/xml');
  expect(await (await request.get(PUBLIC + '/robots.txt')).text()).toContain('Sitemap: https://www.rillora.xyz/sitemap.xml');
  for (const path of ['/zh-CN/account', '/en/api/v1/overview', '/pages/en/index.html']) expect((await request.get(PUBLIC + path)).status()).toBe(404);
});
