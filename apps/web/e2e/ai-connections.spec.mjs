import { test, expect } from '@playwright/test';
import { isolate, OWNER } from './fixtures.mjs';

for (const locale of ['en', 'zh-CN']) {
  test(`explicit AI scope, replacement and immediate revocation ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width: locale === 'en' ? 1440 : 390, height: 1000 } });
    const state = await isolate(context), mutations = [];
    const selected = { publicId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Synthetic selected matter', version: 3 };
    const omitted = { publicId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Synthetic omitted matter', version: 1 };
    let connections = [];
    await context.route('**/api/v1/account/ai-connections**', async route => {
      const req = route.request();
      expect(req.headers()['x-rillora-planner']).toBe(OWNER);
      if (req.method() === 'GET' && req.url().includes('/selectable')) return route.fulfill({ json: { matters: [selected, omitted], nextCursor: null } });
      if (req.method() === 'POST') {
        const input = req.postDataJSON(); mutations.push({ method: 'POST', input });
        const replacing = connections.length > 0;
        const expected = replacing ? omitted : selected;
        expect(input.matters).toEqual([{ publicId: expected.publicId, expectedVersion: expected.version }]);
        if (replacing) expect(input.replace).toEqual({ publicId: connections[0].publicId, expectedVersion: connections[0].version });
        else expect(input.replace).toBeUndefined();
        expect(input.acknowledgedDisclosure).toBe(true);
        expect(input.scopes).toEqual(['matters:read:summary', 'readiness:read:scoped']);
        connections = [{ publicId: replacing ? 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' : 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', clientKey: 'client-a', name: 'ChatGPT', version: 1,
          scopes: input.scopes, selectedCount: 1, status: 'active', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }];
        return route.fulfill({ status: 201, json: { connection: connections[0], reconnectRequired: true } });
      }
      if (req.method() === 'DELETE') { mutations.push({ method: 'DELETE', input: req.postDataJSON() }); connections = []; return route.fulfill({ json: { revoked: true } }); }
      return route.fulfill({ json: { consentVersion: 'ai-selected-read-2026-10-15-1', serverUrl: 'https://ai.example.test/api/mcp',
        clients: [{ key: 'client-a', name: 'ChatGPT', privacyUrl: 'https://ai.example.test/privacy' }], connections } });
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4184/?view=settings');
    const panel = page.locator('.ai-connections');
    await expect(panel).toBeVisible();
    await expect(panel.locator('h3')).toHaveText(locale === 'en' ? 'AI access' : 'AI 访问授权');
    const save = panel.getByRole('button', { name: locale === 'en' ? 'Save read-only authorization' : '保存只读授权' });
    await expect(save).toBeDisabled();
    await panel.locator('.ai-matter-selection input').first().check();
    await panel.locator('.ai-check input').first().check();
    await expect(save).toBeDisabled();
    await panel.locator('.ai-check input').last().check();
    await save.click();
    await expect(panel.getByRole('status')).toContainText(locale === 'en' ? 'Authorization saved' : '授权已保存');
    expect(mutations).toHaveLength(1);
    await expect(panel.locator('.ai-check input').last()).not.toBeChecked();
    await panel.locator('.ai-matter-selection input').first().uncheck();
    await panel.locator('.ai-matter-selection input').last().check();
    await expect(save).toBeDisabled();
    await panel.locator('.ai-check input').last().check();
    await save.click();
    await expect(panel.getByRole('status')).toContainText(locale === 'en' ? 'Authorization saved' : '授权已保存');
    expect(mutations).toHaveLength(2);
    await expect(panel.locator('.ai-check input').last()).not.toBeChecked();
    await panel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath(`ai-consent-${locale}.png`) });
    await panel.getByRole('button', { name: locale === 'en' ? 'Revoke access' : '撤销授权' }).click();
    await expect(panel.getByRole('status')).toContainText(locale === 'en' ? 'now blocked' : '已被阻止');
    expect(mutations[2]).toEqual({ method: 'DELETE', input: { expectedVersion: 1 } });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(state.errors).toEqual([]); expect(state.unexpected).toEqual([]); expect(state.writes).toEqual([]);
    await context.close();
  });
}
