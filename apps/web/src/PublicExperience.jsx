import { LanguageControl } from "./i18n/LanguageControl.jsx";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { AppAppearanceControl } from "./AppearanceControl.jsx";
import { RilloraBrand } from "./RilloraBrand.jsx";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react";
import { api } from "./api.js";
import { LegalDocumentPage } from "./LegalDocumentPage.jsx";
import { SavedCopyReader } from "./SavedCopyReader.jsx";
import "./interaction-refinement.css";
import { LEGAL_CONTRACT } from "./legalContract.js";
import { publicRoutes, resolvePublicView } from "./publicRoutes.js";
import "./public-experience.css";
import "./landing/public-shell-i18n.css";
import { PublicHome } from "./PublicHome.jsx";
import { accountPathForMatter, authenticationReturnPath } from "./publicIntent.js";
import { isGuideRequest } from './guideAccess.js';

function requestedPublicView(value = window.location.href) {
  const url = new URL(value, window.location.origin);
  return isGuideRequest(url.search, url.pathname) ? 'account' : resolvePublicView(url.pathname);
}

const cookieNoticeVersion = "necessary-storage-2026-09-15-1";
const cookieNoticeStorageKey = "rillora.cookie-notice";

function hasDismissedCookieNotice() {
  try {
    return window.localStorage.getItem(cookieNoticeStorageKey) === cookieNoticeVersion;
  } catch {
    return false;
  }
}

