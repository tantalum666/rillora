import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Info, Key, Shield, XCircle } from "@phosphor-icons/react";
import { publicRoutes } from "./publicRoutes.js";
import { guideInitialPart, guideLinksForPart } from "./officialProviderGuides.js";

export function PanelTabs({ items, selected, onSelect, label }) {
  return <div className="panel-tabs" role="group" aria-label={label}>{items.map(([value, title]) => (
    <button type="button" key={value} aria-pressed={value === selected} onClick={() => onSelect(value)}>{title}</button>
  ))}</div>;
}

export function SafetyPanel() {
  const [section, setSection] = useState("keep");
  const entries = section === "keep"
    ? ["Provider name", "Masked hint or location", "Intended next step"]
    : ["Passwords or complete recovery codes", "Seed phrases or private keys", "Secrets that can move money"];
  const Icon = section === "keep" ? CheckCircle : XCircle;
  return <>
    <PanelTabs items={[["keep", "Keep"], ["avoid", "Leave out"]]} selected={section} onSelect={setSection} label="Safe information" />
    <div className="task-symbol" aria-hidden="true">{section === "keep" ? <Shield size={52} /> : <Key size={52} />}</div>
    <ul className="task-fact-list">{entries.map((entry) => <li key={entry}><Icon size={21} aria-hidden="true" />{entry}</li>)}</ul>
    <details className="task-details"><summary>Disclosure safeguards</summary><p>Live claims and welfare checks are not available. Current sharing is chosen by you.</p><p>Death, incapacity and being unreachable are separate events.</p><ol><li>Event evidence</li><li>Claimant identity</li><li>Legal authority</li><li>Information scope</li></ol><p>Silence never triggers automatic disclosure.</p></details>
    <div className="task-policy-links"><a href={publicRoutes.privacy} target="_blank" rel="noreferrer">Privacy Policy</a><a href={publicRoutes.terms} target="_blank" rel="noreferrer">Terms</a></div>
  </>;
}

export function ProviderGuidePanel({ guide, mark, onReviewStatus, initialPart }) {
  const [part, setPart] = useState(() => initialPart ?? guideInitialPart(guide));
  const [step, setStep] = useState(0);
  const steps = part === "now" ? guide.doNow : guide.later;
  const tabs = [...(guide.doNow.length ? [["now", "Prepare"]] : []), ...(guide.later.length ? [["later", "After a death"]] : []), ["details", "Documents"]];
  function selectPart(value) { setPart(value); setStep(0); }
  return <>
    <div className="provider-guide-intro">{mark}</div>
    <PanelTabs items={tabs} selected={part} onSelect={selectPart} label="Guide section" />
    {part === "details" ? <>
      <section className="guide-documents"><h3>Documents & information</h3><ul>{guide.requirements.map((item) => <li key={item}>{item}</li>)}</ul><p>{guide.boundary}</p></section>
      <details className="task-details"><summary><Info size={18} aria-hidden="true" /> About this route</summary><p>{guide.detail}</p><p>Sources reviewed {guide.reviewed}. Requirements can change.</p></details>
      {onReviewStatus && <button className="secondary-button" type="button" onClick={onReviewStatus}>My self-reported review</button>}
    </> : steps.length > 0 && <section className="guide-step-reader">
      <div className="guide-step-counter"><strong>{Math.min(step + 1, steps.length)}</strong><span>of {steps.length}</span></div>
      <p key={`${part}-${step}`} className="guide-current-step">{steps[Math.min(step, steps.length - 1)]}</p>
      <div className="guide-step-actions"><button type="button" disabled={step === 0} onClick={() => setStep((index) => index - 1)}><ArrowLeft size={18} aria-hidden="true" />Previous</button><button type="button" disabled={step >= steps.length - 1} onClick={() => setStep((index) => index + 1)}>Next<ArrowRight size={18} aria-hidden="true" /></button></div>
    </section>}
    <section className="provider-guide-links" aria-label={`${guide.label} official links`}>
      {guideLinksForPart(guide, part).map(link => <a className="secondary-button" href={link.urlString} key={link.urlString} rel="noreferrer" target="_blank">{link.title}<ArrowRight size={18} aria-hidden="true" /></a>)}
    </section>
    <details className="task-details guide-source-links"><summary>Original source links</summary>
      <ul>{guide.linkDetails.map(link => <li key={link.urlString}><strong>{link.title}</strong><a href={link.urlString} rel="noreferrer" target="_blank">{link.urlString}</a></li>)}</ul>
    </details>
  </>;
}
