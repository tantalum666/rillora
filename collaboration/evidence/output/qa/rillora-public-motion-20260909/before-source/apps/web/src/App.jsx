import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AddressBook,
  ArrowRight,
  Bank,
  BookOpen,
  CaretRight,
  Check,
  CheckCircle,
  ClipboardText,
  Cloud,
  Compass,
  Code,
  CreditCard,
  DotsThreeCircle,
  FileText,
  GearSix,
  House,
  Info,
  Leaf,
  LockKey,
  Pulse,
  Shield,
  SignOut,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import { ApiClientError, api } from "./api.js";
import { getTrustedContactEvidence } from "./contactEvidence.js";
import { StartHerePanel } from "./StartHerePanel.jsx";
import { DisclosureRehearsalPanel } from "./DisclosureRehearsalPanel.jsx";
import { RoleAssignmentPolicyPanel } from "./RoleAssignmentPolicyPanel.jsx";
import { PublicExperience } from "./PublicExperience.jsx";
import { publicRoutes } from "./publicRoutes.js";
import { FirstUseGuide, FirstUseStarter } from "./FirstUsePanel.jsx";
import { firstUseStates, normalizeFirstUse } from "./firstUse.js";
import {
  formatMoneyMinor,
  unavailableCommercialStatus,
} from "./commercialAccess.js";
import {
  isMobilePrimaryActive,
  mobileMoreDestinationDefinitions,
  mobilePrimaryNavigation,
} from "./mobileNavigation.js";
import {
  getOfficialProviderGuide,
  officialProviderGuides,
  selfReportedProviderKeys,
} from "./officialProviderGuides.js";
import githubInvertocat from "./assets/official-brands/github-invertocat-white.svg";
import xLogo from "./assets/official-brands/x-logo-white.png";

const officialProviderMarks = {
  github: githubInvertocat,
  x: xLogo,
};

function ProviderMark({ providerKey, label }) {
  const asset = officialProviderMarks[providerKey];
  return (
    <span className={`provider-mark${asset ? " is-official" : ""}`} aria-hidden="true">
      {asset ? <img src={asset} alt="" /> : <LockKey size={19} />}
      <span className="sr-only">{label}</span>
    </span>
  );
}

const navigation = [
  { id: "overview", label: "Overview", icon: House },
  { id: "plan", label: "My plan", icon: ClipboardText },
  { id: "matters", label: "Matters", icon: AddressBook },
  { id: "contacts", label: "Trusted contacts", icon: UserCircle },
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "access", label: "Plan & access", icon: CreditCard },
  { id: "activity", label: "Activity", icon: Pulse },
];

const mobileNavigationIcons = {
  overview: House,
  matters: AddressBook,
  more: DotsThreeCircle,
};

const mobileMoreDestinationIcons = {
  access: CreditCard,
  plan: ClipboardText,
  contacts: UserCircle,
  guides: BookOpen,
  activity: Pulse,
  settings: GearSix,
};

const mobileNavigation = mobilePrimaryNavigation.map((item) => ({
  ...item,
  icon: mobileNavigationIcons[item.id],
}));

const mobileMoreDestinations = mobileMoreDestinationDefinitions.map((item) => ({
  ...item,
  icon: mobileMoreDestinationIcons[item.id],
}));

const officialCheckDefinitions = officialProviderGuides.filter((guide) => (
  selfReportedProviderKeys.includes(guide.key)
));

const titleIcons = {
  "Bank account": Bank,
  "Cloud photos": Cloud,
  "GitHub projects": Code,
  Insurance: Shield,
  Subscriptions: CreditCard,
};

const categoryIcons = {
  financial_asset: Bank,
  debt: CreditCard,
  account: Cloud,
  device: LockKey,
  document: FileText,
  subscription: CreditCard,
  crypto_asset: LockKey,
};

const outcomeOptions = [
  { value: "undecided", label: "Decide later" },
  { value: "notify", label: "Provide official guidance" },
  { value: "close", label: "Request account closure" },
  { value: "transfer_request", label: "Preserve or request transfer" },
  { value: "delete_request", label: "Request deletion" },
  { value: "never_disclose", label: "Never disclose" },
];

const matterCategoryOptions = [
  { value: "financial_asset", label: "Financial asset" },
  { value: "debt", label: "Debt" },
  { value: "account", label: "Online account" },
  { value: "device", label: "Device" },
  { value: "document", label: "Document" },
  { value: "subscription", label: "Subscription" },
  { value: "crypto_asset", label: "Crypto asset" },
];

function MatterIcon({ matter }) {
  const Icon = matter.icon;
  return <span className="matter-icon" aria-hidden="true"><Icon size={21} weight="regular" /></span>;
}

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

