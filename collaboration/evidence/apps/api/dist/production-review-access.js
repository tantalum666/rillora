import { createHash } from 'node:crypto';
// An identity provider login is not permission to enter the unreleased service.
// The digest uses the same exact issuer/subject pair as the legal receipt.
export function reviewIdentityDigest(issuer, subject) {
    return createHash('sha256').update(`${issuer}\u001f${subject}`, 'utf8').digest('hex');
}
export function reviewAccessOpen(config, now = Date.now()) {
    return !config.productionReviewAccess || now < config.productionReviewAccess.expiresAt;
}
export function reviewIdentityAllowed(config, digest, now = Date.now()) {
    return reviewAccessOpen(config, now)
        && (!config.productionReviewAccess || config.productionReviewAccess.identityDigests.includes(digest));
}
