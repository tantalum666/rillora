import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pcmWave } from '../src/legacyVoice.js';
import { isolate, OWNER, overview } from './fixtures.mjs';
const APP = 'http://127.0.0.1:4186', PERSON = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const notice = { version: '2026-10-22-1', en: { title: 'Files and voice', storage: 'Synthetic privacy notice', access: 'Private until explicitly shared' }, 'zh-CN': { title: '文件与原声', storage: '合成验收隐私说明', access: '主动共享前保持私有' } };
async function fixture(context) {
  const base = await isolate(context), changes = [], state = { canCreate: true, acceptedNotice: false, transcriptionAvailable: false,
    notice, assets: [], packs: [], received: [], cleanupPending: 0, limits: { fileBytes: 8388608, ownerBytes: 134217728 } };
  let publication = null, revoked = false;
  await context.route('**/api/v1/overview', route => route.fulfill({ json: { ...overview, trustedContacts: [{ publicId: PERSON, displayName: '家人', status: 'accepted', version: 1 }] } }));
  await context.route('**/api/v1/legacy-content**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace('/api/v1/legacy-content', '');
    expect(req.headers()['x-rillora-planner']).toBe(OWNER);
    if (path === '' && req.method() === 'GET') return route.fulfill({ json: state });
    if (path === '/consent') { changes.push(req.postDataJSON()); state.acceptedNotice = true; return route.fulfill({ json: { accepted: true } }); }
    if (path === '/assets' && req.method() === 'POST') {
      const bytes = req.postDataBuffer(), size = bytes.readUInt32BE(0), input = JSON.parse(bytes.subarray(4, 4 + size));
      changes.push({ upload: input.kind, bytes: bytes.length - 4 - size });
      if (input.kind === 'voice') { expect(bytes.subarray(4 + size, 8 + size).toString()).toBe('RIFF'); expect(bytes.length - 4 - size).toBeGreaterThan(1000); }
      const asset = { ...input.metadata, kind: input.kind, mediaType: input.mediaType, byteCount: bytes.length - 4 - size,
        publicId: randomUUID(), version: 1, state: 'ready', transcriptionState: 'none' };
      state.assets.push(asset); return route.fulfill({ status: 201, json: { asset } });
    }
    if (path.startsWith('/assets/') && req.method() === 'PATCH') {
      const asset = state.assets.find(item => path.endsWith(item.publicId)); Object.assign(asset, req.postDataJSON().metadata, { version: asset.version + 1 });
      changes.push('asset-update'); return route.fulfill({ json: { asset } });
    }
    if (path === '/packs' && req.method() === 'POST') {
      const input = req.postDataJSON(); changes.push(input); const pack = { ...input, publicId: randomUUID(), version: 1, publicationId: null, publishedVersion: null };
      state.packs.push(pack); return route.fulfill({ status: 201, json: { pack } });
    }
    if (path.endsWith('/publish')) {
      changes.push(req.postDataJSON()); const pack = state.packs[0]; pack.publicationId = randomUUID(); pack.publishedVersion = pack.version;
      publication = { publicId: pack.publicationId, body: structuredClone(pack.body), assets: state.assets.filter(asset => pack.body.assetPublicIds.includes(asset.publicId)),
        progress: [], isOwner: true, ownerName: null, publishedAt: '2026-10-22T03:00:00Z' };
      return route.fulfill({ json: { publication: { publicId: pack.publicationId } } });
    }
    if (path.includes('/publications/') && req.method() === 'GET') return revoked ? route.fulfill({ status: 404, json: { error: { code: 'legacy_unavailable' } } })
      : path.endsWith('/state') ? route.fulfill({ json: { revision: String(publication?.progress.length ?? 0) } }) : route.fulfill({ json: { publication } });
    if (path.endsWith('/progress')) {
      const input = req.postDataJSON(); changes.push(input); const progress = { ...input.progress, publicId: randomUUID(), version: 1, reportedByOwner: true, updatedAt: '2026-10-22T03:00:00Z' };
      publication.progress.push(progress); return route.fulfill({ json: { progress } });
    }
    throw new Error('Unexpected content fixture route: ' + req.method() + ' ' + path);
  });
  return { base, state, changes, revoke() { revoked = true; } };
}
for (const locale of ['en', 'zh-CN']) {
  test(`files, private preparation, explicit publishing and progress ${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale, viewport: { width: locale === 'en' ? 1440 : 390, height: 1000 } }), f = await fixture(context);
    const page = await context.newPage(); await page.goto(APP + '/?view=legacy'); const panel = page.locator('.legacy-content');
    await expect(panel.getByRole('button', { name: locale === 'en' ? 'Create action pack' : '新建办理包' })).toBeDisabled();
    await panel.getByRole('checkbox').check(); await panel.getByRole('button', { name: locale === 'en' ? 'Continue' : '继续', exact: true }).click();
    await panel.getByRole('button', { name: locale === 'en' ? 'Files & voice' : '文件与原声', exact: true }).click();
    await panel.locator('input[type=file]').setInputFiles({ name: 'family-copy.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nSynthetic file\n%%EOF') });
    await expect(panel.getByText('family-copy.pdf', { exact: true })).toBeVisible();
    await panel.getByRole('button', { name: locale === 'en' ? 'Action packs' : '亲友办理包', exact: true }).click();
    await panel.getByRole('button', { name: locale === 'en' ? 'Create action pack' : '新建办理包' }).click();
    await panel.getByLabel(locale === 'en' ? 'Pack name' : '办理包名称', { exact: true }).fill(locale === 'en' ? 'Family next steps' : '家人的办理步骤');
    await panel.getByLabel(locale === 'en' ? 'For' : '指定亲友', { exact: true }).selectOption(PERSON);
    await panel.getByLabel(locale === 'en' ? 'Visibility' : '可见范围').selectOption('current');
    await panel.getByRole('button', { name: locale === 'en' ? 'Add a step' : '添加一步' }).click();
    await panel.getByLabel(locale === 'en' ? 'What needs doing' : '需要办什么').fill(locale === 'en' ? 'Preserve the selected records' : '先保留选定资料');
    await panel.getByLabel('family-copy.pdf').check();
    await panel.getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true }).click();
    await expect(panel.locator('.legacy-pack')).toContainText(locale === 'en' ? 'Private draft' : '私有草稿');
    expect(f.state.packs[0].body.assetVersions[f.state.assets[0].publicId]).toBe(1);
    await panel.getByRole('button', { name: locale === 'en' ? 'Share this version with 家人 now' : '现在将此版本共享给家人' }).click();
    await panel.getByRole('button', { name: locale === 'en' ? 'Open shared version' : '查看已共享版本' }).click();
    await expect(panel.locator('.legacy-publication')).toBeVisible();
    await panel.locator('.legacy-step-reader summary').click();
    await panel.getByLabel(locale === 'en' ? 'Progress' : '办理进度', { exact: true }).selectOption('completed');
    const note = panel.getByLabel(locale === 'en' ? 'Progress note' : '办理备注', { exact: true });
    await note.fill('Synthetic unsaved progress');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(panel.locator('.legacy-step-reader')).toBeHidden();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect(note).toHaveValue('Synthetic unsaved progress');
    await panel.getByRole('button', { name: locale === 'en' ? 'Save progress' : '保存进度' }).click();
    await expect(panel.locator('.legacy-step-reader .legacy-status')).toHaveText(locale === 'en' ? 'Completed' : '已办结');
    await page.screenshot({ path: test.info().outputPath(`content-${locale}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    f.revoke(); await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect(panel.getByRole('alert')).toContainText(locale === 'en' ? 'no longer available' : '已不可用');
    await expect(panel.locator('.legacy-step-reader')).toHaveCount(0);
    expect(f.base.errors).toEqual([]); expect(f.base.unexpected).toEqual([]); expect(f.base.writes).toEqual([]);
    await context.close();
  });
}
test('microphone recording is local until save, then text requires a separate confirmation', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'zh-CN', permissions: ['microphone'] }), f = await fixture(context); f.state.acceptedNotice = true;
  const page = await context.newPage(); await page.goto(APP + '/?view=legacy'); const panel = page.locator('.legacy-content');
  await panel.getByRole('button', { name: '文件与原声', exact: true }).click(); await panel.getByRole('button', { name: '录下交代' }).click();
  await expect(panel.getByRole('status')).toContainText(/正在录音 · [1-9]/);
  expect(f.state.assets).toHaveLength(0); await panel.getByRole('button', { name: '停止录音' }).click();
  await panel.getByLabel('录音名称').fill('给家人的原声'); await panel.getByRole('button', { name: '保存录音' }).click();
  await panel.getByRole('button', { name: /给家人的原声/ }).click();
  await panel.getByLabel('核对后的文字', { exact: true }).fill('先保留照片，再办理关闭。');
  await expect(panel.getByLabel('我已对照录音核对这段文字。')).not.toBeChecked();
  await panel.getByLabel('我已对照录音核对这段文字。').check(); await panel.getByRole('button', { name: '保存', exact: true }).click();
  expect(f.state.assets[0].transcriptConfirmed).toBe(true); expect(f.changes.filter(change => change.upload)).toHaveLength(1);
  expect(f.base.errors).toEqual([]); expect(f.base.unexpected).toEqual([]); await context.close();
});
test('leaving an unsaved pack is guarded and account invalidation clears private content', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en' }), f = await fixture(context); f.state.acceptedNotice = true;
  const page = await context.newPage(); await page.goto(APP + '/?view=legacy');
  await page.getByRole('button', { name: 'Create action pack' }).click(); await page.getByLabel('Pack name').fill('Unshared private note');
  await page.locator('.sidebar').getByRole('button', { name: 'Matters', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('rillora:account-changed')));
  await expect(page.locator('.legacy-editor input')).toHaveCount(0);
  expect(f.state.packs).toHaveLength(0); expect(f.base.errors).toEqual([]); await context.close();
});

