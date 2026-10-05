import { useI18n } from "./i18n/I18nProvider.jsx";

// This UI-setting supplement is separate from the accepted English contract body.
export function WebsiteAppearanceDisclosure({ compact = false }) {
  const { t, locale } = useI18n();
  return <>
    <section lang={locale} id={compact ? undefined : "appearance"} tabIndex={compact ? undefined : -1}
      className={compact ? "legal-appearance-update" : "lp-appearance-note"}
      aria-label={t("common.appearance.heading")}>
      {compact ? <strong>{t("common.appearance.updated")}</strong> : <h2>{t("common.appearance.heading")}</h2>}
      <p>{t("common.appearance.storage")}</p>
      <p>{t("common.appearance.links")}</p>
      {compact && <p>{t("common.appearance.supplement")} <a href="https://www.rillora.xyz/legal#appearance">{t("common.appearance.details")}</a></p>}
    </section>
    <section lang={locale} id={compact ? undefined : "language"} tabIndex={compact ? undefined : -1}
      className={compact ? "legal-appearance-update" : "lp-appearance-note"}
      aria-label={t("common.language.heading")}>
      <h2>{t("common.language.heading")}</h2>
      <p>{t("common.language.description")}</p>
      <p>{t("common.language.privacy")}</p>
      <p>{t("common.language.boundary")}</p>
    </section>
  </>;
}
