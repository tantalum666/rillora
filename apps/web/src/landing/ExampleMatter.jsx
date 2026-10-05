import { useI18n } from "../i18n/I18nProvider.jsx";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  FileText,
  House,
  CurrencyBtc,
  ArrowRight,
} from "@phosphor-icons/react";

const icons = { insurance: FileText, home: House, crypto: CurrencyBtc };

export function ExampleMatter({ matter }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const Icon = icons[matter.id];
  const detailsId = `example-${matter.id}-details`;
  return (
    <div className="lp-example-matter">
      <button
        className="lp-shared-row"
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="lp-matter-symbol">
          <Icon size={25} aria-hidden="true" />
        </span>
        <span>
          <strong>{t(matter.titleKey)}</strong>
          <small>{t(matter.detailKey)}</small>
        </span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={detailsId}
            className="lp-example-note"
            role="region"
            aria-label={t("public.example.region", { title: t(matter.titleKey) })}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
          >
            <p>{t(matter.noteKey)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
