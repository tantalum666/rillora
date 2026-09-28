import { RilloraBrand } from "./RilloraBrand.jsx";
import { lazy, Suspense, useEffect } from "react";
import { LandingPage, PreviewAccountLink } from "./landing/LandingPage.jsx";
import "./public-experience.css";
import "./interaction-refinement.css";
import "./public-website.css";

const legal = "https://legal.rillora.xyz";
const PublicPlatformGuides = lazy(() =>
  import("./PlatformGuides.jsx").then((module) => ({
    default: module.PublicPlatformGuides,
  })),
);

/** Public information only: no API client, account form, cookies or user storage. */
export function PublicWebsite() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const guides = path === "/guides";
  const support = path === "/support";
  useEffect(() => {
    document.title = guides
      ? "Account inheritance — Rillora"
      : support
        ? "Help & support — Rillora"
        : "Rillora — Make the important things clear";
  }, [guides, support]);
  if (!guides && !support) return <LandingPage />;
  return (
    <div className="public-shell public-website">
      <header className="public-header">
        <a className="public-wordmark" href="/" aria-label="Rillora home">
          <RilloraBrand decorative />
        </a>
        <nav aria-label="Public navigation">
          <a href="/guides" aria-current={guides ? "page" : undefined}>
            Guides
          </a>
          <a href="/support" aria-current={support ? "page" : undefined}>
            Support
          </a>
          <PreviewAccountLink />
        </nav>
      </header>
      {guides && (
        <Suspense
          fallback={
            <main className="public-platform-guides">
              <p role="status">Loading guides…</p>
            </main>
          }
        >
          <PublicPlatformGuides />
        </Suspense>
      )}
      {support && (
        <main className="public-platform-guides public-support">
          <h1>Help & support</h1>
          <a className="secondary-button" href="mailto:support@rillora.xyz">
            Contact support <span aria-hidden="true">↗</span>
          </a>
          <details className="task-details">
            <summary>What should I keep in Rillora?</summary>
            <p>
              Account names, document locations and clear directions. Keep
              passwords, seed phrases, private keys and complete recovery codes
              out of your map.
            </p>
          </details>
          <details className="task-details">
            <summary>Does a guide transfer an account?</summary>
            <p>
              No. Each provider decides access, closure or transfer through its
              own process. Our guides link to those official routes and explain
              what to prepare.
            </p>
          </details>
          <details className="task-details">
            <summary>Can I try Rillora now?</summary>
            <p>
              The Preview sign-in opens our test app. Please use sample
              information. The production app and subscriptions are still being
              prepared. You can read all account inheritance guides without
              signing in.
            </p>
          </details>
          <div className="task-policy-links">
            <a href="mailto:privacy@rillora.xyz">Privacy request</a>
            <a href="mailto:security@rillora.xyz">Report a security issue</a>
          </div>
          <p>
            Do not include passwords or private account details in your first
            message.
          </p>
        </main>
      )}
      <footer className="public-footer">
        <RilloraBrand />
        <p>Digital legacy and estate continuity. Directions, not passwords.</p>
        <nav aria-label="Information and legal links">
          <a href="/support">Support</a>
          <a href={`${legal}/privacy`}>Privacy</a>
          <a href={`${legal}/terms`}>Terms</a>
          <a href={`${legal}/legal`}>Legal</a>
          <a href={`${legal}/cookies`}>Cookies</a>
        </nav>
      </footer>
    </div>
  );
}
