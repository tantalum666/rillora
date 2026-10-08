import { build } from 'esbuild';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('..', import.meta.url));

test('account presentation uses current authoritative email and separates pending from unavailable', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'rillora-identity-render-'));
  try {
    const bundle = join(temporary, 'render.cjs');
    await build({ stdin: { contents: `
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from './src/i18n/I18nProvider.jsx';
import { createLocaleStore } from './src/i18n/localeStore.js';
import { mergeCatalogs } from './src/i18n/core.js';
import * as workspace from './src/i18n/messages/workspace.js';
import * as common from './src/i18n/messages/common.js';
import { AccountIdentityPanel, AccountSummary } from './src/AccountIdentity.jsx';
export function render(identity, plannerPublicId, locale) {
 return renderToStaticMarkup(<I18nProvider catalogs={mergeCatalogs(common,workspace)} locale={locale} store={createLocaleStore()}><AccountSummary identity={identity} plannerPublicId={plannerPublicId}/><AccountIdentityPanel identity={identity} plannerPublicId={plannerPublicId}/></I18nProvider>);
}
`, resolveDir: root, loader: 'jsx' }, bundle: true, platform: 'node', format: 'cjs', outfile: bundle, jsx: 'automatic', loader: { '.css': 'empty' } });
    const { render } = createRequire(import.meta.url)(bundle);
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const value = { account: { publicId: id.toUpperCase(), displayName: 'Current owner', verifiedEmail: 'owner@example.test' }, emailStatus: 'available' };
    for (const locale of ['en', 'zh-CN']) {
      const loaded = render({ value, loading: false }, id, locale);
      assert.ok(loaded.includes('owner@example.test'));
      const pending = render({ value, loading: true }, id, locale);
      assert.ok(pending.includes('role="status"'));
      assert.ok(!pending.includes('owner@example.test'));
      assert.ok(!pending.includes('Email is unavailable'));
      assert.ok(!pending.includes('暂时无法显示邮箱'));
      for (const emailStatus of ['not_provided', 'unavailable']) {
        const absent = render({ value: { ...value, emailStatus }, loading: false }, id, locale);
        assert.ok(!absent.includes('owner@example.test'));
      }
      const mismatch = render({ value, loading: false }, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', locale);
      assert.ok(!mismatch.includes('owner@example.test'));
      assert.ok(!mismatch.includes('Current owner'));
      const failed = render({ value, failed: true, loading: false }, id, locale);
      assert.ok(!failed.includes('owner@example.test'));
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
