import { useMemo, useState } from "react";
import {
  ArchiveIcon,
  ArrowRightIcon,
  BackpackIcon,
  CardStackIcon,
  CheckCircledIcon,
  ChevronRightIcon,
  CodeIcon,
  DotsHorizontalIcon,
  FileTextIcon,
  HomeIcon,
  IdCardIcon,
  ImageIcon,
  InfoCircledIcon,
  LockClosedIcon,
  PersonIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import { BottomSheet, KeyboardInput, MobileScroll, useKeyboard } from "./mobile";

type Matter = {
  id: string;
  label: string;
  hint: string;
  status: "added" | "missing";
  icon: typeof IdCardIcon;
};

const initialMatters: Matter[] = [
  { id: "bank", label: "Bank account", hint: "Primary checking", status: "added", icon: IdCardIcon },
  { id: "photos", label: "Cloud photos", hint: "Personal archive", status: "added", icon: ImageIcon },
  { id: "github", label: "GitHub projects", hint: "Personal repositories", status: "added", icon: CodeIcon },
  { id: "insurance", label: "Insurance", hint: "Life and travel policies", status: "missing", icon: BackpackIcon },
  { id: "subscriptions", label: "Subscriptions", hint: "Recurring services", status: "missing", icon: CardStackIcon },
];

type SheetState =
  | { type: "matter"; id: string }
  | { type: "settings" }
  | { type: "contact" }
  | null;

const tabs = [
  { id: "overview", label: "Overview", icon: HomeIcon },
  { id: "matters", label: "Matters", icon: ArchiveIcon },
  { id: "more", label: "More", icon: DotsHorizontalIcon },
];

function Progress({ count }: { count: number }) {
  return (
    <section className="mobile-progress" aria-labelledby="mobile-progress-title">
      <p className="mobile-section-label">Your progress</p>
      <h2 id="mobile-progress-title">{count} of 5 essentials</h2>
      <div className="mobile-progress-track" role="img" aria-label={`${count} of 5 essentials completed`}>
        {[0, 1, 2, 3, 4].map((index) => <span key={index} className={index < count ? "complete" : ""} />)}
      </div>
      <p className="progress-note">{count === 5 ? "Your essentials are mapped." : `Keep going—${5 - count} more to go.`}</p>
    </section>
  );
}

function MatterRow({ matter, onOpen }: { matter: Matter; onOpen: () => void }) {
  const Icon = matter.icon;
  const added = matter.status === "added";
  return (
    <button className="mobile-matter-row" onClick={onOpen} aria-label={`Open ${matter.label}, ${added ? "added" : "not added"}`}>
      <span className="mobile-matter-icon"><Icon /></span>
      <span>{matter.label}</span>
      {added ? <CheckCircledIcon className="mobile-complete-icon" /> : <span className="mobile-missing-dot" aria-hidden="true" />}
      <ChevronRightIcon className="mobile-chevron" />
    </button>
  );
}

// Build app-specific screens and flows in this file. The surrounding mobile
// runtime is template-owned and intentionally lives outside this component.
export default function Prototype() {
  const [matters, setMatters] = useState(initialMatters);
  const [activeTab, setActiveTab] = useState("overview");
  const [sheet, setSheetState] = useState<SheetState>(null);
  const keyboard = useKeyboard();
  function setSheet(next: SheetState) {
    keyboard.hide();
    setSheetState(next);
  }
  const [checks, setChecks] = useState({ apple: false, google: false, github: true });
  const [confirmed, setConfirmed] = useState(true);
  const [toast, setToast] = useState("");
  const completed = useMemo(() => matters.filter((matter) => matter.status === "added").length, [matters]);
  const currentMatter = sheet?.type === "matter" ? matters.find((matter) => matter.id === sheet.id) : undefined;

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function openNext() {
    const next = matters.find((matter) => matter.status === "missing") ?? matters[0];
    setSheet({ type: "matter", id: next.id });
  }

  function saveMatter(id: string) {
    setMatters((items) => items.map((matter) => matter.id === id ? { ...matter, status: "added" } : matter));
    setSheet(null);
    notify("Matter added to your plan");
  }

  const overview = (
    <main className="mobile-content" data-testid="calm-continuity-overview">
      <header className="mobile-hero">
        <p className="mobile-eyebrow">Overview</p>
        <h1>Continue your plan</h1>
        <p>You’re building a practical map for the people you trust. Complete the next step to keep things clear and helpful.</p>
        <button className="mobile-primary" onClick={openNext}>Continue your plan <ArrowRightIcon /></button>
        <button className="mobile-text-action" onClick={() => setSheet({ type: "settings" })}>Review official settings <ChevronRightIcon /></button>
      </header>

      <Progress count={completed} />

      <section className="mobile-matters" aria-labelledby="mobile-matters-title">
        <p className="mobile-section-label" id="mobile-matters-title">Your matters</p>
        {matters.map((matter) => <MatterRow key={matter.id} matter={matter} onOpen={() => setSheet({ type: "matter", id: matter.id })} />)}
      </section>

      <section className="mobile-contact" aria-labelledby="mobile-contact-title">
        <p className="mobile-section-label">Trusted contact</p>
        <button className="mobile-contact-row" onClick={() => setSheet({ type: "contact" })}>
          <span className="mobile-avatar" aria-hidden="true">MC</span>
          <span className="mobile-contact-copy">
            <strong id="mobile-contact-title">Maya Chen</strong>
            <small><CheckCircledIcon /> {confirmed ? "Confirmed" : "Invite pending"}</small>
          </span>
          <ChevronRightIcon />
        </button>
      </section>
    </main>
  );

  const secondaryTitles: Record<string, [string, string]> = {
    matters: ["Your matters", "Everything important, with directions instead of passwords."],
    more: ["More", "Plan tools, people and guidance in one place."],
  };

  const secondary = (
    <main className="mobile-content mobile-secondary">
      <p className="mobile-eyebrow">Your plan</p>
      <h1>{secondaryTitles[activeTab]?.[0]}</h1>
      <p className="secondary-copy">{secondaryTitles[activeTab]?.[1]}</p>
      {activeTab === "matters" && <section className="mobile-matters secondary-matters">{matters.map((matter) => <MatterRow key={matter.id} matter={matter} onOpen={() => setSheet({ type: "matter", id: matter.id })} />)}</section>}
      {activeTab === "more" && <section className="mobile-guide-card"><button onClick={openNext}><FileTextIcon /><span><strong>My plan</strong><small>{completed} of 5 essentials · continue next step</small></span><ChevronRightIcon /></button><button onClick={() => setSheet({ type: "contact" })}><PersonIcon /><span><strong>Trusted contact</strong><small>Maya Chen · {confirmed ? "Confirmed" : "Pending"}</small></span><ChevronRightIcon /></button><button onClick={() => setSheet({ type: "settings" })}><LockClosedIcon /><span><strong>Official guides</strong><small>3 provider settings to review</small></span><ChevronRightIcon /></button><button onClick={() => notify("Simulation mode is clearly labeled and local only")}><ReaderIcon /><span><strong>Simulation</strong><small>Preview only · no notification sent</small></span><ChevronRightIcon /></button></section>}
    </main>
  );

  return (
    <div className="legacy-mobile-app">
      <MobileScroll className="legacy-scroll">
        {activeTab === "overview" ? overview : secondary}
      </MobileScroll>

      <nav className="mobile-tab-bar" aria-label="Main navigation">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {currentMatter && (
        <BottomSheet open={Boolean(sheet)} onOpenChange={(open) => !open && setSheet(null)} title={currentMatter.label} description="Add a safe location and an intended outcome—never a password." snap={0.69}>
          <div className="legacy-sheet-form" onBlurCapture={(event) => {
            if (!(event.relatedTarget instanceof HTMLElement)
              || !event.relatedTarget.matches('[data-rillora-keyboard-input]')) keyboard.hide();
          }}>
            <label>Account or policy hint<KeyboardInput data-rillora-keyboard-input defaultValue={currentMatter.hint} /></label>
            <label>Safe location hint<KeyboardInput data-rillora-keyboard-input defaultValue={currentMatter.status === "added" ? "Documents · Personal plan" : ""} placeholder="Where can this be found?" /></label>
            <div className="sheet-safety"><InfoCircledIcon /> Directions only. Do not add passwords, recovery codes or seed phrases.</div>
            <button className="mobile-primary sheet-primary" onMouseDown={(event) => event.preventDefault()} onClick={() => saveMatter(currentMatter.id)}>{currentMatter.status === "added" ? "Save changes" : "Add to my plan"} <ArrowRightIcon /></button>
          </div>
        </BottomSheet>
      )}

      {sheet?.type === "settings" && (
        <BottomSheet open onOpenChange={(open) => !open && setSheet(null)} title="Official settings" description="A simulated checklist. Changes happen only on each provider’s official site." snap={0.7}>
          <div className="mobile-check-list">
            {([
              ["apple", "Apple Legacy Contact"],
              ["google", "Google Inactive Account Manager"],
              ["github", "GitHub successor"],
            ] as const).map(([id, label]) => <label key={id}><span>{label}</span><input type="checkbox" checked={checks[id]} onChange={() => setChecks((value) => ({ ...value, [id]: !value[id] }))} /></label>)}
          </div>
          <button className="mobile-primary sheet-primary" onClick={() => { setSheet(null); notify("Official settings review saved"); }}>Save review <CheckCircledIcon /></button>
        </BottomSheet>
      )}

      {sheet?.type === "contact" && (
        <BottomSheet open onOpenChange={(open) => !open && setSheet(null)} title="Maya Chen" description="Trusted contact" snap={0.58}>
          <div className="sheet-contact-card"><span className="mobile-avatar">MC</span><span><strong>Maya Chen</strong><small><CheckCircledIcon /> {confirmed ? "Confirmed" : "Invite pending"}</small></span></div>
          <p className="sheet-contact-note">This role helps your people find directions. It does not automatically grant account access, legal authority or ownership.</p>
          <button className="mobile-outline" onClick={() => { setConfirmed((value) => !value); notify(confirmed ? "Invitation moved to pending" : "Contact marked confirmed"); }}>{confirmed ? "Resend invitation" : "Simulate confirmation"}</button>
          <button className="mobile-primary sheet-primary" onClick={() => setSheet(null)}>Done <CheckCircledIcon /></button>
        </BottomSheet>
      )}

      {toast && <div className="mobile-toast" role="status"><CheckCircledIcon /> {toast}</div>}
    </div>
  );
}
