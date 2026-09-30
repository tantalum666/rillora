import { type AuthoritativeSubscriptionSnapshot, type CommerceRenewalProvider, type CommerceSubscriptionState, type NormalizedProviderSignal } from "./commerce-provider-contract.js";
export type ProviderEventOutcome = Readonly<{
    eventKey: string;
    status: "duplicate" | "unsupported" | "needs_authoritative_snapshot" | "covered_by_authoritative_snapshot";
}>;
export type EntitlementReconciliationDecision = Readonly<{
    commerceAccountReference: string;
    planCode: string;
    directive: "grant" | "revoke" | "hold";
    targetState: CommerceSubscriptionState | null;
    renewalProvider: CommerceRenewalProvider | null;
    reason: "authoritative_access_bearing_state" | "authoritative_non_access_state" | "snapshot_older_than_signal" | "duplicate_active_subscription_conflict";
}>;
export type CommerceReconciliationResult = Readonly<{
    eventOutcomes: readonly ProviderEventOutcome[];
    entitlementDecisions: readonly EntitlementReconciliationDecision[];
    grantsAccessFromProviderSignal: false;
}>;
export declare function reconcileCommerceProviderState(input: {
    signals: readonly NormalizedProviderSignal[];
    snapshots: readonly AuthoritativeSubscriptionSnapshot[];
    processedEventKeys?: ReadonlySet<string>;
}): CommerceReconciliationResult;
