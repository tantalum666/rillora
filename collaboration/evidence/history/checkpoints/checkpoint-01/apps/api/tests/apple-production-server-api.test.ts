import { generateKeyPairSync } from 'node:crypto';
import { AutoRenewStatus, Environment, InAppOwnershipType, Status, Type,
  type JWSRenewalInfoDecodedPayload, type JWSTransactionDecodedPayload,
  type StatusResponse } from '@apple/app-store-server-library';
import { Response } from 'node-fetch';
import { describe, expect, it, vi } from 'vitest';
import { appleReviewContext } from '../src/apple-execution-context.js';
import { ApplePriceBindings } from '../src/apple-price-bindings.js';
import { AppleProductionVerification, rilloraAppleIdentity as identity } from '../src/apple-production-verification.js';
import { AppleProductionServerApi, AppleProductionSnapshotAdapter } from '../src/apple-production-server-api.js';
import type { AppleSignedDataVerifying } from '../src/apple-storekit-adapter.js';

const now = Date.parse('2026-09-26T12:00:00Z');
const day = 86_400_000;
const originalId = '2000000123456789';
const owner = '11111111-2222-4333-8444-555555555555';
const account = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const lookup = { anyTransactionId: originalId, providerSubscriptionReference: originalId,
  expectedAppAccountToken: owner, expectedCommerceAccountReference: account };
const binding = { id: 'fixture_annual', productId: identity.annualProductId,
  storefrontCountryCode: 'USA', currency: 'USD', priceMilliunits: 99990,
  priceCode: 'family_apple_usd_annual_fixture', planVersion: 2,
  effectiveFrom: '2026-09-01T00:00:00Z', effectiveUntil: null };

function fixture(status: Status = Status.ACTIVE) {
  const transaction: JWSTransactionDecodedPayload = {
    environment: Environment.PRODUCTION, bundleId: identity.bundleId,
    subscriptionGroupIdentifier: identity.subscriptionGroupId, productId: identity.annualProductId,
    storefront: 'USA', type: Type.AUTO_RENEWABLE_SUBSCRIPTION, quantity: 1,
    inAppOwnershipType: InAppOwnershipType.PURCHASED, originalTransactionId: originalId,
    transactionId: '2000000123456790', appAccountToken: owner,
    purchaseDate: now - day, expiresDate: now + 364 * day, signedDate: now - 1000,
    currency: 'USD', price: 99990,
  };
  const renewal: JWSRenewalInfoDecodedPayload = {
    environment: Environment.PRODUCTION, originalTransactionId: originalId,
    productId: identity.annualProductId, autoRenewProductId: identity.annualProductId,
    autoRenewStatus: AutoRenewStatus.ON, appAccountToken: owner, signedDate: now - 1000,
  };
  const item = { status, originalTransactionId: originalId,
    signedTransactionInfo: 'signed.transaction.fixture', signedRenewalInfo: 'signed.renewal.fixture' };
  const response: StatusResponse = { environment: Environment.PRODUCTION, bundleId: identity.bundleId,
    appAppleId: identity.appAppleId, data: [{ subscriptionGroupIdentifier: identity.subscriptionGroupId, lastTransactions: [item] }] };
  const api = { getAllSubscriptionStatuses: vi.fn(async () => response) };
  const decoder: AppleSignedDataVerifying = {
    verifyAndDecodeTransaction: vi.fn(async () => transaction),
    verifyAndDecodeRenewalInfo: vi.fn(async () => renewal),
    verifyAndDecodeNotification: async () => { throw new Error('Not a notification fixture'); },
  };
  const verifier = new AppleProductionVerification(decoder, new Set(['USA', 'HKG']));
  return { transaction, renewal, response, item, api, decoder,
    adapter: (prices: unknown = [binding], clock: () => Date = () => new Date(now)) =>
      new AppleProductionSnapshotAdapter(api, verifier, new ApplePriceBindings(prices), clock) };
}

