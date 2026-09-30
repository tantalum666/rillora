import { type DatabasePool } from './db.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
import type { AppleProductionVerification } from './apple-production-verification.js';
import type { AppleProductionSnapshotAdapter } from './apple-production-server-api.js';
type IntakeResult = Readonly<{
    accepted: true;
    status: 'applied' | 'pending';
    finishAuthorized: boolean;
    authoritativeSnapshotLoaded: boolean;
    entitlementChanged: boolean;
}>;
export declare class AppleProductionIntake {
    private readonly pool;
    private readonly verifier;
    private readonly snapshots;
    readonly context: AppleExecutionContext;
    private readonly inbox;
    constructor(pool: DatabasePool, verifier: Pick<AppleProductionVerification, 'verifyClientTransaction' | 'verifyNotification'>, snapshots: Pick<AppleProductionSnapshotAdapter, 'retrieveAuthoritativeSubscription'>, context?: AppleExecutionContext);
    acceptClientTransaction(input: {
        plannerId: string;
        plannerPublicId: string;
        signedTransaction: string;
    }): Promise<IntakeResult>;
    acceptNotification(signedPayload: string): Promise<{
        received: true;
        status: string;
    }>;
    retryPending(limit?: number): Promise<{
        attempted: number;
        applied: number;
        pending: number;
        failed: number;
        oldestPendingSeconds: number;
    }>;
    private process;
}
export {};
