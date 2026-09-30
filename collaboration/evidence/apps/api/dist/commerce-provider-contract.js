export const accessBearingSubscriptionStates = Object.freeze([
    "previewing",
    "active",
    "cancel_at_period_end",
    "grace",
]);
export function providerEventKey(signal) {
    return `${signal.provider}:${signal.providerEnvironment}:${signal.providerEventReference}`;
}
