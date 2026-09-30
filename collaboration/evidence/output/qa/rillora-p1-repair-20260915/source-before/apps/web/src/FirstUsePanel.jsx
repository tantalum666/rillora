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
  normalizeFirstUse,
  shouldShowFirstUsePanel,
} from "./firstUse.js";

export function FirstUseStarter({ plan, busy, onAddMatter, onOpenGuide, onPause }) {
  if (!shouldShowFirstUsePanel(plan)) return null;
  const { state, step } = normalizeFirstUse(plan);
  const resumed = state === "guide_in_progress" || step > 0;

  return (
    <section className="first-use-starter" aria-labelledby="first-use-heading">
      <div className="first-use-heading">
        <div>
          <h2 id="first-use-heading">Get started</h2>
        </div>
        <Compass size={28} aria-hidden="true" />
      </div>

      <div className="first-use-options">
        <button className="first-use-option is-primary" type="button" disabled={busy} onClick={onAddMatter}>
          <span className="first-use-option-icon"><Plus size={21} aria-hidden="true" /></span>
          <span><strong>Add your first matter</strong></span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
        <button className="first-use-option" type="button" disabled={busy} onClick={onOpenGuide}>
          <span className="first-use-option-icon"><ClockCounterClockwise size={21} aria-hidden="true" /></span>
          <span><strong>{guideActionLabel(plan)}</strong></span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </div>

      <button className="text-button first-use-not-now" type="button" disabled={busy} onClick={onPause}>
        Not now
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
  const [category, setCategory] = useState("account");
  return (
    <div className="first-use-guide">
      <div className="first-use-progress" aria-label={`Step ${step} of 2`}>
        <span className="is-current" />
        <span className={step === 2 ? "is-current" : ""} />
      </div>

      {step === 1 ? (
        <>
          <label className="field-label">Primary reason
            <select value={motivation} disabled={busy} onChange={(event) => onMotivationChange(event.target.value)}>
              <option value="">Choose only if useful</option>
              <option value="life_change">A life change</option>
              <option value="family_responsibility">Responsibility for family or others</option>
              <option value="cross_border">Life or accounts across countries</option>
              <option value="complex_digital_life">A complex digital life</option>
              <option value="recent_estate_experience">Recent experience handling an estate</option>
              <option value="general_preparedness">General preparedness</option>
              <option value="other">Another reason</option>
            </select>
          </label>
          <button className="primary-button drawer-primary" type="button" disabled={busy || !motivation} onClick={onContinue}>Continue <ArrowRight size={20} aria-hidden="true" /></button>
          <button className="secondary-button" type="button" disabled={busy} onClick={onSkipQuestion}>Skip this question</button>
        </>
      ) : (
        <>
          <div className="task-symbol" aria-hidden="true"><FileText size={62} /></div>
          <label className="field-label">Category<select value={category} disabled={busy} onChange={(event) => setCategory(event.target.value)}>{[["account","Account"],["document","Document"],["device","Device"],["financial_asset","Asset"],["debt","Debt"],["subscription","Subscription"],["crypto_asset","Crypto"]].map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <button className="primary-button drawer-primary" type="button" disabled={busy} onClick={() => onAddMatter(category)}>Add a matter <ArrowRight size={20} aria-hidden="true" /></button>
        </>
      )}

      <details className="task-details"><summary>About this guide</summary><p>The choices tailor suggestions. The guide itself is not preparedness, evidence or legal authority.</p></details>
      <button className="text-button first-use-save-exit" type="button" disabled={busy} onClick={onSaveAndExit}>Save and exit</button>
    </div>
  );
}

