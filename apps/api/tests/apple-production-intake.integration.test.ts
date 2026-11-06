import { assertDedicatedTestDatabase, dedicatedTestDatabaseUrl } from './dedicated-test-database.js';
import pg from 'pg';
import { randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { Environment, InAppOwnershipType, Status, Type, VerificationException, VerificationStatus, type JWSTransactionDecodedPayload,
  type JWSRenewalInfoDecodedPayload, type ResponseBodyV2DecodedPayload } from '@apple/app-store-server-library';
import { runMigrations } from '../src/migrate.js';
import { type DatabasePool, withCommercePlannerDatabase, withPlannerDatabase } from '../src/db.js';
import { AppleProductionVerification, rilloraAppleIdentity as identity } from '../src/apple-production-verification.js';
import { AppleProductionSnapshotAdapter } from '../src/apple-production-server-api.js';
import { AppleProductionIntake } from '../src/apple-production-intake.js';
import { AppleProductionInbox } from '../src/apple-production-inbox.js';
import { loadAppleProductionPriceBindings } from '../src/apple-price-catalog.js';
import { createApp } from '../src/app.js';
import { loadConfig, type AppConfig } from '../src/config.js';
import request from './http-fixture.js';
import { currentLegalContract } from '../src/legal-contract.js';
import { ApplePurchasePreflight } from '../src/apple-purchase-preflight.js';
import { applePurchaseTerms } from '../src/apple-purchase-consent.js';
import { configureRecoveryPool, type RecoveryControl } from '../src/recovery-journal.js';
import { reconcileRecoveryCommerce } from '../src/recovery-commerce.js';

// Fixed disposable local database; no Owner/provider data or configurable cloud target.
const databaseUrl = dedicatedTestDatabaseUrl('postgresql://127.0.0.1/continuity_apple_delivery_test', 'continuity_apple_delivery_test');
let pool: DatabasePool;
type Owner = { plannerId: string; plannerPublicId: string; account: string };
let owner: Owner;
const day = 86_400_000;

async function addOwner(): Promise<Owner> {
  const p = (await pool.query(`insert into app.planners(display_name,locale,time_zone,residence_country_code)
    values('Apple delivery fixture','en','UTC','US') returning id::text,public_id::text`)).rows[0];
  await pool.query("insert into app.plans(planner_id,status,first_use_state,first_use_step) values($1,'active','completed',2)", [p.id]);
  const a = (await pool.query(`insert into app.commerce_accounts(planner_id,plan_id,operating_plane_code,service_market_code,status)
    select $1,id,'global','GLOBAL_US','active' from app.plans where planner_id=$1 returning public_id::text`, [p.id])).rows[0];
  return { plannerId: p.id, plannerPublicId: p.public_id, account: a.public_id };
}

async function harness(subject = owner, alreadyBound = true) {
  const now = Date.now() - 1000;
  const tx: JWSTransactionDecodedPayload = {
    environment: Environment.PRODUCTION, bundleId: identity.bundleId,
    subscriptionGroupIdentifier: identity.subscriptionGroupId, productId: identity.annualProductId,
    storefront: 'USA', type: Type.AUTO_RENEWABLE_SUBSCRIPTION, quantity: 1,
    inAppOwnershipType: InAppOwnershipType.PURCHASED, originalTransactionId: '700000000001',
    transactionId: '700000000001', appAccountToken: subject.plannerPublicId,
    purchaseDate: now - day, expiresDate: now + 364 * day, signedDate: now,
    currency: 'USD', price: 99990,
  };
  const renewal: JWSRenewalInfoDecodedPayload = { environment: Environment.PRODUCTION,
    originalTransactionId: tx.originalTransactionId!, productId: tx.productId!, autoRenewProductId: tx.productId!,
    autoRenewStatus: 1, appAccountToken: subject.plannerPublicId, signedDate: now };
  if (alreadyBound) await pool.query(`insert into app.commerce_provider_object_links
    (provider_code,provider_environment,provider_object_type,provider_object_reference,commerce_account_reference)
    values('storekit','production','original_transaction',$1,$2) on conflict do nothing`,[tx.originalTransactionId,subject.account]);
  const transactions = new Map<string, JWSTransactionDecodedPayload>([['client.signed.fixture', structuredClone(tx)]]);
  const renewals = new Map<string, JWSRenewalInfoDecodedPayload>();
  const notifications = new Map<string, ResponseBodyV2DecodedPayload>();
  const item = { status: Status.ACTIVE, originalTransactionId: tx.originalTransactionId!, signedTransactionInfo: '', signedRenewalInfo: '' };
  let revision = 0;
  const publish = () => {
    revision++;
    item.signedTransactionInfo = `status.transaction.fixture.${revision}`;
    item.signedRenewalInfo = `status.renewal.fixture.${revision}`;
    transactions.set(item.signedTransactionInfo, structuredClone(tx)); renewals.set(item.signedRenewalInfo, structuredClone(renewal));
  };
  publish();
  const api = { getAllSubscriptionStatuses: vi.fn(async () => ({ environment: Environment.PRODUCTION,
    bundleId: identity.bundleId, appAppleId: identity.appAppleId,
    data: [{ subscriptionGroupIdentifier: identity.subscriptionGroupId, lastTransactions: [item] }] })) };
  const verification = new AppleProductionVerification({
    verifyAndDecodeTransaction: async raw => { const value = transactions.get(raw); if (!value) throw new Error('Rejected fixture'); return value; },
    verifyAndDecodeRenewalInfo: async raw => { const value = renewals.get(raw); if (!value) throw new Error('Rejected fixture'); return value; },
    verifyAndDecodeNotification: async raw => { const value = notifications.get(raw); if (!value) throw new Error('Rejected fixture'); return value; },
  }, new Set(['USA']));
  const snapshot = new AppleProductionSnapshotAdapter(api, verification, await loadAppleProductionPriceBindings(pool));
  const intake = new AppleProductionIntake(pool, verification, snapshot);
  const input = { ...subject, signedTransaction: 'client.signed.fixture' };
  const notice = (type = 'DID_RENEW', uuid = randomUUID()) => {
    const raw = `notification.fixture.${notifications.size}`;
    notifications.set(raw, { notificationUUID: uuid, notificationType: type, signedDate: now,
      data: { environment: Environment.PRODUCTION, bundleId: identity.bundleId, appAppleId: identity.appAppleId,
        signedTransactionInfo: item.signedTransactionInfo, signedRenewalInfo: item.signedRenewalInfo } });
    return raw;
  };
  return { now, tx, renewal, item, api, intake, input, verification, publish, notice, transactions, notifications, snapshot };
}

async function due() {
  await pool.query("update app.commerce_provider_event_inbox set next_attempt_at=now()-interval '1 second'");
}
async function state() {
  return (await pool.query(`select s.state,s.current_period_ends_at,s.renewal_is_possible,
    (select count(*)::int from app.commerce_apple_transaction_receipts) as receipts,
    (select count(*)::int from app.commerce_entitlement_grants where revoked_at is null) as grants
    from app.commerce_subscriptions s limit 1`)).rows[0];
}

async function preparePurchase(subject = owner) {
  await pool.query("update app.commerce_operating_planes set status='active' where code='global'");
  await pool.query("update app.commerce_operators set status='active' where operating_plane_code='global'");
  await pool.query("update app.commerce_market_policies set status='active',sales_enabled=true where service_market_code='GLOBAL_US'");
  await pool.query("update app.commerce_storefront_policies set status='active',planned_route='apple_storekit' where client_surface='ios' and apple_storefront_country_code='USA'");
  await pool.query("update app.commerce_purchase_route_policies set enabled=true,status='active',provider_code='storekit',purchase_route='apple_storekit' where policy_code='global_us_ios_stripe_v1'");
  await pool.query(`insert into app.commerce_storefront_products(price_id,provider_code,provider_environment,external_product_reference,
    provider_account_reference,external_parent_product_reference,status)
    select id,'storekit','production','com.rillora.family.annual','com.rillora.ios','22325627','active'
    from app.commerce_prices where price_code='family_apple_usd_annual_delivery_fixture'
    on conflict(provider_code,provider_environment,external_product_reference) do update set price_id=excluded.price_id,status='active'`);
  const service=new ApplePurchasePreflight(pool);
  const quote=(await service.quote(subject.plannerId,{serviceMarketCode:'GLOBAL_US',storefrontCountryCode:'USA'})).quote;
  const intent=await service.prepare({...subject,nonce:randomUUID(),quote,consent:{...applePurchaseTerms,
    acceptedSubscriptionTerms:true,acceptedAnnualRenewal:true,acknowledgedCancellation:true}});
  return {intent,service};
}

describe('production Apple durable intake (decoded Apple fixtures + real isolated PostgreSQL)', () => {
  beforeAll(async () => {
    const admin = new pg.Client({ connectionString: new URL('/postgres', databaseUrl).href });
    await admin.connect();
    try { if (!(await admin.query("select 1 from pg_database where datname='continuity_apple_delivery_test'")).rowCount) await admin.query('create database continuity_apple_delivery_test'); }
    finally { await admin.end(); }
    await assertDedicatedTestDatabase(databaseUrl, 'continuity_apple_delivery_test');
    await runMigrations(databaseUrl); pool = new pg.Pool({ connectionString: databaseUrl, max: 5 });
    await pool.query('truncate app.commerce_provider_event_inbox,app.planners restart identity cascade');
    await pool.query('delete from app.commerce_apple_price_bindings');
    await pool.query(`delete from app.commerce_storefront_products where provider_code='storekit'
      and provider_environment='production' and price_id in (
        select id from app.commerce_prices where price_code='family_apple_usd_annual_delivery_fixture')`);
    await pool.query("delete from app.commerce_prices where price_code='family_apple_usd_annual_delivery_fixture'");
    await pool.query(`insert into app.commerce_prices(price_code,plan_version_id,operator_code,service_market_code,
      amount_minor,minor_unit_exponent,currency_code,billing_interval,tax_behavior,status,purchase_channel)
      select 'family_apple_usd_annual_delivery_fixture',plan_version_id,operator_code,service_market_code,
        9999,2,'USD','annual','provider_determined','active','apple_app_store'
      from app.commerce_prices where price_code='family_usd_annual_v4'`);
    await pool.query(`insert into app.commerce_apple_price_bindings(binding_code,price_id,product_reference,
      storefront_country_code,effective_from,status) select 'delivery_fixture',id,'com.rillora.family.annual',
        'USA','2020-01-01','active' from app.commerce_prices where price_code='family_apple_usd_annual_delivery_fixture'`);
    await pool.query("update app.commerce_plan_versions set status='active' where plan_code='family' and version=2");
    await pool.query(`update app.commerce_plan_capabilities set enforcement_mode='included'
      where plan_version_id in(select id from app.commerce_plan_versions where plan_code='family' and version=2)`);
  });
  beforeEach(async () => {
    await pool.query('truncate app.commerce_provider_event_inbox,app.planners restart identity cascade');
    await pool.query('update app.commerce_runtime_policy set production_entitlements_enabled=true,sharing_limits_enabled=true');
    owner = await addOwner();
  });
  afterAll(async () => { await pool?.end(); });

  it('resubscribes the same owner after expiry when Apple retains the original and uses the new intent token', async () => {
    const f = await harness();
    f.item.status = Status.EXPIRED;
    f.tx.expiresDate = Date.now() - 1000;
    f.renewal.autoRenewStatus = 0;
    f.transactions.set('client.signed.fixture', structuredClone(f.tx));
    f.publish();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ finishAuthorized: true });
    expect(await state()).toMatchObject({ state: 'expired_read_only', grants: 0, renewal_is_possible: false });

    const { intent, service } = await preparePurchase();
    await service.transition({ plannerId: owner.plannerId, orderReference: intent.orderReference, action: 'start' });
    const now = Date.now();
    f.tx.transactionId = '700000000002';
    f.tx.appAccountToken = intent.appAccountToken;
    f.tx.purchaseDate = now; f.tx.expiresDate = now + 365 * day; f.tx.signedDate = now;
    f.renewal.appAccountToken = intent.appAccountToken; f.renewal.signedDate = now; f.renewal.autoRenewStatus = 1;
    f.item.status = Status.ACTIVE;
    f.transactions.set('client.resubscribe.fixture', structuredClone(f.tx)); f.publish();
    expect(await f.intake.acceptClientTransaction({ ...f.input, signedTransaction: 'client.resubscribe.fixture' }))
      .toMatchObject({ finishAuthorized: true, status: 'applied' });
    expect(await state()).toMatchObject({ state: 'active', receipts: 2, grants: 2 });
    const order = (await pool.query(`select s.state,o.status,s.original_transaction_reference from app.commerce_apple_purchase_sessions s
      join app.commerce_orders o on o.id=s.order_id where o.public_id=$1`, [intent.orderReference])).rows[0];
    expect(order).toMatchObject({ state: 'completed', status: 'paid_reconciled', original_transaction_reference: f.tx.originalTransactionId });
  });

  it('does not attach another accounts fresh intent to an already owned original subscription', async () => {
    const original = owner;
    const f = await harness();
    const other = await addOwner();
    const { intent, service } = await preparePurchase(other);
    await service.transition({ plannerId: other.plannerId, orderReference: intent.orderReference, action: 'start' });
    f.tx.transactionId = '700000000002'; f.tx.appAccountToken = intent.appAccountToken;
    f.tx.purchaseDate = Date.now(); f.tx.signedDate = Date.now();
    f.transactions.set('client.foreign-repurchase.fixture', structuredClone(f.tx));
    await expect(f.intake.acceptClientTransaction({ ...other, signedTransaction: 'client.foreign-repurchase.fixture' }))
      .rejects.toMatchObject({ code: 'apple_account_not_bound' });
    const links = (await pool.query('select commerce_account_reference from app.commerce_provider_object_links')).rows;
    expect(links).toEqual([{ commerce_account_reference: original.account }]);
    expect((await pool.query('select * from app.commerce_entitlement_grants')).rows).toEqual([]);
  });

  it.each(['not-started', 'wrong-price', 'wrong-currency', 'old-receipt', 'wrong-environment'])
    ('keeps exact intent checks for an existing owner: %s', async fault => {
      const f = await harness();
      const { intent, service } = await preparePurchase();
      if (fault !== 'not-started') await service.transition({ plannerId: owner.plannerId, orderReference: intent.orderReference, action: 'start' });
      const receipt = { originalTransactionId: f.tx.originalTransactionId, productId: identity.annualProductId,
        storefront: 'USA', currency: fault === 'wrong-currency' ? 'HKD' : 'USD',
        priceMilliunits: fault === 'wrong-price' ? 100_000 : 99_990,
        purchasedAt: new Date(Date.now() - (fault === 'old-receipt' ? day : 0)).toISOString() };
      const result = await withCommercePlannerDatabase(pool, owner.plannerId, c =>
        c.query('select * from app.resolve_apple_purchase_owner($1,$2,$3,$4::jsonb)',
          [intent.appAccountToken, fault === 'wrong-environment' ? 'sandbox' : 'production', f.tx.originalTransactionId, receipt]));
      expect(result.rows).toEqual([]);
      expect((await pool.query('select original_transaction_reference from app.commerce_apple_purchase_sessions')).rows)
        .toEqual([{ original_transaction_reference: null }]);
    });

  it('does not create first ownership from a signed public planner UUID without a purchase intent', async () => {
    const f = await harness(owner,false);
    await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({code:'apple_account_not_bound'});
    expect(await f.intake.acceptNotification(f.notice())).toMatchObject({status:'needs_mapping'});
    expect((await pool.query('select * from app.commerce_provider_object_links')).rows).toEqual([]);
    expect((await pool.query('select * from app.commerce_entitlement_grants')).rows).toEqual([]);
  });
  it.each(['started','pending'])('migrates only existing %s intents to the former planner token without enabling new unprepared purchases',async state=>{
    const {intent,service}=await preparePurchase();
    await service.transition({plannerId:owner.plannerId,orderReference:intent.orderReference,action:'start'});
    if(state==='pending')await service.transition({plannerId:owner.plannerId,orderReference:intent.orderReference,action:'pending'});
    const c=await pool.connect();
    try {
      await c.query('begin');
      // Recreate these tables' pre-0096 shape within a disposable transaction,
      // then execute the actual new migration bytes rather than a copied fix.
      await c.query(`drop function app.resolve_apple_purchase_owner(uuid,text,text,jsonb);
        drop trigger minimize_closed_apple_receipts on app.closed_account_payment_records;
        drop function app.minimize_closed_apple_receipts();
        drop policy recovery_apple_purchase_metadata on app.commerce_apple_purchase_sessions;
        alter table app.commerce_apple_purchase_sessions drop column app_account_token,drop column original_transaction_reference,
          drop column legacy_planner_token,drop column started_at;
        alter table app.commerce_apple_transaction_receipts drop column app_account_token`);
      await c.query(await readFile(new URL('../migrations/0096_apple_purchase_owner_binding.sql',import.meta.url),'utf8'));
      const receipt={originalTransactionId:'700000000011',productId:identity.annualProductId,storefront:'USA',currency:'USD',
        priceMilliunits:99990,purchasedAt:new Date().toISOString()};
      const resolve=(original:string)=>c.query('select * from app.resolve_apple_purchase_owner($1,\'production\',$2,$3::jsonb)',
        [owner.plannerPublicId,original,JSON.stringify({...receipt,originalTransactionId:original})]);
      expect((await resolve(receipt.originalTransactionId)).rows[0]?.planner_id).toBe(owner.plannerId);
      expect((await resolve('700000000012')).rowCount).toBe(0);
    } finally {await c.query('rollback');c.release();}
  });
  it('restores new-token ownership from a pre-purchase snapshot and still processes a later refund',async()=>{
    const {intent,service}=await preparePurchase();
    await service.transition({plannerId:owner.plannerId,orderReference:intent.orderReference,action:'start'});
    const f=await harness(owner,false);f.tx.appAccountToken=intent.appAccountToken;f.renewal.appAccountToken=intent.appAccountToken;
    f.tx.purchaseDate=Date.now();f.tx.signedDate=f.tx.purchaseDate;f.tx.expiresDate=f.tx.purchaseDate+365*day;
    f.renewal.signedDate=f.tx.purchaseDate;f.transactions.set('client.signed.fixture',structuredClone(f.tx));f.publish();
    const journal=new Map<string,RecoveryControl>();configureRecoveryPool(pool,{async publish(e){journal.set(e.key,e);}});
    await pool.query('update app.recovery_policy set enforced=true');
    try {
      expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
      const control=journal.get(`unreconciled_access:${owner.plannerPublicId}`)!;
      expect(control.facts.subscriptions).toEqual([expect.objectContaining({appAccountToken:intent.appAccountToken})]);
      const generation=(await pool.query('select generation from app.recovery_policy')).rows[0].generation;
      // An isolated snapshot predating the purchase keeps the owner/plan, but
      // has none of its later order, consent, subscription, receipt or binding.
      const c=await pool.connect();
      try {
        await c.query('begin');await c.query("select set_config('app.recovery_replay','true',true)");
        await c.query('delete from app.commerce_provider_event_inbox where commerce_account_reference=$1',[owner.account]);
        await c.query('delete from app.commerce_provider_object_links where commerce_account_reference=$1',[owner.account]);
        await c.query('delete from app.commerce_accounts where planner_id=$1',[owner.plannerId]);
        await c.query('delete from app.recovery_controls');await c.query('commit');
      } catch(error){await c.query('rollback');throw error;} finally {c.release();}
      const read=async()=>{
        const snapshot=await f.snapshot.retrieveAuthoritativeSubscription({anyTransactionId:f.tx.transactionId!,
          providerSubscriptionReference:f.tx.originalTransactionId!,expectedAppAccountToken:intent.appAccountToken,
          expectedCommerceAccountReference:owner.account});return {snapshot,apple:snapshot};
      };
      expect(await reconcileRecoveryCommerce(pool,[control],generation,read)).toMatchObject({reconciledOwners:1});
      expect((await service.current(owner.plannerId)).appAccountTokens).toContain(intent.appAccountToken);
      expect((await pool.query('select * from app.commerce_apple_purchase_sessions')).rowCount).toBe(0);
      f.item.status=Status.REVOKED;f.tx.revocationDate=Date.now();f.tx.signedDate=Date.now();f.renewal.signedDate=Date.now();f.publish();
      await f.intake.acceptNotification(f.notice('REFUND'));
      expect(await f.intake.retryPending()).toMatchObject({applied:1});
      expect((await pool.query('select count(*)::int n from app.commerce_entitlement_grants where revoked_at is null')).rows[0].n).toBe(0);
    } finally {await pool.query('update app.recovery_policy set enforced=false');}
  });

  it('binds a new signed purchase once to its exact server-issued consent intent, including a notification-first delivery', async () => {
    const {intent,service}=await preparePurchase();
    await service.transition({plannerId:owner.plannerId,orderReference:intent.orderReference,action:'start'});
    const f=await harness(owner,false);
    f.tx.appAccountToken=intent.appAccountToken;f.renewal.appAccountToken=intent.appAccountToken;
    f.tx.purchaseDate=Date.now();f.tx.signedDate=f.tx.purchaseDate;f.tx.expiresDate=f.tx.purchaseDate+365*day;
    f.renewal.signedDate=f.tx.purchaseDate;f.transactions.set('client.signed.fixture',structuredClone(f.tx));f.publish();
    expect(await f.intake.acceptNotification(f.notice())).toMatchObject({status:'needs_authoritative_snapshot'});
    expect(await f.intake.retryPending()).toMatchObject({applied:1});
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    expect((await state()).grants).toBe(2);
    f.tx.originalTransactionId='700000000009';f.tx.transactionId='700000000009';
    f.transactions.set('client.signed.fixture',structuredClone(f.tx));
    await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({code:'apple_account_not_bound'});
    expect((await pool.query('select count(*)::int n from app.commerce_subscriptions')).rows[0].n).toBe(1);
  });

  it('keeps a newer signed refund retryable while the status endpoint still reports the pre-refund state', async () => {
    const f=await harness();await f.intake.acceptClientTransaction(f.input);
    const cached=structuredClone(await f.api.getAllSubscriptionStatuses());
    f.tx.revocationDate=f.now;f.tx.signedDate=f.now+20;f.renewal.signedDate=f.now+20;f.item.status=Status.REVOKED;f.publish();
    await f.intake.acceptNotification(f.notice('REFUND'));
    f.api.getAllSubscriptionStatuses.mockResolvedValueOnce(cached);
    expect(await f.intake.retryPending()).toMatchObject({applied:0,pending:1});
    expect((await state()).grants).toBe(2);
    await due();expect(await f.intake.retryPending()).toMatchObject({applied:1,pending:0});
    expect((await state()).grants).toBe(0);
  });

  it('commits one immutable receipt, current status and grants before authorizing finish', async () => {
    const f = await harness();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ status: 'applied', finishAuthorized: true });
    expect(await state()).toMatchObject({ state: 'active', receipts: 1, grants: 2, renewal_is_possible: true });
    const row = (await pool.query('select processing_status,lease_token,verified_receipt from app.commerce_provider_event_inbox')).rows[0];
    expect(row).toMatchObject({ processing_status: 'applied', lease_token: null });
    expect(JSON.stringify(row)).not.toMatch(/client\.signed|status\.transaction/);
  });

  it('re-fetches a duplicate client receipt and applies a later refund without duplicate receipts', async () => {
    const f = await harness(); await f.intake.acceptClientTransaction(f.input);
    f.tx.revocationDate = f.now; f.tx.signedDate = f.now + 10; f.renewal.signedDate = f.now + 10;
    f.item.status = Status.REVOKED; f.publish();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ finishAuthorized: true });
    expect(f.api.getAllSubscriptionStatuses).toHaveBeenCalledTimes(2);
    expect(await state()).toMatchObject({ state: 'revoked', receipts: 1, grants: 0 });
    expect((await pool.query('select count(*)::int as n from app.commerce_provider_events')).rows[0].n).toBe(1);
    expect((await pool.query('select count(*)::int as n from app.commerce_reconciliation_runs')).rows[0].n).toBe(2);
  });

  it('durably accepts a notification without trusting it to grant, then reconciles in the worker', async () => {
    const f = await harness(); const raw = f.notice();
    expect(await f.intake.acceptNotification(raw)).toEqual({ received: true, status: 'needs_authoritative_snapshot' });
    expect(f.api.getAllSubscriptionStatuses).not.toHaveBeenCalled(); expect(await state()).toBeUndefined();
    expect(await f.intake.retryPending()).toMatchObject({ attempted: 1, applied: 1, failed: 0 });
    expect(await f.intake.acceptNotification(raw)).toMatchObject({ status: 'applied' });
    expect(await f.intake.retryPending()).toMatchObject({ attempted: 0 });
  });

  it('leaves finish unauthorized across provider failure and succeeds after durable retry', async () => {
    const f = await harness(); f.api.getAllSubscriptionStatuses.mockRejectedValueOnce(new Error('private provider details'));
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ status: 'pending', finishAuthorized: false });
    expect(await state()).toBeUndefined();
    expect((await pool.query('select last_error_code from app.commerce_provider_event_inbox')).rows[0].last_error_code).toBe('apple_snapshot_retry');
    await due(); expect(await f.intake.retryPending()).toMatchObject({ applied: 1 });
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ finishAuthorized: true });
    expect(await state()).toMatchObject({ receipts: 1, grants: 2 });
  });

  it('never trusts a receipt from another authenticated account or overwrites a known original owner', async () => {
    const f = await harness(); await f.intake.acceptClientTransaction(f.input);
    const other = await addOwner();
    await expect(f.intake.acceptClientTransaction({ ...f.input, ...other })).rejects.toMatchObject({ status: 409 });
    const foreign = await harness(other);
    await expect(foreign.intake.acceptClientTransaction(foreign.input)).rejects.toMatchObject({ code: 'apple_account_not_bound' });
    expect((await withCommercePlannerDatabase(pool, other.plannerId, c => c.query('select * from app.commerce_apple_transaction_receipts'))).rows).toEqual([]);
    expect(await state()).toMatchObject({ receipts: 1, grants: 2 });
  });

  it('rejects a reused notification UUID with conflicting verified payload instead of masking it as duplicate', async () => {
    const f = await harness(); const uuid = randomUUID();
    await f.intake.acceptNotification(f.notice('DID_RENEW', uuid));
    await expect(f.intake.acceptNotification(f.notice('REFUND', uuid))).rejects.toMatchObject({ code: 'apple_delivery_conflict' });
    expect((await pool.query('select count(*)::int as n from app.commerce_provider_event_inbox')).rows[0].n).toBe(1);
  });

  it('does not acknowledge invalid notifications or authorize finish when ledger policy is closed', async () => {
    const f = await harness(); await expect(f.intake.acceptNotification('invalid')).rejects.toMatchObject({ status: 400 });
    expect((await pool.query('select count(*)::int as n from app.commerce_provider_event_inbox')).rows[0].n).toBe(0);
    await pool.query('update app.commerce_runtime_policy set production_entitlements_enabled=false');
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ finishAuthorized: false });
    expect(await state()).toBeUndefined();
  });

  it('keeps online-verifier outages retryable without accepting a transaction or creating an inbox row', async () => {
    const f = await harness();
    const outage = new VerificationException(VerificationStatus.RETRYABLE_VERIFICATION_FAILURE);
    vi.spyOn(f.verification, 'verifyNotification').mockRejectedValue(outage);
    vi.spyOn(f.verification, 'verifyClientTransaction').mockRejectedValue(outage);
    await expect(f.intake.acceptNotification(f.notice())).rejects.toMatchObject({ status: 503, code: 'apple_verification_unavailable' });
    await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({ status: 503, code: 'apple_verification_unavailable' });
    expect((await pool.query('select count(*)::int as n from app.commerce_provider_event_inbox')).rows[0].n).toBe(0);
    expect((await pool.query('select count(*)::int as n from app.commerce_apple_transaction_receipts')).rows[0].n).toBe(0);
  });

  it('leases the original subscription across concurrent workers and reclaims a crashed worker', async () => {
    const f = await harness(); await f.intake.acceptNotification(f.notice()); await f.intake.acceptNotification(f.notice());
    const queue = new AppleProductionInbox(pool);
    const jobs = await Promise.all([queue.claim(), queue.claim()]);
    expect(jobs.filter(Boolean)).toHaveLength(1);
    await pool.query("update app.commerce_provider_event_inbox set lease_until=now()-interval '1 second' where lease_token is not null");
    expect(await f.intake.retryPending()).toMatchObject({ applied: 2, pending: 0 });
    expect(await state()).toMatchObject({ receipts: 1 });
  });

  it('serializes duplicate client submissions and never commits a second receipt', async () => {
    const f = await harness();
    const results = await Promise.all([f.intake.acceptClientTransaction(f.input), f.intake.acceptClientTransaction(f.input)]);
    expect(results.some(result => result.finishAuthorized)).toBe(true);
    expect(await state()).toMatchObject({ receipts: 1, grants: 2 });
  });

  it('does not replace an already active Stripe subscription with a conflicting Apple purchase', async () => {
    await pool.query(`insert into app.commerce_subscriptions(planner_id,commerce_account_id,plan_version_id,
      plan_code,price_id,acquisition_type,renewal_provider,provider_environment,provider_subscription_reference,
      state,current_period_starts_at,current_period_ends_at,provider_observed_at)
      select $1,a.id,p.plan_version_id,'family',p.id,'purchased','stripe','production','sub_delivery_fixture',
        'active',now()-interval '1 day',now()+interval '364 days',now()
      from app.commerce_accounts a cross join app.commerce_prices p where a.planner_id=$1 and p.price_code='family_usd_annual_v4'`, [owner.plannerId]);
    const f = await harness();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ finishAuthorized: false });
    expect((await pool.query('select renewal_provider from app.commerce_subscriptions')).rows).toEqual([{ renewal_provider: 'stripe' }]);
    expect((await state()).receipts).toBe(0);
    expect((await pool.query('select * from app.commerce_provider_events')).rows).toEqual([]);
  });

  it('stops retry storms at a bounded attempt limit and exposes unresolved queue health', async () => {
    const f = await harness(); const raw = f.notice(); await f.intake.acceptNotification(raw);
    f.api.getAllSubscriptionStatuses.mockRejectedValue(new Error('fixture offline'));
    for (let i = 0; i < 12; i++) { await due(); await f.intake.retryPending(); }
    expect(await f.intake.retryPending()).toMatchObject({ attempted: 0, failed: 1, pending: 0 });
    await f.intake.acceptNotification(raw);
    expect(await f.intake.retryPending()).toMatchObject({ attempted: 0, failed: 1 });
    expect(f.api.getAllSubscriptionStatuses).toHaveBeenCalledTimes(12);
  });

  it('classifies an exhausted crashed lease as failed instead of leaving it stuck forever', async () => {
    const f = await harness(); await f.intake.acceptNotification(f.notice());
    await new AppleProductionInbox(pool).claim();
    await pool.query("update app.commerce_provider_event_inbox set work_attempts=12,lease_until=now()-interval '1 second'");
    expect(await f.intake.retryPending()).toMatchObject({ attempted: 0, failed: 1, pending: 0 });
  });

  it('retains unmapped deliveries for retry, and never recreates a deleted account from a notification', async () => {
    const f = await harness();
    await pool.query('delete from app.commerce_accounts where public_id=$1', [owner.account]);
    expect(await f.intake.acceptNotification(f.notice())).toMatchObject({ status: 'needs_mapping' });
    expect(await f.intake.retryPending()).toMatchObject({ applied: 0, pending: 1 });
    expect(f.api.getAllSubscriptionStatuses).not.toHaveBeenCalled();
    expect((await pool.query('select * from app.commerce_accounts')).rows).toEqual([]);
  });

  it('uses the latest renewal when an old refund arrives and rejects provider regression', async () => {
    const f = await harness(); const oldNotification = f.notice('REFUND');
    await f.intake.acceptClientTransaction(f.input);
    f.tx.transactionId = '700000000002'; f.tx.purchaseDate = f.now - 500; f.tx.expiresDate = f.now + 365 * day;
    f.tx.signedDate = f.now + 10; f.renewal.signedDate = f.now + 10; f.publish();
    await f.intake.acceptNotification(oldNotification);
    expect(await f.intake.retryPending()).toMatchObject({ applied: 1 });
    expect(await state()).toMatchObject({ state: 'active', receipts: 2, grants: 2 });
    f.tx.transactionId = '700000000001'; f.tx.purchaseDate = f.now - day; f.tx.expiresDate = f.now + 364 * day;
    f.tx.signedDate = f.now; f.renewal.signedDate = f.now; f.publish();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({ finishAuthorized: false });
    expect((await state()).current_period_ends_at.toISOString()).toBe(new Date(f.now + 365 * day).toISOString());
  });

  it('keeps the original receipt when Apple extends the signed access deadline', async () => {
    const f = await harness(); await f.intake.acceptClientTransaction(f.input);
    const initial = f.tx.expiresDate!;
    f.tx.expiresDate! += 3 * day; f.tx.signedDate! += 10; f.renewal.signedDate! += 10; f.publish();
    await f.intake.acceptNotification(f.notice('RENEWAL_EXTENDED')); await f.intake.retryPending();
    expect((await state()).current_period_ends_at.toISOString()).toBe(new Date(initial + 3 * day).toISOString());
    expect((await pool.query('select paid_through from app.commerce_apple_transaction_receipts')).rows[0].paid_through.toISOString()).toBe(new Date(initial).toISOString());
  });

  it('reconciles a prepared purchase and retains its exact consent with paid financial records on erasure',async()=>{
    const {intent,service}=await preparePurchase();
    await service.transition({plannerId:owner.plannerId,orderReference:intent.orderReference,action:'start'});
    const f=await harness(owner,false);
    f.tx.appAccountToken=intent.appAccountToken;f.renewal.appAccountToken=intent.appAccountToken;
    f.tx.purchaseDate=Date.now();f.tx.signedDate=f.tx.purchaseDate;f.tx.expiresDate=f.tx.purchaseDate+365*day;
    f.renewal.signedDate=f.tx.purchaseDate;f.transactions.set('client.signed.fixture',structuredClone(f.tx));f.publish();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    expect((await pool.query('select status from app.commerce_orders')).rows).toEqual([{status:'paid_reconciled'}]);
    expect(await service.current(owner.plannerId)).toEqual({purchase:null,appAccountTokens:[intent.appAccountToken]});
    const job=await withPlannerDatabase(pool,owner.plannerId,async c=>(await c.query('select app.request_account_deletion($1) as id',[Buffer.alloc(32,7)])).rows[0].id);
    const lease=(await pool.query('select app.claim_account_deletion($1) as job',[job])).rows[0].job;
    expect((await pool.query('select app.finish_account_deletion($1,$2,true) as done',[job,lease.leaseToken])).rows[0].done).toBe(true);
    const records=(await pool.query('select records from app.closed_account_payment_records where deletion_public_id=$1',[job])).rows[0].records;
    expect(records.purchaseConsents).toEqual([expect.objectContaining({order_public_id:intent.orderReference,amount_minor:9999,
      consent_version:applePurchaseTerms.version})]);
    expect(JSON.stringify(records.purchaseConsents)).not.toMatch(/planner_id|identity|signedTransaction/);
    expect(JSON.stringify(records.appleReceipts)).not.toContain('app_account_token');
  });
  it('accepts a genuinely delayed started purchase but rejects a new purchase long after its intent was canceled',async()=>{
    const {intent,service}=await preparePurchase();
    await service.transition({plannerId:owner.plannerId,orderReference:intent.orderReference,action:'start'});
    await pool.query("update app.commerce_apple_purchase_sessions set created_at=now()-interval '2 days',updated_at=now()-interval '2 days'");
    const f=await harness(owner,false);f.tx.appAccountToken=intent.appAccountToken;f.renewal.appAccountToken=intent.appAccountToken;
    f.tx.purchaseDate=Date.now();f.tx.signedDate=f.tx.purchaseDate;f.tx.expiresDate=f.tx.purchaseDate+365*day;
    f.renewal.signedDate=f.tx.purchaseDate;f.transactions.set('client.signed.fixture',structuredClone(f.tx));f.publish();
    await pool.query("update app.commerce_apple_purchase_sessions set state='closed',updated_at=now()-interval '1 hour'");
    await expect(f.intake.acceptClientTransaction(f.input)).rejects.toMatchObject({code:'apple_account_not_bound'});
    // Model the alternative uninterrupted started state, not a client transition.
    await pool.query("update app.commerce_apple_purchase_sessions set state='started',updated_at=now()-interval '2 days'");
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    expect((await pool.query('select status from app.commerce_orders where public_id=$1',[intent.orderReference])).rows[0].status).toBe('paid_reconciled');
  });

  it('restores an older paid receipt without inventing a second paid order',async()=>{
    const {intent}=await preparePurchase();const f=await harness();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    expect((await pool.query('select status from app.commerce_orders where public_id=$1',[intent.orderReference])).rows[0].status).toBe('canceled');
    expect(await state()).toMatchObject({state:'active',receipts:1});
  });

  it('does not let an old expired notification cancel a later unfinished purchase',async()=>{
    const f=await harness();f.item.status=Status.EXPIRED;f.tx.expiresDate=f.now-500;f.renewal.autoRenewStatus=0;
    f.transactions.set('client.signed.fixture',structuredClone(f.tx));f.publish();
    expect(await f.intake.acceptClientTransaction(f.input)).toMatchObject({finishAuthorized:true});
    const {intent}=await preparePurchase();
    await f.intake.acceptNotification(f.notice('EXPIRED'));await f.intake.retryPending();
    expect((await pool.query('select status from app.commerce_orders where public_id=$1',[intent.orderReference])).rows[0].status).toBe('created');
  });

  it('mounts isolated authenticated/CSRF-protected production routes; delivery acknowledgement means durable receipt only', async () => {
    const f = await harness();
    const base = loadConfig({ NODE_ENV: 'test', DATABASE_URL: databaseUrl, ALLOW_DEV_AUTH: 'true' });
    const isolated: AppConfig = { ...base, appleProduction: { secretArn: 'fixture-not-a-real-secret', rootCertificateDirectory: 'fixture' } };
    const app = createApp(pool, isolated, { appleProductionIntake: f.intake });
    const endpoint = '/api/v1/commerce/storekit/production/transactions';
    // Token storage can change while a native preparation request is in flight.
    // Reject its previous UI owner's consent before reserving anything for this session.
    await request(app).post('/api/v1/commerce/storekit/production/prepare').set('x-dev-planner-id',owner.plannerPublicId)
      .set('idempotency-key',randomUUID()).send({expectedAppAccountToken:randomUUID(),quote:{bindingCode:'delivery_fixture',
        priceCode:'family_apple_usd_annual_delivery_fixture',productId:'com.rillora.family.annual',serviceMarketCode:'GLOBAL_US',
        storefrontCountryCode:'USA',currency:'USD',amountMinor:9999,minorUnitExponent:2,priceMilliunits:99990,billingPeriod:'annual'},
        consent:{...applePurchaseTerms,acceptedSubscriptionTerms:true,acceptedAnnualRenewal:true,acknowledgedCancellation:true}})
      .expect(409).then(response=>expect(response.body.error.code).toBe('purchase_account_changed'));
    expect((await pool.query('select * from app.commerce_orders')).rows).toEqual([]);
    await request(app).post(endpoint).send({ signedTransaction: f.input.signedTransaction }).expect(401);
    await request(app).post(endpoint).set('x-dev-planner-id', owner.plannerPublicId)
      .send({ signedTransaction: f.input.signedTransaction, plannerPublicId: owner.plannerPublicId }).expect(400);
    // A real cookie credential requires current synthetic legal proof and CSRF.
    const cookie = 'c'.repeat(43), csrf = 's'.repeat(43);
    const hash = (value: string) => createHash('sha256').update(value).digest();
    await pool.query(`with identity as (insert into app.identity_accounts(planner_id,issuer,subject)
        values($1,'https://identity.example','apple-cookie-fixture') returning id,planner_id),
      acceptance as (insert into app.legal_acceptances(planner_id,identity_account_id,terms_version,privacy_version,
        consent_text_version,legal_bundle_sha256,accepted_terms,acknowledged_privacy,accepted_electronic_records,
        client_surface,identity_reference_sha256)
        select planner_id,id,$2,$3,$4,$5,true,true,true,'web',$6 from identity returning id,planner_id,identity_account_id)
      insert into app.auth_sessions(planner_id,identity_account_id,legal_acceptance_id,token_hash,csrf_token_hash,expires_at)
        select planner_id,identity_account_id,id,$7,$8,now()+interval '1 hour' from acceptance`,
    [owner.plannerId, currentLegalContract.termsVersion, currentLegalContract.privacyVersion,
      currentLegalContract.consentTextVersion, Buffer.from(currentLegalContract.bundleSha256, 'hex'),
      hash('synthetic identity reference'), hash(cookie), hash(csrf)]);
    await request(app).post(endpoint).set('Cookie', `continuity_session=${cookie}`)
      .send({ signedTransaction: f.input.signedTransaction }).expect(403);
    await request(app).post(endpoint).set('Cookie', `continuity_session=${cookie}`).set('x-csrf-token', csrf).set('x-rillora-planner', owner.plannerPublicId)
      .send({ signedTransaction: f.input.signedTransaction }).expect(200);
    const result = await request(app).post(endpoint).set('x-dev-planner-id', owner.plannerPublicId)
      .send({ signedTransaction: f.input.signedTransaction }).expect(200);
    expect(result.body.result.finishAuthorized).toBe(true);
    await request(app).post('/api/commerce/storekit/production/notifications').send({ signedPayload: f.notice() }).expect(200, { received: true });
    await request(createApp(pool, base)).post(endpoint).set('x-dev-planner-id', owner.plannerPublicId)
      .send({ signedTransaction: f.input.signedTransaction }).expect(404);
    await request(createApp(pool, { ...isolated, productionRuntimeClosed: true }, { appleProductionIntake: f.intake }))
      .post('/api/commerce/storekit/production/notifications').send({ signedPayload: f.notice() }).expect(503);
  });
});
