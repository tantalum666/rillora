import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { Environment, Status, Type, InAppOwnershipType, type JWSTransactionDecodedPayload, type JWSRenewalInfoDecodedPayload } from '@apple/app-store-server-library';
import { runMigrations } from '../src/migrate.js';
import { type DatabasePool, withPlannerDatabase, withCommercePlannerDatabase } from '../src/db.js';
import { appleReviewContext, appleProductionContext } from '../src/apple-execution-context.js';
import { AppleProductionVerification, rilloraAppleIdentity as identity } from '../src/apple-production-verification.js';
import { AppleProductionSnapshotAdapter } from '../src/apple-production-server-api.js';
import { AppleProductionIntake } from '../src/apple-production-intake.js';
import { AppleProductionInbox } from '../src/apple-production-inbox.js';
import { loadAppleProductionPriceBindings } from '../src/apple-price-catalog.js';
import { ApplePurchasePreflight } from '../src/apple-purchase-preflight.js';
import { assertNoForeignPurchase } from '../src/commerce-purchase-conflicts.js';
import { applePurchaseTerms } from '../src/apple-purchase-consent.js';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import request from './http-fixture.js';

const databaseUrl = dedicatedTestDatabaseUrl('postgresql://127.0.0.1:5432/continuity_apple_review_test', 'continuity_apple_review_test');
let pool:DatabasePool, plannerId:string, plannerPublicId:string, account:string;
let purchases:ApplePurchasePreflight;
const selection={serviceMarketCode:'GLOBAL_US',storefrontCountryCode:'USA'};
const consent={...applePurchaseTerms,acceptedSubscriptionTerms:true,acceptedAnnualRenewal:true,acknowledgedCancellation:true} as const;
async function prepare() {
  return purchases.prepare({plannerId,plannerPublicId,nonce:randomUUID(),quote:(await purchases.quote(plannerId,selection)).quote,consent});
}
async function fixture() {
  const now=Date.now()-100;
  const tx:JWSTransactionDecodedPayload={environment:Environment.SANDBOX,bundleId:identity.bundleId,
    subscriptionGroupIdentifier:identity.subscriptionGroupId,productId:identity.annualProductId,storefront:'USA',
    type:Type.AUTO_RENEWABLE_SUBSCRIPTION,quantity:1,inAppOwnershipType:InAppOwnershipType.PURCHASED,
    originalTransactionId:'900000000001',transactionId:'900000000001',appAccountToken:plannerPublicId,
    purchaseDate:now,expiresDate:now+3600000,signedDate:now,currency:'USD',price:99990};
  const renewal:JWSRenewalInfoDecodedPayload={environment:Environment.SANDBOX,originalTransactionId:tx.originalTransactionId!,
    productId:tx.productId!,autoRenewProductId:tx.productId!,autoRenewStatus:1,appAccountToken:plannerPublicId,signedDate:now};
  const item={status:Status.ACTIVE,originalTransactionId:tx.originalTransactionId!,signedTransactionInfo:'status.tx',signedRenewalInfo:'status.renewal'};
  const source={verifyAndDecodeTransaction:async()=>structuredClone(tx),verifyAndDecodeRenewalInfo:async()=>structuredClone(renewal),
    verifyAndDecodeNotification:async()=>({notificationUUID:randomUUID(),notificationType:'DID_RENEW',signedDate:now,
      data:{environment:Environment.SANDBOX,bundleId:identity.bundleId,signedTransactionInfo:'status.tx',signedRenewalInfo:'status.renewal'}})};
  const verifier=new AppleProductionVerification(source,new Set(['USA']),appleReviewContext);
  const api={getAllSubscriptionStatuses:vi.fn(async()=>({environment:Environment.SANDBOX,bundleId:identity.bundleId,
    data:[{subscriptionGroupIdentifier:identity.subscriptionGroupId,lastTransactions:[item]}]}))};
  const snapshot=new AppleProductionSnapshotAdapter(api,verifier,await loadAppleProductionPriceBindings(pool,appleReviewContext));
  const intake=new AppleProductionIntake(pool,verifier,snapshot,appleReviewContext);
  return {tx,renewal,item,source,verifier,api,intake,input:{plannerId,plannerPublicId,signedTransaction:'synthetic.review.transaction'}};
}

