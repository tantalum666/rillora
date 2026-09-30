import type { PoolClient } from 'pg';
import { type DatabasePool } from './db.js';
import { type AppleProductionSignal } from './apple-production-evidence.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
export type AppleDelivery = Readonly<{
    publicId: string;
    status: string;
    accountReference: string | null;
    signal: AppleProductionSignal;
    leaseToken: string | null;
    attempts: number;
}>;
/** Small durable transport queue. It knows ownership and retries, never grants access. */
export declare class AppleProductionInbox {
    private readonly pool;
    readonly context: AppleExecutionContext;
    constructor(pool: DatabasePool, context?: AppleExecutionContext);
    receive(signal: AppleProductionSignal, authenticated?: {
        plannerId: string;
        plannerPublicId: string;
    }): Promise<AppleDelivery>;
    claim(publicId?: string, refreshApplied?: boolean): Promise<AppleDelivery | null>;
    bindClaim(job: AppleDelivery): Promise<AppleDelivery | null>;
    retry(job: AppleDelivery, reason: 'apple_account_unavailable' | 'apple_snapshot_retry'): Promise<void>;
    health(): Promise<{
        pending: number;
        failed: number;
        oldestPendingSeconds: number;
    }>;
}
export declare function requireAppleLease(client: PoolClient, job: AppleDelivery, context?: AppleExecutionContext): Promise<void>;
