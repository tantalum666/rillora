import { PublicLink } from "../PublicLink.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bank,
  FileText,
  Laptop,
  CurrencyBtc,
  ArrowRight,
} from "@phosphor-icons/react";
import { matterExamples } from "./matterExamples.js";
import { Reveal } from "./LandingMotion.jsx";

const icons = { bank: Bank, file: FileText, laptop: Laptop, coin: CurrencyBtc };

export function MatterDemo() {
  const { t } = useI18n();
  const [selected, setSelected] = useState(0);
  const reduce = useReducedMotion();
  const [interacted, setInteracted] = useState(false);
  const item = matterExamples[selected];
  const Icon = icons[item.icon];
  function select(index) {
    setInteracted(true);
    setSelected(index);
  }
  return (
    <section
      className="lp-section lp-organise lp-container"
      id="how-it-works"
      aria-labelledby="lp-organise-title"
      tabIndex={-1}
    >
      <div className="lp-section-body">
        <Reveal className="lp-section-heading">
          <div>
            <h2 id="lp-organise-title">{t("public.matter.title")}</h2>
            <p>{t("public.matter.intro")}</p>
          </div>
        </Reveal>
        <div
          className="lp-category-choices"
          role="group"
          aria-label={t("public.matter.choose")}
        >
          {matterExamples.map((example, index) => (
            <button
              key={example.id}
              type="button"
              aria-pressed={index === selected}
              onClick={() => select(index)}
            >
              {t(example.labelKey)}
            </button>
          ))}
        </div>
        <div className="lp-organise-scene">
          <div className="lp-map-rail">
            <p>{t("public.matter.yourMap")}</p>
            {matterExamples.map((example, index) => {
              const RowIcon = icons[example.icon];
              return (
                <button
                  key={example.id}
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => select(index)}
                >
                  <RowIcon aria-hidden="true" size={24} />
                  <span>{t(example.titleKey)}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              );
            })}
            <small>{t("public.matter.unsaved")}</small>
          </div>
          <div className="lp-matter-sheet" aria-live="polite">
            <motion.div
              key={item.id}
              initial={!interacted || reduce ? false : { opacity: 0, y: 10, rotate: 0.4 }}
              animate={interacted ? { opacity: 1, y: 0, rotate: 0 } : undefined}
              transition={{ duration: reduce ? 0 : 0.35 }}
            >
              <div className="lp-matter-sheet-heading">
                <span className="lp-sheet-icon">
                  <Icon size={30} aria-hidden="true" />
                </span>
                <div>
                  <small>{t(item.typeKey)}</small>
                  <h3>{t(item.titleKey)}</h3>
                </div>
              </div>
              <dl>
                {item.fields.map(([labelKey, valueKey]) => (
                  <div key={labelKey}>
                    <dt>{t(labelKey)}</dt>
                    <dd>{t(valueKey)}</dd>
                  </div>
                ))}
                <div>
                  <dt>{t("public.matter.notes")}</dt>
                  <dd className="lp-matter-note">{t(item.noteKey)}</dd>
                </div>
              </dl>
            </motion.div>
          </div>
        </div>
        <PublicLink className="lp-section-next" href="/#people">{t("public.matter.next")}{" "}
          <ArrowRight aria-hidden="true" size={20} />
        </PublicLink>
      </div>
    </section>
  );
}
