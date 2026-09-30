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
});
