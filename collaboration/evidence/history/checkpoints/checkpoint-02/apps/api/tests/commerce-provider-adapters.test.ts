import { createHmac } from "node:crypto";
import {
  CompactSign,
  generateKeyPair,
  type KeyInput,
} from "jose";
import { describe, expect, it } from "vitest";
import type {
  AuthoritativeSubscriptionSnapshot,
  NormalizedProviderSignal,
} from "../src/commerce-provider-contract.js";
import { providerEventKey } from "../src/commerce-provider-contract.js";
import { reconcileCommerceProviderState } from "../src/commerce-reconciliation.js";
import {
  verifySyntheticAppleNotification,
  verifySyntheticStripeWebhook,
} from "../src/commerce-synthetic-adapters.js";

const now = new Date("2026-08-19T14:00:00.000Z");
const stripeSecret = "[REDACTED_SCANNER_LITERAL]";

describe("synthetic provider adapters", () => {
  it("verifies a Stripe-style HMAC delivery while retaining only normalized references and a digest", () => {
    const payload = stripePayload({
      id: "evt_subscription_updated",
      type: "customer.subscription.updated",
      created: epochSeconds(now) - 20,
      object: {
        id: "sub_synthetic_001",
        customer_email: "must-not-enter-normalized-output@example.invalid",
      },
    });
    const signature = stripeSignature(payload, stripeSecret, epochSeconds(now) - 20);
    const signal = verifySyntheticStripeWebhook({
      rawBody: payload,
      signatureHeader: `t=${epochSeconds(now) - 20},v1=${"0".repeat(64)},v1=${signature}`,
      endpointSecrets: ["whsec_old_rotation_secret_0000", stripeSecret],
      now,
    });

    expect(signal).toEqual(expect.objectContaining({
      provider: "stripe",
      providerEnvironment: "test",
      providerEventReference: "evt_subscription_updated",
      signalType: "subscription_changed",
      providerSubscriptionReference: "sub_synthetic_001",
      signatureVerified: true,
      requiresAuthoritativeSnapshot: true,
    }));
    expect(signal.payloadSha256).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(signal)).not.toContain("customer_email");
    expect(JSON.stringify(signal)).not.toContain("example.invalid");

    const eventMappings = [
      ["invoice.payment_failed", "renewal_failed"],
      ["customer.subscription.deleted", "subscription_ended"],
      ["refund.created", "refund_changed"],
      ["charge.dispute.created", "dispute_changed"],
    ] as const;
    for (const [type, expectedSignalType] of eventMappings) {
      const mappedPayload = stripePayload({
        id: `evt_${type.replaceAll(".", "_")}`,
        type,
        created: epochSeconds(now),
        object: {
          id: type.startsWith("customer.subscription.") ? "sub_synthetic_001" : "object_001",
          subscription: "sub_synthetic_001",
          metadata: { rillora_subscription_reference: "sub_synthetic_001" },
        },
      });
      const mapped = verifySyntheticStripeWebhook({
        rawBody: mappedPayload,
        signatureHeader: `t=${epochSeconds(now)},v1=${stripeSignature(mappedPayload, stripeSecret, epochSeconds(now))}`,
        endpointSecrets: [stripeSecret],
        now,
      });
      expect(mapped.signalType).toBe(expectedSignalType);
      expect(mapped.requiresAuthoritativeSnapshot).toBe(true);
    }
  });

  it("rejects tampered, stale, live-mode and oversized Stripe-style deliveries", () => {
    const timestamp = epochSeconds(now);
    const payload = stripePayload({
      id: "evt_paid",
      type: "invoice.paid",
      created: timestamp,
      object: { id: "in_synthetic", subscription: "sub_synthetic_001" },
    });
    const signature = stripeSignature(payload, stripeSecret, timestamp);

    expect(() => verifySyntheticStripeWebhook({
      rawBody: Buffer.from(`${payload.toString("utf8")} `),
      signatureHeader: `t=${timestamp},v1=${signature}`,
      endpointSecrets: [stripeSecret],
      now,
    })).toThrow("verification failed");
    expect(() => verifySyntheticStripeWebhook({
      rawBody: payload,
      signatureHeader: `t=${timestamp - 301},v1=${stripeSignature(payload, stripeSecret, timestamp - 301)}`,
      endpointSecrets: [stripeSecret],
      now,
    })).toThrow("outside the accepted window");

    const livePayload = Buffer.from(JSON.stringify({
      ...JSON.parse(payload.toString("utf8")),
      livemode: true,
    }));
    expect(() => verifySyntheticStripeWebhook({
      rawBody: livePayload,
      signatureHeader: `t=${timestamp},v1=${stripeSignature(livePayload, stripeSecret, timestamp)}`,
      endpointSecrets: [stripeSecret],
      now,
    })).toThrow();
    expect(() => verifySyntheticStripeWebhook({
      rawBody: Buffer.alloc(256 * 1024 + 1),
      signatureHeader: `t=${timestamp},v1=${signature}`,
      endpointSecrets: [stripeSecret],
      now,
    })).toThrow("outside the accepted size boundary");
  });

  it("verifies a pinned synthetic Apple notification and both nested JWS subjects", async () => {
    const fixture = await appleFixture({ notificationType: "DID_RENEW" });
    const signal = await verifySyntheticAppleNotification({
      signedPayload: fixture.signedPayload,
      trustedPublicKeys: fixture.trustedPublicKeys,
      expectedBundleId: "com.rillora.ios",
    });

    expect(signal).toEqual(expect.objectContaining({
      provider: "storekit",
      providerEnvironment: "sandbox",
      signalType: "renewal_paid",
      providerEventReference: "apple-notification-001",
      providerSubscriptionReference: "apple-original-001",
      providerTransactionReference: "apple-transaction-002",
      signatureVerified: true,
      verificationMode: "synthetic_apple_pinned_es256",
      requiresAuthoritativeSnapshot: true,
    }));

    const notificationMappings = [
      ["DID_FAIL_TO_RENEW", "renewal_failed"],
      ["EXPIRED", "subscription_ended"],
      ["REFUND", "refund_changed"],
    ] as const;
    for (const [notificationType, expectedSignalType] of notificationMappings) {
      const mappedFixture = await appleFixture({ notificationType });
      const mapped = await verifySyntheticAppleNotification({
        signedPayload: mappedFixture.signedPayload,
        trustedPublicKeys: mappedFixture.trustedPublicKeys,
        expectedBundleId: "com.rillora.ios",
      });
      expect(mapped.signalType).toBe(expectedSignalType);
      expect(mapped.requiresAuthoritativeSnapshot).toBe(true);
    }
  });

  it("rejects tampered Apple fixtures, mismatched nested subjects and production-shaped input", async () => {
    const fixture = await appleFixture({ notificationType: "DID_RENEW" });
    await expect(verifySyntheticAppleNotification({
      signedPayload: tamperCompactJws(fixture.signedPayload),
      trustedPublicKeys: fixture.trustedPublicKeys,
      expectedBundleId: "com.rillora.ios",
    })).rejects.toThrow();

    const mismatched = await appleFixture({
      notificationType: "DID_RENEW",
      renewalOriginalTransactionId: "apple-original-other",
    });
    await expect(verifySyntheticAppleNotification({
      signedPayload: mismatched.signedPayload,
      trustedPublicKeys: mismatched.trustedPublicKeys,
      expectedBundleId: "com.rillora.ios",
    })).rejects.toThrow("subjects do not match");

    const production = await appleFixture({
      notificationType: "DID_RENEW",
      environment: "Production",
    });
    await expect(verifySyntheticAppleNotification({
      signedPayload: production.signedPayload,
      trustedPublicKeys: production.trustedPublicKeys,
      expectedBundleId: "com.rillora.ios",
    })).rejects.toThrow("refuses production notifications");
  });
});