function ProgressSummary({ count, total = 5 }) {
  return (
    <section className="progress-section" aria-labelledby="progress-heading">
      <SectionLabel>Your progress</SectionLabel>
      <h2 id="progress-heading">{count} of {total} essentials</h2>
      <div className="progress-track" aria-label={`${count} of ${total} essentials completed`} role="img">
        {Array.from({ length: total }, (_, segment) => (
          <span key={segment} className={segment < count ? "is-complete" : ""} />
        ))}
      </div>
      <p>{count === total ? "Your essentials are mapped. Review them regularly." : `Keep going—${total - count} more to go.`}</p>
    </section>
  );
}

function CommercialFeatureList({ features }) {
  return <ul className="commercial-feature-list">{features.map((feature) => <li key={feature}><CheckCircle size={18} weight="fill" aria-hidden="true" /><span>{feature}</span></li>)}</ul>;
}

function PlanAccessPreview({ commerce }) {
  if (!commerce.available) {
    return (
      <section className="current-access-card" aria-labelledby="current-access-title">
        <div><SectionLabel>Plan & access</SectionLabel><h2 id="current-access-title">Temporarily unavailable</h2></div>
        <p>Core planning remains available. Purchase options stay hidden until Rillora can verify the current plan and market policy.</p>
      </section>
    );
  }

  const annualOffer = commerce.offers.find(({ billingInterval }) => billingInterval === "annual");
  const monthlyOffer = commerce.offers.find(({ billingInterval }) => billingInterval === "monthly");
  return (
    <div className="plan-access-preview">
      <section className="current-access-card" aria-labelledby="current-access-title">
        <div><SectionLabel>Current access</SectionLabel><h2 id="current-access-title">{commerce.currentAccessLabel}</h2></div>
        <p>Core planning remains available without a subscription.</p>
      </section>

      <div className="access-plan-grid">
        <section className="access-plan-card" aria-labelledby="free-access-title">
          <p className="access-plan-label">Always included</p>
          <h2 id="free-access-title">Rillora Free</h2>
          <CommercialFeatureList features={commerce.freeFeatures.slice(0, 6)} />
        </section>
        <section className="access-plan-card is-family" aria-labelledby="family-access-title">
          <p className="access-plan-label">One planned paid tier</p>
          <h2 id="family-access-title">Planned Rillora Family</h2>
          {(annualOffer || monthlyOffer) && (
            <p className="access-plan-price">
              {annualOffer && <strong>{formatOffer(annualOffer)}</strong>}
              {annualOffer && monthlyOffer ? " or " : ""}
              {monthlyOffer && formatOffer(monthlyOffer)}
            </p>
          )}
          <CommercialFeatureList features={commerce.familyFeatures.slice(0, 6)} />
          <p className="access-plan-note">Billing is not open. This build cannot start a purchase or trial.</p>
        </section>
      </div>

      <section className="safe-downgrade-note">
        <Info size={20} aria-hidden="true" />
        <p><strong>If Family ends, your core plan remains yours.</strong><span>Core text records stay readable and exportable, basic recipient retrieval remains available, and billing state never triggers death, incapacity, unreachable or disclosure workflows.</span></p>
      </section>
    </div>
  );
}

function formatOffer(offer) {
  const interval = offer.billingInterval === "annual" ? "year" : "month";
  return `${formatMoneyMinor(
    offer.amountMinor,
    offer.currencyCode,
    offer.minorUnitExponent,
  )}/${interval}`;
}

function MatterRow({ matter, onOpen }) {
  const added = matter.status === "added";
  return (
    <button className="matter-row" onClick={() => onOpen(matter)} aria-label={`Open ${matter.label}, ${added ? "added" : "not added"}`}>
      <MatterIcon matter={matter} />
      <span className="matter-name">{matter.label}</span>
      <span className={`matter-status ${added ? "is-added" : "is-missing"}`}>
        {added ? <CheckCircle size={18} weight="fill" /> : <span className="missing-dot" aria-hidden="true" />}
        {added ? "Added" : "Not added"}
      </span>
      <CaretRight size={17} aria-hidden="true" />
    </button>
  );
}

