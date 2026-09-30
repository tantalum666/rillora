import { suggestedAccountGuides } from "./officialProviderGuides.js";
import { ProviderGuidePanel } from "./TaskPanels.jsx";
import "./platform-guides.css";
import { ProviderMark } from "./ProviderMark.jsx";

export function MatterAccountGuides({ fields, preparing = false }) {
  const guides = suggestedAccountGuides(fields);
  if (!guides.length) return null;
  return <section className="matter-account-guides" aria-label="Account inheritance guidance">
    <p className="section-label">Account inheritance guidance</p>
    {guides.map(guide => <details key={guide.key} className="matter-account-guide">
      <summary><ProviderMark providerKey={guide.key}/><span><strong>{guide.label} guidance</strong><small>Prepare now · After a death</small></span></summary>
      <div className="matter-account-guide-reader"><ProviderGuidePanel guide={guide} initialPart={preparing ? "now" : undefined}/></div>
    </details>)}
  </section>;
}
