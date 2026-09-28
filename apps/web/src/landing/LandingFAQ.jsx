import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "@phosphor-icons/react";
import { Reveal } from "./LandingMotion.jsx";

export const landingQuestions = [
  {
    title: "What should I keep in Rillora?",
    answer:
      "Account names, document locations, safe references and clear next steps. Keep passwords, seed phrases, private keys and complete recovery codes out of your map.",
  },
  {
    title: "Does my family need the app?",
    answer:
      "No. They can open your invitation on the web, sign in or create their own account, and accept. They see only the matters and details you choose to share.",
  },
  {
    title: "Who can see my information?",
    answer:
      "Each person you invite has their own view. You can change or revoke their live access. Copies they already saved are outside that control.",
  },
  {
    title: "Does Rillora transfer my accounts?",
    answer:
      "No. Rillora organises information and directions. After signing in, account inheritance guidance helps you find official processes. Each provider and the applicable legal process decide access, closure or transfer.",
  },
];

export function QuestionList({ questions = landingQuestions }) {
  return (
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
              <Plus size={22} aria-hidden="true" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <p>{item.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

export function LandingFAQ() {
  return (
    <section className="lp-chapter lp-container" aria-labelledby="lp-faq-title">
      <div className="lp-chapter-label">
        <span>06</span>
        <span>Questions</span>
      </div>
      <Reveal className="lp-chapter-body">
        <h2 id="lp-faq-title">A few things to know.</h2>
        <QuestionList />
      </Reveal>
    </section>
  );
}
