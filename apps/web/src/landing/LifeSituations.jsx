import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  FileText,
  HandHeart,
  Link as LinkIcon,
  UserCircle,
} from "@phosphor-icons/react";
import { Reveal } from "./LandingMotion.jsx";

const situations = [
  {
    id: "death",
    label: "After a death",
    title: "A place to begin.",
    detail:
      "Find the information and directions already shared with you. Legal authority and each provider’s requirements still apply.",
    icon: FileText,
  },
  {
    id: "incapacity",
    label: "Unable to act",
    title: "Help, with the right authority.",
    detail:
      "Leave directions for the people helping you. Being a trusted contact does not make someone a legal representative.",
    icon: HandHeart,
  },
  {
    id: "unreachable",
    label: "Out of reach",
    title: "Clarity without assumptions.",
    detail:
      "Being out of touch never triggers an automatic release. Your existing sharing choices remain in control.",
    icon: LinkIcon,
  },
];

export function LifeSituations() {
  const [active, setActive] = useState(2);
  const reduce = useReducedMotion();
  const item = situations[active];
  const Icon = item.icon;
  return (
    <section
      className="lp-chapter lp-container"
      aria-labelledby="lp-life-title"
    >
      <div className="lp-chapter-label">
        <span>03</span>
        <span>Life changes</span>
      </div>
      <div className="lp-chapter-body">
        <Reveal>
          <h2 id="lp-life-title">Ready for life’s changes.</h2>
          <p className="lp-section-intro">
            Different situations. Clear boundaries.
          </p>
        </Reveal>
        <div
          className="lp-situation-choices"
          role="group"
          aria-label="Explore a life situation"
        >
          {situations.map((situation, index) => (
            <button
              key={situation.id}
              type="button"
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              {situation.label}
            </button>
          ))}
        </div>
        <div className="lp-life-scene">
          <motion.div
            className="lp-life-copy"
            key={item.id}
            aria-live="polite"
            initial={reduce ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </motion.div>
          <div
            className="lp-life-path"
            aria-label="Sharing remains your choice"
          >
            <span>
              <i>
                <Icon size={36} aria-hidden="true" />
              </i>
              You choose what
              <br />
              to share
            </span>
            <span className="lp-life-connector" aria-hidden="true" />
            <span>
              <i>
                <UserCircle size={38} aria-hidden="true" />
              </i>
              They see only
              <br />
              what you’ve chosen
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
