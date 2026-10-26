import { useI18n } from "../i18n/I18nProvider.jsx";
import { PublicLink } from "../PublicLink.jsx";
import { publicArticles } from "../publicArticles.js";

// A small contextual reading path, outside the primary navigation.
export const relatedResources = Object.freeze({
  product: ["/learn/digital-legacy-checklist", "/learn/apple-google-legacy-settings"],
  security: ["/learn/share-digital-legacy-safely", "/learn/password-manager-and-digital-legacy"],
  support: ["/learn/what-is-digital-legacy", "/learn/choose-a-digital-legacy-tool"],
});

export function RelatedResources({ topic, className = "" }) {
  const { t } = useI18n();
  return <nav className={`lp-related-resources ${className}`} aria-label={t("public.learn.related")}>
    <h2>{t("public.learn.related")}</h2>
    <ul>{relatedResources[topic].map(href => <li key={href}>
      <PublicLink href={href}>{t(`public.learn.${publicArticles[href].key}.heading`)}</PublicLink>
    </li>)}</ul>
  </nav>;
}
