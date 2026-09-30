import { createHash, randomBytes } from "node:crypto";
import request from "./http-fixture.js";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool, type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { currentLegalContract as legal } from "../src/legal-contract.js";
import { seedDevelopmentFixture, developmentPlannerPublicId as ownerId } from "../src/seed-dev.js";
import type { EmailIdentity } from "../src/email-verification.js";

const databaseUrl = "postgresql:///continuity_email_verification_test";
const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: databaseUrl, ALLOW_DEV_AUTH: "true", CORS_ORIGINS: "http://localhost:4191" });
const hash = (value: string) => createHash("sha256").update(value).digest();
let pool: DatabasePool;
let app: ReturnType<typeof createApp>;
let proof: (identity: EmailIdentity) => Promise<string | null>;
const csrf = "v".repeat(43);
const owner = { "x-dev-planner-id": ownerId };

async function actor(credentialKind = "browser_cookie") {
  const subject = `auth0|email-qa-${randomBytes(8).toString("hex")}`;
  const who = (await pool.query("select * from app.provision_oidc_planner($1,$2,'Recipient','en','UTC')", ["https://identity.example", subject])).rows[0];
  const token = randomBytes(32).toString("base64url");
  const acceptance = (await pool.query(`insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
    values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id`,
    [who.planner_id, who.identity_account_id, legal.termsVersion, legal.privacyVersion, legal.consentTextVersion, Buffer.from(legal.bundleSha256,"hex"),hash(subject)])).rows[0].id;
  const session = (await pool.query(`insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,credential_kind,expires_at)
    values($1,$2,$3,$4,$5,$6,now()+interval '1 hour') returning public_id`, [who.planner_id,who.identity_account_id,acceptance,hash(token),hash(csrf),credentialKind])).rows[0].public_id;
  const headers = credentialKind === "browser_cookie" ? { cookie: `continuity_session=[REDACTED_COOKIE] "x-csrf-token":csrf } : { authorization:`Bearer ${token}` };
  return { subject, session, headers, token, plannerId: who.planner_id, acceptance };
}
describe.sequential("Email verification without another sign-in", () => {
  beforeAll(async () => {
    if (!databaseUrl.endsWith("/continuity_email_verification_test")) throw Error("Dedicated verification test database required");
    await runMigrations(databaseUrl); pool=createPool(config);
    await pool.query("truncate app.planners restart identity cascade"); await seedDevelopmentFixture(pool);
    app=createApp(pool,config,{emailIdentityVerifier:{verifiedEmail: identity=>proof(identity)}});
  });
  afterAll(async()=>{await pool?.end();});
  it("accepts the saved invitation with the same cookie and receipt after the provider verifies the email", async()=>{
    const recipient=await actor(); let verified=false;
    proof=async identity=>{expect(identity).toEqual({issuer:"https://identity.example",subject:recipient.subject});return verified?"recipient@example.test":null;};
    const contact=(await request(app).post("/v1/trusted-contacts").set(owner).send({displayName:"Email recipient"}).expect(201)).body.trustedContact.publicId;
    const invite=(await request(app).post("/v1/sharing/connections").set(owner).send({personPublicId:contact,email:"recipient@example.test",grants:[]}).expect(201)).body;
    const invitationToken=new URLSearchParams(new URL(invite.invitationUrl).hash.slice(1)).get("invitation");
    const attempt=()=>request(app).post("/v1/sharing/invitations/accept").set(recipient.headers).send({invitationToken,accepted:true});
    expect((await attempt().expect(403)).body.error.code).toBe("verified_email_required");
    expect((await request(app).post("/v1/sharing/email-verification").set(recipient.headers).send({}).expect(200)).body.verified).toBe(false);
    verified=true;
    await attempt().expect(200);
    const row=(await pool.query("select token_hash,legal_acceptance_id,verified_email_hash from app.auth_sessions where public_id=$1",[recipient.session])).rows[0];
    expect(row.token_hash).toEqual(hash(recipient.token));expect(row.legal_acceptance_id).toBe(recipient.acceptance);expect(row.verified_email_hash).not.toBeNull();
    expect((await request(app).get("/v1/sharing/shared-with-me").set(recipient.headers).expect(200)).body.connections).toHaveLength(1);
  });
  it("requires CSRF and refuses caller-selected identity or email fields",async()=>{
    const recipient=await actor();proof=async()=>{throw Error("must not contact provider");};
    await request(app).post("/v1/sharing/email-verification").set("cookie",`continuity_session=[REDACTED_COOKIE];
    await request(app).post("/v1/sharing/email-verification").set(recipient.headers).send({subject:"someone-else",email:"recipient@example.test",verified:true}).expect(400);
    await request(app).post("/v1/sharing/email-verification").send({}).expect(401);
  });
  it("supports the same native bearer session and leaves it usable on provider outage",async()=>{
    const recipient=await actor("native_bearer"); proof=async()=>{throw Error("provider unavailable");};
    await request(app).post("/v1/sharing/email-verification").set(recipient.headers).send({}).expect(503);
    await request(app).get("/v1/sharing/shared-with-me").set(recipient.headers).expect(200);
    proof=async()=>"native@example.test";
    expect((await request(app).post("/v1/sharing/email-verification").set(recipient.headers).send({}).expect(200)).body.verified).toBe(true);
  });
  it("does not revive a session revoked while provider verification is running",async()=>{
    const recipient=await actor();proof=async()=>{await pool.query("update app.auth_sessions set revoked_at=now() where public_id=$1",[recipient.session]);return "recipient@example.test";};
    await request(app).post("/v1/sharing/email-verification").set(recipient.headers).send({}).expect(401);
    expect((await pool.query("select verified_email_hash from app.auth_sessions where public_id=$1",[recipient.session])).rows[0].verified_email_hash).toBeNull();
  });
});
