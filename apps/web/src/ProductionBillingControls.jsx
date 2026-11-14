import { useI18n } from "./i18n/I18nProvider.jsx";
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscriptionPreventsNewCheckout } from "./commercialAccess.js";
import { api } from './api.js';
import { SubscriptionConsentText } from './LegalConsentText.jsx';
import { currentWebAnnualOffer, productionBillingDestination, productionBillingStatus, purchaseProof, purchaseQuote } from './productionBilling.js';

export function ProductionBillingControls({ commerce, onAccessChanged, returnedFromCheckout = false, apiClient = api }) {
  const { t, locale, formatDate, errorMessage } = useI18n();
  const [status, setStatus] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const requestVersion = useRef(0), checkoutKey = useRef(crypto.randomUUID()), locked = useRef(false);
  const appleManaged = commerce.currentAccess?.managementDestination === 'app_store_subscriptions';
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    if (appleManaged) { setStatus(null); setError(null); return; }
    try {
      const billing = productionBillingStatus(await apiClient.getProductionBillingStatus());
      const access = await apiClient.getCommerceStatus(commerce.serviceMarketCode);
      if (version !== requestVersion.current) return;
      setStatus(billing); setError(null); onAccessChanged(access);
    } catch (failure) {
      if (version !== requestVersion.current) return;
      setStatus(null); setError(failure);
    }
  }, [apiClient, appleManaged, commerce.serviceMarketCode, onAccessChanged]);
  useEffect(() => { void refresh(); return () => { ++requestVersion.current; }; }, [refresh]);
  const run = async operation => {
    if (locked.current) return;
    const version = requestVersion.current;
    locked.current = true; setBusy(true); setError(null);
    try { await operation(() => version === requestVersion.current); }
    catch (failure) { if (version === requestVersion.current) setError(failure); }
    finally { locked.current = false; setBusy(false); }
  };
  const active = commerce.currentAccess?.planCode === 'family';
  const sub = status?.subscription ?? commerce.currentAccess?.subscription;
  const managesExisting = active || appleManaged || subscriptionPreventsNewCheckout(sub);
  const offer = currentWebAnnualOffer(commerce.offers);
  const canSubscribe = commerce.billingOpen && offer?.purchasable === true
    && status?.checkoutAvailability === 'available';
  const subscribe = () => run(async isCurrent => {
    const route = await apiClient.resolvePurchaseRoute({ clientSurface: 'web', serviceMarketCode: commerce.serviceMarketCode, intent: 'plan_access' });
    if (!isCurrent()) return;
    if (route.reason !== 'available' || route.purchaseRoute !== 'web_direct') throw new Error('A new subscription is not available. Refresh access or manage your existing subscription.');
    const quote = purchaseQuote(await apiClient.getProductionPurchaseQuote());
    if (!isCurrent()) return;
    if (!offer || quote.amountMinor !== offer.amountMinor || quote.currency !== offer.currencyCode) throw new Error('The subscription terms changed. Reload before continuing.');
    // Only this click accepts the visible annual offer beside the renewal and legal text.
    const result = await apiClient.startProductionCheckout(purchaseProof(quote, true), checkoutKey.current, locale);
    if (isCurrent()) window.location.assign(productionBillingDestination(result, 'checkout'));
  });
  const manage = () => run(async isCurrent => {
    const result = await apiClient.openProductionBillingPortal(locale);
    if (isCurrent()) window.location.assign(productionBillingDestination(result, 'portal'));
  });
  return <div className="production-billing-controls plan-purchase-actions">
    {appleManaged ? <a className="primary-button" href="https://apps.apple.com/account/subscriptions">{t("workspace.billing.manageApple")}</a>
      : managesExisting ? <button className="primary-button" disabled={busy || !status?.canManage} onClick={manage}>
        {t(busy ? "workspace.billing.checking" : status?.canManage ? "workspace.billing.manage" : "workspace.billing.subscribed")}</button>
      : <button className="primary-button" disabled={busy || !canSubscribe} onClick={subscribe}>
        {t(busy ? "workspace.billing.checking" : status?.checkoutPending ? "workspace.billing.continueCheckout" : "workspace.billing.subscribe")}</button>}
    {!managesExisting && <div className="billing-disclosure">
      {!commerce.billingOpen && <p>{t("workspace.billing.newClosed")}</p>}
      {commerce.billingOpen && status?.checkoutAvailability === 'account_unavailable'
        && <p role="status">{t("workspace.billing.accountUnavailable")}</p>}
      {commerce.billingOpen && status?.checkoutAvailability === 'unavailable'
        && <p role="status">{t("workspace.billing.unavailable")}</p>}
      <p>{t("workspace.billing.renewalShort")}</p><p><SubscriptionConsentText bySubscribing /></p>
    </div>}
    {sub?.currentPeriodEndsAt && !['refunded', 'revoked'].includes(sub.state) && <p className="billing-disclosure">{t(sub.cancelAtPeriodEnd ? "workspace.billing.paidEnds" : active ? "workspace.billing.periodEnds" : "workspace.billing.periodEnded", { date: formatDate(sub.currentPeriodEndsAt) })}</p>}
    {sub && ['refunded', 'revoked'].includes(sub.state) && sub.renewalIsPossible !== false && <p className="billing-disclosure">{t("workspace.billing.checkRenewalAfterRefund")}</p>}
    {returnedFromCheckout && status?.checkoutPending && !active && <p role="status">{t("workspace.billing.confirmationPending")}</p>}
    {error && <p role="alert">{error.status === 404 ? t("workspace.billing.unavailable") : errorMessage(error, "workspace.billing.errorOperation")} <button className="text-button" disabled={busy} onClick={() => run(refresh)}>{t("workspace.billing.refresh")}</button></p>}
    {status?.canManage && !managesExisting && <button className="text-button" disabled={busy} onClick={manage}>{t("workspace.billing.manage")}</button>}
    {status?.checkoutPending && <button className="text-button" disabled={busy} onClick={() => run(async () => {
      await apiClient.cancelProductionCheckout(); checkoutKey.current = crypto.randomUUID(); await refresh();
    })}>{t("workspace.billing.closeCheckout")}</button>}
  </div>;
}
