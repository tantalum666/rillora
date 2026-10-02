import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { runMigrations } from '../src/migrate.js';
import { withCommercePlannerDatabase, type DatabasePool } from '../src/db.js';
import { ApplePurchasePreflight } from '../src/apple-purchase-preflight.js';
import { applePurchaseTerms } from '../src/apple-purchase-consent.js';
import { assertNoForeignPurchase } from '../src/commerce-purchase-conflicts.js';

const databaseUrl = dedicatedTestDatabaseUrl('postgresql://127.0.0.1:5432/continuity_apple_purchase_test', 'continuity_apple_purchase_test');
let pool:DatabasePool, purchases:ApplePurchasePreflight, plannerId:string, plannerPublicId:string;
const selection={serviceMarketCode:'GLOBAL_US',storefrontCountryCode:'USA'};
const consent={...applePurchaseTerms,acceptedSubscriptionTerms:true,acceptedAnnualRenewal:true,acknowledgedCancellation:true} as const;
const input=async()=>({plannerId,plannerPublicId,nonce:randomUUID(),quote:(await purchases.quote(plannerId,selection)).quote,consent});
const reserveWeb=()=>withCommercePlannerDatabase(pool,plannerId,async client=>{
  await client.query("select pg_advisory_xact_lock(hashtextextended('checkout:'||app.current_planner_id()::text,0))");
  await assertNoForeignPurchase(client,'stripe');
});

