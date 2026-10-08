import { test, expect } from '@playwright/test';
import { APP, isolate, identity, overview } from './fixtures.mjs';

test('pending identity does not claim missing email and retry publishes fresh provider proof', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const state = await isolate(context, { delayIdentity: true });
  const page = await context.newPage();
  await page.goto(APP + '/?view=settings');
  const panel = page.locator('.account-identity-panel');
  await expect(panel).toHaveAttribute('aria-busy', 'true');
  await expect(panel).not.toContainText('Email is unavailable');
  await expect(panel).not.toContainText('owner@example.test');
  await expect.poll(() => typeof state.releaseIdentity).toBe('function');
  state.identity = { ...identity, account: { ...identity.account, verifiedEmail: null }, emailStatus: 'unavailable' };
  state.releaseIdentity();
  await expect(panel).toHaveAttribute('aria-busy', 'false');
  await expect(panel).toContainText('Email is unavailable');
  state.delayIdentity = false;
  state.identity = identity;
  await panel.getByRole('button', { name: 'Check account details again' }).click();
  await expect(panel).toContainText('owner@example.test');
  expect(state.writes).toEqual([]);
  expect(state.errors).toEqual([]);
  await context.close();
});

test('Web recognizes the same current account with case-insensitive UUIDs like iOS', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en-US' });
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const state = await isolate(context, {
    session: { ...overview.session, plannerPublicId: id },
    identity: { ...identity, account: { ...identity.account, publicId: id.toUpperCase() } },
  });
  await context.route('**/api/v1/overview', route => route.fulfill({ json: { ...overview, session: state.session } }));
  const page = await context.newPage();
  await page.goto(APP + '/?view=settings');
  await expect(page.locator('.account-identity-panel')).toContainText('owner@example.test');
  await expect(page.locator('.account-identity-panel')).toHaveAttribute('aria-busy', 'false');
  expect(state.errors).toEqual([]);
  await context.close();
});

test('identity hook discards old clients, canceled responses, mismatches and stale retries', async ({ browser }) => {
  const { build } = await import('esbuild');
  const { fileURLToPath } = await import('node:url');
  const source = await build({ stdin: { contents: `
import React, { useState, useLayoutEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useAccountIdentity } from './src/AccountIdentity.jsx';
const pending = [];
const clients = [0, 1].map(client => ({ getAccountIdentity: () => new Promise(resolve => pending.push({ client, resolve })) }));
window.resolveIdentity = (index, id, email) => pending[index].resolve({ account: { publicId: id, displayName: 'Synthetic', verifiedEmail: email }, emailStatus: 'available' });
window.pendingCount = () => pending.length;
function Harness() {
 const [config, configure] = useState({ client: 0, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
 const identity = useAccountIdentity(clients[config.client], config.id);
 useLayoutEffect(() => { window.configureIdentity = configure; window.retryIdentity = identity.retry;
   window.identityState = { value: identity.value, loading: identity.loading, failed: identity.failed };
   window.identityHistory = [...(window.identityHistory || []), window.identityState];
 });
 return <p>{identity.value?.account.verifiedEmail || (identity.loading ? 'loading' : 'unavailable')}</p>;
}
createRoot(document.getElementById('root')).render(<Harness/>);
`, resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'jsx' }, bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', loader: { '.css': 'empty' } });
  const context = await browser.newContext();
  await context.route('**/identity-hook-test', route => route.fulfill({ contentType: 'text/html', body: '<div id="root"></div><script>' + source.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script>' }));
  const page = await context.newPage();
  await page.goto(APP + '/identity-hook-test');
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  await expect.poll(() => page.evaluate(() => window.pendingCount())).toBe(1);
  await page.evaluate(id => window.resolveIdentity(0, id.toUpperCase(), 'first@example.test'), id);
  await expect(page.locator('p')).toHaveText('first@example.test');
  await page.evaluate(id => { window.identityHistory = []; window.configureIdentity({ client: 1, id }); }, id);
  await expect.poll(() => page.evaluate(() => window.pendingCount())).toBe(2);
  expect(await page.evaluate(() => window.identityHistory.every(state => state.value === null))).toBe(true);
  await page.evaluate(id => window.resolveIdentity(1, id, 'second@example.test'), id);
  await expect(page.locator('p')).toHaveText('second@example.test');
  await page.evaluate(() => { window.identityHistory = []; window.retryIdentity(); });
  await expect.poll(() => page.evaluate(() => window.pendingCount())).toBe(3);
  expect(await page.evaluate(() => window.identityHistory.every(state => state.value === null))).toBe(true);
  await page.evaluate(() => window.resolveIdentity(2, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'wrong@example.test'));
  await expect(page.locator('p')).toHaveText('unavailable');
  expect(await page.evaluate(() => window.identityState.failed)).toBe(true);
  await page.evaluate(() => window.retryIdentity());
  await expect.poll(() => page.evaluate(() => window.pendingCount())).toBe(4);
  await page.evaluate(() => window.configureIdentity({ client: 1, id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }));
  await expect.poll(() => page.evaluate(() => window.pendingCount())).toBe(5);
  await page.evaluate(id => window.resolveIdentity(3, id, 'late@example.test'), id);
  await expect(page.locator('p')).toHaveText('loading');
  await page.evaluate(() => window.resolveIdentity(4, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'current@example.test'));
  await expect(page.locator('p')).toHaveText('current@example.test');
  await context.close();
});
