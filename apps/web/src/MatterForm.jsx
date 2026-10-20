import { ArrowRight, LockKey } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { MatterAccountGuides } from "./MatterAccountGuides.jsx";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { hasValue, locationTitle, matterCategories, matterDraftChanged, matterFields, matterValidation, providerTitle, requiresLocation, requiresProvider, showsAccountHint, showsProvider } from "./matterForm.js";

const outcomes = ["undecided", "notify", "transfer_request", "close", "delete_request", "memorialize", "delay_disclosure", "never_disclose"];
const valueBands = ["unknown", "none", "under_1k", "1k_10k", "10k_100k", "100k_plus"];

export function MatterForm({ draft, onChange, busy, onSave, isNew, onReload, persistenceFailed, onArchive, onManageSharing }) {
  const { t, formatNumber, errorMessage } = useI18n();
  const formRef = useRef(null);
  useEffect(() => {
    if (!draft.reviewPreparation) return;
    const frame = requestAnimationFrame(() => {
      const section = formRef.current?.querySelector("[data-preparation]");
      if (section) section.open = true;
      const status = section?.querySelector("[data-preparation-status]");
      status?.focus();
      status?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [draft.reviewPreparation]);
  const errorRef = useRef(null);
  const saveRef = useRef(null);
  const saveError = draft.errorKey ? t(draft.errorKey, draft.errorParams) : draft.errorError ? errorMessage(draft.errorError, "workspace.error.save") : draft.error;
  useEffect(() => {
    if ((draft.error || draft.errorKey || draft.errorError) && !busy) {
      errorRef.current?.focus({ preventScroll: true });
      saveRef.current?.scrollIntoView({ block: "end" });
    }
  }, [draft.error, draft.errorKey, draft.errorError, busy]);
  const validation = matterValidation(draft, t, formatNumber);
  const details = draft.details ?? {};
  const setDetail = (key, value) => onChange("details", { ...details, [key]: value });
  const text = (key, title, placeholder, required = false, max = 160) => <label className="field-label" key={key}>{title}<small>{t(required ? "forms.required" : "forms.optional")}</small><input aria-label={title} autoCorrect={key === "title" || key === "institution" ? "off" : undefined} required={required} value={draft[key] ?? ""} placeholder={placeholder} maxLength={max} onChange={(event) => onChange(key, event.target.value)} /></label>;
  return <form ref={formRef} className="matter-form" onSubmit={(event) => { event.preventDefault(); if (!validation && !busy) onSave(); }}>
    <fieldset disabled={busy}>
      <label className="field-label">{t("forms.category")}<small>{t("forms.required")}</small><select aria-label={t("forms.category")} value={draft.category} onChange={(event) => onChange("category", event.target.value)}>{matterCategories.map(([value]) => <option key={value} value={value}>{t(`forms.category.${value}`)}</option>)}</select></label>
      {text("title", t("forms.name"), t("forms.namePlaceholder"), true, 120)}
      <section className="matter-form-section" aria-label={t("forms.details")}>
        {draft.category === "crypto_asset" && <label className="field-label">{t("forms.custody")}<small>{t("forms.required")}</small><select aria-label={t("forms.custody")} required value={details.cryptoCustody ?? ""} onChange={(event) => setDetail("cryptoCustody", event.target.value)}><option value="">{t("forms.custody.choose")}</option><option value="exchange">{t("forms.custody.exchange")}</option><option value="self_custody">{t("forms.custody.self_custody")}</option></select></label>}
        {showsProvider(draft) && text("institution", providerTitle(draft.category, t), providerTitle(draft.category, t), requiresProvider(draft))}
        <MatterAccountGuides preparing fields={{ title: draft.title, institutionName: showsProvider(draft) ? draft.institution : undefined, category: draft.category, cryptoCustody: details.cryptoCustody }}/>
        {matterFields(draft, t).map(({ key, label, placeholder, required, max }) => <label className="field-label" key={key}>{label}<small>{t(required ? "forms.required" : "forms.optional")}</small>{key === "walletAddress" ? <textarea aria-label={label} rows={2} value={details[key] ?? ""} placeholder={placeholder} required={required} maxLength={max} spellCheck={false} autoCapitalize="none" onChange={(event) => setDetail(key, event.target.value)} /> : <input aria-label={label} type={key === "renewalDate" ? "date" : "text"} value={details[key] ?? ""} placeholder={placeholder} required={required} maxLength={max} spellCheck={false} autoCapitalize="none" onChange={(event) => setDetail(key, event.target.value)} />}</label>)}
        {draft.category === "subscription" && <label className="field-label">{t("forms.billingCycle")}<small>{t("forms.optional")}</small><select aria-label={t("forms.billingCycle")} value={details.billingCycle ?? ""} onChange={(event) => setDetail("billingCycle", event.target.value)}><option value="">{t("forms.billingCycle.empty")}</option>{["monthly", "annual", "other"].map(value => <option key={value} value={value}>{t(`forms.billingCycle.${value}`)}</option>)}</select></label>}
        {text("location", locationTitle(draft.category, t), t("forms.location.placeholder"), requiresLocation(draft.category), 500)}
        {showsAccountHint(draft) && text("accountHint", t(draft.category === "device" ? "forms.serialHint" : "forms.accountHint"), t("forms.accountHint.placeholder"))}
        {hasValue(draft.category) && <details className="task-details"><summary>{t("forms.valueOptional")}</summary><label className="field-label">{t("forms.valueBand")}<select aria-label={t("forms.valueBand")} value={draft.valueBand} onChange={(event) => onChange("valueBand", event.target.value)}>{valueBands.map(value => <option key={value} value={value}>{t(`forms.valueBand.${value}`)}</option>)}</select></label>{text("currencyCode", t("forms.currency"), t("forms.currency.placeholder"), false, 3)}</details>}
      </section>
      <section className="matter-form-section" aria-label={t("forms.directions")}>
        <label className="field-label">{t("forms.outcome")}<small>{t("forms.optional")}</small><select aria-label={t("forms.outcome")} value={draft.desiredOutcome} onChange={(event) => onChange("desiredOutcome", event.target.value)}>{outcomes.map(value => <option key={value} value={value}>{t(`forms.outcome.${value}`)}</option>)}</select></label>
        <details className="task-details" data-preparation><summary>{t("forms.moreOptions")}</summary><label className="field-label">{t("forms.importance")}<select value={draft.importance} onChange={(event) => onChange("importance", event.target.value)}>{["standard", "important", "critical"].map(value => <option key={value} value={value}>{t(`forms.importance.${value}`)}</option>)}</select></label><label className="field-label">{t("forms.preparationStatus")}<select data-preparation-status aria-label={t("forms.preparationStatus")} value={draft.status} onChange={(event) => onChange("status", event.target.value)}>{["draft", "ready", "needs_review"].map(value => <option key={value} value={value}>{t(`forms.status.${value}`)}</option>)}</select></label></details>
      </section>
      {draft.reviewPreparation && <p className="matter-form-hint">{t("forms.preparationReview")}</p>}
      <p className="matter-privacy"><LockKey size={18} aria-hidden="true" />{t(isNew ? "forms.privateUntilShared" : "forms.sharedAsChosen")}</p>{!isNew && <><button className="text-button" type="button" disabled={busy || matterDraftChanged(draft)} onClick={onManageSharing}>{t("forms.manageSharing")}</button>{matterDraftChanged(draft) && <p className="matter-form-hint">{t("forms.saveBeforeSharing")}</p>}</>}
      <label className="field-label">{t("forms.notes")}<small>{t("forms.optional")}</small><textarea aria-label={t("forms.notes")} rows={4} maxLength={2000} value={draft.notes} placeholder={t("forms.notesPlaceholder")} onChange={(event) => onChange("notes", event.target.value)} /></label>
      <p className="matter-form-hint">{t("forms.secretsWarning")}</p>
      {persistenceFailed && <p className="matter-form-validation" role="status">{t("forms.draftPersistenceFailed")}</p>}
      {draft.title.trim() && validation && <p className="matter-form-validation" role="status">{validation}</p>}
      {saveError && <div className="drawer-alert matter-save-error" role="alert" tabIndex={-1} ref={errorRef}><strong>{t("forms.draftKept")}</strong><p>{saveError}</p>{onReload && <button className="secondary-button" type="button" onClick={onReload}>{t("forms.reviewLatest")}</button>}</div>}
      <button ref={saveRef} className="primary-button drawer-primary" type="submit" disabled={busy || !!validation || (!isNew && !matterDraftChanged(draft))}>{t(busy ? "forms.saving" : saveError ? "forms.retrySave" : "forms.saveMatter")}{!busy && <ArrowRight size={20} />}</button>
      {onArchive && <button className="text-button danger-text" type="button" disabled={busy} onClick={onArchive}>{t("forms.archiveMatter")}</button>}
    </fieldset>
  </form>;
}
