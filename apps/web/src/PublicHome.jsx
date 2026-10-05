import { useI18n } from "./i18n/I18nProvider.jsx";
import { ArrowRight, ShieldCheck, UserCircle, LockKey } from "@phosphor-icons/react";
import { ContinuityExplorer, PublicMatterExplorer } from "./ContinuityExplorer.jsx";

export function PublicHome({ onStart }) {
  const { t } = useI18n();
  function explore(event) {
    event.preventDefault();
    const target = document.getElementById("explore-matters");
    target?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    target?.focus({ preventScroll: true });
  }

  return (
    <main className="architectural-home">
      <section className="public-motion-hero" aria-labelledby="public-hero-title">
        <div className="public-motion-copy">
          <p className="architectural-kicker">{t("public.appHome.kicker")}</p>
          <h1 id="public-hero-title">{t("public.appHome.title")}</h1>
          <p className="architectural-lede">{t("public.appHome.intro")}</p>
        </div>
        <ContinuityExplorer />
        <div className="public-motion-actions">
          <div className="architectural-event-grid compact-event-strip" aria-label={t("public.appHome.processes")}>
            <span><ShieldCheck size={18} aria-hidden="true" />{t("public.appHome.death")}</span>
            <span><UserCircle size={18} aria-hidden="true" />{t("public.appHome.incapacity")}</span>
            <span><LockKey size={18} aria-hidden="true" />{t("public.appHome.unreachable")}</span>
          </div>
          <a href="#explore-matters" onClick={explore}>{t("public.appHome.explore")}<ArrowRight size={20} aria-hidden="true" /></a>
          {onStart ? <button className="architectural-primary" type="button" onClick={() => onStart("account")}>{t("public.appHome.addFirst")}<ArrowRight size={21} aria-hidden="true" /></button> : <a className="architectural-primary" href="https://www.rillora.xyz">{t("public.home.exploreLabel")}<ArrowRight size={21} aria-hidden="true" /></a>}
        </div>
      </section>
      <PublicMatterExplorer onStart={onStart} />

    </main>
  );
}
