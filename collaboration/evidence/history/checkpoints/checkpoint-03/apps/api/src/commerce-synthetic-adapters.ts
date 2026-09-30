import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import {
  compactVerify,
  decodeProtectedHeader,
  type KeyInput,
} from "jose";
import { z } from "zod";
import type {
  CommerceProviderSignalType,
  NormalizedProviderSignal,
} from "./commerce-provider-contract.js";

const maximumSyntheticPayloadBytes = 256 * 1024;

const stripeEventSchema = z.object({
  id: z.string().min(1).max(255),
  type: z.string().min(1).max(160),
  created: z.number().int().nonnegative(),
  livemode: z.literal(false),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }).strict(),
}).passthrough();

const appleNotificationSchema = z.object({
  notificationUUID: z.string().min(1).max(255),
  notificationType: z.string().min(1).max(160),
  subtype: z.string().min(1).max(160).optional(),
  signedDate: z.number().int().nonnegative(),
  data: z.object({
    bundleId: z.string().min(1).max(255),
    environment: z.string().min(1).max(32),
    signedTransactionInfo: z.string().min(1).max(maximumSyntheticPayloadBytes).optional(),
    signedRenewalInfo: z.string().min(1).max(maximumSyntheticPayloadBytes).optional(),
    status: z.number().int().optional(),
  }).passthrough(),
}).passthrough();

const appleTransactionSchema = z.object({
  originalTransactionId: z.string().min(1).max(255),
  transactionId: z.string().min(1).max(255),
  productId: z.string().min(1).max(255),
  bundleId: z.string().min(1).max(255),
  environment: z.string().min(1).max(32),
}).passthrough();

const appleRenewalSchema = z.object({
  originalTransactionId: z.string().min(1).max(255),
  autoRenewStatus: z.number().int().optional(),
}).passthrough();

export function verifySyntheticStripeWebhook(input: {
  rawBody: Uint8Array;
  signatureHeader: string;
  endpointSecrets: readonly string[];
  now: Date;
  toleranceSeconds?: number;
}): NormalizedProviderSignal {
  const rawBody = Buffer.from(input.rawBody);
  assertBoundedPayload(rawBody);
  const toleranceSeconds = input.toleranceSeconds ?? 300;
  if (!Number.isInteger(toleranceSeconds) || toleranceSeconds <= 0 || toleranceSeconds > 900) {
    throw new Error("Synthetic Stripe signature tolerance is invalid");
  }
  const { timestamp, signatures } = parseStripeSignatureHeader(input.signatureHeader);
  const ageSeconds = Math.abs(Math.floor(input.now.getTime() / 1_000) - timestamp);
  if (ageSeconds > toleranceSeconds) {
    throw new Error("Synthetic Stripe signature timestamp is outside the accepted window");
  }
  if (input.endpointSecrets.length === 0 || input.endpointSecrets.some((secret) => secret.length < 16)) {
    throw new Error("Synthetic Stripe endpoint secrets are missing or too short");
  }
  const signedBytes = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), rawBody]);
  const signatureVerified = input.endpointSecrets.some((secret) => {
    const expected = createHmac("sha256", secret).update(signedBytes).digest();
    return signatures.some((candidate) => {
      if (!/^[a-f0-9]{64}$/i.test(candidate)) return false;
      const received = Buffer.from(candidate, "hex");
      return received.length === expected.length && timingSafeEqual(received, expected);
    });
  });
  if (!signatureVerified) throw new Error("Synthetic Stripe signature verification failed");

  const payload = stripeEventSchema.parse(parseJson(rawBody));
  const object = payload.data.object;
  const providerSubscriptionReference = stripeSubscriptionReference(payload.type, object);
  return Object.freeze({
    provider: "stripe",
    providerEnvironment: "test",
    providerEventReference: payload.id,
    sourceEventType: payload.type,
    signalType: stripeSignalType(payload.type),
    occurredAt: new Date(payload.created * 1_000).toISOString(),
    providerSubscriptionReference,
    providerTransactionReference: firstString(object.payment_intent, object.charge),
    providerRefundReference: payload.type.startsWith("refund.")
      ? firstString(object.id)
      : null,
    payloadSha256: sha256Base64Url(rawBody),
    signatureVerified: true,
    verificationMode: "synthetic_stripe_hmac_sha256",
    requiresAuthoritativeSnapshot: true,
  });
}

/**
 * Test-only Apple verifier. Production App Store JWS uses an x5c certificate chain
 * rooted in Apple PKI and must use Apple's Server Library or an independently reviewed
 * equivalent. This helper intentionally accepts only a pinned synthetic ES256 key.
 */
