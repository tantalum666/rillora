import { useI18n } from "../i18n/I18nProvider.jsx";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  FileText,
  HandHeart,
  Link as LinkIcon,
  UserCircle,
} from "@phosphor-icons/react";
import { Reveal } from "./LandingMotion.jsx";

const situations = [
  {
    id: "death",
    labelKey: "public.life.death.label",
    titleKey: "public.life.death.title",
    detailKey:
      "public.life.death.detail",
    icon: FileText,
  },
  {
    id: "incapacity",
    labelKey: "public.life.incapacity.label",
    titleKey: "public.life.incapacity.title",
    detailKey:
      "public.life.incapacity.detail",
    icon: HandHeart,
  },
  {
    id: "unreachable",
    labelKey: "public.life.unreachable.label",
    titleKey: "public.life.unreachable.title",
    detailKey:
      "public.life.unreachable.detail",
    icon: LinkIcon,
  },
];

export function LifeSituations() {
  const { t } = useI18n();
  const [active, setActive] = useState(2);
  const reduce = useReducedMotion();
  const [interacted, setInteracted] = useState(false);
  const item = situations[active];
  const Icon = item.icon;
  return (
    <section
      className="lp-section lp-container"
      aria-labelledby="lp-life-title"
    >
      <div className="lp-section-body">
        <Reveal>
          <h2 id="lp-life-title">{t("public.life.title")}</h2>
          <p className="lp-section-intro">{t("public.life.intro")}</p>
        </Reveal>
        <div
          className="lp-situation-choices"
          role="group"
          aria-label={t("public.life.choose")}
        >
          {situations.map((situation, index) => (
            <button
              key={situation.id}
              type="button"
              aria-pressed={index === active}
              onClick={() => { setInteracted(true); setActive(index); }}
            >
              {t(situation.labelKey)}
            </button>
          ))}
        </div>
        <div className="lp-life-scene">
          <motion.div
            className="lp-life-copy"
            key={item.id}
            aria-live="polite"
            initial={!interacted || reduce ? false : { opacity: 0, x: -8 }}
            animate={interacted ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            <h3>{t(item.titleKey)}</h3>
            <p>{t(item.detailKey)}</p>
          </motion.div>
          <div
            className="lp-life-path"
            aria-label={t("public.life.sharingChoice")}
          >
            <span>
              <i>
                <Icon size={36} aria-hidden="true" />
              </i>
              {t("public.life.youChoose")}
            </span>
            <span className="lp-life-connector" aria-hidden="true" />
            <span>
              <i>
                <UserCircle size={38} aria-hidden="true" />
              </i>
              {t("public.life.theySee")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
