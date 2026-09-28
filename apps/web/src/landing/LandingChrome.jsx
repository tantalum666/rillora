import { ArrowRight } from "@phosphor-icons/react";
import logo from "../assets/brand/lockup-primary.svg";
import credits from "../assets/design-credits.txt?url";
import { publicEntry } from "../publicEntry.js";

export function PreviewAccountLink({ className = "" }) {
  return (
    <a
      className={`lp-sign-in ${className}`}
      href={publicEntry.accountURL}
      aria-label={
        publicEntry.preview
          ? "Sign in to the Rillora preview"
          : "Sign in to Rillora"
      }
    >
      {publicEntry.preview && <span className="lp-preview-label">Preview</span>}
      <span>Sign in</span>
      <ArrowRight size={20} aria-hidden="true" />
    </a>
  );
}

export function LandingHeader({ home = false }) {
  return (
    <header className="lp-header lp-container">
      <a className="lp-brand" href="/" aria-label="Rillora home">
        <img src={logo} width="870" height="208" alt="Rillora" />
      </a>
      <nav className="lp-nav" aria-label="Public navigation">
        <a href={`${home ? "" : "/"}#how-it-works`}>How it works</a>
        <a href={`${home ? "" : "/"}#your-control`}>Your control</a>
      </nav>
      <PreviewAccountLink />
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="lp-footer lp-container">
      <div className="lp-footer-row">
        <a className="lp-brand" href="/" aria-label="Rillora home">
          <img src={logo} width="870" height="208" alt="Rillora" />
        </a>
        <nav aria-label="Information and legal links">
          <a href="/support">Support</a>
          <a href="https://legal.rillora.xyz/privacy">Privacy</a>
          <a href="https://legal.rillora.xyz/terms">Terms</a>
          <a href={credits}>Credits</a>
        </nav>
      </div>
      <div className="lp-footer-notes">
        <p>Access and transfers follow each provider’s own process.</p>
        {publicEntry.preview && (
          <p>Preview uses the test app. Please use sample information.</p>
        )}
      </div>
    </footer>
  );
}
