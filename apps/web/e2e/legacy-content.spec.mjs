import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pcmWave } from '../src/legacyVoice.js';
import { isolate, OWNER, overview } from './fixtures.mjs';
const APP = 'http://127.0.0.1:4186', PERSON = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const notice = { version: '2026-10-22-1', en: { title: 'Files and voice', storage: 'Synthetic privacy notice', access: 'Private until explicitly shared' }, 'zh-CN': { title: '文件与原声', storage: '合成验收隐私说明', access: '主动共享前保持私有' } };
async function checkContentPage(page) {
  await expect(page).toHaveURL(APP + '/?view=legacy');
  await expect(page).toHaveTitle(/Rillora/);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
}
async function fixture(context) {
  const base = await isolate(context), changes = [], state = { canCreate: true, acceptedNotice: false, transcriptionAvailable: false,
    notice, assets: [], packs: [], received: [], cleanupPending: 0, limits: { fileBytes: 8388608, ownerBytes: 134217728 } };
  let publication = null, revoked = false;
  const faults = { overview: 0, publication: 0, state: 0 };
  await context.route('**/api/v1/overview', route => route.fulfill({ json: { ...overview, trustedContacts: [{ publicId: PERSON, displayName: '家人', status: 'accepted', version: 1 }] } }));
  await context.route('**/api/v1/legacy-content**', async route => {
    const req = route.request(), path = new URL(req.url()).pathname.replace('/api/v1/legacy-content', '');
    expect(req.headers()['x-rillora-planner']).toBe(OWNER);
    const fail = key => { if (faults[key] > 0) { faults[key]--; return true; } return false; };
    const unavailable = () => route.fulfill({ status: 503, json: { error: { code: 'temporarily_unavailable' } } });
    if (path === '' && req.method() === 'GET') return fail('overview') ? unavailable() : route.fulfill({ json: state });
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
    if (path.startsWith('/packs/') && req.method() === 'PATCH') {
      const pack = state.packs.find(item => path.endsWith(item.publicId)), input = req.postDataJSON();
      expect(input.expectedVersion).toBe(pack.version); changes.push(input);
      Object.assign(pack, input, { version: pack.version + 1 }); return route.fulfill({ json: { pack } });
    }
    if (path.endsWith('/publish')) {
      changes.push(req.postDataJSON()); const pack = state.packs[0]; pack.publicationId = randomUUID(); pack.publishedVersion = pack.version;
      publication = { publicId: pack.publicationId, body: structuredClone(pack.body), assets: state.assets.filter(asset => pack.body.assetPublicIds.includes(asset.publicId)),
        progress: [], isOwner: true, ownerName: null, publishedAt: '2026-10-22T03:00:00Z' };
      return route.fulfill({ json: { publication: { publicId: pack.publicationId } } });
    }
    if (path.includes('/publications/') && req.method() === 'GET') {
      if (revoked) return route.fulfill({ status: 404, json: { error: { code: 'legacy_unavailable' } } });
      if (fail(path.endsWith('/state') ? 'state' : 'publication')) return unavailable();
      return path.endsWith('/state') ? route.fulfill({ json: { revision: String(publication?.progress.reduce((sum, item) => sum + item.version, 0) ?? 0) } }) : route.fulfill({ json: { publication } });
    }
    if (path.endsWith('/progress')) {
      const input = req.postDataJSON(), old = publication.progress.find(item => item.taskId === input.progress.taskId);
      if (input.expectedVersion !== (old?.version ?? 0)) return route.fulfill({ status: 409, json: { error: { code: 'legacy_changed' } } });
      changes.push(input); const progress = { ...input.progress, publicId: old?.publicId ?? randomUUID(), version: (old?.version ?? 0) + 1, reportedByOwner: true, updatedAt: '2026-10-22T03:00:00Z' };
      publication.progress = [...publication.progress.filter(item => item.taskId !== progress.taskId), progress]; return route.fulfill({ json: { progress } });
    }
    throw new Error('Unexpected content fixture route: ' + req.method() + ' ' + path);
  });
  return { base, state, changes, faults, publication: () => publication,
    receive(value) { publication = value; state.received = [{ publicId: value.publicId, ownerName: value.ownerName, publishedAt: value.publishedAt, body: value.body }]; },
    revoke() { revoked = true; } };
}

test('confirmed save survives a failed list refresh without creating a duplicate', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en', viewport: { width: 1440, height: 1000 } }), f = await fixture(context);
  f.state.acceptedNotice = true;
  const page = await context.newPage(); await page.goto(APP + '/?view=legacy'); const panel = page.locator('.legacy-content');
  await checkContentPage(page);
  await panel.getByRole('button', { name: 'Create action pack' }).click();
  await panel.getByLabel('Pack name').fill('Saved once, refresh temporarily fails');
  f.faults.overview = 1;
  await panel.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(panel.locator('.legacy-status')).toContainText('Saved. The list could not refresh');
  await expect(panel.locator('.legacy-editor')).toHaveCount(0);
  await panel.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(panel.locator('.legacy-pack')).toHaveCount(1);
  await expect(panel.locator('p.legacy-status')).toHaveText('Saved');
  expect(f.state.packs).toHaveLength(1); expect(f.changes.filter(item => item.body)).toHaveLength(1);
  await page.screenshot({ path: test.info().outputPath('confirmed-save-recovered.png'), fullPage: true });
  expect(f.base.errors).toEqual([]); expect(f.base.unexpected).toEqual([]); await context.close();
});

