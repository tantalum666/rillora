import { useI18n } from "../i18n/I18nProvider.jsx";
import { AppearanceLink } from "../AppearanceControl.jsx";
import {
  ArrowRight,
  Link as LinkIcon,
  UserCircle,
} from "@phosphor-icons/react";
import { MatterDemo } from "./MatterDemo.jsx";
import { LifeSituations } from "./LifeSituations.jsx";
import { ControlSection } from "./ControlSection.jsx";
import { QuestionList, landingQuestions } from "./LandingFAQ.jsx";
import { publicEntry } from "../publicEntry.js";

export function ProductPage() {
  const { t } = useI18n();
  return (
    <main id="lp-main" className="lp-product-page">
      <header className="lp-page-intro lp-container">
        <h1>
          {t("public.product.title")}
        </h1>
        <p>{t("public.product.intro")}</p>
      </header>
      <MatterDemo />
      <section
        id="sharing"
        tabIndex={-1}
        className="lp-section lp-container"
        aria-labelledby="lp-inviting-title"
      >
        <h2 id="lp-inviting-title">{t("public.product.ownAccount")}</h2>
        <div className="lp-invitation-columns">
          <div>
            <LinkIcon size={32} aria-hidden="true" />
            <h3>{t("public.product.chooseTitle")}</h3>
            <p>{t("public.product.chooseDescription")}</p>
            <AppearanceLink className="lp-text-link" href={publicEntry.accountURL}>{t("public.auth.openMap")}<ArrowRight size={20} aria-hidden="true" />
            </AppearanceLink>
          </div>
          <div>
            <UserCircle size={34} aria-hidden="true" />
            <h3>{t("public.product.acceptTitle")}</h3>
            <p>{t("public.product.acceptDescription")}</p>
            <AppearanceLink className="lp-text-link" href={publicEntry.invitationURL}>{t("public.auth.invitation")}{" "}
              <ArrowRight size={20} aria-hidden="true" />
            </AppearanceLink>
          </div>
        </div>
        <p className="lp-product-note">{t("public.product.guidance")}</p>
      </section>
      <LifeSituations />
    </main>
  );
}
export function SecurityPage() {
  const { t } = useI18n();
  return (
    <main id="lp-main" className="lp-security-page">
      <header className="lp-page-intro lp-container">
        <h1>
          {t("public.security.title")}
        </h1>
        <p>{t("public.security.intro")}</p>
      </header>
      <ControlSection />
      <section className="lp-section lp-container">
        <h2>{t("public.security.answers")}</h2>
        <QuestionList
          questions={landingQuestions.filter((_, index) => index >= 2)}
        />
      </section>
    </main>
  );
}
export function SupportPage() {
  const { t } = useI18n();
  return (
    <main id="lp-main" className="lp-support lp-container">
      <header className="lp-page-intro">
        <h1>{t("public.support.title")}</h1>
      </header>
      <div className="lp-support-grid">
        <div>
          <a className="lp-button" href="mailto:support@rillora.xyz">{t("public.support.contact")}<ArrowRight size={20} aria-hidden="true" />
          </a>
          <p>
            {t("public.support.description")}
          </p>
          <nav aria-label={t("public.support.specific")}>
            <a className="lp-text-link" href="mailto:privacy@rillora.xyz">{t("public.support.privacy")}<ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="lp-text-link" href="mailto:security@rillora.xyz">{t("public.support.security")}{" "}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </nav>
        </div>
        <QuestionList
          questions={[
            ...landingQuestions,
            {
              titleKey: "public.faq.preview.title",
              answerKey: "public.faq.preview.answer",
            },
          ]}
        />
      </div>
    </main>
  );
}
