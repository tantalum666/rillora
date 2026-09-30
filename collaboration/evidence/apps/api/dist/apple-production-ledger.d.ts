import { type DatabasePool } from './db.js';
import type { AppleProductionSnapshot } from './apple-production-server-api.js';
import { type AppleDelivery } from './apple-production-inbox.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
/** One atomic owner-scoped commit: receipts, current state, grants and queue ack. */
export declare function commitAppleObservation(pool: DatabasePool, job: AppleDelivery, snapshot: AppleProductionSnapshot, execution?: AppleExecutionContext): Promise<{
    entitlementChanged: boolean;
}>;
