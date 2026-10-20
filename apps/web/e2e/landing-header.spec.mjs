import { test, expect } from '@playwright/test';
import { PUBLIC, isolate } from './fixtures.mjs';

async function noHeaderCollisions(page) {
  const boxes = await page.locator('.lp-header > .lp-brand, .lp-header > .lp-menu-toggle, .lp-header > .lp-nav, .lp-header-actions > *').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').map(node => {
    const { x, y, width, height } = node.getBoundingClientRect();
    return { x, y, width, height, name: node.className };
  }));
  for (const box of boxes) {
    expect(box.x, box.name).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, box.name).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    expect(overlapX > 1 && overlapY > 1, `${a.name} overlaps ${b.name}`).toBe(false);
  }
}
for (const locale of ['en', 'zh-CN']) {
  test(`landing responsive navigation and Apple price note ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, reducedMotion: 'reduce' });
    const state = await isolate(context), page = await context.newPage();
    for (const width of [320, 390, 512, 600, 601, 767, 768, 1023, 1024, 1280, 1281, 1440, 1920]) {
      await page.setViewportSize({ width, height: 960 });
      await page.goto(`${PUBLIC}/pricing`);
      await expect(page.locator('.lp-channel-price-note')).toContainText(locale === 'en' ? 'Apple in-app prices may differ' : '通过 Apple App 内购买的价格可能不同');
      await expect(page.locator('.lp-channel-price-note')).not.toContainText(/\d/);
      await noHeaderCollisions(page);
      const language = page.locator('.lp-language select');
      await expect(language).toHaveAccessibleName(locale === 'en' ? 'Language' : '语言');
      await expect(language.locator('option[value="zh-CN"]')).toHaveText(locale === 'en' ? 'Simplified Chinese' : '简体中文');
      await expect(language.locator('option[value="en"]')).toHaveText(locale === 'en' ? 'English' : '英语');
      await language.focus(); await expect(language).toBeFocused();
      if (width >= 768) {
        await expect(page.locator('.lp-menu-toggle')).toBeHidden();
        const nav = await page.locator('.lp-nav').boundingBox();
        expect(Math.abs(nav.x + nav.width / 2 - width / 2)).toBeLessThan(1);
      } else {
        const toggle = page.locator('.lp-menu-toggle');
        await expect(page.locator('.lp-nav')).toBeHidden();
        await toggle.focus(); await page.keyboard.press('Enter');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        await page.keyboard.press('Tab'); await expect(page.locator('.lp-nav a').first()).toBeFocused();
        await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
        await expect(page.locator('.lp-nav')).toBeHidden();
      }
      const appearance = page.locator('.lp-appearance-trigger');
      await appearance.click(); await expect(page.locator('.lp-appearance-options')).toBeVisible();
      const options = await page.locator('.lp-appearance-options').boundingBox();
      expect(options.x).toBeGreaterThanOrEqual(0); expect(options.x + options.width).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape'); await expect(appearance).toBeFocused();
      if ([320, 768, 1024, 1440].includes(width)) await page.screenshot({ path: test.info().outputPath(`pricing-header-${locale}-${width}.png`) });
    }
    // A 1024px desktop at 200% browser zoom has a 512 CSS-pixel layout viewport.
    // Verify that reflow geometry explicitly; deviceScaleFactor is not used as zoom.
    await page.setViewportSize({ width: 512, height: 384 });
    await page.goto(PUBLIC); await noHeaderCollisions(page);
    await page.locator('.lp-menu-toggle').click();
    const nav = await page.locator('.lp-nav').boundingBox();
    expect(nav.y + nav.height).toBeLessThanOrEqual(384);
    await page.locator('.lp-nav a').last().focus(); await expect(page.locator('.lp-nav a').last()).toBeInViewport();
    await page.screenshot({ path: test.info().outputPath(`zoom-equivalent-${locale}.png`) });
    await page.keyboard.press('Escape');
    await page.locator('.lp-language select').selectOption(locale === 'en' ? 'zh-CN' : 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', locale === 'en' ? 'zh-CN' : 'en');
    await noHeaderCollisions(page);
    expect(state.errors).toEqual([]); expect(state.unexpected).toEqual([]); expect(state.writes).toEqual([]);
    await context.close();
  });
}
