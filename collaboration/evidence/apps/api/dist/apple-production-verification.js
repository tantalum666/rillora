import { createHash } from 'node:crypto';
import { BillingPlanType, Environment, InAppOwnershipType, RenewalBillingPlanType, SignedDataVerifier, Type } from '@apple/app-store-server-library';
import { z } from 'zod';
import { loadPinnedAppleRootCertificates } from './apple-storekit-adapter.js';
import { appleReceiptEvidence } from './apple-production-evidence.js';
import { appleProductionContext, appleReviewContext, assertAppleContext, matchesAppleAppId } from './apple-execution-context.js';
export const rilloraAppleIdentity = Object.freeze({ bundleId: 'com.rillora.ios', appAppleId: 6803957639,
    subscriptionGroupId: '22325627', annualProductId: 'com.rillora.family.annual', historicalMonthlyProductId: 'com.rillora.family.monthly' });
const productIds = new Set([rilloraAppleIdentity.annualProductId, rilloraAppleIdentity.historicalMonthlyProductId]);
export async function createRilloraAppleProductionVerifier(rootCertificateDirectory) {
    return new SignedDataVerifier(await loadPinnedAppleRootCertificates(rootCertificateDirectory), true, Environment.PRODUCTION, rilloraAppleIdentity.bundleId, rilloraAppleIdentity.appAppleId);
}
export async function createRilloraAppleReviewVerifier(rootCertificateDirectory) {
    return new SignedDataVerifier(await loadPinnedAppleRootCertificates(rootCertificateDirectory), true, appleReviewContext.signedEnvironment, rilloraAppleIdentity.bundleId, rilloraAppleIdentity.appAppleId);
}
/** One strict verifier per configured environment; no receipt-driven fallback. */
export class AppleProductionVerification {
    source;
    context;
    storefronts;
    constructor(source, allowedStorefronts, context = appleProductionContext) {
        this.source = source;
        this.context = context;
        assertAppleContext(context);
        if (allowedStorefronts.size === 0 || allowedStorefronts.size > 175
            || [...allowedStorefronts].some(code => !/^[A-Z]{3}$/.test(code)))
            throw new Error('Production Apple requires explicit supported storefronts');
        this.storefronts = new Set(allowedStorefronts);
    }
    async verifyClientTransaction(input) {
        const transaction = await this.transaction(input.signedTransaction);
        if (uuid(transaction.appAccountToken) !== uuid(input.expectedAppAccountToken))
            throw new Error('Production Apple client transaction ownership mismatch');
        // Historical receipts retain their signed storefront after the device moves country.
        // A new purchase's current storefront is checked by its separate quote/preflight.
        const receipt = appleReceiptEvidence(transaction, input.signedTransaction);
        return this.signal(input.signedTransaction, `client-transaction:${transaction.transactionId}:${receipt.proofSha256}`, 'CLIENT_SIGNED_TRANSACTION', 'subscription_changed', time(transaction.signedDate), transaction, null, receipt);
    }
    async verifyNotification(signedPayload) {
        bounded(signedPayload);
        const notification = await (await this.source).verifyAndDecodeNotification(signedPayload);
        const data = notification.data;
        if (!data || data.environment !== this.context.signedEnvironment || data.bundleId !== rilloraAppleIdentity.bundleId
            || !matchesAppleAppId(data.appAppleId, rilloraAppleIdentity.appAppleId, this.context))
            throw new Error('Apple notification identity mismatch');
        const transaction = data.signedTransactionInfo ? await this.transaction(data.signedTransactionInfo) : null;
        const renewal = data.signedRenewalInfo ? await this.renewal(data.signedRenewalInfo) : null;
        matchSubjects(transaction, renewal);
        const type = identifier(notification.notificationType);
        return this.signal(signedPayload, uuid(notification.notificationUUID), type + (notification.subtype ? ':' + identifier(notification.subtype) : ''), signalType(type), time(notification.signedDate), transaction, renewal, transaction ? appleReceiptEvidence(transaction, data.signedTransactionInfo) : null);
    }
    async verifySubscriptionStatus(input) {
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
    async transaction(signedTransaction) {
        bounded(signedTransaction);
        const transaction = await (await this.source).verifyAndDecodeTransaction(signedTransaction);
        if (transaction.environment !== this.context.signedEnvironment || transaction.bundleId !== rilloraAppleIdentity.bundleId
            || transaction.subscriptionGroupIdentifier !== rilloraAppleIdentity.subscriptionGroupId
            || !productIds.has(transaction.productId ?? '') || !this.storefronts.has(transaction.storefront ?? '')
            || transaction.type !== Type.AUTO_RENEWABLE_SUBSCRIPTION || transaction.quantity !== 1
            || transaction.inAppOwnershipType !== InAppOwnershipType.PURCHASED || transaction.advancedCommerceInfo
            || transaction.commitmentInfo !== undefined
            || (transaction.billingPlanType !== undefined && transaction.billingPlanType !== BillingPlanType.BILLED_UPFRONT)) {
            throw new Error('Production Apple transaction does not match the supported individual Family subscription');
        }
        z.string().regex(/^[0-9]{1,40}$/).parse(transaction.transactionId);
        z.string().regex(/^[0-9]{1,40}$/).parse(transaction.originalTransactionId);
        time(transaction.signedDate);
        time(transaction.purchaseDate);
        time(transaction.expiresDate);
        if (time(transaction.expiresDate) <= time(transaction.purchaseDate))
            throw new Error('Production Apple subscription period is invalid');
        if (!Number.isSafeInteger(transaction.price) || transaction.price <= 0 || !/^[A-Z]{3}$/.test(transaction.currency ?? '')) {
            throw new Error('Production Apple requires the signed amount and currency for versioned mapping');
        }
        return transaction;
    }
    async renewal(signedRenewalInfo) {
        bounded(signedRenewalInfo);
        const renewal = await (await this.source).verifyAndDecodeRenewalInfo(signedRenewalInfo);
        if (renewal.environment !== this.context.signedEnvironment || !productIds.has(renewal.productId ?? '')
            || renewal.advancedCommerceInfo || renewal.commitmentInfo !== undefined
            || (renewal.renewalBillingPlanType !== undefined && renewal.renewalBillingPlanType !== RenewalBillingPlanType.BILLED_UPFRONT)
            || (renewal.autoRenewProductId !== undefined && !productIds.has(renewal.autoRenewProductId)))
            throw new Error('Production Apple renewal binding mismatch');
        identifier(renewal.originalTransactionId);
        time(renewal.signedDate);
        return renewal;
    }
    signal(raw, reference, sourceEventType, type, signedAt, transaction, renewal, receipt) {
        const token = transaction?.appAccountToken ?? renewal?.appAccountToken;
        return Object.freeze({ provider: 'storekit', providerEnvironment: this.context.environment, providerEventReference: reference,
            sourceEventType, signalType: type, occurredAt: new Date(signedAt).toISOString(),
            providerSubscriptionReference: transaction?.originalTransactionId ?? renewal?.originalTransactionId ?? null,
            providerTransactionReference: transaction?.transactionId ?? null,
            providerRefundReference: sourceEventType === 'REFUND' ? transaction?.transactionId ?? null : null,
            accountBindingReference: token === undefined ? null : uuid(token), payloadSha256: createHash('sha256').update(raw).digest('base64url'),
            signatureVerified: true, verificationMode: 'apple_server_library_x5c', requiresAuthoritativeSnapshot: true, receipt });
    }
}
function matchSubjects(transaction, renewal) {
    if (!transaction || !renewal)
        return;
    if (transaction.originalTransactionId !== renewal.originalTransactionId || transaction.productId !== renewal.productId
        || (transaction.appAccountToken && renewal.appAccountToken && uuid(transaction.appAccountToken) !== uuid(renewal.appAccountToken))) {
        throw new Error('Production Apple transaction and renewal subjects conflict');
    }
}
function uuid(value) { return z.uuid().parse(value).toLowerCase(); }
function identifier(value) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 255)
        throw new Error('Apple reference is missing or invalid');
    return value;
}
function time(value) {
    if (!Number.isSafeInteger(value) || value < 0 || !Number.isFinite(new Date(value).getTime()))
        throw new Error('Apple signed time is missing or invalid');
    return value;
}
function bounded(value) {
    if (typeof value !== 'string' || Buffer.byteLength(value) === 0 || Buffer.byteLength(value) > 256 * 1024)
        throw new Error('Apple signed payload exceeds its boundary');
}
function signalType(type) {
    if (['SUBSCRIBED', 'DID_CHANGE_RENEWAL_PREF', 'DID_CHANGE_RENEWAL_STATUS', 'OFFER_REDEEMED', 'RENEWAL_EXTENDED'].includes(type))
        return 'subscription_changed';
    if (type === 'DID_RENEW')
        return 'renewal_paid';
    if (type === 'DID_FAIL_TO_RENEW')
        return 'renewal_failed';
    if (['EXPIRED', 'GRACE_PERIOD_EXPIRED', 'REVOKE'].includes(type))
        return 'subscription_ended';
    if (['REFUND', 'REFUND_DECLINED', 'REFUND_REVERSED', 'CONSUMPTION_REQUEST'].includes(type))
        return 'refund_changed';
    return 'unsupported';
}
