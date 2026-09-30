import { ApiError } from './errors.js';
export const recentAuthenticationMilliseconds = 10 * 60_000;
export function authenticationIsRecent(value, now = Date.now()) {
    const at = value?.getTime();
    return at !== undefined && Number.isFinite(at) && at <= now + 30_000
        && at >= now - recentAuthenticationMilliseconds;
}
export function requireRecentAuthentication(config, auth) {
    if (!config.requireRecentAuthentication)
        return;
    if (!authenticationIsRecent(auth.authenticatedAt)) {
        throw new ApiError(403, 'reauthentication_required', 'Sign in again to continue. Your changes have not been submitted.');
    }
}
/** Attach to the business route so authorization uses the same match as dispatch. */
export function recentAuthenticationRequired(config) {
    return (request, _response, next) => {
        try {
            requireRecentAuthentication(config, request.auth);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
export function expandsSharing(previous, next) {
    const rank = { name: 1, directions: 2, details: 3 };
    const old = new Map(previous.map(grant => [grant.matterPublicId, rank[grant.detailLevel]]));
    return next.some(grant => rank[grant.detailLevel] > (old.get(grant.matterPublicId) ?? 0));
}
