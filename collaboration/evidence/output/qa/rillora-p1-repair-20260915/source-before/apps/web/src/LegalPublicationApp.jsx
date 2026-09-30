import { useEffect } from "react";
import { LegalDocumentPage } from "./LegalDocumentPage.jsx";
import { publicRoutes, resolvePublicView } from "./publicRoutes.js";
import "./public-experience.css";

const publicHomeUrl = import.meta.env.VITE_PUBLIC_HOME_URL?.trim()
  || "https://rillora.xyz/";

const legalLinks = Object.freeze([
  ["Terms", publicRoutes.terms],
  ["Privacy", publicRoutes.privacy],
  ["Subscriptions", publicRoutes.subscriptions],
  ["Refunds", publicRoutes.refunds],
  ["Acceptable Use", publicRoutes.acceptableUse],
  ["Cookies", publicRoutes.cookies],
  ["Legal Notice", publicRoutes.legalNotice],
]);

const legalViews = new Set([
  "privacy",
  "terms",
  "subscriptions",
  "refunds",
  "acceptableUse",
  "cookies",
  "legalNotice",
]);

const titles = Object.freeze({
  privacy: "Privacy Policy — Rillora",
  terms: "Terms of Service — Rillora",
  subscriptions: "Subscription Terms — Rillora",
  refunds: "Refund & Cancellation — Rillora",
  acceptableUse: "Acceptable Use — Rillora",
  cookies: "Cookie Notice — Rillora",
  legalNotice: "Legal Notice — Rillora",
});

function resolveLegalView(pathname) {
  const view = resolvePublicView(pathname);
  return legalViews.has(view) ? view : "terms";
}

export function LegalPublicationApp() {
  const documentKey = resolveLegalView(window.location.pathname);

  useEffect(() => {
    document.title = titles[documentKey];
  }, [documentKey]);

  return (
    <div className="public-shell public-shell-legal-publication">
      <header className="public-header">
        <a className="public-wordmark" href={publicHomeUrl}>Rillora</a>
        <nav aria-label="Primary legal pages">
          <a aria-current={documentKey === "terms" ? "page" : undefined} href={publicRoutes.terms}>Terms</a>
          <a aria-current={documentKey === "privacy" ? "page" : undefined} href={publicRoutes.privacy}>Privacy</a>
          <a aria-current={documentKey === "legalNotice" ? "page" : undefined} href={publicRoutes.legalNotice}>Legal</a>
        </nav>
      </header>

      <LegalDocumentPage
        documentKey={documentKey}
        onBack={() => window.location.assign(publicHomeUrl)}
      />

      <footer className="public-footer">
        <span>Rillora</span>
        <p>Official legal documents. English controls where applicable law permits.</p>
        <nav aria-label="All legal documents">
          {legalLinks.map(([label, href]) => (
            <a aria-current={window.location.pathname === href ? "page" : undefined} href={href} key={href}>{label}</a>
          ))}
        </nav>
      </footer>
    </div>
  );
}
