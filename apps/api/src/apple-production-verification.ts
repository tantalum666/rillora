import { createHash } from 'node:crypto';
import { Environment, InAppOwnershipType, SignedDataVerifier, Type,
  type JWSTransactionDecodedPayload, type JWSRenewalInfoDecodedPayload } from '@apple/app-store-server-library';
import { z } from 'zod';
import { loadPinnedAppleRootCertificates, type AppleSignedDataVerifying } from './apple-storekit-adapter.js';
import type { CommerceProviderSignalType, NormalizedProviderSignal } from './commerce-provider-contract.js';

export const rilloraAppleIdentity = Object.freeze({ bundleId: 'com.rillora.ios', appAppleId: 6803957639,
  subscriptionGroupId: '22325627', annualProductId: 'com.rillora.family.annual', historicalMonthlyProductId: 'com.rillora.family.monthly' });
const productIds = new Set<string>([rilloraAppleIdentity.annualProductId, rilloraAppleIdentity.historicalMonthlyProductId]);

export async function createRilloraAppleProductionVerifier(rootCertificateDirectory: string): Promise<SignedDataVerifier> {
  return new SignedDataVerifier(await loadPinnedAppleRootCertificates(rootCertificateDirectory), true,
    Environment.PRODUCTION, rilloraAppleIdentity.bundleId, rilloraAppleIdentity.appAppleId);
}

/** Explicit production boundary; the Sandbox verifier and its matrix stay separate. */
export class AppleProductionVerification {
  private readonly storefronts: ReadonlySet<string>;
  constructor(private readonly source: AppleSignedDataVerifying | Promise<AppleSignedDataVerifying>,
    allowedStorefronts: ReadonlySet<string>) {
    if (allowedStorefronts.size === 0 || allowedStorefronts.size > 175
      || [...allowedStorefronts].some(code => !/^[A-Z]{3}$/.test(code))) throw new Error('Production Apple requires explicit supported storefronts');
    this.storefronts = new Set(allowedStorefronts);
  }

  async verifyClientTransaction(input: { signedTransaction: string; expectedAppAccountToken: string;
    expectedStorefrontCountryCode: string }): Promise<NormalizedProviderSignal> {
    const transaction = await this.transaction(input.signedTransaction);
    if (uuid(transaction.appAccountToken) !== uuid(input.expectedAppAccountToken)
      || transaction.storefront !== input.expectedStorefrontCountryCode) throw new Error('Production Apple client transaction ownership mismatch');
    return this.signal(input.signedTransaction, 'client-transaction:' + transaction.transactionId,
      'CLIENT_SIGNED_TRANSACTION', 'subscription_changed', time(transaction.signedDate), transaction, null);
  }

  async verifyNotification(signedPayload: string): Promise<NormalizedProviderSignal> {
    bounded(signedPayload);
    const notification = await (await this.source).verifyAndDecodeNotification(signedPayload);
    const data = notification.data;
    if (!data || data.environment !== Environment.PRODUCTION || data.bundleId !== rilloraAppleIdentity.bundleId
      || data.appAppleId !== rilloraAppleIdentity.appAppleId) throw new Error('Production Apple notification identity mismatch');
    const transaction = data.signedTransactionInfo ? await this.transaction(data.signedTransactionInfo) : null;
    const renewal = data.signedRenewalInfo ? await this.renewal(data.signedRenewalInfo) : null;
    matchSubjects(transaction, renewal);
    const type = identifier(notification.notificationType);
    return this.signal(signedPayload, identifier(notification.notificationUUID),
      type + (notification.subtype ? ':' + identifier(notification.subtype) : ''), signalType(type),
      time(notification.signedDate), transaction, renewal);
  }

  async verifySubscriptionStatus(input: { signedTransaction: string; signedRenewalInfo: string;
    expectedOriginalTransactionId: string; expectedAppAccountToken: string }): Promise<{
      transaction: JWSTransactionDecodedPayload; renewal: JWSRenewalInfoDecodedPayload;
    }> {
    const transaction = await this.transaction(input.signedTransaction);
    const renewal = await this.renewal(input.signedRenewalInfo);
    matchSubjects(transaction, renewal);
    if (transaction.originalTransactionId !== input.expectedOriginalTransactionId
      || renewal.originalTransactionId !== input.expectedOriginalTransactionId
      || uuid(transaction.appAccountToken ?? renewal.appAccountToken) !== uuid(input.expectedAppAccountToken)) {
      throw new Error('Production Apple subscription ownership mismatch');
    }
    return { transaction, renewal };
  }

