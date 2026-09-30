import type { PoolClient } from 'pg';
import type { AuthoritativeSubscriptionSnapshot, NormalizedProviderSignal } from './commerce-provider-contract.js';
import type { EntitlementReconciliationDecision } from './commerce-reconciliation.js';
type AccountContext = Readonly<{
    commerceAccountId: string;
    publicId: string;
}>;
type BoundPrice = Readonly<{
    id: string;
    plan_version_id: string;
}>;
/** Called inside the provider's owner-scoped transaction after verification/catalog binding. */
export declare function recordSubscriptionObservation(client: PoolClient, context: AccountContext, signal: Pick<NormalizedProviderSignal, 'provider' | 'providerEnvironment' | 'providerSubscriptionReference'>, snapshot: AuthoritativeSubscriptionSnapshot, price: BoundPrice, eventPublicId: string, financialOverride?: 'refunded' | 'revoked' | null): Promise<string>;
/** Every provider uses the same SQL entitlement/permission clock and audit result. */
export declare function persistReconciliation(client: PoolClient, context: {
    commerceAccountId: string;
}, providerEventId: string, subscriptionId: string, decision: EntitlementReconciliationDecision, providerObservedAt?: string | null): Promise<boolean>;
export {};
