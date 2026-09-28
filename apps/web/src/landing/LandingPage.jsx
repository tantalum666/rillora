import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import hero from "../assets/landing/hero-still-life.webp";
import map from "../assets/landing/guidance-map.webp";
import { publicEntry } from "../publicEntry.js";
import { demoSteps } from "./landingModel.js";
import { LandingHeader, LandingFooter } from "./LandingChrome.jsx";
import { MatterDemo } from "./MatterDemo.jsx";
import { SharingDemo } from "./SharingDemo.jsx";
import { LifeSituations } from "./LifeSituations.jsx";
import { ControlSection } from "./ControlSection.jsx";
import { PlanSection } from "./PlanSection.jsx";
import { LandingFAQ } from "./LandingFAQ.jsx";
import { FolioMotion, Reveal } from "./LandingMotion.jsx";
import "./landing.css";

function Hero() {
  const reduce = useReducedMotion();
  function explore(event, sectionId = "how-it-works") {
    event.preventDefault();
    const section = document.getElementById(sectionId);
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
            <a
              href={index === 0 ? "#how-it-works" : "#people"}
              onClick={(event) =>
                explore(event, index === 0 ? "how-it-works" : "people")
              }
              key={item.short}
            >
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
        <LandingHeader home />
        <main id="lp-main">
          <Hero />
          <div className="lp-story">
            <MatterDemo />
            <SharingDemo />
            <LifeSituations />
            <ControlSection />
            <PlanSection />
            <LandingFAQ />
            <section
              className="lp-closing lp-container"
              aria-labelledby="lp-closing-title"
            >
              <Reveal>
                <h2 id="lp-closing-title">
                  Make the important
                  <br />
                  things clear.
                </h2>
                <p>Organise. Choose. Share. All in one private map.</p>
                <a className="lp-button" href={publicEntry.appURL}>
                  Explore Rillora <ArrowRight size={23} aria-hidden="true" />
                </a>
              </Reveal>
              <FolioMotion className="lp-closing-art">
                <img
                  src={map}
                  alt=""
                  width="1254"
                  height="1254"
                  loading="lazy"
                />
              </FolioMotion>
            </section>
          </div>
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
