import type Stripe from 'stripe';
import type { NormalizedProviderSignal } from './commerce-provider-contract.js';
import type { StripeSdkPort, StripeFinancialSignalResolution } from './stripe-sdk.js';
import { assertStripeObjectId, stripeObjectReference, stringWithPrefix } from './stripe-provider-shared.js';

export async function resolveStripeFinancialSignal(
  sdk: StripeSdkPort,
  signal: Pick<NormalizedProviderSignal, 'signalType' | 'providerTransactionReference' | 'providerRefundReference'>,
  environment: 'test' | 'production',
): Promise<StripeFinancialSignalResolution> {
  const expectedLive = environment === 'production';
  const verifyMode = (value: boolean) => { if (value !== expectedLive) throw new Error('Stripe financial object environment mismatch'); };
  if (!['refund_changed', 'dispute_changed'].includes(signal.signalType)) throw new Error('A refund or dispute signal is required');
  let refund: Stripe.Refund | null = null, dispute: Stripe.Dispute | null = null;
  if (signal.signalType === 'refund_changed' && signal.providerRefundReference) {
    assertStripeObjectId(signal.providerRefundReference, 're_');
    refund = await sdk.retrieveRefund(signal.providerRefundReference);
  }
  if (signal.signalType === 'dispute_changed') {
    const id = stringWithPrefix(signal.providerTransactionReference, 'du_');
    if (!id) throw new Error('A Dispute reference is required');
    dispute = await sdk.retrieveDispute(id); verifyMode(dispute.livemode);
  }
  const chargeId = stripeObjectReference(refund?.charge) ?? stripeObjectReference(dispute?.charge)
    ?? stringWithPrefix(signal.providerTransactionReference, 'ch_');
  if (!chargeId) throw new Error('A Charge reference is required');
  assertStripeObjectId(chargeId, 'ch_');
  const charge = await sdk.retrieveCharge(chargeId); verifyMode(charge.livemode);
  const paymentIntentId = stripeObjectReference(refund?.payment_intent) ?? stripeObjectReference(dispute?.payment_intent)
    ?? stripeObjectReference(charge.payment_intent);
  if (!paymentIntentId) throw new Error('A PaymentIntent reference is required');
  assertStripeObjectId(paymentIntentId, 'pi_');
  const payments = await sdk.listInvoicePaymentsByPaymentIntent(paymentIntentId);
  const payment = payments.data[0];
  if (payments.has_more || payments.data.length !== 1 || !payment) throw new Error('One unambiguous Invoice Payment is required');
  verifyMode(payment.livemode);
  const invoiceId = stripeObjectReference(payment.invoice);
  if (!invoiceId) throw new Error('An Invoice reference is required');
  assertStripeObjectId(invoiceId, 'in_');
  const invoice = await sdk.retrieveInvoice(invoiceId); verifyMode(invoice.livemode);
  const subscriptionId = stripeObjectReference(invoice.parent?.subscription_details?.subscription);
  const customerId = stripeObjectReference(invoice.customer) ?? stripeObjectReference(charge.customer);
  if (!subscriptionId || !customerId) throw new Error('Subscription and Customer references are required');
  assertStripeObjectId(subscriptionId, 'sub_'); assertStripeObjectId(customerId, 'cus_');
  if (stripeObjectReference(charge.customer) && stripeObjectReference(charge.customer) !== customerId) throw new Error('Charge and Invoice Customer references do not match');
  const fullRefund = signal.signalType === 'refund_changed' && (refund === null || refund.status === 'succeeded')
    && (charge.refunded || charge.amount_refunded >= charge.amount);
  const revoked = dispute !== null && !['won', 'prevented', 'warning_closed'].includes(dispute.status);
  return { providerInvoiceReference: invoiceId, providerSubscriptionReference: subscriptionId,
    providerCustomerReference: customerId, providerTransactionReference: chargeId,
    providerRefundReference: signal.providerRefundReference,
    authoritativeStateOverride: fullRefund ? 'refunded' : revoked ? 'revoked' : null };
}
