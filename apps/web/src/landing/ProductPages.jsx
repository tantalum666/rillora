import {
  ArrowRight,
  Link as LinkIcon,
  UserCircle,
} from "@phosphor-icons/react";
import { MatterDemo } from "./MatterDemo.jsx";
import { LifeSituations } from "./LifeSituations.jsx";
import { ControlSection } from "./ControlSection.jsx";
import { QuestionList, landingQuestions } from "./LandingFAQ.jsx";
import { publicEntry } from "../publicEntry.js";

export function ProductPage() {
  return (
    <main id="lp-main" className="lp-product-page">
      <header className="lp-page-intro lp-container">
        <h1>
          A clear next step
          <br />
          for the people you trust.
        </h1>
        <p>
          Bring the important details together, then decide who can see them.
        </p>
      </header>
      <MatterDemo />
      <section
        id="sharing"
        className="lp-section lp-container"
        aria-labelledby="lp-inviting-title"
      >
        <h2 id="lp-inviting-title">Everyone uses their own account.</h2>
        <div className="lp-invitation-columns">
          <div>
            <LinkIcon size={32} aria-hidden="true" />
            <h3>You choose and invite.</h3>
            <p>
              Select the matters and details a person may see, then send your
              invitation link or QR code.
            </p>
            <a className="lp-text-link" href={publicEntry.accountURL}>
              Open your private map <ArrowRight size={20} aria-hidden="true" />
            </a>
          </div>
          <div>
            <UserCircle size={34} aria-hidden="true" />
            <h3>They sign in and accept.</h3>
            <p>
              They can use the web or iOS app. Their own account gives them
              access to the information you chose.
            </p>
            <a className="lp-text-link" href={publicEntry.invitationURL}>
              Received an invitation?{" "}
              <ArrowRight size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
        <p className="lp-product-note">
          Relevant account inheritance guidance appears with your matters after
          sign-in.
        </p>
      </section>
      <LifeSituations />
    </main>
  );
}
export function SecurityPage() {
  return (
    <main id="lp-main" className="lp-security-page">
      <header className="lp-page-intro lp-container">
        <h1>
          Your information.
          <br />
          Your choices.
        </h1>
        <p>Understand what you share and how your information is protected.</p>
      </header>
      <ControlSection />
      <section className="lp-section lp-container">
        <h2>Clear answers about access.</h2>
        <QuestionList
          questions={landingQuestions.filter((_, index) => index >= 2)}
        />
      </section>
    </main>
  );
}
export function SupportPage() {
  return (
    <main id="lp-main" className="lp-support lp-container">
      <header className="lp-page-intro">
        <h1>How can we help?</h1>
      </header>
      <div className="lp-support-grid">
        <div>
          <a className="lp-button" href="mailto:support@rillora.xyz">
            Contact support <ArrowRight size={20} aria-hidden="true" />
          </a>
          <p>
            Start with what happened.
            <br />
            Leave passwords and private account details out of your message.
          </p>
          <nav aria-label="Specific support requests">
            <a className="lp-text-link" href="mailto:privacy@rillora.xyz">
              Privacy request <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="lp-text-link" href="mailto:security@rillora.xyz">
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
    </main>
  );
}