describe('enrolled Apple review purchases share the strict lifecycle without production sales',()=>{
  beforeAll(async()=>{
    const admin=new pg.Client({connectionString:new URL('/postgres', databaseUrl).href});await admin.connect();
    try{if(!(await admin.query("select 1 from pg_database where datname='continuity_apple_review_test'")).rowCount)await admin.query('create database continuity_apple_review_test');}
    finally{await admin.end();}
    await assertDedicatedTestDatabase(databaseUrl, 'continuity_apple_review_test');
    await runMigrations(databaseUrl);pool=new pg.Pool({connectionString:databaseUrl,max:4});
    purchases=new ApplePurchasePreflight(pool,appleReviewContext);
    await pool.query('truncate app.commerce_provider_event_inbox,app.planners restart identity cascade');
    await pool.query("delete from app.commerce_apple_price_bindings where binding_code='review_fixture'");
    await pool.query("delete from app.commerce_storefront_products where price_id in(select id from app.commerce_prices where price_code='family_apple_review_fixture')");
    await pool.query("delete from app.commerce_prices where price_code='family_apple_review_fixture'");
    await pool.query(`insert into app.commerce_prices(price_code,plan_version_id,operator_code,service_market_code,amount_minor,
      minor_unit_exponent,currency_code,billing_interval,tax_behavior,status,purchase_channel)
      select 'family_apple_review_fixture',plan_version_id,operator_code,service_market_code,9999,2,'USD','annual',
      'provider_determined','test_only','apple_app_store' from app.commerce_prices where price_code='family_usd_annual_v4'`);
    await pool.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,product_reference,storefront_country_code,effective_from,status,provider_environment)
      select 'review_fixture',id,'com.rillora.family.annual','USA','2020-01-01','active','sandbox' from app.commerce_prices where price_code='family_apple_review_fixture'`);
    await pool.query(`insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,external_product_reference,
      provider_account_reference,external_parent_product_reference,status)
      select id,'storekit','sandbox','com.rillora.family.annual','com.rillora.ios','22325627','test_only'
      from app.commerce_prices where price_code='family_usd_annual_v1'
      on conflict(provider_code,provider_environment,external_product_reference) do nothing`);
    await pool.query("update app.commerce_plan_versions set status='active' where plan_code='family' and version=2");
    await pool.query("update app.commerce_plan_capabilities set enforcement_mode='included' where plan_version_id in(select id from app.commerce_plan_versions where plan_code='family' and version=2)");
    await pool.query("update app.commerce_purchase_route_policies set status='test_only',enabled=true,provider_code='storekit',purchase_route='apple_storekit' where policy_code='global_us_ios_stripe_v1'");
  });
  beforeEach(async()=>{
    await pool.query('truncate app.commerce_provider_event_inbox,app.planners restart identity cascade');
    await pool.query('update app.commerce_runtime_policy set production_entitlements_enabled=false');
    const p=(await pool.query("insert into app.planners(display_name,locale,time_zone,residence_country_code) values('Review fixture','en','UTC','US') returning id::text,public_id::text")).rows[0];
    plannerId=p.id;plannerPublicId=p.public_id;
    await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2)",[plannerId]);
    account=(await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code,status)
      select $1,id,'global','GLOBAL_US','active' from app.plans where planner_id=$1 returning public_id::text`,[plannerId])).rows[0].public_id;
    await pool.query("insert into app.commerce_validation_accounts values($1,now()+interval '1 hour','Isolated Apple review fixture')",[plannerId]);
  });
  afterAll(async()=>{await pool?.end();});
  it('prepares only an explicit Sandbox offer while production sales and Web88.99 remain unchanged',async()=>{
    const quote=await purchases.quote(plannerId,selection);
    expect(quote).toMatchObject({environment:'sandbox',validationOnly:true,quote:{amountMinor:9999}});
    // A SKU survives repricing. Its old mapping and receipt history stay intact;
    // the modern versioned Sandbox binding owns this exact reviewed amount.
    expect((await pool.query(`select p.price_code from app.commerce_storefront_products product
      join app.commerce_prices p on p.id=product.price_id where product.provider_code='storekit'
      and product.provider_environment='sandbox' and product.external_product_reference='com.rillora.family.annual'`)).rows[0].price_code).toBe('family_usd_annual_v1');
    expect(await prepare()).toMatchObject({environment:'sandbox',validationOnly:true,grantsAccess:false});
    expect((await pool.query('select provider_environment from app.commerce_orders')).rows).toEqual([{provider_environment:'sandbox'}]);
    expect((await pool.query('select * from app.commerce_entitlement_grants')).rows).toEqual([]);
    await expect(new ApplePurchasePreflight(pool).quote(plannerId,selection)).rejects.toMatchObject({code:'apple_purchase_unavailable'});
    expect((await pool.query("select amount_minor::int from app.commerce_prices where price_code='family_usd_annual_v4'")).rows[0].amount_minor).toBe(8899);
  });
  it('atomically reconciles the prepared test purchase; a duplicate restore re-fetches a later refund',async()=>{
    const order=await prepare();const f=await fixture();
    await purchases.transition({plannerId,orderReference:order.orderReference,action:'start'});
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    expect((await pool.query('select provider_environment,status from app.commerce_orders')).rows).toEqual([{provider_environment:'sandbox',status:'paid_reconciled'}]);
    expect((await pool.query('select provider_environment from app.commerce_apple_transaction_receipts')).rows).toEqual([{provider_environment:'sandbox'}]);
    expect((await pool.query('select provider_environment from app.commerce_apple_subscription_observations')).rows).toEqual([{provider_environment:'sandbox'}]);
    f.item.status=Status.REVOKED;f.tx.revocationDate=Date.now();f.tx.signedDate=Date.now();f.renewal.signedDate=Date.now();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    expect(f.api.getAllSubscriptionStatuses).toHaveBeenCalledTimes(2);
    expect((await pool.query('select count(*)::int n from app.commerce_entitlement_grants where revoked_at is null')).rows[0].n).toBe(0);
  });
  it('denies unenrolled/expired accounts before any receipt lookup or order mutation',async()=>{
    const f=await fixture();await pool.query("update app.commerce_validation_accounts set expires_at=now()-interval '1 second'");
    await expect(prepare()).rejects.toMatchObject({code:'apple_review_not_enrolled'});
    await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({code:'apple_review_not_enrolled'});
    expect(f.api.getAllSubscriptionStatuses).not.toHaveBeenCalled();
    await pool.query('delete from app.commerce_validation_accounts');
    await expect(purchases.current(plannerId)).rejects.toMatchObject({code:'apple_review_not_enrolled'});
  });
  it('rejects production customers even if someone also enrolled them for testing',async()=>{
    await pool.query(`insert into app.commerce_orders(planner_id,commerce_account_id,operator_code,price_id,
      purchase_route_policy_code,purchase_route_policy_version,provider_code,provider_environment,amount_minor,currency_code,status)
      select $1,a.id,p.operator_code,p.id,'global_us_ios_stripe_v1',1,'storekit','production',9999,'USD','canceled'
      from app.commerce_accounts a cross join app.commerce_prices p where a.public_id=$2 and p.price_code='family_apple_review_fixture'`,[plannerId,account]);
    await expect(prepare()).rejects.toMatchObject({code:'apple_review_not_enrolled'});
  });
  it('prevents enrolled or historical test identities from starting real Web or Apple payments',async()=>{
    const attempt=(provider:'stripe'|'storekit')=>withCommercePlannerDatabase(pool,plannerId,
      c=>assertNoForeignPurchase(c,provider));
    for(const provider of ['stripe','storekit'] as const) await expect(attempt(provider)).rejects.toMatchObject({code:'test_account_real_purchase_blocked'});
    await prepare();
    await pool.query("update app.commerce_validation_accounts set expires_at=now()-interval '1 second'");
    for(const provider of ['stripe','storekit'] as const) await expect(attempt(provider)).rejects.toMatchObject({code:'test_account_real_purchase_blocked'});
  });

  it('never sends Sandbox to the production verifier, or Production/Xcode to the review verifier',async()=>{
    const f=await fixture();const production=new AppleProductionVerification(f.source,new Set(['USA']),appleProductionContext);
    await expect(production.verifyClientTransaction({signedTransaction:'fixture',expectedAppAccountToken:plannerPublicId})).rejects.toThrow();
    for(const environment of [Environment.PRODUCTION,Environment.XCODE]) {
      f.tx.environment=environment;await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({code:'apple_transaction_rejected'});
    }
    expect(f.api.getAllSubscriptionStatuses).not.toHaveBeenCalled();
  });
  it('keeps modern review delivery isolated from production workers and the legacy Sandbox harness',async()=>{
    const f=await fixture();await f.intake.acceptNotification('review.notification');
    expect(await new AppleProductionInbox(pool).claim()).toBeNull();
    await pool.query("update app.commerce_provider_event_inbox set apple_intake_version=null");
    expect(await f.intake.retryPending()).toMatchObject({attempted:0,pending:0});
    await pool.query("update app.commerce_provider_event_inbox set apple_intake_version='verified-status-v1'");
    expect(await f.intake.retryPending()).toMatchObject({applied:1});
  });
  it('rechecks enrollment at commit, and never finishes when eligibility expires during provider retrieval',async()=>{
    const f=await fixture();const original=f.api.getAllSubscriptionStatuses.getMockImplementation()!;
    f.api.getAllSubscriptionStatuses.mockImplementationOnce(async()=>{
      await pool.query("update app.commerce_validation_accounts set expires_at=now()-interval '1 second'");return original();
    });
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:false});
    expect((await pool.query('select * from app.commerce_apple_transaction_receipts')).rows).toEqual([]);
    expect((await pool.query('select * from app.commerce_subscriptions')).rows).toEqual([]);
  });
  it('expires test access at read time without waiting for another Apple notification',async()=>{
    const f=await fixture();expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    const effective=()=>withPlannerDatabase(pool,plannerId,async c=>(await c.query(
      'select app.commerce_subscription_effective(id) as enabled from app.commerce_subscriptions')).rows[0].enabled);
    expect(await effective()).toBe(true);
    await pool.query("update app.commerce_validation_accounts set expires_at=statement_timestamp()-interval '1 second'");
    expect(await effective()).toBe(false);
    expect((await pool.query("select count(*)::int n from app.commerce_subscriptions where provider_environment='production'")).rows[0].n).toBe(0);
  });
  it('leaves a locked account and unsupported signed ownership without a receipt or grant',async()=>{
    const f=await fixture();f.tx.quantity=2;
    await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({code:'apple_transaction_rejected'});
    f.tx.quantity=1;await pool.query("update app.commerce_accounts set status='locked'");
    await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({code:'apple_account_not_bound'});
    expect(f.api.getAllSubscriptionStatuses).not.toHaveBeenCalled();
    expect((await pool.query('select * from app.commerce_apple_transaction_receipts')).rows).toEqual([]);
  });

  it('does not allow a review route to transition a production order or reuse its nonce',async()=>{
    const prepared=await prepare();
    await expect(new ApplePurchasePreflight(pool).transition({plannerId,orderReference:prepared.orderReference,action:'start'})).rejects.toMatchObject({code:'purchase_not_found'});
    const nonce=(await pool.query('select client_nonce from app.commerce_apple_purchase_sessions')).rows[0].client_nonce;
    const quote=(await purchases.quote(plannerId,selection)).quote;
    await expect(new ApplePurchasePreflight(pool).prepare({plannerId,plannerPublicId,nonce,quote,consent})).rejects.toMatchObject({code:'purchase_terms_changed'});
  });
  it('uses a distinct review response contract, requires authentication, and remains absent by default',async()=>{
    const f=await fixture();const base=loadConfig({NODE_ENV:'test',DATABASE_URL:databaseUrl,ALLOW_DEV_AUTH:'true'});
    const app=createApp(pool,{...base,appleReview:{secretArn:'fixture',rootCertificateDirectory:'fixture'}},{appleReviewIntake:f.intake});
    const path='/api/v1/commerce/storekit/review/transactions';
    await request(app).post(path).send({signedTransaction:f.input.signedTransaction}).expect(401);
    const result=await request(app).post(path).set('x-dev-planner-id',plannerPublicId).send({signedTransaction:f.input.signedTransaction}).expect(200);
    expect(result.body).toMatchObject({contractVersion:'commerce-apple-review-v1',environment:'sandbox',validationOnly:true,result:{finishAuthorized:true}});
    await request(createApp(pool,base)).post(path).set('x-dev-planner-id',plannerPublicId).send({signedTransaction:f.input.signedTransaction}).expect(404);
    expect(()=>createApp(pool,{...base,appleProduction:{secretArn:'fixture',rootCertificateDirectory:'fixture'}},{appleProductionIntake:f.intake})).toThrow();
  });
});
