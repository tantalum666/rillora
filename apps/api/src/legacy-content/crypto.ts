import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { ContentKeyProvider } from '../private-content.js';
import { ApiError } from '../errors.js';

export type SealContext = Readonly<{
  owner: string;
  resource: string;
  purpose: 'asset' | 'asset-metadata' | 'pack' | 'progress';
  version: number;
}>;
const contextSchema = z.object({
  owner: z.uuid(), resource: z.uuid(),
  purpose: z.enum(['asset', 'asset-metadata', 'pack', 'progress']),
  version: z.number().int().positive(),
}).strict();
const headerSchema = contextSchema.extend({
  format: z.literal('rillora-content-v1'), namespace: z.string().min(1).max(80),
  keyRef: z.string().min(1).max(2048), wrappedKey: z.string().min(1).max(12000),
  nonce: z.string().length(16), tag: z.string().length(24),
}).strict();
export type SealedHeader = z.infer<typeof headerSchema>;
export type SealedJson = { header: SealedHeader; ciphertext: string };
const unavailable = () => new ApiError(503, 'legacy_content_unavailable', 'This content could not be opened safely. Try again later.');
function decode(value: string, exact?: number): Buffer {
  const result = Buffer.from(value, 'base64');
  if (result.toString('base64') !== value || (exact !== undefined && result.length !== exact)) throw unavailable();
  return result;
}
function associatedData(namespace: string, context: SealContext): Buffer {
  return Buffer.from(JSON.stringify(['rillora-content-v1', namespace, context.owner, context.resource, context.purpose, context.version]));
}

/** Same managed-key trust boundary as existing private content; not E2EE. */
export class LegacyContentCipher {
  constructor(private readonly namespace: string, private readonly provider: ContentKeyProvider) {}

  async seal(plaintext: Buffer, rawContext: SealContext): Promise<{ header: SealedHeader; ciphertext: Buffer }> {
    const context = contextSchema.parse(rawContext);
    const generated = await this.provider.generate({ namespace: this.namespace, owner: context.owner, id: context.resource });
    try {
      if (generated.plaintext.length !== 32) throw unavailable();
      const nonce = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', generated.plaintext, nonce, { authTagLength: 16 });
      cipher.setAAD(associatedData(this.namespace, context));
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      return { ciphertext, header: { ...context, format: 'rillora-content-v1', namespace: this.namespace,
        keyRef: generated.wrappingKeyRef, wrappedKey: generated.wrapped.toString('base64'),
        nonce: nonce.toString('base64'), tag: cipher.getAuthTag().toString('base64') } };
    } finally { generated.plaintext.fill(0); }
  }

  async open(ciphertext: Buffer, rawHeader: unknown, expected: SealContext, maxBytes: number): Promise<Buffer> {
    let key: Buffer | undefined;
    try {
      const header = headerSchema.parse(rawHeader);
      contextSchema.parse(expected);
      if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || ciphertext.length > maxBytes
        || header.namespace !== this.namespace || header.owner !== expected.owner || header.resource !== expected.resource
        || header.purpose !== expected.purpose || header.version !== expected.version) throw unavailable();
      key = await this.provider.unwrap(decode(header.wrappedKey), header.keyRef,
        { namespace: this.namespace, owner: expected.owner, id: expected.resource });
      if (key.length !== 32) throw unavailable();
      const decipher = createDecipheriv('aes-256-gcm', key, decode(header.nonce, 12), { authTagLength: 16 });
      decipher.setAAD(associatedData(this.namespace, expected));
      decipher.setAuthTag(decode(header.tag, 16));
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch { throw unavailable(); }
    finally { key?.fill(0); }
  }

  async sealJson(value: unknown, context: SealContext): Promise<SealedJson> {
    const bytes = Buffer.from(JSON.stringify(value), 'utf8');
    if (bytes.length > 48 * 1024) throw new ApiError(413, 'legacy_content_too_large', 'Reduce this content before saving.');
    try {
      const sealed = await this.seal(bytes, context);
      return { header: sealed.header, ciphertext: sealed.ciphertext.toString('base64') };
    } finally { bytes.fill(0); }
  }

  async openJson<T>(envelope: unknown, context: SealContext, schema: z.ZodType<T>): Promise<T> {
    let plaintext: Buffer | undefined;
    try {
      const stored = z.object({ header: headerSchema, ciphertext: z.string().max(65536) }).strict().parse(envelope);
      plaintext = await this.open(decode(stored.ciphertext), stored.header, context, 48 * 1024);
      return schema.parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext)));
    } catch { throw unavailable(); }
    finally { plaintext?.fill(0); }
  }
}
