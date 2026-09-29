import { createHash } from 'node:crypto';
import type { AppConfig } from './config.js';

// An identity provider login is not permission to enter the unreleased service.
// The digest uses the same exact issuer/subject pair as the legal receipt.
export function reviewIdentityDigest(issuer: string, subject: string): string {
  return createHash('sha256').update(`${issuer}\u001f${subject}`, 'utf8').digest('hex');
}

export function reviewAccessOpen(config: AppConfig, now = Date.now()): boolean {
  return !config.productionReviewAccess || now < config.productionReviewAccess.expiresAt;
}

export function reviewIdentityAllowed(config: AppConfig, digest: string, now = Date.now()): boolean {
  return reviewAccessOpen(config, now)
    && (!config.productionReviewAccess || config.productionReviewAccess.identityDigests.includes(digest));
}