describe("provider-neutral reconciliation", () => {
  it("never grants access from a verified delivery without a fresh authoritative snapshot", () => {
    const signal = syntheticSignal({
      providerEventReference: "evt_without_snapshot",
      occurredAt: "2026-08-19T14:00:00.000Z",
    });
    const result = reconcileCommerceProviderState({ signals: [signal], snapshots: [] });

    expect(result.grantsAccessFromProviderSignal).toBe(false);
    expect(result.eventOutcomes).toEqual([{
      eventKey: providerEventKey(signal),
      status: "needs_authoritative_snapshot",
    }]);
    expect(result.entitlementDecisions).toEqual([]);
  });

  it("is idempotent and reconciles out-of-order signals only against a newer snapshot", () => {
    const older = syntheticSignal({
      providerEventReference: "evt_older_paid",
      signalType: "renewal_paid",
      occurredAt: "2026-08-19T13:00:00.000Z",
    });
    const newer = syntheticSignal({
      providerEventReference: "evt_newer_changed",
      signalType: "subscription_changed",
      occurredAt: "2026-08-19T13:30:00.000Z",
    });
    const snapshot = syntheticSnapshot({
      state: "active",
      observedAt: "2026-08-19T13:31:00.000Z",
    });
    const result = reconcileCommerceProviderState({
      signals: [newer, older, newer],
      snapshots: [snapshot],
      processedEventKeys: new Set([providerEventKey(older)]),
    });

    expect(result.eventOutcomes).toEqual(expect.arrayContaining([
      { eventKey: providerEventKey(older), status: "duplicate" },
      { eventKey: providerEventKey(newer), status: "duplicate" },
      { eventKey: providerEventKey(newer), status: "covered_by_authoritative_snapshot" },
    ]));
    expect(result.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "grant",
      targetState: "active",
      renewalProvider: "stripe",
      reason: "authoritative_access_bearing_state",
    })]);

    const conflictingSameMoment = syntheticSnapshot({
      state: "past_due",
      observedAt: snapshot.observedAt,
    });
    for (const snapshots of [
      [snapshot, conflictingSameMoment],
      [conflictingSameMoment, snapshot],
    ]) {
      expect(() => reconcileCommerceProviderState({
        signals: [],
        snapshots,
      })).toThrow("conflicting snapshots at the same observation time");
    }
  });

  it("holds when the snapshot predates a signal, then grants grace and revokes past-due access", () => {
    const signal = syntheticSignal({
      providerEventReference: "evt_payment_failed",
      signalType: "renewal_failed",
      occurredAt: "2026-08-19T13:30:00.000Z",
    });
    const stale = reconcileCommerceProviderState({
      signals: [signal],
      snapshots: [syntheticSnapshot({
        state: "active",
        observedAt: "2026-08-19T13:29:59.000Z",
      })],
    });
    expect(stale.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "hold",
      reason: "snapshot_older_than_signal",
    })]);

    const grace = reconcileCommerceProviderState({
      signals: [signal],
      snapshots: [syntheticSnapshot({
        state: "grace",
        observedAt: "2026-08-19T13:31:00.000Z",
      })],
    });
    expect(grace.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "grant",
      targetState: "grace",
    })]);

    const canceledAtPeriodEnd = reconcileCommerceProviderState({
      signals: [signal],
      snapshots: [syntheticSnapshot({
        state: "cancel_at_period_end",
        cancelAtPeriodEnd: true,
        observedAt: "2026-08-19T13:31:30.000Z",
      })],
    });
    expect(canceledAtPeriodEnd.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "grant",
      targetState: "cancel_at_period_end",
    })]);

    const pastDue = reconcileCommerceProviderState({
      signals: [signal],
      snapshots: [syntheticSnapshot({
        state: "past_due",
        observedAt: "2026-08-19T13:32:00.000Z",
      })],
    });
    expect(pastDue.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "revoke",
      targetState: "past_due",
      reason: "authoritative_non_access_state",
    })]);
  });

  it("revokes from authoritative refund state and holds a cross-provider active conflict", () => {
    const refundSignal = syntheticSignal({
      providerEventReference: "evt_refund",
      signalType: "refund_changed",
      occurredAt: "2026-08-19T13:30:00.000Z",
    });
    const refunded = reconcileCommerceProviderState({
      signals: [refundSignal],
      snapshots: [syntheticSnapshot({
        state: "refunded",
        observedAt: "2026-08-19T13:31:00.000Z",
      })],
    });
    expect(refunded.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "revoke",
      targetState: "refunded",
    })]);

    const conflict = reconcileCommerceProviderState({
      signals: [],
      snapshots: [
        syntheticSnapshot({ state: "active", observedAt: "2026-08-19T13:31:00.000Z" }),
        syntheticSnapshot({
          provider: "storekit",
          providerEnvironment: "sandbox",
          providerSubscriptionReference: "apple-original-001",
          state: "active",
          observedAt: "2026-08-19T13:32:00.000Z",
          source: "synthetic_fixture",
        }),
      ],
    });
    expect(conflict.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "hold",
      targetState: null,
      renewalProvider: null,
      reason: "duplicate_active_subscription_conflict",
    })]);

    const sameProviderConflict = reconcileCommerceProviderState({
      signals: [],
      snapshots: [
        syntheticSnapshot({ state: "active", observedAt: "2026-08-19T13:31:00.000Z" }),
        syntheticSnapshot({
          providerSubscriptionReference: "sub_synthetic_duplicate",
          state: "grace",
          observedAt: "2026-08-19T13:32:00.000Z",
        }),
      ],
    });
    expect(sameProviderConflict.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "hold",
      reason: "duplicate_active_subscription_conflict",
    })]);

    const activeAlongsideOldExpiredProvider = reconcileCommerceProviderState({
      signals: [],
      snapshots: [
        syntheticSnapshot({ state: "active", observedAt: "2026-08-19T13:31:00.000Z" }),
        syntheticSnapshot({
          provider: "storekit",
          providerEnvironment: "sandbox",
          providerSubscriptionReference: "apple-original-expired",
          state: "expired_read_only",
          observedAt: "2026-08-19T13:32:00.000Z",
          source: "synthetic_fixture",
        }),
      ],
    });
    expect(activeAlongsideOldExpiredProvider.entitlementDecisions).toEqual([expect.objectContaining({
      directive: "grant",
      targetState: "active",
      renewalProvider: "stripe",
    })]);
  });
});

