import {randomUUID} from 'node:crypto';
import {beforeAll,beforeEach,afterAll,describe,it,expect,vi} from 'vitest';
import {loadConfig} from '../src/config.js';
import {createPool,withCommercePlannerDatabase} from '../src/db.js';
import {runMigrations} from '../src/migrate.js';
import {seedDevelopmentFixture,developmentPlannerPublicId} from '../src/seed-dev.js';
import {configureRecoveryPool,type RecoveryControl} from '../src/recovery-journal.js';
import {replayRecoveryControls} from '../src/recovery-replay.js';
import {reconcileRecoveryCommerce} from '../src/recovery-commerce.js';
import type {RecoveryProviderObservation} from '../src/recovery-commerce-readers.js';
const url='postgresql:///rillora_commerce_recovery_test';
const pool=createPool(loadConfig({NODE_ENV:'test',DATABASE_URL:url}));
let owner:string,account:string,subscription:string,generation:string,event:RecoveryControl;
const journal=new Map<string,RecoveryControl>();
async function observation(state:'active'|'refunded'|'expired_read_only'='refunded'):Promise<RecoveryProviderObservation>{
 return {snapshot:{provider:'stripe',providerEnvironment:'production',providerSubscriptionReference:'sub_recovery_fixture',commerceAccountReference:account,
  providerCustomerReference:'cus_recovery_fixture',planCode:'family',priceCode:'family_usd_annual_v4',state,observedAt:new Date().toISOString(),
  currentPeriodStartsAt:new Date(Date.now()-86400000).toISOString(),currentPeriodEndsAt:new Date(Date.now()+(state==='expired_read_only'?-1000:86400000)).toISOString(),
  cancelAtPeriodEnd:false,providerInvoiceReference:'in_recovery_fixture',renewalIsPossible:state!=='expired_read_only',source:'stripe_api'},
  financialOverride:state==='refunded'?'refunded':null,disputeResolved:false,
  stripePrice:{id:'price_recovery_fixture',priceCode:'family_usd_annual_v4',amountMinor:8899,currency:'usd',interval:'year',planVersion:2},stripeProduct:'prod_recovery_fixture'};
}
async function simulateOlderBackup(){
 const c=await pool.connect();try{
  await c.query('begin');await c.query("select set_config('app.recovery_replay','true',true)");
  await c.query("update app.commerce_subscriptions set state='active',provider_observed_at=now()-interval '1 hour',financial_state_override=null where id=$1",[subscription]);
  await c.query('update app.commerce_entitlement_grants set revoked_at=null where subscription_id=$1',[subscription]);
  await c.query('delete from app.recovery_controls');await c.query('commit');
 }finally{c.release();}
}
describe.sequential('Current provider reconciliation in an isolated restored database',()=>{
 beforeAll(async()=>{await runMigrations(url);});
 beforeEach(async()=>{
  await pool.query('update app.recovery_policy set enforced=false');await pool.query('truncate app.planners,app.recovery_controls cascade');journal.clear();
  await seedDevelopmentFixture(pool);
  owner=(await pool.query('select id::text from app.planners where public_id=$1',[developmentPlannerPublicId])).rows[0].id;
  generation=(await pool.query('select generation from app.recovery_policy')).rows[0].generation;
  account=(await pool.query("insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code,status) select $1,id,'global','GLOBAL_US','active' from app.plans where planner_id=$1 returning public_id",[owner])).rows[0].public_id;
  await pool.query("update app.commerce_prices set status='active' where price_code='family_usd_annual_v4'");
  await pool.query("update app.commerce_plan_versions set status='active' where plan_code='family' and version=2");
  await pool.query("update app.commerce_plan_capabilities set enforcement_mode='included' where plan_version_id in(select id from app.commerce_plan_versions where plan_code='family' and version=2)");
  await pool.query('update app.commerce_runtime_policy set production_entitlements_enabled=true');
  await pool.query(`insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,external_product_reference,provider_account_reference,external_parent_product_reference,status)
   select id,'stripe','production','price_recovery_fixture','acct_1U6B2RCxTlowhyiG','prod_recovery_fixture','active' from app.commerce_prices where price_code='family_usd_annual_v4'
   on conflict(provider_code,provider_environment,external_product_reference) do nothing`);
  await pool.query(`insert into app.commerce_provider_customers(planner_id,commerce_account_id,provider_code,provider_environment,provider_customer_reference,status)
   select $1,id,'stripe','production','cus_recovery_fixture','active' from app.commerce_accounts where public_id=$2`,[owner,account]);
  subscription=(await pool.query(`insert into app.commerce_subscriptions(planner_id,commerce_account_id,plan_version_id,plan_code,price_id,acquisition_type,renewal_provider,provider_environment,
   provider_subscription_reference,state,current_period_starts_at,current_period_ends_at,provider_observed_at,provider_invoice_reference)
   select $1,a.id,p.plan_version_id,'family',p.id,'purchased','stripe','production','sub_recovery_fixture','active',now()-interval '1 day',now()+interval '1 day',now()-interval '1 hour','in_recovery_fixture'
   from app.commerce_accounts a cross join app.commerce_prices p where a.public_id=$2 and p.price_code='family_usd_annual_v4' returning id::text`,[owner,account])).rows[0].id;
  await withCommercePlannerDatabase(pool,owner,c=>c.query('select app.apply_verified_subscription_entitlements($1)',[subscription]));
  configureRecoveryPool(pool,{async publish(e){journal.set(e.key,e);}});await pool.query('update app.recovery_policy set enforced=true');
  await withCommercePlannerDatabase(pool,owner,async c=>{
   await c.query("update app.commerce_subscriptions set state='refunded',financial_state_override='refunded',provider_observed_at=now() where id=$1",[subscription]);
   await c.query('select app.apply_verified_subscription_entitlements($1)',[subscription]);
  });
  event=journal.get(`unreconciled_access:${developmentPlannerPublicId}`)!;expect(event.facts).toMatchObject({version:1,manualAccess:false,subscriptions:[{reference:'sub_recovery_fixture',customer:'cus_recovery_fixture'}]});
  await simulateOlderBackup();
 });
 afterAll(async()=>{await pool.end();});
 it('removes the post-snapshot refunded entitlement using a fresh API read, with no fabricated signed webhook or private-map change',async()=>{
  const before=(await pool.query('select public_id,title from app.matter_items order by id')).rows;
  await expect(replayRecoveryControls(pool,[event],generation)).rejects.toThrow('provider reconciliation');
  const reader=vi.fn(async()=>observation());expect(await reconcileRecoveryCommerce(pool,[event],generation,reader)).toMatchObject({reconciledOwners:1,providerReads:1,customerTrafficEnabled:false});
  expect((await pool.query('select count(*)::int n from app.commerce_entitlement_grants where revoked_at is null')).rows[0].n).toBe(0);
  expect((await pool.query('select signature_verified,event_type from app.commerce_provider_events')).rows).toEqual([{signature_verified:false,event_type:'recovery_current_provider_state'}]);
  expect((await pool.query('select public_id,title from app.matter_items order by id')).rows).toEqual(before);
  expect(await reconcileRecoveryCommerce(pool,[event],generation,reader)).toMatchObject({reconciledOwners:0,providerReads:0});expect(reader).toHaveBeenCalledTimes(1);
  await expect(replayRecoveryControls(pool,[event],generation)).resolves.toMatchObject({applied:0});
 });
 it('keeps incomplete, wrong-owner, stale or failed provider evidence quarantined without advancing the journal checkpoint',async()=>{
  for(const reader of [async()=>{throw Error('provider unavailable');},async()=>{const r=await observation();return {...r,snapshot:{...r.snapshot,commerceAccountReference:randomUUID()}};},
   async()=>{const r=await observation();return {...r,snapshot:{...r.snapshot,observedAt:'2000-01-01T00:00:00Z'}};}]){
   await expect(reconcileRecoveryCommerce(pool,[event],generation,reader)).rejects.toThrow();
   expect((await pool.query("select state from app.commerce_subscriptions where id=$1",[subscription])).rows[0].state).toBe('active');
   expect((await pool.query('select count(*)::int n from app.recovery_controls')).rows[0].n).toBe(0);
  }
  await expect(reconcileRecoveryCommerce(pool,[{...event,facts:{}}],generation,async()=>observation())).rejects.toThrow();
  await expect(reconcileRecoveryCommerce(pool,[{...event,facts:{...event.facts,manualAccess:true}}],generation,async()=>observation())).rejects.toThrow();
 });
 it('restores a provider-owned subscription absent from the old snapshot while keeping the same existing owner and customer binding',async()=>{
  const c=await pool.connect();try{await c.query('begin');await c.query("select set_config('app.recovery_replay','true',true)");
   await c.query('delete from app.commerce_accounts where public_id=$1',[account]);await c.query('commit');}finally{c.release();}
  await reconcileRecoveryCommerce(pool,[event],generation,async()=>observation('active'));
  expect((await pool.query('select public_id,planner_id::text from app.commerce_accounts')).rows).toEqual([{public_id:account,planner_id:owner}]);
  expect((await pool.query('select provider_customer_reference from app.commerce_provider_customers')).rows).toEqual([{provider_customer_reference:'cus_recovery_fixture'}]);
  expect((await pool.query('select count(*)::int n from app.commerce_entitlement_grants where revoked_at is null')).rows[0].n).toBe(2);
 });
});
