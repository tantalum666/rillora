import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Bank,
  FileText,
  Laptop,
  CurrencyBtc,
  ArrowRight,
} from "@phosphor-icons/react";
import { matterExamples } from "./matterExamples.js";
import { Reveal } from "./LandingMotion.jsx";

const icons = { bank: Bank, file: FileText, laptop: Laptop, coin: CurrencyBtc };

export function MatterDemo() {
  const [selected, setSelected] = useState(0);
  const reduce = useReducedMotion();
  const item = matterExamples[selected];
  const Icon = icons[item.icon];
  function select(index) {
    setSelected(index);
  }
  return (
    <section
      className="lp-section lp-organise lp-container"
      id="how-it-works"
      aria-labelledby="lp-organise-title"
      tabIndex={-1}
    >
      <div className="lp-section-body">
        <Reveal className="lp-section-heading">
          <div>
            <h2 id="lp-organise-title">What goes in your map.</h2>
            <p>
              An account, a document, a device. Give it a place and a next step.
            </p>
          </div>
        </Reveal>
        <div
          className="lp-category-choices"
          role="group"
          aria-label="Choose a matter example"
        >
          {matterExamples.map((example, index) => (
            <button
              key={example.id}
              type="button"
              aria-pressed={index === selected}
              onClick={() => select(index)}
            >
              {example.label}
            </button>
          ))}
        </div>
        <div className="lp-organise-scene">
          <div className="lp-map-rail">
            <p>Your map</p>
            {matterExamples.map((example, index) => {
              const RowIcon = icons[example.icon];
              return (
                <button
                  key={example.id}
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => select(index)}
                >
                  <RowIcon aria-hidden="true" size={24} />
                  <span>{example.title}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              );
            })}
            <small>Interactive example · nothing is saved</small>
          </div>
          <div className="lp-matter-sheet" aria-live="polite">
            <motion.div
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 10, rotate: 0.4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: reduce ? 0 : 0.35 }}
            >
              <div className="lp-matter-sheet-heading">
                <span className="lp-sheet-icon">
                  <Icon size={30} aria-hidden="true" />
                </span>
                <div>
                  <small>{item.type}</small>
                  <h3>{item.title}</h3>
                </div>
              </div>
              <dl>
                {item.fields.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Notes</dt>
                  <dd className="lp-matter-note">{item.note}</dd>
                </div>
              </dl>
            </motion.div>
          </div>
        </div>
        <a className="lp-section-next" href="/#people">
          From what matters, to who it matters to{" "}
          <ArrowRight aria-hidden="true" size={20} />
        </a>
      </div>
    </section>
  );
}
