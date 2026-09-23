import {
  AutoRenewStatus,
  Environment,
  Status,
  type JWSRenewalInfoDecodedPayload,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
  type StatusResponse,
} from "@apple/app-store-server-library";
import { describe, expect, it } from "vitest";
import type { AppleSignedDataVerifying } from "../src/apple-storekit-adapter.js";
import {
  AppleStoreKitSandboxSnapshotAdapter,
  type AppleAppStoreServerApi,
} from "../src/apple-storekit-server-api.js";

const accountToken = "11111111-2222-4333-8444-555555555555";
const commerceAccountReference = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const originalTransactionId = "2000000123456789";

describe("Apple App Store Server API snapshot adapter", () => {
  it("normalizes a verified active Family status without granting entitlement", async () => {
    const { api, requestedIds } = fakeServerApi(Status.ACTIVE);
    const adapter = new AppleStoreKitSandboxSnapshotAdapter(
      api,
      fakeVerifier(),
      () => new Date("2026-08-22T02:03:04.000Z"),
    );

    await expect(adapter.retrieveAuthoritativeSubscription({
      anyTransactionId: "2000000123456790",
      providerSubscriptionReference: originalTransactionId,
      expectedAppAccountToken: accountToken,
      expectedCommerceAccountReference: commerceAccountReference,
    })).resolves.toEqual({
      provider: "storekit",
      providerEnvironment: "sandbox",
      providerSubscriptionReference: originalTransactionId,
      commerceAccountReference,
      planCode: "family",
      state: "active",
      observedAt: "2026-08-22T02:03:04.000Z",
      currentPeriodStartsAt: "2026-08-21T00:00:00.000Z",
      currentPeriodEndsAt: "2026-09-21T00:00:00.000Z",
      priceCode: "family_usd_monthly_v1",
      cancelAtPeriodEnd: false,
      source: "app_store_server_api_signed_status",
    });
    expect(requestedIds).toEqual(["2000000123456790"]);
  });

  it("maps auto-renew off and rejects a mismatched account binding", async () => {
    const adapter = new AppleStoreKitSandboxSnapshotAdapter(
      fakeServerApi(Status.ACTIVE).api,
      fakeVerifier({ autoRenewStatus: AutoRenewStatus.OFF }),
      () => new Date("2026-08-22T02:03:04.000Z"),
    );
    const input = {
      anyTransactionId: originalTransactionId,
      providerSubscriptionReference: originalTransactionId,
      expectedAppAccountToken: accountToken,
      expectedCommerceAccountReference: commerceAccountReference,
    };
    await expect(adapter.retrieveAuthoritativeSubscription(input)).resolves.toMatchObject({
      state: "cancel_at_period_end",
      cancelAtPeriodEnd: true,
    });
    await expect(adapter.retrieveAuthoritativeSubscription({
      ...input,
      expectedAppAccountToken: "99999999-2222-4333-8444-555555555555",
    })).rejects.toThrow("account token mismatch");
  });

  it("fails closed on a non-Sandbox response before decoding status material", async () => {
    const { api } = fakeServerApi(Status.ACTIVE, Environment.PRODUCTION);
    const adapter = new AppleStoreKitSandboxSnapshotAdapter(
      api,
      fakeVerifier(),
    );
    await expect(adapter.retrieveAuthoritativeSubscription({
      anyTransactionId: originalTransactionId,
      providerSubscriptionReference: originalTransactionId,
      expectedAppAccountToken: accountToken,
      expectedCommerceAccountReference: commerceAccountReference,
    })).rejects.toThrow("environment mismatch");
  });
});

function fakeServerApi(
  status: Status,
  environment: Environment = Environment.SANDBOX,
): { api: AppleAppStoreServerApi; requestedIds: string[] } {
  const requestedIds: string[] = [];
  const response: StatusResponse = {
    environment,
    bundleId: "com.rillora.ios",
    appAppleId: 6803957639,
    data: [{
      subscriptionGroupIdentifier: "22325627",
      lastTransactions: [{
        status,
        originalTransactionId,
        signedTransactionInfo: "signed.transaction",
        signedRenewalInfo: "signed.renewal",
      }],
    }],
  };
  return {
    requestedIds,
    api: {
      async getAllSubscriptionStatuses(anyTransactionId: string) {
        requestedIds.push(anyTransactionId);
        return response;
      },
    },
  };
}

function fakeVerifier(overrides: {
  autoRenewStatus?: AutoRenewStatus;
} = {}): AppleSignedDataVerifying {
  const transaction: JWSTransactionDecodedPayload = {
    bundleId: "com.rillora.ios",
    environment: Environment.SANDBOX,
    productId: "com.rillora.family.monthly",
    subscriptionGroupIdentifier: "22325627",
    transactionId: "2000000123456790",
    originalTransactionId,
    appAccountToken: accountToken,
    storefront: "USA",
    purchaseDate: Date.parse("2026-08-21T00:00:00.000Z"),
    expiresDate: Date.parse("2026-09-21T00:00:00.000Z"),
    signedDate: Date.parse("2026-08-22T01:00:00.000Z"),
  };
  const renewal: JWSRenewalInfoDecodedPayload = {
    environment: Environment.SANDBOX,
    productId: "com.rillora.family.monthly",
    originalTransactionId,
    appAccountToken: accountToken,
    autoRenewStatus: overrides.autoRenewStatus ?? AutoRenewStatus.ON,
    signedDate: Date.parse("2026-08-22T01:00:00.000Z"),
  };
  return {
    async verifyAndDecodeTransaction() {
      return transaction;
    },
    async verifyAndDecodeRenewalInfo() {
      return renewal;
    },
    async verifyAndDecodeNotification(): Promise<ResponseBodyV2DecodedPayload> {
      throw new Error("not used");
    },
  };
}
