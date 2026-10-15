import { useI18n } from "../i18n/I18nProvider.jsx";
import { useId } from "react";
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
  const group = useId();
  // Native disclosure keeps the same interaction available before JavaScript loads.
  return <div className="lp-faq">
    {questions.map(item => <details className="lp-faq-item" name={group} key={item.titleKey}>
      <summary>{t(item.titleKey)}<Plus size={22} aria-hidden="true" /></summary>
      <p>{t(item.answerKey)}</p>
    </details>)}
  </div>;
}
