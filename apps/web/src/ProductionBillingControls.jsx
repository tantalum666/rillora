import { useI18n } from "./i18n/I18nProvider.jsx";
import { useCallback, useEffect, useRef, useState } from 'react';
import { billingStateLabel } from "./commercialAccess.js";
import { api } from './api.js';
import { publicRoutes } from './publicRoutes.js';
import { productionBillingDestination, productionBillingStatus, purchaseProof, purchaseQuote, webAnnualOffer } from './productionBilling.js';

export function ProductionBillingControls({ commerce, onAccessChanged, returnedFromCheckout = false, apiClient = api, embedded = false }) {
  const { t, formatDate, formatMoney, errorMessage } = useI18n();
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
      setError(failure);
    }
  }, [apiClient, commerce.serviceMarketCode, onAccessChanged]);
  useEffect(() => { void refresh(); return () => { ++requestVersion.current; }; }, [refresh]);
  const run = async operation => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setMessage('');
    try { await operation(); } catch (failure) { setError(failure); }
    finally { locked.current = false; setBusy(false); }
  };
  if (!status && !error) return null;
  const sub = status?.subscription;
  const active = commerce.currentAccess?.planCode === 'family';
  const annualAvailable = commerce.billingOpen && commerce.offers.some(offer => offer.priceCode === webAnnualOffer.priceCode && offer.purchasable);
  const annualPrice = t("workspace.price.annual", { price: formatMoney(webAnnualOffer.amountMinor, webAnnualOffer.currency, 2) });
  return <section className="task-details production-billing-controls" aria-label={t("workspace.billing.subscription")}>
    {(sub || !embedded) && <h2>{sub ? billingStateLabel(sub.state, t) : t("workspace.billing.family")}</h2>}
    {sub?.currentPeriodEndsAt && <p>{t(sub.cancelAtPeriodEnd ? "workspace.billing.paidEnds" : active ? "workspace.billing.periodEnds" : "workspace.billing.periodEnded", { date: formatDate(sub.currentPeriodEndsAt) })}</p>}
    {returnedFromCheckout && status?.checkoutPending && !active && <p role="status">{t("workspace.billing.confirmationPending")}</p>}
    {error && <p role="alert">{errorMessage(error, "workspace.billing.errorOperation")}</p>}{message && <p role="status">{t(message)}</p>}
    {!active && annualAvailable && !quote && <>{!embedded && <p className="access-plan-price"><strong>{annualPrice}</strong></p>}
      <button className="primary-button" disabled={busy || !status} onClick={() => run(async () => {
        const route = await apiClient.resolvePurchaseRoute({ clientSurface: 'web', serviceMarketCode: commerce.serviceMarketCode, intent: 'plan_access' });
        if (route.reason !== 'available' || route.purchaseRoute !== 'web_direct') throw new Error('A new subscription is not available. Refresh access or manage your existing subscription.');
        setQuote(purchaseQuote(await apiClient.getProductionPurchaseQuote())); setAccepted(false);
      })}>{status?.checkoutPending ? t("workspace.billing.continueCheckout") : t("workspace.billing.reviewAnnual")}</button></>}
    {quote && !active && annualAvailable && <form onSubmit={event => { event.preventDefault(); void run(async () => {
      const result = await apiClient.startProductionCheckout(purchaseProof(quote, accepted), checkoutKey.current);
      window.location.assign(productionBillingDestination(result, 'checkout'));
    }); }}>
      <p className="access-plan-price"><strong>{annualPrice}</strong></p>
      <p>{t("workspace.billing.renewal")}</p>
      <label><input type="checkbox" checked={accepted} disabled={busy} onChange={event => setAccepted(event.target.checked)} />
        <span lang="en">I agree to the <a href={publicRoutes.subscriptions} target="_blank" rel="noopener noreferrer">Subscription Terms</a> and <a href={publicRoutes.refunds} target="_blank" rel="noopener noreferrer">Refund Policy</a>, including yearly renewal and cancellation.</span></label>
      <button className="primary-button" type="submit" disabled={!accepted || busy}>{t("workspace.billing.secureCheckout")}</button>
      <button className="text-button" type="button" disabled={busy} onClick={() => { setQuote(null); setAccepted(false); }}>{t("workspace.billing.back")}</button>
    </form>}
    {!active && !annualAvailable && <p>{t("workspace.billing.newClosed")}</p>}
    <div className="drawer-actions">
      {status?.canManage && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        window.location.assign(productionBillingDestination(await apiClient.openProductionBillingPortal(), 'portal'));
      })}>{t("workspace.billing.manage")}</button>}
      {status?.checkoutPending && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        await apiClient.cancelProductionCheckout(); checkoutKey.current = crypto.randomUUID(); setQuote(null); setAccepted(false);
        await refresh(); setMessage("workspace.billing.checkoutClosed");
      })}>{t("workspace.billing.closeCheckout")}</button>}
      <button className="secondary-button" disabled={busy} onClick={() => run(refresh)}>{busy ? t("workspace.billing.checking") : t("workspace.billing.refresh")}</button>
    </div>
  </section>;
}
