import { createHash } from "node:crypto";
import type Stripe from "stripe";
import type { CommerceProviderSignalType, CommerceSubscriptionState } from "./commerce-provider-contract.js";

const commerceReferencePattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,99}$/;
const idempotencyKeyPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,254}$/;

export function stripeSubscriptionState(
  subscription: Pick<
    Stripe.Subscription,
    "status" | "cancel_at" | "cancel_at_period_end" | "pause_collection"
  >,
): CommerceSubscriptionState {
  if (subscription.pause_collection) return "expired_read_only";
  if (subscription.status === "active") {
    return stripeHasScheduledCancellation(subscription) ? "cancel_at_period_end" : "active";
  }
  if (["past_due", "unpaid"].includes(subscription.status)) return "past_due";
  if (["canceled", "incomplete", "incomplete_expired", "paused"].includes(subscription.status)) {
    return "expired_read_only";
  }
  if (subscription.status === "trialing") {
    throw new Error("Stripe trialing status is outside Rillora's no-trial launch policy");
  }
  throw new Error("Stripe Subscription status is unsupported; access must fail closed");
}

export function stripeHasScheduledCancellation(
  subscription: Pick<Stripe.Subscription, "status" | "cancel_at" | "cancel_at_period_end">,
): boolean {
  return subscription.status === "active"
    && (subscription.cancel_at_period_end || subscription.cancel_at != null);
}

export function stripeSignalType(eventType: string): CommerceProviderSignalType {
  if ([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "customer.subscription.created",
    "customer.subscription.updated",
  ].includes(eventType)) return "subscription_changed";
  if (eventType === "customer.subscription.deleted") return "subscription_ended";
  if (["invoice.paid", "invoice.payment_succeeded"].includes(eventType)) return "renewal_paid";
  if (["invoice.payment_failed", "checkout.session.async_payment_failed"].includes(eventType)) return "renewal_failed";
  if (["refund.created", "refund.updated", "refund.failed", "charge.refunded"].includes(eventType)) {
    return "refund_changed";
  }
  if (eventType.startsWith("charge.dispute.")) return "dispute_changed";
  return "unsupported";
}

export function stripeSubscriptionReference(object: Record<string, unknown>): string | null {
  if (object.object === "subscription") return stringWithPrefix(object.id, "sub_");
  const direct = stripeObjectReference(object.subscription);
  if (direct?.startsWith("sub_")) return direct;

  const parent = record(object.parent);
  const subscriptionDetails = record(parent?.subscription_details);
  const parentReference = stripeObjectReference(subscriptionDetails?.subscription);
  if (parentReference?.startsWith("sub_")) return parentReference;

  const lines = record(object.lines);
  const lineItems = Array.isArray(lines?.data) ? lines.data : [];
  for (const candidate of lineItems) {
    const line = record(candidate);
    const lineParent = record(line?.parent);
    const itemDetails = record(lineParent?.subscription_item_details);
    const lineReference = stripeObjectReference(itemDetails?.subscription);
    if (lineReference?.startsWith("sub_")) return lineReference;
  }
  const metadata = record(object.metadata);
  return stringWithPrefix(metadata?.rillora_subscription_reference, "sub_");
}

export function stripeTransactionReference(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  if (eventType.startsWith("invoice.")) return stringWithPrefix(object.id, "in_");
  if (eventType.startsWith("checkout.session.")) return stringWithPrefix(object.id, "cs_");
  if (eventType.startsWith("charge.dispute.")) return stringWithPrefix(object.id, "du_");
  if (eventType.startsWith("charge.")) return stringWithPrefix(object.id, "ch_");
  return null;
}

export function stripeRefundReference(
  eventType: string,
  object: Record<string, unknown>,
): string | null {
  if (eventType.startsWith("refund.")) return stringWithPrefix(object.id, "re_");
  return null;
}

export function stripeCommerceAccountReference(object: Record<string, unknown>): string | null {
  const direct = typeof object.client_reference_id === "string"
    ? object.client_reference_id
    : null;
  return direct ?? stripeMetadataValue(object, "rillora_commerce_account_reference");
}

export function stripeCustomerReference(object: Record<string, unknown>): string | null {
  const customer = stripeObjectReference(object.customer);
  return customer?.startsWith("cus_") ? customer : null;
}

export function stripeMetadataValue(
  object: Record<string, unknown>,
  key: string,
): string | null {
  const direct = record(object.metadata)?.[key];
  if (typeof direct === "string" && direct.length > 0) return direct;
  const parent = record(object.parent);
  const subscriptionDetails = record(parent?.subscription_details);
  const nested = record(subscriptionDetails?.metadata)?.[key];
  return typeof nested === "string" && nested.length > 0 ? nested : null;
}

export function stripeObjectReference(value: unknown): string | null {
  if (typeof value === "string") return value;
  return typeof record(value)?.id === "string" ? record(value)!.id as string : null;
}

export function stringWithPrefix(value: unknown, prefix: string): string | null {
  return typeof value === "string" && value.startsWith(prefix) ? value : null;
}

export function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function assertCommerceReference(value: string): void {
  if (!commerceReferencePattern.test(value)) {
    throw new Error("Rillora commerce account reference is invalid");
  }
}

export function assertIdempotencyKey(value: string): void {
  if (!idempotencyKeyPattern.test(value)) {
    throw new Error("Stripe Checkout requires a stable server-owned idempotency key");
  }
}

export function stripeIntegrationIdentifier(idempotencyKey: string, label = 'phase1c'): string {
  if (!/^[a-z0-9_]{1,40}$/.test(label)) throw new Error('Invalid integration label');
  const digest = createHash("sha256").update(idempotencyKey).digest();
  let suffix = "";
  for (let index = 0; index < 8; index += 1) {
    suffix += String.fromCharCode(97 + digest[index]! % 26);
  }
  return `rillora_${label}_${suffix}`;
}

export function assertStripeObjectId(value: string, prefix: string): void {
  if (!value.startsWith(prefix) || !/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Stripe object reference must start with ${prefix}`);
  }
}

export function assertStripeHostedUrl(value: string, expectedHost: string): void {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== expectedHost || url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error("Stripe returned an unexpected hosted URL");
  }
}

export function epochSecondsToIso(value: number): string {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Stripe timestamp is invalid");
  }
  const date = new Date(value * 1_000);
  if (Number.isNaN(date.getTime())) throw new Error("Stripe timestamp is invalid");
  return date.toISOString();
}
