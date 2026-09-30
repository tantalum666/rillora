import * as Accordion from "@radix-ui/react-accordion";
import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import { ProviderMark } from "../ProviderMark.jsx";
import map from "../assets/continuity-map.png";
import { FolioMotion, Reveal } from "./LandingMotion.jsx";

const guides = [
  { id: "apple", name: "Apple", route: "Legacy Contact" },
  { id: "google", name: "Google", route: "Inactive Account Manager" },
  { id: "coinbase", name: "Coinbase", route: "Estate requests" },
];
const questions = [
  {
    title: "Who can see my information?",
    answer:
      "People you invite can see only the matters and details you choose to share. You can change or revoke access. Copies they already saved are outside that control.",
  },
  {
    title: "Does Rillora transfer my accounts?",
    answer:
      "Rillora helps you organise information and find official instructions. Each provider and the applicable legal process determine access or transfer. Rillora does not move funds or automatically release your information.",
  },
];

export function GuidanceSection() {
  return (
    <section className="lp-guidance" aria-labelledby="lp-guidance-title">
      <div className="lp-container lp-guidance-grid">
        <Reveal className="lp-guide-story">
          <h2 id="lp-guidance-title">
            A next step,
            <br />
            not a dead end.
          </h2>
          <p>Find the official process for the accounts that matter.</p>
          <FolioMotion className="lp-guide-art">
            <img src={map} width="1254" height="1254" alt="" loading="lazy" />
          </FolioMotion>
        </Reveal>
        <Reveal className="lp-guide-actions" delay={0.1}>
          <nav className="lp-guide-list" aria-label="Official account guidance">
            {guides.map((guide) => (
              <a href={`/guides?service=${guide.id}`} key={guide.id}>
                <ProviderMark providerKey={guide.id} />
                <strong>{guide.name}</strong>
                <span>{guide.route}</span>
                <ArrowRight size={23} aria-hidden="true" />
              </a>
            ))}
          </nav>
          <a className="lp-text-link lp-all-guides" href="/guides">
            Explore all guides <ArrowRight size={23} aria-hidden="true" />
          </a>
          <Accordion.Root type="single" collapsible className="lp-faq">
            {questions.map((item, index) => (
              <Accordion.Item
                className="lp-faq-item"
                value={`question-${index}`}
                key={item.title}
              >
                <Accordion.Header>
                  <Accordion.Trigger>
                    {item.title}
                    <CaretDown size={20} aria-hidden="true" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  <p>{item.answer}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Reveal>
      </div>
    </section>
  );
}
