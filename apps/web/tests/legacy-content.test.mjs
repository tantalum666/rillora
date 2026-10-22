import test from 'node:test';
import assert from 'node:assert/strict';
import { pcmWave } from '../src/legacyVoice.js';
import { contentDownloadName, fileUploadBody, validateContentAsset, validatePackBody } from '../src/legacyContent.js';
import { createApiClient } from '../src/api.js';
import { en, zhCN } from '../src/i18n/messages/legacyContent.js';
const ID = '11111111-1111-4111-8111-111111111111';
test('PCM recording preserves duration and clips only sample amplitudes', async () => {
  const blob = pcmWave(new Float32Array([-2, -1, 0, 1, 2, NaN])), bytes = new DataView(await blob.arrayBuffer());
  assert.equal(blob.type, 'audio/wav'); assert.equal(blob.size, 56); assert.equal(bytes.getUint32(24, true), 16000);
  assert.deepEqual(Array.from({ length: 6 }, (_, i) => bytes.getInt16(44 + i * 2, true)), [-32768, -32768, 0, 32767, 32767, 0]);
  assert.throws(() => pcmWave(new Float32Array(0))); assert.throws(() => pcmWave(new Float32Array(180 * 16000 + 1)));
});
test('binary upload frames bounded UTF-8 metadata separately from the exact file', async () => {
  const metadata = { requestKey: ID, metadata: { name: '给女儿.pdf' } }, data = new Uint8Array([0, 255, 17]);
  const body = fileUploadBody(new Blob([data]), metadata), bytes = await body.arrayBuffer(), length = new DataView(bytes).getUint32(0);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(bytes.slice(4, 4 + length))), metadata);
  assert.deepEqual(new Uint8Array(bytes.slice(4 + length)), data);
  assert.throws(() => fileUploadBody(new Blob([new Uint8Array(8388609)]), metadata));
});
test('new binary requests keep the current account and CSRF boundaries', async () => {
  let captured;
  const asset = { publicId: ID, kind: 'file', state: 'ready', mediaType: 'application/pdf', byteCount: 5, version: 1, name: 'copy.pdf', description: '', transcript: '', transcriptConfirmed: false };
  const client = createApiClient({ devPlannerId: ID, csrfTokenReader: () => 'synthetic-csrf', fetchImpl: async (_url, options) => { captured = options; return new Response(JSON.stringify({ asset }), { headers: { 'content-type': 'application/json' } }); } });
  const result = await client.legacy.upload(new Blob(['%PDF-']), { requestKey: ID });
  assert.equal(result.asset.publicId, ID); assert.ok(captured.body instanceof Blob);
  assert.equal(captured.headers.get('x-rillora-planner'), ID); assert.equal(captured.headers.get('x-csrf-token'), 'synthetic-csrf');
  assert.equal(captured.headers.get('content-type'), 'application/octet-stream'); assert.equal(captured.credentials, 'include');
});
test('download refuses wrong types, incomplete bytes and non-attachment responses', async () => {
  for (const headers of [{ 'content-type': 'text/html', 'x-rillora-file-bytes': '5', 'content-disposition': 'attachment;' },
    { 'content-type': 'application/pdf', 'x-rillora-file-bytes': '10', 'content-disposition': 'attachment;' },
    { 'content-type': 'application/pdf', 'x-rillora-file-bytes': '5', 'content-disposition': 'inline;' }]) {
    const client = createApiClient({ fetchImpl: async () => new Response('%PDF-', { headers }) });
    await assert.rejects(client.legacy.download({ publicId: ID, byteCount: 5, mediaType: 'application/pdf' }), { code: 'legacy_invalid_response' });
  }
  const headers = { 'content-type': 'application/pdf', 'content-length': '3', 'x-rillora-file-bytes': '5', 'content-disposition': 'attachment;' };
  const good = createApiClient({ fetchImpl: async () => new Response('%PDF-', { headers }) });
  assert.equal((await good.legacy.download({ publicId: ID, byteCount: 5, mediaType: 'application/pdf' })).blob.size, 5);
  const truncated = createApiClient({ fetchImpl: async () => new Response('%PDF', { headers }) });
  await assert.rejects(truncated.legacy.download({ publicId: ID, byteCount: 5, mediaType: 'application/pdf' }), { code: 'legacy_invalid_response' });
});
test('asset and pack projections reject unsupported content and unbound file versions', () => {
  assert.equal(contentDownloadName({ name: '给家人的录音', mediaType: 'audio/wav' }), '给家人的录音.wav');
  assert.equal(contentDownloadName({ name: 'copy.PDF', mediaType: 'application/pdf' }), 'copy.PDF');
  assert.equal(contentDownloadName({ name: 'copy.exe', mediaType: 'application/pdf' }), 'copy.exe.pdf');
  assert.throws(() => validateContentAsset({ publicId: ID, kind: 'file', state: 'ready', mediaType: 'text/html' }));
  assert.throws(() => validatePackBody({ title: 'Pack', note: '', tasks: [], assetPublicIds: [ID], assetVersions: {} }));
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zhCN).sort());
  for (const [key, value] of Object.entries(zhCN)) assert.ok(/[\p{Script=Han}]/u.test(value), `Chinese copy for ${key}`);
});
