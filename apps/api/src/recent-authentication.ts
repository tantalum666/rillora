import type { Request, RequestHandler } from 'express';
import type { AppConfig } from './config.js';
import { ApiError } from './errors.js';

export const recentAuthenticationMilliseconds = 10 * 60_000;
export function authenticationIsRecent(value: Date | null | undefined, now = Date.now()): boolean {
  const at = value?.getTime();
  return at !== undefined && Number.isFinite(at) && at <= now + 30_000
    && at >= now - recentAuthenticationMilliseconds;
}
export function requireRecentAuthentication(config: AppConfig, auth: Request['auth']): void {
  if (!config.requireRecentAuthentication) return;
  if (!authenticationIsRecent(auth.authenticatedAt)) {
    throw new ApiError(403, 'reauthentication_required', 'Sign in again to continue. Your changes have not been submitted.');
  }
}
// Reducing or revoking access deliberately does not appear here. Scope expansion
// is checked inside the sharing transaction against the existing owned grants.
export function sensitiveActionAuthentication(config: AppConfig): RequestHandler {
  return (request, _response, next) => {
    try {
      if (request.method === 'POST' && (
        ['/account/map/export', '/account/map/import', '/account/delete', '/sharing/connections',
          '/exports/start-here/printable', '/exports/start-here/encrypted/prepare'].includes(request.path)
        || /^\/sharing\/connections\/[^/]+\/(link|live)$/.test(request.path)
      )) requireRecentAuthentication(config, request.auth);
      next();
    } catch (error) { next(error); }
  };
}
type Grant = { matterPublicId: string; detailLevel: 'name' | 'directions' | 'details' };
export function expandsSharing(previous: Grant[], next: Grant[]): boolean {
  const rank = { name: 1, directions: 2, details: 3 };
  const old = new Map(previous.map(grant => [grant.matterPublicId, rank[grant.detailLevel]]));
  return next.some(grant => rank[grant.detailLevel] > (old.get(grant.matterPublicId) ?? 0));
}
