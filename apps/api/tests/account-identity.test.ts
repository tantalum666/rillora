import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request } from "express";
import type { DatabasePool } from "../src/db.js";
import { loadAccountIdentity } from "../src/account-identity.js";

const mocks = vi.hoisted(() => ({ planner: vi.fn(), identity: vi.fn() }));
vi.mock("../src/db.js", () => ({
  withPlannerDatabase: async (_pool: unknown, _id: string, operation: (client: unknown) => unknown) => operation({ query: mocks.planner }),
  withAuthDatabase: async (_pool: unknown, operation: (client: unknown) => unknown) => operation({ query: mocks.identity }),
}));
const pool = {} as DatabasePool;
const auth: Request["auth"] = { plannerId: "17", plannerPublicId: "11111111-1111-4111-8111-111111111111", sessionPublicId: "session-a", mode: "session" };
const identity = { issuer: "https://identity.example.test", subject: "auth0|a" };
beforeEach(() => {
  mocks.planner.mockReset().mockResolvedValue({ rows: [{ public_id: auth.plannerPublicId, display_name: "Synthetic account" }] });
  mocks.identity.mockReset().mockResolvedValue({ rows: [identity] });
});
describe("Current account display identity", () => {
  it.each(["session", "bearer"] as const)("uses only the authenticated %s account and exact provider identity", async mode => {
    const verifiedEmail = vi.fn().mockResolvedValue("owner@example.test");
    expect(await loadAccountIdentity(pool, { ...auth, mode }, { verifiedEmail })).toEqual({
      account: { publicId: auth.plannerPublicId, displayName: "Synthetic account", verifiedEmail: "owner@example.test" }, emailStatus: "available",
    });
    expect(verifiedEmail).toHaveBeenCalledExactlyOnceWith(identity);
    expect(mocks.identity).toHaveBeenCalledTimes(2);
    expect(mocks.identity.mock.calls[0]![1]).toEqual([auth.sessionPublicId, auth.plannerId]);
    expect(mocks.identity.mock.calls.every(([sql]) => !/insert|update|delete/i.test(sql))).toBe(true);
  });
  it("does not fabricate an email when the provider supplies none", async () => {
    const value = await loadAccountIdentity(pool, auth, { verifiedEmail: async () => null });
    expect(value.emailStatus).toBe("not_provided"); expect(value.account.verifiedEmail).toBeNull();
  });
  it("keeps name and account ID usable on provider failure or missing configuration", async () => {
    for (const verifier of [null, { verifiedEmail: async () => { throw new Error("provider offline"); } }]) {
      const value = await loadAccountIdentity(pool, auth, verifier);
      expect(value.emailStatus).toBe("unavailable"); expect(value.account.verifiedEmail).toBeNull();
      expect(value.account.publicId).toBe(auth.plannerPublicId);
    }
  });
  it("never uses provider or synthetic email for a development fixture", async () => {
    const verifiedEmail = vi.fn();
    const value = await loadAccountIdentity(pool, { ...auth, mode: "development" }, { verifiedEmail });
    expect(value.account.verifiedEmail).toBeNull(); expect(verifiedEmail).not.toHaveBeenCalled(); expect(mocks.identity).not.toHaveBeenCalled();
  });
  it.each([{ rows: [] }, { rows: [{ issuer: identity.issuer, subject: "auth0|b" }] }])("discards late email if session is revoked or remapped", async ({ rows }) => {
    mocks.identity.mockResolvedValueOnce({ rows: [identity] }).mockResolvedValueOnce({ rows });
    await expect(loadAccountIdentity(pool, auth, { verifiedEmail: async () => "old@example.test" })).rejects.toMatchObject({ status: 401 });
  });
  it("refuses a profile selected for a different planner", async () => {
    mocks.planner.mockResolvedValue({ rows: [{ public_id: "other", display_name: "Other" }] });
    const verifiedEmail = vi.fn();
    await expect(loadAccountIdentity(pool, auth, { verifiedEmail })).rejects.toMatchObject({ status: 401 });
    expect(verifiedEmail).not.toHaveBeenCalled();
  });
  it("does not reuse the previous account email between reads", async () => {
    const verifiedEmail = vi.fn().mockResolvedValueOnce("first@example.test").mockResolvedValueOnce(null);
    expect((await loadAccountIdentity(pool, auth, { verifiedEmail })).account.verifiedEmail).toBe("first@example.test");
    expect((await loadAccountIdentity(pool, auth, { verifiedEmail })).account.verifiedEmail).toBeNull();
  });
});
