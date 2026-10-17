import { withLocale } from "./i18n/localeStore.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { LandingPage } from "./landing/LandingPage.jsx";
import { LandingHeader, LandingFooter } from "./landing/LandingChrome.jsx";
import { publicEntry } from "./publicEntry.js";
import { requestedGuideKey } from "./guideAccess.js";
import { PublicFragmentNavigation } from "./landing/PublicFragmentNavigation.jsx";
import { publicPages, publicRoute } from "./publicSeo.js";
import { publicArticles } from "./publicArticles.js";
import "./landing/landing.css";

const loaders = {
  "/": async () => LandingPage,
  "/product": () => import("./landing/ProductPages.jsx").then(m => m.ProductPage),
  "/security": () => import("./landing/ProductPages.jsx").then(m => m.SecurityPage),
  "/support": () => import("./landing/ProductPages.jsx").then(m => m.SupportPage),
  "/pricing": () => import("./landing/PlanSection.jsx").then(m => m.PlanSection),
  "/legal": () => import("./landing/LegalInformation.jsx").then(m => m.LegalInformation),
  "/legal/licenses": () => import("./landing/LegalInformation.jsx").then(m => m.ThirdPartyNotices),
  "/learn": () => import("./landing/LearningPage.jsx").then(m => m.default),
};

// Resolve a route before rendering on both server and client; keep subpage bundles separate.
export async function loadPublicPage(path) {
  if (Object.hasOwn(publicArticles, path)) return loaders['/learn']();
  return Object.hasOwn(loaders, path) ? loaders[path]() : null;
}

/** Marketing and public information only. No account data or tracking; only explicit language and appearance preferences are stored. */
export function PublicWebsite({ Page, pathname = window.location.pathname, search = window.location.search }) {
  const { t, localePreference, locale } = useI18n();
  const { path } = publicRoute(pathname);
  const guides = path === "/guides";
  const guide = requestedGuideKey(search);
  const guideTarget = withLocale(`${publicEntry.accountURL}?next=guides${guide ? `&service=${encodeURIComponent(guide)}` : ""}`, localePreference, locale);
  const titleKey = publicPages[path]?.title ?? "public.title.notFound";
  useEffect(() => {
    document.title = t(titleKey);
    if (guides) window.location.replace(guideTarget);
  }, [guides, guideTarget, titleKey, t]);
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-page">
        <a className="lp-skip" href="#lp-main">{t("public.navigation.skip")}</a>
        <LandingHeader path={path} />
          {Page ? (
            <Page path={path} />
          ) : (
            <main id="lp-main" className="lp-page-content lp-container">
              <h1>{guides ? t("public.navigation.guides") : t("public.navigation.notFound")}</h1>
              <a className="lp-button" href={guides ? guideTarget : "/"}>
                {guides ? t("public.navigation.signin") : t("public.navigation.back")}
              </a>
            </main>
          )}
          <PublicFragmentNavigation />
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
