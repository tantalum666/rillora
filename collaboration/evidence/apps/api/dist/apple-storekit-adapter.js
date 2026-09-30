import { createHash, timingSafeEqual, } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Environment, SignedDataVerifier, } from "@apple/app-store-server-library";
import { z } from "zod";
const maximumSignedPayloadBytes = 256 * 1024;
const appleRootCertificates = Object.freeze([
    Object.freeze({
        filename: "AppleIncRootCertificate.cer",
        sha256: "b0b1730ecbc7ff4505142c49f1295e6eda6bcaed7e2c68c5be91b5a11001f024",
    }),
    Object.freeze({
        filename: "AppleRootCA-G2.cer",
        sha256: "c2b9b042dd57830e7d117dac55ac8ae19407d38e41d88f3215bc3a890444a050",
    }),
    Object.freeze({
        filename: "AppleRootCA-G3.cer",
        sha256: "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179",
    }),
]);
export const rilloraAppleSandboxContract = Object.freeze({
    bundleId: "com.rillora.ios",
    appAppleId: 6803957639,
    subscriptionGroupId: "22325627",
    productIds: new Set([
        "com.rillora.family.monthly",
        "com.rillora.family.annual",
    ]),
    storefrontCountryCodes: new Set([
        "USA",
        "CAN",
        "GBR",
        "IRL",
        "JPN",
        "BRA",
        "KOR",
        "HKG",
    ]),
});
const uuidSchema = z.string().uuid();
export async function createRilloraAppleSandboxVerifier(input) {
    const roots = await loadPinnedAppleRootCertificates(input.rootCertificateDirectory);
    return new SignedDataVerifier(roots, input.enableOnlineChecks ?? true, Environment.SANDBOX, rilloraAppleSandboxContract.bundleId);
}
export async function loadPinnedAppleRootCertificates(rootCertificateDirectory) {
    return Promise.all(appleRootCertificates.map(async ({ filename, sha256 }) => {
        const certificate = await readFile(join(rootCertificateDirectory, filename));
        if (certificate.byteLength === 0 || certificate.byteLength > 32 * 1024) {
            throw new Error(`Apple root certificate ${filename} is outside the size boundary`);
        }
        const received = createHash("sha256").update(certificate).digest();
        const expected = Buffer.from(sha256, "hex");
        if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
            throw new Error(`Apple root certificate ${filename} digest mismatch`);
        }
        return certificate;
    }));
}
export async function verifyAppleSandboxNotification(input) {
    const contract = input.contract ?? rilloraAppleSandboxContract;
    assertSignedPayload(input.signedPayload);
    const notification = await input.verifier.verifyAndDecodeNotification(input.signedPayload);
    const notificationUUID = requiredString(notification.notificationUUID, "Apple notification UUID");
    const notificationType = requiredString(notification.notificationType, "Apple notification type");
    const signedDate = requiredEpochMilliseconds(notification.signedDate, "Apple notification signed date");
    const data = notification.data;
    if (!data)
        throw new Error("Apple notification data is missing");
    assertBundleAndSandboxEnvironment(data.bundleId, data.environment, contract);
    const transaction = data.signedTransactionInfo
        ? await verifyTransaction({
            signedTransaction: data.signedTransactionInfo,
            verifier: input.verifier,
            contract,
        })
        : null;
    const renewal = data.signedRenewalInfo
        ? await verifyRenewal({
            signedRenewalInfo: data.signedRenewalInfo,
            verifier: input.verifier,
            contract,
        })
        : null;
    assertMatchingSubjects(transaction, renewal);
    const appAccountToken = normalizedAppAccountToken(transaction?.appAccountToken, renewal?.appAccountToken);
    const sourceEventType = notification.subtype
        ? `${notificationType}:${notification.subtype}`
        : notificationType;
    return Object.freeze({
        provider: "storekit",
        providerEnvironment: "sandbox",
        providerEventReference: notificationUUID,
        sourceEventType,
        signalType: appleSignalType(notificationType),
        occurredAt: new Date(signedDate).toISOString(),
        providerSubscriptionReference: transaction?.originalTransactionId ?? renewal?.originalTransactionId ?? null,
        providerTransactionReference: transaction?.transactionId ?? null,
        providerRefundReference: notificationType === "REFUND"
            ? transaction?.transactionId ?? null
            : null,
        accountBindingReference: appAccountToken,
        payloadSha256: createHash("sha256")
            .update(input.signedPayload, "utf8")
            .digest("base64url"),
        signatureVerified: true,
        verificationMode: "apple_server_library_x5c",
        requiresAuthoritativeSnapshot: true,
    });
}
export async function verifyAppleSandboxClientTransaction(input) {
    const contract = input.contract ?? rilloraAppleSandboxContract;
    assertSignedPayload(input.signedTransaction);
    const expectedAppAccountToken = uuidSchema.parse(input.expectedAppAccountToken);
    if (!contract.storefrontCountryCodes.has(input.expectedStorefrontCountryCode)) {
        throw new Error("Expected Apple storefront is outside the Sandbox matrix");
    }
    const transaction = await verifyTransaction({
        signedTransaction: input.signedTransaction,
        verifier: input.verifier,
        contract,
    });
    const transactionId = requiredString(transaction.transactionId, "Apple transaction ID");
    const originalTransactionId = requiredString(transaction.originalTransactionId, "Apple original transaction ID");
    const appAccountToken = requiredUuid(transaction.appAccountToken, "Apple app account token");
    if (appAccountToken !== expectedAppAccountToken) {
        throw new Error("Apple transaction app account token mismatch");
    }
    if (transaction.storefront !== input.expectedStorefrontCountryCode) {
        throw new Error("Apple transaction storefront mismatch");
    }
    const occurredAt = requiredEpochMilliseconds(transaction.signedDate ?? transaction.purchaseDate, "Apple transaction signed date");
    return Object.freeze({
        provider: "storekit",
        providerEnvironment: "sandbox",
        providerEventReference: `client-transaction:${transactionId}`,
        sourceEventType: "CLIENT_SIGNED_TRANSACTION",
        signalType: "subscription_changed",
        occurredAt: new Date(occurredAt).toISOString(),
        providerSubscriptionReference: originalTransactionId,
        providerTransactionReference: transactionId,
        providerRefundReference: transaction.revocationDate ? transactionId : null,
        accountBindingReference: appAccountToken,
        payloadSha256: createHash("sha256")
            .update(input.signedTransaction, "utf8")
            .digest("base64url"),
        signatureVerified: true,
        verificationMode: "apple_server_library_x5c",
        requiresAuthoritativeSnapshot: true,
    });
}
export async function verifyAppleSandboxSubscriptionStatus(input) {
    const contract = input.contract ?? rilloraAppleSandboxContract;
    const expectedAppAccountToken = uuidSchema.parse(input.expectedAppAccountToken);
    const transaction = await verifyTransaction({
        signedTransaction: input.signedTransaction,
        verifier: input.verifier,
        contract,
    });
    const renewal = await verifyRenewal({
        signedRenewalInfo: input.signedRenewalInfo,
        verifier: input.verifier,
        contract,
    });
    assertMatchingSubjects(transaction, renewal);
    if (transaction.originalTransactionId !== input.expectedOriginalTransactionId
        || renewal.originalTransactionId !== input.expectedOriginalTransactionId) {
        throw new Error("Apple Server API subscription subject mismatch");
    }
    const appAccountToken = normalizedAppAccountToken(transaction.appAccountToken, renewal.appAccountToken);
    if (appAccountToken !== expectedAppAccountToken) {
        throw new Error("Apple Server API app account token mismatch");
    }
    return Object.freeze({ transaction, renewal });
}
async function verifyTransaction(input) {
    assertSignedPayload(input.signedTransaction);
    const transaction = await input.verifier.verifyAndDecodeTransaction(input.signedTransaction);
    assertBundleAndSandboxEnvironment(transaction.bundleId, transaction.environment, input.contract);
    const productId = requiredString(transaction.productId, "Apple product ID");
    if (!input.contract.productIds.has(productId)) {
        throw new Error("Apple transaction product is outside the Family allowlist");
    }
    if (transaction.subscriptionGroupIdentifier !== input.contract.subscriptionGroupId) {
        throw new Error("Apple transaction subscription group mismatch");
    }
    const storefront = requiredString(transaction.storefront, "Apple storefront");
    if (!input.contract.storefrontCountryCodes.has(storefront)) {
        throw new Error("Apple transaction storefront is outside the Sandbox matrix");
    }
    requiredString(transaction.transactionId, "Apple transaction ID");
    requiredString(transaction.originalTransactionId, "Apple original transaction ID");
    return transaction;
}
async function verifyRenewal(input) {
    assertSignedPayload(input.signedRenewalInfo);
    const renewal = await input.verifier.verifyAndDecodeRenewalInfo(input.signedRenewalInfo);
    if (renewal.environment !== Environment.SANDBOX) {
        throw new Error("Apple renewal environment mismatch");
    }
    const productId = requiredString(renewal.productId ?? renewal.autoRenewProductId, "Apple renewal product ID");
    if (!input.contract.productIds.has(productId)) {
        throw new Error("Apple renewal product is outside the Family allowlist");
    }
    requiredString(renewal.originalTransactionId, "Apple renewal original transaction ID");
    return renewal;
}
function assertBundleAndSandboxEnvironment(bundleId, environment, contract) {
    if (bundleId !== contract.bundleId) {
        throw new Error("Apple bundle identifier mismatch");
    }
    if (environment !== Environment.SANDBOX) {
        throw new Error("Apple environment mismatch");
    }
}
function assertMatchingSubjects(transaction, renewal) {
    if (transaction
        && renewal
        && transaction.originalTransactionId !== renewal.originalTransactionId) {
        throw new Error("Apple transaction and renewal subjects do not match");
    }
    if (transaction?.appAccountToken
        && renewal?.appAccountToken
        && transaction.appAccountToken !== renewal.appAccountToken) {
        throw new Error("Apple transaction and renewal account tokens do not match");
    }
}
function normalizedAppAccountToken(transactionToken, renewalToken) {
    const token = transactionToken ?? renewalToken;
    return token === undefined ? null : requiredUuid(token, "Apple app account token");
}
function requiredString(value, label) {
    if (typeof value !== "string" || value.length === 0 || value.length > 255) {
        throw new Error(`${label} is missing or invalid`);
    }
    return value;
}
function requiredUuid(value, label) {
    try {
        return uuidSchema.parse(value);
    }
    catch {
        throw new Error(`${label} is missing or invalid`);
    }
}
function requiredEpochMilliseconds(value, label) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error(`${label} is missing or invalid`);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        throw new Error(`${label} is invalid`);
    return value;
}
function assertSignedPayload(payload) {
    const size = Buffer.byteLength(payload, "utf8");
    if (size === 0 || size > maximumSignedPayloadBytes) {
        throw new Error("Apple signed payload is outside the accepted size boundary");
    }
}
function appleSignalType(notificationType) {
    if ([
        "SUBSCRIBED",
        "DID_CHANGE_RENEWAL_PREF",
        "DID_CHANGE_RENEWAL_STATUS",
        "OFFER_REDEEMED",
        "RENEWAL_EXTENDED",
    ].includes(notificationType)) {
        return "subscription_changed";
    }
    if (notificationType === "DID_RENEW")
        return "renewal_paid";
    if (notificationType === "DID_FAIL_TO_RENEW")
        return "renewal_failed";
    if (["EXPIRED", "GRACE_PERIOD_EXPIRED", "REVOKE"].includes(notificationType)) {
        return "subscription_ended";
    }
    if ([
        "REFUND",
        "REFUND_DECLINED",
        "REFUND_REVERSED",
        "CONSUMPTION_REQUEST",
    ].includes(notificationType)) {
        return "refund_changed";
    }
    return "unsupported";
}
