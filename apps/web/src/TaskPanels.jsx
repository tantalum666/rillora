import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Info, Key, Shield, XCircle } from "@phosphor-icons/react";
import { publicRoutes } from "./publicRoutes.js";
import { guideInitialPart, guideLinksForPart, localizeOfficialProviderGuide } from "./officialProviderGuides.js";
import { useI18n } from "./i18n/I18nProvider.jsx";

export function PanelTabs({ items, selected, onSelect, label }) {
  return <div className="panel-tabs" role="group" aria-label={label}>{items.map(([value, title]) => (
    <button type="button" key={value} aria-pressed={value === selected} onClick={() => onSelect(value)}>{title}</button>
  ))}</div>;
}

export function SafetyPanel() {
  const { t } = useI18n();
  const [section, setSection] = useState("keep");
  const entries = section === "keep"
    ? ["provider", "locator", "nextStep"]
    : ["passwords", "keys", "moneySecrets"];
  const Icon = section === "keep" ? CheckCircle : XCircle;
  return <>
    <PanelTabs items={[["keep", t("forms.safety.keep")], ["avoid", t("forms.safety.avoid")]]} selected={section} onSelect={setSection} label={t("forms.safety.label")} />
    <div className="task-symbol" aria-hidden="true">{section === "keep" ? <Shield size={52} /> : <Key size={52} />}</div>
    <ul className="task-fact-list">{entries.map(entry => <li key={entry}><Icon size={21} aria-hidden="true" />{t(`forms.safety.${entry}`)}</li>)}</ul>
    <details className="task-details"><summary>{t("forms.safety.safeguards")}</summary><p>{t("forms.safety.availability")}</p><p>{t("forms.safety.events")}</p><ol>{["evidence", "identity", "authority", "scope"].map(key => <li key={key}>{t(`forms.safety.${key}`)}</li>)}</ol><p>{t("forms.safety.silence")}</p></details>
    <div className="task-policy-links"><a href={publicRoutes.privacy} target="_blank" rel="noreferrer">{t("forms.privacy")}</a><a href={publicRoutes.terms} target="_blank" rel="noreferrer">{t("forms.terms")}</a></div>
  </>;
}

export function ProviderGuidePanel({ guide: sourceGuide, mark, onReviewStatus, initialPart }) {
  const { t, locale, formatNumber, formatDate } = useI18n();
  const guide = localizeOfficialProviderGuide(sourceGuide, locale);
  const [part, setPart] = useState(() => initialPart ?? guideInitialPart(guide));
  const [step, setStep] = useState(0);
  const steps = part === "now" ? guide.doNow : guide.later;
  const tabs = [...(guide.doNow.length ? [["now", t("forms.guides.prepare")]] : []), ...(guide.later.length ? [["later", t("forms.guides.afterDeath")]] : []), ["details", t("forms.guides.documents")]];
  function selectPart(value) { setPart(value); setStep(0); }
  return <>
    <div className="provider-guide-intro">{mark}</div>
    <PanelTabs items={tabs} selected={part} onSelect={selectPart} label={t("forms.guides.section")} />
    {part === "details" ? <>
      <section className="guide-documents"><h3>{t("forms.guides.documentsInformation")}</h3><ul lang={guide.contentLocale}>{guide.requirements.map(item => <li key={item}>{item}</li>)}</ul><p lang={guide.contentLocale}>{guide.boundary}</p></section>
      <details className="task-details"><summary><Info size={18} aria-hidden="true" /> {t("forms.guides.about")}</summary><p lang={guide.contentLocale}>{guide.detail}</p><p>{t("forms.guides.reviewed", { date: formatDate(guide.reviewed, { dateStyle: "medium", timeZone: "UTC" }) })}</p></details>
      {onReviewStatus && <button className="secondary-button" type="button" onClick={onReviewStatus}>{t("forms.guides.selfReported")}</button>}
    </> : steps.length > 0 && <section className="guide-step-reader">
      <div className="guide-step-counter"><strong>{formatNumber(Math.min(step + 1, steps.length))}</strong><span>{t("forms.guides.of", { count: formatNumber(steps.length) })}</span></div>
      <p key={`${part}-${step}`} className="guide-current-step" lang={guide.contentLocale}>{steps[Math.min(step, steps.length - 1)]}</p>
      <div className="guide-step-actions"><button type="button" disabled={step === 0} onClick={() => setStep(index => index - 1)}><ArrowLeft size={18} aria-hidden="true" />{t("forms.guides.previous")}</button><button type="button" disabled={step >= steps.length - 1} onClick={() => setStep(index => index + 1)}>{t("forms.guides.next")}<ArrowRight size={18} aria-hidden="true" /></button></div>
    </section>}
    <section className="provider-guide-links" aria-label={t("forms.guides.officialLinks", { name: guide.label })}>
      {guideLinksForPart(guide, part).map(link => <a className="secondary-button" href={link.urlString} key={link.urlString} rel="noreferrer" target="_blank"><span lang={guide.contentLocale}>{link.title}</span><ArrowRight size={18} aria-hidden="true" /></a>)}
    </section>
    <details className="task-details guide-source-links"><summary>{t("forms.guides.originalLinks")}</summary>
      <ul>{guide.linkDetails.map(link => <li key={link.urlString}><strong lang={guide.contentLocale}>{link.title}</strong><a href={link.urlString} rel="noreferrer" target="_blank">{link.urlString}</a></li>)}</ul>
    </details>
  </>;
}

