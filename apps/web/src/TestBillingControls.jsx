import { useI18n } from "./i18n/I18nProvider.jsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { billingStateLabel, testBillingDestination } from "./commercialAccess.js";

// Visible only to explicitly enrolled, expiring test accounts. Ordinary purchase
// routing remains closed; a provider return URL never changes access locally.
export function TestBillingControls({ commerce, onAccessChanged }) {
  const { t, formatDate, formatMoney, errorMessage } = useI18n();
  const [status, setStatus] = useState(null);
  const [period, setPeriod] = useState("annual");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const requestVersion = useRef(0);
  const checkoutKey = useRef(crypto.randomUUID());
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const [billing, access] = await Promise.all([
        api.getTestBillingStatus(), api.getCommerceStatus(commerce.serviceMarketCode),
      ]);
      if (version !== requestVersion.current) return;
      if (billing.contractVersion !== "commerce-stripe-test-v1" || billing.testOnly !== true
        || billing.validationOnly !== true || !Array.isArray(billing.orders) || !Array.isArray(billing.subscriptions)) {
        throw new Error("Test billing is no longer enabled for this account.");
      }
      setStatus(billing); setError(""); onAccessChanged(access);
    } catch (failure) {
      if (version === requestVersion.current) { setStatus(null); setError(failure); }
    }
  }, [commerce.serviceMarketCode, onAccessChanged]);
  useEffect(() => { void refresh(); return () => { ++requestVersion.current; }; }, [refresh]);
  const run = async (operation) => {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try { await operation(); } catch (failure) { setError(failure); }
    finally { setBusy(false); }
  };
  const pending = status?.orders.some(order => ["created", "pending"].includes(order.status));
  const subscribed = status?.subscriptions.some(subscription => ["active", "cancel_at_period_end", "grace", "past_due", "refunded", "revoked"].includes(subscription.state));
  const subscription = status?.subscriptions[0];
  const offer = commerce.offers.find(item => item.billingInterval === period);
  return <details className="task-details test-billing-controls" open>
    <summary>{t("workspace.testBilling.title")}</summary>
    {error && <p role="alert">{error?.status === 404 ? t("workspace.testBilling.unavailable") : errorMessage(error, "workspace.testBilling.error")}</p>}
    {message && <p role="status">{t(message)}</p>}
    {subscription && <p>{billingStateLabel(subscription.cancelAtPeriodEnd ? "cancel_at_period_end" : subscription.state, t)}
      {subscription.currentPeriodEndsAt && !["refunded", "revoked"].includes(subscription.state) && <> · {t(subscription.cancelAtPeriodEnd
        ? "workspace.billing.paidEnds"
        : subscription.state === "expired_read_only" ? "workspace.billing.periodEnded" : "workspace.billing.periodEnds",
      { date: formatDate(subscription.currentPeriodEndsAt) })}</>}</p>}
    {!subscribed && <>
      <fieldset disabled={busy || !status}><legend>{t("workspace.testBilling.subscription")}</legend>
        {commerce.offers.map(item => <label key={item.priceCode}><input type="radio" name="test-billing-period"
          checked={period === item.billingInterval} onChange={() => { setPeriod(item.billingInterval); setAcknowledged(false); checkoutKey.current = crypto.randomUUID(); }} />
          {t(item.billingInterval === "annual" ? "workspace.price.annual" : "workspace.price.monthly", { price: formatMoney(item.amountMinor, item.currencyCode, item.minorUnitExponent) })}</label>)}
      </fieldset>
      <label><input type="checkbox" checked={acknowledged} disabled={busy || !status} onChange={event => setAcknowledged(event.target.checked)} />
        {t(period === "annual" ? "workspace.testBilling.acknowledgeAnnual" : "workspace.testBilling.acknowledgeMonthly")}</label>
      <button className="primary-button" disabled={busy || !status || !acknowledged || !offer} onClick={() => run(async () => {
        const result = await api.startTestCheckout(period, checkoutKey.current);
        window.location.assign(testBillingDestination(result, "checkout"));
      })}>{busy ? t("workspace.testBilling.working") : pending ? t("workspace.testBilling.continue") : t("workspace.testBilling.open")}</button>
    </>}
    <div className="drawer-actions">
      {status?.subscriptions.length > 0 && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        window.location.assign(testBillingDestination(await api.openTestBillingPortal(), "portal"));
      })}>{t("workspace.testBilling.manage")}</button>}
      {pending && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        await api.cancelTestCheckout(); checkoutKey.current = crypto.randomUUID(); setAcknowledged(false);
        await refresh(); setMessage("workspace.testBilling.checkoutClosed");
      })}>{t("workspace.billing.closeCheckout")}</button>}
      <button className="secondary-button" disabled={busy} onClick={() => run(refresh)}>{t("workspace.billing.refresh")}</button>
    </div>
    <p>{t("workspace.testBilling.serverBoundary")}</p>
  </details>;
}
