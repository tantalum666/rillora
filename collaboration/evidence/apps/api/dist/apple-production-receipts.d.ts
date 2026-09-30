import type { PoolClient } from 'pg';
import type { AppleReceiptEvidence } from './apple-production-evidence.js';
import { type AppleExecutionContext } from './apple-execution-context.js';
/** Rebind inside the commit transaction, including retired windows for restores. */
export declare function resolveAppleReceiptPrice(client: PoolClient, receipt: AppleReceiptEvidence, context?: AppleExecutionContext): Promise<{
    id: string;
    plan_version_id: string;
    price_code: string;
    plan_version: number;
    binding_code: string;
    amount_minor: string;
    minor_unit_exponent: number;
}>;
export declare function persistAppleReceipt(client: PoolClient, subscriptionId: string, receipt: AppleReceiptEvidence, context?: AppleExecutionContext): Promise<void>;
