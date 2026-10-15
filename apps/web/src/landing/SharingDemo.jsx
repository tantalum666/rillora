import { PublicLink } from "../PublicLink.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, ArrowRight } from "@phosphor-icons/react";
import folio from "../assets/landing/folio-transparent.webp";
import symbol from "../assets/brand/symbol-paper.svg";
import { demoPeople, sharedDemoMatters } from "./landingModel.js";
import { Reveal } from "./LandingMotion.jsx";
import { ExampleMatter } from "./ExampleMatter.jsx";

export function SharingDemo() {
  const { t } = useI18n();
  const [personId, setPersonId] = useState("mum");
  const reduce = useReducedMotion();
  const [interacted, setInteracted] = useState(false);
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
            {t("public.sharing.title")}
          </h2>
          <p>{t("public.sharing.intro")}</p>
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
              initial={!interacted || reduce ? false : { pathLength: 0 }}
              animate={interacted ? { pathLength: 1 } : undefined}
              transition={{ duration: reduce ? 0 : 0.8, ease: "easeOut" }}
            />
          </svg>
          <div
            className="lp-demo-people"
            role="group"
            aria-label={t("public.sharing.chooseRecipient")}
          >
            {demoPeople.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={personId === item.id}
                className="lp-person"
                onClick={() => { setInteracted(true); setPersonId(item.id); }}
              >
                <span className="lp-person-avatar">
                  {Array.from(t(item.nameKey))[0]}
                  <span className="lp-person-check">
                    <Check size={12} weight="bold" aria-hidden="true" />
                  </span>
                </span>
                <span>{t(item.nameKey)}</span>
              </button>
            ))}
            <small>{t("public.sharing.example")}</small>
          </div>
          <div
            className="lp-shared-sheet"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="lp-sheet-fold" aria-hidden="true" />
            <h3>{t("public.sharing.sharedWith", { name: t(person.nameKey) })}</h3>
            <p className="lp-sheet-description">{t("public.sharing.visibleDescription")}</p>
            <motion.div
              key={personId}
              className="lp-shared-rows"
              initial={!interacted || reduce ? false : { opacity: 0, y: 8 }}
              animate={interacted ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: reduce ? 0 : 0.18 }}
            >
              {matters.map((item) => (
                <ExampleMatter key={item.id} matter={item} />
              ))}
              <p className="lp-shared-count">
                {t("public.sharing.count", { count: matters.length })}
              </p>
            </motion.div>
          </div>
        </div>
        <PublicLink className="lp-section-next" href="/product#sharing">{t("public.sharing.invitationHow")}<ArrowRight size={20} aria-hidden="true" />
        </PublicLink>
      </div>
    </section>
  );
}
