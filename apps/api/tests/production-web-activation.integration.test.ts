import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import pg from 'pg';
import {assertDedicatedTestDatabase,dedicatedTestDatabaseUrl} from './dedicated-test-database.js';
import {runMigrations} from '../src/migrate.js';
import {configureProductionWebBilling} from '../src/configure-production-web-billing.js';

const name='continuity_web_activation_test';
const url=dedicatedTestDatabaseUrl('postgresql://127.0.0.1:5432/continuity_web_activation_test',name);
let client:pg.Client;
describe('bounded Web catalog activation in an isolated local database',()=>{
 beforeAll(async()=>{
  const admin=new pg.Client({connectionString:new URL('/postgres',url).href});await admin.connect();
  try{if(!(await admin.query('select 1 from pg_database where datname=$1',[name])).rowCount)await admin.query('create database continuity_web_activation_test');}
  finally{await admin.end();}
  await assertDedicatedTestDatabase(url,name);await runMigrations(url);
  client=new pg.Client({connectionString:url});await client.connect();
  await client.query(`insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,
   external_product_reference,status,provider_account_reference,external_parent_product_reference)
   select id,'stripe','production','price_activation_fixture','test_only','acct_1U6B2RCxTlowhyiG','prod_activation_fixture'
   from app.commerce_prices where price_code='family_usd_annual_v4'
   on conflict(provider_code,provider_environment,external_product_reference) do nothing`);
 });
 afterAll(async()=>{await client?.end();});
 it('inspects without writes and rejects stale state before any policy mutation',async()=>{
  const before=await configureProductionWebBilling(client,'inspect');
  expect(before.before).toEqual(before.after);
  await expect(configureProductionWebBilling(client,'activate','0'.repeat(64))).rejects.toThrow('changed after inspection');
  await expect(configureProductionWebBilling(client,'activate')).rejects.toThrow('fingerprint');
  expect((await configureProductionWebBilling(client,'inspect')).after.sha256).toBe(before.after.sha256);
 });
 it('opens only the current annual Web route, preserves every other price/channel and creates no orders',async()=>{
  const baseline=await client.query("select * from app.commerce_prices where price_code<>'family_usd_annual_v4' order by id");
  const apple=await client.query("select * from app.commerce_storefront_policies where client_surface='ios' order by id");
  const future=await client.query(`select * from app.commerce_plan_capabilities where capability_code not in
   ('family_maintenance','trusted_people_multiple') order by plan_version_id,capability_code`);
  const inspected=await configureProductionWebBilling(client,'inspect');
  const opened=await configureProductionWebBilling(client,'activate',inspected.after.sha256);
  expect(opened.after.data.price).toMatchObject({amount_minor:'8899',currency_code:'USD',billing_interval:'annual',status:'active',tax_behavior:'provider_determined'});
  expect(opened.after.data.market.sales_enabled).toBe(true);expect(opened.after.data.route.enabled).toBe(true);
  expect(opened.after.data.runtime).toMatchObject({production_entitlements_enabled:true,sharing_limits_enabled:true});
  expect((await client.query("select * from app.commerce_prices where price_code<>'family_usd_annual_v4' order by id")).rows).toEqual(baseline.rows);
  expect((await client.query("select * from app.commerce_storefront_policies where client_surface='ios' order by id")).rows).toEqual(apple.rows);
  expect((await client.query(`select * from app.commerce_plan_capabilities where capability_code not in
   ('family_maintenance','trusted_people_multiple') order by plan_version_id,capability_code`)).rows).toEqual(future.rows);
  expect((await client.query('select count(*)::int as n from app.commerce_orders')).rows[0].n).toBe(0);
 });
 it('closing new sales never disables processing or existing production entitlements',async()=>{
  const before=await configureProductionWebBilling(client,'inspect');
  const closed=await configureProductionWebBilling(client,'close-new-sales',before.after.sha256);
  expect(closed.after.data.market.sales_enabled).toBe(false);expect(closed.after.data.route.enabled).toBe(false);
  expect(closed.after.data.runtime).toEqual(before.after.data.runtime);
  expect(closed.after.data.price).toEqual(before.after.data.price);
  expect(closed.historicalAccessRevoked).toBe(false);
 });
 it('refuses retired bindings atomically rather than reviving an old provider price',async()=>{
  await client.query("update app.commerce_purchase_route_policies set status='retired' where policy_code='global_us_web_stripe_v1'");
  const before=await configureProductionWebBilling(client,'inspect');
  await expect(configureProductionWebBilling(client,'activate',before.after.sha256)).rejects.toThrow('Retired policy');
  expect((await configureProductionWebBilling(client,'inspect')).after.sha256).toBe(before.after.sha256);
  await client.query("update app.commerce_purchase_route_policies set status='active' where policy_code='global_us_web_stripe_v1'");
 });
});
