import { AppStoreServerAPIClient, Status, type StatusResponse } from "@apple/app-store-server-library";
import { type AppleSignedDataVerifying } from "./apple-storekit-adapter.js";
import type { AuthoritativeSubscriptionSnapshot } from "./commerce-provider-contract.js";
export interface AppleAppStoreServerApi {
    getAllSubscriptionStatuses(anyTransactionId: string, status?: Status[]): Promise<StatusResponse>;
}
export type StoreKitSandboxSnapshotProvider = Readonly<{
    retrieveAuthoritativeSubscription(input: {
        anyTransactionId: string;
        providerSubscriptionReference: string;
        expectedAppAccountToken: string;
        expectedCommerceAccountReference: string;
    }): Promise<AuthoritativeSubscriptionSnapshot>;
}>;
export declare function createRilloraAppleSandboxServerApi(input: {
    privateKey: string;
    keyId: string;
    issuerId: string;
}): AppStoreServerAPIClient;
export declare class AppleStoreKitSandboxSnapshotAdapter implements StoreKitSandboxSnapshotProvider {
    private readonly serverApi;
    private readonly verifierSource;
    private readonly now;
    constructor(serverApi: AppleAppStoreServerApi, verifierSource: AppleSignedDataVerifying | Promise<AppleSignedDataVerifying>, now?: () => Date);
    retrieveAuthoritativeSubscription(input: {
        anyTransactionId: string;
        providerSubscriptionReference: string;
        expectedAppAccountToken: string;
        expectedCommerceAccountReference: string;
    }): Promise<AuthoritativeSubscriptionSnapshot>;
}
