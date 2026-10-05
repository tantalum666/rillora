import { useI18n } from "./i18n/I18nProvider.jsx";
import { suggestedAccountGuides } from "./officialProviderGuides.js";
import { ProviderGuidePanel } from "./TaskPanels.jsx";
import "./platform-guides.css";
import { ProviderMark } from "./ProviderMark.jsx";

export function MatterAccountGuides({ fields, preparing = false }) {
  const { t } = useI18n();
  const guides = suggestedAccountGuides(fields);
  if (!guides.length) return null;
  return <section className="matter-account-guides" aria-label={t("forms.guides.context")}>
    <p className="section-label">{t("forms.guides.context")}</p>
    {guides.map(guide => <details key={guide.key} className="matter-account-guide">
      <summary><ProviderMark providerKey={guide.key}/><span><strong>{t("forms.guides.guidance", { name: guide.label })}</strong><small>{t("forms.guides.phases")}</small></span></summary>
      <div className="matter-account-guide-reader"><ProviderGuidePanel guide={guide} initialPart={preparing ? "now" : undefined}/></div>
    </details>)}
  </section>;
}
