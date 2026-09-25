import contract from '../../../config/purchase-consent.json' with { type: 'json' };

const contractKeys = ['version', 'provider', 'priceCode', 'amountMinor', 'currency', 'billingPeriod', 'termsVersion', 'subscriptionTermsVersion', 'refundPolicyVersion', 'legalBundleSha256'];
export function purchaseQuote(payload) {
  if (payload?.contractVersion !== 'commerce-stripe-production-v1' || payload.requiresFreshEvaluation !== true
    || payload.applicableTaxShownAtCheckout !== true || !contractKeys.every(key => payload.purchaseConsent?.[key] === contract[key])) {
    throw new Error('The subscription terms changed. Reload before continuing.');
  }
  return Object.freeze(Object.fromEntries(contractKeys.map(key => [key, payload.purchaseConsent[key]])));
}
export function purchaseProof(quote, accepted) {
  if (accepted !== true) throw new Error('Review and accept the subscription terms before continuing.');
  const checked = purchaseQuote({ contractVersion: 'commerce-stripe-production-v1', purchaseConsent: quote,
    requiresFreshEvaluation: true, applicableTaxShownAtCheckout: true });
  return { ...checked, acceptedSubscriptionTerms: true, acceptedAnnualRenewal: true, acknowledgedCancellation: true };
}
export function productionBillingDestination(payload, kind) {
  const value = payload?.[kind];
  const host = kind === 'checkout' ? 'checkout.stripe.com' : kind === 'portal' ? 'billing.stripe.com' : null;
  if (payload?.contractVersion !== 'commerce-stripe-production-v1' || value?.testOnly !== false || !host
    || (kind === 'checkout' && (payload.boundaries?.callbackGrantsAccess !== false || payload.boundaries?.providerSnapshotRequired !== true))) {
    throw new Error('The billing destination could not be verified.');
  }
  const url = new URL(value.url);
  if (url.protocol !== 'https:' || url.hostname !== host || url.port || url.username || url.password) throw new Error('The billing destination could not be verified.');
  return url.href;
}
export function productionBillingStatus(payload) {
  const states = ['active', 'cancel_at_period_end', 'grace', 'past_due', 'expired_read_only', 'refunded', 'revoked', 'previewing'];
  const sub = payload?.subscription;
  if (payload?.contractVersion !== 'commerce-stripe-production-v1' || payload.testOnly !== false
    || typeof payload.canManage !== 'boolean' || typeof payload.checkoutPending !== 'boolean'
    || (sub !== null && (!states.includes(sub?.state) || typeof sub.cancelAtPeriodEnd !== 'boolean'
      || (sub.currentPeriodEndsAt !== null && !Number.isFinite(Date.parse(sub.currentPeriodEndsAt)))))) throw new Error('Your billing status could not be verified.');
  return payload;
}
