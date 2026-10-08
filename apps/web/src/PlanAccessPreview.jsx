import { AddressBook, CaretRight, CheckCircle, CreditCard, Shield } from "@phosphor-icons/react";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { commercialFeatureLabel, commercialPlanLabel } from "./commercialAccess.js";
import { webAnnualOffer } from "./productionBilling.js";
import { ProductionBillingControls } from "./ProductionBillingControls.jsx";
import { TestBillingControls } from "./TestBillingControls.jsx";
import { SurfaceIcon } from "./SurfaceMotion.jsx";
import "./plan-access.css";

function FeatureList({ features }) {
  const { t } = useI18n();
  return <ul className="commercial-feature-list">{features.map(feature => <li key={feature}>
    <CheckCircle size={20} weight="fill" aria-hidden="true" /><span>{commercialFeatureLabel(feature, t)}</span>
  </li>)}</ul>;
}

export function PlanAccessPreview({ commerce, onAccessChanged, returnedFromCheckout }) {
  const { t, formatMoney } = useI18n();
  if (!commerce.available) return <section className="current-access-card"><CreditCard size={36} aria-hidden="true" />
    <h2>{t("workspace.access.unavailable")}</h2><p>{t("workspace.access.coreAvailable")}</p></section>;
  // A historical annual offer must never be advertised as today's price.
  const offer = commerce.offers.find(item => item.priceCode === webAnnualOffer.priceCode && item.billingInterval === "annual");
  return <div className="plan-access-preview">
    <p className="current-access-status"><span>{t("workspace.access.current")}</span><strong>{commercialPlanLabel(commerce, t)}</strong></p>
    <section className="access-plan-card is-family family-plan-feature" aria-labelledby="family-plan-title">
      <div className="family-plan-heading"><SurfaceIcon icon={AddressBook} emblem /><div>
        <h2 id="family-plan-title">{t("workspace.plan.family")}</h2><p>{t("workspace.access.familyLead")}</p>
      </div></div>
      <div className="family-plan-price">
        {offer ? <p className="access-plan-price"><strong>{t("workspace.price.annual", { price: formatMoney(offer.amountMinor, offer.currencyCode, offer.minorUnitExponent) })}</strong></p>
          : <p>{t("workspace.access.priceUnavailable")}</p>}
        {offer && <small>{t("workspace.access.webPrice")}</small>}
      </div>
      <p className="family-plan-included">{t("workspace.access.familyPlus")}</p>
      <FeatureList features={commerce.familyFeatures} />
      {!commerce.billingOpen && <p className="family-plan-availability">{t("workspace.access.newClosed")}</p>}
      {commerce.validationOnly
        ? <TestBillingControls commerce={commerce} onAccessChanged={onAccessChanged} />
        : <ProductionBillingControls commerce={commerce} onAccessChanged={onAccessChanged} returnedFromCheckout={returnedFromCheckout} embedded />}
    </section>
    <details className="task-details plan-disclosure"><summary><SurfaceIcon icon={CreditCard}/><span>{t("workspace.access.freeIncluded")}</span><CaretRight size={17} className="disclosure-chevron" aria-hidden="true"/></summary>
      <FeatureList features={commerce.freeFeatures} />
    </details>
    <details className="task-details plan-disclosure"><summary><SurfaceIcon icon={Shield}/><span>{t("workspace.access.afterFamily")}</span><CaretRight size={17} className="disclosure-chevron" aria-hidden="true"/></summary>
      <p>{t("workspace.access.afterFamilyDetails")}</p><p>{t("workspace.access.disclosureBoundary")}</p>
    </details>
  </div>;
}
