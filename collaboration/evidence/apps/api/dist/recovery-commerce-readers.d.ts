import type { DatabasePool } from './db.js';
import type { RecoverySubscriptionReference } from './recovery-journal.js';
import type { AuthoritativeSubscriptionSnapshot } from './commerce-provider-contract.js';
import { type AppleProductionSnapshot } from './apple-production-server-api.js';
import { type StripeProductionPriceBinding } from './stripe-production-adapter.js';
export type RecoveryProviderObservation = {
    snapshot: AuthoritativeSubscriptionSnapshot;
    apple?: AppleProductionSnapshot;
    financialOverride?: 'refunded' | 'revoked' | null;
    disputeResolved?: boolean;
    stripePrice?: StripeProductionPriceBinding;
    stripeProduct?: string;
};
/** Trusted backend dependency, never a caller-supplied JSON verification claim. */
export type RecoveryProviderReader = (reference: RecoverySubscriptionReference, plannerPublicId: string) => Promise<RecoveryProviderObservation>;
export declare function createRecoveryProviderReader(pool: DatabasePool, config: {
    appleProductionArn?: string;
    appleReviewArn?: string;
    stripeProductionArn?: string;
    appleRoots: string;
}): RecoveryProviderReader;
