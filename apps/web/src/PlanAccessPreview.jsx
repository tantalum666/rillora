import { AddressBook, CheckCircle, CreditCard } from "@phosphor-icons/react";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { currentWebAnnualOffer } from "./productionBilling.js";
import { ProductionBillingControls } from "./ProductionBillingControls.jsx";
import { TestBillingControls } from "./TestBillingControls.jsx";
import { SurfaceIcon } from "./SurfaceMotion.jsx";
import { LEGACY_CONTENT_ENABLED } from './legacyContentFeature.js';
import "./plan-access.css";

export function PlanAccessPreview({ commerce, onAccessChanged, returnedFromCheckout }) {
  const { t, formatMoney } = useI18n();
  if (!commerce.available) return <section className="current-access-card"><CreditCard size={36} aria-hidden="true" />
    <h2>{t("workspace.access.unavailable")}</h2><p>{t("workspace.access.coreAvailable")}</p></section>;
  const offer = currentWebAnnualOffer(commerce.offers);
  return <div className="plan-access-preview">
    <section className="access-plan-card is-family family-plan-feature" aria-labelledby="family-plan-title">
      <div className="family-plan-heading"><SurfaceIcon icon={AddressBook} emblem />
        <h2 id="family-plan-title">{t("workspace.plan.family")}</h2>
      </div>
      {commerce.familyFeatures.length > 0 && <ul className="commercial-feature-list">
        {["familyRecipients", "familyReviews", "familyCorrections"].map(key => <li key={key}>
          <CheckCircle size={20} weight="fill" aria-hidden="true" /><span>{t(`workspace.access.${key}`)}</span>
        </li>)}
        {LEGACY_CONTENT_ENABLED && ['packs', 'files', 'voice'].map(key => <li key={key}>
          <CheckCircle size={20} weight="fill" aria-hidden="true"/><span>{t(`content.family.${key}`)}</span>
        </li>)}
      </ul>}
      <div className="family-plan-price">
        {offer ? <p className="access-plan-price"><strong>{t("workspace.price.annual", { price: formatMoney(offer.amountMinor, offer.currencyCode, offer.minorUnitExponent) })}</strong></p>
          : <p>{t("workspace.access.priceUnavailable")}</p>}
        {offer && <small>{t("workspace.access.webPrice")}</small>}
      </div>
      {commerce.webBillingEnvironment === 'test' && commerce.validationOnly
        ? <TestBillingControls commerce={commerce} onAccessChanged={onAccessChanged} />
        : <ProductionBillingControls commerce={commerce} onAccessChanged={onAccessChanged} returnedFromCheckout={returnedFromCheckout} />}
    </section>
  </div>;
}
