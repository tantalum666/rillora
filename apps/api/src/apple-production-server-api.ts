import { AppStoreServerAPIClient, AutoRenewStatus, Environment, Status,
  type JWSRenewalInfoDecodedPayload, type JWSTransactionDecodedPayload } from '@apple/app-store-server-library';
import fetch, { type RequestInit, type Response } from 'node-fetch';
import { z } from 'zod';
import { ApplePriceBindings } from './apple-price-bindings.js';
import { AppleProductionVerification, rilloraAppleIdentity } from './apple-production-verification.js';
import type { AppleAppStoreServerApi } from './apple-storekit-server-api.js';
import type { AuthoritativeSubscriptionSnapshot } from './commerce-provider-contract.js';

export type AppleSubscriptionLookup = Readonly<{
  anyTransactionId: string;
  providerSubscriptionReference: string;
  expectedAppAccountToken: string;
  expectedCommerceAccountReference: string;
}>;

export type AppleProductionSnapshot = AuthoritativeSubscriptionSnapshot & Readonly<{
  provider: 'storekit';
  providerEnvironment: 'production';
  priceCode: string;
  planVersion: number;
  priceBindingId: string;
  providerTransactionReference: string;
  storefrontCountryCode: string;
  currency: string;
  priceMilliunits: number;
  graceEndsAt: string | null;
  transactionSignedAt: string;
  renewalSignedAt: string;
}>;

type AppleHttpRequest = (url: string, options: RequestInit) => Promise<Response>;
type AppleServerCredentials = Readonly<{ privateKey: string; keyId: string; issuerId: string }>;

/** Official JWT/schema handling, with a bounded, read-only production transport. */
export class AppleProductionServerApi extends AppStoreServerAPIClient implements AppleAppStoreServerApi {
  constructor(credentials: AppleServerCredentials, private readonly request: AppleHttpRequest = fetch) {
    super(credentials.privateKey, credentials.keyId, credentials.issuerId,
      rilloraAppleIdentity.bundleId, Environment.PRODUCTION);
  }

  protected override async makeFetchRequest(path: string, query: URLSearchParams,
    method: string, body: string | Buffer | undefined, headers: { [key: string]: string }): Promise<Response> {
    if (method !== 'GET' || !/^\/inApps\/v1\/subscriptions\/[0-9]{1,40}$/.test(path)
      || body !== undefined || query.size !== 0) {
      throw new Error('Apple production status transport rejected an unsupported request');
    }
    return this.request(`https://api.storekit.apple.com${path}`, {
      method, headers, redirect: 'error', timeout: 10_000, size: 1024 * 1024,
    });
  }
}

/** Produces evidence only. Persistence, duplicate-provider checks and grants belong to the executor. */
export class AppleProductionSnapshotAdapter {
  constructor(private readonly serverApi: AppleAppStoreServerApi,
    private readonly verification: AppleProductionVerification,
    private readonly prices: ApplePriceBindings,
    private readonly now: () => Date = () => new Date()) {}

