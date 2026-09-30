import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  FileText,
  House,
  CurrencyBtc,
  ArrowRight,
  Check,
} from "@phosphor-icons/react";
import folio from "../assets/landing/sharing-folio.webp";
import symbol from "../assets/brand/symbol-paper.svg";
import { demoPeople, demoSteps, sharedDemoMatters } from "./landingModel.js";
import { FolioMotion, Reveal } from "./LandingMotion.jsx";

const icons = { insurance: FileText, home: House, crypto: CurrencyBtc };

export function SharingDemo() {
  const [personId, setPersonId] = useState("mum");
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();
  const person = demoPeople.find((item) => item.id === personId);
  const matters = sharedDemoMatters(personId);
  return (
    <section
      className="lp-sharing"
      id="how-it-works"
      aria-labelledby="lp-sharing-title"
      tabIndex={-1}
    >
      <div className="lp-container">
        <Reveal className="lp-sharing-heading">
          <h2 id="lp-sharing-title">
            Different people.
            <br />
            Different pieces.
          </h2>
          <p>Keep some things private. Share the rest, person by person.</p>
        </Reveal>
        <div className="lp-sharing-scene">
          <FolioMotion className="lp-demo-folio">
            <img src={folio} width="800" height="800" alt="" loading="lazy" />
            <div className="lp-folio-imprint" aria-hidden="true">
              <img src={symbol} alt="" />
              <span>Your map</span>
            </div>
          </FolioMotion>
          <svg
            className="lp-connection-lines"
            viewBox="0 0 1100 460"
            fill="none"
            aria-hidden="true"
          >
            <path d="M330 245 C430 245 425 130 535 130 S610 225 690 225" />
            <path d="M330 245 C430 245 425 345 535 345 S610 225 690 225" />
            <motion.path
              key={`${personId}-${step}`}
              className="is-selected"
              d={
                personId === "mum"
                  ? "M330 245 C430 245 425 130 535 130 S610 225 690 225"
                  : "M330 245 C430 245 425 345 535 345 S610 225 690 225"
              }
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.8, ease: "easeOut" }}
            />
          </svg>
          <div
            className="lp-demo-people"
            role="group"
            aria-label="Choose an example recipient"
          >
            {demoPeople.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={personId === item.id}
                className="lp-person"
                onClick={() => setPersonId(item.id)}
              >
                <span className="lp-person-avatar">
                  {item.initial}
                  <span className="lp-person-check">
                    <Check size={12} weight="bold" />
                  </span>
                </span>
                <span>{item.name}</span>
              </button>
            ))}
            <small>Interactive example</small>
          </div>
          <div
            className="lp-shared-sheet"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="lp-sheet-fold" aria-hidden="true" />
            <p className="lp-sheet-stage">
              {step === 2
                ? "Invitation preview"
                : step === 1
                  ? "Their own view"
                  : "A place to begin"}
            </p>
            <h3>Shared with {person.name}</h3>
            <p className="lp-sheet-description">
              {step === 2
                ? "They accept with their own account."
                : "These are the items they can see."}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={personId}
                className="lp-shared-rows"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: reduce ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : 0.18 }}
              >
                {matters.map((item) => {
                  const Icon = icons[item.id];
                  return (
                    <div className="lp-shared-row" key={item.id}>
                      <span className="lp-matter-symbol">
                        <Icon size={25} />
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </div>
                  );
                })}
                <p className="lp-shared-count">
                  {matters.length} {matters.length === 1 ? "matter" : "matters"}{" "}
                  shared. Everything else stays private.
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div
          className="lp-demo-steps"
          role="group"
          aria-label="Explore the three steps"
        >
          {demoSteps.map((item, index) => (
            <button
              key={item.short}
              type="button"
              aria-pressed={step === index}
              onClick={() => setStep(index)}
            >
              <span className="lp-step-number">0{index + 1}</span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