export function PublicExperience({ sessionStatus, onRetry }) {
  const { t } = useI18n();
  const [view, setView] = useState(() => requestedPublicView());
  const [hasVisitedHome, setHasVisitedHome] = useState(view === "home");
  const homeScroll = useRef(0);
  const [cookieNoticeVisible, setCookieNoticeVisible] = useState(
    () => !hasDismissedCookieNotice(),
  );
  const showCookieNotice = cookieNoticeVisible && view !== "cookies";

  useEffect(() => {
    const handlePopState = () => {
      const next = requestedPublicView();
      if (next === "home") setHasVisitedHome(true);
      setView(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const titles = {
      home: t("public.title.appHome"),
      account: t("public.title.account"),
      savedCopy: t("public.title.savedCopy"),
      privacy: t("public.title.privacy"),
      terms: t("public.title.terms"),
      subscriptions: t("public.title.subscriptions"),
      refunds: t("public.title.refunds"),
      acceptableUse: t("public.title.acceptable"),
      cookies: t("public.title.cookies"),
      legalNotice: t("public.title.notice"),
    };
    document.title = titles[view] ?? titles.home;
  }, [view, t]);

  function navigate(path) {
    const next = requestedPublicView(path);
    if (view === "home" && next !== "home") homeScroll.current = window.scrollY;
    if (next === "home") setHasVisitedHome(true);
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setView(next);
    window.requestAnimationFrame(() => window.scrollTo({ top: next === "home" ? homeScroll.current : 0, behavior: "auto" }));
  }

  function handleNavigation(event, path) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (path === publicRoutes.home) homeScroll.current = 0;
    navigate(path);
  }

  function dismissCookieNotice() {
    try {
      window.localStorage.setItem(cookieNoticeStorageKey, cookieNoticeVersion);
    } catch {
      // The current page can still dismiss the notice when storage is unavailable.
    }
    setCookieNoticeVisible(false);
  }

  return (
    <div className={`public-shell public-shell-${view}${showCookieNotice ? " has-cookie-notice" : ""}`}>
      <header className="public-header">
        <a className="public-wordmark" href={publicRoutes.home} onClick={(event) => handleNavigation(event, publicRoutes.home)} aria-label={t("public.nav.homeLabel")}><RilloraBrand decorative /></a>
        <nav aria-label={t("public.nav.publicLabel")}>
          <a className={view === "account" ? "is-current" : ""} href={publicRoutes.account} onClick={(event) => handleNavigation(event, publicRoutes.account)}>{t("public.nav.account")}</a>
        </nav>
        <LanguageControl />
        <AppAppearanceControl />
      </header>

      {hasVisitedHome && <div hidden={view !== "home"}>
        <PublicHome onStart={(category) => navigate(accountPathForMatter(category))} />
      </div>}
      {view === "savedCopy" ? <main className="public-copy-page"><button className="text-button" onClick={() => navigate(publicRoutes.home)}>{t("public.navigation.back")}</button><h1>{t("public.savedCopy.title")}</h1><SavedCopyReader /></main> : view === "account" ? (
        <AccountPage
          sessionStatus={sessionStatus}
          onRetry={onRetry}
          onBack={() => navigate(publicRoutes.home)}
        />
      ) : ["privacy", "terms", "subscriptions", "refunds", "acceptableUse", "cookies", "legalNotice"].includes(view) ? (
        <div lang="en"><LegalDocumentPage documentKey={view} onBack={() => navigate(publicRoutes.home)} /></div>
      ) : null}

      {showCookieNotice && (
        <CookieNoticeBanner
          onDismiss={dismissCookieNotice}
          onReview={() => navigate(publicRoutes.cookies)}
        />
      )}

      <footer className="public-footer">
        <span><RilloraBrand /></span>
        <p>{t("public.footer.tagline")}</p>
        <nav aria-label={t("public.nav.accountLegalLabel")}>
          <a href={publicRoutes.privacy} onClick={(event) => handleNavigation(event, publicRoutes.privacy)}>{t("public.nav.privacy")}</a>
          <a href={publicRoutes.terms} onClick={(event) => handleNavigation(event, publicRoutes.terms)}>{t("public.nav.terms")}</a>
          <a href={publicRoutes.legalNotice} onClick={(event) => handleNavigation(event, publicRoutes.legalNotice)}>{t("public.nav.legal")}</a>
          <a href={publicRoutes.account} onClick={(event) => handleNavigation(event, publicRoutes.account)}>{t("public.nav.account")}</a>
          <a href={publicRoutes.savedCopy} onClick={(event) => handleNavigation(event, publicRoutes.savedCopy)}>{t("public.savedCopy.open")}</a>
        </nav>
      </footer>
    </div>
  );
}

function CookieNoticeBanner({ onDismiss, onReview }) {
  const { t } = useI18n();
  return (
    <aside className="cookie-notice-banner" role="region" aria-labelledby="cookie-notice-title">
      <div>
        <strong id="cookie-notice-title">{t("public.cookie.title")}</strong>
        <p>{t("public.cookie.description")}</p>
      </div>
      <div className="cookie-notice-actions">
        <button type="button" className="cookie-notice-review" onClick={onReview}>{t("public.cookie.review")}</button>
        <button type="button" className="cookie-notice-dismiss" onClick={onDismiss}>{t("public.cookie.dismiss")}</button>
      </div>
    </aside>
  );
}


function AccountPage({ sessionStatus, onRetry, onBack }) {
  const { t, locale, errorMessage: localizeError } = useI18n();
  const checking = sessionStatus === "checking";
  const unavailable = sessionStatus === "unavailable";
  const notOpen = sessionStatus === "not_open";
  const [hasAccepted, setHasAccepted] = useState(false);
  const [workingIntent, setWorkingIntent] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  async function beginAuthentication(intent) {
    if (checking || unavailable || notOpen || !hasAccepted || workingIntent) return;
    setWorkingIntent(intent);
    setErrorMessage(null);
    try {
      const response = await api.startAuthentication({
        intent,
        returnTo: authenticationReturnPath(window.location.search, window.location.pathname),
        legalAcceptance: {
          termsVersion: LEGAL_CONTRACT.termsVersion,
          privacyVersion: LEGAL_CONTRACT.privacyVersion,
          consentTextVersion: LEGAL_CONTRACT.consentTextVersion,
          bundleSha256: LEGAL_CONTRACT.bundleSha256,
          acceptedTerms: true,
          acknowledgedPrivacy: true,
          acceptedElectronicRecords: true,
        },
      });
      window.location.assign(response.authorizationUrl);
    } catch (error) {
      setErrorMessage(error);
      setWorkingIntent(null);
    }
  }

  return (
    <main className="public-account" aria-labelledby="account-title">
      <button className="account-back" type="button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" />{t("public.navigation.back")}</button>
      <div className="account-layout">
        <section>
          <h1 id="account-title">{isGuideRequest(window.location.search, window.location.pathname) ? t("public.account.guideTitle") : new URLSearchParams(window.location.search).get("next") === "reviews" ? t("public.account.reviewsTitle") : t("public.account.mapTitle")}</h1>
        </section>
        <section className="account-actions" aria-label={t("public.account.options")}>
          {checking && <p className="account-status">{t("public.account.checking")}</p>}
          {notOpen && <p className="account-status" role="status">{t("public.account.notOpen")}</p>}
          {unavailable && <><p className="account-status is-error">{t("public.account.unavailable")}</p><button className="secondary-button" type="button" onClick={onRetry}>{t("public.account.retry")}</button></>}
          {!checking && !unavailable && !notOpen && <>
            <div className="account-action-form">
              <button className="primary-button" type="button" disabled={!hasAccepted || Boolean(workingIntent)} onClick={() => beginAuthentication("signup")}>
                {workingIntent === "signup" ? t("public.account.signingUp") : t("public.auth.signup")} <ArrowRight size={20} aria-hidden="true" />
              </button>
              <button className="secondary-button" type="button" disabled={!hasAccepted || Boolean(workingIntent)} onClick={() => beginAuthentication("signin")}>
                {workingIntent === "signin" ? t("public.account.signingIn") : t("public.auth.signin")}
              </button>
              <div className="account-consent">
                <label>
                  <input
                    type="checkbox"
                    checked={hasAccepted}
                    aria-describedby={locale === "zh-CN" ? "account-consent-translation" : undefined}
                    onChange={(event) => setHasAccepted(event.target.checked)}
                  />
                  <span lang="en">I agree to the <a href={publicRoutes.terms} target="_blank" rel="noreferrer">Terms</a>, acknowledge the <a href={publicRoutes.privacy} target="_blank" rel="noreferrer">Privacy Policy</a>, and consent to electronic records.</span>
                </label>
                {locale === "zh-CN" && <p id="account-consent-translation" className="account-consent-translation">{t("public.account.consentTranslation")}</p>}
              </div>
            </div>
            {errorMessage && <p className="account-status is-error" role="alert">{localizeError(errorMessage, "public.account.launchFailed")}</p>}
          </>}
        </section>
      </div>
    </main>
  );
}
