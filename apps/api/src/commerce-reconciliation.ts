import {
  accessBearingSubscriptionStates,
  providerEventKey,
  type AuthoritativeSubscriptionSnapshot,
  type CommerceRenewalProvider,
  type CommerceSubscriptionState,
  type NormalizedProviderSignal,
} from "./commerce-provider-contract.js";

export type ProviderEventOutcome = Readonly<{
  eventKey: string;
  status:
    | "duplicate"
    | "unsupported"
    | "needs_authoritative_snapshot"
    | "covered_by_authoritative_snapshot";
}>;

export type EntitlementReconciliationDecision = Readonly<{
  commerceAccountReference: string;
  planCode: string;
  directive: "grant" | "revoke" | "hold";
  targetState: CommerceSubscriptionState | null;
  renewalProvider: CommerceRenewalProvider | null;
  reason:
    | "authoritative_access_bearing_state"
    | "authoritative_non_access_state"
    | "snapshot_older_than_signal"
    | "duplicate_active_subscription_conflict";
}>;

export type CommerceReconciliationResult = Readonly<{
  eventOutcomes: readonly ProviderEventOutcome[];
  entitlementDecisions: readonly EntitlementReconciliationDecision[];
  grantsAccessFromProviderSignal: false;
}>;

export function reconcileCommerceProviderState(input: {
  signals: readonly NormalizedProviderSignal[];
  snapshots: readonly AuthoritativeSubscriptionSnapshot[];
  processedEventKeys?: ReadonlySet<string>;
}): CommerceReconciliationResult {
  const processedEventKeys = input.processedEventKeys ?? new Set<string>();
  const uniqueSignals = new Map<string, NormalizedProviderSignal>();
  const duplicateKeys = new Set<string>();

  for (const signal of input.signals) {
    assertValidIsoDate(signal.occurredAt, "provider signal occurredAt");
    const key = providerEventKey(signal);
    if (processedEventKeys.has(key) || uniqueSignals.has(key)) {
      duplicateKeys.add(key);
      continue;
    }
    uniqueSignals.set(key, signal);
  }

  const sortedSignals = [...uniqueSignals.values()].sort((left, right) => {
    const dateOrder = Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
    return dateOrder || providerEventKey(left).localeCompare(providerEventKey(right));
  });
  const snapshots = input.snapshots.map((snapshot) => {
    assertSnapshot(snapshot);
    return snapshot;
  });
  const snapshotBySubject = newestSnapshotBySubject(snapshots);

  const eventOutcomes: ProviderEventOutcome[] = [
    ...[...duplicateKeys].sort().map((eventKey) => Object.freeze({
      eventKey,
      status: "duplicate" as const,
    })),
  ];
  for (const signal of sortedSignals) {
    const eventKey = providerEventKey(signal);
    if (signal.signalType === "unsupported") {
      eventOutcomes.push(Object.freeze({ eventKey, status: "unsupported" }));
      continue;
    }
    const snapshot = signal.providerSubscriptionReference
      ? snapshotBySubject.get(subscriptionSubjectKey({
          provider: signal.provider,
          providerEnvironment: signal.providerEnvironment,
          providerSubscriptionReference: signal.providerSubscriptionReference,
        }))
      : undefined;
    eventOutcomes.push(Object.freeze({
      eventKey,
      status: snapshot && Date.parse(snapshot.observedAt) >= Date.parse(signal.occurredAt)
        ? "covered_by_authoritative_snapshot"
        : "needs_authoritative_snapshot",
    }));
  }

  const latestSignalAtBySubject = new Map<string, number>();
  for (const signal of sortedSignals) {
    if (signal.signalType === "unsupported" || !signal.providerSubscriptionReference) continue;
    const key = subscriptionSubjectKey({
      provider: signal.provider,
      providerEnvironment: signal.providerEnvironment,
      providerSubscriptionReference: signal.providerSubscriptionReference,
    });
    latestSignalAtBySubject.set(
      key,
      Math.max(latestSignalAtBySubject.get(key) ?? 0, Date.parse(signal.occurredAt)),
    );
  }

  const snapshotsByPlan = new Map<string, AuthoritativeSubscriptionSnapshot[]>();
  for (const snapshot of snapshotBySubject.values()) {
    const key = JSON.stringify([snapshot.commerceAccountReference, snapshot.planCode]);
    const group = snapshotsByPlan.get(key) ?? [];
    group.push(snapshot);
    snapshotsByPlan.set(key, group);
  }

  const entitlementDecisions: EntitlementReconciliationDecision[] = [];
  for (const [planKey, planSnapshots] of [...snapshotsByPlan].sort(([left], [right]) => left.localeCompare(right))) {
    const planIdentity: unknown = JSON.parse(planKey);
    if (
      !Array.isArray(planIdentity)
      || planIdentity.length !== 2
      || typeof planIdentity[0] !== "string"
      || typeof planIdentity[1] !== "string"
      || !planIdentity[0]
      || !planIdentity[1]
    ) {
      throw new Error("Authoritative snapshot account or plan reference is invalid");
    }
    const [commerceAccountReference, planCode] = planIdentity;
    const accessBearing = planSnapshots.filter((snapshot) => isAccessBearing(snapshot.state));
    if (accessBearing.length > 1) {
      entitlementDecisions.push(Object.freeze({
        commerceAccountReference,
        planCode,
        directive: "hold",
        targetState: null,
        renewalProvider: null,
        reason: "duplicate_active_subscription_conflict",
      }));
      continue;
    }

    const latestSnapshot = planSnapshots.reduce((latest, candidate) =>
      Date.parse(candidate.observedAt) > Date.parse(latest.observedAt) ? candidate : latest
    );
    const staleSnapshot = planSnapshots.find((snapshot) => {
      const latestSignalAt = latestSignalAtBySubject.get(subscriptionSubjectKey(snapshot));
      return latestSignalAt !== undefined && Date.parse(snapshot.observedAt) < latestSignalAt;
    });
    const controllingSnapshot = accessBearing[0] ?? latestSnapshot;
    if (staleSnapshot) {
      entitlementDecisions.push(Object.freeze({
        commerceAccountReference,
        planCode,
        directive: "hold",
        targetState: controllingSnapshot.state,
        renewalProvider: controllingSnapshot.provider,
        reason: "snapshot_older_than_signal",
      }));
      continue;
    }

    const accessAllowed = isAccessBearing(controllingSnapshot.state);
    entitlementDecisions.push(Object.freeze({
      commerceAccountReference,
      planCode,
      directive: accessAllowed ? "grant" : "revoke",
      targetState: controllingSnapshot.state,
      renewalProvider: controllingSnapshot.provider,
      reason: accessAllowed
        ? "authoritative_access_bearing_state"
        : "authoritative_non_access_state",
    }));
  }

  return Object.freeze({
    eventOutcomes: Object.freeze(eventOutcomes),
    entitlementDecisions: Object.freeze(entitlementDecisions),
    grantsAccessFromProviderSignal: false,
  });
}

