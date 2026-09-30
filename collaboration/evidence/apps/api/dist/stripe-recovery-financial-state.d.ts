import type { StripeSdkPort } from './stripe-sdk.js';
/** Read-only current-invoice evidence. An active subscription alone cannot undo
 * a refund/dispute that happened after a database snapshot. No fabricated webhook. */
export declare function readStripeRecoveryFinancialState(sdk: StripeSdkPort, invoiceId: string, customerId: string, live: boolean): Promise<{
    override: "refunded" | "revoked" | null;
    resolvedDispute: boolean;
    chargeReference: string;
}>;
