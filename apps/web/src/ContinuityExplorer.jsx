import { useState } from "react";
import { ArrowRight, FileText, GitBranch, Users, IdentificationCard, Devices, DotsThreeCircle, CaretDown } from "@phosphor-icons/react";
import mapArtwork from "./assets/continuity-map.png";
import "./continuity-explorer.css";

const topics = [
  { id: "what", label: "What", title: "What exists", icon: FileText, tilt: 0, description: "Keep important accounts, documents and directions together." },
  { id: "next", label: "Next step", title: "What happens", icon: GitBranch, tilt: -8, description: "Your wishes: keep, transfer or close." },
  { id: "who", label: "Who", title: "Who can help", icon: Users, tilt: 8, description: "Invite by link. They use their own account and see only what you share." },
];

export function ContinuityExplorer() {
  const [selected, setSelected] = useState("what");
  const topic = topics.find((item) => item.id === selected);
  return (
    <div className="continuity-explorer" data-focus={selected} style={{ "--map-tilt": `${topic.tilt}deg` }}>
      <div className="continuity-scene" aria-hidden="true">
        <svg className="continuity-connections" viewBox="0 0 380 240" fill="none" aria-hidden="true">
          <path data-active={selected === "what"} d="M190 155 Q190 50 190 30" />
          <path data-active={selected === "next"} d="M190 155 Q38 55 38 158" />
          <path data-active={selected === "who"} d="M190 155 Q342 55 342 158" />
        </svg>
        <img className="continuity-map" src={mapArtwork} alt="" width="1254" height="1254" fetchPriority="high" />
        {topics.map(({ id, title, icon: Icon }) => (
          <button key={id} type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} aria-label={`Explore ${title.toLowerCase()}`} aria-pressed={selected === id} className={`continuity-node node-${id}`} data-active={selected === id} onClick={() => setSelected(id)}>
            <Icon size={27} weight="fill" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="continuity-selector" role="group" aria-label="Explore how your map works">
        {topics.map(({ id, label, title, icon: Icon }) => (
          <button key={id} type="button" aria-label={title} aria-pressed={selected === id} onClick={() => setSelected(id)}>
            <Icon size={18} weight="fill" aria-hidden="true" /><span>{label}</span>
          </button>
        ))}
      </div>
      <p className="continuity-explanation" aria-live="polite" aria-atomic="true">{topic.description}</p>
    </div>
  );
}

const groups = [
  { id: "account", title: "Accounts", icon: IdentificationCard, detail: "Service · Safe hint · Next step", action: "Add an account" },
  { id: "document", title: "Documents", icon: FileText, detail: "Document · Location · Who needs it", action: "Add a document" },
  { id: "device", title: "Devices", icon: Devices, detail: "Device · Location · Official access route", action: "Add a device" },
  { id: "financial_asset", title: "Other matters", icon: DotsThreeCircle, detail: "Assets · Debts · Subscriptions", action: "Add a matter" },
];

export function PublicMatterExplorer({ onStart }) {
  const [expanded, setExpanded] = useState("account");
  return (
    <section className="public-matter-explorer" id="explore-matters" tabIndex={-1} aria-labelledby="explore-matters-title">
      <div>
        <p className="architectural-kicker">Explore matters</p>
        <h2 id="explore-matters-title">What would you like to organise?</h2>
      </div>
      <div className="public-matter-categories">
        {groups.map(({ id, title, icon: Icon, detail, action }) => (
          <article className="public-matter-category" key={id} data-expanded={expanded === id}>
            <button type="button" aria-expanded={expanded === id} aria-controls={`matter-guidance-${id}`} onClick={() => setExpanded(expanded === id ? null : id)}>
              <Icon size={24} aria-hidden="true" /><strong>{title}</strong><CaretDown size={17} aria-hidden="true" />
            </button>
            <div className="public-matter-guidance" id={`matter-guidance-${id}`} hidden={expanded !== id}>
              <p>{detail}</p>
              <button type="button" onClick={() => onStart(id)}>{action}<ArrowRight size={20} aria-hidden="true" /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
