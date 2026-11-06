import type { RequestHandler } from 'express';
import { authenticate } from './auth.js';
import type { AppConfig } from './config.js';
import type { DatabasePool } from './db.js';
import { ApiError } from './errors.js';
import type { SessionSecurity } from './session-security.js';

/** Reuse the legal-receipt identity check on reviewer purchase routes only.
 * The ordinary session has already been authenticated by the parent router. */
export function appleReviewAccessRequired(pool: DatabasePool, config: AppConfig, sessionSecurity?: SessionSecurity): RequestHandler {
  const access = config.appleReviewAccess ?? config.productionReviewAccess;
  if (!access) {
    if (config.nodeEnv === 'production') throw new Error('Production Apple review requires a scoped identity window');
    return (_request, _response, next) => next();
  }
  const restricted = authenticate(pool, { ...config, productionReviewAccess: access }, sessionSecurity ? { sessionSecurity } : {});
  const unavailable = () => new ApiError(403, 'apple_review_not_enrolled',
    'This account is not enrolled for Apple purchase testing.');
  return (request, response, next) => {
    if (!request.auth || request.auth.mode === 'development') return next(unavailable());
    return restricted(request, response, error => {
      // A valid ordinary customer remains signed in when reviewer-only access
      // is denied. Real session failures are handled by the parent auth router.
      next(error instanceof ApiError && ['authentication_required', 'service_not_open'].includes(error.code)
        ? unavailable() : error);
    });
  };
}
