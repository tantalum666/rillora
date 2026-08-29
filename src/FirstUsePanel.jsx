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
          <p className="section-label">Choose how to begin</p>
          <h2 id="first-use-heading">Start with one useful step.</h2>
          <p>Your overview is already available. Pick a path now, or leave and return whenever you want.</p>
        </div>
        <Compass size={28} aria-hidden="true" />
      </div>

      <div className="first-use-options">
        <button className="first-use-option is-primary" type="button" disabled={busy} onClick={onAddMatter}>
          <span className="first-use-option-icon"><Plus size={21} aria-hidden="true" /></span>
          <span><strong>Add your first matter</strong><small>Create a safe locator without entering a password.</small></span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
        <button className="first-use-option" type="button" disabled={busy} onClick={onOpenGuide}>
          <span className="first-use-option-icon"><ClockCounterClockwise size={21} aria-hidden="true" /></span>
          <span><strong>{guideActionLabel(plan)}</strong><small>{resumed ? "Continue from your saved step." : "Two optional steps with save and exit."}</small></span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
      </div>

      <button className="text-button first-use-not-now" type="button" disabled={busy} onClick={onPause}>
        Not now — keep using the overview
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
  return (
    <div className="first-use-guide">
      <div className="first-use-progress" aria-label={`Step ${step} of 2`}>
        <span className="is-current" />
        <span className={step === 2 ? "is-current" : ""} />
      </div>

      {step === 1 ? (
        <>
          <p className="drawer-intro">Optional · Step 1 of 2</p>
          <h3>What brought this to mind?</h3>
          <p className="drawer-intro">One broad category helps Rillora order later guidance. It is not proof of urgency, death, incapacity or legal status.</p>
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
          <p className="drawer-intro">Optional · Step 2 of 2</p>
          <h3>Add one matter when you’re ready.</h3>
          <p className="drawer-intro">Record what exists, where an authorized person can find instructions and what outcome you prefer. Do not enter credentials.</p>
          <div className="drawer-safety"><FileText size={19} aria-hidden="true" /> The first matter—not the questionnaire—is the first readiness action.</div>
          <button className="primary-button drawer-primary" type="button" disabled={busy} onClick={onAddMatter}>Add a matter <ArrowRight size={20} aria-hidden="true" /></button>
        </>
      )}

      <button className="text-button first-use-save-exit" type="button" disabled={busy} onClick={onSaveAndExit}>Save and exit</button>
    </div>
  );
}

