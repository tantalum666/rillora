import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { publicEntry } from "../publicEntry.js";
import { Reveal } from "./LandingMotion.jsx";
import catalog from "../../../../config/product-catalog.json" with { type: "json" };

const annualPrice = `${catalog.currency === "USD" ? "US" : ""}${new Intl.NumberFormat("en-US", {
  style: "currency", currency: catalog.currency,
}).format(catalog.annual.amountMinor / 100)}`;

export function PlanSection() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <section
      className="lp-chapter lp-container"
      id="plans"
      aria-labelledby="lp-plans-title"
    >
      <div className="lp-chapter-label">
        <span>05</span>
        <span>Your circle</span>
      </div>
      <div className="lp-chapter-body">
        <Reveal className="lp-plan-intro">
          <div>
            <h2 id="lp-plans-title">
              A plan that fits
              <br />
              your circle.
            </h2>
            <p className="lp-section-intro">
              Start with one person. Make more room when you need it.
            </p>
          </div>
          <button
            className="lp-button"
            type="button"
            aria-expanded={open}
            aria-controls="lp-plan-comparison"
            onClick={() => setOpen(!open)}
          >
            {open ? "Close comparison" : "Explore plans"}
            <ArrowRight aria-hidden="true" size={20} />
          </button>
        </Reveal>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="lp-plan-comparison"
              className="lp-plan-comparison"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.3 }}
            >
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
                <a className="lp-text-link" href={publicEntry.accountURL}>
                  Try Preview <ArrowRight aria-hidden="true" size={20} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
