import { useI18n } from "../i18n/I18nProvider.jsx";
import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "@phosphor-icons/react";

export const landingQuestions = [
  {
    titleKey: "public.faq.keep.title",
    answerKey:
      "public.faq.keep.answer",
  },
  {
    titleKey: "public.faq.app.title",
    answerKey:
      "public.faq.app.answer",
  },
  {
    titleKey: "public.faq.visibility.title",
    answerKey:
      "public.faq.visibility.answer",
  },
  {
    titleKey: "public.faq.transfer.title",
    answerKey:
      "public.faq.transfer.answer",
  },
];

export function QuestionList({ questions = landingQuestions }) {
  const { t } = useI18n();
  return (
    <Accordion.Root type="single" collapsible className="lp-faq">
      {questions.map((item, index) => (
        <Accordion.Item
          className="lp-faq-item"
          value={`question-${index}`}
          key={item.titleKey}
        >
          <Accordion.Header>
            <Accordion.Trigger>
              {t(item.titleKey)}
              <Plus size={22} aria-hidden="true" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content>
            <p>{t(item.answerKey)}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
