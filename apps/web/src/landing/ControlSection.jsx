import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import map from "../assets/landing/guidance-map.webp";
import example from "../assets/landing/rillora-sharing-example.txt?url&no-inline";
import { QuestionList } from "./LandingFAQ.jsx";
import { FolioMotion, Reveal } from "./LandingMotion.jsx";

const controls = [
  {
    title: "Choose what you share",
    answer:
      "Share selected matters and details with each person. Your other items stay private. A trusted contact does not automatically receive your whole map.",
  },
  {
    title: "Change or revoke access",
    answer:
      "You can adjust a person’s live access or remove it. Information they have already copied or downloaded cannot be taken back.",
  },
  {
    title: "Keep your own copy",
    answer:
      "Export your information from My data when signed in. Basic export and privacy controls are available on both plans.",
  },
  {
    title: "Encrypted application data",
    answer:
      "Private content uses application-layer encryption with separately managed keys. Rillora’s authorised service can decrypt it to provide the product. This is not end-to-end encryption.",
  },
];

export function ControlSection() {
  return (
    <section
      className="lp-chapter lp-container"
      id="your-control"
      aria-labelledby="lp-control-title"
    >
      <div className="lp-chapter-label">
        <span>04</span>
        <span>Your control</span>
      </div>
      <div className="lp-chapter-body">
        <Reveal>
          <h2 id="lp-control-title">Your map. Your control.</h2>
          <p className="lp-section-intro">
            Clear choices, from the first matter to your own copy.
          </p>
        </Reveal>
        <div className="lp-control-grid">
          <QuestionList questions={controls} />
          <div className="lp-export-example">
            <FolioMotion>
              <img src={map} width="1254" height="1254" alt="" loading="lazy" />
            </FolioMotion>
            <div>
              <h3>A clear, portable view.</h3>
              <p>See how a simple set of directions can read.</p>
              <a
                className="lp-text-link"
                download="rillora-sharing-example.txt"
                href={example}
              >
                Download an example <ArrowDown size={20} aria-hidden="true" />
              </a>
              <small>Sample text file · no account data</small>
            </div>
          </div>
        </div>
        <a className="lp-section-next" href="https://legal.rillora.xyz/privacy">
          Read our privacy policy <ArrowRight size={20} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
