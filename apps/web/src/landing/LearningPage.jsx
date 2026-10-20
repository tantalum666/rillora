import { useI18n } from "../i18n/I18nProvider.jsx";
import { PublicLink } from "../PublicLink.jsx";
import { ArrowRight } from "@phosphor-icons/react";
import { publicArticles, articleDate } from "../publicArticles.js";

export default function LearningPage({ path }) {
  const { t, locale } = useI18n();
  const article = publicArticles[path];
  if (!article) return <main id="lp-main" className="lp-page-content lp-container lp-learning">
    <header className="lp-page-intro"><h1>{t("public.learn.heading")}</h1><p>{t("public.learn.intro")}</p></header>
    <nav className="lp-document-links" aria-label={t("public.learn.link")}>
      {Object.entries(publicArticles).map(([href, { key }]) => <PublicLink key={href} href={href}>
        <span><strong>{t(`public.learn.${key}.heading`)}</strong><small>{t(`public.learn.${key}.description`)}</small></span><ArrowRight aria-hidden="true" size={24} />
      </PublicLink>)}
    </nav>
  </main>;
  const prefix = `public.learn.${article.key}`;
  return <main id="lp-main" className="lp-page-content lp-container lp-learning">
    <nav className="lp-learning-breadcrumb" aria-label={t("public.learn.breadcrumb")}>
      <PublicLink href="/">{t("public.nav.home")}</PublicLink><span aria-hidden="true">/</span>
      <PublicLink href="/learn">{t("public.learn.link")}</PublicLink>
    </nav>
    <article>
      <header className="lp-page-intro"><h1>{t(`${prefix}.heading`)}</h1><p>{t(`${prefix}.description`)}</p>
        <small>{t("public.learn.byline", { date: articleDate(article.modified, locale) })}</small></header>
      <nav className="lp-learning-contents" aria-label={t("public.learn.contents")}>
        <strong>{t("public.learn.contents")}</strong><ol>{article.sections.map(section =>
          <li key={section}><a href={`#section-${section}`}>{t(`${prefix}.${section}.title`)}</a></li>)}</ol>
      </nav>
      {article.sections.map(section => <section key={section} id={`section-${section}`}>
        <h2>{t(`${prefix}.${section}.title`)}</h2><p>{t(`${prefix}.${section}.body`)}</p>
      </section>)}
      {article.questions ? <section><h2>{t("public.learn.questions")}</h2>{article.questions.map(question =>
        <details className="lp-faq-item" key={question}><summary>{t(`${prefix}.${question}.question`)}</summary>
          <p>{t(`${prefix}.${question}.answer`)}</p></details>)}</section> : null}
      {article.sources ? <section className="lp-learning-sources"><h2>{t("public.learn.sources")}</h2>
        <ul>{article.sources.map(source => <li key={source.key}><a href={source.urls[locale]} rel="noopener noreferrer" target="_blank">
          {t(`public.learn.source.${source.key}`)}</a></li>)}</ul>
        <p>{t("public.learn.sourcesChecked", { date: articleDate(article.modified, locale) })}</p>
      </section> : null}
    </article>
    <nav className="lp-learning-related" aria-label={t("public.learn.related")}><h2>{t("public.learn.related")}</h2>
      <ul>{article.related.map(href => <li key={href}><PublicLink href={href}>
        {t(`public.learn.${publicArticles[href].key}.heading`)}</PublicLink></li>)}</ul>
    </nav>
    <nav className="lp-learning-next" aria-label={t("public.home.exploreLabel")}>
      <PublicLink className="lp-text-link" href="/product">{t("public.learn.product")}<ArrowRight aria-hidden="true" size={20} /></PublicLink>
      <PublicLink className="lp-text-link" href="/security">{t("public.learn.security")}<ArrowRight aria-hidden="true" size={20} /></PublicLink>
    </nav>
  </main>;
}