function newestSnapshotBySubject(
  snapshots: readonly AuthoritativeSubscriptionSnapshot[],
): Map<string, AuthoritativeSubscriptionSnapshot> {
  const result = new Map<string, AuthoritativeSubscriptionSnapshot>();
  for (const snapshot of snapshots) {
    const key = subscriptionSubjectKey(snapshot);
    const current = result.get(key);
    if (!current) {
      result.set(key, snapshot);
      continue;
    }
    const candidateObservedAt = Date.parse(snapshot.observedAt);
    const currentObservedAt = Date.parse(current.observedAt);
    if (
      candidateObservedAt === currentObservedAt
      && !areEquivalentSnapshots(current, snapshot)
    ) {
      throw new Error("Authoritative provider returned conflicting snapshots at the same observation time");
    }
    if (candidateObservedAt > currentObservedAt) {
      result.set(key, snapshot);
    }
  }
  return result;
}

function areEquivalentSnapshots(
  left: AuthoritativeSubscriptionSnapshot,
  right: AuthoritativeSubscriptionSnapshot,
): boolean {
  return left.provider === right.provider
    && left.providerEnvironment === right.providerEnvironment
    && left.providerSubscriptionReference === right.providerSubscriptionReference
    && left.commerceAccountReference === right.commerceAccountReference
    && left.planCode === right.planCode
    && left.state === right.state
    && left.observedAt === right.observedAt
    && left.currentPeriodEndsAt === right.currentPeriodEndsAt
    && left.currentPeriodStartsAt === right.currentPeriodStartsAt
    && left.graceEndsAt === right.graceEndsAt
    && left.providerCustomerReference === right.providerCustomerReference
    && left.priceCode === right.priceCode
    && left.providerInvoiceReference === right.providerInvoiceReference
    && left.renewalIsPossible === right.renewalIsPossible
    && left.cancelAtPeriodEnd === right.cancelAtPeriodEnd
    && left.source === right.source;
}

function subscriptionSubjectKey(subject: Pick<
  AuthoritativeSubscriptionSnapshot,
  "provider" | "providerEnvironment" | "providerSubscriptionReference"
>): string {
  return `${subject.provider}:${subject.providerEnvironment}:${subject.providerSubscriptionReference}`;
}

function isAccessBearing(state: CommerceSubscriptionState): boolean {
  return (accessBearingSubscriptionStates as readonly CommerceSubscriptionState[]).includes(state);
}

function assertSnapshot(snapshot: AuthoritativeSubscriptionSnapshot): void {
  assertValidIsoDate(snapshot.observedAt, "authoritative snapshot observedAt");
  if (snapshot.currentPeriodEndsAt !== null) {
    assertValidIsoDate(snapshot.currentPeriodEndsAt, "authoritative snapshot currentPeriodEndsAt");
  }
  if (snapshot.currentPeriodStartsAt) {
    assertValidIsoDate(snapshot.currentPeriodStartsAt, "authoritative snapshot currentPeriodStartsAt");
  }
  if (snapshot.graceEndsAt) {
    assertValidIsoDate(snapshot.graceEndsAt, "authoritative snapshot graceEndsAt");
  }
  if (
    !snapshot.providerSubscriptionReference
    || !snapshot.commerceAccountReference
    || !snapshot.planCode
  ) {
    throw new Error("Authoritative snapshot references must not be empty");
  }
}

function assertValidIsoDate(value: string, label: string): void {
  if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} is invalid`);
}
