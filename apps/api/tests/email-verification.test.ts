import { describe, expect, it, vi } from "vitest";
import { Auth0EmailIdentityVerifier } from "../src/email-verification.js";
import { loadConfig } from "../src/config.js";

const config = { domain: "tenant.eu.auth0.com", clientId: "readonly-client", clientSecret: "synthetic-secret-not-a-credential", allowedIssuers: ["https://login.example.test/"] };
const identity = { issuer: "https://login.example.test", subject: "auth0|recipient" };
const token = () => Response.json({ access_token: "synthetic-token", expires_in: 3600 });

describe("Current-session email proof", () => {
  it("reads only the exact provider subject and reuses the limited service token", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    let verified = false;
    const transport = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push([String(url), init]);
      return String(url).endsWith("/oauth/token") ? token() : Response.json({ user_id: identity.subject, email: "recipient@example.test", email_verified: verified });
    });
    const verifier = new Auth0EmailIdentityVerifier(config, transport as typeof fetch);
    expect(await verifier.verifiedEmail(identity)).toBeNull();
    verified = true;
    expect(await verifier.verifiedEmail(identity)).toBe("recipient@example.test");
    expect(calls).toHaveLength(3);
    expect(JSON.parse(calls[0]![1]!.body as string).scope).toBe("read:users");
    expect(calls[1]![0]).toContain("users/auth0%7Crecipient?fields=user_id%2Cemail%2Cemail_verified&include_fields=true");
    expect(calls.every(([, init]) => init?.redirect === "error")).toBe(true);
  });
  it("rejects an unrelated issuer without issuing a provider request", async () => {
    const transport = vi.fn();
    await expect(new Auth0EmailIdentityVerifier(config, transport).verifiedEmail({ ...identity, issuer: "https://attacker.test" })).rejects.toThrow("identity_scope_mismatch");
    expect(transport).not.toHaveBeenCalled();
  });
  it.each([
    { user_id: "auth0|someone-else", email: "recipient@example.test", email_verified: true },
    { user_id: identity.subject, email: "not an email", email_verified: true },
  ])("fails closed on mismatched or malformed provider proof", async profile => {
    const transport = vi.fn(async (url: string | URL | Request) => String(url).endsWith("/oauth/token") ? token() : Response.json(profile));
    await expect(new Auth0EmailIdentityVerifier(config, transport as typeof fetch).verifiedEmail(identity)).rejects.toThrow();
  });
  it("never treats string true as provider verification", async () => {
    const transport = vi.fn(async (url: string | URL | Request) => String(url).endsWith("/oauth/token") ? token() : Response.json({ user_id: identity.subject, email: "recipient@example.test", email_verified: "true" }));
    expect(await new Auth0EmailIdentityVerifier(config, transport as typeof fetch).verifiedEmail(identity)).toBeNull();
  });
  it("rejects partial runtime configuration", () => {
    expect(() => loadConfig({ DATABASE_URL: "postgresql:///unused_test", AUTH0_EMAIL_VERIFICATION_CLIENT_ID: "partial" })).toThrow("Email verification requires");
  });
  it('reads current security state for one identity, including deletion and password changes', async () => {
    let deleted = false;
    const reset = new Date(Date.now() - 3600000).toISOString();
    const transport = vi.fn(async (url: string | URL | Request) => String(url).endsWith('/oauth/token') ? token()
      : deleted ? new Response(null, { status: 404 }) : Response.json({ user_id: identity.subject, blocked: true, last_password_reset: reset }));
    const verifier = new Auth0EmailIdentityVerifier(config, transport as typeof fetch);
    expect(await verifier.securityStatus(identity)).toEqual({ exists: true, blocked: true, passwordChangedAt: new Date(reset) });
    expect(String(transport.mock.calls[1]![0])).toContain('fields=user_id%2Cblocked%2Clast_password_reset');
    deleted = true;
    expect(await verifier.securityStatus(identity)).toEqual({ exists: false, blocked: true, passwordChangedAt: null });
  });
  it.each([{ blocked: 'false' }, { last_password_reset: 'yesterday' }, { last_password_reset: new Date(Date.now() + 86400000).toISOString() }, { padding: 'x'.repeat(33000) }])
    ('rejects malformed or oversized security responses', async profile => {
      const transport = vi.fn(async (url: string | URL | Request) => String(url).endsWith('/oauth/token') ? token()
        : Response.json({ user_id: identity.subject, ...profile }));
      await expect(new Auth0EmailIdentityVerifier(config, transport as typeof fetch).securityStatus(identity)).rejects.toThrow();
    });
  it('coalesces service-token issuance and never interprets a provider failure as a safe account', async () => {
    let status = 200;
    const transport = vi.fn(async (url: string | URL | Request) => {
      if (String(url).endsWith('/oauth/token')) { await new Promise(resolve => setTimeout(resolve, 5)); return token(); }
      return status === 200 ? Response.json({ user_id: identity.subject }) : new Response(null, { status });
    });
    const verifier = new Auth0EmailIdentityVerifier(config, transport as typeof fetch);
    await Promise.all(Array.from({ length: 4 }, () => verifier.securityStatus(identity)));
    expect(transport.mock.calls.filter(([url]) => String(url).endsWith('/oauth/token'))).toHaveLength(1);
    status = 503;
    await expect(verifier.securityStatus(identity)).rejects.toThrow();
    status = 401;
    await expect(verifier.securityStatus(identity)).rejects.toThrow();
    status = 200;
    await verifier.securityStatus(identity);
    expect(transport.mock.calls.filter(([url]) => String(url).endsWith('/oauth/token'))).toHaveLength(2);
  });
  it('requires an authenticated edge verifier and bounded trusted-session settings', () => {
    const base = { NODE_ENV: 'test', DATABASE_URL: 'postgresql:///unused_test', TRUSTED_USER_SESSIONS_ENABLED: 'true' };
    expect(() => loadConfig(base)).toThrow();
    expect(loadConfig({ ...base, TRUSTED_USER_SESSIONS_ENABLED: 'false', SESSION_EDGE_PROOF_SHA256: '' }).trustedUserSessions).toBeNull();
    expect(() => loadConfig({ ...base, SESSION_EDGE_PROOF_SHA256: 'a'.repeat(64), TRUSTED_SESSION_TTL_DAYS: '31' })).toThrow();
    expect(() => loadConfig({ ...base, SESSION_EDGE_PROOF_SHA256: 'a'.repeat(64), TRUSTED_SESSION_IDLE_DAYS: '8' })).toThrow();
    expect(() => loadConfig({ ...base, SESSION_EDGE_PROOF_SHA256: 'a'.repeat(64), TRUSTED_SESSION_TTL_DAYS: '1', TRUSTED_SESSION_IDLE_DAYS: '2' })).toThrow();
  });
});
