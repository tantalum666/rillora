import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LegacyContentCipher, type SealContext } from '../src/legacy-content/crypto.js';
import { TestContentKeys } from './content-test-keys.js';
import { packBodySchema, validateAssetBytes } from '../src/legacy-content/contracts.js';

const context = (): SealContext => ({ owner: randomUUID(), resource: randomUUID(), purpose: 'asset', version: 1 });
describe('Private file envelopes', () => {
  it('round-trips arbitrary bytes without plaintext in the stored descriptor or ciphertext', async () => {
    const cipher = new LegacyContentCipher('rillora-staging', new TestContentKeys());
    const target = context(), source = Buffer.from('Private original voice\u0000\u00ff', 'utf8');
    const stored = await cipher.seal(source, target);
    expect(stored.ciphertext.includes(Buffer.from('Private original'))).toBe(false);
    expect(JSON.stringify(stored.header)).not.toContain('Private original');
    expect(await cipher.open(stored.ciphertext, stored.header, target, source.length)).toEqual(source);
  });
  it('binds the owner, resource, purpose, version and environment independently', async () => {
    const keys = new TestContentKeys(), cipher = new LegacyContentCipher('rillora-staging', keys);
    const target = context(), stored = await cipher.seal(Buffer.from('Private data'), target);
    for (const other of [{ ...target, owner: randomUUID() }, { ...target, resource: randomUUID() },
      { ...target, purpose: 'pack' as const }, { ...target, version: 2 }]) {
      await expect(cipher.open(stored.ciphertext, stored.header, other, 100)).rejects.toMatchObject({ code: 'legacy_content_unavailable' });
    }
    await expect(new LegacyContentCipher('rillora-production', keys).open(stored.ciphertext, stored.header, target, 100)).rejects.toThrow();
    expect(keys.unwrapped).toBe(0);
  });
  it('rejects changed bytes, forged header fields, malformed base64 and oversize ciphertext', async () => {
    const cipher = new LegacyContentCipher('rillora-staging', new TestContentKeys());
    const target = context(), stored = await cipher.seal(Buffer.from('Original'), target);
    const corrupt = Buffer.from(stored.ciphertext); corrupt[0] = corrupt[0]! ^ 1;
    await expect(cipher.open(corrupt, stored.header, target, 100)).rejects.toThrow();
    await expect(cipher.open(stored.ciphertext, { ...stored.header, extra: true }, target, 100)).rejects.toThrow();
    await expect(cipher.open(stored.ciphertext, { ...stored.header, tag: ' '.repeat(24) }, target, 100)).rejects.toThrow();
    await expect(cipher.open(stored.ciphertext, stored.header, target, 1)).rejects.toThrow();
  });
  it('fails closed when keys become unavailable and preserves a bounded JSON payload', async () => {
    const keys = new TestContentKeys(), cipher = new LegacyContentCipher('rillora-staging', keys);
    const target = { ...context(), purpose: 'pack' as const };
    const stored = await cipher.sealJson({ title: '给女儿的说明' }, target);
    expect(await cipher.openJson(stored, target, z.object({ title: z.string() }).strict())).toEqual({ title: '给女儿的说明' });
    keys.fail = true;
    await expect(cipher.openJson(stored, target, z.object({ title: z.string() }))).rejects.toThrow();
    await expect(cipher.sealJson({ value: 'x'.repeat(50 * 1024) }, target)).rejects.toMatchObject({ code: 'legacy_content_too_large' });
  });
});
describe('Content input boundaries', () => {
  it('requires both an allowed type and matching file bytes', () => {
    expect(() => validateAssetBytes(Buffer.from('%PDF-1.7\nsynthetic'), 'application/pdf', 'file')).not.toThrow();
    expect(() => validateAssetBytes(Buffer.from('<script>bad</script>'), 'application/pdf', 'file')).toThrow();
    expect(() => validateAssetBytes(Buffer.from('%PDF-1.7\nsynthetic'), 'audio/wav', 'voice')).toThrow();
    expect(() => validateAssetBytes(Buffer.from('%PDF-1.7\nsynthetic'), 'application/pdf', 'voice')).toThrow();
    expect(() => validateAssetBytes(Buffer.alloc(0), 'application/pdf', 'file')).toThrow();
  });
  it('supports ordered tasks but rejects unknown, self and cyclic prerequisites', () => {
    const a = randomUUID(), b = randomUUID();
    const task = (id: string, dependsOn: string[]) => ({ id, matterPublicId: null, title: 'Save selected records', action: 'preserve', instructions: '', providerId: null, dependsOn });
    const body = { title: 'Family pack', note: '', assetPublicIds: [], assetVersions: {}, tasks: [task(a, []), task(b, [a])] };
    expect(packBodySchema.safeParse(body).success).toBe(true);
    for (const tasks of [[task(a, [b]), task(b, [a])], [task(a, [a])], [task(a, [randomUUID()])]])
      expect(packBodySchema.safeParse({ ...body, tasks }).success).toBe(false);
  });
});
