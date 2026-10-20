import { useI18n } from "./i18n/I18nProvider.jsx";
import { useState } from "react";
import {
  ArrowRight,
  ClockCounterClockwise,
  Compass,
  FileText,
  Plus,
} from "@phosphor-icons/react";
import {
  guideActionLabel,
  shouldShowFirstUsePanel,
} from "./firstUse.js";

export function FirstUseStarter({ plan, busy, onAddMatter, onOpenGuide, onPause }) {
  const { t } = useI18n();
  if (!shouldShowFirstUsePanel(plan)) return null;

  return (
    <section className="first-use-starter" aria-labelledby="first-use-heading">
      <div className="first-use-heading">
        <div>
          <h2 id="first-use-heading">{t("forms.firstUse.start")}</h2>
        </div>
        <Compass size={28} aria-hidden="true" />
      </div>

      <div className="first-use-options">
        <button className="first-use-option is-primary" type="button" disabled={busy} onClick={onAddMatter}>
          <span className="first-use-option-icon"><Plus size={21} aria-hidden="true" /></span>
          <span><strong>{t("forms.firstUse.addFirst")}</strong></span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
        <button className="first-use-option" type="button" disabled={busy} onClick={onOpenGuide}>
          <span className="first-use-option-icon"><ClockCounterClockwise size={21} aria-hidden="true" /></span>
          <span><strong>{guideActionLabel(plan, t)}</strong></span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </div>

      <button className="text-button first-use-not-now" type="button" disabled={busy} onClick={onPause}>
        {t("forms.firstUse.notNow")}
      </button>
    </section>
  );
}

export function FirstUseGuide({
  step,
  motivation,
  onMotivationChange,
  busy,
  onContinue,
  onSkipQuestion,
  onAddMatter,
  onSaveAndExit,
}) {
  const { t } = useI18n();
  const [category, setCategory] = useState("account");
  return (
    <div className="first-use-guide">
      <div className="first-use-progress" aria-label={t("forms.firstUse.step", { step })}>
        <span className="is-current" />
        <span className={step === 2 ? "is-current" : ""} />
      </div>

      {step === 1 ? (
        <>
          <label className="field-label">{t("forms.firstUse.reason")}
            <select value={motivation} disabled={busy} onChange={(event) => onMotivationChange(event.target.value)}>
              <option value="">{t("forms.firstUse.choose")}</option>
              <option value="life_change">{t("forms.firstUse.reason.life_change")}</option>
              <option value="family_responsibility">{t("forms.firstUse.reason.family_responsibility")}</option>
              <option value="cross_border">{t("forms.firstUse.reason.cross_border")}</option>
              <option value="complex_digital_life">{t("forms.firstUse.reason.complex_digital_life")}</option>
              <option value="recent_estate_experience">{t("forms.firstUse.reason.recent_estate_experience")}</option>
              <option value="general_preparedness">{t("forms.firstUse.reason.general_preparedness")}</option>
              <option value="other">{t("forms.firstUse.reason.other")}</option>
            </select>
          </label>
          <button className="primary-button drawer-primary" type="button" disabled={busy || !motivation} onClick={onContinue}>{t("forms.continue")}<ArrowRight size={20} aria-hidden="true" /></button>
          <button className="secondary-button" type="button" disabled={busy} onClick={onSkipQuestion}>{t("forms.firstUse.skip")}</button>
        </>
      ) : (
        <>
          <div className="task-symbol" aria-hidden="true"><FileText size={62} /></div>
          <label className="field-label">{t("forms.category")}<select value={category} disabled={busy} onChange={(event) => setCategory(event.target.value)}>{["account", "document", "device", "financial_asset", "debt", "subscription", "crypto_asset"].map(value => <option value={value} key={value}>{t(`forms.firstUse.category.${value}`)}</option>)}</select></label>
          <button className="primary-button drawer-primary" type="button" disabled={busy} onClick={() => onAddMatter(category)}>{t("forms.firstUse.addMatter")}<ArrowRight size={20} aria-hidden="true" /></button>
        </>
      )}

      <details className="task-details"><summary>{t("forms.firstUse.about")}</summary><p>{t("forms.firstUse.boundary")}</p></details>
      <button className="text-button first-use-save-exit" type="button" disabled={busy} onClick={onSaveAndExit}>{t("forms.firstUse.saveExit")}</button>
    </div>
  );
}

