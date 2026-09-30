import { WebsiteAppearanceDisclosure } from "../WebsiteAppearanceDisclosure.jsx";
import { publicRoutes } from "../publicRoutes.js";
import { ArrowRight, DownloadSimple } from "@phosphor-icons/react";
import notices from "../assets/design-credits.txt?raw";
import noticesFile from "../assets/design-credits.txt?url";

const documents = [
  ["Terms of Service", "How you use Rillora", publicRoutes.terms],
  [
    "Privacy Policy",
    "How personal information is handled",
    publicRoutes.privacy,
  ],
  [
    "Subscription Terms",
    "Payment, renewal and cancellation",
    publicRoutes.subscriptions,
  ],
  [
    "Refund & Cancellation",
    "Cancellation and refund information",
    publicRoutes.refunds,
  ],
  [
    "Acceptable Use",
    "Responsible use of the service",
    publicRoutes.acceptableUse,
  ],
  [
    "Cookie Notice",
    "Necessary storage and tracking boundaries",
    publicRoutes.cookies,
  ],
  [
    "Legal Notice",
    "Operator and service information",
    publicRoutes.legalNotice,
  ],
];
export function LegalInformation() {
  return (
    <main id="lp-main" className="lp-page-content lp-legal-index lp-container">
      <header className="lp-page-intro">
        <h1>Legal information.</h1>
        <p>
          The documents behind Rillora and the acknowledgements for the tools we
          use.
        </p>
      </header>
      <nav className="lp-document-links" aria-label="Legal information">
        {documents.map(([label, detail, path]) => (
          <a key={path} href={`https://legal.rillora.xyz${path}`}>
            <span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
            <ArrowRight size={22} aria-hidden="true" />
          </a>
        ))}
        <a href="/legal/licenses">
          <span>
            <strong>Third-party notices</strong>
            <small>Open-source software, fonts and artwork</small>
          </span>
          <ArrowRight size={22} aria-hidden="true" />
        </a>
      </nav>
      <WebsiteAppearanceDisclosure />
    </main>
  );
}
export function ThirdPartyNotices() {
  return (
    <main id="lp-main" className="lp-page-content lp-notices lp-container">
      <a className="lp-text-link" href="/legal">
        Legal information
      </a>
      <header className="lp-page-intro">
        <h1>Third-party notices.</h1>
        <p>
          Copyright and licence acknowledgements for software, fonts and artwork
          used in Rillora.
        </p>
      </header>
      <div className="lp-notice-overview">
        <section>
          <h2>Software & components</h2>
          <p>
            Open-source components include Motion, Radix, Phosphor and the Figma
            Simple Design System. Their copyright and licence notices are
            retained below.
          </p>
        </section>
        <section>
          <h2>Type & artwork</h2>
          <p>
            Inter and Source Serif 4 use the SIL Open Font License. Identifying
            platform marks have their own source credits and usage conditions.
          </p>
        </section>
      </div>
      <details className="lp-full-notices">
        <summary>Read the full acknowledgements and licences</summary>
        <div className="lp-license-text">
          {notices
            .trim()
            .split(/\n{2,}/)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
      </details>
      <a
        className="lp-text-link lp-notices-download"
        download="rillora-third-party-notices.txt"
        href={noticesFile}
      >
        <DownloadSimple size={20} aria-hidden="true" />
        Download a copy
      </a>
    </main>
  );
}
