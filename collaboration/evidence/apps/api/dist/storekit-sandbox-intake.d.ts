import { type AppleSignedDataVerifying } from "./apple-storekit-adapter.js";
import type { StoreKitSandboxSnapshotProvider } from "./apple-storekit-server-api.js";
import { type DatabasePool } from "./db.js";
export type StoreKitSandboxIntakeResult = Readonly<{
    accepted: true;
    status: "applied" | "needs_authoritative_snapshot" | "duplicate";
    providerEventReference: string;
    finishAuthorized: boolean;
    authoritativeSnapshotLoaded: boolean;
    entitlementChanged: boolean;
    validationOnly?: true;
    sandboxOnly: true;
}>;
export type StoreKitSandboxNotificationResult = Readonly<{
    received: true;
    status: "applied" | "needs_authoritative_snapshot" | "needs_mapping" | "ignored" | "duplicate";
    sandboxOnly: true;
}>;
export declare class StoreKitSandboxIntake {
    private readonly pool;
    private readonly verifierSource;
    private readonly snapshotProvider;
    constructor(pool: DatabasePool, verifierSource: AppleSignedDataVerifying | Promise<AppleSignedDataVerifying>, snapshotProvider?: StoreKitSandboxSnapshotProvider | null);
    acceptClientTransaction(input: {
        plannerId: string;
        plannerPublicId: string;
        signedTransaction: string;
        storefrontCountryCode: string;
    }): Promise<StoreKitSandboxIntakeResult>;
    acceptNotification(signedPayload: string): Promise<StoreKitSandboxNotificationResult>;
    private loadAndApplySnapshot;
}
