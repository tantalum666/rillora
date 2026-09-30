import { fileURLToPath } from "node:url";
import {
  Environment,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import { describe, expect, it } from "vitest";
import {
  createRilloraAppleSandboxVerifier,
  loadPinnedAppleRootCertificates,
  type AppleSignedDataVerifying,
  verifyAppleSandboxClientTransaction,
  verifyAppleSandboxNotification,
} from "../src/apple-storekit-adapter.js";

const accountToken = "11111111-1111-4111-8111-111111111111";
const rootDirectory = fileURLToPath(
  new URL("../certificates/apple", import.meta.url),
);

describe("Apple StoreKit server adapter", () => {
  it("loads only the three pinned Apple root certificates", async () => {
    const roots = await loadPinnedAppleRootCertificates(rootDirectory);
    expect(roots).toHaveLength(3);
    expect(roots.every((root) => root.byteLength > 500)).toBe(true);
    await expect(createRilloraAppleSandboxVerifier({
      rootCertificateDirectory: rootDirectory,
      enableOnlineChecks: false,
    })).resolves.toBeDefined();
  });

  it("normalizes a fully verified Sandbox notification without retaining JWS", async () => {
    const verifier = new StubAppleVerifier();
    const signal = await verifyAppleSandboxNotification({
      signedPayload: "signed.notification.payload",
      verifier,
    });

    expect(signal).toEqual(expect.objectContaining({
      provider: "storekit",
      providerEnvironment: "sandbox",
      providerEventReference: "apple-notification-001",
      providerSubscriptionReference: "apple-original-001",
      providerTransactionReference: "apple-transaction-002",
      accountBindingReference: accountToken,
      signalType: "renewal_paid",
      signatureVerified: true,
      verificationMode: "apple_server_library_x5c",
      requiresAuthoritativeSnapshot: true,
    }));
    expect(signal.payloadSha256).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(signal)).not.toContain("signed.notification.payload");
    expect(JSON.stringify(signal)).not.toContain("signed.transaction.payload");
    expect(JSON.stringify(signal)).not.toContain("signed.renewal.payload");
  });

  it("binds a client transaction to account, group, product and storefront", async () => {
    const signal = await verifyAppleSandboxClientTransaction({
      signedTransaction: "signed.transaction.payload",
      verifier: new StubAppleVerifier(),
      expectedAppAccountToken: accountToken,
      expectedStorefrontCountryCode: "HKG",
    });

    expect(signal).toEqual(expect.objectContaining({
      providerEventReference: "client-transaction:apple-transaction-002",
      providerSubscriptionReference: "apple-original-001",
      providerTransactionReference: "apple-transaction-002",
      accountBindingReference: accountToken,
      signalType: "subscription_changed",
    }));
  });

  it("accepts every representative Sandbox storefront with an exact match", async () => {
    for (const storefront of [
      "USA",
      "CAN",
      "GBR",
      "IRL",
      "JPN",
      "BRA",
      "KOR",
      "HKG",
    ]) {
      const signal = await verifyAppleSandboxClientTransaction({
        signedTransaction: `signed.transaction.${storefront}`,
        verifier: new StubAppleVerifier({ transaction: { storefront } }),
        expectedAppAccountToken: accountToken,
        expectedStorefrontCountryCode: storefront,
      });
      expect(signal.providerEnvironment).toBe("sandbox");
      expect(signal.requiresAuthoritativeSnapshot).toBe(true);
    }
  });

  it("rejects wrong account, group, product, environment and storefront evidence", async () => {
    await expect(verifyAppleSandboxClientTransaction({
      signedTransaction: "signed.transaction.payload",
      verifier: new StubAppleVerifier(),
      expectedAppAccountToken: "22222222-2222-4222-8222-222222222222",
      expectedStorefrontCountryCode: "HKG",
    })).rejects.toThrow("account token mismatch");

    for (const [override, message] of [
      [{ subscriptionGroupIdentifier: "D7BCE9A1" }, "subscription group mismatch"],
      [{ productId: "com.rillora.other" }, "outside the Family allowlist"],
      [{ environment: Environment.PRODUCTION }, "environment mismatch"],
      [{ storefront: "CHN" }, "outside the Sandbox matrix"],
    ] as const) {
      await expect(verifyAppleSandboxNotification({
        signedPayload: "signed.notification.payload",
        verifier: new StubAppleVerifier({ transaction: override }),
      })).rejects.toThrow(message);
    }
  });

  it("rejects mismatched nested transaction and renewal subjects", async () => {
    await expect(verifyAppleSandboxNotification({
      signedPayload: "signed.notification.payload",
      verifier: new StubAppleVerifier({
        renewal: { originalTransactionId: "apple-original-other" },
      }),
    })).rejects.toThrow("subjects do not match");
  });
});

class StubAppleVerifier implements AppleSignedDataVerifying {
  private readonly notificationOverrides: Partial<ResponseBodyV2DecodedPayload>;
  private readonly transactionOverrides: Partial<JWSTransactionDecodedPayload>;
  private readonly renewalOverrides: Partial<JWSRenewalInfoDecodedPayload>;

  constructor(overrides: {
    notification?: Partial<ResponseBodyV2DecodedPayload>;
    transaction?: Partial<JWSTransactionDecodedPayload>;
    renewal?: Partial<JWSRenewalInfoDecodedPayload>;
  } = {}) {
    this.notificationOverrides = overrides.notification ?? {};
    this.transactionOverrides = overrides.transaction ?? {};
    this.renewalOverrides = overrides.renewal ?? {};
  }

  async verifyAndDecodeNotification(): Promise<ResponseBodyV2DecodedPayload> {
    return {
      notificationUUID: "apple-notification-001",
      notificationType: "DID_RENEW",
      subtype: "BILLING_RECOVERY",
      signedDate: Date.parse("2026-08-22T00:00:00.000Z"),
      data: {
        bundleId: "com.rillora.ios",
        environment: Environment.SANDBOX,
        signedTransactionInfo: "signed.transaction.payload",
        signedRenewalInfo: "signed.renewal.payload",
      },
      ...this.notificationOverrides,
    };
  }

  async verifyAndDecodeTransaction(): Promise<JWSTransactionDecodedPayload> {
    return {
      bundleId: "com.rillora.ios",
      environment: Environment.SANDBOX,
      originalTransactionId: "apple-original-001",
      transactionId: "apple-transaction-002",
      productId: "com.rillora.family.annual",
      subscriptionGroupIdentifier: "22325627",
      appAccountToken: accountToken,
      storefront: "HKG",
      purchaseDate: Date.parse("2026-08-21T23:59:00.000Z"),
      signedDate: Date.parse("2026-08-22T00:00:00.000Z"),
      ...this.transactionOverrides,
    };
  }

  async verifyAndDecodeRenewalInfo(): Promise<JWSRenewalInfoDecodedPayload> {
    return {
      environment: Environment.SANDBOX,
      originalTransactionId: "apple-original-001",
      productId: "com.rillora.family.annual",
      appAccountToken: accountToken,
      signedDate: Date.parse("2026-08-22T00:00:00.000Z"),
      ...this.renewalOverrides,
    };
  }
}
