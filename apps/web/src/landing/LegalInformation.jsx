import { PublicLink } from "../PublicLink.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { WebsiteAppearanceDisclosure } from "../WebsiteAppearanceDisclosure.jsx";
import { publicRoutes } from "../publicRoutes.js";
import { ArrowRight, DownloadSimple } from "@phosphor-icons/react";
import notices from "../assets/design-credits.txt?raw";
import noticesFile from "../assets/design-credits.txt?url";

const documents = [
  ["public.legal.terms", "public.legal.termsDetail", publicRoutes.terms],
  [
    "public.legal.privacy",
    "public.legal.privacyDetail",
    publicRoutes.privacy,
  ],
  [
    "public.legal.subscriptions",
    "public.legal.subscriptionsDetail",
    publicRoutes.subscriptions,
  ],
  [
    "public.legal.refunds",
    "public.legal.refundsDetail",
    publicRoutes.refunds,
  ],
  [
    "public.legal.acceptable",
    "public.legal.acceptableDetail",
    publicRoutes.acceptableUse,
  ],
  [
    "public.legal.cookies",
    "public.legal.cookiesDetail",
    publicRoutes.cookies,
  ],
  [
    "public.legal.notice",
    "public.legal.noticeDetail",
    publicRoutes.legalNotice,
  ],
];
export function LegalInformation() {
  const { t, locale } = useI18n();
  return (
    <main id="lp-main" className="lp-page-content lp-legal-index lp-container">
      <header className="lp-page-intro">
        <h1>{t("public.legal.title")}</h1>
        <p>{t("public.legal.description")}</p>
      </header>
      <nav className="lp-document-links" aria-label={t("public.legal.label")}>
        {documents.map(([labelKey, detailKey, path]) => (
          <PublicLink key={path} href={`https://legal.rillora.xyz${path}?lang=${locale}`}>
            <span>
              <strong>{t(labelKey)}</strong>
              <small>{t(detailKey)}</small>
            </span>
            <ArrowRight size={22} aria-hidden="true" />
          </PublicLink>
        ))}
        <PublicLink href={"/legal/licenses"}>
          <span>
            <strong>{t("public.legal.thirdParty")}</strong>
            <small>{t("public.legal.thirdPartyDetail")}</small>
          </span>
          <ArrowRight size={22} aria-hidden="true" />
        </PublicLink>
      </nav>
      <WebsiteAppearanceDisclosure />
    </main>
  );
}
export function ThirdPartyNotices() {
  const { t } = useI18n();
  return (
    <main id="lp-main" className="lp-page-content lp-notices lp-container">
      <PublicLink className="lp-text-link" href={"/legal"}>{t("public.legal.label")}</PublicLink>
      <header className="lp-page-intro">
        <h1>{t("public.legal.thirdPartyTitle")}</h1>
        <p>{t("public.legal.thirdPartyDescription")}</p>
      </header>
      <div className="lp-notice-overview">
        <section>
          <h2>{t("public.legal.softwareTitle")}</h2>
          <p>{t("public.legal.softwareDescription")}</p>
        </section>
        <section>
          <h2>{t("public.legal.artTitle")}</h2>
          <p>{t("public.legal.artDescription")}</p>
        </section>
      </div>
      <details className="lp-full-notices">
        <summary>{t("public.legal.fullNotices")}</summary>
        <div className="lp-license-text" lang="en">
          {notices
            .trim()
            .split(/\n{2,}/)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
      </details>
      <PublicLink
        className="lp-text-link lp-notices-download"
        download="rillora-third-party-notices.txt"
        href={noticesFile}
      >
        <DownloadSimple size={20} aria-hidden="true" />{t("public.legal.download")}</PublicLink>
    </main>
  );
}