function stripePayload(input: {
  id: string;
  type: string;
  created: number;
  object: Record<string, unknown>;
}): Buffer {
  return Buffer.from(JSON.stringify({
    id: input.id,
    object: "event",
    type: input.type,
    created: input.created,
    livemode: false,
    data: { object: input.object },
  }));
}

function stripeSignature(payload: Uint8Array, secret: string, timestamp: number): string {
  return createHmac("sha256", secret)
    .update(Buffer.concat([Buffer.from(`${timestamp}.`), Buffer.from(payload)]))
    .digest("hex");
}

async function appleFixture(input: {
  notificationType: string;
  renewalOriginalTransactionId?: string;
  environment?: "Sandbox" | "Production";
}) {
  const keyId = "synthetic-apple-key-1";
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: false });
  const environment = input.environment ?? "Sandbox";
  const transaction = await signAppleFixture({
    originalTransactionId: "apple-original-001",
    transactionId: "apple-transaction-002",
    productId: "com.rillora.family.annual.synthetic",
    bundleId: "com.rillora.ios",
    environment,
  }, privateKey, keyId);
  const renewal = await signAppleFixture({
    originalTransactionId: input.renewalOriginalTransactionId ?? "apple-original-001",
    autoRenewStatus: 1,
  }, privateKey, keyId);
  const signedPayload = await signAppleFixture({
    notificationUUID: "apple-notification-001",
    notificationType: input.notificationType,
    signedDate: now.getTime(),
    data: {
      bundleId: "com.rillora.ios",
      environment,
      signedTransactionInfo: transaction,
      signedRenewalInfo: renewal,
      status: 1,
    },
  }, privateKey, keyId);
  return {
    signedPayload,
    trustedPublicKeys: new Map<string, KeyInput>([[keyId, publicKey]]),
  };
}