  private async transaction(signedTransaction: string): Promise<JWSTransactionDecodedPayload> {
    bounded(signedTransaction);
    const transaction = await (await this.source).verifyAndDecodeTransaction(signedTransaction);
    if (transaction.environment !== Environment.PRODUCTION || transaction.bundleId !== rilloraAppleIdentity.bundleId
      || transaction.subscriptionGroupIdentifier !== rilloraAppleIdentity.subscriptionGroupId
      || !productIds.has(transaction.productId ?? '') || !this.storefronts.has(transaction.storefront ?? '')
      || transaction.type !== Type.AUTO_RENEWABLE_SUBSCRIPTION || transaction.quantity !== 1
      || transaction.inAppOwnershipType !== InAppOwnershipType.PURCHASED || transaction.advancedCommerceInfo) {
      throw new Error('Production Apple transaction does not match the supported individual Family subscription');
    }
    identifier(transaction.transactionId); identifier(transaction.originalTransactionId);
    time(transaction.signedDate); time(transaction.purchaseDate); time(transaction.expiresDate);
    if (time(transaction.expiresDate) <= time(transaction.purchaseDate)) throw new Error('Production Apple subscription period is invalid');
    if (!Number.isSafeInteger(transaction.price) || transaction.price! < 0 || !/^[A-Z]{3}$/.test(transaction.currency ?? '')) {
      throw new Error('Production Apple requires the signed amount and currency for versioned mapping');
    }
    return transaction;
  }

  private async renewal(signedRenewalInfo: string): Promise<JWSRenewalInfoDecodedPayload> {
    bounded(signedRenewalInfo);
    const renewal = await (await this.source).verifyAndDecodeRenewalInfo(signedRenewalInfo);
    if (renewal.environment !== Environment.PRODUCTION || !productIds.has(renewal.productId ?? '')
      || (renewal.autoRenewProductId !== undefined && !productIds.has(renewal.autoRenewProductId))) throw new Error('Production Apple renewal binding mismatch');
    identifier(renewal.originalTransactionId); time(renewal.signedDate);
    return renewal;
  }

  private signal(raw: string, reference: string, sourceEventType: string, type: CommerceProviderSignalType,
    signedAt: number, transaction: JWSTransactionDecodedPayload | null, renewal: JWSRenewalInfoDecodedPayload | null): NormalizedProviderSignal {
    const token = transaction?.appAccountToken ?? renewal?.appAccountToken;
    return Object.freeze({ provider: 'storekit', providerEnvironment: 'production', providerEventReference: reference,
      sourceEventType, signalType: type, occurredAt: new Date(signedAt).toISOString(),
      providerSubscriptionReference: transaction?.originalTransactionId ?? renewal?.originalTransactionId ?? null,
      providerTransactionReference: transaction?.transactionId ?? null,
      providerRefundReference: sourceEventType === 'REFUND' ? transaction?.transactionId ?? null : null,
      accountBindingReference: token === undefined ? null : uuid(token), payloadSha256: createHash('sha256').update(raw).digest('base64url'),
      signatureVerified: true, verificationMode: 'apple_server_library_x5c', requiresAuthoritativeSnapshot: true });
  }
}

function matchSubjects(transaction: JWSTransactionDecodedPayload | null, renewal: JWSRenewalInfoDecodedPayload | null): void {
  if (!transaction || !renewal) return;
  if (transaction.originalTransactionId !== renewal.originalTransactionId || transaction.productId !== renewal.productId
    || (transaction.appAccountToken && renewal.appAccountToken && uuid(transaction.appAccountToken) !== uuid(renewal.appAccountToken))) {
    throw new Error('Production Apple transaction and renewal subjects conflict');
  }
}
function uuid(value: unknown): string { return z.uuid().parse(value).toLowerCase(); }
function identifier(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 255) throw new Error('Apple reference is missing or invalid');
  return value;
}
function time(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || !Number.isFinite(new Date(value as number).getTime())) throw new Error('Apple signed time is missing or invalid');
  return value as number;
}
function bounded(value: string): void {
  if (typeof value !== 'string' || Buffer.byteLength(value) === 0 || Buffer.byteLength(value) > 256 * 1024) throw new Error('Apple signed payload exceeds its boundary');
}
function signalType(type: string): CommerceProviderSignalType {
  if (['SUBSCRIBED', 'DID_CHANGE_RENEWAL_PREF', 'DID_CHANGE_RENEWAL_STATUS', 'OFFER_REDEEMED', 'RENEWAL_EXTENDED'].includes(type)) return 'subscription_changed';
  if (type === 'DID_RENEW') return 'renewal_paid';
  if (type === 'DID_FAIL_TO_RENEW') return 'renewal_failed';
  if (['EXPIRED', 'GRACE_PERIOD_EXPIRED', 'REVOKE'].includes(type)) return 'subscription_ended';
  if (['REFUND', 'REFUND_DECLINED', 'REFUND_REVERSED', 'CONSUMPTION_REQUEST'].includes(type)) return 'refund_changed';
  return 'unsupported';
}
