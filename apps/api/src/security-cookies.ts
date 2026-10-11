import type { AppConfig } from './config.js';
import { ApiError } from './errors.js';

/** HTTPS production cookies cannot be planted by another rillora.xyz origin. */
export function securityCookieName(config: Pick<AppConfig, 'nodeEnv'>, name: string): string {
  return config.nodeEnv === 'production' ? `__Host-${name}` : name;
}

export function readSecurityCookie(header: string | undefined, name: string): string | undefined {
  const matches = (header ?? '').split(';').map(part => part.trim())
    .filter(part => part.startsWith(`${name}=`));
  if (matches.length > 1) throw new ApiError(400, 'ambiguous_security_cookie', 'Sign in again to continue.');
  return matches[0]?.slice(name.length + 1);
}
