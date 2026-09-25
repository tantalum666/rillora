import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { publicRoutes } from './publicRoutes.js';
import { productionBillingDestination, productionBillingStatus, purchaseProof, purchaseQuote } from './productionBilling.js';

export function ProductionBillingControls({ commerce, onAccessChanged, returnedFromCheckout = false, apiClient = api }) {
  const [status, setStatus] = useState(null);
  const [quote, setQuote] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const requestVersion = useRef(0), checkoutKey = useRef(crypto.randomUUID()), locked = useRef(false);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const billing = productionBillingStatus(await apiClient.getProductionBillingStatus());
      const access = await apiClient.getCommerceStatus(commerce.serviceMarketCode);
      if (version !== requestVersion.current) return;
      setStatus(billing); setError(''); onAccessChanged(access);
    } catch (failure) {
      if (version !== requestVersion.current) return;
      if (failure.status === 404) { setStatus(null); return; }
      setError(failure.message);
    }
  }, [apiClient, commerce.serviceMarketCode, onAccessChanged]);
  useEffect(() => { void refresh(); return () => { ++requestVersion.current; }; }, [refresh]);
  const run = async operation => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setMessage('');
    try { await operation(); } catch (failure) { setError(failure.message); }
    finally { locked.current = false; setBusy(false); }
  };
  if (!status && !error) return null;
  const sub = status?.subscription;
  const active = commerce.currentAccess?.planCode === 'family';
  const annualAvailable = commerce.billingOpen && commerce.offers.some(offer => offer.priceCode === 'family_usd_annual_v3' && offer.purchasable);
  const labels = { active: 'Family is active', cancel_at_period_end: 'Renewal canceled', grace: 'Payment needs attention', past_due: 'Payment needs attention', expired_read_only: 'Family has ended', refunded: 'Payment refunded', revoked: 'Family access ended' };
  return <section className="task-details production-billing-controls" aria-label="Family subscription">
    <h2>{sub ? labels[sub.state] ?? 'Family subscription' : 'Rillora Family'}</h2>
    {sub?.currentPeriodEndsAt && <p>{sub.cancelAtPeriodEnd ? 'Paid access ends ' : active ? 'Current period ends ' : 'Last period ended '}{new Date(sub.currentPeriodEndsAt).toLocaleDateString()}</p>}
    {returnedFromCheckout && status?.checkoutPending && !active && <p role="status">Payment confirmation may take a moment. Refresh access to check the latest result.</p>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {!active && annualAvailable && !quote && <><p className="access-plan-price"><strong>US$88.80/year</strong></p>
      <button className="primary-button" disabled={busy || !status} onClick={() => run(async () => {
        const route = await apiClient.resolvePurchaseRoute({ clientSurface: 'web', serviceMarketCode: commerce.serviceMarketCode, intent: 'plan_access' });
        if (route.reason !== 'available' || route.purchaseRoute !== 'web_direct') throw new Error('A new subscription is not available. Refresh access or manage your existing subscription.');
        setQuote(purchaseQuote(await apiClient.getProductionPurchaseQuote())); setAccepted(false);
      })}>{status?.checkoutPending ? 'Continue checkout' : 'Review annual subscription'}</button></>}
    {quote && !active && annualAvailable && <form onSubmit={event => { event.preventDefault(); void run(async () => {
      const result = await apiClient.startProductionCheckout(purchaseProof(quote, accepted), checkoutKey.current);
      window.location.assign(productionBillingDestination(result, 'checkout'));
    }); }}>
      <p className="access-plan-price"><strong>US$88.80/year</strong></p>
      <p>Renews yearly until canceled. Cancel in Manage subscription before the next renewal. Any applicable tax is shown at checkout.</p>
      <label><input type="checkbox" checked={accepted} disabled={busy} onChange={event => setAccepted(event.target.checked)} />
        <span>I agree to the <a href={publicRoutes.subscriptions} target="_blank" rel="noopener noreferrer">Subscription Terms</a> and <a href={publicRoutes.refunds} target="_blank" rel="noopener noreferrer">Refund Policy</a>, including yearly renewal and cancellation.</span></label>
      <button className="primary-button" type="submit" disabled={!accepted || busy}>Continue to secure checkout</button>
      <button className="text-button" type="button" disabled={busy} onClick={() => { setQuote(null); setAccepted(false); }}>Back</button>
    </form>}
    {!active && !annualAvailable && <p>New subscriptions are not available yet.</p>}
    <div className="drawer-actions">
      {status?.canManage && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        window.location.assign(productionBillingDestination(await apiClient.openProductionBillingPortal(), 'portal'));
      })}>Manage subscription</button>}
      {status?.checkoutPending && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        await apiClient.cancelProductionCheckout(); checkoutKey.current = crypto.randomUUID(); setQuote(null); setAccepted(false);
        await refresh(); setMessage('Unfinished checkout closed.');
      })}>Close unfinished checkout</button>}
      <button className="secondary-button" disabled={busy} onClick={() => run(refresh)}>{busy ? 'Checking…' : 'Refresh access'}</button>
    </div>
  </section>;
}
