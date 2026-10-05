import { useI18n } from "../i18n/I18nProvider.jsx";
import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import chineseExample from "./rillora-sharing-example-zh-CN.txt?url&no-inline";
import example from "../assets/landing/rillora-sharing-example.txt?url&no-inline";
import { QuestionList } from "./LandingFAQ.jsx";

const controls = [
  {
    titleKey: "public.control.sharing.title",
    answerKey:
      "public.control.sharing.answer",
  },
  {
    titleKey: "public.control.revoke.title",
    answerKey:
      "public.control.revoke.answer",
  },
  {
    titleKey: "public.control.export.title",
    answerKey:
      "public.control.export.answer",
  },
  {
    titleKey: "public.control.encryption.title",
    answerKey:
      "public.control.encryption.answer",
  },
];

export function ControlSection() {
  const { t, locale } = useI18n();
  return (
    <section
      className="lp-section lp-container"
      id="your-control"
      tabIndex={-1}
      aria-label={t("public.control.label")}
    >
      <div className="lp-section-body">
        <div className="lp-control-grid">
          <QuestionList questions={controls} />
          <div className="lp-export-example">
            <div className="lp-export-paper" aria-label={t("public.control.example")}>
              <span>Rillora</span>
              <h3>{t("public.control.directions")}</h3>
              <p>{t("public.example.insurance.title")}<br />{t("public.example.home.title")}</p>
              <small>{t("public.control.sharedMum")}</small>
            </div>
            <div>
              <h3>{t("public.control.portableTitle")}</h3>
              <p>{t("public.control.portableDescription")}</p>
              <a
                className="lp-text-link"
                download={locale === "zh-CN" ? "rillora-sharing-example-zh-CN.txt" : "rillora-sharing-example.txt"}
                href={locale === "zh-CN" ? chineseExample : example}
              >{t("public.control.download")}<ArrowDown size={20} aria-hidden="true" />
              </a>
              <small>{t("public.control.sample")}</small>
            </div>
          </div>
        </div>
        <a className="lp-section-next" href="https://legal.rillora.xyz/privacy">{t("public.control.privacy")}<ArrowRight size={20} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
