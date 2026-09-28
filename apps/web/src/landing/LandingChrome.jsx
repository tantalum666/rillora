import { useState } from "react";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import logo from "../assets/brand/lockup-primary.svg";
import reversedLogo from "../assets/brand/lockup-reversed.svg";
import { publicEntry } from "../publicEntry.js";

export function LandingBrand() {
  return (
    <a className="lp-brand" href="/" aria-label="Rillora home">
      <picture>
        <source media="(prefers-color-scheme: dark)" srcSet={reversedLogo} />
        <img src={logo} width="870" height="208" alt="Rillora" />
      </picture>
    </a>
  );
}

export function PreviewAccountLink() {
  return (
    <a
      className="lp-sign-in"
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

const destinations = [
  ["/product", "Product"],
  ["/security", "Security"],
  ["/pricing", "Pricing"],
  ["/support", "Support"],
];
export function LandingHeader({ path = "/" }) {
  const [open, setOpen] = useState(false);
  return (
    <header
      className="lp-header lp-container"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          event.currentTarget.querySelector(".lp-menu-toggle")?.focus();
        }
      }}
    >
      <LandingBrand />
      <button
        type="button"
        className="lp-menu-toggle"
        aria-expanded={open}
        aria-controls="lp-navigation"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <X size={23} aria-hidden="true" />
        ) : (
          <List size={23} aria-hidden="true" />
        )}
      </button>
      <nav
        id="lp-navigation"
        className={`lp-nav ${open ? "is-open" : ""}`}
        aria-label="Public navigation"
      >
        {destinations.map(([href, label]) => (
          <a
            href={href}
            key={href}
            aria-current={path === href ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <PreviewAccountLink />
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="lp-footer lp-container">
      <div className="lp-footer-row">
        <LandingBrand />
        <nav aria-label="Information and legal links">
          <a href="/support">Support</a>
          <a href="https://legal.rillora.xyz/privacy">Privacy</a>
          <a href="https://legal.rillora.xyz/terms">Terms</a>
          <a href="/legal">Legal</a>
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
