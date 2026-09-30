export type CommerceRenewalProvider = "stripe" | "storekit";
export type CommerceProviderEnvironment = "test" | "sandbox" | "production";

export type CommerceProviderSignalType =
  | "subscription_changed"
  | "subscription_ended"
  | "renewal_paid"
  | "renewal_failed"
  | "refund_changed"
  | "dispute_changed"
  | "unsupported";

export type CommerceSubscriptionState =
  | "previewing"
  | "active"
  | "cancel_at_period_end"
  | "grace"
  | "past_due"
  | "expired_read_only"
  | "refunded"
  | "revoked";

export type ProviderVerificationMode =
  | "stripe_sdk_webhook_signature"
  | "synthetic_stripe_hmac_sha256"
  | "synthetic_apple_pinned_es256"
  | "apple_server_library_x5c";

/**
 * A verified provider delivery is still only a signal. It cannot grant a Rillora
 * entitlement until a separately obtained authoritative provider snapshot is reconciled.
 */
export type NormalizedProviderSignal = Readonly<{
  provider: CommerceRenewalProvider;
  providerEnvironment: CommerceProviderEnvironment;
  providerEventReference: string;
  sourceEventType: string;
  signalType: CommerceProviderSignalType;
  occurredAt: string;
  providerSubscriptionReference: string | null;
  providerTransactionReference: string | null;
  providerRefundReference: string | null;
  accountBindingReference?: string | null;
  commerceAccountReference?: string | null;
  providerCustomerReference?: string | null;
  orderReference?: string | null;
  paymentAttemptReference?: string | null;
  payloadSha256: string;
  signatureVerified: true;
  verificationMode: ProviderVerificationMode;
  requiresAuthoritativeSnapshot: true;
}>;

export type AuthoritativeSubscriptionSnapshot = Readonly<{
  provider: CommerceRenewalProvider;
  providerEnvironment: CommerceProviderEnvironment;
  providerSubscriptionReference: string;
  commerceAccountReference: string;
  planCode: string;
  state: CommerceSubscriptionState;
  observedAt: string;
  currentPeriodEndsAt: string | null;
  currentPeriodStartsAt?: string | null;
  providerCustomerReference?: string | null;
  priceCode?: string | null;
  cancelAtPeriodEnd: boolean;
  source:
    | "stripe_api"
    | "app_store_server_api_signed_status"
    | "synthetic_fixture";
}>;

export const accessBearingSubscriptionStates = Object.freeze([
  "previewing",
  "active",
  "cancel_at_period_end",
  "grace",
] satisfies CommerceSubscriptionState[]);

export function providerEventKey(signal: Pick<
  NormalizedProviderSignal,
  "provider" | "providerEnvironment" | "providerEventReference"
>): string {
  return `${signal.provider}:${signal.providerEnvironment}:${signal.providerEventReference}`;
}
