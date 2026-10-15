import { PublicLink } from "../PublicLink.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { AppearanceLink } from "../AppearanceControl.jsx";
import { ArrowRight } from "@phosphor-icons/react";
import hero from "../assets/landing/hero-still-life.webp";
import heroDark from "../assets/landing/hero-dark.webp";
import { publicEntry } from "../publicEntry.js";
import { SharingDemo } from "./SharingDemo.jsx";
import { ThemePicture } from "./AppearanceControl.jsx";
import { Reveal } from "./LandingMotion.jsx";

export function LandingPage() {
  const { t } = useI18n();
  return (
    <main id="lp-main">
      <section className="lp-hero" aria-labelledby="lp-title">
        <ThemePicture
          className="lp-hero-photo"
          light={hero}
          dark={heroDark}
          width="1536"
          height="1024"
          alt=""
          fetchPriority="high"
        />
        <div className="lp-container lp-hero-content">
          <div className="lp-hero-copy">
            <h1 id="lp-title">
              {t("public.home.heroTitle")}
            </h1>
            <p>
              {t("public.home.heroDescription")}
            </p>
            <div className="lp-hero-actions">
              <PublicLink className="lp-button" href="/product">{t("public.home.exploreProduct")}<ArrowRight size={22} aria-hidden="true" />
              </PublicLink>
              <AppearanceLink
                className="lp-invitation-link"
                href={publicEntry.invitationURL}
              >{t("public.auth.invitation")}</AppearanceLink>
            </div>
          </div>
        </div>
      </section>
      <SharingDemo />
      <section
        className="lp-destinations lp-container"
        aria-label={t("public.home.exploreLabel")}
      >
        <Reveal>
          <PublicLink href="/product">
            <span>{t("public.home.productEyebrow")}</span>
            <h2>{t("public.home.productTitle")}</h2>
            <p>{t("public.home.productDescription")}</p>
            <span className="lp-text-link">{t("public.home.exploreProduct")}<ArrowRight size={20} aria-hidden="true" />
            </span>
          </PublicLink>
        </Reveal>
        <Reveal>
          <PublicLink href="/security">
            <span>{t("public.home.securityEyebrow")}</span>
            <h2>{t("public.home.securityTitle")}</h2>
            <p>{t("public.home.securityDescription")}</p>
            <span className="lp-text-link">{t("public.home.securityLink")}<ArrowRight size={20} aria-hidden="true" />
            </span>
          </PublicLink>
        </Reveal>
      </section>
      <section
        className="lp-closing lp-container"
        aria-labelledby="lp-closing-title"
      >
        <div>
          <h2 id="lp-closing-title">
            {t("public.home.closingTitle")}
          </h2>
          <p>{t("public.home.closingDescription")}</p>
        </div>
        <AppearanceLink className="lp-button" href={publicEntry.accountURL}>{t(publicEntry.preview ? "public.auth.explore" : "public.auth.openMap")}<ArrowRight size={22} aria-hidden="true" />
        </AppearanceLink>
      </section>
    </main>
  );
}
