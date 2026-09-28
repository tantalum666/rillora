import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import primaryLogo from "../assets/brand/lockup-primary.svg";
import reversedLogo from "../assets/brand/lockup-reversed.svg";
import hero from "../assets/landing/hero-still-life.webp";
import credits from "../assets/design-credits.txt?url";
import { publicEntry } from "../publicEntry.js";
import { demoSteps } from "./landingModel.js";
import { SharingDemo } from "./SharingDemo.jsx";
import { GuidanceSection } from "./GuidanceSection.jsx";
import { Reveal } from "./LandingMotion.jsx";
import "./landing.css";

export function PreviewAccountLink({ className = "" }) {
  return (
    <a
      className={`lp-sign-in ${className}`}
      href={publicEntry.accountURL}
      aria-label={
        publicEntry.preview
          ? "Sign in to the Rillora preview"
          : "Sign in to Rillora"
      }
    >
      {publicEntry.preview && <span className="lp-preview-label">Preview</span>}
      <span>Sign in</span>
      <ArrowRight size={20} aria-hidden="true" />
    </a>
  );
}

function Hero() {
  const reduce = useReducedMotion();
  function explore(event) {
    event.preventDefault();
    const section = document.getElementById("how-it-works");
    section?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    section?.focus({ preventScroll: true });
  }
  return (
    <section className="lp-hero" aria-labelledby="lp-title">
      <motion.img
        className="lp-hero-photo"
        src={hero}
        width="1536"
        height="1024"
        alt=""
        fetchPriority="high"
        initial={reduce ? false : { scale: 1.035, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <div className="lp-container lp-hero-content">
        <Reveal className="lp-hero-copy">
          <h1 id="lp-title">
            Leave less
            <br />
            for them to
            <br />
            figure out.
          </h1>
          <p>
            A private map of your important things,
            <br className="lp-desktop-break" /> shared with the people you
            choose.
          </p>
          <div className="lp-hero-actions">
            <a className="lp-button" href="#how-it-works" onClick={explore}>
              See how it works <ArrowRight size={22} aria-hidden="true" />
            </a>
            <a className="lp-invitation-link" href={publicEntry.invitationURL}>
              Received an invitation?
            </a>
          </div>
        </Reveal>
        <nav className="lp-hero-steps" aria-label="How Rillora works">
          {demoSteps.map((item, index) => (
            <a href="#how-it-works" onClick={explore} key={item.short}>
              <small>0{index + 1}</small>
              <span>{item.short}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-page">
        <a className="lp-skip" href="#lp-main">
          Skip to content
        </a>
        <header className="lp-header lp-container">
          <a className="lp-brand" href="/" aria-label="Rillora home">
            <img src={primaryLogo} width="870" height="208" alt="Rillora" />
          </a>
          <nav className="lp-nav" aria-label="Public navigation">
            <a href="#how-it-works">How it works</a>
            <a href="/guides">Guides</a>
          </nav>
          <PreviewAccountLink />
        </header>
        <main id="lp-main">
          <Hero />
          <SharingDemo />
          <GuidanceSection />
          <section className="lp-closing" aria-labelledby="lp-closing-title">
            <div className="lp-container">
              <Reveal>
                <h2 id="lp-closing-title">
                  Make the important
                  <br />
                  things clear.
                </h2>
                <a
                  className="lp-button lp-button-paper"
                  href={publicEntry.appURL}
                >
                  Explore Rillora <ArrowRight size={23} aria-hidden="true" />
                </a>
              </Reveal>
              <img
                className="lp-closing-brand"
                src={reversedLogo}
                alt=""
                aria-hidden="true"
                width="870"
                height="208"
              />
            </div>
          </section>
        </main>
        <footer className="lp-footer lp-container">
          <div className="lp-footer-row">
            <a className="lp-brand" href="/" aria-label="Rillora home">
              <img src={primaryLogo} width="870" height="208" alt="Rillora" />
            </a>
            <nav aria-label="Information and legal links">
              <a href="/support">Support</a>
              <a href="https://legal.rillora.xyz/privacy">Privacy</a>
              <a href="https://legal.rillora.xyz/terms">Terms</a>
              <a href={credits}>Credits</a>
            </nav>
          </div>
          <div className="lp-footer-notes">
            <p>Access and transfers follow each provider’s own process.</p>
            {publicEntry.preview && (
              <p>
                Preview access uses the test app. Please use sample information.
              </p>
            )}
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
