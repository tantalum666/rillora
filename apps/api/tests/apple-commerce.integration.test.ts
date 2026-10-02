import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../src/migrate.js';
import { withCommercePlannerDatabase, withPlannerDatabase, type DatabasePool } from '../src/db.js';
import { loadAppleProductionPriceBindings, minorToAppleMilliunits } from '../src/apple-price-catalog.js';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import request from './http-fixture.js';

// Fixed disposable localhost target; never accept a cloud/Owner database override.
const databaseUrl = dedicatedTestDatabaseUrl('postgresql://127.0.0.1:5432/continuity_apple_commerce_test', 'continuity_apple_commerce_test');
let pool: DatabasePool;
let plannerId: string;
let subscriptionId: string;
let plannerPublicId: string;

describe('shared subscription clock with Apple-authorized grace (isolated database)', () => {
  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: new URL('/postgres', databaseUrl).href });
    await admin.connect();
    try {
      if (!(await admin.query("select 1 from pg_database where datname='continuity_apple_commerce_test'")).rowCount) {
        await admin.query('create database continuity_apple_commerce_test');
      }
    } finally { await admin.end(); }
    await assertDedicatedTestDatabase(databaseUrl, 'continuity_apple_commerce_test');
    await runMigrations(databaseUrl);
    pool = new pg.Pool({ connectionString: databaseUrl, max: 3 });
    await pool.query('truncate app.commerce_provider_event_inbox, app.planners restart identity cascade');
    const planner = (await pool.query(`insert into app.planners(display_name,locale,time_zone,residence_country_code)
      values('Apple clock fixture','en','UTC','US') returning id::text,public_id::text`)).rows[0];
    plannerId = planner.id; plannerPublicId = planner.public_id;
    await pool.query('delete from app.commerce_apple_price_bindings');
    await pool.query("delete from app.commerce_prices where price_code='family_apple_usd_annual_fixture'");
    await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2)", [plannerId]);
    await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code,status)
      select $1,id,'global','GLOBAL_US','active' from app.plans where planner_id=$1`, [plannerId]);
    // Catalog activation is confined to this disposable database, not a provider or launch decision.
    await pool.query("update app.commerce_runtime_policy set production_entitlements_enabled=true,sharing_limits_enabled=true");
    await pool.query("update app.commerce_plan_versions set status='active' where plan_code='family' and version=2");
    await pool.query(`update app.commerce_plan_capabilities set enforcement_mode='included'
      where plan_version_id in(select id from app.commerce_plan_versions where plan_code='family' and version=2)`);
    subscriptionId = (await pool.query(`insert into app.commerce_subscriptions(planner_id,commerce_account_id,
      plan_version_id,plan_code,price_id,acquisition_type,renewal_provider,provider_environment,
      provider_subscription_reference,state,current_period_starts_at,current_period_ends_at,grace_ends_at,provider_observed_at)
      select $1,a.id,p.plan_version_id,'family',p.id,'purchased','storekit','production','700000000001',
        'grace',now()-interval '373 days',now()-interval '8 days',now()+interval '8 days',now()
      from app.commerce_accounts a cross join app.commerce_prices p
      where a.planner_id=$1 and p.price_code='family_usd_annual_v4' returning id::text`, [plannerId])).rows[0].id;
  });
  afterAll(async () => { await pool?.end(); });

  const apply = () => withCommercePlannerDatabase(pool, plannerId, async client =>
    (await client.query('select app.apply_verified_subscription_entitlements($1) as applied', [subscriptionId])).rows[0].applied);
  const access = () => withPlannerDatabase(pool, plannerId, async client => (await client.query(`
    select app.commerce_subscription_effective($1) as effective,
      ((app.sharing_access_status()->>'limit')::integer=5) as sharing`, [subscriptionId])).rows[0]);

  it('honors a signed 16-day Apple window consistently after the old seven-day cutoff', async () => {
    expect(await apply()).toBe(true);
    expect(await access()).toEqual({ effective: true, sharing: true });
    const result = (await pool.query(`select e.expires_at=s.grace_ends_at as exact
      from app.commerce_entitlement_grants e join app.commerce_subscriptions s on s.id=e.subscription_id
      where s.id=$1 and e.revoked_at is null`, [subscriptionId])).rows;
    expect(result).toHaveLength(2);
    expect(result.every(row => row.exact)).toBe(true);
  });

  it('does not invent grace when its authoritative end is missing, invalid or excessive', async () => {
    for (const expression of ['null', "current_period_ends_at-interval '1 second'", "current_period_ends_at+interval '29 days'"]) {
      await pool.query(`update app.commerce_subscriptions set grace_ends_at=${expression} where id=$1`, [subscriptionId]);
      expect(await access()).toEqual({ effective: false, sharing: false });
      await apply();
      expect((await pool.query('select count(*)::int as n from app.commerce_entitlement_grants where subscription_id=$1 and revoked_at is null', [subscriptionId])).rows[0].n).toBe(0);
    }
  });

  it('supports the actual 28-day Apple ceiling and denies access at expiry without waiting for a notification', async () => {
    await pool.query("update app.commerce_subscriptions set grace_ends_at=current_period_ends_at+interval '28 days' where id=$1", [subscriptionId]);
    expect(await apply()).toBe(true);
    expect(await access()).toEqual({ effective: true, sharing: true });
    const zoneResults = await withPlannerDatabase(pool, plannerId, async client => {
      const values: boolean[] = [];
      for (const zone of ['UTC', 'Pacific/Auckland', 'America/New_York']) {
        await client.query("select set_config('TimeZone',$1,true)", [zone]);
        values.push((await client.query('select app.commerce_subscription_effective($1) as effective', [subscriptionId])).rows[0].effective);
      }
      return values;
    });
    expect(zoneResults).toEqual([true, true, true]);
    await pool.query("update app.commerce_subscriptions set grace_ends_at=now()-interval '1 second' where id=$1", [subscriptionId]);
    expect(await access()).toEqual({ effective: false, sharing: false });
  });

  it('preserves the existing non-Apple cap and normal paid-term cancellation behavior', async () => {
    await pool.query("update app.commerce_subscriptions set renewal_provider='stripe',grace_ends_at=current_period_ends_at+interval '16 days' where id=$1", [subscriptionId]);
    expect(await access()).toEqual({ effective: false, sharing: false });
    await pool.query(`update app.commerce_subscriptions set renewal_provider='storekit',state='cancel_at_period_end',
      current_period_ends_at=now()+interval '2 days',grace_ends_at=null,cancel_at_period_end=true where id=$1`, [subscriptionId]);
    expect(await apply()).toBe(true);
    expect(await access()).toEqual({ effective: true, sharing: true });
  });

  it('keeps a later Apple price out of the Web quote and loads exact signed milliunits', async () => {
    await expect(loadAppleProductionPriceBindings(pool)).rejects.toThrow();
    await pool.query(`insert into app.commerce_prices(price_code,plan_version_id,operator_code,service_market_code,
      amount_minor,minor_unit_exponent,currency_code,billing_interval,tax_behavior,status,purchase_channel)
      select 'family_apple_usd_annual_fixture',plan_version_id,operator_code,service_market_code,
        9999,2,'USD','annual','provider_determined','active','apple_app_store'
      from app.commerce_prices where price_code='family_usd_annual_v4'`);
    await pool.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,product_reference,
      storefront_country_code,effective_from,status)
      select 'fixture_annual',id,'com.rillora.family.annual','USA','2026-09-01','active'
      from app.commerce_prices where price_code='family_apple_usd_annual_fixture'`);
    const catalog = await loadAppleProductionPriceBindings(pool);
    expect(catalog.resolve({ productId: 'com.rillora.family.annual', storefront: 'USA', currency: 'USD',
      price: 99990, purchaseDate: Date.parse('2026-09-25T00:00:00Z') })).toMatchObject({
        priceCode: 'family_apple_usd_annual_fixture', planVersion: 2, priceMilliunits: 99990 });
    const app = createApp(pool, loadConfig({ NODE_ENV: 'test', DATABASE_URL: databaseUrl, ALLOW_DEV_AUTH: 'true' }));
    const response = await request(app).get('/v1/commerce/status?serviceMarketCode=GLOBAL_US')
      .set('x-dev-planner-id', plannerPublicId).expect(200);
    expect(response.body.offers).toEqual(expect.arrayContaining([expect.objectContaining({
      priceCode: 'family_usd_annual_v4', amountMinor: 8899,
    })]));
    expect(JSON.stringify(response.body.offers)).not.toContain('family_apple_usd_annual_fixture');
  });

  it('prevents Apple binding to a Web price and rejects ambiguous reviewed windows', async () => {
    await expect(pool.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,
      product_reference,storefront_country_code,effective_from)
      select 'fixture_wrong_channel',id,'com.rillora.family.annual','USA','2026-09-01'
      from app.commerce_prices where price_code='family_usd_annual_v4'`)).rejects.toMatchObject({ code: '23503' });
    await pool.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,product_reference,
      storefront_country_code,effective_from,status)
      select 'fixture_overlap',price_id,product_reference,storefront_country_code,effective_from,status
      from app.commerce_apple_price_bindings where binding_code='fixture_annual'`);
    await expect(loadAppleProductionPriceBindings(pool)).rejects.toThrow('overlap');
    await pool.query("delete from app.commerce_apple_price_bindings where binding_code='fixture_overlap'");
  });

  it('retains immutable, tenant-isolated Apple receipt facts through account erasure without private map data', async () => {
    await withCommercePlannerDatabase(pool, plannerId, client => client.query(`insert into app.commerce_apple_transaction_receipts(
      planner_id,subscription_id,binding_code,provider_environment,original_transaction_reference,
      transaction_reference,price_milliunits,currency_code,purchased_at,paid_through,signed_at,proof_sha256)
      values(app.current_planner_id(),$1,'fixture_annual','production','700000000001',
        '700000000002',99990,'USD',now()-interval '1 day',now()+interval '364 days',now(),$2)`, [subscriptionId, Buffer.alloc(32, 1)]));
    await expect(withCommercePlannerDatabase(pool, plannerId, client => client.query(
      'update app.commerce_apple_transaction_receipts set price_milliunits=1'))).rejects.toMatchObject({ code: '42501' });
    const other = (await pool.query("insert into app.planners(display_name,locale,time_zone) values('Other fixture','en','UTC') returning id::text")).rows[0].id;
    expect((await withCommercePlannerDatabase(pool, other, client => client.query('select * from app.commerce_apple_transaction_receipts'))).rows).toEqual([]);
    const job = await withPlannerDatabase(pool, plannerId, async client => (await client.query(
      'select app.request_account_deletion($1) as id', [Buffer.alloc(32, 2)])).rows[0].id);
    const lease = (await pool.query('select app.claim_account_deletion($1) as job', [job])).rows[0].job;
    expect((await pool.query('select app.finish_account_deletion($1,$2,true) as done', [job, lease.leaseToken])).rows[0].done).toBe(true);
    expect((await pool.query('select * from app.commerce_apple_transaction_receipts')).rows).toEqual([]);
    const retained = (await pool.query('select records from app.closed_account_payment_records where deletion_public_id=$1', [job])).rows[0].records;
    expect(retained.appleReceipts).toEqual(expect.arrayContaining([expect.objectContaining({
      transaction_reference: '700000000002', price_milliunits: 99990, currency_code: 'USD',
    })]));
    expect(JSON.stringify(retained)).not.toMatch(/Apple clock fixture|planner_id|subscription_id|signedTransaction/);
  });
});

describe('Apple currency conversion uses exact integer units', () => {
  it('handles zero-, two- and three-decimal currencies and rejects unsafe precision', () => {
    expect(minorToAppleMilliunits('9999', 2)).toBe(99990);
    expect(minorToAppleMilliunits('15000', 0)).toBe(15000000);
    expect(minorToAppleMilliunits('12345', 3)).toBe(12345);
    for (const [amount, exponent] of [['1.5', 2], ['0', 2], ['100', 4], ['9007199254740991', 0]] as const) {
      expect(() => minorToAppleMilliunits(amount, exponent)).toThrow();
    }
  });
});
