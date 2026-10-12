import { useI18n } from "./i18n/I18nProvider.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { testBillingDestination, subscriptionPreventsNewCheckout } from "./commercialAccess.js";
import { currentWebAnnualOffer } from './productionBilling.js';
import { SubscriptionConsentText } from './LegalConsentText.jsx';

// Explicit test boundaries, with the same paid-plan presentation as production.
export function TestBillingControls({ commerce, onAccessChanged }) {
  const { t, locale, formatDate, errorMessage } = useI18n();
  const [status, setStatus] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const requestVersion = useRef(0), locked = useRef(false), checkoutKey = useRef(crypto.randomUUID());
  const appleManaged = commerce.currentAccess?.managementDestination === 'app_store_subscriptions';
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    if (appleManaged) { setStatus(null); setError(null); return; }
    try {
      const [billing, access] = await Promise.all([api.getTestBillingStatus(), api.getCommerceStatus(commerce.serviceMarketCode)]);
      if (version !== requestVersion.current) return;
      if (billing.contractVersion !== "commerce-stripe-test-v1" || billing.testOnly !== true
        || billing.validationOnly !== true || !Array.isArray(billing.orders) || !Array.isArray(billing.subscriptions)) throw new Error("Test billing is no longer enabled for this account.");
      setStatus(billing); setError(null); onAccessChanged(access);
    } catch (failure) { if (version === requestVersion.current) { setStatus(null); setError(failure); } }
  }, [appleManaged, commerce.serviceMarketCode, onAccessChanged]);
  useEffect(() => { void refresh(); return () => { ++requestVersion.current; }; }, [refresh]);
  const run = async operation => {
    if (locked.current) return;
    const version = requestVersion.current;
    locked.current = true; setBusy(true); setError(null);
    try { await operation(() => version === requestVersion.current); }
    catch (failure) { if (version === requestVersion.current) setError(failure); }
    finally { locked.current = false; setBusy(false); }
  };
  const pending = status?.orders.some(order => ["created", "pending"].includes(order.status));
  const subscribed = commerce.currentAccess?.planCode === 'family' || status?.subscriptions.some(subscriptionPreventsNewCheckout);
  const subscription = status?.subscriptions[0];
  const offer = currentWebAnnualOffer(commerce.offers);
  const manage = () => run(async isCurrent => {
    const result = await api.openTestBillingPortal(locale); if (isCurrent()) window.location.assign(testBillingDestination(result, "portal"));
  });
  return <div className="test-billing-controls plan-purchase-actions">
    <p className="billing-disclosure">{t("workspace.testBilling.noCharge")}</p>
    {appleManaged ? <a className="primary-button" href="https://apps.apple.com/account/subscriptions">{t("workspace.billing.manageApple")}</a>
      : subscribed ? <button className="primary-button" disabled={busy || !status?.subscriptions.length} onClick={manage}>{t(busy ? "workspace.testBilling.working" : "workspace.billing.manage")}</button>
      : <button className="primary-button" disabled={busy || !status || !offer} onClick={() => run(async isCurrent => {
        const result = await api.startTestCheckout('annual', checkoutKey.current, locale);
        if (isCurrent()) window.location.assign(testBillingDestination(result, "checkout"));
      })}>{t(busy ? "workspace.testBilling.working" : pending ? "workspace.testBilling.continue" : "workspace.billing.subscribe")}</button>}
    {!subscribed && !appleManaged && <div className="billing-disclosure"><p>{t("workspace.billing.renewalShort")}</p><p><SubscriptionConsentText bySubscribing /></p></div>}
    {subscription?.currentPeriodEndsAt && !['refunded', 'revoked'].includes(subscription.state) && <p className="billing-disclosure">{t(subscription.cancelAtPeriodEnd ? "workspace.billing.paidEnds" : subscription.state === "expired_read_only" ? "workspace.billing.periodEnded" : "workspace.billing.periodEnds", { date: formatDate(subscription.currentPeriodEndsAt) })}</p>}
    {subscription && ['refunded', 'revoked'].includes(subscription.state) && subscription.renewalIsPossible !== false && <p className="billing-disclosure">{t("workspace.billing.checkRenewalAfterRefund")}</p>}
    {error && !appleManaged && <p role="alert">{error.status === 404 ? t("workspace.testBilling.unavailable") : errorMessage(error, "workspace.testBilling.error")} <button className="text-button" disabled={busy} onClick={() => run(refresh)}>{t("workspace.billing.refresh")}</button></p>}
    {status?.subscriptions.length > 0 && !subscribed && !appleManaged && <button className="text-button" disabled={busy} onClick={manage}>{t("workspace.billing.manage")}</button>}
    {pending && <button className="text-button" disabled={busy} onClick={() => run(async () => {
      await api.cancelTestCheckout(); checkoutKey.current = crypto.randomUUID(); await refresh();
    })}>{t("workspace.billing.closeCheckout")}</button>}
  </div>;
}
