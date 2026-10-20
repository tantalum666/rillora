import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "./http-fixture.js";
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from "./dedicated-test-database.js";
import { EmailIdentityFixture } from "./email-identity-fixture.js";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool, withPlannerDatabase, type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { developmentPlannerPublicId as A, seedDevelopmentFixture } from "../src/seed-dev.js";
import { currentLegalContract } from "../src/legal-contract.js";
import { futureNoticesEnabled } from "../src/future-notice-routes.js";
import { configureRecoveryPool, parseRecoveryControl, type RecoveryControl } from "../src/recovery-journal.js";
import { replayRecoveryControls } from "../src/recovery-replay.js";

const name = "continuity_future_notices_test";
const databaseUrl = dedicatedTestDatabaseUrl(`postgresql:///${name}`, name);
const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: databaseUrl, ALLOW_DEV_AUTH: "true", CORS_ORIGINS: "http://localhost:4191" });
const identities = new EmailIdentityFixture(), owner = { "x-dev-planner-id": A };
const hash = (v: string) => createHash("sha256").update(v).digest();
let pool: DatabasePool, app: ReturnType<typeof createApp>, disabled: typeof app;
type Actor = { id: string; publicId: string; token: string; csrf: string };
let B: Actor, C: Actor, U: Actor;
let serial = 0;
async function actor(label: string, email: string | null) {
  identities.register("https://identity.example", `future|${label}`, email);
  const row = (await pool.query<{ planner_id: string; planner_public_id: string; identity_account_id: string }>(
    "select * from app.provision_oidc_planner($1,$2,$3,'en','UTC')",
    ["https://identity.example", `future|${label}`, label])).rows[0]!;
  const token = randomBytes(32).toString("base64url"), csrf = randomBytes(32).toString("base64url");
  await pool.query(`with accepted as (
   insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,
    legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
   values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id
  ) insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at)
   select $1,$2,id,$8,$9,now()+interval '1 hour' from accepted`,
  [row.planner_id, row.identity_account_id, currentLegalContract.termsVersion, currentLegalContract.privacyVersion,
    currentLegalContract.consentTextVersion, Buffer.from(currentLegalContract.bundleSha256, "hex"),
    hash(`https://identity.example\u001ffuture|${label}`), hash(token), hash(csrf)]);
  return { id: String(row.planner_id), publicId: row.planner_public_id, token, csrf };
}
const as = (who: Actor) => ({ cookie: `continuity_session=${who.token}`, "x-csrf-token": who.csrf, "x-rillora-planner": who.publicId });
async function notice(email?: string) {
  const contact = await request(app).post("/v1/trusted-contacts").set(owner)
    .send({ displayName: `Future contact ${++serial}`, relationshipLabel: "Private relationship" }).expect(201);
  const result = await request(app).post("/v1/future-notices").set(owner)
    .send({ personPublicId: contact.body.trustedContact.publicId, email: email ?? `notice-${serial}@example.test`, acknowledgedNoAccess: true }).expect(201);
  return { ...result.body.notice, personVersion: contact.body.trustedContact.version,
    invitationToken: new URLSearchParams(new URL(result.body.invitationUrl).hash.slice(1)).get("invitation")!,
    invitationUrl: result.body.invitationUrl };
}
async function respondTo(n: { invitationToken: string; version: number }, who: Actor, action = "acknowledge") {
  return request(app).post("/v1/future-notices/invitations/respond").set(as(who))
    .send({ invitationToken: n.invitationToken, expectedVersion: n.version, action });
}
async function received(who: Actor) {
  return (await request(app).get("/v1/future-notices/received").set(as(who)).expect(200)).body.notices;
}

