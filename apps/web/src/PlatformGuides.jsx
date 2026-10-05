import { useI18n } from "./i18n/I18nProvider.jsx";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MagnifyingGlass } from "@phosphor-icons/react";
import { getOfficialProviderGuide, guideMatchesQuery, officialProviderGroups, officialProviderGuides } from "./officialProviderGuides.js";
import { ProviderGuidePanel } from "./TaskPanels.jsx";
import "./platform-guides.css";
import { ProviderMark } from "./ProviderMark.jsx";
import designCreditsURL from "./assets/design-credits.txt?url";

export function PlatformGuideDirectory({ onOpen, renderMark }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const matches = officialProviderGuides.filter(guide => guideMatchesQuery(guide, query));
  return <div className="platform-guide-directory">
    <label className="platform-guide-search"><MagnifyingGlass size={21} aria-hidden="true"/><span className="sr-only">{t("forms.guides.search")}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("forms.guides.search")}/></label>
    <p className="sharing-expiry">{t("forms.guides.english")}</p>
    {officialProviderGroups.map(group => {
      const rows = matches.filter(guide => guide.group === group.id);
      return rows.length > 0 && <section key={group.id} aria-labelledby={`guide-group-${group.id}`}>
        <h2 id={`guide-group-${group.id}`} className="section-label">{t(`forms.guides.group.${group.id}`)}</h2>
        <div className="guide-list">{rows.map(guide => <button className="guide-row" key={guide.key} onClick={() => onOpen(guide)}>
          {renderMark ? renderMark(guide) : <ProviderMark providerKey={guide.key}/>}<span><strong>{guide.label}</strong><small lang="en">{guide.detail}</small></span><ArrowRight size={18} aria-hidden="true"/>
        </button>)}</div>
      </section>;
    })}
    {matches.length === 0 && <p role="status">{t("forms.guides.empty")}</p>}
    <a className="guide-credits-link" href={designCreditsURL} target="_blank" rel="noopener noreferrer">{t("forms.guides.credits")}</a>
  </div>;
}

export function PublicPlatformGuides() {
  const { t } = useI18n();
  const fromURL = () => getOfficialProviderGuide(new URLSearchParams(window.location.search).get("service"))?.key ?? null;
  const [selected, setSelected] = useState(fromURL);
  const scroll = useRef(0);
  useEffect(() => {
    const restore = () => {
      const key = fromURL(); setSelected(key);
      requestAnimationFrame(() => window.scrollTo(0, key ? 0 : scroll.current));
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  function open(guide) {
    scroll.current = window.scrollY;
    window.history.pushState({platformGuide:true}, "", `/guides?service=${encodeURIComponent(guide.key)}`);
    setSelected(guide.key); window.scrollTo(0, 0);
  }
  function back() {
    if (window.history.state?.platformGuide) { window.history.back(); return; }
    window.history.replaceState({}, "", "/guides"); setSelected(null); window.scrollTo(0, 0);
  }
  const guide = getOfficialProviderGuide(selected);
  return <main className="public-platform-guides">
    <div hidden={!!guide}>
      <h1>{t("forms.guides.title")}</h1><PlatformGuideDirectory onOpen={open}/>
    </div>
    {guide && <section className="platform-guide-detail" aria-label={t("forms.guides.guide", { name: guide.label })}>
      <button className="text-button" onClick={back}><ArrowLeft size={19} aria-hidden="true"/>{t("forms.guides.all")}</button>
      <h1>{guide.label}</h1>
      <ProviderGuidePanel key={guide.key} guide={guide}/>
    </section>}
  </main>;
}
