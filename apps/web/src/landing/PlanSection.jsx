import { useI18n } from "../i18n/I18nProvider.jsx";
import { publicRoutes } from "../publicRoutes.js";
import { AppearanceLink } from "../AppearanceControl.jsx";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { publicEntry } from "../publicEntry.js";
import catalog from "../../../../config/product-catalog.json" with { type: "json" };


export function PlanSection() {
  const { t, formatMoney } = useI18n();
  const annualPrice = formatMoney(catalog.annual.amountMinor, catalog.currency);
  return (
    <main id="lp-main" className="lp-page-content lp-pricing lp-container">
      <header className="lp-page-intro">
        <h1>{t("public.price.title")}</h1>
        <p>{t("public.price.intro")}</p>
      </header>
      <section className="lp-plan-comparison" aria-label={t("public.price.label")}>
        <p>{t("public.price.preview")}</p>
        <table>
          <caption className="sr-only">{t("public.price.caption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("public.price.feature")}</th>
              <th scope="col">{t("public.price.free")}<strong>{formatMoney(0, catalog.currency)}</strong>
              </th>
              <th scope="col">{t("public.price.family")}<strong>
                  {annualPrice} <small>{t("public.price.perYear")}</small>
                </strong>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{t("public.price.map")}</th>
              <td>
                <Check aria-label={t("public.price.included")} />
              </td>
              <td>
                <Check aria-label={t("public.price.included")} />
              </td>
            </tr>
            <tr>
              <th scope="row">{t("public.price.liveSharing")}</th>
              <td>{t("public.price.onePerson")}</td>
              <td>{t("public.price.fivePeople")}</td>
            </tr>
            <tr>
              <th scope="row">{t("public.price.reviews")}</th>
              <td>{t("public.price.excluded")}</td>
              <td>
                <Check aria-label={t("public.price.included")} />
              </td>
            </tr>
            <tr>
              <th scope="row">{t("public.price.export")}</th>
              <td>
                <Check aria-label={t("public.price.included")} />
              </td>
              <td>
                <Check aria-label={t("public.price.included")} />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="lp-plan-actions">
          <p>{t("public.price.notOpen")}</p>
          <AppearanceLink className="lp-text-link" href={publicEntry.accountURL}>{t("public.auth.try")}<ArrowRight aria-hidden="true" size={20} />
          </AppearanceLink>
        </div>
      </section>
      <p className="lp-pricing-note">{t("public.price.note")}</p>
      <a
        className="lp-text-link"
        href={`https://legal.rillora.xyz${publicRoutes.subscriptions}`}
      >{t("public.price.terms")}<ArrowRight size={20} aria-hidden="true" />
      </a>
    </main>
  );
}