test.describe('actual on-device speech model', () => {
  test.skip(process.env.RILLORA_TEST_LOCAL_SPEECH !== 'true', 'Explicit local model qualification uses generated synthetic audio and the verified 60 MB model; no model download in ordinary CI.');
  for (const language of ['en-US', 'zh-CN']) test(`keeps audio on the device and produces a reviewable draft ${language}`, async ({ browser }) => {
    test.setTimeout(180000);
    const context = await browser.newContext({ locale: language === 'en-US' ? 'en' : 'zh-CN' }), f = await fixture(context);
    f.state.acceptedNotice = true;
    const file = await readFile(resolve(`../../output/qa/rillora-web-content-20261022/transcription/${language === 'en-US' ? 'en' : 'zh'}.f32`));
    const samples = new Float32Array(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
    const bytes = Buffer.from(await pcmWave(samples).arrayBuffer());
    const asset = { publicId: randomUUID(), kind: 'voice', mediaType: 'audio/wav', byteCount: bytes.length, version: 1,
      state: 'ready', name: language === 'en-US' ? 'Synthetic instructions' : '合成原声交代', description: '', transcript: '', transcriptConfirmed: false, language };
    f.state.assets.push(asset);
    await context.route(APP + '/api/v1/legacy-content/assets/' + asset.publicId + '/download', route => route.fulfill({ body: bytes,
      headers: { 'content-type': 'audio/wav', 'content-disposition': 'attachment; filename="voice.wav"', 'x-rillora-file-bytes': String(bytes.length), 'content-length': String(bytes.length) } }));
    await context.route(url => url.origin === APP && url.pathname === '/', async route => {
      const response = await route.fetch(); await route.fulfill({ response, headers: { ...response.headers(),
        'content-security-policy': "default-src 'self'; connect-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self' data:; media-src 'self' blob:; worker-src 'self'; object-src 'none'" } });
    });
    const page = await context.newPage(); await page.goto(APP + '/?view=legacy'); const panel = page.locator('.legacy-content');
    await panel.getByRole('button', { name: language === 'en-US' ? 'Files & voice' : '文件与原声', exact: true }).click();
    await panel.getByRole('button', { name: new RegExp(asset.name) }).click();
    const started = Date.now(); await panel.getByRole('button', { name: language === 'en-US' ? 'Generate a text draft on this device' : '在这台设备上生成文字草稿' }).click();
    await Promise.race([
      panel.locator('.legacy-draft').waitFor({ timeout: 150000 }),
      panel.locator('.legacy-local-transcription [role=alert]').waitFor({ timeout: 150000 }).then(() => { throw new Error('Local speech failed: ' + JSON.stringify(f.base.errors)); }),
    ]);
    await expect(panel.locator('.legacy-draft')).toContainText(language === 'en-US' ? /do not cancel the insurance/i : /不要取消保[險险]/);
    await test.info().attach('local-model-result', { body: JSON.stringify({ language, elapsedMs: Date.now() - started, text: await panel.locator('.legacy-draft .legacy-preserve-lines').textContent() }), contentType: 'application/json' });
    expect(asset.transcript).toBe(''); expect(f.changes).toEqual([]);
    await panel.getByRole('button', { name: language === 'en-US' ? 'Use this draft' : '采用这份草稿' }).click();
    await expect(panel.getByLabel(language === 'en-US' ? 'I have checked this text against my recording.' : '我已对照录音核对这段文字。')).not.toBeChecked();
    await page.screenshot({ path: test.info().outputPath(`speech-draft-${language}.png`), fullPage: true });
    expect(f.base.errors).toEqual([]); expect(f.base.unexpected).toEqual([]); await context.close();
  });
});