export async function verifySyntheticAppleNotification(input: {
  signedPayload: string;
  trustedPublicKeys: ReadonlyMap<string, KeyInput>;
  expectedBundleId: string;
}): Promise<NormalizedProviderSignal> {
  assertBoundedPayload(Buffer.from(input.signedPayload, "utf8"));
  const topLevel = await verifyPinnedSyntheticJws(
    input.signedPayload,
    input.trustedPublicKeys,
  );
  const notification = appleNotificationSchema.parse(topLevel);
  if (notification.data.bundleId !== input.expectedBundleId) {
    throw new Error("Synthetic Apple notification bundle identifier mismatch");
  }
  if (normalizeAppleEnvironment(notification.data.environment) !== "sandbox") {
    throw new Error("Synthetic Apple adapter refuses production notifications");
  }

  const transaction = notification.data.signedTransactionInfo
    ? appleTransactionSchema.parse(await verifyPinnedSyntheticJws(
        notification.data.signedTransactionInfo,
        input.trustedPublicKeys,
      ))
    : null;
  const renewal = notification.data.signedRenewalInfo
    ? appleRenewalSchema.parse(await verifyPinnedSyntheticJws(
        notification.data.signedRenewalInfo,
        input.trustedPublicKeys,
      ))
    : null;

  if (transaction) {
    if (transaction.bundleId !== input.expectedBundleId) {
      throw new Error("Synthetic Apple transaction bundle identifier mismatch");
    }
    if (normalizeAppleEnvironment(transaction.environment) !== "sandbox") {
      throw new Error("Synthetic Apple transaction environment mismatch");
    }
  }
  if (
    transaction
    && renewal
    && transaction.originalTransactionId !== renewal.originalTransactionId
  ) {
    throw new Error("Synthetic Apple transaction and renewal subjects do not match");
  }

  return Object.freeze({
    provider: "storekit",
    providerEnvironment: "sandbox",
    providerEventReference: notification.notificationUUID,
    sourceEventType: notification.subtype
      ? `${notification.notificationType}:${notification.subtype}`
      : notification.notificationType,
    signalType: appleSignalType(notification.notificationType),
    occurredAt: new Date(notification.signedDate).toISOString(),
    providerSubscriptionReference:
      transaction?.originalTransactionId ?? renewal?.originalTransactionId ?? null,
    providerTransactionReference: transaction?.transactionId ?? null,
    providerRefundReference: notification.notificationType === "REFUND"
      ? transaction?.transactionId ?? null
      : null,
    payloadSha256: sha256Base64Url(Buffer.from(input.signedPayload, "utf8")),
    signatureVerified: true,
    verificationMode: "synthetic_apple_pinned_es256",
    requiresAuthoritativeSnapshot: true,
  });
}

function parseStripeSignatureHeader(header: string): {
  timestamp: number;
  signatures: string[];
} {
  const values = header.split(",").map((part) => part.trim().split("=", 2));
  const timestampText = values.find(([key]) => key === "t")?.[1];
  const signatures = values
    .filter(([key, value]) => key === "v1" && typeof value === "string")
    .map(([, value]) => value as string);
  if (!timestampText || !/^\d{1,12}$/.test(timestampText) || signatures.length === 0) {
    throw new Error("Synthetic Stripe signature header is malformed");
  }
  const timestamp = Number(timestampText);
  if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
    throw new Error("Synthetic Stripe signature timestamp is invalid");
  }
  return { timestamp, signatures };
}

async function verifyPinnedSyntheticJws(
  compactJws: string,
  trustedPublicKeys: ReadonlyMap<string, KeyInput>,
): Promise<unknown> {
  const header = decodeProtectedHeader(compactJws);
  if (header.alg !== "ES256" || typeof header.kid !== "string" || header.x5c !== undefined) {
    throw new Error("Synthetic Apple JWS header is not a pinned ES256 fixture");
  }
  const key = trustedPublicKeys.get(header.kid);
  if (!key) throw new Error("Synthetic Apple JWS key is not trusted");
  const verified = await compactVerify(compactJws, key, { algorithms: ["ES256"] });
  return parseJson(Buffer.from(verified.payload));
}

function stripeSignalType(eventType: string): CommerceProviderSignalType {
  if (["customer.subscription.created", "customer.subscription.updated"].includes(eventType)) {
    return "subscription_changed";
  }
  if (eventType === "customer.subscription.deleted") return "subscription_ended";
  if (eventType === "invoice.paid") return "renewal_paid";
  if (eventType === "invoice.payment_failed") return "renewal_failed";
  if (["refund.created", "refund.updated", "refund.failed", "charge.refunded"].includes(eventType)) {
    return "refund_changed";
  }
  if (eventType.startsWith("charge.dispute.")) return "dispute_changed";
  return "unsupported";
}

function appleSignalType(notificationType: string): CommerceProviderSignalType {
  if (["SUBSCRIBED", "DID_CHANGE_RENEWAL_STATUS", "RENEWAL_EXTENDED"].includes(notificationType)) {
    return "subscription_changed";
  }
  if (notificationType === "DID_RENEW") return "renewal_paid";
  if (notificationType === "DID_FAIL_TO_RENEW") return "renewal_failed";
  if (["EXPIRED", "GRACE_PERIOD_EXPIRED", "REVOKE"].includes(notificationType)) {
    return "subscription_ended";
  }
  if (["REFUND", "REFUND_REVERSED", "CONSUMPTION_REQUEST"].includes(notificationType)) {
    return "refund_changed";
  }
  return "unsupported";
}

function stripeSubscriptionReference(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  if (eventType.startsWith("customer.subscription.")) return firstString(object.id);
  const direct = firstString(object.subscription);
  if (direct) return direct;
  const metadata = object.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return firstString((metadata as Record<string, unknown>).rillora_subscription_reference);
  }
  return null;
}

function normalizeAppleEnvironment(value: string): "sandbox" | "production" {
  const normalized = value.toLowerCase();
  if (normalized === "sandbox") return "sandbox";
  if (normalized === "production") return "production";
  throw new Error("Synthetic Apple environment is unknown");
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0 && value.length <= 255) return value;
  }
  return null;
}

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch {
    throw new Error("Synthetic provider payload is not valid JSON");
  }
}

function assertBoundedPayload(payload: Uint8Array): void {
  if (payload.byteLength === 0 || payload.byteLength > maximumSyntheticPayloadBytes) {
    throw new Error("Synthetic provider payload is outside the accepted size boundary");
  }
}

function sha256Base64Url(payload: Uint8Array): string {
  return createHash("sha256").update(payload).digest("base64url");
}

