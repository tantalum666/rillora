import { afterEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, ListObjectVersionsCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { S3ContentObjectStore, contentObjectKey } from '../src/legacy-content/object-store.js';
const key = () => contentObjectKey(randomUUID(), randomUUID());
const store = () => new S3ContentObjectStore('rillora-staging-private-content-synthetic', 'eu-central-1');
afterEach(() => vi.restoreAllMocks());
describe('Encrypted object transport and complete version cleanup', () => {
  it('puts only opaque, bounded bytes with conditional creation and bucket encryption', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never);
    const object = key(), bytes = Buffer.from('encrypted bytes'); await store().put(object, bytes);
    const command = send.mock.calls[0]![0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand); expect(command.input).toMatchObject({ Key: object, Body: bytes, IfNoneMatch: '*', ServerSideEncryption: 'AES256', ContentType: 'application/octet-stream' });
    await expect(store().put('../foreign', bytes)).rejects.toThrow(); expect(send).toHaveBeenCalledTimes(1);
  });
  it('checks declared length, actual length and the hard limit before returning bytes', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send');
    send.mockResolvedValueOnce({ ContentLength: 3, Body: Readable.from([Buffer.from('ab')]) } as never);
    await expect(store().get(key())).rejects.toMatchObject({ code: 'legacy_storage_unavailable' });
    send.mockResolvedValueOnce({ ContentLength: 8388609, Body: Readable.from([]) } as never);
    await expect(store().get(key())).rejects.toThrow();
    send.mockResolvedValueOnce({ ContentLength: 3, Body: Readable.from([Buffer.from('abc')]) } as never);
    expect(await store().get(key())).toEqual(Buffer.from('abc'));
  });
  it('removes every exact-key version and deletion marker, then verifies the list is empty', async () => {
    const object = key(), removed: unknown[] = []; let listed = false;
    vi.spyOn(S3Client.prototype, 'send').mockImplementation((async (command: unknown) => {
      if (command instanceof ListObjectVersionsCommand) {
        if (listed) return { Versions: [] }; listed = true;
        return { Versions: [{ Key: object, VersionId: 'version-one' }, { Key: object, VersionId: 'version-two' }, { Key: object + '-other', VersionId: 'unrelated' }],
          DeleteMarkers: [{ Key: object, VersionId: 'marker' }] };
      }
      if (command instanceof DeleteObjectCommand) { removed.push(command.input); return {}; }
      throw new Error('Unexpected request');
    }) as never);
    await store().remove(object);
    expect(removed).toHaveLength(3);
    expect(removed).toEqual(['version-one', 'version-two', 'marker'].map(VersionId => ({ Bucket: 'rillora-staging-private-content-synthetic', Key: object, VersionId })));
  });
  it('keeps cleanup pending on a partial, malformed or unexpectedly unbounded version list', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send');
    send.mockResolvedValueOnce({ IsTruncated: true } as never); await expect(store().remove(key())).rejects.toThrow();
    const object = key(); send.mockResolvedValueOnce({ Versions: [{ Key: object }] } as never); await expect(store().remove(object)).rejects.toThrow();
    expect(send).toHaveBeenCalledTimes(2);
  });
});
