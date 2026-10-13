import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import { runMigrations } from '../src/migrate.js';
import { configureProductionApple } from '../src/configure-production-apple.js';
import { reviewIdentityDigest } from '../src/production-review-access.js';
import { loadApplePurchaseQuote } from '../src/apple-purchase-catalog.js';

const name = 'continuity_apple_configuration_test';
const url = dedicatedTestDatabaseUrl('postgresql://127.0.0.1:5432/continuity_apple_configuration_test', name);
let client: pg.Client;
const digest = reviewIdentityDigest('https://identity.example.test', 'existing-apple-review-fixture');
describe('bounded Apple release configuration in an isolated database', () => {
  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: new URL('/postgres', url).href }); await admin.connect();
    try {
      if (!(await admin.query('select 1 from pg_database where datname=$1', [name])).rowCount) {
        await admin.query('create database continuity_apple_configuration_test');
        await admin.query("comment on database continuity_apple_configuration_test is 'rillora-disposable-test:continuity_apple_configuration_test'");
      }
    } finally { await admin.end(); }
    await assertDedicatedTestDatabase(url, name); await runMigrations(url);
    client = new pg.Client({ connectionString: url }); await client.connect();
    await client.query('delete from app.planners where id in(select planner_id from app.identity_accounts where subject=$1)', ['auth0|' + '5'.repeat(24)]);
    // Reset only this named disposable fixture database; never select a cloud host.
    await client.query("delete from app.commerce_storefront_products where provider_code='storekit' and provider_environment='production'");
    await client.query("delete from app.commerce_purchase_route_policies where policy_code like '%_storekit_20261013'");
    await client.query("delete from app.commerce_storefront_policies where policy_code like '%_storekit_20261013'");
    await client.query("delete from app.commerce_apple_price_bindings where binding_code like 'apple_production_%_20261013'");
    await client.query("delete from app.commerce_prices where price_code like 'family_apple_%_20261013'");
    await client.query("update app.commerce_plan_versions set status='active' where plan_code='family' and version=2");
    await client.query("update app.commerce_plan_capabilities set enforcement_mode='included' where capability_code in('trusted_people_multiple','family_maintenance')");
    await client.query("update app.commerce_market_policies set sales_enabled=false where service_market_code='GLOBAL_US'");
    for (const [country, currency, amount] of [['USA', 'USD', '11999'], ['HKG', 'HKD', '88800']] as const) {
      await client.query(`insert into app.commerce_prices(price_code,plan_version_id,operator_code,service_market_code,
        amount_minor,minor_unit_exponent,currency_code,billing_interval,tax_behavior,status,purchase_channel,effective_from)
        select $1,plan_version_id,operator_code,service_market_code,$2,2,$3,'annual','provider_determined','test_only','apple_app_store',now()
        from app.commerce_prices where price_code='family_usd_annual_v4' on conflict(price_code) do nothing`,
        [`apple_configuration_${country.toLowerCase()}`, amount, currency]);
      await client.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,product_reference,
        storefront_country_code,effective_from,status,provider_environment)
        select $1,id,'com.rillora.family.annual',$2,now(),'active','sandbox' from app.commerce_prices where price_code=$1
        on conflict(binding_code) do nothing`, [`apple_configuration_${country.toLowerCase()}`, country]);
    }
    await client.query("delete from app.planners where display_name='Apple configuration fixture'");
    const p = (await client.query("insert into app.planners(display_name) values('Apple configuration fixture') returning id")).rows[0];
    await client.query("insert into app.identity_accounts(planner_id,issuer,subject) values($1,'https://identity.example.test','existing-apple-review-fixture')", [p.id]);
    await client.query("insert into app.commerce_validation_accounts(planner_id,expires_at,reason) values($1,now()-interval '1 day','Isolated Apple configuration fixture')", [p.id]);
  });
  afterAll(async () => { await client?.end(); });
  it('inspects without writes and refuses stale state before preparing any product', async () => {
    const original = await configureProductionApple(client, 'inspect');
    expect(original.before).toEqual(original.after);
    await expect(configureProductionApple(client, 'prepare', { expected: '0'.repeat(64) })).rejects.toThrow('changed after inspection');
    expect((await configureProductionApple(client, 'inspect')).after.sha256).toBe(original.after.sha256);
  });
  it('adds only approved Production annual metadata, preserving Sandbox, all historical rows and closed sales', async () => {
    const before = await configureProductionApple(client, 'inspect');
    const result = await configureProductionApple(client, 'prepare', { expected: before.after.sha256 });
    const d = result.after.data;
    expect(d.prices.length - before.after.data.prices.length).toBe(2);
    expect(d.bindings.filter(b => b.provider_environment === 'production')).toHaveLength(2);
    expect(d.products.filter(p => p.provider_environment === 'production' && p.provider_code === 'storekit')).toHaveLength(1);
    expect(d.markets.find(m => m.service_market_code === 'GLOBAL_US').sales_enabled).toBe(false);
    expect(d.review).toEqual(before.after.data.review);
    expect(d.prices.find(p => p.price_code === 'family_apple_usd_11999_20261013')).toMatchObject({ amount_minor: '11999', currency_code: 'USD', status: 'active' });
    expect(d.prices.find(p => p.price_code === 'family_apple_hkd_88800_20261013')).toMatchObject({ amount_minor: '88800', currency_code: 'HKD', status: 'active' });
    expect((await client.query('select count(*)::int as n from app.commerce_orders')).rows[0].n).toBe(0);
    await expect(loadApplePurchaseQuote(client as unknown as pg.PoolClient, { serviceMarketCode: 'GLOBAL_US', storefrontCountryCode: 'USA' })).rejects.toMatchObject({ code: 'apple_purchase_unavailable' });
    const repeated = await configureProductionApple(client, 'prepare', { expected: result.after.sha256 });
    expect(repeated.after.sha256).toBe(result.after.sha256);
  });
  it('quotes both storefronts only after separate market and Apple route activation, without matching test or old external routes', async () => {
    await client.query('begin');
    try {
      await client.query("update app.commerce_operating_planes set status='active' where code='global'");
      await client.query("update app.commerce_operators set status='active' where operating_plane_code='global'");
      await client.query("update app.commerce_market_policies set status='active',sales_enabled=true where service_market_code='GLOBAL_US'");
      await client.query('update app.commerce_runtime_policy set production_entitlements_enabled=true where singleton');
      await expect(loadApplePurchaseQuote(client as unknown as pg.PoolClient, { serviceMarketCode: 'GLOBAL_US', storefrontCountryCode: 'USA' })).rejects.toMatchObject({ code: 'apple_purchase_unavailable' });
      await client.query("update app.commerce_purchase_route_policies set enabled=true where policy_code in('global_us_ios_usa_storekit_20261013','global_us_ios_hkg_storekit_20261013') and version=1");
      for (const [country, currency, minor] of [['USA', 'USD', 11999], ['HKG', 'HKD', 88800]] as const) {
        const result = await loadApplePurchaseQuote(client as unknown as pg.PoolClient, { serviceMarketCode: 'GLOBAL_US', storefrontCountryCode: country });
        expect(result.quote).toMatchObject({ amountMinor: minor, currency, priceMilliunits: minor * 10, billingPeriod: 'annual' });
      }
      await expect(loadApplePurchaseQuote(client as unknown as pg.PoolClient, { serviceMarketCode: 'GLOBAL_US', storefrontCountryCode: 'AUS' })).rejects.toMatchObject({ code: 'apple_purchase_unavailable' });
    } finally { await client.query('rollback'); }
  });
  it('closes only the two prepared Production Apple routes while retaining Web, review access and all prices', async () => {
    const codes = ['global_us_ios_usa_storekit_20261013', 'global_us_ios_hkg_storekit_20261013'];
    await client.query('update app.commerce_purchase_route_policies set enabled=true where policy_code=any($1::text[]) and version=1', [codes]);
    const before = await configureProductionApple(client, 'inspect');
    await expect(configureProductionApple(client, 'close-new-sales', { expected: '0'.repeat(64) })).rejects.toThrow('changed after inspection');
    const result = await configureProductionApple(client, 'close-new-sales', { expected: before.after.sha256 });
    expect(result.after.data).toEqual({ ...before.after.data,
      routes: before.after.data.routes.map(r => codes.includes(r.policy_code) && r.version === 1 ? { ...r, enabled: false } : r),
    });
    const repeated = await configureProductionApple(client, 'close-new-sales', { expected: result.after.sha256 });
    expect(repeated.after.sha256).toBe(result.after.sha256);
    const preparedAgain = await configureProductionApple(client, 'prepare', { expected: repeated.after.sha256 });
    expect(preparedAgain.after.sha256).toBe(result.after.sha256);
  });
  it('rejects conflicting current amounts atomically instead of overwriting an existing price', async () => {
    await client.query("update app.commerce_prices set amount_minor=12000 where price_code='family_apple_usd_11999_20261013'");
    const before = await configureProductionApple(client, 'inspect');
    await expect(configureProductionApple(client, 'prepare', { expected: before.after.sha256 })).rejects.toThrow('Conflicting prepared price');
    expect((await configureProductionApple(client, 'inspect')).after.sha256).toBe(before.after.sha256);
    await client.query("update app.commerce_prices set amount_minor=11999 where price_code='family_apple_usd_11999_20261013'");
  });
  it('renews only an existing enrolled identity and rejects unknown identities or unbounded expiry', async () => {
    const before = await configureProductionApple(client, 'inspect'), expiry = new Date(Date.now() + 86400_000).toISOString();
    for (const options of [
      { reviewDigests: ['0'.repeat(64)], reviewExpiresAt: expiry },
      { reviewDigests: [digest], reviewExpiresAt: new Date(Date.now() + 32 * 86400_000).toISOString() },
      { reviewDigests: [digest, digest], reviewExpiresAt: expiry },
    ]) await expect(configureProductionApple(client, 'renew-review', { expected: before.after.sha256, ...options })).rejects.toThrow();
    expect((await configureProductionApple(client, 'inspect')).after.sha256).toBe(before.after.sha256);
    const result = await configureProductionApple(client, 'renew-review', { expected: before.after.sha256, reviewDigests: [digest], reviewExpiresAt: expiry });
    expect(result.after.data.review[0].expires_at.toISOString()).toBe(expiry);
    expect(result.after.data.prices).toEqual(before.after.data.prices);
    expect(result.after.data.routes).toEqual(before.after.data.routes);
  });
  it('enrolls a pre-existing active reviewer without creating an identity, order or customer content', async () => {
    const p = (await client.query("insert into app.planners(display_name) values('Apple configuration fixture') returning id")).rows[0];
    const subject = 'dedicated-apple-review-fixture';
    await client.query("insert into app.identity_accounts(planner_id,issuer,subject) values($1,'https://identity.example.test',$2)", [p.id, subject]);
    const fresh = await configureProductionApple(client, 'inspect'), expiry = new Date(Date.now() + 86400_000).toISOString();
    const result = await configureProductionApple(client, 'enroll-review', { expected: fresh.after.sha256,
      reviewDigests: [reviewIdentityDigest('https://identity.example.test', subject)], reviewExpiresAt: expiry });
    expect(result.after.data.review.length).toBe(fresh.after.data.review.length + 1);
    expect(result.after.data.markets).toEqual(fresh.after.data.markets);
    expect(result.after.data.prices).toEqual(fresh.after.data.prices);
    const before = await configureProductionApple(client, 'inspect');
    await expect(configureProductionApple(client, 'enroll-review', { expected: before.after.sha256,
      reviewDigests: ['0'.repeat(64)], reviewExpiresAt: expiry })).rejects.toThrow('existing active review identity');
    expect((await configureProductionApple(client, 'inspect')).after.sha256).toBe(before.after.sha256);
    expect((await client.query('select count(*)::int as n from app.commerce_orders')).rows[0].n).toBe(0);
  });
  it('preprovisions only the scoped synthetic reviewer without accepting terms or creating a login session', async () => {
    const subject = 'auth0|' + '5'.repeat(24), issuer = 'https://login.rillora.xyz';
    const options = { reviewDigests: [reviewIdentityDigest(issuer, subject)], reviewerSubject: subject,
      reviewExpiresAt: new Date(Date.now() + 86400_000).toISOString() };
    const before = await configureProductionApple(client, 'inspect');
    await expect(configureProductionApple(client, 'provision-reviewer', { ...options, expected: before.after.sha256,
      reviewerSubject: 'auth0|' + '6'.repeat(24) })).rejects.toThrow('Exact deployed');
    const result = await configureProductionApple(client, 'provision-reviewer', { ...options, expected: before.after.sha256 });
    expect(result.after.data.review.length).toBe(before.after.data.review.length + 1);
    expect(result.after.data.markets).toEqual(before.after.data.markets);
    const identity = (await client.query('select p.id,p.display_name from app.identity_accounts i join app.planners p on p.id=i.planner_id where i.issuer=$1 and i.subject=$2', [issuer, subject])).rows[0];
    expect(identity.display_name).toBe('Rillora App Review');
    expect((await client.query('select count(*)::int as n from app.plans where planner_id=$1', [identity.id])).rows[0].n).toBe(1);
    for (const table of ['auth_sessions', 'legal_acceptances', 'commerce_orders', 'matter_items']) {
      expect((await client.query(`select count(*)::int as n from app.${table}`)).rows[0].n).toBe(0);
    }
    const repeated = await configureProductionApple(client, 'provision-reviewer', { ...options, expected: result.after.sha256 });
    expect(repeated.after.sha256).toBe(result.after.sha256);
    await client.query("update app.planners set display_name='Personal fixture' where id=$1", [identity.id]);
    const personal = await configureProductionApple(client, 'inspect');
    await expect(configureProductionApple(client, 'provision-reviewer', { ...options, expected: personal.after.sha256 })).rejects.toThrow('cannot be repurposed');
  });
});
