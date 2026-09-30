import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, ArrowRight } from "@phosphor-icons/react";
import folio from "../assets/landing/folio-transparent.webp";
import symbol from "../assets/brand/symbol-paper.svg";
import { demoPeople, sharedDemoMatters } from "./landingModel.js";
import { Reveal } from "./LandingMotion.jsx";
import { ExampleMatter } from "./ExampleMatter.jsx";

export function SharingDemo() {
  const [personId, setPersonId] = useState("mum");
  const reduce = useReducedMotion();
  const person = demoPeople.find((item) => item.id === personId);
  const matters = sharedDemoMatters(personId);
  return (
    <section
      className="lp-sharing lp-section lp-container"
      id="people"
      aria-labelledby="lp-sharing-title"
      tabIndex={-1}
    >
      <div className="lp-section-body">
        <Reveal className="lp-sharing-heading">
          <h2 id="lp-sharing-title">
            Let the right people
            <br />
            see the right details.
          </h2>
          <p>Choose a person. Choose their view.</p>
        </Reveal>
        <div className="lp-sharing-scene">
          <div className="lp-demo-folio">
            <img src={folio} width="800" height="800" alt="" loading="lazy" />
            <div className="lp-folio-imprint" aria-hidden="true">
              <img src={symbol} alt="" />
            </div>
          </div>
          <svg
            className="lp-connection-lines"
            viewBox="0 0 1100 460"
            fill="none"
            aria-hidden="true"
          >
            <path d="M330 245 C430 245 425 130 535 130 S610 225 690 225" />
            <path d="M330 245 C430 245 425 345 535 345 S610 225 690 225" />
            <motion.path
              key={personId}
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
                    <Check size={12} weight="bold" aria-hidden="true" />
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
            <h3>Shared with {person.name}</h3>
            <p className="lp-sheet-description">
              These are the items they can see.
            </p>
            <motion.div
              key={personId}
              className="lp-shared-rows"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
            >
              {matters.map((item) => (
                <ExampleMatter key={item.id} matter={item} />
              ))}
              <p className="lp-shared-count">
                {matters.length} {matters.length === 1 ? "matter" : "matters"}{" "}
                shared. Everything else stays private.
              </p>
            </motion.div>
          </div>
        </div>
        <a className="lp-section-next" href="/product#sharing">
          How invitations work <ArrowRight size={20} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
