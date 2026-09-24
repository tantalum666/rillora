import { RilloraBrand } from "./RilloraBrand.jsx";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  LockKey,
  MapTrifold,
  ShieldCheck,
  UserCircle,
} from "@phosphor-icons/react";
import { api } from "./api.js";
import { LegalDocumentPage } from "./LegalDocumentPage.jsx";
import { SavedCopyReader } from "./SavedCopyReader.jsx";
import { PublicPlatformGuides } from "./PlatformGuides.jsx";
import "./interaction-refinement.css";
import { LEGAL_CONTRACT } from "./legalContract.js";
import { publicRoutes, resolvePublicView } from "./publicRoutes.js";
import "./public-experience.css";
import { PublicHome } from "./PublicHome.jsx";
import { accountPathForMatter, authenticationReturnPath } from "./publicIntent.js";

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
  const [view, setView] = useState(() => resolvePublicView(window.location.pathname));
  const [hasVisitedHome, setHasVisitedHome] = useState(view === "home");
  const homeScroll = useRef(0);
  const [cookieNoticeVisible, setCookieNoticeVisible] = useState(
    () => !hasDismissedCookieNotice(),
  );
  const showCookieNotice = cookieNoticeVisible && view !== "cookies";

  useEffect(() => {
    const handlePopState = () => {
      const next = resolvePublicView(window.location.pathname);
      if (next === "home") setHasVisitedHome(true);
      setView(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const titles = {
      home: "Rillora — A clear plan for what comes next",
      account: "Account — Rillora",
      savedCopy: "Open saved copy — Rillora",
      guides: "Account inheritance — Rillora",
      privacy: "Privacy Policy — Rillora",
      terms: "Terms of Service — Rillora",
      subscriptions: "Subscription Terms — Rillora",
      refunds: "Refund & Cancellation — Rillora",
      acceptableUse: "Acceptable Use — Rillora",
      cookies: "Cookie Notice — Rillora",
      legalNotice: "Legal Notice — Rillora",
    };
    document.title = titles[view] ?? titles.home;
  }, [view]);

  function navigate(path) {
    const next = resolvePublicView(new URL(path, window.location.origin).pathname);
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
        <a className="public-wordmark" href={publicRoutes.home} onClick={(event) => handleNavigation(event, publicRoutes.home)} aria-label="Rillora home"><RilloraBrand decorative /></a>
        <nav aria-label="Public navigation">
          <a href={publicRoutes.guides} className={view === "guides" ? "is-current" : ""} onClick={(event) => handleNavigation(event, publicRoutes.guides)}>Guides</a>
          <a className={view === "account" ? "is-current" : ""} href={publicRoutes.account} onClick={view === "guides" ? undefined : (event) => handleNavigation(event, publicRoutes.account)}>Account</a>
        </nav>
      </header>

      {hasVisitedHome && <div hidden={view !== "home"}>
        <PublicHome onStart={(category) => navigate(accountPathForMatter(category))} />
      </div>}
      {view === "guides" && <PublicPlatformGuides />}
      {view === "savedCopy" ? <main className="public-copy-page"><button className="text-button" onClick={() => navigate(publicRoutes.home)}>Back to Rillora</button><h1>Open a saved copy</h1><SavedCopyReader /></main> : view === "account" ? (
        <AccountPage
          sessionStatus={sessionStatus}
          onRetry={onRetry}
          onBack={() => navigate(publicRoutes.home)}
        />
      ) : ["privacy", "terms", "subscriptions", "refunds", "acceptableUse", "cookies", "legalNotice"].includes(view) ? (
        <LegalDocumentPage documentKey={view} onBack={() => navigate(publicRoutes.home)} />
      ) : null}

      {showCookieNotice && (
        <CookieNoticeBanner
          onDismiss={dismissCookieNotice}
          onReview={() => navigate(publicRoutes.cookies)}
        />
      )}

      <footer className="public-footer">
        <span><RilloraBrand /></span>
        <p>Digital legacy and estate continuity. Directions, not passwords.</p>
        <nav aria-label="Legal and account links">
          <a href={publicRoutes.privacy} onClick={(event) => handleNavigation(event, publicRoutes.privacy)}>Privacy</a>
          <a href={publicRoutes.terms} onClick={(event) => handleNavigation(event, publicRoutes.terms)}>Terms</a>
          <a href={publicRoutes.legalNotice} onClick={(event) => handleNavigation(event, publicRoutes.legalNotice)}>Legal</a>
          <a href={publicRoutes.account} onClick={view === "guides" ? undefined : (event) => handleNavigation(event, publicRoutes.account)}>Account</a>
          <a href={publicRoutes.savedCopy} onClick={(event) => handleNavigation(event, publicRoutes.savedCopy)}>Open saved copy</a>
        </nav>
      </footer>
    </div>
  );
}

function CookieNoticeBanner({ onDismiss, onReview }) {
  return (
    <aside className="cookie-notice-banner" role="region" aria-labelledby="cookie-notice-title">
      <div>
        <strong id="cookie-notice-title">Necessary cookies only</strong>
        <p>For sign-in, security and draft recovery. No ads or behavioural analytics.</p>
      </div>
      <div className="cookie-notice-actions">
        <button type="button" className="cookie-notice-review" onClick={onReview}>Review Cookie Notice</button>
        <button type="button" className="cookie-notice-dismiss" onClick={onDismiss}>Got it</button>
      </div>
    </aside>
  );
}


function AccountPage({ sessionStatus, onRetry, onBack }) {
  const checking = sessionStatus === "checking";
  const unavailable = sessionStatus === "unavailable";
  const [hasAccepted, setHasAccepted] = useState(false);
  const [workingIntent, setWorkingIntent] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  async function beginAuthentication(intent) {
    if (!hasAccepted || workingIntent) return;
    setWorkingIntent(intent);
    setErrorMessage(null);
    try {
      const response = await api.startAuthentication({
        intent,
        returnTo: authenticationReturnPath(window.location.search),
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
      setErrorMessage(error?.message || "The secure sign-in flow could not be opened.");
      setWorkingIntent(null);
    }
  }

  return (
    <main className="public-account" aria-labelledby="account-title">
      <button className="account-back" type="button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> Back to Rillora</button>
      <div className="account-layout">
        <section>
          <h1 id="account-title">{new URLSearchParams(window.location.search).get("next") === "reviews" ? "Open your review inbox" : "Your private map"}</h1>
        </section>
        <section className="account-actions" aria-label="Account options">
          {checking && <p className="account-status">Checking whether you already have an active session…</p>}
          {unavailable && <><p className="account-status is-error">The account service is temporarily unavailable. The public site is still available.</p><button className="secondary-button" type="button" onClick={onRetry}>Try account service again</button></>}
          {!checking && !unavailable && <>
            <div className="account-action-form">
              <button className="primary-button" type="button" disabled={!hasAccepted || Boolean(workingIntent)} onClick={() => beginAuthentication("signup")}>
                {workingIntent === "signup" ? "Opening secure signup…" : "Create account"} <ArrowRight size={20} aria-hidden="true" />
              </button>
              <button className="secondary-button" type="button" disabled={!hasAccepted || Boolean(workingIntent)} onClick={() => beginAuthentication("signin")}>
                {workingIntent === "signin" ? "Opening secure sign in…" : "Sign in"}
              </button>
              <div className="account-consent">
                <label>
                  <input
                    type="checkbox"
                    checked={hasAccepted}
                    onChange={(event) => setHasAccepted(event.target.checked)}
                  />
                  <span>I agree to the <a href={publicRoutes.terms} target="_blank" rel="noreferrer">Terms</a>, acknowledge the <a href={publicRoutes.privacy} target="_blank" rel="noreferrer">Privacy Policy</a>, and consent to electronic records.</span>
                </label>
              </div>
            </div>
            {errorMessage && <p className="account-status is-error" role="alert">{errorMessage}</p>}
          </>}
        </section>
      </div>
    </main>
  );
}