function Drawer({ title, eyebrow, onClose, closeLabel = "Close panel", children }) {
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button drawer-close" onClick={onClose} aria-label={closeLabel}><X size={20} /></button>
        <SectionLabel>{eyebrow}</SectionLabel>
        <h2 id="drawer-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

function ContactEvidence({ contact }) {
  const evidence = getTrustedContactEvidence(contact);
  const Icon = evidence.accepted ? CheckCircle : Info;
  return <p className="contact-evidence"><Icon size={17} weight={evidence.accepted ? "fill" : "regular"} /> {evidence.label}</p>;
}

export function App() {
  const initialPublicPath = window.location.pathname.length > 1
    ? window.location.pathname.replace(/\/+$/, "")
    : window.location.pathname;
  const startsOnPublicLegalRoute = [
    publicRoutes.privacy,
    publicRoutes.terms,
    publicRoutes.subscriptions,
    publicRoutes.refunds,
    publicRoutes.acceptableUse,
    publicRoutes.cookies,
    publicRoutes.legalNotice,
  ].includes(initialPublicPath);
  const [activeNav, setActiveNav] = useState(() => window.location.pathname === "/account" ? "settings" : "overview");
  const [matters, setMatters] = useState([]);
  const [plan, setPlan] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [checks, setChecks] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [session, setSession] = useState(null);
  const [commerce, setCommerce] = useState(() => unavailableCommercialStatus());
  const [drawer, setDrawer] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef(null);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const status = await api.getSessionStatus();
      if (status?.authenticated !== true) {
        setSession(null);
        setLoadError(new ApiClientError(
          401,
          "authentication_required",
          "Authentication is required.",
          null,
        ));
        return;
      }
      const sessionResponse = await api.getSession();
      const commerceRequest = api.getCommerceStatus(
        import.meta.env.VITE_RILLORA_SERVICE_MARKET_CODE ?? "GLOBAL_US",
      ).catch(() => unavailableCommercialStatus());
      const [planResponse, matterResponse, contactResponse, checkResponse, , auditResponse, commerceResponse] = await Promise.all([
        api.getPlan(),
        api.getMatters(),
        api.getTrustedContacts(),
        api.getOfficialSetupChecks(),
        api.getReadiness(),
        api.getAuditEvents(),
        commerceRequest,
      ]);
      if (!planResponse.plan) throw new Error("The plan response was incomplete");
      setSession(sessionResponse);
      setPlan(planResponse.plan);
      setMatters(matterResponse.matters.map(mapMatter));
      setContacts(contactResponse.trustedContacts);
      setChecks(checkResponse.officialSetupChecks.map((check) => ({
        ...check,
        serverCompleted: check.completed,
      })));
      setAuditEvents(auditResponse.auditEvents);
      setCommerce(commerceResponse);
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!startsOnPublicLegalRoute) void loadWorkspace();
    else setLoading(false);
    return () => window.clearTimeout(toastTimer.current);
  }, [loadWorkspace, startsOnPublicLegalRoute]);

  const completed = useMemo(() => matters.filter((matter) => matter.status === "added").length, [matters]);
  const currentMatter = drawer?.type === "matter" ? matters.find((matter) => matter.id === drawer.id) : null;
  const currentProviderGuide = drawer?.type === "provider-guide"
    ? getOfficialProviderGuide(drawer.providerKey)
    : null;
  const contact = contacts[0] ?? null;
  const contactEvidence = getTrustedContactEvidence(contact);
  const contactInitials = getInitials(contact?.displayName ?? "Trusted contact");

  function notify(message) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2_600);
  }

  function openMatter(matter) {
    setDrawer({
      type: "matter",
      id: matter.id,
      institution: matter.institution,
      location: matter.location,
      desiredOutcome: matter.desiredOutcome === "undecided" ? "notify" : matter.desiredOutcome,
    });
  }

  function openNewMatter(seed = {}) {
    setDrawer({
      type: "matter-create",
      title: seed.title ?? "",
      category: seed.category ?? "account",
      institution: seed.institution ?? "",
      location: seed.location ?? "",
      desiredOutcome: seed.desiredOutcome ?? "undecided",
      status: seed.status ?? "draft",
    });
  }

  function updateNewMatterDraft(field, value) {
    setDrawer((current) => current?.type === "matter-create" ? { ...current, [field]: value } : current);
  }

  async function saveNewMatter() {
    if (drawer?.type !== "matter-create" || !drawer.title.trim()) return;
    setBusy(true);
    try {
      const response = await api.createMatter({
        category: drawer.category,
        title: drawer.title.trim(),
        institutionName: drawer.institution.trim() || null,
        accountHint: null,
        valueBand: "unknown",
        currencyCode: null,
        locationHint: drawer.location.trim() || null,
        importance: "important",
        desiredOutcome: drawer.desiredOutcome,
        status: drawer.status,
      });
      const [planResponse, auditResponse] = await Promise.all([
        api.getPlan(),
        api.getAuditEvents(),
      ]);
      setPlan(planResponse.plan);
      setMatters((items) => [...items, mapMatter(response.matter)]);
      setAuditEvents(auditResponse.auditEvents);
      setDrawer(null);
      notify("Your first matter is on the map");
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setBusy(false);
    }
  }

  async function updateFirstUse({ state, step, motivation }) {
    if (!plan) return null;
    setBusy(true);
    try {
      const response = await api.updatePlan({
        expectedVersion: plan.version,
        ...(motivation ? { motivation } : {}),
        firstUseState: state,
        firstUseStep: step,
      });
      setPlan(response.plan);
      return response.plan;
    } catch (error) {
      await handleMutationError(error);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function openFirstUseGuide() {
    if (!plan) return;
    const progress = normalizeFirstUse(plan);
    const step = Math.max(1, progress.step);
    const updated = progress.state === firstUseStates.guideInProgress
      ? plan
      : await updateFirstUse({ state: firstUseStates.guideInProgress, step });
    if (!updated) return;
    setDrawer({
      type: "first-use-guide",
      step: Math.max(1, updated.firstUseStep),
      motivation: updated.motivation ?? "",
    });
  }

  async function advanceFirstUseGuide(motivation) {
    const updated = await updateFirstUse({
      state: firstUseStates.guideInProgress,
      step: 2,
      motivation,
    });
    if (!updated) return;
    setDrawer({ type: "first-use-guide", step: 2, motivation: updated.motivation ?? "" });
  }

  async function pauseFirstUse(step = normalizeFirstUse(plan).step) {
    const updated = await updateFirstUse({
      state: firstUseStates.guidePaused,
      step: Math.max(0, step),
    });
    if (updated) setDrawer(null);
  }

  function updateMatterDraft(field, value) {
    setDrawer((current) => current?.type === "matter" ? { ...current, [field]: value } : current);
  }

  function openRolePolicyForCurrentMatter() {
    if (!currentMatter || drawer?.type !== "matter") return;
    const hasUnsavedChanges = drawer.institution !== currentMatter.institution
      || drawer.location !== currentMatter.location
      || drawer.desiredOutcome !== (currentMatter.desiredOutcome === "undecided" ? "notify" : currentMatter.desiredOutcome);
    if (hasUnsavedChanges && !window.confirm("Discard unsaved matter changes and review role coverage?")) return;
    setDrawer({ type: "role-policy", matterId: currentMatter.id });
  }

  async function saveMatter() {
    if (!currentMatter || drawer?.type !== "matter") return;
    setBusy(true);
    try {
      const response = await api.updateMatter(currentMatter.id, {
        expectedVersion: currentMatter.version,
        institutionName: drawer.institution.trim() || null,
        locationHint: drawer.location.trim() || null,
        desiredOutcome: drawer.desiredOutcome,
        status: "ready",
      });
      setMatters((items) => items.map((matter) => matter.id === currentMatter.id ? mapMatter(response.matter) : matter));
      setDrawer(null);
      notify(currentMatter.status === "added" ? "Matter changes saved" : "Matter added to your plan");
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setBusy(false);
    }
  }

  function openNextMatter() {
    const next = matters.find((matter) => matter.status !== "added") ?? matters[0];
    if (next) openMatter(next);
  }

  function toggleCheck(publicId) {
    setChecks((items) => items.map((check) => check.publicId === publicId ? { ...check, completed: !check.completed } : check));
  }

  async function saveOfficialChecks() {
    setBusy(true);
    try {
      const changed = checks.filter((check) => check.completed !== check.serverCompleted);
      const updated = await Promise.all(changed.map((check) => api.updateOfficialSetupCheck(check.publicId, {
        expectedVersion: check.version,
        completed: check.completed,
      })));
      const replacements = new Map(updated.map((response) => [response.officialSetupCheck.publicId, response.officialSetupCheck]));
      setChecks((items) => items.map((check) => {
        const replacement = replacements.get(check.publicId);
        return replacement ? { ...replacement, serverCompleted: replacement.completed } : check;
      }));
      setDrawer(null);
      notify(changed.length ? "Official settings review saved" : "No checklist changes to save");
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleMutationError(error) {
    if (error instanceof ApiClientError && error.code === "version_conflict") {
      await loadWorkspace();
      setDrawer(null);
      notify("This plan changed elsewhere. We refreshed the latest version.");
      return;
    }
    notify(error instanceof ApiClientError ? error.message : "The change could not be saved.");
  }

  async function signOut() {
    setBusy(true);
    try {
      await api.logout();
      window.location.assign("/");
    } catch (error) {
      notify(error instanceof ApiClientError ? error.message : "Sign out could not be completed.");
      setBusy(false);
    }
  }

  async function signOutAllDevices() {
    const confirmed = window.confirm(
      "Sign out every active Rillora app session? This does not revoke sessions at your identity provider.",
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await api.logoutAll();
      window.location.assign("/");
    } catch (error) {
      notify(error instanceof ApiClientError ? error.message : "Active sessions could not be revoked.");
      setBusy(false);
    }
  }

  async function handleStartHereGenerated(message) {
    try {
      const response = await api.getAuditEvents();
      setAuditEvents(response.auditEvents);
    } catch {
      // The file has already been created locally; an activity refresh must not misreport failure.
    }
    notify(message);
  }

  function showOverview() {
    const hasMatters = matters.length > 0;
    return (
      <>
        <header className="hero">
          <SectionLabel>Overview</SectionLabel>
          <h1>{hasMatters ? "Continue your plan" : "Start your private map"}</h1>
          <p className="hero-copy">Your overview is ready to use. Build a practical map for the people you trust,<br className="wide-only" /> one matter at a time and without storing a password.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={hasMatters ? openNextMatter : () => openNewMatter()} disabled={busy}>{hasMatters ? "Continue your plan" : "Add your first matter"} <ArrowRight size={21} /></button>
            <button className="text-button" onClick={() => setDrawer({ type: "settings" })}>Review official settings <CaretRight size={18} /></button>
          </div>
        </header>

        <FirstUseStarter
          plan={plan}
          busy={busy}
          onAddMatter={() => openNewMatter()}
          onOpenGuide={() => void openFirstUseGuide()}
          onPause={() => void pauseFirstUse(normalizeFirstUse(plan).step)}
        />

        <ProgressSummary count={completed} total={Math.max(matters.length, 5)} />

        <div className="overview-grid">
          <section className="matters-section" aria-labelledby="matters-heading">
            <SectionLabel>Your matters</SectionLabel>
            <h2 id="matters-heading" className="sr-only">Your matters</h2>
            {matters.length ? <div className="matter-list">{matters.map((matter) => <MatterRow key={matter.id} matter={matter} onOpen={openMatter} />)}</div> : <div className="matter-empty"><FileText size={23} aria-hidden="true" /><p><strong>No matters yet</strong><span>Add one when you are ready. The rest of Rillora remains available.</span></p></div>}
          </section>

          <section className="trusted-card" aria-labelledby="trusted-heading">
            <SectionLabel>Trusted contact</SectionLabel>
            <div className="contact-heading">
              <span className="avatar" aria-hidden="true">{contactInitials}</span>
              <div>
                <h2 id="trusted-heading">{contact?.displayName ?? "No contact yet"}</h2>
                <ContactEvidence contact={contact} />
              </div>
            </div>
            <p>{contactEvidence.simulated ? "Local fixture only. " : "Record only. "}No access, ownership, recovery rights or legal authority.</p>
            <button className="text-button contact-action" onClick={() => setDrawer({ type: "contact" })}>Manage trusted contact <CaretRight size={18} /></button>
          </section>
        </div>
      </>
    );
  }

  function showSection() {
    const meta = {
      plan: ["My plan", "A clear path from first item to a shareable Start Here package."],
      matters: ["Your matters", "Keep important accounts, obligations and documents easy to locate."],
      contacts: ["Trusted contacts", "Choose people for notification and support without granting automatic ownership."],
      guides: ["Official guides", "Review each provider’s current process before anyone needs it."],
      access: ["Plan & access", "See what stays free and what Family adds over time."],
      activity: ["Plan activity", "A private record of the changes you make to this plan."],
      settings: ["Settings", "Manage optional setup and Rillora account sessions."],
      more: ["More", "Plan tools, people, guidance and account settings."],
    }[activeNav];

    return (
      <section className="secondary-view">
        <SectionLabel>{activeNav === "activity" ? "Private audit" : "Your plan"}</SectionLabel>
        <h1>{meta[0]}</h1>
        <p className="hero-copy">{meta[1]}</p>
        {activeNav === "matters" && <div className="matter-list secondary-list">{matters.map((matter) => <MatterRow key={matter.id} matter={matter} onOpen={openMatter} />)}</div>}
        {activeNav === "plan" && <div className="plan-card"><ProgressSummary count={completed} total={Math.max(matters.length, 5)} /><button className="primary-button" onClick={matters.length ? openNextMatter : () => openNewMatter()}>{matters.length ? "Continue next step" : "Add your first matter"} <ArrowRight size={20} /></button><button className="secondary-button" onClick={() => setDrawer({ type: "role-policy", matterId: null })}>Review role coverage <UserCircle size={20} /></button><button className="secondary-button" onClick={() => setDrawer({ type: "start-here" })}>Review Start Here guide <FileText size={20} /></button><button className="secondary-button" onClick={() => setDrawer({ type: "disclosure-rehearsal" })}>Rehearse role disclosure <Shield size={20} /></button><p className="drawer-intro">Record-only roles. No live enrollment, claims or release.</p></div>}
        {activeNav === "contacts" && <div className="plan-card"><div className="contact-heading"><span className="avatar">{contactInitials}</span><div><h2>{contact?.displayName ?? "No contact yet"}</h2><ContactEvidence contact={contact} /></div></div><button className="text-button" onClick={() => setDrawer({ type: "contact" })}>Manage contact <CaretRight size={18} /></button></div>}
        {activeNav === "guides" && <div className="guide-list">{officialProviderGuides.map((item) => <button key={item.key} className="guide-row" onClick={() => setDrawer({ type: "provider-guide", providerKey: item.key })}><ProviderMark providerKey={item.key} label={item.label} /><span><strong>{item.label}</strong><small>{item.detail}</small></span><CaretRight size={17} /></button>)}</div>}
        {activeNav === "access" && <PlanAccessPreview commerce={commerce} />}
        {activeNav === "activity" && <div className="activity-list">{auditEvents.length ? auditEvents.map((event) => <p key={event.publicId}><Check size={17} /> {formatAuditAction(event.action)} <span>{formatDate(event.occurredAt)}</span></p>) : <p>No recorded plan changes yet.</p>}</div>}
        {activeNav === "settings" && <div className="plan-card settings-card">{plan?.firstUseState !== firstUseStates.completed && <button className="secondary-button settings-setup" disabled={busy} onClick={() => void openFirstUseGuide()}><Compass size={20} /> {normalizeFirstUse(plan).step > 0 ? "Resume optional setup" : "Open optional setup"}</button>}<button className="secondary-button" type="button" onClick={() => setActiveNav("access")}><CreditCard size={20} /> Review plan & access</button>{session?.authenticationMode === "session" && <><button className="secondary-button settings-sign-out" disabled={busy} onClick={() => void signOut()}><SignOut size={20} /> {busy ? "Signing out…" : "Sign out"}</button><button className="secondary-button settings-sign-out" disabled={busy} onClick={() => void signOutAllDevices()}><SignOut size={20} /> Sign out all Rillora devices</button><p className="drawer-intro">Revokes Rillora sessions only.</p></>}</div>}
        {activeNav === "more" && <nav className="mobile-more-menu" aria-label="More destinations">{mobileMoreDestinations.map(({ id, label, detail, icon: Icon }) => <button type="button" key={id} onClick={() => setActiveNav(id)}><Icon size={22} aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span><CaretRight size={18} aria-hidden="true" /></button>)}</nav>}
      </section>
    );
  }

  if (startsOnPublicLegalRoute) {
    return <PublicExperience sessionStatus="signed_out" onRetry={() => void loadWorkspace()} />;
  }

  if (loading || loadError) {
    const signedOut = loadError instanceof ApiClientError && loadError.status === 401;
    return (
      <PublicExperience
        sessionStatus={loading ? "checking" : signedOut ? "signed_out" : "unavailable"}
        onRetry={() => void loadWorkspace()}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <nav>{navigation.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={activeNav === id ? "active" : ""} aria-current={activeNav === id ? "page" : undefined} onClick={() => setActiveNav(id)}><Icon size={23} weight="regular" aria-hidden="true" /> <span>{label}</span></button>)}</nav>
        <div className="sidebar-spacer" />
        <section className="safety-note"><Leaf size={27} /><strong>Directions, not passwords.</strong><p>Practical guidance for your people, when they need it.</p><button onClick={() => notify("Safety guide ready for review")}>Learn more</button></section>
        {session?.authenticationMode === "session" && <button type="button" className="sign-out-nav" disabled={busy} onClick={() => void signOut()}><SignOut size={23} aria-hidden="true" /> <span>Sign out</span></button>}
        <button type="button" className={`settings-nav ${activeNav === "settings" ? "active" : ""}`} aria-current={activeNav === "settings" ? "page" : undefined} onClick={() => setActiveNav("settings")}><GearSix size={23} aria-hidden="true" /> <span>Settings</span></button>
      </aside>

      <main className="main-content">{activeNav === "overview" ? showOverview() : showSection()}</main>

      <nav className="mobile-navigation" aria-label="Mobile primary navigation">
        {mobileNavigation.map(({ id, label, icon: Icon }) => {
          const isActive = isMobilePrimaryActive(id, activeNav);
          return (
            <button
              type="button"
              key={id}
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActiveNav(id)}
            >
              <Icon size={22} weight="regular" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {drawer?.type === "first-use-guide" && (
        <Drawer
          title={drawer.step === 1 ? "Optional setup" : "Your first matter"}
          eyebrow="Two-minute guide"
          closeLabel="Save and exit guide"
          onClose={() => void pauseFirstUse(drawer.step)}
        >
          <FirstUseGuide
            step={drawer.step}
            motivation={drawer.motivation}
            onMotivationChange={(motivation) => setDrawer((current) => current?.type === "first-use-guide" ? { ...current, motivation } : current)}
            busy={busy}
            onContinue={() => void advanceFirstUseGuide(drawer.motivation)}
            onSkipQuestion={() => void advanceFirstUseGuide()}
            onAddMatter={() => openNewMatter()}
            onSaveAndExit={() => void pauseFirstUse(drawer.step)}
          />
        </Drawer>
      )}

      {drawer?.type === "matter-create" && (
        <Drawer title="Add a matter" eyebrow="Your private map" onClose={() => setDrawer(null)}>
          <p className="drawer-intro">Add one useful locator—never a password or transfer-capable secret.</p>
          <label className="field-label">Matter name<input autoFocus value={drawer.title} maxLength={120} onChange={(event) => updateNewMatterDraft("title", event.target.value)} /></label>
          <label className="field-label">Category<select value={drawer.category} onChange={(event) => updateNewMatterDraft("category", event.target.value)}>{matterCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="field-label">Institution or provider — optional<input value={drawer.institution} maxLength={160} onChange={(event) => updateNewMatterDraft("institution", event.target.value)} /></label>
          <label className="field-label">Safe location hint — optional<input value={drawer.location} maxLength={500} onChange={(event) => updateNewMatterDraft("location", event.target.value)} /></label>
          <label className="field-label">Preferred outcome<select value={drawer.desiredOutcome} onChange={(event) => updateNewMatterDraft("desiredOutcome", event.target.value)}>{outcomeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="field-label">Preparation status<select value={drawer.status} onChange={(event) => updateNewMatterDraft("status", event.target.value)}><option value="draft">Draft — return later</option><option value="ready">Directions added</option></select></label>
          <div className="drawer-safety"><Info size={19} /> Directions only—never add a bank password, recovery code or seed phrase.</div>
          <button className="primary-button drawer-primary" type="button" disabled={busy || !drawer.title.trim()} onClick={() => void saveNewMatter()}>{busy ? "Saving…" : "Add to my map"} {!busy && <ArrowRight size={20} />}</button>
        </Drawer>
      )}

      {currentMatter && drawer?.type === "matter" && (
        <Drawer title={currentMatter.label} eyebrow="Matter details" onClose={() => setDrawer(null)}>
          <p className="drawer-intro">Record where to look and what to do—never a password.</p>
          <label className="field-label">Account or policy hint<input value={drawer.institution} maxLength={160} onChange={(event) => updateMatterDraft("institution", event.target.value)} /></label>
          <label className="field-label">Safe location hint<input value={drawer.location} maxLength={500} onChange={(event) => updateMatterDraft("location", event.target.value)} /></label>
          <label className="field-label">Preferred outcome<select value={drawer.desiredOutcome} onChange={(event) => updateMatterDraft("desiredOutcome", event.target.value)}>{outcomeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <div className="drawer-safety"><Info size={19} /> Directions only—never add a bank password, recovery code or seed phrase.</div>
          <button className="secondary-button" disabled={busy} onClick={openRolePolicyForCurrentMatter}>Review roles for this matter <UserCircle size={19} /></button>
          <button className="primary-button drawer-primary" disabled={busy} onClick={() => void saveMatter()}>{busy ? "Saving…" : currentMatter.status === "added" ? "Save changes" : "Add to my plan"} {!busy && <ArrowRight size={20} />}</button>
        </Drawer>
      )}

      {drawer?.type === "settings" && (
        <Drawer title="Official settings" eyebrow="Provider checklist" onClose={() => setDrawer(null)}>
          <p className="drawer-intro">These are your self-reported checks. Provider settings only change on each provider’s official website.</p>
          <div className="check-list">{officialCheckDefinitions.map((item) => {
            const check = checks.find((candidate) => candidate.providerKey === item.key);
            return <label key={item.key}><span><strong>{item.label}</strong><small>{item.detail}</small></span><input type="checkbox" disabled={!check || busy} checked={check?.completed ?? false} onChange={() => check && toggleCheck(check.publicId)} /></label>;
          })}</div>
          <button className="primary-button drawer-primary" disabled={busy} onClick={() => void saveOfficialChecks()}>{busy ? "Saving…" : "Save review"} {!busy && <Check size={20} />}</button>
        </Drawer>
      )}

      {currentProviderGuide && drawer?.type === "provider-guide" && (
        <Drawer title={currentProviderGuide.label} eyebrow={currentProviderGuide.kind} onClose={() => setDrawer(null)}>
          <div className="provider-guide-intro"><ProviderMark providerKey={currentProviderGuide.key} label={currentProviderGuide.label} /><p className="drawer-intro">{currentProviderGuide.detail}</p></div>

          <section className="provider-guide-block">
            <h3>Do now</h3>
            <ol>{currentProviderGuide.doNow.map((step) => <li key={step}>{step}</li>)}</ol>
          </section>

          <section className="provider-guide-block">
            <h3>If someone handles it later</h3>
            <ol>{currentProviderGuide.later.map((step) => <li key={step}>{step}</li>)}</ol>
          </section>

          <section className="provider-guide-block">
            <h3>Usually requested</h3>
            <ul>{currentProviderGuide.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>

          <section className="provider-guide-links" aria-label={`${currentProviderGuide.label} official links`}>
            {currentProviderGuide.links.map(([label, href]) => (
              <a className="secondary-button" href={href} key={href} rel="noreferrer" target="_blank">
                {label} <ArrowRight size={18} />
              </a>
            ))}
          </section>

          <div className="drawer-safety"><Info size={19} /> {currentProviderGuide.boundary}</div>
          <p className="provider-guide-reviewed">Official sources reviewed {currentProviderGuide.reviewed}. Providers can change requirements.</p>

          {selfReportedProviderKeys.includes(currentProviderGuide.key) && (
            <button className="secondary-button" type="button" onClick={() => setDrawer({ type: "settings" })}>
              Update my self-reported check <Check size={18} />
            </button>
          )}
        </Drawer>
      )}

      {drawer?.type === "contact" && (
        <Drawer title={contact?.displayName ?? "Trusted contact"} eyebrow="Trusted contact" onClose={() => setDrawer(null)}>
          <div className="contact-heading drawer-contact"><span className="avatar">{contactInitials}</span><div><h3>{contact?.displayName ?? "No contact yet"}</h3><ContactEvidence contact={contact} /></div></div>
          <p className="drawer-intro">{contactEvidence.simulated ? "Local fixture only. " : "Record only. "}No access, ownership, recovery rights or legal authority.</p>
          <button className="secondary-button" onClick={() => notify("Real invitation delivery remains safely disabled in this build.")}>Review invitation status</button>
          <button className="primary-button drawer-primary" onClick={() => setDrawer(null)}>Done <Check size={20} /></button>
        </Drawer>
      )}

      {drawer?.type === "start-here" && (
        <Drawer title="Start Here guide" eyebrow="Minimum disclosure" onClose={() => setDrawer(null)}>
          <StartHerePanel apiClient={api} onGenerated={handleStartHereGenerated} />
        </Drawer>
      )}

      {drawer?.type === "disclosure-rehearsal" && (
        <Drawer title="Role disclosure rehearsal" eyebrow="Planner-only policy preview" onClose={() => setDrawer(null)}>
          <DisclosureRehearsalPanel apiClient={api} onChanged={handleStartHereGenerated} />
        </Drawer>
      )}

      {drawer?.type === "role-policy" && (
        <Drawer title="Role and disclosure scope" eyebrow="Planner-authored policy" onClose={() => setDrawer(null)}>
          <RoleAssignmentPolicyPanel
            apiClient={api}
            contacts={contacts}
            matters={matters}
            initialMatterId={drawer.matterId}
            onChanged={handleStartHereGenerated}
          />
        </Drawer>
      )}

      {toast && <div className="toast" role="status"><CheckCircle size={19} weight="fill" /> {toast}</div>}
    </div>
  );
}

function mapMatter(matter) {
  return {
    id: matter.publicId,
    label: matter.title,
    institution: matter.institutionName ?? matter.accountHint ?? "",
    location: matter.locationHint ?? "",
    desiredOutcome: matter.desiredOutcome,
    status: matter.status === "ready" ? "added" : "missing",
    version: matter.version,
    icon: titleIcons[matter.title] ?? categoryIcons[matter.category] ?? FileText,
  };
}

function getInitials(value) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "TC";
}

function formatAuditAction(action) {
  const labels = {
    "matter.created": "Matter added",
    "matter.updated": "Matter updated",
    "matter.archived": "Matter archived",
    "trusted_contact.created": "Trusted contact added",
    "trusted_contact.updated": "Trusted contact updated",
    "official_setup.self_reported": "Official setting reviewed",
    "simulation.completed": "Simulation completed",
    "disclosure_rehearsal.created": "Disclosure rehearsal created",
    "disclosure_rehearsal.advance": "Disclosure rehearsal advanced",
    "disclosure_rehearsal.simulate_cooling_off_elapsed": "Disclosure hold elapsed in rehearsal",
    "disclosure_rehearsal.appeal": "Disclosure rehearsal placed on appeal hold",
    "disclosure_rehearsal.restart_review": "Disclosure rehearsal review restarted",
    "disclosure_rehearsal.cancel": "Disclosure rehearsal canceled",
    "role_assignment.created": "Role record added",
    "role_assignment.updated": "Role scope updated",
    "role_assignment.revoked": "Role record revoked",
    "export.previewed": "Start Here previewed",
    "export.generated": "Printable Start Here guide generated",
    "export.encryption_prepared": "Encrypted Start Here package prepared",
    "export.encrypted": "Encrypted Start Here package created",
    "plan.updated": "Plan updated",
  };
  return labels[action] ?? "Plan activity recorded";
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}
