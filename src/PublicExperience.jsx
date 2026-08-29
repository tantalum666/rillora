import { useEffect, useState } from "react";
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
import { LEGAL_CONTRACT } from "./legalContract.js";
import { publicRoutes, resolvePublicView } from "./publicRoutes.js";
import "./public-experience.css";

const continuitySteps = [
  {
    icon: MapTrifold,
    label: "What exists",
    summary: "Accounts, files and records",
  },
  {
    icon: FileText,
    label: "What happens",
    summary: "Keep, transfer or close",
  },
  {
    icon: UserCircle,
    label: "Who can help",
    summary: "People you trust",
  },
];

const cookieNoticeVersion = "necessary-storage-2026-08-27-1";
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
  const [cookieNoticeVisible, setCookieNoticeVisible] = useState(
    () => !hasDismissedCookieNotice(),
  );
  const showCookieNotice = cookieNoticeVisible && view !== "cookies";

  useEffect(() => {
    const handlePopState = () => setView(resolvePublicView(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const titles = {
      home: "Rillora — A clear plan for what comes next",
      account: "Account — Rillora",
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
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    setView(resolvePublicView(path));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNavigation(event, path) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
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
        <a className="public-wordmark" href={publicRoutes.home} onClick={(event) => handleNavigation(event, publicRoutes.home)} aria-label="Rillora home">Rillora</a>
        <nav aria-label="Public navigation">
          <a className={view === "account" ? "is-current" : ""} href={publicRoutes.account} onClick={(event) => handleNavigation(event, publicRoutes.account)}>Account</a>
        </nav>
      </header>

      {view === "account" ? (
        <AccountPage
          sessionStatus={sessionStatus}
          onRetry={onRetry}
          onBack={() => navigate(publicRoutes.home)}
        />
      ) : ["privacy", "terms", "subscriptions", "refunds", "acceptableUse", "cookies", "legalNotice"].includes(view) ? (
        <LegalDocumentPage documentKey={view} onBack={() => navigate(publicRoutes.home)} />
      ) : (
        <PublicHome onStart={() => navigate(publicRoutes.account)} />
      )}

      {showCookieNotice && (
        <CookieNoticeBanner
          onDismiss={dismissCookieNotice}
          onReview={() => navigate(publicRoutes.cookies)}
        />
      )}

      <footer className="public-footer">
        <span>Rillora</span>
        <p>Digital legacy and estate continuity. Directions, not passwords.</p>
        <nav aria-label="Legal and account links">
          <a href={publicRoutes.privacy} onClick={(event) => handleNavigation(event, publicRoutes.privacy)}>Privacy</a>
          <a href={publicRoutes.terms} onClick={(event) => handleNavigation(event, publicRoutes.terms)}>Terms</a>
          <a href={publicRoutes.legalNotice} onClick={(event) => handleNavigation(event, publicRoutes.legalNotice)}>Legal</a>
          <a href={publicRoutes.account} onClick={(event) => handleNavigation(event, publicRoutes.account)}>Account</a>
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
        <p>Rillora uses only cookies and local storage needed for secure sign-in, sessions, request protection, and this notice. No advertising or behavioural analytics are active. This is information—not consent to future optional cookies.</p>
      </div>
      <div className="cookie-notice-actions">
        <button type="button" className="cookie-notice-review" onClick={onReview}>Review Cookie Notice</button>
        <button type="button" className="cookie-notice-dismiss" onClick={onDismiss}>Got it</button>
      </div>
    </aside>
  );
}

function PublicHome({ onStart }) {
  return (
    <main className="architectural-home">
      <section className="architectural-hero" id="how-it-works" aria-labelledby="public-hero-title">
        <div className="architectural-hero-copy">
          <p className="architectural-kicker">A private map for what comes next</p>
          <h1 id="public-hero-title">A clear plan for what comes next.</h1>
          <p className="architectural-lede">Map what matters and leave clear directions for someone you trust.</p>
          <p className="architectural-boundary"><ShieldCheck size={18} weight="regular" aria-hidden="true" /> Directions, not passwords.</p>
        </div>

        <div className="architectural-index" aria-label="A Rillora plan connects what exists, what happens, and who can help">
          <p className="architectural-index-kicker">Your private map</p>
          {continuitySteps.map(({ icon: Icon, label, summary }) => (
            <article className="architectural-index-row" key={label}>
              <span className="architectural-index-icon"><Icon size={22} aria-hidden="true" /></span>
              <span><strong>{label}</strong><small>{summary}</small></span>
            </article>
          ))}
        </div>
      </section>

      <section className="architectural-safety" id="privacy" aria-labelledby="safety-title">
        <div className="architectural-section-heading">
          <p className="architectural-kicker">Separate processes</p>
          <h2 id="safety-title">Life events never share one vague trigger.</h2>
        </div>
        <div className="architectural-event-grid" aria-label="Death, incapacity, and unreachable are separate processes">
          <span><ShieldCheck size={18} aria-hidden="true" /> Death</span>
          <span><UserCircle size={18} aria-hidden="true" /> Incapacity</span>
          <span><LockKey size={18} aria-hidden="true" /> Unreachable</span>
        </div>
      </section>

      <section className="architectural-final" aria-labelledby="final-cta-title">
        <p className="architectural-kicker">Ready when you are</p>
        <h2 id="final-cta-title">Create your private map.</h2>
        <button className="architectural-primary" type="button" onClick={onStart}>Create my private map <ArrowRight size={21} aria-hidden="true" /></button>
      </section>
    </main>
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
        returnTo: "/",
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
          <p className="public-eyebrow">Account</p>
          <h1 id="account-title">Continue with Rillora.</h1>
          <p>Sign in to your private map, or create one when you are ready to save.</p>
        </section>
        <section className="account-actions" aria-label="Account options">
          {checking && <p className="account-status">Checking whether you already have an active session…</p>}
          {unavailable && <><p className="account-status is-error">The account service is temporarily unavailable. The public site is still available.</p><button className="secondary-button" type="button" onClick={onRetry}>Try account service again</button></>}
          {!checking && !unavailable && <>
            <div className="account-action-form">
              <div className="account-consent">
                <label>
                  <input
                    type="checkbox"
                    checked={hasAccepted}
                    aria-describedby="account-consent-note"
                    onChange={(event) => setHasAccepted(event.target.checked)}
                  />
                  <span>I agree to the <a href={publicRoutes.terms} target="_blank" rel="noreferrer">Terms</a>, acknowledge the <a href={publicRoutes.privacy} target="_blank" rel="noreferrer">Privacy Policy</a>, and consent to electronic records.</span>
                </label>
                <small id="account-consent-note">Required for account access. No recurring charge.</small>
              </div>
              <button className="primary-button" type="button" disabled={!hasAccepted || Boolean(workingIntent)} onClick={() => beginAuthentication("signup")}>
                {workingIntent === "signup" ? "Opening secure signup…" : "Create account"} <ArrowRight size={20} aria-hidden="true" />
              </button>
              <button className="secondary-button" type="button" disabled={!hasAccepted || Boolean(workingIntent)} onClick={() => beginAuthentication("signin")}>
                {workingIntent === "signin" ? "Opening secure sign in…" : "Sign in"}
              </button>
            </div>
            {errorMessage && <p className="account-status is-error" role="alert">{errorMessage}</p>}
            <p className="account-boundary"><LockKey size={17} aria-hidden="true" /> Secure identity domain</p>
          </>}
        </section>
      </div>
    </main>
  );
}
