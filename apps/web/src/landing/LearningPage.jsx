import { useI18n } from "../i18n/I18nProvider.jsx";
import { PublicLink } from "../PublicLink.jsx";
import { ArrowRight } from "@phosphor-icons/react";

const articles = {
  "/learn/digital-legacy-checklist": { key: "checklist", sections: ["step1", "step2", "step3", "step4", "example"] },
  "/learn/password-manager-and-digital-legacy": { key: "passwords", sections: ["step1", "step2", "step3"] },
};

export default function LearningPage({ path }) {
  const { t } = useI18n();
  const article = articles[path];
  if (!article) return <main id="lp-main" className="lp-page-content lp-container lp-learning">
    <header className="lp-page-intro"><h1>{t("public.learn.heading")}</h1><p>{t("public.learn.intro")}</p></header>
    <nav className="lp-document-links" aria-label={t("public.learn.link")}>
      {Object.entries(articles).map(([href, { key }]) => <PublicLink key={href} href={href}>
        <span><strong>{t(`public.learn.${key}.heading`)}</strong><small>{t(`public.learn.${key}.description`)}</small></span><ArrowRight aria-hidden="true" size={24} />
      </PublicLink>)}
    </nav>
  </main>;
  const prefix = `public.learn.${article.key}`;
  return <main id="lp-main" className="lp-page-content lp-container lp-learning">
    <PublicLink className="lp-text-link" href="/learn">{t("public.learn.back")}</PublicLink>
    <article>
      <header className="lp-page-intro"><h1>{t(`${prefix}.heading`)}</h1><p>{t(`${prefix}.description`)}</p><small>{t("public.learn.byline")}</small></header>
      {article.sections.map(section => <section key={section}><h2>{t(`${prefix}.${section}.title`)}</h2><p>{t(`${prefix}.${section}.body`)}</p></section>)}
    </article>
    <nav className="lp-learning-next" aria-label={t("public.home.exploreLabel")}>
      <PublicLink className="lp-text-link" href="/product">{t("public.learn.product")}<ArrowRight aria-hidden="true" size={20} /></PublicLink>
      <PublicLink className="lp-text-link" href="/security">{t("public.learn.security")}<ArrowRight aria-hidden="true" size={20} /></PublicLink>
    </nav>
  </main>;
}
