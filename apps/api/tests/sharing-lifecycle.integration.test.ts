import type { Response } from "supertest";
import { createHash, randomBytes } from "node:crypto";
import request from "./http-fixture.js";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool, withCommercePlannerDatabase, withPlannerDatabase, type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { seedDevelopmentFixture, developmentPlannerPublicId } from "../src/seed-dev.js";
import { currentLegalContract } from "../src/legal-contract.js";
import { verifiedEmailDigest } from "../src/sharing-identity.js";

const databaseUrl = "postgresql:///continuity_commercial_sharing_test";
const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: databaseUrl, ALLOW_DEV_AUTH: "true", CORS_ORIGINS: "http://localhost:4191", ALLOW_FAMILY_MAINTENANCE_PREVIEW: "true" });
const owner = { "x-dev-planner-id": developmentPlannerPublicId };
const digest = (s: string) => createHash("sha256").update(s).digest();
let pool: DatabasePool, app: ReturnType<typeof createApp>, ownerId: string, matterId: string;
let serial = 0;
const doc = { category: "document", title: "Paid-term directions", locationHint: "Original folder", notes: "Private paid-term note", desiredOutcome: "notify" };
async function person() {
  return (await request(app).post("/v1/trusted-contacts").set(owner).send({ displayName: `Person ${++serial}` }).expect(201)).body.trustedContact.publicId;
}
async function invite(email: string, p?: string) {
  return request(app).post("/v1/sharing/connections").set(owner).send({ personPublicId: p ?? await person(), email, grants: [{ matterPublicId: matterId, detailLevel: "details" }] });
}
async function recipient(email: string) {
  const actor = (await pool.query("select * from app.provision_oidc_planner($1,$2,$3,'en','UTC')", ["https://qa.example.test", `lifecycle|${++serial}`, "Recipient"])).rows[0];
  const token = randomBytes(32).toString("base64url"), csrf = randomBytes(32).toString("base64url");
  await pool.query(`with legal as (insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,
    consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
    values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id)
    insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at,verified_email_hash)
    select $1,$2,id,$8,$9,now()+interval '1 hour',$10 from legal`,
  [actor.planner_id, actor.identity_account_id, currentLegalContract.termsVersion, currentLegalContract.privacyVersion,
    currentLegalContract.consentTextVersion, Buffer.from(currentLegalContract.bundleSha256, "hex"), digest(`qa-${serial}`), digest(token), digest(csrf), verifiedEmailDigest(email)]);
  return { cookie: `continuity_session=${token}`, "x-csrf-token": csrf, "x-rillora-planner": actor.planner_public_id };
}
async function accept(result: Response, actor: Record<string, string>) {
  const token = new URLSearchParams(new URL(result.body.invitationUrl).hash.slice(1)).get("invitation");
  return request(app).post("/v1/sharing/invitations/accept").set(actor).send({ invitationToken: token, accepted: true });
}
async function shared(actor: Record<string, string>) {
  return (await request(app).get("/v1/sharing/shared-with-me").set(actor).expect(200)).body;
}
async function access() { return (await request(app).get("/v1/sharing/access").set(owner).expect(200)).body.access; }
async function family() {
  const account = (await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code)
    select $1,id,'global','GLOBAL_US' from app.plans where planner_id=$1
    on conflict(plan_id,operating_plane_code) do update set status='active' returning id`, [ownerId])).rows[0].id;
  return (await pool.query(`insert into app.commerce_entitlement_grants(planner_id,commerce_account_id,capability_code,source_type,source_reference,allowance,effective_at,expires_at)
    values($1,$2,'trusted_people_multiple','manual_override','isolated-lifecycle-validation',5,now()-interval '1 day',now()+interval '1 day') returning id`, [ownerId, account])).rows[0].id;
}
async function expire(id: string) { await pool.query("update app.commerce_entitlement_grants set expires_at=clock_timestamp() where id=$1", [id]); }
async function connection(publicId: string) {
  return (await request(app).get("/v1/sharing/connections").set(owner).expect(200)).body.connections.find((c: { publicId: string }) => c.publicId === publicId);
}
async function choose(publicId: string, useFreeSlot: boolean) {
  const c = await connection(publicId), a = await access();
  return request(app).post(`/v1/sharing/connections/${publicId}/live`).set(owner)
    .send({ expectedVersion: c.version, expectedAccessVersion: a.version, useFreeSlot });
}
async function scope(publicId: string, level: string | null) {
  const c = await connection(publicId);
  return request(app).patch(`/v1/sharing/connections/${publicId}`).set(owner)
    .send({ expectedVersion: c.version, grants: level ? [{ matterPublicId: matterId, detailLevel: level }] : [] }).expect(200);
}

describe.sequential("Commercial sharing: quotas, paid cutoff and restrictive permissions", () => {
  beforeAll(async () => { await runMigrations(databaseUrl); pool = createPool(config); app = createApp(pool, config); });
  beforeEach(async () => {
    await pool.query("truncate app.planners restart identity cascade");
    await pool.query("update app.commerce_runtime_policy set sharing_limits_enabled=true");
    await seedDevelopmentFixture(pool);
    ownerId = String((await pool.query("select id from app.planners where public_id=$1", [developmentPlannerPublicId])).rows[0].id);
    matterId = (await request(app).post("/v1/matters").set(owner).send(doc).expect(201)).body.matter.publicId;
  });
  afterAll(async () => { await pool?.end(); });

  it("serializes concurrent Free reservations and keeps contact creation/incoming access free", async () => {
    const [p1, p2] = await Promise.all([person(), person()]);
    const results = await Promise.all([invite("one@example.test", p1), invite("two@example.test", p2)]);
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    expect(results.find(r => r.status === 409)?.body.error.code).toBe("sharing_limit_reached");
    expect(await access()).toMatchObject({ enforcementEnabled: true, limit: 1, used: 1 });
    await person();
    const one = results.find(r => r.status === 201)!;
    const actor = await recipient(one === results[0] ? "one@example.test" : "two@example.test");
    expect((await accept(one, actor)).status).toBe(200);
    expect((await shared(actor)).items).toHaveLength(1);
    expect((await request(app).get("/v1/sharing/access").set(actor)).body.access.used).toBe(0);
  });

  it("reissuing one reservation is not a new seat, expired/revoked reservations free their seat", async () => {
    const first = await invite("one@example.test"); expect(first.status).toBe(201);
    await request(app).post(`/v1/sharing/connections/${first.body.connection.publicId}/link`).set(owner).send({ expectedVersion: 1 }).expect(200);
    expect((await access()).used).toBe(1);
    await pool.query("update app.sharing_connections set invitation_expires_at=now()-interval '1 second'");
    const next = await invite("two@example.test"); expect(next.status).toBe(201);
    await request(app).post(`/v1/sharing/connections/${first.body.connection.publicId}/link`).set(owner).send({ expectedVersion: 2 }).expect(409);
    await request(app).delete(`/v1/sharing/connections/${next.body.connection.publicId}`).set(owner).set("if-match", "1").expect(200);
    await request(app).post(`/v1/sharing/connections/${first.body.connection.publicId}/link`).set(owner).send({ expectedVersion: 2 }).expect(200);
    expect((await access()).used).toBe(1);
  });

  it("caps Family at five including pending invitations and rejects duplicate targets", async () => {
    await family();
    const first = await invite("one@example.test"); expect(first.status).toBe(201);
    expect((await invite("one@example.test")).body.error.code).toBe("sharing_duplicate_recipient");
    for (let i = 2; i <= 5; i++) expect((await invite(`${i}@example.test`)).status).toBe(201);
    expect((await invite("six@example.test")).body.error.code).toBe("sharing_limit_reached");
    expect(await access()).toMatchObject({ limit: 5, used: 5 });
  });

  it("keeps the paid-term version when a later edit occurs before any expiry job/read", async () => {
    const entitlement = await family(), actor = await recipient("one@example.test"), invitation = await invite("one@example.test");
    expect((await accept(invitation, actor)).status).toBe(200);
    await expire(entitlement);
    const m = (await request(app).get("/v1/matters").set(owner)).body.matters.find((m: { publicId: string }) => m.publicId === matterId);
    await request(app).patch(`/v1/matters/${matterId}`).set(owner).send({ ...doc, expectedVersion: m.version, title: "AFTER EXPIRY", locationHint: "New folder", notes: "NEW SECRET" }).expect(200);
    const item = (await shared(actor)).items[0];
    expect(item).toMatchObject({ accessMode: "saved", fields: { title: doc.title, locationHint: doc.locationHint, notes: doc.notes } });
    expect(JSON.stringify(item)).not.toContain("NEW SECRET");
    expect(item.savedAt).toBeTruthy(); expect(item.cutoffAt).toBeTruthy();
    const actualPreview = (await request(app).post("/v1/sharing/preview").set(owner)
      .send({ connectionPublicId: invitation.body.connection.publicId, grants: [{ matterPublicId: matterId, detailLevel: "details" }] }).expect(200)).body;
    expect(actualPreview.accessMode).toBe("saved");
    expect(actualPreview.items[0].fields).toEqual(item.fields);
    expect((await access()).used).toBe(0);
  });

  it("redacts narrowed/removed grants permanently and never backfills new saved content", async () => {
    const entitlement = await family(), actor = await recipient("one@example.test"), invitation = await invite("one@example.test");
    await accept(invitation, actor); await expire(entitlement);
    const id = invitation.body.connection.publicId;
    await scope(id, "name"); await scope(id, "details");
    expect((await shared(actor)).items[0].fields).toEqual({ title: doc.title, category: "document" });
    await scope(id, null); await scope(id, "details");
    expect((await shared(actor)).items).toEqual([]);
  });

  it("requires an explicit included-person choice and does not resume everyone after repurchase", async () => {
    const entitlement = await family(), b = await recipient("b@example.test"), c = await recipient("c@example.test");
    const bi = await invite("b@example.test"), ci = await invite("c@example.test"); await accept(bi, b); await accept(ci, c);
    await expire(entitlement);
    expect((await choose(bi.body.connection.publicId, true)).status).toBe(200);
    expect((await shared(b)).items[0].accessMode).toBe("live");
    expect((await shared(c)).items[0].accessMode).toBe("saved");
    await family();
    expect((await shared(c)).items[0].accessMode).toBe("saved");
    expect((await choose(ci.body.connection.publicId, false)).status).toBe(200);
    expect((await shared(c)).items[0].accessMode).toBe("live");
  });

  it("does not let a pending over-limit invite activate after expiry; choosing it preserves explicit acceptance", async () => {
    const entitlement = await family(), actor = await recipient("one@example.test"), invitation = await invite("one@example.test");
    await expire(entitlement);
    expect((await accept(invitation, actor)).body.error.code).toBe("sharing_updates_paused");
    expect((await choose(invitation.body.connection.publicId, true)).status).toBe(200);
    expect((await shared(actor)).items).toHaveLength(0);
    expect((await accept(invitation, actor)).status).toBe(200);
  });

  it("never upgrades a snapshot to live because of a raw provider subscription", async () => {
    const entitlement = await family();
    await pool.query("update app.commerce_entitlement_grants set revoked_at=now() where id=$1", [entitlement]);
    expect((await access()).limit).toBe(1);
    await request(app).post("/v1/sharing/connections/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/live").set(owner)
      .send({ expectedVersion: 1, expectedAccessVersion: 0, useFreeSlot: true }).expect(409);
    await request(app).get("/v1/sharing/access").expect(401);
  });

  it("applies verified provider periods only to an explicitly allowed validation account", async () => {
    const manual = await family();
    await pool.query("delete from app.commerce_entitlement_grants where id=$1", [manual]);
    const account = (await pool.query("select id from app.commerce_accounts where planner_id=$1", [ownerId])).rows[0].id;
    const subscription = (await pool.query(`insert into app.commerce_subscriptions(planner_id,commerce_account_id,plan_version_id,plan_code,
      acquisition_type,renewal_provider,provider_environment,provider_subscription_reference,state,current_period_starts_at,current_period_ends_at,provider_observed_at)
      select $1,$2,id,'family','purchased','stripe','test','sub_lifecycle_check','active',now()-interval '1 day',now()+interval '1 day',now()
      from app.commerce_plan_versions where plan_code='family' and version=2 returning id`, [ownerId, account])).rows[0].id;
    const apply = () => withCommercePlannerDatabase(pool, ownerId, async c =>
      (await c.query("select app.apply_verified_subscription_entitlements($1) as applied", [subscription])).rows[0].applied);
    expect(await apply()).toBe(false);
    expect((await access()).limit).toBe(1);
    await pool.query("insert into app.commerce_validation_accounts values($1,now()+interval '2 hours','isolated test subscription lifecycle')", [ownerId]);
    expect(await apply()).toBe(true);
    expect((await access()).limit).toBe(5);
    await pool.query("update app.commerce_accounts set status='locked' where id=$1", [account]);
    expect((await access()).limit).toBe(1);
    await pool.query("update app.commerce_accounts set status='active' where id=$1", [account]);
    const before = (await pool.query("select id from app.commerce_entitlement_grants where subscription_id=$1 order by id", [subscription])).rows;
    await pool.query("update app.commerce_subscriptions set state='cancel_at_period_end',cancel_at_period_end=true where id=$1", [subscription]);
    expect(await apply()).toBe(true);
    expect((await access()).limit).toBe(5);
    expect((await pool.query("select id from app.commerce_entitlement_grants where subscription_id=$1 order by id", [subscription])).rows).toEqual(before);
    await pool.query("update app.commerce_subscriptions set current_period_ends_at=now()-interval '1 second' where id=$1", [subscription]);
    expect((await access()).limit).toBe(1); // No webhook/job needed to stop access.
    expect(await apply()).toBe(true);
    expect((await pool.query("select count(*)::int n from app.commerce_entitlement_grants where subscription_id=$1 and revoked_at is null", [subscription])).rows[0].n).toBe(0);
    await expect(withPlannerDatabase(pool, ownerId, c => c.query("select app.apply_verified_subscription_entitlements($1)", [subscription]))).rejects.toThrow(/permission denied/);
  });

  it("clears saved retrieval immediately on matter privacy, archive and connection revocation", async () => {
    const entitlement = await family(), actor = await recipient("one@example.test"), invitation = await invite("one@example.test");
    await accept(invitation, actor); await expire(entitlement);
    expect((await shared(actor)).items).toHaveLength(1);
    await pool.query("update app.matter_items set desired_outcome='never_disclose' where public_id=$1", [matterId]);
    await pool.query("update app.matter_items set desired_outcome='notify' where public_id=$1", [matterId]);
    expect((await shared(actor)).items).toHaveLength(0);
    expect((await pool.query("select count(*)::int n from app.sharing_saved_items")).rows[0].n).toBe(0);
    await request(app).delete(`/v1/sharing/connections/${invitation.body.connection.publicId}`).set(owner)
      .set("if-match", String((await connection(invitation.body.connection.publicId)).version)).expect(200);
    expect((await shared(actor)).connections).toHaveLength(0);
  });

  it("replaces the Free recipient atomically and rolls back a failed replacement", async () => {
    const actor = await recipient("one@example.test"), first = await invite("one@example.test"); await accept(first, actor);
    const current = await connection(first.body.connection.publicId), a = await access(), p = await person();
    const replacement = { publicId: current.publicId, expectedVersion: current.version, expectedAccessVersion: a.version };
    const input = { personPublicId: p, email: "two@example.test", replaceConnection: replacement, grants: [{ matterPublicId: matterId, detailLevel: "name" }] };
    await request(app).post("/v1/sharing/connections").set(owner).send({ ...input, grants: [{ matterPublicId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", detailLevel: "name" }] }).expect(400);
    expect((await shared(actor)).items[0].accessMode).toBe("live");
    expect((await access()).version).toBe(a.version);
    await request(app).post("/v1/sharing/connections").set(owner).send(input).expect(201);
    expect((await access()).used).toBe(1);
    expect((await shared(actor)).items).toHaveLength(0);
    await request(app).post("/v1/sharing/connections").set(owner).send({ ...input, personPublicId: await person(), email: "three@example.test" }).expect(409);
  });

  it("pauses pending updates without implicitly reclaiming the Free slot", async () => {
    const first = await invite("one@example.test"), a = await access();
    const paused = await request(app).post(`/v1/sharing/connections/${first.body.connection.publicId}/pause`).set(owner)
      .send({ expectedVersion: 1, expectedAccessVersion: a.version }).expect(200);
    expect(paused.body.connection.access.mode).toBe("paused");
    expect(paused.body.access.used).toBe(0);
    expect((await invite("two@example.test")).status).toBe(201);
  });

  it("captures an existing Free recipient at paid activation before any new edit", async () => {
    const b = await recipient("b@example.test"), c = await recipient("c@example.test");
    const bi = await invite("b@example.test"); await accept(bi, b);
    const entitlement = await family();
    const ci = await invite("c@example.test"); await accept(ci, c);
    await expire(entitlement);
    expect((await choose(ci.body.connection.publicId, true)).status).toBe(200);
    expect((await shared(b)).items[0]).toMatchObject({ accessMode: "saved", fields: { notes: doc.notes } });
    expect((await shared(c)).items[0].accessMode).toBe("live");
  });
  it("never mislabels a post-cutoff capture after a retroactive provider correction", async () => {
    const entitlement = await family(), actor = await recipient("one@example.test"), invitation = await invite("one@example.test");
    await accept(invitation, actor);
    await pool.query("update app.commerce_entitlement_grants set expires_at=now()-interval '5 minutes' where id=$1", [entitlement]);
    expect((await shared(actor)).items).toHaveLength(0);
  });
  it("limits automated recipient rotation while leaving revocation available", async () => {
    const first = await invite("one@example.test");
    await pool.query("insert into app.audit_events(planner_id,actor_type,action,resource_type,metadata) select $1,'planner','sharing.free_recipient_selected','sharing_connection','{}'::jsonb from generate_series(1,20)", [ownerId]);
    await request(app).delete(`/v1/sharing/connections/${first.body.connection.publicId}`).set(owner).set("if-match", "1").expect(200);
    const limited = await invite("two@example.test");
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("sharing_change_rate_limited");
    expect((await access()).used).toBe(0);
  });
});
