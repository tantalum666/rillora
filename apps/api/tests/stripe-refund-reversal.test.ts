import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import { resolveStripeFinancialSignal } from '../src/stripe-financial-resolution.js';
import type { StripeSdkPort } from '../src/stripe-sdk.js';
import { readStripeRecoveryFinancialState } from '../src/stripe-recovery-financial-state.js';

function fixture(environment: 'test' | 'production') {
  const live = environment === 'production';
  const state = {
    refundStatus: 'failed' as NonNullable<Stripe.Refund['status']>,
    anotherCompletedRefund: false,
    disputeStatus: null as Stripe.Dispute.Status | null,
    incompleteRefundList: false,
    chargeLive: live,
    pendingCountsInCharge: false,
    refundAmount: 8899,
    remainingPending: false,
  };
  const refund = () => ({ id: 're_reversal_fixture', charge: 'ch_reversal_fixture',
    payment_intent: 'pi_reversal_fixture', amount: state.refundAmount, currency: 'usd', status: state.refundStatus });
  const fullyRefunded = () => state.refundStatus === 'succeeded' || state.anotherCompletedRefund || state.pendingCountsInCharge;
  const charge = () => ({ id: 'ch_reversal_fixture', livemode: state.chargeLive,
    customer: 'cus_reversal_fixture', payment_intent: 'pi_reversal_fixture',
    paid: true, captured: true, status: 'succeeded', currency: 'usd', amount: 8899,
    amount_refunded: fullyRefunded() ? 8899 : 0, refunded: fullyRefunded(),
    disputed: state.disputeStatus !== null });
  const invoice = () => ({ id: 'in_reversal_fixture', livemode: live, status: 'paid',
    amount_paid: 8899, currency: 'usd', customer: 'cus_reversal_fixture',
    parent: { subscription_details: { subscription: 'sub_reversal_fixture' } } });
  const payment = { livemode: live, invoice: 'in_reversal_fixture', status: 'paid',
    amount_paid: 8899, currency: 'usd', payment: { type: 'charge', charge: 'ch_reversal_fixture' } };
  const sdk = {
    retrieveRefund: async () => refund(), retrieveCharge: async () => charge(),
    retrieveInvoice: async () => invoice(),
    listInvoicePaymentsByPaymentIntent: async () => ({ has_more: false, data: [payment] }),
    listInvoicePaymentsByInvoice: async () => ({ has_more: false, data: [payment] }),
    listChargesByPaymentIntent: async () => ({ has_more: false, data: [charge()] }),
    listRefundsByCharge: async () => ({ has_more: state.incompleteRefundList,
      data: [refund(), ...(state.anotherCompletedRefund
        ? [{ ...refund(), id: 're_other_completed_fixture', status: 'succeeded' }] : []),
        ...(state.remainingPending ? [{ ...refund(), id: 're_pending_remainder', status: 'pending', amount: 7899 }] : [])] }),
    listDisputesByCharge: async () => ({ has_more: false, data: state.disputeStatus === null ? []
      : [{ id: 'du_reversal_fixture', charge: 'ch_reversal_fixture', livemode: live, status: state.disputeStatus }] }),
  } as unknown as StripeSdkPort;
  return { state, readCharge: () => resolveStripeFinancialSignal(sdk,
    { signalType: 'refund_changed', providerTransactionReference: 'ch_reversal_fixture', providerRefundReference: null }, environment),
    recovery: () => readStripeRecoveryFinancialState(sdk, 'in_reversal_fixture', 'cus_reversal_fixture', live),
    read: () => resolveStripeFinancialSignal(sdk,
    { signalType: 'refund_changed', providerTransactionReference: null,
      providerRefundReference: 're_reversal_fixture' }, environment) };
}

describe.each(['test', 'production'] as const)('authoritative refund reversal in %s', environment => {
  it('does not treat Stripe pending amounts in a charge.refunded signal as completed refunds', async () => {
    const f = fixture(environment); f.state.refundStatus = 'pending'; f.state.pendingCountsInCharge = true;
    await expect(f.readCharge()).resolves.toMatchObject({ authoritativeStateOverride: null });
    f.state.refundStatus = 'succeeded';
    await expect(f.readCharge()).resolves.toMatchObject({ authoritativeStateOverride: 'refunded' });
  });

  it('does not combine a succeeded partial refund with a pending remainder into a completed full refund', async () => {
    const f = fixture(environment); f.state.refundStatus = 'succeeded'; f.state.refundAmount = 1000; f.state.remainingPending = true;
    await expect(f.read()).resolves.toMatchObject({ authoritativeStateOverride: null });
  });

  it('does not confirm a full refund from an incomplete refund inventory', async () => {
    const f = fixture(environment); f.state.refundStatus = 'succeeded'; f.state.incompleteRefundList = true;
    await expect(f.readCharge()).rejects.toThrow('refund inventory');
  });
  it.each(['failed', 'canceled'] as const)('confirms %s only from complete paid-invoice evidence', async status => {
    const f = fixture(environment); f.state.refundStatus = status;
    await expect(f.read()).resolves.toMatchObject({ authoritativeStateOverride: null, refundReversed: true });
    await expect(f.recovery()).resolves.toMatchObject({ override: null, resolvedRefund: true });
  });

  it('keeps another completed full refund effective', async () => {
    const f = fixture(environment); f.state.anotherCompletedRefund = true;
    const result = await f.read();
    expect(result.authoritativeStateOverride).toBe('refunded');
    expect(result.refundReversed).not.toBe(true);
    await expect(f.recovery()).resolves.toMatchObject({ override: 'refunded', resolvedRefund: false });
  });

  it('preserves an open dispute when a refund fails', async () => {
    const f = fixture(environment); f.state.disputeStatus = 'under_review';
    await expect(f.read()).resolves.toMatchObject({ authoritativeStateOverride: 'revoked', refundReversed: true });
  });

  it('does not clear a refund from incomplete evidence or a foreign environment', async () => {
    const f = fixture(environment); f.state.incompleteRefundList = true;
    await expect(f.read()).rejects.toThrow('refund inventory');
    f.state.incompleteRefundList = false; f.state.chargeLive = !f.state.chargeLive;
    await expect(f.read()).rejects.toThrow('environment mismatch');
  });

  it('does not label a pending refund as a confirmed reversal', async () => {
    const f = fixture(environment); f.state.refundStatus = 'pending';
    const result = await f.read();
    expect(result.authoritativeStateOverride).toBeNull();
    expect(result.refundReversed).not.toBe(true);
  });
});
