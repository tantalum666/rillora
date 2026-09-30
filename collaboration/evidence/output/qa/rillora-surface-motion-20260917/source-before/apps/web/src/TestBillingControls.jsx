import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { formatMoneyMinor, testBillingDestination } from "./commercialAccess.js";

// Visible only to explicitly enrolled, expiring test accounts. Ordinary purchase
// routing remains closed; a provider return URL never changes access locally.
export function TestBillingControls({ commerce, onAccessChanged }) {
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
      if (version === requestVersion.current) { setStatus(null); setError(failure.message); }
    }
  }, [commerce.serviceMarketCode, onAccessChanged]);
  useEffect(() => { void refresh(); return () => { ++requestVersion.current; }; }, [refresh]);
  const run = async (operation) => {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try { await operation(); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const pending = status?.orders.some(order => ["created", "pending"].includes(order.status));
  const subscribed = status?.subscriptions.some(subscription => ["active", "cancel_at_period_end", "grace", "past_due", "refunded", "revoked"].includes(subscription.state));
  const subscription = status?.subscriptions[0];
  const offer = commerce.offers.find(item => item.billingInterval === period);
  return <details className="task-details test-billing-controls" open>
    <summary>Test billing · No real charge</summary>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {subscription && <p>{subscription.cancelAtPeriodEnd ? "Renewal canceled" : subscription.state.replaceAll("_", " ")}
      {subscription.currentPeriodEndsAt && ` · Current period ends ${new Date(subscription.currentPeriodEndsAt).toLocaleDateString()}`}</p>}
    {!subscribed && <>
      <fieldset disabled={busy || !status}><legend>Test subscription</legend>
        {commerce.offers.map(item => <label key={item.priceCode}><input type="radio" name="test-billing-period"
          checked={period === item.billingInterval} onChange={() => { setPeriod(item.billingInterval); setAcknowledged(false); checkoutKey.current = crypto.randomUUID(); }} />
          {formatMoneyMinor(item.amountMinor, item.currencyCode, item.minorUnitExponent)}/{item.billingInterval === "annual" ? "year" : "month"}</label>)}
      </fieldset>
      <label><input type="checkbox" checked={acknowledged} disabled={busy || !status} onChange={event => setAcknowledged(event.target.checked)} />
        I understand this test subscription renews {period === "annual" ? "yearly" : "monthly"} until canceled. No real payment will be taken.</label>
      <button className="primary-button" disabled={busy || !status || !acknowledged || !offer} onClick={() => run(async () => {
        const result = await api.startTestCheckout(period, checkoutKey.current);
        window.location.assign(testBillingDestination(result, "checkout"));
      })}>{busy ? "Working…" : pending ? "Continue test checkout" : "Open test checkout"}</button>
    </>}
    <div className="drawer-actions">
      {status?.subscriptions.length > 0 && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        window.location.assign(testBillingDestination(await api.openTestBillingPortal(), "portal"));
      })}>Manage test subscription</button>}
      {pending && <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
        await api.cancelTestCheckout(); checkoutKey.current = crypto.randomUUID(); setAcknowledged(false);
        await refresh(); setMessage("Unfinished checkout closed. You can choose either billing period.");
      })}>Close unfinished checkout</button>}
      <button className="secondary-button" disabled={busy} onClick={() => run(refresh)}>Refresh access</button>
    </div>
    <p>Access changes only after the server confirms the test payment.</p>
  </details>;
}