async function signAppleFixture(
  payload: Record<string, unknown>,
  privateKey: KeyInput,
  keyId: string,
): Promise<string> {
  return new CompactSign(Buffer.from(JSON.stringify(payload)))
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .sign(privateKey);
}

function syntheticSignal(
  overrides: Partial<NormalizedProviderSignal> = {},
): NormalizedProviderSignal {
  return Object.freeze({
    provider: "stripe",
    providerEnvironment: "test",
    providerEventReference: "evt_synthetic",
    sourceEventType: "customer.subscription.updated",
    signalType: "subscription_changed",
    occurredAt: "2026-08-19T13:00:00.000Z",
    providerSubscriptionReference: "sub_synthetic_001",
    providerTransactionReference: null,
    providerRefundReference: null,
    payloadSha256: "A".repeat(43),
    signatureVerified: true,
    verificationMode: "synthetic_stripe_hmac_sha256",
    requiresAuthoritativeSnapshot: true,
    ...overrides,
  });
}

function syntheticSnapshot(
  overrides: Partial<AuthoritativeSubscriptionSnapshot> = {},
): AuthoritativeSubscriptionSnapshot {
  return Object.freeze({
    provider: "stripe",
    providerEnvironment: "test",
    providerSubscriptionReference: "sub_synthetic_001",
    commerceAccountReference: "commerce-account-global-001",
    planCode: "family",
    state: "active",
    observedAt: "2026-08-19T13:31:00.000Z",
    currentPeriodEndsAt: "2026-09-19T13:31:00.000Z",
    cancelAtPeriodEnd: false,
    source: "synthetic_fixture",
    ...overrides,
  });
}

function epochSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1_000);
}

function tamperCompactJws(value: string): string {
  const parts = value.split(".");
  if (parts.length !== 3 || !parts[2]) throw new Error("Fixture JWS is invalid");
  const signature = Buffer.from(parts[2], "base64url");
  signature[0] = (signature[0] ?? 0) ^ 1;
  return `${parts[0]}.${parts[1]}.${signature.toString("base64url")}`;
}
