import type { AppConfig } from './config.js';
import { ApiError } from './errors.js';

type CookieConfig = Pick<AppConfig, 'nodeEnv'> & Partial<Pick<AppConfig, 'oidc'>>;

/** Every configured HTTPS origin uses host-bound cookies, including isolated previews. */
export function securityCookieName(config: CookieConfig, name: string): string {
  return usesSecureCookies(config) ? `__Host-${name}` : name;
}

/** A configured HTTPS preview needs Secure cookies too; request headers cannot opt out. */
export function usesSecureCookies(config: CookieConfig): boolean {
  return config.nodeEnv === 'production' || config.oidc?.webAppOrigin.startsWith('https://') === true;
}

export function readSecurityCookie(header: string | undefined, name: string): string | undefined {
  const matches = (header ?? '').split(';').map(part => part.trim())
    .filter(part => part.startsWith(`${name}=`));
  if (matches.length > 1) throw new ApiError(400, 'ambiguous_security_cookie', 'Sign in again to continue.');
  return matches[0]?.slice(name.length + 1);
}
