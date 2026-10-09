import { useI18n } from "./i18n/I18nProvider.jsx";
import { withLocalePath } from "./i18n/localeStore.js";
import { publicRoutes } from "./publicRoutes.js";

export function legalDocumentHref(documentKey, locale, external = false) {
  const path = withLocalePath(publicRoutes[documentKey], locale, locale);
  return external ? `https://legal.rillora.xyz${path}` : path;
}

export function RegistrationConsentText({ external = false }) {
  const { locale, t } = useI18n();
  return <span lang={locale}>
    {t("common.consent.agree")}<a href={legalDocumentHref("terms", locale, external)} target="_blank" rel="noreferrer">{t("common.consent.terms")}</a>
    {t("common.consent.acknowledge")}<a href={legalDocumentHref("privacy", locale, external)} target="_blank" rel="noreferrer">{t("common.consent.privacy")}</a>
    {t("common.consent.electronicRecords")}
  </span>;
}

export function SubscriptionConsentText() {
  const { locale, t } = useI18n();
  return <span lang={locale}>
    {t("common.consent.agree")}<a href={legalDocumentHref("subscriptions", locale)} target="_blank" rel="noopener noreferrer">{t("common.consent.subscriptions")}</a>
    {t("common.consent.and")}<a href={legalDocumentHref("refunds", locale)} target="_blank" rel="noopener noreferrer">{t("common.consent.refunds")}</a>
    {t("common.consent.yearlyRenewal")}
  </span>;
}
