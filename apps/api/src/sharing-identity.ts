import { createHash, createHmac, randomBytes } from "node:crypto";
import type { AppConfig } from './config.js';

const ephemeralTestKey = randomBytes(48).toString('base64url');

export function emailMatchKey(config: Pick<AppConfig, 'nodeEnv' | 'emailMatchKey'>): string {
  const key = config.emailMatchKey ?? (config.nodeEnv === 'test' ? ephemeralTestKey : null);
  if (!key || !/^[A-Za-z0-9_-]{48,128}$/.test(key)) throw new Error('Email matching requires protected key configuration');
  return key;
}

export function verifiedEmailDigest(email: string): Buffer {
  return createHash("sha256").update(`rillora-invitation-email-v1\u001f${email.trim().toLowerCase()}`, "utf8").digest();
}

/** Legacy input is transient only. The persisted match is keyed and owner scoped. */
export function scopedEmailDigest(legacyDigest: Buffer, ownerPublicId: string, key: string): Buffer {
  if (legacyDigest.length !== 32 || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(ownerPublicId)
    || !/^[A-Za-z0-9_-]{48,128}$/.test(key)) throw new Error('Invalid email matching context');
  return createHmac('sha256', key).update('rillora-invitation-email-v2\u001f')
    .update(ownerPublicId.toLowerCase()).update('\u001f').update(legacyDigest).digest();
}

export function emailMatchVerifier(key: string): Buffer {
  return createHmac('sha256', key).update('rillora-email-match-key-check-v2').digest();
}

export function maskedEmail(email: string): string {
  const [name = "", domain = ""] = email.trim().toLowerCase().split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}
