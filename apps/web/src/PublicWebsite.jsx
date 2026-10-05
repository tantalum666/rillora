import { withLocale } from "./i18n/localeStore.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { lazy, Suspense, useEffect } from "react";
import { MotionConfig } from "motion/react";
import { LandingPage } from "./landing/LandingPage.jsx";
import { LandingHeader, LandingFooter } from "./landing/LandingChrome.jsx";
import { publicEntry } from "./publicEntry.js";
import { requestedGuideKey } from "./guideAccess.js";
import { PublicFragmentNavigation } from "./landing/PublicFragmentNavigation.jsx";
import "./landing/landing.css";

const ProductPage = lazy(() =>
  import("./landing/ProductPages.jsx").then((m) => ({
    default: m.ProductPage,
  })),
);
const SecurityPage = lazy(() =>
  import("./landing/ProductPages.jsx").then((m) => ({
    default: m.SecurityPage,
  })),
);
const SupportPage = lazy(() =>
  import("./landing/ProductPages.jsx").then((m) => ({
    default: m.SupportPage,
  })),
);
const PricingPage = lazy(() =>
  import("./landing/PlanSection.jsx").then((m) => ({ default: m.PlanSection })),
);
const LegalInformation = lazy(() =>
  import("./landing/LegalInformation.jsx").then((m) => ({
    default: m.LegalInformation,
  })),
);
const ThirdPartyNotices = lazy(() =>
  import("./landing/LegalInformation.jsx").then((m) => ({
    default: m.ThirdPartyNotices,
  })),
);
const pages = {
  "/": [LandingPage, "public.title.home"],
  "/product": [ProductPage, "public.title.product"],
  "/security": [SecurityPage, "public.title.security"],
  "/pricing": [PricingPage, "public.title.pricing"],
  "/support": [SupportPage, "public.title.support"],
  "/legal": [LegalInformation, "public.title.legal"],
  "/legal/licenses": [ThirdPartyNotices, "public.title.notices"],
};

/** Marketing and public information only. No account data or tracking; only explicit language and appearance preferences are stored. */
export function PublicWebsite() {
  const { t, localePreference } = useI18n();
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const guides = path === "/guides";
  const guide = requestedGuideKey(window.location.search);
  const guideTarget = withLocale(`${publicEntry.accountURL}?next=guides${guide ? `&service=${encodeURIComponent(guide)}` : ""}`, localePreference);
  const [Page, titleKey] = pages[path] ?? [null, "public.title.notFound"];
  useEffect(() => {
    document.title = t(titleKey);
    if (guides) window.location.replace(guideTarget);
  }, [guides, guideTarget, titleKey, t]);
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-page">
        <a className="lp-skip" href="#lp-main">{t("public.navigation.skip")}</a>
        <LandingHeader path={path} />
        <Suspense
          fallback={
            <main
              id="lp-main"
              className="lp-page-content lp-container"
              aria-busy="true"
            >
              <p role="status">{t("public.navigation.loading")}</p>
            </main>
          }
        >
          {Page ? (
            <Page />
          ) : (
            <main id="lp-main" className="lp-page-content lp-container">
              <h1>{guides ? t("public.navigation.guides") : t("public.navigation.notFound")}</h1>
              <a className="lp-button" href={guides ? guideTarget : "/"}>
                {guides ? t("public.navigation.signin") : t("public.navigation.back")}
              </a>
            </main>
          )}
          <PublicFragmentNavigation />
        </Suspense>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