describe('ordinary Apple purchase preflight with a local, synthetic catalog',()=>{
  beforeAll(async()=>{
    const admin=new pg.Client({connectionString:new URL('/postgres', databaseUrl).href});await admin.connect();
    try{if(!(await admin.query("select 1 from pg_database where datname='continuity_apple_purchase_test'")).rowCount)await admin.query('create database continuity_apple_purchase_test');}
    finally{await admin.end();}
    await assertDedicatedTestDatabase(databaseUrl, 'continuity_apple_purchase_test');
    await runMigrations(databaseUrl);pool=new pg.Pool({connectionString:databaseUrl,max:4});purchases=new ApplePurchasePreflight(pool);
    await pool.query('truncate app.commerce_provider_event_inbox,app.planners restart identity cascade');
    await pool.query('delete from app.commerce_apple_price_bindings');
    await pool.query("delete from app.commerce_storefront_products where provider_code='storekit' and provider_environment='production'");
    await pool.query("delete from app.commerce_prices where price_code='family_apple_purchase_fixture'");
    await pool.query(`insert into app.commerce_prices(price_code,plan_version_id,operator_code,service_market_code,amount_minor,
      minor_unit_exponent,currency_code,billing_interval,tax_behavior,status,purchase_channel)
      select 'family_apple_purchase_fixture',plan_version_id,operator_code,service_market_code,9999,2,'USD','annual',
      'provider_determined','active','apple_app_store' from app.commerce_prices where price_code='family_usd_annual_v4'`);
    await pool.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,product_reference,storefront_country_code,effective_from,status)
      select 'purchase_fixture',id,'com.rillora.family.annual','USA','2020-01-01','active' from app.commerce_prices where price_code='family_apple_purchase_fixture'`);
    await pool.query(`insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,
      external_product_reference,provider_account_reference,external_parent_product_reference,status)
      select id,'storekit','production','com.rillora.family.annual','com.rillora.ios','22325627','active'
      from app.commerce_prices where price_code='family_apple_purchase_fixture'`);
  });
  beforeEach(async()=>{
    await pool.query('truncate app.commerce_provider_event_inbox,app.planners restart identity cascade');
    const row=(await pool.query("insert into app.planners(display_name,locale,time_zone,residence_country_code) values('Purchase fixture','en','UTC','US') returning id::text,public_id::text")).rows[0];
    plannerId=row.id;plannerPublicId=row.public_id;
    await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2)",[plannerId]);
    await pool.query("update app.commerce_operating_planes set status='active' where code='global'");
    await pool.query("update app.commerce_operators set status='active',effective_from=null,effective_to=null where operating_plane_code='global'");
    await pool.query("update app.commerce_market_policies set sales_enabled=true,status='active' where service_market_code='GLOBAL_US'");
    await pool.query("update app.commerce_storefront_policies set status='active',planned_route='apple_storekit' where client_surface='ios' and apple_storefront_country_code='USA'");
    await pool.query("update app.commerce_purchase_route_policies set enabled=true,status='active',provider_code='storekit',purchase_route='apple_storekit' where policy_code='global_us_ios_stripe_v1'");
    await pool.query("update app.commerce_plan_versions set status='active' where plan_code='family' and version=2");
    await pool.query("update app.commerce_plan_capabilities set enforcement_mode='included' where plan_version_id in(select id from app.commerce_plan_versions where plan_code='family' and version=2)");
    await pool.query("update app.commerce_runtime_policy set production_entitlements_enabled=true");
  });
  afterAll(async()=>{await pool?.end();});

  it('quotes the reviewed Apple price without writing a profile, creating an account or changing Web88.99',async()=>{
    const result=await purchases.quote(plannerId,selection);
    expect(result.quote).toMatchObject({amountMinor:9999,priceMilliunits:99990,currency:'USD',productId:'com.rillora.family.annual'});
    expect((await pool.query('select * from app.commerce_accounts')).rows).toEqual([]);
    expect((await pool.query("select amount_minor::int from app.commerce_prices where price_code='family_usd_annual_v4'")).rows[0].amount_minor).toBe(8899);
  });
  it('fails closed for a closed market, unapproved storefront and missing production execution',async()=>{
    await expect(purchases.quote(plannerId,{...selection,storefrontCountryCode:'HKG'})).rejects.toMatchObject({code:'apple_purchase_unavailable'});
    await pool.query("update app.commerce_market_policies set sales_enabled=false where service_market_code='GLOBAL_US'");
    await expect(purchases.quote(plannerId,selection)).rejects.toMatchObject({code:'apple_purchase_unavailable'});
    await pool.query("update app.commerce_market_policies set sales_enabled=true where service_market_code='GLOBAL_US'");
    await pool.query('update app.commerce_runtime_policy set production_entitlements_enabled=false');
    await expect(purchases.quote(plannerId,selection)).rejects.toMatchObject({code:'apple_purchase_unavailable'});
  });
  it('requires the exact current quote and a separate unchecked-to-accepted subscription proof',async()=>{
    const prepared=await input();
    await expect(purchases.prepare({...prepared,quote:{...prepared.quote,amountMinor:8899}})).rejects.toMatchObject({code:'purchase_terms_changed'});
    await expect(purchases.prepare({...prepared,consent:{...consent,acceptedAnnualRenewal:false} as unknown as typeof consent})).rejects.toThrow();
    expect((await pool.query('select * from app.commerce_orders')).rows).toEqual([]);
    const result=await purchases.prepare(prepared);
    expect(result).toMatchObject({state:'prepared',appAccountToken:plannerPublicId,grantsAccess:false});
    expect((await pool.query('select amount_minor::int,consent_version from app.commerce_purchase_consents')).rows).toEqual([{amount_minor:9999,consent_version:applePurchaseTerms.version}]);
    expect((await pool.query('select * from app.commerce_entitlement_grants')).rows).toEqual([]);
  });
  it('cannot sell Family when its included live features remain planned',async()=>{
    await pool.query("update app.commerce_plan_capabilities set enforcement_mode='planned' where capability_code='family_maintenance'");
    await expect(purchases.quote(plannerId,selection)).rejects.toMatchObject({code:'billing_closed'});
    expect((await pool.query('select * from app.commerce_orders')).rows).toEqual([]);
  });
  it('does not sell against an expired operating-entity policy',async()=>{
    await pool.query("update app.commerce_operators set effective_from=now()-interval '2 days',effective_to=now()-interval '1 day' where operating_plane_code='global'");
    await expect(purchases.quote(plannerId,selection)).rejects.toMatchObject({code:'apple_purchase_unavailable'});
  });
  it('reuses one prepared order under duplicate requests and serializes competing purchase attempts',async()=>{
    const prepared=await input();
    const [a,b]=await Promise.all([purchases.prepare(prepared),purchases.prepare(prepared)]);
    expect(a.orderReference).toBe(b.orderReference);
    await expect(purchases.prepare({...prepared,nonce:randomUUID()})).rejects.toMatchObject({code:'apple_purchase_in_progress'});
    expect((await pool.query('select count(*)::int as n from app.commerce_orders')).rows[0].n).toBe(1);
  });
  it('blocks Web while an Apple payment can still complete, even after its old quote deadline',async()=>{
    const result=await purchases.prepare(await input());
    await purchases.transition({plannerId,orderReference:result.orderReference,action:'start'});
    await purchases.transition({plannerId,orderReference:result.orderReference,action:'pending'});
    await pool.query("update app.commerce_apple_purchase_sessions set prepared_until=now()-interval '1 day'");
    await expect(reserveWeb()).rejects.toMatchObject({code:'unfinished_checkout'});
    expect((await pool.query('select state from app.commerce_apple_purchase_sessions')).rows[0].state).toBe('pending');
  });
  it('expires only a never-opened quote and permits a fresh purchase after explicit native cancellation',async()=>{
    let result=await purchases.prepare(await input());
    await pool.query("update app.commerce_apple_purchase_sessions set prepared_until=now()-interval '1 second'");
    await reserveWeb();
    expect((await pool.query('select status from app.commerce_orders')).rows[0].status).toBe('canceled');
    result=await purchases.prepare(await input());
    await purchases.transition({plannerId,orderReference:result.orderReference,action:'start'});
    await purchases.transition({plannerId,orderReference:result.orderReference,action:'cancel'});
    await reserveWeb();
    expect((await purchases.prepare(await input())).state).toBe('prepared');
  });
  it('rejects another owner changing the purchase state and rechecks sales when opening the sheet',async()=>{
    const result=await purchases.prepare(await input());
    await expect(purchases.transition({plannerId:'999999',orderReference:result.orderReference,action:'cancel'})).rejects.toMatchObject({status:404});
    await pool.query('update app.commerce_runtime_policy set production_entitlements_enabled=false');
    await expect(purchases.transition({plannerId,orderReference:result.orderReference,action:'start'})).rejects.toMatchObject({code:'apple_purchase_unavailable'});
  });
  it('rechecks a newly locked billing account before the payment sheet or Web checkout can open',async()=>{
    const result=await purchases.prepare(await input());
    await pool.query("update app.commerce_accounts set status='locked' where planner_id=$1",[plannerId]);
    await expect(purchases.transition({plannerId,orderReference:result.orderReference,action:'start'})).rejects.toMatchObject({code:'billing_account_unavailable'});
    await expect(reserveWeb()).rejects.toMatchObject({code:'billing_account_unavailable'});
  });
  it('blocks a known resumable expired Apple subscription on Web, and releases only a verified nonrenewing terminal one',async()=>{
    const result=await purchases.prepare(await input());
    await purchases.transition({plannerId,orderReference:result.orderReference,action:'cancel'});
    await pool.query(`insert into app.commerce_subscriptions(planner_id,commerce_account_id,plan_version_id,plan_code,price_id,
      acquisition_type,renewal_provider,provider_environment,provider_subscription_reference,state,current_period_starts_at,
      current_period_ends_at,provider_observed_at,renewal_is_possible)
      select $1,a.id,p.plan_version_id,'family',p.id,'purchased','storekit','production','700000000090','expired_read_only',
      now()-interval '366 days',now()-interval '1 day',now(),true
      from app.commerce_accounts a cross join app.commerce_prices p where a.planner_id=$1 and p.price_code='family_apple_purchase_fixture'`,[plannerId]);
    await expect(reserveWeb()).rejects.toMatchObject({code:'existing_subscription'});
    await pool.query('update app.commerce_subscriptions set renewal_is_possible=false');
    await reserveWeb();
  });
});
