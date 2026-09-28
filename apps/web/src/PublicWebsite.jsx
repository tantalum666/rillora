import { lazy, Suspense, useEffect } from "react";
import { MotionConfig } from "motion/react";
import { LandingPage } from "./landing/LandingPage.jsx";
import { LandingHeader, LandingFooter } from "./landing/LandingChrome.jsx";
import { publicEntry } from "./publicEntry.js";
import { requestedGuideKey } from "./guideAccess.js";
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
  "/": [LandingPage, "Rillora — Make the important things clear"],
  "/product": [ProductPage, "Product — Rillora"],
  "/security": [SecurityPage, "Security & privacy — Rillora"],
  "/pricing": [PricingPage, "Pricing — Rillora"],
  "/support": [SupportPage, "Help & support — Rillora"],
  "/legal": [LegalInformation, "Legal information — Rillora"],
  "/legal/licenses": [ThirdPartyNotices, "Third-party notices — Rillora"],
};

/** Marketing and public information only. No account data, tracking or storage. */
export function PublicWebsite() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const guides = path === "/guides";
  const guide = requestedGuideKey(window.location.search);
  const guideTarget = `${publicEntry.accountURL}?next=guides${guide ? `&service=${encodeURIComponent(guide)}` : ""}`;
  const [Page, title] = pages[path] ?? [null, "Page not found — Rillora"];
  useEffect(() => {
    document.title = title;
    if (guides) window.location.replace(guideTarget);
  }, [guides, guideTarget, title]);
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-page">
        <a className="lp-skip" href="#lp-main">
          Skip to content
        </a>
        <LandingHeader path={path} />
        <Suspense
          fallback={
            <main
              id="lp-main"
              className="lp-page-content lp-container"
              aria-busy="true"
            >
              <p role="status">Loading…</p>
            </main>
          }
        >
          {Page ? (
            <Page />
          ) : (
            <main id="lp-main" className="lp-page-content lp-container">
              <h1>{guides ? "Account inheritance" : "Page not found"}</h1>
              <a className="lp-button" href={guides ? guideTarget : "/"}>
                {guides ? "Continue to sign in" : "Back to Rillora"}
              </a>
            </main>
          )}
        </Suspense>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