describe('Apple production authoritative status (decoded fixtures, not Apple transaction proof)', () => {
  it('returns the signed-price version and account binding without retaining JWS or granting access', async () => {
    const f = fixture();
    const snapshot = await f.adapter().retrieveAuthoritativeSubscription(lookup);
    expect(snapshot).toMatchObject({ provider: 'storekit', providerEnvironment: 'production',
      state: 'active', commerceAccountReference: account, priceCode: binding.priceCode,
      planVersion: 2, priceBindingId: binding.id, priceMilliunits: 99990, renewalIsPossible: true,
      currentPeriodStartsAt: new Date(now - day).toISOString(),
      currentPeriodEndsAt: new Date(now + 364 * day).toISOString(),
      graceEndsAt: null });
    expect(f.api.getAllSubscriptionStatuses).toHaveBeenCalledWith(originalId);
    expect(JSON.stringify(snapshot)).not.toMatch(/signed\.transaction|signed\.renewal|entitlement|finishAuthorized/);
  });

  it('keeps the paid term after cancellation and never uses next-renewal price as the current receipt', async () => {
    const f = fixture();
    f.renewal.autoRenewStatus = AutoRenewStatus.OFF;
    f.renewal.renewalPrice = 119990;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({
      state: 'cancel_at_period_end', cancelAtPeriodEnd: true, renewalIsPossible: false,
      priceMilliunits: 99990, priceCode: binding.priceCode,
      currentPeriodEndsAt: new Date(now + 364 * day).toISOString(),
    });
  });

  it('uses signed grace expiry for access and keeps the paid-period end separately', async () => {
    const f = fixture(Status.BILLING_GRACE_PERIOD);
    f.transaction.expiresDate = now - 1000;
    f.renewal.gracePeriodExpiresDate = now + 3 * day;
    f.renewal.isInBillingRetryPeriod = true;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({ state: 'grace',
      graceEndsAt: new Date(now + 3 * day).toISOString(), currentPeriodEndsAt: new Date(now - 1000).toISOString() });
    f.renewal.gracePeriodExpiresDate = now;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({ state: 'past_due' });
    delete f.renewal.gracePeriodExpiresDate;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('timestamp');
    f.renewal.gracePeriodExpiresDate = now - 2000;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('grace window');
    f.renewal.gracePeriodExpiresDate = now + 29 * day;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('grace window');
  });

  it.each([[Status.EXPIRED, 'expired_read_only'], [Status.BILLING_RETRY, 'past_due'], [Status.REVOKED, 'revoked']] as const)(
    'preserves non-access state %s as %s', async (status, state) => {
      await expect(fixture(status).adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({ state });
    });

  it('does not extend delayed active responses or let signed revocation/upgrades grant access', async () => {
    const f = fixture();
    f.transaction.expiresDate = now;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({ state: 'expired_read_only' });
    f.renewal.isInBillingRetryPeriod = true;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({ state: 'past_due', renewalIsPossible: true });
    f.transaction.expiresDate = now + day;
    f.transaction.revocationDate = now - 500;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({ state: 'revoked', renewalIsPossible: false,
      currentPeriodEndsAt: new Date(now + day).toISOString() });
    delete f.transaction.revocationDate;
    f.transaction.isUpgraded = true;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({ state: 'expired_read_only', renewalIsPossible: false });
  });

  it('retains an explicitly mapped historical monthly contract without relabeling it as the current annual offer', async () => {
    const f = fixture();
    f.transaction.productId = identity.historicalMonthlyProductId;
    f.transaction.purchaseDate = Date.parse('2026-08-20T12:00:00Z');
    f.transaction.price = 7990;
    f.renewal.productId = identity.historicalMonthlyProductId;
    f.renewal.autoRenewProductId = identity.historicalMonthlyProductId;
    const historical = { ...binding, id: 'fixture_historical', productId: identity.historicalMonthlyProductId,
      priceCode: 'family_apple_usd_monthly_historical', priceMilliunits: 7990, planVersion: 1,
      effectiveFrom: '2026-08-01T00:00:00Z', effectiveUntil: '2026-09-01T00:00:00Z' };
    await expect(f.adapter([binding, historical]).retrieveAuthoritativeSubscription(lookup)).resolves.toMatchObject({
      priceCode: historical.priceCode, planVersion: 1, priceMilliunits: 7990 });
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('price binding');
  });

  it('rejects wrong response identity before processing signed data', async () => {
    for (const patch of [{ environment: Environment.SANDBOX }, { appAppleId: 1 }, { bundleId: 'com.other.app' }]) {
      const f = fixture(); Object.assign(f.response, patch);
      await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('identity mismatch');
      expect(f.decoder.verifyAndDecodeTransaction).not.toHaveBeenCalled();
    }
  });

  it('requires one unambiguous latest entry for the expected subscription', async () => {
    const f = fixture();
    f.response.data![0]!.lastTransactions = [];
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('missing or ambiguous');
    f.response.data![0]!.lastTransactions = [f.item, { ...f.item, status: Status.REVOKED }];
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('missing or ambiguous');
    f.response.data = [f.response.data![0]!, f.response.data![0]!];
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('group');
  });

  it('rejects foreign signed owners, products, storefronts, currencies and unsigned or unrecognized status material', async () => {
    for (const patch of [{ appAccountToken: account }, { originalTransactionId: '9999' }, { productId: 'other' },
      { storefront: 'CAN' }, { storefront: 'HKG' }, { currency: 'HKD' }, { price: 88800 }]) {
      const f = fixture(); Object.assign(f.transaction, patch);
      await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow();
    }
    const f = fixture(); f.item.signedRenewalInfo = '';
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('signed evidence');
    f.item.signedRenewalInfo = 'signed.renewal.fixture'; f.item.status = 99 as Status;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('unknown');
  });

  it('rejects impossible dates and unknown renewal preference without trusting local time to add coverage', async () => {
    const f = fixture();
    await expect(f.adapter([binding], () => new Date(NaN)).retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('timestamp');
    f.transaction.signedDate = now + 6 * 60 * 1000;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('signed dates');
    f.transaction.signedDate = now; f.renewal.autoRenewStatus = 88;
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('preference');
  });

  it('validates server-supplied identifiers before any provider call and preserves provider/verifier errors', async () => {
    const f = fixture();
    await expect(f.adapter().retrieveAuthoritativeSubscription({ ...lookup, anyTransactionId: '../transactions/1' })).rejects.toThrow();
    expect(f.api.getAllSubscriptionStatuses).not.toHaveBeenCalled();
    f.api.getAllSubscriptionStatuses.mockRejectedValueOnce(new Error('provider unavailable'));
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('provider unavailable');
    vi.mocked(f.decoder.verifyAndDecodeTransaction).mockRejectedValueOnce(new Error('signature rejected'));
    await expect(f.adapter().retrieveAuthoritativeSubscription(lookup)).rejects.toThrow('signature rejected');
  });
});

describe('official Apple production HTTP transport', () => {
  it('uses the Sandbox host only when explicitly configured and never falls back to production',async()=>{
    const privateKey=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).privateKey.export({format:'pem',type:'pkcs8'}).toString();
    const request=vi.fn(async()=>new Response(JSON.stringify({...fixture().response,environment:Environment.SANDBOX}),{status:200}));
    const api=new AppleProductionServerApi({privateKey,keyId:'FIXTUREKEY',issuerId:owner},request,appleReviewContext);
    await api.getAllSubscriptionStatuses(originalId);
    expect(request).toHaveBeenCalledWith(`https://api.storekit-sandbox.apple.com/inApps/v1/subscriptions/${originalId}`,
      expect.objectContaining({method:'GET',redirect:'error',size:1048576,timeout:10000}));
    await expect(api.requestTestNotification()).rejects.toThrow('unsupported');
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('restricts requests to bounded, nonredirecting production status reads', async () => {
    const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1',
      privateKeyEncoding: { format: 'pem', type: 'pkcs8' }, publicKeyEncoding: { format: 'pem', type: 'spki' } });
    const request = vi.fn(async () => new Response(JSON.stringify(fixture().response), { status: 200 }));
    const api = new AppleProductionServerApi({ privateKey, keyId: 'FIXTUREKEY', issuerId: owner }, request);
    await api.getAllSubscriptionStatuses(originalId);
    expect(request).toHaveBeenCalledWith(`https://api.storekit.apple.com/inApps/v1/subscriptions/${originalId}`,
      expect.objectContaining({ method: 'GET', timeout: 10000, size: 1048576, redirect: 'error' }));
    await expect(api.getAllSubscriptionStatuses('../transactions/1')).rejects.toThrow('unsupported');
    await expect(api.getAllSubscriptionStatuses(originalId, [Status.ACTIVE])).rejects.toThrow('unsupported');
    await expect(api.requestTestNotification()).rejects.toThrow('unsupported');
    expect(request).toHaveBeenCalledTimes(1);
  });
});
