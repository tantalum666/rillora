import { publicRoutes } from "../publicRoutes.js";
import { AppearanceLink } from "../AppearanceControl.jsx";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { publicEntry } from "../publicEntry.js";
import catalog from "../../../../config/product-catalog.json" with { type: "json" };

const annualPrice = `${catalog.currency === "USD" ? "US" : ""}${new Intl.NumberFormat("en-US", { style: "currency", currency: catalog.currency }).format(catalog.annual.amountMinor / 100)}`;

export function PlanSection() {
  return (
    <main id="lp-main" className="lp-page-content lp-pricing lp-container">
      <header className="lp-page-intro">
        <h1>A plan that fits your circle.</h1>
        <p>Start with one person. Make more room when you need it.</p>
      </header>
      <section className="lp-plan-comparison" aria-label="Planned Web pricing">
        <p>Planned Web pricing. Preview access is available now.</p>
        <table>
          <caption className="sr-only">
            Free and Family planned Web features
          </caption>
          <thead>
            <tr>
              <th scope="col">Feature</th>
              <th scope="col">
                Free<strong>$0</strong>
              </th>
              <th scope="col">
                Family
                <strong>
                  {annualPrice} <small>/ year</small>
                </strong>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Private map</th>
              <td>
                <Check aria-label="Included" />
              </td>
              <td>
                <Check aria-label="Included" />
              </td>
            </tr>
            <tr>
              <th scope="row">Live sharing</th>
              <td>1 person</td>
              <td>Up to 5 people</td>
            </tr>
            <tr>
              <th scope="row">Shared reviews</th>
              <td>Not included</td>
              <td>
                <Check aria-label="Included" />
              </td>
            </tr>
            <tr>
              <th scope="row">Export and privacy controls</th>
              <td>
                <Check aria-label="Included" />
              </td>
              <td>
                <Check aria-label="Included" />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="lp-plan-actions">
          <p>Paid subscriptions are not open yet.</p>
          <AppearanceLink className="lp-text-link" href={publicEntry.accountURL}>
            Try Preview <ArrowRight aria-hidden="true" size={20} />
          </AppearanceLink>
        </div>
      </section>
      <p className="lp-pricing-note">
        Both plans include core privacy and export controls. Receiving an
        invitation does not require a paid plan.
      </p>
      <a
        className="lp-text-link"
        href={`https://legal.rillora.xyz${publicRoutes.subscriptions}`}
      >
        Subscription terms <ArrowRight size={20} aria-hidden="true" />
      </a>
    </main>
  );
}
