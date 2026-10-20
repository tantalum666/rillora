import type Stripe from 'stripe';
import type { StripeSdkPort } from './stripe-sdk.js';
import { stripeObjectReference } from './stripe-provider-shared.js';

/** Charge.amount_refunded includes pending refunds. Only completed refunds can
 * establish a completed full refund; use the same inventory for live events and recovery. */
export async function readStripeRefundEvidence(sdk: StripeSdkPort, charge: Stripe.Charge) {
  if (!Number.isSafeInteger(charge.amount) || charge.amount <= 0 || !/^[a-z]{3}$/.test(charge.currency)) {
    throw new Error('Stripe settled charge amount or currency is invalid');
  }
  if (!sdk.listRefundsByCharge) throw new Error('Stripe refund inventory reader is unavailable');
  const refunds = await sdk.listRefundsByCharge(charge.id);
  if (refunds.has_more || refunds.data.length > 100 || refunds.data.some(refund =>
    stripeObjectReference(refund.charge) !== charge.id || refund.currency !== charge.currency
    || !Number.isSafeInteger(refund.amount) || refund.amount <= 0 || refund.amount > charge.amount
    || !['succeeded', 'pending', 'failed', 'canceled', 'requires_action'].includes(refund.status ?? ''))) {
    throw new Error('Stripe refund inventory is incomplete');
  }
  const completedAmount = refunds.data.filter(refund => refund.status === 'succeeded')
    .reduce((total, refund) => total + refund.amount, 0);
  if (completedAmount > charge.amount) throw new Error('Completed refunds exceed the settled charge');
  return {
    completedAmount,
    fullyRefunded: completedAmount === charge.amount,
    resolvedRefund: completedAmount !== charge.amount && refunds.data.some(refund => refund.status === 'failed' || refund.status === 'canceled'),
  };
}
