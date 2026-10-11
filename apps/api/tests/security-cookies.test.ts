import { describe, expect, it } from 'vitest';
import { readSecurityCookie, securityCookieName } from '../src/security-cookies.js';

describe('host-bound authentication cookies', () => {
  it('uses host-only browser-enforced names in production without a legacy fallback', () => {
    const name = securityCookieName({nodeEnv:'production'}, 'continuity_session');
    expect(name).toBe('__Host-continuity_session');
    expect(readSecurityCookie('continuity_session=attacker', name)).toBeUndefined();
    expect(readSecurityCookie(`continuity_session=attacker; ${name}=owner`, name)).toBe('owner');
    expect(securityCookieName({nodeEnv:'development'}, 'continuity_session')).toBe('continuity_session');
  });
  it('rejects duplicate security values rather than choosing by browser ordering', () => {
    const name = '__Host-continuity_session';
    expect(() => readSecurityCookie(`${name}=one; ${name}=two`,name)).toThrow();
    expect(() => readSecurityCookie(`${name}=one; ${name}=one`,name)).toThrow();
    expect(readSecurityCookie(`other=one; ${name}X=two`,name)).toBeUndefined();
  });
});
