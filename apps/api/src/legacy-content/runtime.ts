import { z } from 'zod';
import type { AppConfig } from '../config.js';
import type { DatabasePool } from '../db.js';
import { KmsContentKeyProvider } from '../private-content.js';
import { LegacyContentCipher } from './crypto.js';
import { S3ContentObjectStore } from './object-store.js';
import { ContentContext } from './context.js';

export function contentConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const enabled = z.enum(['true', 'false']).default('false').parse(env.RILLORA_LEGACY_CONTENT_ENABLED) === 'true';
  if (!enabled) return null;
  return { bucket: z.string().regex(/^rillora-(production|staging)-private-content-[a-z0-9-]+$/).parse(env.RILLORA_CONTENT_BUCKET) };
}
export function contentFromEnvironment(pool: DatabasePool, config: AppConfig, env: NodeJS.ProcessEnv = process.env) {
  const storage = contentConfiguration(env); if (!storage) return undefined;
  if (config.productionRuntimeClosed || config.productionReviewAccess || config.contentProtection?.mode !== 'encrypted'
    || config.contentProtection.region !== 'eu-central-1' || !config.deletionWorkerEnabled)
    throw new Error('Content requires an encrypted, open runtime with isolated cleanup');
  const cipher = new LegacyContentCipher(config.contentProtection.namespace, new KmsContentKeyProvider(config.contentProtection));
  if (!storage.bucket.startsWith(`${config.contentProtection.namespace}-private-content-`)) throw new Error('Content storage environment mismatch');
  const writesEnabled = z.enum(['true', 'false']).default('true').parse(env.RILLORA_CONTENT_WRITES_ENABLED) === 'true';
  return new ContentContext(pool, cipher, new S3ContentObjectStore(storage.bucket, 'eu-central-1'), writesEnabled);
}