  async retrieveAuthoritativeSubscription(input: AppleSubscriptionLookup): Promise<AppleProductionSnapshot> {
    const lookup = parseLookup(input);
    const response = await this.serverApi.getAllSubscriptionStatuses(lookup.anyTransactionId);
    const observedAt = epoch(this.now().getTime());
    if (response.environment !== Environment.PRODUCTION || response.bundleId !== rilloraAppleIdentity.bundleId
      || response.appAppleId !== rilloraAppleIdentity.appAppleId) {
      throw new Error('Apple production status response identity mismatch');
    }
    if (!response.data || response.data.length > 50) throw new Error('Apple production status groups are missing or excessive');
    const groups = response.data.filter(group => group.subscriptionGroupIdentifier === rilloraAppleIdentity.subscriptionGroupId);
    if (groups.length !== 1 || !groups[0]!.lastTransactions || groups[0]!.lastTransactions!.length > 100) {
      throw new Error('Apple production Family status group is missing, ambiguous or excessive');
    }
    const candidates = groups[0]!.lastTransactions!.filter(item => item.originalTransactionId === lookup.providerSubscriptionReference);
    // The endpoint supplies the latest entry per original transaction. Never resolve contradictory
    // duplicate entries by array order or by the signing time of an older refunded transaction.
    if (candidates.length !== 1) throw new Error('Apple production subscription status is missing or ambiguous');
    const selected = candidates[0]!;
    if (!selected.signedTransactionInfo || !selected.signedRenewalInfo) throw new Error('Apple production status lacks signed evidence');
    const status = parseStatus(selected.status);
    const { transaction, renewal } = await this.verification.verifySubscriptionStatus({
      signedTransaction: selected.signedTransactionInfo, signedRenewalInfo: selected.signedRenewalInfo,
      expectedOriginalTransactionId: lookup.providerSubscriptionReference,
      expectedAppAccountToken: lookup.expectedAppAccountToken,
    });
    const price = this.prices.resolve(transaction);
    const transactionSignedAt = epoch(transaction.signedDate);
    const renewalSignedAt = epoch(renewal.signedDate);
    const purchaseAt = epoch(transaction.purchaseDate);
    const paidThrough = epoch(transaction.expiresDate);
    const skew = 5 * 60 * 1000;
    if (Math.max(transactionSignedAt, renewalSignedAt, purchaseAt) > observedAt + skew
      || transactionSignedAt + skew < purchaseAt) throw new Error('Apple production signed dates conflict with the observation');
    if (renewal.autoRenewStatus !== AutoRenewStatus.ON && renewal.autoRenewStatus !== AutoRenewStatus.OFF) {
      throw new Error('Apple production renewal preference is unknown');
    }
    const access = accessWindow(status, transaction, renewal, observedAt, paidThrough);
    return Object.freeze({
      provider: 'storekit', providerEnvironment: 'production',
      providerSubscriptionReference: lookup.providerSubscriptionReference,
      providerTransactionReference: transaction.transactionId!,
      commerceAccountReference: lookup.expectedCommerceAccountReference,
      planCode: 'family', planVersion: price.planVersion, priceCode: price.priceCode, priceBindingId: price.id,
      storefrontCountryCode: price.storefrontCountryCode, currency: price.currency, priceMilliunits: price.priceMilliunits,
      state: access.state, observedAt: iso(observedAt), currentPeriodStartsAt: iso(purchaseAt),
      currentPeriodEndsAt: iso(paidThrough), graceEndsAt: access.graceEndsAt,
      cancelAtPeriodEnd: renewal.autoRenewStatus === AutoRenewStatus.OFF,
      renewalIsPossible: access.state !== 'revoked' && transaction.isUpgraded !== true
        && (renewal.autoRenewStatus === AutoRenewStatus.ON || renewal.isInBillingRetryPeriod === true),
      transactionSignedAt: iso(transactionSignedAt), renewalSignedAt: iso(renewalSignedAt),
      source: 'app_store_server_api_signed_status',
    });
  }
}

function accessWindow(status: Status, transaction: JWSTransactionDecodedPayload,
  renewal: JWSRenewalInfoDecodedPayload, observedAt: number, paidThrough: number): {
    state: AuthoritativeSubscriptionSnapshot['state']; graceEndsAt: string | null;
  } {
  if (transaction.revocationDate !== undefined) {
    const revokedAt = epoch(transaction.revocationDate);
    if (revokedAt > observedAt + 5 * 60 * 1000) throw new Error('Apple revocation date is in the future');
    return { state: 'revoked', graceEndsAt: null };
  }
  if (status === Status.REVOKED) return { state: 'revoked', graceEndsAt: null };
  if (transaction.isUpgraded === true) return { state: 'expired_read_only', graceEndsAt: null };
  if (status === Status.BILLING_RETRY) return { state: 'past_due', graceEndsAt: null };
  if (status === Status.EXPIRED) return { state: 'expired_read_only', graceEndsAt: null };
  if (status === Status.BILLING_GRACE_PERIOD) {
    const graceThrough = epoch(renewal.gracePeriodExpiresDate);
    if (graceThrough <= paidThrough || graceThrough > paidThrough + 28 * 86_400_000) {
      throw new Error('Apple grace window is outside the supported provider period');
    }
    return { state: graceThrough > observedAt ? 'grace' : endedState(renewal), graceEndsAt: iso(graceThrough) };
  }
  // A delayed status response cannot keep access alive beyond its signed coverage window.
  if (paidThrough <= observedAt) return { state: endedState(renewal), graceEndsAt: null };
  return { state: renewal.autoRenewStatus === AutoRenewStatus.OFF ? 'cancel_at_period_end' : 'active', graceEndsAt: null };
}

function endedState(renewal: JWSRenewalInfoDecodedPayload): 'past_due' | 'expired_read_only' {
  return renewal.isInBillingRetryPeriod === true ? 'past_due' : 'expired_read_only';
}
function parseLookup(input: AppleSubscriptionLookup): AppleSubscriptionLookup {
  return z.object({
    anyTransactionId: z.string().regex(/^[0-9]{1,40}$/),
    providerSubscriptionReference: z.string().regex(/^[0-9]{1,40}$/),
    expectedAppAccountToken: z.uuid().transform(value => value.toLowerCase()),
    expectedCommerceAccountReference: z.uuid().transform(value => value.toLowerCase()),
  }).strict().parse(input);
}
function parseStatus(value: unknown): Status {
  if (value !== Status.ACTIVE && value !== Status.EXPIRED && value !== Status.BILLING_RETRY
    && value !== Status.BILLING_GRACE_PERIOD && value !== Status.REVOKED) throw new Error('Apple production subscription status is unknown');
  return value;
}
function epoch(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || !Number.isFinite(new Date(value as number).getTime())) {
    throw new Error('Apple production status timestamp is missing or invalid');
  }
  return value as number;
}
function iso(value: number): string { return new Date(value).toISOString(); }
