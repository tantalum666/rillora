import { ArrowRight, LockKey } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { MatterAccountGuides } from "./MatterAccountGuides.jsx";
import { matterDraftChanged } from "./matterForm.js";
import { hasValue, locationTitle, matterCategories, matterFields, matterValidation, providerTitle, requiresLocation, requiresProvider, showsAccountHint, showsProvider } from "./matterForm.js";

const outcomes = [["undecided", "Not decided"], ["notify", "Notify someone"], ["transfer_request", "Request transfer"], ["close", "Request closure"], ["delete_request", "Request deletion"], ["memorialize", "Request memorialization"], ["delay_disclosure", "Delay disclosure"], ["never_disclose", "Never disclose"]];

export function MatterForm({ draft, onChange, busy, onSave, isNew, onReload, persistenceFailed, onArchive, onManageSharing }) {
  const errorRef = useRef(null);
  const saveRef = useRef(null);
  useEffect(() => {
    if (draft.error && !busy) {
      errorRef.current?.focus({ preventScroll: true });
      saveRef.current?.scrollIntoView({ block: "end" });
    }
  }, [draft.error, busy]);
  const validation = matterValidation(draft);
  const details = draft.details ?? {};
  const setDetail = (key, value) => onChange("details", { ...details, [key]: value });
  const text = (key, title, placeholder, required = false, max = 160) => <label className="field-label" key={key}>{title}<small>{required ? "Required" : "Optional"}</small><input aria-label={title} autoCorrect={key === "title" || key === "institution" ? "off" : undefined} required={required} value={draft[key] ?? ""} placeholder={placeholder} maxLength={max} onChange={(event) => onChange(key, event.target.value)} /></label>;
  return <form className="matter-form" onSubmit={(event) => { event.preventDefault(); if (!validation && !busy) onSave(); }}>
    <fieldset disabled={busy}>
      <label className="field-label">Category<small>Required</small><select aria-label="Category" value={draft.category} onChange={(event) => onChange("category", event.target.value)}>{matterCategories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {text("title", "Name", "Name this matter", true, 120)}
      <section className="matter-form-section" aria-label="Details">
        {draft.category === "crypto_asset" && <label className="field-label">Held in<small>Required</small><select aria-label="Held in" required value={details.cryptoCustody ?? ""} onChange={(event) => setDetail("cryptoCustody", event.target.value)}><option value="">Choose…</option><option value="exchange">An exchange</option><option value="self_custody">An on-chain wallet</option></select></label>}
        {showsProvider(draft) && text("institution", providerTitle(draft.category), providerTitle(draft.category), requiresProvider(draft))}
        <MatterAccountGuides preparing fields={{ title: draft.title, institutionName: showsProvider(draft) ? draft.institution : undefined, category: draft.category, cryptoCustody: details.cryptoCustody }}/>
        {matterFields(draft).map(({ key, label, placeholder, required, max }) => <label className="field-label" key={key}>{label}<small>{required ? "Required" : "Optional"}</small>{key === "walletAddress" ? <textarea aria-label={label} rows={2} value={details[key] ?? ""} placeholder={placeholder} required={required} maxLength={max} spellCheck={false} autoCapitalize="none" onChange={(event) => setDetail(key, event.target.value)} /> : <input aria-label={label} type={key === "renewalDate" ? "date" : "text"} value={details[key] ?? ""} placeholder={placeholder} required={required} maxLength={max} spellCheck={false} autoCapitalize="none" onChange={(event) => setDetail(key, event.target.value)} />}</label>)}
        {draft.category === "subscription" && <label className="field-label">Billing cycle<small>Optional</small><select aria-label="Billing cycle" value={details.billingCycle ?? ""} onChange={(event) => setDetail("billingCycle", event.target.value)}><option value="">Not added</option><option value="monthly">Monthly</option><option value="annual">Annual</option><option value="other">Other</option></select></label>}
        {text("location", locationTitle(draft.category), "A useful location, never a password", requiresLocation(draft.category), 500)}
        {showsAccountHint(draft) && text("accountHint", draft.category === "device" ? "Masked serial hint" : "Username or masked reference", "For example, ending 42")}
        {hasValue(draft.category) && <details className="task-details"><summary>Value · Optional</summary><label className="field-label">Value range<select aria-label="Value range" value={draft.valueBand} onChange={(event) => onChange("valueBand", event.target.value)}>{[["unknown", "Unknown / not stated"], ["none", "No monetary value"], ["under_1k", "Under 1,000"], ["1k_10k", "1,000–10,000"], ["10k_100k", "10,000–100,000"], ["100k_plus", "100,000+"]].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>{text("currencyCode", "Currency", "USD or HKD", false, 3)}</details>}
      </section>
      <section className="matter-form-section" aria-label="Directions">
        <label className="field-label">Preferred outcome<small>Optional</small><select aria-label="Preferred outcome" value={draft.desiredOutcome} onChange={(event) => onChange("desiredOutcome", event.target.value)}>{outcomes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <details className="task-details"><summary>More options</summary><label className="field-label">Importance<select value={draft.importance} onChange={(event) => onChange("importance", event.target.value)}>{["standard", "important", "critical"].map((value) => <option key={value} value={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}</select></label><label className="field-label">Preparation status<select value={draft.status} onChange={(event) => onChange("status", event.target.value)}><option value="draft">Draft</option><option value="ready">Directions added</option><option value="needs_review">Needs review</option></select></label></details>
      </section>
      <p className="matter-privacy"><LockKey size={18} aria-hidden="true" />{isNew ? "Private until you choose to share" : "Shared only as you choose"}</p>{!isNew && <><button className="text-button" type="button" disabled={busy || matterDraftChanged(draft)} onClick={onManageSharing}>Manage who can see this</button>{matterDraftChanged(draft) && <p className="matter-form-hint">Save your changes to manage sharing.</p>}</>}
      <label className="field-label">Notes<small>Optional</small><textarea aria-label="Notes" rows={4} maxLength={2000} value={draft.notes} placeholder="Anything else someone should know" onChange={(event) => onChange("notes", event.target.value)} /></label>
      <p className="matter-form-hint">Keep passwords, private keys and recovery phrases out.</p>
      {persistenceFailed && <p className="matter-form-validation" role="status">This browser cannot keep a draft after refresh. Keep this page open until you save.</p>}
      {draft.title.trim() && validation && <p className="matter-form-validation" role="status">{validation}</p>}
      {draft.error && <div className="drawer-alert matter-save-error" role="alert" tabIndex={-1} ref={errorRef}><strong>Draft kept</strong><p>{draft.error}</p>{onReload && <button className="secondary-button" type="button" onClick={onReload}>Review latest saved version</button>}</div>}
      <button ref={saveRef} className="primary-button drawer-primary" type="submit" disabled={busy || !!validation || (!isNew && !matterDraftChanged(draft))}>{busy ? "Saving…" : draft.error ? "Try saving again" : "Save matter"}{!busy && <ArrowRight size={20} />}</button>
      {onArchive && <button className="text-button danger-text" type="button" disabled={busy} onClick={onArchive}>Archive matter</button>}
    </fieldset>
  </form>;
}