describe.sequential("Future notices never grant content access", () => {
  beforeAll(async () => {
    await assertDedicatedTestDatabase(databaseUrl, name);
    await runMigrations(databaseUrl); pool = createPool(config);
    await pool.query("update app.recovery_policy set enforced=false");
    await pool.query("truncate app.planners restart identity cascade");
    await seedDevelopmentFixture(pool);
    app = createApp(pool, config, { emailIdentityVerifier: identities, futureNoticesEnabled: true });
    disabled = createApp(pool, config, { emailIdentityVerifier: identities });
    B = await actor("B", "b@example.test"); C = await actor("C", "c@example.test"); U = await actor("U", null);
    await request(app).post("/v1/matters").set(owner).send({ category: "document", title: "Never exposed private title",
      institutionName: "Private bank", locationHint: "Private drawer", notes: "Private notes", desiredOutcome: "notify", status: "draft" }).expect(201);
  });
  afterAll(async () => { await pool?.end(); });

  it("is disabled by default, rejects malformed flags and rejects caller-supplied grants", async () => {
    expect(futureNoticesEnabled({})).toBe(false); expect(futureNoticesEnabled({ RILLORA_FUTURE_NOTICES_ENABLED: "true" })).toBe(true);
    expect(() => futureNoticesEnabled({ RILLORA_FUTURE_NOTICES_ENABLED: "yes" })).toThrow();
    await request(disabled).get("/v1/future-notices/received").set(as(B)).expect(404);
    await request(app).post("/v1/future-notices").set(owner).send({ personPublicId: A, email: "b@example.test",
      acknowledgedNoAccess: true, grants: [{ detailLevel: "details" }] }).expect(400);
    await request(app).post("/v1/future-notices").send({}).expect(401);
    await request(app).post("/v1/future-notices").set("cookie", `continuity_session=${B.token}`).send({}).expect(403);
  });

  it("keeps public resolution anonymous and only reveals the sender after verified-email matching", async () => {
    const n = await notice("b@example.test");
    const preview = await request(app).post("/future-notices/invitations/resolve").send({ invitationToken: n.invitationToken }).expect(200);
    expect(Object.keys(preview.body.notice).sort()).toEqual(["contentAvailable", "expiresAt", "publicId", "purpose", "status"]);
    const wrong = await request(app).post("/v1/future-notices/invitations/review").set(as(C)).send({ invitationToken: n.invitationToken }).expect(403);
    expect(wrong.body.error.code).toBe("invitation_account_mismatch");
    expect(JSON.stringify(wrong.body)).not.toContain("ownerName");
    await request(app).post("/v1/future-notices/invitations/review").set(as(U)).send({ invitationToken: n.invitationToken }).expect(403);
    const matching = await request(app).post("/v1/future-notices/invitations/review").set(as(B)).send({ invitationToken: n.invitationToken }).expect(200);
    expect(Object.keys(matching.body.notice).sort()).toEqual(["contentAvailable", "ownerName", "publicId", "purpose", "status", "version"]);
    expect(matching.body.notice.contentAvailable).toBe(false);
    const before = (await request(app).get("/v1/sharing/access").set(owner).expect(200)).body;
    const ack = await respondTo(n, B); expect(ack.status).toBe(200);
    expect((await respondTo(n, B)).status).toBe(200); // same-account retry is idempotent
    expect((await received(B)).find((x: { publicId: string }) => x.publicId === n.publicId).contentAvailable).toBe(false);
    expect(await received(C)).toEqual([]);
    const shared = (await request(app).get("/v1/sharing/shared-with-me").set(as(B)).expect(200)).body;
    expect(shared.items).toEqual([]); expect(shared.connections).toEqual([]);
    expect((await request(app).get("/v1/sharing/access").set(owner).expect(200)).body).toEqual(before);
    expect(Number((await pool.query("select count(*) from app.sharing_grants")).rows[0].count)).toBe(0);
    const ownMap = await request(app).post("/v1/account/map/export").set(as(B)).send({ acknowledgesPrivateCopy: true }).expect(200);
    expect(ownMap.body.matters).toEqual([]);
    expect(JSON.stringify(ownMap.body)).not.toContain("Never exposed private title");
    const ownerMatter = (await request(app).get("/v1/matters").set(owner).expect(200)).body.matters[0];
    await request(app).get(`/v1/matters/${ownerMatter.publicId}`).set(as(B)).expect(404);
    const sameEmail = await actor("SameEmailDifferentAccount", "b@example.test");
    expect((await respondTo(n, sameEmail)).status).toBe(403);
    expect(await received(sameEmail)).toEqual([]);
    expect(JSON.stringify(await received(B))).not.toMatch(/Never exposed|Private bank|Private drawer|Private notes|matter|emailHint/i);
    await request(app).delete(`/v1/future-notices/${n.publicId}`).set(owner).set("if-match", String(ack.body.result.version)).expect(200);
    expect(await received(B)).toEqual([]);
    expect((await respondTo(n, B)).status).toBe(403);
  });

  it("preserves a fragment token through a short-lived cookie without exposing it in the return URL", async () => {
    const n = await notice("b@example.test");
    expect(new URL(n.invitationUrl).pathname).toBe("/future-invite");
    expect(new URL(n.invitationUrl).search).toBe("");
    const resolved = await request(app).post("/future-notices/invitations/resolve").send({ invitationToken: n.invitationToken }).expect(200);
    const cookies = resolved.headers["set-cookie"];
    const cookieHeader = Array.isArray(cookies) ? cookies[0] : cookies;
    expect(cookieHeader).toContain("HttpOnly");
    const handoff = String(cookieHeader).split(";")[0]!;
    const headers = { ...as(B), cookie: `${as(B).cookie}; ${handoff}` };
    const reviewed = await request(app).post("/v1/future-notices/invitations/review").set(headers)
      .send({ invitationPublicId: n.publicId }).expect(200);
    await request(app).post("/v1/future-notices/invitations/respond").set(headers)
      .send({ invitationPublicId: n.publicId, expectedVersion: reviewed.body.notice.version, action: "decline" }).expect(200);
    expect(await received(B)).toEqual([]);
    const latest = await request(app).get(`/v1/future-notices/people/${n.personPublicId}`).set(owner).expect(200);
    expect(latest.body.notice.status).toBe("declined");
    expect((await respondTo(n, B)).status).toBe(403);
  });

  it("rotates a pending link, rejects stale versions and treats expiration as unavailable", async () => {
    const n = await notice();
    const next = await request(app).post(`/v1/future-notices/${n.publicId}/link`).set(owner).send({ expectedVersion: n.version }).expect(200);
    await request(app).post("/future-notices/invitations/resolve").send({ invitationToken: n.invitationToken }).expect(404);
    await request(app).post(`/v1/future-notices/${n.publicId}/link`).set(owner).send({ expectedVersion: n.version }).expect(409);
    await pool.query("update app.future_recipient_notices set invitation_expires_at=now()-interval '1 second',created_at=now()-interval '1 day' where public_id=$1", [n.publicId]);
    const nextToken = new URLSearchParams(new URL(next.body.invitationUrl).hash.slice(1)).get("invitation");
    await request(app).post("/future-notices/invitations/resolve").send({ invitationToken: nextToken }).expect(404);
    expect((await request(app).get(`/v1/future-notices/people/${n.personPublicId}`).set(owner).expect(200)).body.notice.status).toBe("expired");
  });

  it("binds leave/revoke to the account and permanently invalidates notices on contact archival", async () => {
    const n = await notice("c@example.test"), ack = await respondTo(n, C); expect(ack.status).toBe(200);
    await request(app).delete(`/v1/future-notices/received/${n.publicId}`).set(as(B)).set("if-match", String(ack.body.result.version)).expect(409);
    await request(app).delete(`/v1/future-notices/received/${n.publicId}`).set(as(C)).set("if-match", String(ack.body.result.version)).expect(200);
    expect(await received(C)).toEqual([]);
    const other = await notice("c@example.test"); expect((await respondTo(other, C)).status).toBe(200);
    await pool.query("update app.people set status='archived' where public_id=$1", [other.personPublicId]);
    expect(await received(C)).toEqual([]);
    await pool.query("update app.people set status='confirmed' where public_id=$1", [other.personPublicId]);
    expect(await received(C)).toEqual([]);
    expect((await respondTo(other, C)).status).toBe(403);
    await request(app).get(`/v1/future-notices/people/${other.personPublicId}`).set(as(B)).expect(404);
  });

  it("uses a metadata-only definer role and cannot be upgraded into a content grant", async () => {
    const row = (await pool.query(`select
     has_table_privilege('continuity_future_notice_service','app.matter_items','SELECT') as matters,
     has_table_privilege('continuity_future_notice_service','app.sharing_grants','INSERT') as grants,
     has_table_privilege('continuity_future_notice_service','app.private_content_values','SELECT') as ciphertext`)).rows[0];
    expect(row).toEqual({ matters: false, grants: false, ciphertext: false });
    const n = await notice(), ownerId = (await pool.query("select id::text from app.planners where public_id=$1", [A])).rows[0].id;
    await expect(withPlannerDatabase(pool, ownerId, client => client.query(
      "update app.future_recipient_notices set status='declined' where public_id=$1", [n.publicId]))).rejects.toThrow("future_notice_transition_denied");
    const otherRows = await withPlannerDatabase(pool, B.id, client => client.query("select public_id from app.future_recipient_notices"));
    expect(otherRows.rowCount).toBe(0);
  });

  it("keeps explicitly shared living content independent of notice acknowledgement and revocation", async () => {
    const n = await notice("c@example.test");
    const privateMatter = (await request(app).get("/v1/matters").set(owner).expect(200)).body.matters[0];
    const direct = await request(app).post("/v1/sharing/connections").set(owner).send({
      personPublicId: n.personPublicId, email: "c@example.test", grants: [{ matterPublicId: privateMatter.publicId, detailLevel: "name" }],
    }).expect(201);
    const directToken = new URLSearchParams(new URL(direct.body.invitationUrl).hash.slice(1)).get("invitation");
    await request(app).post("/v1/sharing/invitations/accept").set(as(C)).send({ invitationToken: directToken, accepted: true }).expect(200);
    const sharedBefore = (await request(app).get("/v1/sharing/shared-with-me").set(as(C)).expect(200)).body;
    expect(sharedBefore.items).toHaveLength(1);
    const ack = await respondTo(n, C); expect(ack.status).toBe(200);
    await request(app).delete(`/v1/future-notices/${n.publicId}`).set(owner).set("if-match", String(ack.body.result.version)).expect(200);
    expect((await request(app).get("/v1/sharing/shared-with-me").set(as(C)).expect(200)).body).toEqual(sharedBefore);
    expect(await received(C)).toEqual([]);
    await request(app).delete(`/v1/sharing/connections/${direct.body.connection.publicId}`).set(owner).set("if-match", "2").expect(200);
  });

  it("does not allow self acknowledgement and removes a deleted recipient relationship", async () => {
    const n = await notice();
    const self = await request(app).post("/v1/future-notices/invitations/respond").set(owner)
      .send({ invitationToken: n.invitationToken, action: "acknowledge", expectedVersion: 1 }).expect(403);
    expect(self.body.error.code).toBe("self_invitation");
    const D = await actor("DisposableRecipient", "disposable@example.test");
    const other = await notice("disposable@example.test"); expect((await respondTo(other, D)).status).toBe(200);
    await pool.query("delete from app.planners where public_id=$1", [D.publicId]);
    expect((await request(app).get(`/v1/future-notices/people/${other.personPublicId}`).set(owner).expect(200)).body.notice).toBeNull();
    await request(app).post("/future-notices/invitations/resolve").send({ invitationToken: other.invitationToken }).expect(404);
  });

  it("keeps recovery events metadata-only and requires new notices after an isolated restore", async () => {
    const n = await notice("b@example.test"); expect((await respondTo(n, B)).status).toBe(200);
    const event = { key: `future_notice:${n.publicId}`, kind: "future_notice", id: n.publicId,
      revision: "2", recordedAt: new Date().toISOString(), facts: { revokeOnRestore: true } };
    expect(parseRecoveryControl(event)).toEqual(event);
    expect(() => parseRecoveryControl({ ...event, facts: { revokeOnRestore: false } })).toThrow();
    expect(() => parseRecoveryControl({ ...event, facts: { revokeOnRestore: true, title: "must not enter journal" } })).toThrow();
    await replayRecoveryControls(pool, []);
    expect((await pool.query("select status from app.future_recipient_notices where public_id=$1", [n.publicId])).rows[0].status).toBe("revoked");
    expect(Number((await pool.query("select count(*) from app.future_notice_handoffs")).rows[0].count)).toBe(0);
  });

  it("publishes only revocation facts under enforced journaling and rolls back without a receipt", async () => {
    const events: RecoveryControl[] = [];
    let unavailable = false;
    configureRecoveryPool(pool, {
      async publish(event) { if (unavailable) throw new Error("Synthetic journal unavailable"); events.push(event); },
      async checkCoverage() { if (unavailable) throw new Error("Synthetic journal unavailable"); },
    });
    await pool.query("update app.recovery_policy set enforced=true,coverage_started_at=now()");
    try {
      const n = await notice("journal-only@example.test");
      expect(events.filter(event => event.kind === "future_notice").map(event => event.facts)).toEqual([{ revokeOnRestore: true }]);
      expect(JSON.stringify(events)).not.toMatch(/journal-only|Future contact|ownerName|invitationToken|emailHint/);
      unavailable = true;
      await request(app).delete(`/v1/future-notices/${n.publicId}`).set(owner).set("if-match", "1").expect(503);
      const unchanged = (await pool.query("select status,version from app.future_recipient_notices where public_id=$1", [n.publicId])).rows[0];
      expect(unchanged).toEqual({ status: "pending", version: 1 });
    } finally {
      unavailable = false;
      await pool.query("update app.recovery_policy set enforced=false");
    }
  });
});
