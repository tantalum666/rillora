import { ArrowRight, ShieldCheck, UserCircle, LockKey } from "@phosphor-icons/react";
import { ContinuityExplorer, PublicMatterExplorer } from "./ContinuityExplorer.jsx";

export function PublicHome({ onStart }) {
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
          <p className="architectural-kicker">Digital legacy</p>
          <h1 id="public-hero-title">Make the important things clear.</h1>
          <p className="architectural-lede">Your important things, connected.</p>
        </div>
        <ContinuityExplorer />
        <div className="public-motion-actions">
          <div className="architectural-event-grid compact-event-strip" aria-label="Separate processes">
            <span><ShieldCheck size={18} aria-hidden="true" /> Death</span>
            <span><UserCircle size={18} aria-hidden="true" /> Incapacity</span>
            <span><LockKey size={18} aria-hidden="true" /> Unreachable</span>
          </div>
          <a href="#explore-matters" onClick={explore}>Explore matters <ArrowRight size={20} aria-hidden="true" /></a>
          {onStart ? <button className="architectural-primary" type="button" onClick={() => onStart("account")}>Add my first matter <ArrowRight size={21} aria-hidden="true" /></button> : <a className="architectural-primary" href="/guides">Account inheritance guides <ArrowRight size={21} aria-hidden="true" /></a>}
        </div>
      </section>
      <PublicMatterExplorer onStart={onStart} />

    </main>
  );
}
