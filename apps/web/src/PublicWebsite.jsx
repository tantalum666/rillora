import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { LandingPage } from "./landing/LandingPage.jsx";
import { LandingHeader, LandingFooter } from "./landing/LandingChrome.jsx";
import { QuestionList, landingQuestions } from "./landing/LandingFAQ.jsx";
import { publicEntry } from "./publicEntry.js";
import { requestedGuideKey } from "./guideAccess.js";
import "./landing/landing.css";

/** Public information only: no API client, consent form or account storage. */
export function PublicWebsite() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const guides = path === "/guides";
  const support = path === "/support";
  const guide = requestedGuideKey(window.location.search);
  const guideTarget = `${publicEntry.accountURL}?next=guides${guide ? `&service=${encodeURIComponent(guide)}` : ""}`;
  useEffect(() => {
    document.title = support
      ? "Help & support — Rillora"
      : "Rillora — Make the important things clear";
    // The CDN redirects old bookmarks too. This covers local previews/fallbacks.
    if (guides) window.location.replace(guideTarget);
  }, [guides, guideTarget, support]);
  if (!guides && !support) return <LandingPage />;
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-page">
        <LandingHeader />
        <main className="lp-support lp-container">
          <a className="lp-text-link" href="/">
            <ArrowLeft size={20} aria-hidden="true" />
            Back to Rillora
          </a>
          {guides ? (
            <>
              <h1>Account inheritance</h1>
              <a className="lp-button" href={guideTarget}>
                Continue to sign in <ArrowRight size={20} aria-hidden="true" />
              </a>
            </>
          ) : (
            <>
              <h1>How can we help?</h1>
              <div className="lp-support-grid">
                <div>
                  <a className="lp-button" href="mailto:support@rillora.xyz">
                    Contact support <ArrowRight size={20} aria-hidden="true" />
                  </a>
                  <p>
                    Start with what happened.
                    <br />
                    Leave passwords and private account details out of your
                    message.
                  </p>
                  <nav aria-label="Specific support requests">
                    <a
                      className="lp-text-link"
                      href="mailto:privacy@rillora.xyz"
                    >
                      Privacy request{" "}
                      <ArrowRight size={18} aria-hidden="true" />
                    </a>
                    <a
                      className="lp-text-link"
                      href="mailto:security@rillora.xyz"
                    >
                      Report a security issue{" "}
                      <ArrowRight size={18} aria-hidden="true" />
                    </a>
                  </nav>
                </div>
                <QuestionList
                  questions={[
                    ...landingQuestions,
                    {
                      title: "Can I try Rillora now?",
                      answer:
                        "Yes. Preview sign-in opens our test app. Please use sample information. The production app and paid subscriptions are still being prepared. Specific account inheritance guidance is available after sign-in.",
                    },
                  ]}
                />
              </div>
            </>
          )}
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
