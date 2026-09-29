import { AppearanceLink } from "../AppearanceControl.jsx";
import { ArrowRight } from "@phosphor-icons/react";
import hero from "../assets/landing/hero-still-life.webp";
import heroDark from "../assets/landing/hero-dark.webp";
import { publicEntry } from "../publicEntry.js";
import { SharingDemo } from "./SharingDemo.jsx";
import { ThemePicture } from "./AppearanceControl.jsx";
import { Reveal } from "./LandingMotion.jsx";

export function LandingPage() {
  return (
    <main id="lp-main">
      <section className="lp-hero" aria-labelledby="lp-title">
        <ThemePicture
          className="lp-hero-photo"
          light={hero}
          dark={heroDark}
          width="1536"
          height="1024"
          alt=""
          fetchPriority="high"
        />
        <div className="lp-container lp-hero-content">
          <div className="lp-hero-copy">
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
              <a className="lp-button" href="/product">
                Explore the product <ArrowRight size={22} aria-hidden="true" />
              </a>
              <AppearanceLink
                className="lp-invitation-link"
                href={publicEntry.invitationURL}
              >
                Received an invitation?
              </AppearanceLink>
            </div>
          </div>
        </div>
      </section>
      <SharingDemo />
      <section
        className="lp-destinations lp-container"
        aria-label="Explore Rillora"
      >
        <Reveal>
          <a href="/product">
            <span>Accounts, documents, devices.</span>
            <h2>A place for what matters.</h2>
            <p>
              See what belongs in your map, and how to give each item a next
              step.
            </p>
            <span className="lp-text-link">
              Explore the product <ArrowRight size={20} aria-hidden="true" />
            </span>
          </a>
        </Reveal>
        <Reveal>
          <a href="/security">
            <span>Privacy starts with your choices.</span>
            <h2>Stay in control.</h2>
            <p>Choose what to share, change access and keep your own copy.</p>
            <span className="lp-text-link">
              Security & privacy <ArrowRight size={20} aria-hidden="true" />
            </span>
          </a>
        </Reveal>
      </section>
      <section
        className="lp-closing lp-container"
        aria-labelledby="lp-closing-title"
      >
        <div>
          <h2 id="lp-closing-title">
            Make the important
            <br />
            things clear.
          </h2>
          <p>Start with one matter and someone you trust.</p>
        </div>
        <AppearanceLink className="lp-button" href={publicEntry.accountURL}>
          Explore Preview <ArrowRight size={22} aria-hidden="true" />
        </AppearanceLink>
      </section>
    </main>
  );
}
