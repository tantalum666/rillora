import { createHash, randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import express from "express";
import pg from "pg";
import { createApp } from "../src/app.js";
import { loadConfig, type AppConfig } from "../src/config.js";
import { createPool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { currentLegalContract as legal } from "../src/legal-contract.js";
import { verifiedEmailDigest } from "../src/sharing-identity.js";
import { StripeTestAdapter } from "../src/stripe-test-adapter.js";
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from "./dedicated-test-database.js";

// Explicit local-only provider acceptance, never a production authentication route.
// Uses the real cookie/CSRF middleware and official Stripe TEST SDK. Upstream OIDC
// login and human consent are deliberately synthetic and are not acceptance claims.
const name = "rillora_stripe_web_20261006_test";
const databaseUrl = dedicatedTestDatabaseUrl(`postgresql://127.0.0.1:5432/${name}`, name);
const port = 4496;
const webOrigin = "http://127.0.0.1:4809";
const privateDir = resolve(process.env.RILLORA_STRIPE_QA_PRIVATE_DIR ?? "");
if (!process.env.RILLORA_STRIPE_QA_PRIVATE_DIR || !(privateDir.includes("/.local-secrets/") && (await stat(privateDir)).isDirectory())) {
  throw new Error("An existing protected fixture directory is required");
}
async function secretFile(filename: string, prefix: string): Promise<string> {
  const path = resolve(privateDir, filename);
  const info = await stat(path);
  if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error("Fixture secrets must be owner-only files");
  const value = (await readFile(path, "utf8")).trim();
  if (!value.startsWith(prefix) || value.length < 20 || value.length > 255) throw new Error("Unexpected fixture credential kind");
  return value;
}
// Identity-provider configuration stays absent: this fixture tests the shipping
// cookie middleware, not an OIDC substitute or a change to production validation.
const config: AppConfig = { ...loadConfig({ NODE_ENV: "test", DATABASE_URL: databaseUrl,
  ALLOW_DEV_AUTH: "false", CORS_ORIGINS: webOrigin }), allowStripeTestIntegration: true,
  stripeTest: {
    apiKey: await secretFile("stripe-test-key.txt", "rk_test_"),
    webhookSecret: await secretFile("stripe-webhook-secret.txt", "whsec_"),
    integrationEnvironment: "test", expectedAccountId: "acct_1U6B2RCxTlowhyiG",
    familyProductId: "prod_V6O8lAFbTCDmKd", familyPlanVersion: 2, familyPriceVersion: 4,
    familyPriceIds: { monthly: "price_1UHMlhCxTlowhyiGvBEPdb4x", annual: "price_1UJe38CxTlowhyiGdx5ypIKJ" },
    checkoutSuccessUrl: `${webOrigin}/account/billing/complete`,
    checkoutCancelUrl: `${webOrigin}/account/billing`, portalReturnUrl: `${webOrigin}/account/billing`,
  },
};
await new StripeTestAdapter(config.stripeTest!).assertCheckoutReady("annual");
const adminUrl = new URL(databaseUrl); adminUrl.pathname = "/postgres";
await assertDedicatedTestDatabase(adminUrl.toString(), "postgres");
const admin = new pg.Client({ connectionString: adminUrl.toString() }); await admin.connect();
try {
  if (!(await admin.query("select 1 from pg_database where datname=$1", [name])).rowCount) {
    await admin.query("create database rillora_stripe_web_20261006_test");
  }
} finally { await admin.end(); }
await assertDedicatedTestDatabase(databaseUrl, name);
const owner = new pg.Client({ connectionString: databaseUrl }); await owner.connect();
if (!(await owner.query("select pg_try_advisory_lock(hashtext('rillora-stripe-web-fixture')) as acquired")).rows[0].acquired) {
  await owner.end(); throw new Error("Another Stripe Web fixture already owns this database");
}
await runMigrations(databaseUrl);
const pool = createPool(config);
const subject = "stripe-web-20261006-cookie-acceptance";
const identityHash = createHash("sha256").update(`synthetic:${subject}`).digest();
await owner.query("begin");
const actor = (await owner.query("select * from app.provision_oidc_planner($1,$2,$3,$4,$5)",
  ["https://synthetic-qa.rillora.invalid/", subject, "Rillora Stripe Web QA (synthetic)", "en", "UTC"])).rows[0];
let acceptance = (await owner.query("select id from app.legal_acceptances where planner_id=$1 and identity_reference_sha256=$2 and legal_bundle_sha256=$3 order by id desc limit 1",
  [actor.planner_id, identityHash, Buffer.from(legal.bundleSha256, "hex")])).rows[0];
if (!acceptance) acceptance = (await owner.query(`insert into app.legal_acceptances(
  planner_id,identity_account_id,terms_version,privacy_version,consent_text_version,legal_bundle_sha256,
  accepted_terms,acknowledged_privacy,accepted_electronic_records,client_surface,identity_reference_sha256)
  values($1,$2,$3,$4,$5,$6,true,true,true,'web',$7) returning id`,
  [actor.planner_id, actor.identity_account_id, legal.termsVersion, legal.privacyVersion, legal.consentTextVersion,
    Buffer.from(legal.bundleSha256, "hex"), identityHash])).rows[0];
await owner.query("update app.plans set first_use_state='completed',first_use_step=2,status='active' where planner_id=$1", [actor.planner_id]);
await owner.query(`insert into app.commerce_validation_accounts(planner_id,expires_at,reason)
  values($1,now()+interval '2 hours','Local synthetic current-price browser acceptance')
  on conflict(planner_id) do update set expires_at=excluded.expires_at,reason=excluded.reason`, [actor.planner_id]);
await owner.query("commit");
const eventsDirectory = resolve(privateDir, "stripe-events"); await mkdir(eventsDirectory, { recursive: true, mode: 0o700 });
const nonce = randomBytes(32).toString("base64url");
const app = express();
app.use((req, res, next) => {
  if (!["127.0.0.1:4496", "127.0.0.1:4809"].includes(req.get("host") ?? "")) { res.sendStatus(403); return; }
  next();
});
app.get("/qa", (_req, res) => {
  res.set("Cache-Control", "no-store").set("Content-Security-Policy", "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  res.type("html").send(`<!doctype html><html lang="en"><title>Rillora Stripe Web TEST fixture</title>
  <h1>Rillora Stripe Web TEST fixture</h1><p>Isolated synthetic account. No real registration, consent ceremony or charge.</p>
  <p>Use the real browser-cookie/CSRF path with the existing Rillora USD 88.99 annual TEST price.</p>
  <form method="post" action="/api/qa/session"><input type="hidden" name="nonce" value="${nonce}"><button>Start local test session</button></form></html>`);
});
app.post("/qa/session", express.urlencoded({ extended: false, limit: "1kb" }), async (req, res, next) => {
  try {
    if (req.get("origin") !== webOrigin || req.body.nonce !== nonce) { res.sendStatus(403); return; }
    const token = randomBytes(32).toString("base64url"), csrf = randomBytes(32).toString("base64url");
    const digest = (value: string) => createHash("sha256").update(value).digest();
    await owner.query(`insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,
      token_hash,csrf_token_hash,credential_kind,authentication_methods,authenticated_at,expires_at,last_seen_at,verified_email_hash)
      values($1,$2,$3,$4,$5,'browser_cookie',array['synthetic_qa'],now(),now()+interval '2 hours',now(),$6)`,
      [actor.planner_id, actor.identity_account_id, acceptance.id, digest(token), digest(csrf), verifiedEmailDigest("stripe-web-qa-20261006@example.test")]);
    const options = { secure: false, sameSite: "lax" as const, path: "/", maxAge: 2 * 60 * 60 * 1000 };
    res.cookie("continuity_session", token, { ...options, httpOnly: true });
    res.cookie("continuity_csrf", csrf, { ...options, httpOnly: false });
    res.redirect(303, `${webOrigin}/?view=access`);
  } catch (error) { next(error); }
});
// Preserve actual successful relay deliveries privately for a byte-identical
// signed replay. This never substitutes signatures or the production handler.
app.post("/commerce/stripe/webhook", express.raw({ type: "application/json", limit: "256kb" }), (req, res, next) => {
  const body = Buffer.isBuffer(req.body) ? Buffer.from(req.body) : null;
  const signature = req.get("stripe-signature");
  res.on("finish", () => {
    if (!body || !signature || ![200, 202].includes(res.statusCode)) return;
    try {
      const event = JSON.parse(body.toString());
      if (event.livemode !== false || !/^evt_[A-Za-z0-9]+$/.test(event.id)) return;
      void writeFile(resolve(eventsDirectory, `${event.id}.json`), JSON.stringify({ bodyBase64: body.toString("base64"), signature }), { mode: 0o600 })
        .catch(() => process.stderr.write("Private webhook capture failed\n"));
    } catch { /* The shipping handler owns validation and error semantics. */ }
  });
  next();
});
app.use(createApp(pool, config));
const server = app.listen(port, "127.0.0.1", () => console.log(JSON.stringify({ fixture: "stripe-web-cookie-v1",
  syntheticOnly: true, upstreamOidcAndConsentVerified: false, plannerPublicId: actor.planner_public_id,
  webOrigin, account: "acct_1U6B2RCxTlowhyiG", testOnly: true, annualAmountMinor: 8899 })));
async function stop() { server.close(); await pool.end(); await owner.end(); }
process.once("SIGINT", () => { void stop(); }); process.once("SIGTERM", () => { void stop(); });
