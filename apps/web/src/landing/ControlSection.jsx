import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import example from "../assets/landing/rillora-sharing-example.txt?url&no-inline";
import { QuestionList } from "./LandingFAQ.jsx";

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
      className="lp-section lp-container"
      id="your-control"
      aria-label="Sharing, export and encryption controls"
    >
      <div className="lp-section-body">
        <div className="lp-control-grid">
          <QuestionList questions={controls} />
          <div className="lp-export-example">
            <div className="lp-export-paper" aria-label="Example export">
              <span>Rillora</span>
              <h3>Shared directions</h3>
              <p>
                Insurance
                <br />
                Home documents
              </p>
              <small>Shared with Mum</small>
            </div>
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
