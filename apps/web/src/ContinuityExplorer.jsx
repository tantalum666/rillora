import { useI18n } from "./i18n/I18nProvider.jsx";
import { useState } from "react";
import { ArrowRight, FileText, GitBranch, Users, IdentificationCard, Devices, DotsThreeCircle, CaretDown } from "@phosphor-icons/react";
import mapArtwork from "./assets/continuity-map.png";
import "./continuity-explorer.css";

const topics = [
  { id: "what", labelKey: "public.explorer.what.label", titleKey: "public.explorer.what.title", icon: FileText, tilt: 0, descriptionKey: "public.explorer.what.description" },
  { id: "next", labelKey: "public.explorer.next.label", titleKey: "public.explorer.next.title", icon: GitBranch, tilt: -8, descriptionKey: "public.explorer.next.description" },
  { id: "who", labelKey: "public.explorer.who.label", titleKey: "public.explorer.who.title", icon: Users, tilt: 8, descriptionKey: "public.explorer.who.description" },
];

export function ContinuityExplorer() {
  const { t } = useI18n();
  const [selected, setSelected] = useState("what");
  const topic = topics.find((item) => item.id === selected);
  return (
    <div className="continuity-explorer" data-focus={selected} style={{ "--map-tilt": `${topic.tilt}deg` }}>
      <div className="continuity-scene" aria-hidden="true">
        <svg className="continuity-connections" viewBox="0 0 380 240" fill="none" aria-hidden="true">
          <path data-active={selected === "what"} d="M190 155 Q190 50 190 30" />
          <path data-active={selected === "next"} d="M190 155 Q38 55 38 158" />
          <path data-active={selected === "who"} d="M190 155 Q342 55 342 158" />
        </svg>
        <img className="continuity-map" src={mapArtwork} alt="" width="1254" height="1254" fetchPriority="high" />
        {topics.map(({ id, titleKey, icon: Icon }) => (
          <button key={id} type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} aria-label={t("public.explorer.explore", { title: t(titleKey) })} aria-pressed={selected === id} className={`continuity-node node-${id}`} data-active={selected === id} onClick={() => setSelected(id)}>
            <Icon size={27} weight="fill" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="continuity-selector" role="group" aria-label={t("public.explorer.label")}>
        {topics.map(({ id, labelKey, titleKey, icon: Icon }) => (
          <button key={id} type="button" aria-label={t(titleKey)} aria-pressed={selected === id} onClick={() => setSelected(id)}>
            <Icon size={18} weight="fill" aria-hidden="true" /><span>{t(labelKey)}</span>
          </button>
        ))}
      </div>
      <p className="continuity-explanation" aria-live="polite" aria-atomic="true">{t(topic.descriptionKey)}</p>
    </div>
  );
}

const groups = [
  { id: "account", titleKey: "public.category.accounts", icon: IdentificationCard, detailKey: "public.explorer.account.detail", actionKey: "public.explorer.account.action" },
  { id: "document", titleKey: "public.category.documents", icon: FileText, detailKey: "public.explorer.document.detail", actionKey: "public.explorer.document.action" },
  { id: "device", titleKey: "public.category.devices", icon: Devices, detailKey: "public.explorer.device.detail", actionKey: "public.explorer.device.action" },
  { id: "financial_asset", titleKey: "public.explorer.other.title", icon: DotsThreeCircle, detailKey: "public.explorer.other.detail", actionKey: "public.explorer.other.action" },
];

export function PublicMatterExplorer({ onStart }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState("account");
  return (
    <section className="public-matter-explorer" id="explore-matters" tabIndex={-1} aria-labelledby="explore-matters-title">
      <div>
        <p className="architectural-kicker">{t("public.appHome.explore")}</p>
        <h2 id="explore-matters-title">{t("public.explorer.organise")}</h2>
      </div>
      <div className="public-matter-categories">
        {groups.map(({ id, titleKey, icon: Icon, detailKey, actionKey }) => (
          <article className="public-matter-category" key={id} data-expanded={expanded === id}>
            <button type="button" aria-expanded={expanded === id} aria-controls={`matter-guidance-${id}`} onClick={() => setExpanded(expanded === id ? null : id)}>
              <Icon size={24} aria-hidden="true" /><strong>{t(titleKey)}</strong><CaretDown size={17} aria-hidden="true" />
            </button>
            <div className="public-matter-guidance" id={`matter-guidance-${id}`} hidden={expanded !== id}>
              <p>{t(detailKey)}</p>
              {onStart ? <button type="button" onClick={() => onStart(id)}>{t(actionKey)}<ArrowRight size={20} aria-hidden="true" /></button>
                : <a href={`/guides?service=${id === 'financial_asset' ? 'binance' : id === 'document' ? 'google' : 'apple'}`}>{t("public.explorer.guide")}<ArrowRight size={20} aria-hidden="true" /></a>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
