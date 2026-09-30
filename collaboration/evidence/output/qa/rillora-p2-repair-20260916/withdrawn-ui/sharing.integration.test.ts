import { createHash } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool, withPlannerDatabase, type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { seedDevelopmentFixture, developmentPlannerPublicId as A } from "../src/seed-dev.js";
import { currentLegalContract } from "../src/legal-contract.js";
import { verifiedEmailDigest } from "../src/sharing-identity.js";

const databaseUrl = "postgresql:///continuity_sharing_test";
const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: databaseUrl, ALLOW_DEV_AUTH: "true", CORS_ORIGINS: "http://localhost:4191" });
const sha = (text: string) => createHash("sha256").update(text).digest();
const csrf = "c".repeat(43);
let pool: DatabasePool;
let app: ReturnType<typeof createApp>;
let B: { id: string; publicId: string; token: string };
let C: typeof B;
let U: typeof B;
let family: string; let friend: string; let secret: string; let never: string;
let ownerId: string;

async function actor(name: string, email?: string) {
  const result = await pool.query<{ planner_id: string; planner_public_id: string; identity_account_id: string }>(
    "select * from app.provision_oidc_planner($1, $2, $3, 'en', 'UTC')", ["https://identity.example", `sharing|${name}`, name]);
  const row = result.rows[0]!; const token = name[0]!.repeat(43);
  await pool.query(`with acceptance as (
    insert into app.legal_acceptances(planner_id, identity_account_id, terms_version, privacy_version,
      consent_text_version, legal_bundle_sha256, accepted_terms, acknowledged_privacy,
      accepted_electronic_records, client_surface, identity_reference_sha256)
    values($1, $2, $3, $4, $5, $6, true, true, true, 'web', $7) returning id
  ) insert into app.auth_sessions(planner_id, identity_account_id, legal_acceptance_id,
    token_hash, csrf_token_hash, expires_at, verified_email_hash)
    select $1, $2, id, $8, $9, now() + interval '1 hour', $10 from acceptance`,
  [row.planner_id, row.identity_account_id, currentLegalContract.termsVersion, currentLegalContract.privacyVersion,
    currentLegalContract.consentTextVersion, Buffer.from(currentLegalContract.bundleSha256, "hex"),
    sha(`https://identity.example\u001fsharing|${name}`), sha(token), sha(csrf), email ? verifiedEmailDigest(email) : null]);
  return { id: String(row.planner_id), publicId: row.planner_public_id, token };
}
const as = (who: typeof B) => ({ cookie: `continuity_session=[REDACTED_COOKIE] "x-csrf-token": csrf });
const owner = { "x-dev-planner-id": A };
async function contact() {
  const response = await request(app).post("/v1/trusted-contacts").set(owner).send({ displayName: "Parent", relationshipLabel: "Family" }).expect(201);
  return response.body.trustedContact.publicId as string;
}
async function invitation(email = "b@example.test", grants = [{ matterPublicId: family, detailLevel: "name" }]) {
  const response = await request(app).post("/v1/sharing/connections").set(owner)
    .send({ personPublicId: await contact(), email, grants }).expect(201);
  const token = new URLSearchParams(new URL(response.body.invitationUrl).hash.slice(1)).get("invitation")!;
  return { ...response.body.connection, token };
}
async function accept(invite: { token: string }, who = B) {
  return request(app).post("/v1/sharing/invitations/accept").set(as(who)).send({ invitationToken: invite.token, accepted: true });
}
async function shared(who = B) {
  return (await request(app).get("/v1/sharing/shared-with-me").set(as(who)).expect(200)).body;
}

describe.sequential("Account-bound directed sharing", () => {
  beforeAll(async () => {
    if (!databaseUrl.endsWith("/continuity_sharing_test")) throw new Error("Dedicated sharing test database required");
    await runMigrations(databaseUrl); pool = createPool(config);
    await pool.query("truncate app.planners restart identity cascade");
    await seedDevelopmentFixture(pool); app = createApp(pool, config);
    B = await actor("B", "b@example.test"); C = await actor("C", "c@example.test"); U = await actor("Unverified");
    ownerId = String((await pool.query("select id from app.planners where public_id = $1", [A])).rows[0].id);
    async function matter(title: string, outcome = "notify") {
      const response = await request(app).post("/v1/matters").set(owner).send({
        category: "document", title, institutionName: "Archive", locationHint: "Blue folder",
        accountHint: "ending 42", valueBand: "unknown", currencyCode: "USD", importance: "important", desiredOutcome: outcome, status: "draft",
      }).expect(201); return response.body.matter.publicId as string;
    }
    family = await matter("Family document"); friend = await matter("Friend-only directions");
    secret = await matter("Unshared private item"); never = await matter("Never-disclose item", "never_disclose");
  });
  afterAll(async () => { await pool?.end(); });

  it("previews each exact recipient projection without granting access or exposing other matters", async () => {
    await request(app).post("/v1/sharing/preview").send({ grants: [] }).expect(401);
    await request(app).post("/v1/sharing/preview").set("cookie", `continuity_session=[REDACTED_COOKIE] grants: [] }).expect(403);
    for (const detailLevel of ["name", "directions", "details"] as const) {
      const grants = [{ matterPublicId: friend, detailLevel }];
      const before = await shared(B);
      const result = await request(app).post("/v1/sharing/preview").set(owner).send({ grants }).expect(200);
      expect(result.body.preview).toBe(true);
      expect(result.body.items).toHaveLength(1);
      expect(await shared(B)).toEqual(before);
      const invite = await invitation("b@example.test", grants);
      await accept(invite).then(response => expect(response.status).toBe(200));
      const item = (await shared(B)).items.find((entry: { connectionPublicId: string }) => entry.connectionPublicId === invite.publicId);
      expect(result.body.items[0]).toEqual({ matterPublicId: friend, detailLevel, fields: item.fields });
      await request(app).delete(`/v1/sharing/connections/${invite.publicId}`).set(owner).set("if-match", "2").expect(200);
    }
    expect((await request(app).post("/v1/sharing/preview").set(owner).send({ grants: [] }).expect(200)).body.items).toEqual([]);
    for (const id of [never, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]) {
      await request(app).post("/v1/sharing/preview").set(owner).send({ grants: [{ matterPublicId: id, detailLevel: "details" }] }).expect(400);
    }
    await request(app).post("/v1/sharing/preview").set(as(C)).send({ grants: [{ matterPublicId: friend, detailLevel: "details" }] }).expect(400);
  });

  it("generates a fragment link and exposes no matter data before authentication/acceptance", async () => {
    const invite = await invitation();
    const response = await request(app).post("/sharing/invitations/resolve").send({ invitationToken: invite.token }).expect(200);
    expect(Object.keys(response.body.invitation).sort()).toEqual(["emailHint", "expiresAt", "ownerName", "publicId", "status"]);
    expect(response.headers["set-cookie"]?.[0]).toContain("HttpOnly");
    expect(response.headers["cache-control"]).toContain("no-store");
    await request(app).get("/v1/sharing/shared-with-me").expect(401);
    await request(app).post("/v1/sharing/invitations/accept").send({ invitationToken: invite.token, accepted: true }).expect(401);
    const row = await pool.query("select invitation_token_hash from app.sharing_connections where public_id = $1", [invite.publicId]);
    expect(row.rows[0].invitation_token_hash).toEqual(sha(invite.token));
  });

  it("requires cookie CSRF, a verified invited email and explicit acceptance", async () => {
    const invite = await invitation();
    await request(app).post("/v1/sharing/invitations/accept").set("cookie", `continuity_session=[REDACTED_COOKIE] invitationToken: invite.token, accepted: true }).expect(403);
    expect((await accept(invite, C)).body.error.code).toBe("invitation_account_mismatch");
    expect((await accept(invite, U)).body.error.code).toBe("verified_email_required");
    await request(app).post("/v1/sharing/invitations/accept").set(as(B)).send({ invitationToken: invite.token, accepted: false }).expect(400);
    expect((await accept(invite)).status).toBe(200);
    expect((await accept(invite)).status).toBe(200);
    expect((await accept(invite, C)).status).toBe(403);
    const items = (await shared()).items.filter((item: { connectionPublicId: string }) => item.connectionPublicId === invite.publicId);
    expect(items).toHaveLength(1);
    expect(items[0].fields).toEqual({ title: "Family document", category: "document" });
  });

  it("keeps B and C scopes separate and applies field-level detail on the server", async () => {
    const invite = await invitation("c@example.test", [{ matterPublicId: friend, detailLevel: "directions" }]);
    expect((await accept(invite, C)).status).toBe(200);
    const bData = await shared(B); const cData = await shared(C);
    expect(bData.items.some((item: { matterPublicId: string }) => item.matterPublicId === friend)).toBe(false);
    expect(cData.items.some((item: { matterPublicId: string }) => item.matterPublicId === family)).toBe(false);
    expect(cData.items[0].fields).toEqual({ title: "Friend-only directions", category: "document", institutionName: "Archive", locationHint: "Blue folder", desiredOutcome: "notify" });
    expect(JSON.stringify(bData)).not.toContain(secret); expect(JSON.stringify(cData)).not.toContain(secret);
    await request(app).patch(`/v1/sharing/connections/${invite.publicId}`).set(as(B)).send({ expectedVersion: 2, grants: [] }).expect(409);
  });

  it("updates/downgrades only the selected connection and rejects stale saves", async () => {
    const invite = await invitation("b@example.test", [{ matterPublicId: friend, detailLevel: "details" }]);
    await accept(invite).then((response) => expect(response.status).toBe(200));
    let items = (await shared()).items.filter((item: { connectionPublicId: string }) => item.connectionPublicId === invite.publicId);
    expect(items[0].fields.accountHint).toBe("ending 42");
    await request(app).patch(`/v1/sharing/connections/${invite.publicId}`).set(owner).send({ expectedVersion: 1, grants: [] }).expect(409);
    await request(app).patch(`/v1/sharing/connections/${invite.publicId}`).set(owner).send({ expectedVersion: 2, grants: [{ matterPublicId: friend, detailLevel: "name" }] }).expect(200);
    items = (await shared()).items.filter((item: { connectionPublicId: string }) => item.connectionPublicId === invite.publicId);
    expect(Object.keys(items[0].fields).sort()).toEqual(["category", "title"]);
    await request(app).delete(`/v1/sharing/connections/${invite.publicId}`).set(owner).set("if-match", "3").expect(200);
    expect((await shared()).items.some((item: { connectionPublicId: string }) => item.connectionPublicId === invite.publicId)).toBe(false);
    expect((await accept(invite)).status).toBe(403);
  });

  it("exposes typed wallet fields and notes only to the chosen Details recipient", async () => {
    const wallet = (await request(app).post("/v1/matters").set(owner).send({
      category: "crypto_asset", title: "Scoped wallet", details: { cryptoCustody: "self_custody", network: "Ethereum", walletAddress: "0x1234" }, notes: "Private wallet note",
    }).expect(201)).body.matter;
    const bInvite = await invitation("b@example.test", [{ matterPublicId: wallet.publicId, detailLevel: "directions" }]);
    const cInvite = await invitation("c@example.test", [{ matterPublicId: wallet.publicId, detailLevel: "details" }]);
    expect((await accept(bInvite, B)).status).toBe(200); expect((await accept(cInvite, C)).status).toBe(200);
    const bItem = (await shared(B)).items.find((item: { matterPublicId: string }) => item.matterPublicId === wallet.publicId);
    const cItem = (await shared(C)).items.find((item: { matterPublicId: string }) => item.matterPublicId === wallet.publicId);
    expect(bItem.fields).not.toHaveProperty("walletAddress"); expect(bItem.fields).not.toHaveProperty("notes");
    expect(cItem.fields.walletAddress).toBe("0x1234"); expect(cItem.fields.notes).toBe("Private wallet note");
    // Simulate a future private column key: the SQL recipient projection must stay allowlisted.
    await pool.query("update app.matter_items set details = details || '{\"internalFutureField\":\"keep private\"}'::jsonb where public_id=$1", [wallet.publicId]);
    const bounded = (await shared(C)).items.find((item: { matterPublicId: string }) => item.matterPublicId === wallet.publicId);
    expect(bounded.fields).not.toHaveProperty("internalFutureField");
    await request(app).patch(`/v1/sharing/connections/${cInvite.publicId}`).set(owner).send({ expectedVersion: 2, grants: [{ matterPublicId: wallet.publicId, detailLevel: "name" }] }).expect(200);
    const reduced = (await shared(C)).items.find((item: { matterPublicId: string }) => item.matterPublicId === wallet.publicId);
    expect(Object.keys(reduced.fields).sort()).toEqual(["category", "title"]);
  });

  it("supports the HttpOnly invitation handoff through a login boundary", async () => {
    const invite = await invitation();
    const resolved = await request(app).post("/sharing/invitations/resolve").send({ invitationToken: invite.token }).expect(200);
    const cookies = resolved.headers["set-cookie"] as unknown as string[];
    const handoff = cookies[0]!.split(";")[0]!;
    await request(app).get(`/sharing/invitations/${invite.publicId}`).set("cookie", handoff).expect(200);
    await request(app).get(`/sharing/invitations/${invite.publicId}`).expect(404);
    await request(app).post("/v1/sharing/invitations/accept").set("cookie", `${handoff}; continuity_session=[REDACTED_COOKIE]
      .set("x-csrf-token", csrf).send({ invitationPublicId: invite.publicId, accepted: true }).expect(200);
  });

  it("invalidates old links, rejects expired links and atomically consumes concurrent acceptance", async () => {
    const invite = await invitation();
    const changed = await request(app).post(`/v1/sharing/connections/${invite.publicId}/link`).set(owner).send({ expectedVersion: 1 }).expect(200);
    expect((await accept(invite)).status).toBe(403);
    const fresh = { token: new URLSearchParams(new URL(changed.body.invitationUrl).hash.slice(1)).get("invitation")! };
    const results = await Promise.all([accept(fresh), accept(fresh), accept(fresh, C)]);
    expect(results.map((result) => result.status)).toEqual([200, 200, 403]);
    const audit = await pool.query("select count(*)::int as count from app.audit_events where action = 'sharing.invitation_accepted' and resource_public_id = $1", [invite.publicId]);
    expect(audit.rows[0].count).toBe(1);
    const expired = await invitation();
    await pool.query("update app.sharing_connections set invitation_expires_at = now() - interval '1 second' where public_id = $1", [expired.publicId]);
    expect((await accept(expired)).body.error.code).toBe("invitation_expired");
  });

  it("rejects never-disclose/foreign scope and stops access when a person is revoked", async () => {
    const person = await contact();
    await request(app).post("/v1/sharing/connections").set(owner).send({ personPublicId: person, email: "b@example.test", grants: [{ matterPublicId: never, detailLevel: "details" }] }).expect(400);
    const invite = await invitation(); await accept(invite);
    await request(app).patch(`/v1/trusted-contacts/${invite.personPublicId}`).set(owner).send({ expectedVersion: 1, status: "revoked" }).expect(200);
    expect((await shared()).connections.some((item: { publicId: string }) => item.publicId === invite.publicId)).toBe(false);
    expect((await accept(invite)).status).toBe(403);
  });

  it("preserves planner RLS and exposes no reader-role membership to ordinary roles", async () => {
    const rows = await withPlannerDatabase(pool, B.id, async (client) => (await client.query("select title from app.matter_items where planner_id = $1", [ownerId])).rows);
    expect(rows).toEqual([]);
    const grants = await pool.query("select pg_has_role('continuity_app', 'continuity_share_service', 'MEMBER') as app, pg_has_role('continuity_auth', 'continuity_share_service', 'MEMBER') as auth");
    expect(grants.rows[0]).toEqual({ app: false, auth: false });
  });

  it("clears grants when an item becomes never-disclose and does not silently reshare it later", async () => {
    const invite = await invitation("b@example.test", [{ matterPublicId: secret, detailLevel: "details" }]);
    await accept(invite).then((response) => expect(response.status).toBe(200));
    await request(app).patch(`/v1/matters/${secret}`).set(owner).send({ expectedVersion: 1, desiredOutcome: "never_disclose" }).expect(200);
    expect((await shared()).items.some((item: { matterPublicId: string }) => item.matterPublicId === secret)).toBe(false);
    await request(app).patch(`/v1/matters/${secret}`).set(owner).send({ expectedVersion: 2, desiredOutcome: "notify" }).expect(200);
    expect((await shared()).items.some((item: { matterPublicId: string }) => item.matterPublicId === secret)).toBe(false);
    await request(app).patch(`/v1/sharing/connections/${invite.publicId}`).set(owner).send({ expectedVersion: 2, grants: [] }).expect(409);
  });

  it("keeps two invitation handoffs independent in the same browser", async () => {
    const first = await invitation(); const second = await invitation();
    const browser = request.agent(app);
    await browser.post("/sharing/invitations/resolve").send({ invitationToken: first.token }).expect(200);
    await browser.post("/sharing/invitations/resolve").send({ invitationToken: second.token }).expect(200);
    await browser.get(`/sharing/invitations/${first.publicId}`).expect(200);
    await browser.get(`/sharing/invitations/${second.publicId}`).expect(200);
  });
});
