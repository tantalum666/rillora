import { LanguageControl } from "../i18n/LanguageControl.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { AppearanceLink } from "../AppearanceControl.jsx";
import { useState } from "react";
import { ArrowRight, List, X } from "@phosphor-icons/react";
import logo from "../assets/brand/lockup-primary.svg";
import reversedLogo from "../assets/brand/lockup-reversed.svg";
import { AppearanceControl, ThemePicture } from "./AppearanceControl.jsx";
import { publicEntry } from "../publicEntry.js";

export function LandingBrand() {
  const { t } = useI18n();
  return (
    <a className="lp-brand" href="/" aria-label={t("public.nav.homeLabel")}>
      <ThemePicture
        light={logo}
        dark={reversedLogo}
        width="870"
        height="208"
        alt="Rillora"
      />
    </a>
  );
}

export function PreviewAccountLink() {
  const { t } = useI18n();
  return (
    <AppearanceLink
      className="lp-sign-in"
      href={publicEntry.accountURL}
      aria-label={
        publicEntry.preview
          ? t("public.auth.previewLabel")
          : t("public.auth.signinLabel")
      }
    >
      {publicEntry.preview && <span className="lp-preview-label">{t("public.auth.preview")}</span>}
      <span>{t("public.auth.signin")}</span>
      <ArrowRight size={20} aria-hidden="true" />
    </AppearanceLink>
  );
}

const destinations = [
  ["/", "public.nav.home"],
  ["/product", "public.nav.product"],
  ["/security", "public.nav.security"],
  ["/pricing", "public.nav.pricing"],
  ["/support", "public.nav.support"],
];
export function LandingHeader({ path = "/" }) {
  const { t } = useI18n();
  const [panel, setPanel] = useState(null);
  const open = panel === "navigation";
  return (
    <header
      className="lp-header lp-container"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setPanel(null);
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
        aria-label={open ? t("public.nav.close") : t("public.nav.open")}
        onClick={() => setPanel(open ? null : "navigation")}
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
        aria-label={t("public.nav.publicLabel")}
      >
        {destinations.map(([href, labelKey]) => (
          <a
            href={href}
            key={href}
            aria-current={path === href ? "page" : undefined}
          >
            {t(labelKey)}
          </a>
        ))}
      </nav>
      <div className="lp-header-actions">
      <PreviewAccountLink />
      <LanguageControl className="lp-language" />
      <AppearanceControl
        open={panel === "appearance"}
        onOpenChange={(value) => setPanel(value ? "appearance" : null)}
      />
      </div>
    </header>
  );
}

export function LandingFooter() {
  const { t } = useI18n();
  return (
    <footer className="lp-footer lp-container">
      <div className="lp-footer-row">
        <LandingBrand />
        <nav aria-label={t("public.nav.legalLabel")}>
          <a href="/support">{t("public.nav.support")}</a>
          <a href="https://legal.rillora.xyz/privacy">{t("public.nav.privacy")}</a>
          <a href="https://legal.rillora.xyz/terms">{t("public.nav.terms")}</a>
          <a href="/legal">{t("public.nav.legal")}</a>
        </nav>
      </div>
      <div className="lp-footer-notes">
        <p>{t("public.footer.providerProcess")}</p>
        {publicEntry.preview && (
          <p>{t("public.footer.preview")}</p>
        )}
      </div>
    </footer>
  );
}
