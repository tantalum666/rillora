import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectVersionsCommand, S3Client } from '@aws-sdk/client-s3';
import { ApiError } from '../errors.js';
import { contentLimits } from './contracts.js';

export interface ContentObjectStore {
  put(key: string, ciphertext: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const keyPattern = new RegExp(`^content/${uuid}/${uuid}$`);
export function contentObjectKey(owner: string, resource: string): string {
  const key = `content/${owner}/${resource}`;
  if (!keyPattern.test(key)) throw new Error('Invalid private object identity');
  return key;
}
function unavailable() { return new ApiError(503, 'legacy_storage_unavailable', 'The saved file is temporarily unavailable. Try again later.'); }
export class S3ContentObjectStore implements ContentObjectStore {
  private readonly client: S3Client;
  constructor(private readonly bucket: string, region: string) {
    if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || region !== 'eu-central-1') throw new Error('Invalid content storage configuration');
    this.client = new S3Client({ region, maxAttempts: 2 });
  }
  async put(key: string, ciphertext: Buffer): Promise<void> {
    if (!keyPattern.test(key) || ciphertext.length > contentLimits.fileBytes) throw unavailable();
    try { await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: ciphertext,
      ContentType: 'application/octet-stream', ServerSideEncryption: 'AES256', IfNoneMatch: '*' }),
      { abortSignal: AbortSignal.timeout(15000) }); }
    catch { throw unavailable(); }
  }
  async get(key: string): Promise<Buffer> {
    if (!keyPattern.test(key)) throw unavailable();
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }), { abortSignal: AbortSignal.timeout(15000) });
      if (!result.Body || result.ContentLength === undefined || result.ContentLength > contentLimits.fileBytes) throw unavailable();
      const chunks: Buffer[] = []; let length = 0;
      for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
        length += chunk.byteLength;
        if (length > contentLimits.fileBytes) throw unavailable();
        chunks.push(Buffer.from(chunk));
      }
      if (length !== result.ContentLength) throw unavailable();
      return Buffer.concat(chunks);
    } catch { throw unavailable(); }
  }
  async remove(key: string): Promise<void> {
    if (!keyPattern.test(key)) throw unavailable();
    try {
      // The bucket is versioned. A plain DeleteObject would leave recoverable
      // versions and could not justify a completed account-deletion receipt.
      for (let pass = 0; pass < 3; pass++) {
        const listed = await this.client.send(new ListObjectVersionsCommand({ Bucket: this.bucket, Prefix: key, MaxKeys: 100 }), { abortSignal: AbortSignal.timeout(10000) });
        if (listed.IsTruncated) throw unavailable();
        const versions = [...listed.Versions ?? [], ...listed.DeleteMarkers ?? []].filter(item => item.Key === key);
        if (!versions.length) return;
        if (versions.length > 16) throw unavailable();
        for (const version of versions) {
          if (!version.VersionId) throw unavailable();
          await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key, VersionId: version.VersionId }), { abortSignal: AbortSignal.timeout(10000) });
        }
      }
      throw unavailable();
    }
    catch { throw unavailable(); }
  }
}
