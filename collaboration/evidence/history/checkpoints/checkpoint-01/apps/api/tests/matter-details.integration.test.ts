import request from "./http-fixture.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";
import { createPool, type DatabasePool } from "../src/db.js";
import { runMigrations } from "../src/migrate.js";
import { seedDevelopmentFixture, developmentPlannerPublicId } from "../src/seed-dev.js";

const databaseUrl = "postgresql:///continuity_matter_test";
const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: databaseUrl, ALLOW_DEV_AUTH: "true" });
const owner = { "x-dev-planner-id": developmentPlannerPublicId };
let pool: DatabasePool;
let app: ReturnType<typeof createApp>;
const wallet = { category: "crypto_asset", title: "Family wallet", details: { cryptoCustody: "self_custody", network: "Ethereum", walletAddress: "0x0123456789012345678901234567890123456789", walletLabel: "Hardware wallet", assetSymbol: "ETH" }, notes: "Ask the appointed person to locate the records." };

describe.sequential("Category-specific matter entry and initial map", () => {
  beforeAll(async () => {
    if (!databaseUrl.endsWith("/continuity_matter_test")) throw new Error("Dedicated matter test database required");
    await runMigrations(databaseUrl); pool = createPool(config);
    await pool.query("truncate app.planners restart identity cascade");
    await seedDevelopmentFixture(pool); app = createApp(pool, config);
  });
  afterAll(async () => { await pool?.end(); });

  it("requires authentication for the initial map and invitation creation", async () => {
    await request(app).get("/v1/overview").expect(401);
    await request(app).post("/v1/trusted-contacts").send({ displayName: "Parent" }).expect(401);
    await request(app).post("/v1/sharing/connections").send({}).expect(401);
    const overview = (await request(app).get("/v1/overview").set(owner).expect(200)).body;
    expect(overview.session.plannerPublicId).toBe(developmentPlannerPublicId);
    const matters = (await request(app).get("/v1/matters?limit=50").set(owner).expect(200)).body;
    const plan = (await request(app).get("/v1/plan").set(owner).expect(200)).body;
    const contacts = (await request(app).get("/v1/trusted-contacts").set(owner).expect(200)).body;
    const readiness = (await request(app).get("/v1/readiness").set(owner).expect(200)).body;
    expect(overview.matters).toEqual(matters.matters); expect(overview.plan).toEqual(plan.plan);
    expect(overview.trustedContacts).toEqual(contacts.trustedContacts); expect(overview.readiness).toEqual(readiness.readiness);
  });

  it("rejects missing category-specific required fields, including whitespace", async () => {
    for (const category of ["account", "financial_asset", "debt", "document", "device", "subscription", "crypto_asset"]) {
      await request(app).post("/v1/matters").set(owner).send({ category, title: "Incomplete" }).expect(400);
    }
    await request(app).post("/v1/matters").set(owner).send({ ...wallet, details: { cryptoCustody: "self_custody", network: "Ethereum" } }).expect(400);
    await request(app).post("/v1/matters").set(owner).send({ category: "account", title: "Name", institutionName: "   " }).expect(400);
    await request(app).post("/v1/matters").set(owner).send({ ...wallet, details: { cryptoCustody: "exchange" } }).expect(400);
  });

  it("persists typed details and notes, rejects partial-PATCH bypass and preserves conflicts", async () => {
    const created = (await request(app).post("/v1/matters").set(owner).send(wallet).expect(201)).body.matter;
    const path = `/v1/matters/${created.publicId}`;
    expect((await request(app).get(path).set(owner).expect(200)).body.matter).toMatchObject(wallet);
    await request(app).patch(path).set(owner).send({ expectedVersion: 1, details: {} }).expect(400);
    await request(app).patch(path).set(owner).send({ expectedVersion: 1, category: "document" }).expect(400);
    const updated = (await request(app).patch(path).set(owner).send({ expectedVersion: 1, notes: "Updated notes" }).expect(200)).body.matter;
    expect(updated.details).toEqual(wallet.details); expect(updated.notes).toBe("Updated notes"); expect(updated.version).toBe(2);
    await request(app).patch(path).set(owner).send({ expectedVersion: 1, notes: "Stale" }).expect(409);
    await request(app).patch(path).set(owner).send({ expectedVersion: 2, notes: null }).expect(200);
    expect((await request(app).get(path).set(owner).expect(200)).body.matter.notes).toBeNull();
  });

  it("rejects cross-category keys, unknown keys and invalid optional values", async () => {
    await request(app).post("/v1/matters").set(owner).send({ category: "account", title: "Account", institutionName: "Example", details: wallet.details }).expect(400);
    await request(app).post("/v1/matters").set(owner).send({ ...wallet, details: { ...wallet.details, hidden: "secret" } }).expect(400);
    await request(app).post("/v1/matters").set(owner).send({ ...wallet, institutionName: "Exchange", details: { ...wallet.details, cryptoCustody: "exchange" } }).expect(400);
    await request(app).post("/v1/matters").set(owner).send({ ...wallet, notes: "x".repeat(2001) }).expect(400);
    await request(app).post("/v1/matters").set(owner).send({ category: "subscription", title: "Subscription", institutionName: "Example", details: { renewalDate: "2026-02-30" } }).expect(400);
  });

  it("keeps new fields out of the minimum export and aggregate audit metadata", async () => {
    const preview = (await request(app).post("/v1/exports/start-here/preview").set(owner).send({}).expect(201)).body;
    const text = JSON.stringify(preview);
    expect(text).not.toContain(wallet.details.walletAddress); expect(text).not.toContain("walletLabel");
    const audit = (await request(app).get("/v1/audit-events").set(owner).expect(200)).body;
    expect(JSON.stringify(audit)).not.toContain(wallet.details.walletAddress);
  });
});
