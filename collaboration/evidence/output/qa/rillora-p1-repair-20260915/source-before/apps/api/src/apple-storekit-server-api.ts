import {
  AppStoreServerAPIClient,
  AutoRenewStatus,
  Environment,
  Status,
  type StatusResponse,
} from "@apple/app-store-server-library";
import {
  rilloraAppleSandboxContract,
  verifyAppleSandboxSubscriptionStatus,
  type AppleSignedDataVerifying,
} from "./apple-storekit-adapter.js";
import type { AuthoritativeSubscriptionSnapshot } from "./commerce-provider-contract.js";

export interface AppleAppStoreServerApi {
  getAllSubscriptionStatuses(
    anyTransactionId: string,
    status?: Status[],
  ): Promise<StatusResponse>;
}

export type StoreKitSandboxSnapshotProvider = Readonly<{
  retrieveAuthoritativeSubscription(input: {
    anyTransactionId: string;
    providerSubscriptionReference: string;
    expectedAppAccountToken: string;
    expectedCommerceAccountReference: string;
  }): Promise<AuthoritativeSubscriptionSnapshot>;
}>;

const priceCodeByProductId = Object.freeze({
  "com.rillora.family.monthly": "family_usd_monthly_v1",
  "com.rillora.family.annual": "family_usd_annual_v1",
} as const);

export function createRilloraAppleSandboxServerApi(input: {
  privateKey: string;
  keyId: string;
  issuerId: string;
}): AppStoreServerAPIClient {
  return new AppStoreServerAPIClient(
    input.privateKey,
    input.keyId,
    input.issuerId,
    rilloraAppleSandboxContract.bundleId,
    Environment.SANDBOX,
  );
}

export class AppleStoreKitSandboxSnapshotAdapter
  implements StoreKitSandboxSnapshotProvider {
  constructor(
    private readonly serverApi: AppleAppStoreServerApi,
    private readonly verifierSource:
      | AppleSignedDataVerifying
      | Promise<AppleSignedDataVerifying>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async retrieveAuthoritativeSubscription(input: {
    anyTransactionId: string;
    providerSubscriptionReference: string;
    expectedAppAccountToken: string;
    expectedCommerceAccountReference: string;
  }): Promise<AuthoritativeSubscriptionSnapshot> {
    const response = await this.serverApi.getAllSubscriptionStatuses(
      input.anyTransactionId,
    );
    assertResponseIdentity(response);

    const group = response.data?.find(
      (item) =>
        item.subscriptionGroupIdentifier
        === rilloraAppleSandboxContract.subscriptionGroupId,
    );
    const candidates = group?.lastTransactions?.filter(
      (item) =>
        item.originalTransactionId === input.providerSubscriptionReference,
    ) ?? [];
    if (candidates.length === 0) {
      throw new Error("Apple Server API returned no matching Family subscription status");
    }

    const verifier = await this.verifierSource;
    const verified = await Promise.all(candidates.map(async (item) => {
      if (!item.signedTransactionInfo || !item.signedRenewalInfo) {
        throw new Error("Apple Server API status is missing signed transaction material");
      }
      const payloads = await verifyAppleSandboxSubscriptionStatus({
        signedTransaction: item.signedTransactionInfo,
        signedRenewalInfo: item.signedRenewalInfo,
        verifier,
        expectedOriginalTransactionId: input.providerSubscriptionReference,
        expectedAppAccountToken: input.expectedAppAccountToken,
      });
      return Object.freeze({ item, ...payloads });
    }));
    const selected = verified.reduce((latest, candidate) =>
      signedAt(candidate.transaction) > signedAt(latest.transaction)
        ? candidate
        : latest
    );

    const productId = selected.transaction.productId;
    const priceCode = productId
      ? priceCodeByProductId[productId as keyof typeof priceCodeByProductId]
      : undefined;
    if (!priceCode) {
      throw new Error("Apple Server API status uses an unknown Rillora price");
    }
    const status = requiredStatus(selected.item.status);
    const state = subscriptionState(
      status,
      selected.renewal.autoRenewStatus,
    );
    const observedAt = this.now();
    if (Number.isNaN(observedAt.getTime())) {
      throw new Error("Apple Server API observation time is invalid");
    }

    return Object.freeze({
      provider: "storekit",
      providerEnvironment: "sandbox",
      providerSubscriptionReference: input.providerSubscriptionReference,
      commerceAccountReference: input.expectedCommerceAccountReference,
      planCode: "family",
      state,
      observedAt: observedAt.toISOString(),
      currentPeriodStartsAt: optionalEpochIso(
        selected.transaction.purchaseDate,
        "Apple subscription purchase date",
      ),
      currentPeriodEndsAt: optionalEpochIso(
        selected.transaction.expiresDate,
        "Apple subscription expiration date",
      ),
      priceCode,
      cancelAtPeriodEnd:
        Number(selected.renewal.autoRenewStatus) === AutoRenewStatus.OFF,
      source: "app_store_server_api_signed_status",
    });
  }
}

function assertResponseIdentity(response: StatusResponse): void {
  if (response.environment !== Environment.SANDBOX) {
    throw new Error("Apple Server API response environment mismatch");
  }
  if (response.bundleId !== rilloraAppleSandboxContract.bundleId) {
    throw new Error("Apple Server API response bundle mismatch");
  }
  if (
    response.appAppleId !== undefined
    && response.appAppleId !== rilloraAppleSandboxContract.appAppleId
  ) {
    throw new Error("Apple Server API response app identifier mismatch");
  }
}

function requiredStatus(value: unknown): Status {
  const status = Number(value);
  if (![
    Status.ACTIVE,
    Status.EXPIRED,
    Status.BILLING_RETRY,
    Status.BILLING_GRACE_PERIOD,
    Status.REVOKED,
  ].includes(status)) {
    throw new Error("Apple Server API returned an unknown subscription status");
  }
  return status as Status;
}

function subscriptionState(
  status: Status,
  autoRenewStatus: unknown,
): AuthoritativeSubscriptionSnapshot["state"] {
  if (status === Status.ACTIVE) {
    return Number(autoRenewStatus) === AutoRenewStatus.OFF
      ? "cancel_at_period_end"
      : "active";
  }
  if (status === Status.BILLING_GRACE_PERIOD) return "grace";
  if (status === Status.BILLING_RETRY) return "past_due";
  if (status === Status.EXPIRED) return "expired_read_only";
  return "revoked";
}

function signedAt(value: { signedDate?: number }): number {
  if (!Number.isSafeInteger(value.signedDate) || (value.signedDate ?? -1) < 0) {
    throw new Error("Apple signed status date is missing or invalid");
  }
  return value.signedDate!;
}

function optionalEpochIso(value: unknown, label: string): string | null {
  if (value === undefined) return null;
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${label} is invalid`);
  }
  const date = new Date(value as number);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid`);
  return date.toISOString();
}