test('temporary access checks and confirmed progress recover without losing the draft or version', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 390, height: 900 } }), f = await fixture(context);
  f.state.acceptedNotice = true;
  const step = { id: randomUUID(), title: '保留合成资料', action: 'preserve', instructions: '只用于断网恢复验收', matterPublicId: null, providerId: null, dependsOn: [] };
  f.receive({ publicId: randomUUID(), ownerName: '合成规划者', publishedAt: '2026-10-23T00:00:00Z', isOwner: false,
    body: { title: '合成亲友办理包', note: '', tasks: [step], assetPublicIds: [], assetVersions: {} }, assets: [], progress: [] });
  const page = await context.newPage(); await page.goto(APP + '/?view=legacy'); const panel = page.locator('.legacy-content');
  await checkContentPage(page);
  await panel.getByRole('button', { name: '收到的办理包', exact: true }).click();
  await panel.getByRole('button', { name: /合成亲友办理包/ }).click();
  await panel.locator('.legacy-step-reader summary').click();
  const note = panel.getByLabel('办理备注', { exact: true }); await note.fill('未保存的合成备注');
  f.faults.state = 1;
  await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); });
  await expect(panel.locator('.legacy-step-reader')).toBeHidden();
  await panel.locator('.legacy-publication').getByRole('button', { name: '重试', exact: true }).click();
  await expect(note).toHaveValue('未保存的合成备注'); await expect(panel.getByRole('alert')).toHaveCount(0);
  await panel.getByLabel('办理进度', { exact: true }).selectOption('ready');
  f.faults.publication = 1;
  await panel.getByRole('button', { name: '保存进度', exact: true }).click();
  await expect(panel.locator('.legacy-step-reader')).toBeHidden();
  expect(f.publication().progress[0].version).toBe(1);
  await panel.locator('.legacy-publication').getByRole('button', { name: '重试', exact: true }).click();
  await expect(note).toHaveValue('未保存的合成备注');
  await expect(panel.getByRole('button', { name: '保存进度', exact: true })).toBeDisabled();
  await note.fill('第二次合成更新'); await panel.getByRole('button', { name: '保存进度', exact: true }).click();
  await expect(panel.getByRole('button', { name: '保存进度', exact: true })).toBeDisabled();
  expect(f.publication().progress[0].version).toBe(2);
  expect(f.changes.filter(item => item.progress).map(item => item.expectedVersion)).toEqual([0, 1]);
  await page.screenshot({ path: test.info().outputPath('progress-recovered-zh.png'), fullPage: true });
  expect(f.base.errors).toEqual([]); expect(f.base.unexpected).toEqual([]); await context.close();
});

test('unavailable references can be removed without abandoning the action pack', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'en' }), f = await fixture(context); f.state.acceptedNotice = true;
  const missingFile = randomUUID(), missingMatter = randomUUID(), missingPerson = randomUUID();
  f.state.packs = [{ publicId: randomUUID(), personPublicId: missingPerson, intent: 'after_death', version: 1, publicationId: null, publishedVersion: null,
    body: { title: 'Recoverable synthetic pack', note: '', assetPublicIds: [missingFile], assetVersions: { [missingFile]: 1 }, tasks: [{ id: randomUUID(), title: 'Keep this step', matterPublicId: missingMatter, providerId: null, instructions: '', action: 'preserve', dependsOn: [] }] } }];
  const page = await context.newPage(); await page.goto(APP + '/?view=legacy'); const panel = page.locator('.legacy-content');
  await checkContentPage(page);
  await panel.getByRole('button', { name: 'Edit', exact: true }).click();
  await panel.getByLabel('For', { exact: true }).selectOption('');
  await panel.getByLabel('Related matter', { exact: true }).selectOption('');
  await panel.getByRole('button', { name: 'Remove this file from the pack' }).click();
  await panel.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(panel.locator('.legacy-pack')).toContainText('Recoverable synthetic pack');
  expect(f.state.packs[0].personPublicId).toBe(null); expect(f.state.packs[0].body.tasks[0].matterPublicId).toBe(null);
  expect(f.state.packs[0].body.assetPublicIds).toEqual([]); expect(f.state.packs[0].body.assetVersions).toEqual({});
  expect(f.base.errors).toEqual([]); expect(f.base.unexpected).toEqual([]); await context.close();
});
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
