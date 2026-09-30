import { MatterForm } from "./MatterForm.jsx";
import { toMatterDraft, matterPayload, matterValidation, matterDraftChanged } from "./matterForm.js";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ContactEditorPanel } from "./ContactEditorPanel.jsx";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import { ContactSharingPanel, PeoplePanel, SharedWithMePanel } from "./SharingPanels.jsx";
import { InvitationPage } from "./InvitationPage.jsx";
import { ProviderGuidePanel, SafetyPanel } from "./TaskPanels.jsx";
import "./interaction-refinement.css";
import { DisclosureRehearsalPanel } from "./DisclosureRehearsalPanel.jsx";
import { RoleAssignmentPolicyPanel } from "./RoleAssignmentPolicyPanel.jsx";
import { PublicExperience } from "./PublicExperience.jsx";
import { publicRoutes } from "./publicRoutes.js";
import { requestedMatterCategory } from "./publicIntent.js";
import { FirstUseGuide, FirstUseStarter } from "./FirstUsePanel.jsx";
import { firstUseStates, normalizeFirstUse, shouldShowFirstUsePanel } from "./firstUse.js";
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
  { id: "shared", label: "Shared with me", icon: UserCircle },
  { id: "maintenance", label: "Shared reviews", icon: ClipboardText },
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "access", label: "Plan & access", icon: CreditCard },
  { id: "activity", label: "Activity", icon: Pulse },
];

const FamilyMaintenancePanel = lazy(() => import("./FamilyMaintenancePanel.jsx").then((module) => ({ default: module.FamilyMaintenancePanel })));

const mobileNavigationIcons = {
  overview: House,
  matters: AddressBook,
  more: DotsThreeCircle,
};

const mobileMoreDestinationIcons = {
  access: CreditCard,
  plan: ClipboardText,
  contacts: UserCircle,
  shared: UserCircle,
  maintenance: ClipboardText,
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
    </section>
  );
}

function CommercialFeatureList({ features }) {
  return <ul className="commercial-feature-list">{features.map((feature) => <li key={feature}><CheckCircle size={18} weight="fill" aria-hidden="true" /><span>{feature}</span></li>)}</ul>;
}

function PlanAccessPreview({ commerce }) {
  if (!commerce.available) return <section className="current-access-card"><CreditCard size={36} aria-hidden="true" /><h2>Temporarily unavailable</h2><p>Core planning remains available.</p></section>;
  const annualOffer = commerce.offers.find(({ billingInterval }) => billingInterval === "annual");
  const monthlyOffer = commerce.offers.find(({ billingInterval }) => billingInterval === "monthly");
  return <div className="plan-access-preview">
    <section className="current-access-card" aria-labelledby="current-access-title">
      <CreditCard size={40} aria-hidden="true" /><div><SectionLabel>Current access</SectionLabel><h2 id="current-access-title">{commerce.currentAccessLabel}</h2></div>
      <details className="task-details"><summary>Included with Free</summary><CommercialFeatureList features={commerce.freeFeatures} /></details>
    </section>
    <details className="task-details access-future"><summary>Rillora Family · Planned</summary>
      {(annualOffer || monthlyOffer) && <p className="access-plan-price">{annualOffer && <strong>{formatOffer(annualOffer)}</strong>}{annualOffer && monthlyOffer ? " or " : ""}{monthlyOffer && formatOffer(monthlyOffer)}</p>}
      <CommercialFeatureList features={commerce.familyFeatures} />
      <p>Billing is not open. No purchase or trial starts here.</p>
    </details>
    <details className="task-details"><summary>What happens if Family ends?</summary><p>Core text records stay readable and exportable, and basic recipient retrieval remains available. Billing never triggers death, incapacity, unreachable or disclosure workflows.</p></details>
  </div>;
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

function Drawer({ title, eyebrow, onClose, closeLabel = "Close panel", busy = false, error, onReload, children }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("input:not([type=checkbox]), textarea, select")?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
    };
  }, []);
  return (
    <dialog ref={dialogRef} className="drawer" aria-labelledby="drawer-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}>
      <button className="icon-button drawer-close" disabled={busy} onClick={onClose} aria-label={closeLabel}><X size={20} /></button>
      {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
      <h2 id="drawer-title">{title}</h2>
      {error && <div className="drawer-alert" role="alert"><p>{error}</p>{onReload && <button className="secondary-button" type="button" disabled={busy} onClick={onReload}>Load latest · replaces draft</button>}</div>}
      {children}
    </dialog>
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
  const startsOnInvitationRoute = /^\/invite(?:\/[a-f0-9-]{36})?\/?$/i.test(window.location.pathname);
  const [activeNav, setActiveNav] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("next") === "reviews" || query.get("view") === "maintenance") return "maintenance";
    return query.get("view") === "shared" ? "shared" : window.location.pathname === "/account" ? "settings" : "overview";
  });
  const [matters, setMatters] = useState([]);
  const [matterQuery, setMatterQuery] = useState("");
  const [matterFilter, setMatterFilter] = useState("all");
  const [plan, setPlan] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [checks, setChecks] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [session, setSession] = useState(null);
  const [commerce, setCommerce] = useState(() => unavailableCommercialStatus());
  const [drawer, setDrawer] = useState(null);
  const [panelHasChanges, setPanelHasChanges] = useState(false);
  const [panelBusy, setPanelBusy] = useState(false);
  const [panelExitWarning, setPanelExitWarning] = useState("");
  const [sharingRefreshVersion, setSharingRefreshVersion] = useState(0);
  const { confirm, confirmation } = useConfirmation();
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef(null);
  const workspaceRevision = useRef(0);

  useEffect(() => { setPanelHasChanges(false); setPanelBusy(false); setPanelExitWarning(""); }, [drawer?.type]);

  const loadWorkspace = useCallback(async () => {
    const revision = ++workspaceRevision.current;
    setLoading(true); setLoadError(null);
    try {
      const snapshot = await api.getOverview();
      if (workspaceRevision.current !== revision) return;
      if (!snapshot.session || !snapshot.plan) throw new Error("The map response was incomplete.");
      setSession(snapshot.session); setPlan(snapshot.plan);
      setMatters(snapshot.matters.map(mapMatter)); setContacts(snapshot.trustedContacts);
      setLoading(false);
      const requestedCategory = requestedMatterCategory(window.location.search);
      if (requestedCategory) {
        openNewMatter({ category: requestedCategory });
        const url = new URL(window.location.href); url.searchParams.delete("compose");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
      // Secondary panels must not hold the first meaningful screen behind network calls.
      void Promise.allSettled([
        api.getOfficialSetupChecks(), api.getAuditEvents(),
        api.getCommerceStatus(import.meta.env.VITE_RILLORA_SERVICE_MARKET_CODE ?? "GLOBAL_US"),
      ]).then(([check, audit, access]) => {
        if (workspaceRevision.current !== revision) return;
        const failed = [check, audit, access].find((result) => result.status === "rejected" && result.reason?.status === 401);
        if (failed) {
          ++workspaceRevision.current;
          setSession(null); setPlan(null); setMatters([]); setContacts([]); setChecks([]); setAuditEvents([]); setDrawer(null);
          setLoadError(failed.reason); return;
        }
        if (check.status === "fulfilled") setChecks(check.value.officialSetupChecks.map((item) => ({ ...item, serverCompleted: item.completed })));
        if (audit.status === "fulfilled") setAuditEvents(audit.value.auditEvents);
        setCommerce(access.status === "fulfilled" ? access.value : unavailableCommercialStatus());
      });
    } catch (error) {
      if (workspaceRevision.current !== revision) return;
      if (error instanceof ApiClientError && error.status === 401) {
        setSession(null); setPlan(null); setMatters([]); setContacts([]); setChecks([]); setAuditEvents([]); setDrawer(null);
      }
      setLoadError(error);
    } finally {
      if (workspaceRevision.current === revision) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!startsOnPublicLegalRoute && !startsOnInvitationRoute) void loadWorkspace();
    else setLoading(false);
    return () => window.clearTimeout(toastTimer.current);
  }, [loadWorkspace, startsOnPublicLegalRoute, startsOnInvitationRoute]);

  const completed = useMemo(() => matters.filter((matter) => matter.status === "added").length, [matters]);
  const currentMatter = drawer?.type === "matter" ? matters.find((matter) => matter.id === drawer.id) : null;
  const currentProviderGuide = drawer?.type === "provider-guide"
    ? getOfficialProviderGuide(drawer.providerKey)
    : null;
  const contact = contacts[0] ?? null;
  const editingContact = drawer?.contactId ? contacts.find((person) => person.publicId === drawer.contactId) ?? null : null;
  const sharingContact = drawer?.type === "contact-sharing" ? contacts.find((person) => person.publicId === drawer.contactId) : null;
  const contactEvidence = getTrustedContactEvidence(contact);
  const contactInitials = getInitials(contact?.displayName ?? "Trusted contact");

  function notify(message) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2_600);
  }

  function openMatter(matter) {
    const values = toMatterDraft(matter);
    setDrawer({ type: "matter", id: matter.id, expectedVersion: matter.version, ...values, initialValues: values });
  }

  function openNewMatter(seed = {}) {
    const values = toMatterDraft(seed);
    setDrawer({ type: "matter-create", ...values, initialValues: values });
  }

  async function closeDrawer() {
    if (busy || panelBusy) return;
    if (panelExitWarning && !await confirm({ title: "Keep your recovery key", message: panelExitWarning, confirmLabel: "Leave without key", cancelLabel: "Return to guide" })) return;
    let dirty = panelHasChanges;
    if (drawer?.type === "matter-create") {
      dirty ||= matterDraftChanged(drawer);
    } else if (drawer?.type === "matter" && currentMatter) {
      dirty ||= matterDraftChanged(drawer);
    } else if (drawer?.type === "settings") {
      dirty ||= checks.some((check) => check.completed !== check.serverCompleted);
    }
    if (dirty && !await confirm({ title: "Discard unsaved changes?" })) return;
    if (drawer?.type === "settings") setChecks((items) => items.map((item) => ({ ...item, completed: item.serverCompleted })));
    setPanelHasChanges(false);
    setDrawer(null);
  }

  function contactSaved(saved) {
    const isNew = !contacts.some((person) => person.publicId === saved.publicId);
    setContacts((items) => items.some((item) => item.publicId === saved.publicId)
      ? items.map((item) => item.publicId === saved.publicId ? saved : item) : [...items, saved]);
    setPanelHasChanges(false); setDrawer(isNew ? { type: "contact-sharing", contactId: saved.publicId } : null); notify("Contact saved");
  }

  function updateNewMatterDraft(field, value) {
    setDrawer((current) => current?.type === "matter-create" ? { ...current, [field]: value } : current);
  }

  async function saveNewMatter() {
    if (drawer?.type !== "matter-create" || matterValidation(drawer) || busy) return;
    setBusy(true);
    try {
      const response = await api.createMatter(matterPayload(drawer));
      setMatters((items) => [...items, mapMatter(response.matter)]);
      setDrawer(null);
      notify("Matter saved");
      const revision = workspaceRevision.current;
      void Promise.allSettled([api.getPlan(), api.getAuditEvents()]).then(([updatedPlan, audit]) => {
        if (workspaceRevision.current !== revision) return;
        if (updatedPlan.status === "fulfilled") setPlan(updatedPlan.value.plan);
        if (audit.status === "fulfilled") setAuditEvents(audit.value.auditEvents);
      });
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

  async function pauseFirstUse(step = normalizeFirstUse(plan).step, motivation) {
    if (busy) return;
    const updated = await updateFirstUse({
      state: firstUseStates.guidePaused,
      step: Math.max(0, step),
      motivation,
    });
    if (updated) setDrawer(null);
  }

  function updateMatterDraft(field, value) {
    setDrawer((current) => current?.type === "matter" ? { ...current, [field]: value } : current);
  }

  async function saveMatter() {
    if (!currentMatter || drawer?.type !== "matter" || matterValidation(drawer) || busy) return;
    setBusy(true);
    try {
      const response = await api.updateMatter(currentMatter.id, {
        ...matterPayload(drawer), expectedVersion: drawer.expectedVersion,
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
    if (error instanceof ApiClientError && error.status === 401) {
      await loadWorkspace();
      return;
    }
    if (error instanceof ApiClientError && error.code === "version_conflict") {
      setDrawer((current) => current ? { ...current, error: "This record changed elsewhere. Your draft is kept.", conflict: true } : current);
      return;
    }
    const message = error instanceof ApiClientError ? error.message : "The change could not be saved.";
    setDrawer((current) => current ? { ...current, error: message } : current);
    notify(message);
  }

  async function reloadCurrentDraft() {
    if (!drawer || busy) return;
    setBusy(true);
    try {
      if (drawer.type === "matter") {
        const response = await api.getMatters();
        const latest = response.matters.map(mapMatter);
        const item = latest.find((matter) => matter.id === drawer.id);
        if (!item) throw new Error("This matter is no longer available.");
        setMatters(latest); openMatter(item);
      } else if (drawer.type === "settings") {
        const response = await api.getOfficialSetupChecks();
        setChecks(response.officialSetupChecks.map((check) => ({ ...check, serverCompleted: check.completed })));
        setDrawer({ type: "settings" });
      } else {
        await loadWorkspace();
        setDrawer((current) => current ? { ...current, error: null, conflict: false } : current);
      }
    } catch (failure) { notify(failure?.message || "Could not refresh this record."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    setBusy(true);
    try {
      ++workspaceRevision.current;
      await api.logout();
      window.location.assign("/");
    } catch (error) {
      notify(error instanceof ApiClientError ? error.message : "Sign out could not be completed.");
      setBusy(false);
    }
  }

  async function signOutAllDevices() {
    const confirmed = await confirm({ title: "Sign out all devices?", message: "Rillora sessions will end. Your Google or Apple session stays separate.", confirmLabel: "Sign out all", cancelLabel: "Keep sessions" });
    if (!confirmed) return;
    setBusy(true);
    try {
      ++workspaceRevision.current;
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
          <div className="hero-actions">
            {!shouldShowFirstUsePanel(plan) && <button className="primary-button" onClick={hasMatters ? openNextMatter : () => openNewMatter()} disabled={busy}>{hasMatters ? "Continue your plan" : "Add your first matter"} <ArrowRight size={21} /></button>}
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
            <button className="text-button contact-action" onClick={() => setActiveNav("contacts")}>Manage trusted contacts <CaretRight size={18} /></button>
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
      shared: ["Shared with me", "Read-only information shared with you."],
      maintenance: ["Shared reviews", "Keep permitted directions current together."],
      guides: ["Official guides", "Review each provider’s current process before anyone needs it."],
      access: ["Plan & access", "See what stays free and what Family adds over time."],
      activity: ["Plan activity", "A private record of the changes you make to this plan."],
      settings: ["Settings", "Manage optional setup and Rillora account sessions."],
      more: ["More", "Plan tools, people, guidance and account settings."],
    }[activeNav];

    return (
      <section className="secondary-view">
        {activeNav === "activity" && <SectionLabel>Private audit</SectionLabel>}
        <h1 style={activeNav === "maintenance" ? { fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.08 } : undefined}>{meta[0]}</h1>
        {activeNav === "matters" && <>
          <div className="matter-list-tools">
            <label className="matter-search"><span className="sr-only">Search matters</span><input type="search" placeholder="Search matters" value={matterQuery} onChange={(event) => setMatterQuery(event.target.value)} /></label>
            <button className="primary-button" type="button" onClick={() => openNewMatter()}>Add a matter <ArrowRight size={20} aria-hidden="true" /></button>
          </div>
          <div className="panel-tabs" role="group" aria-label="Filter matters">
            {[["all", "All"], ["review", "Needs review"], ["added", "Added"]].map(([value, label]) => <button type="button" key={value} aria-pressed={matterFilter === value} onClick={() => setMatterFilter(value)}>{label}</button>)}
          </div>
          <div className="matter-list secondary-list">{matters.filter((matter) => (
            (matterFilter === "all" || (matterFilter === "added" ? matter.status === "added" : matter.status !== "added"))
            && `${matter.label} ${matter.institution}`.toLowerCase().includes(matterQuery.trim().toLowerCase())
          )).map((matter) => <MatterRow key={matter.id} matter={matter} onOpen={openMatter} />)}</div>
          {(matterQuery || matterFilter !== "all") && <button type="button" className="text-button" onClick={() => { setMatterQuery(""); setMatterFilter("all"); }}>Clear filters</button>}
        </>}

        {activeNav === "plan" && <div className="plan-card"><ProgressSummary count={completed} total={Math.max(matters.length, 5)} /><button className="primary-button" onClick={matters.length ? openNextMatter : () => openNewMatter()}>{matters.length ? "Continue next step" : "Add your first matter"} <ArrowRight size={20} /></button><button className="secondary-button" onClick={() => setDrawer({ type: "start-here" })}>Review Start Here guide <FileText size={20} /></button></div>}
        {activeNav === "contacts" && <PeoplePanel contacts={contacts} apiClient={api} refreshVersion={sharingRefreshVersion} onAdd={() => setDrawer({ type: "contact" })} onEdit={(person) => setDrawer({ type: "contact", contactId: person.publicId })} onShare={(person) => setDrawer({ type: "contact-sharing", contactId: person.publicId })} onIncoming={() => setActiveNav("shared")} />}
        {activeNav === "shared" && <SharedWithMePanel apiClient={api} />}
        {activeNav === "maintenance" && <Suspense fallback={<p role="status">Loading reviews…</p>}><FamilyMaintenancePanel apiClient={api} onChanged={() => void loadWorkspace()} onManageSharing={() => setActiveNav("contacts")} /></Suspense>}
        {activeNav === "guides" && <div className="guide-list">{officialProviderGuides.map((item) => <button key={item.key} className="guide-row" onClick={() => setDrawer({ type: "provider-guide", providerKey: item.key })}><ProviderMark providerKey={item.key} label={item.label} /><span><strong>{item.label}</strong><small>{item.kind}</small></span><CaretRight size={17} /></button>)}</div>}
        {activeNav === "access" && <PlanAccessPreview commerce={commerce} />}
        {activeNav === "activity" && <div className="activity-list">{auditEvents.length ? auditEvents.map((event) => <p key={event.publicId}><Check size={17} /> {formatAuditAction(event.action)} <span>{formatDate(event.occurredAt)}</span></p>) : <p>No recorded plan changes yet.</p>}</div>}
        {activeNav === "settings" && <div className="plan-card settings-card"><button className="secondary-button" type="button" onClick={() => setActiveNav("access")}><CreditCard size={20} /> Review plan & access</button>{session?.authenticationMode === "session" && <><button className="secondary-button settings-sign-out" disabled={busy} onClick={() => void signOut()}><SignOut size={20} /> {busy ? "Signing out…" : "Sign out"}</button><button className="secondary-button settings-sign-out" disabled={busy} onClick={() => void signOutAllDevices()}><SignOut size={20} /> Sign out all Rillora devices</button><p className="drawer-intro">Revokes Rillora sessions only.</p></>}</div>}
        {activeNav === "more" && <nav className="mobile-more-menu" aria-label="More destinations">{mobileMoreDestinations.map(({ id, label, detail, icon: Icon }) => <button type="button" key={id} onClick={() => setActiveNav(id)}><Icon size={22} aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span><CaretRight size={18} aria-hidden="true" /></button>)}</nav>}
      </section>
    );
  }

  if (startsOnInvitationRoute) return <InvitationPage apiClient={api} />;

  if (startsOnPublicLegalRoute) {
    return <PublicExperience sessionStatus="signed_out" onRetry={() => void loadWorkspace()} />;
  }

  if ((loading || loadError) && !session) {
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
        <section className="safety-note"><Leaf size={27} /><strong>Directions, not passwords.</strong><button onClick={() => setDrawer({ type: "safety" })}>Safety & privacy</button></section>
        {session?.authenticationMode === "session" && <button type="button" className="sign-out-nav" disabled={busy} onClick={() => void signOut()}><SignOut size={23} aria-hidden="true" /> <span>Sign out</span></button>}
        <button type="button" className={`settings-nav ${activeNav === "settings" ? "active" : ""}`} aria-current={activeNav === "settings" ? "page" : undefined} onClick={() => setActiveNav("settings")}><GearSix size={23} aria-hidden="true" /> <span>Settings</span></button>
      </aside>

      <main className="main-content">
        {session?.authenticationMode === "development" && <p className="development-notice">Local QA · test data</p>}
        {loadError && <div className="workspace-refresh" role="status"><span>Showing your last loaded map.</span><button type="button" onClick={() => void loadWorkspace()}>Retry</button></div>}
        {loading && session && <div className="workspace-refresh" role="status">Refreshing…</div>}
        {activeNav === "overview" ? showOverview() : showSection()}
      </main>

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
          eyebrow="Optional guide"
          closeLabel="Save and exit guide"
          busy={busy}
          error={drawer.error}
          onReload={drawer.conflict ? () => void reloadCurrentDraft() : undefined}
          onClose={() => void pauseFirstUse(drawer.step, drawer.motivation)}
        >
          <FirstUseGuide
            step={drawer.step}
            motivation={drawer.motivation}
            onMotivationChange={(motivation) => setDrawer((current) => current?.type === "first-use-guide" ? { ...current, motivation } : current)}
            busy={busy}
            onContinue={() => void advanceFirstUseGuide(drawer.motivation)}
            onSkipQuestion={() => void advanceFirstUseGuide()}
            onAddMatter={(category) => openNewMatter({ category })}
            onSaveAndExit={() => void pauseFirstUse(drawer.step, drawer.motivation)}
          />
        </Drawer>
      )}

      {(drawer?.type === "matter-create" || (currentMatter && drawer?.type === "matter")) && (
        <Drawer title={drawer.type === "matter-create" ? "New matter" : "Edit matter"} busy={busy || panelBusy} error={drawer.error} onReload={drawer.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <MatterForm draft={drawer} onChange={drawer.type === "matter-create" ? updateNewMatterDraft : updateMatterDraft}
            busy={busy} isNew={drawer.type === "matter-create"} onSave={() => void (drawer.type === "matter-create" ? saveNewMatter() : saveMatter())} />
        </Drawer>
      )}

      {drawer?.type === "settings" && (
        <Drawer title="Official settings" eyebrow="Provider checklist" busy={busy || panelBusy} error={drawer?.error} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <p className="contact-evidence">Self-reported</p>
          <div className="check-list">{officialCheckDefinitions.map((item) => {
            const check = checks.find((candidate) => candidate.providerKey === item.key);
            return <label key={item.key}><span><strong>{item.label}</strong></span><input type="checkbox" disabled={!check || busy} checked={check?.completed ?? false} onChange={() => check && toggleCheck(check.publicId)} /></label>;
          })}</div>
          <button className="primary-button drawer-primary" disabled={busy} onClick={() => void saveOfficialChecks()}>{busy ? "Saving…" : "Save review"} {!busy && <Check size={20} />}</button>
          <details className="task-details"><summary>What this records</summary><p>Provider settings only change on each provider’s official website.</p></details>
        </Drawer>
      )}

      {currentProviderGuide && drawer?.type === "provider-guide" && (
        <Drawer title={currentProviderGuide.label} onClose={closeDrawer}>
          <ProviderGuidePanel key={currentProviderGuide.key} guide={currentProviderGuide}
            mark={<ProviderMark providerKey={currentProviderGuide.key} label={currentProviderGuide.label} />}
            onReviewStatus={selfReportedProviderKeys.includes(currentProviderGuide.key) ? () => setDrawer({ type: "settings" }) : undefined} />
        </Drawer>
      )}

      {drawer?.type === "safety" && <Drawer title="Safety & privacy" onClose={closeDrawer}><SafetyPanel /></Drawer>}

      {drawer?.type === "contact" && (
        <Drawer title={editingContact ? "Edit contact" : "New contact"} busy={busy || panelBusy} error={drawer?.error} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <ContactEditorPanel key={editingContact?.publicId ?? "new"} contact={editingContact} apiClient={api} onSaved={contactSaved} onDirtyChange={setPanelHasChanges} onBusyChange={setPanelBusy} />
        </Drawer>
      )}

      {sharingContact && <Drawer title={`Share with ${sharingContact.displayName}`} busy={panelBusy} onClose={closeDrawer}>
        <ContactSharingPanel key={sharingContact.publicId} contact={sharingContact} matters={matters} apiClient={api} onDirtyChange={setPanelHasChanges} onBusyChange={setPanelBusy} onChanged={() => setSharingRefreshVersion((value) => value + 1)} />
      </Drawer>}

      {drawer?.type === "start-here" && (
        <Drawer title="Start Here guide" eyebrow="Minimum disclosure" busy={busy || panelBusy} error={drawer?.error} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <StartHerePanel apiClient={api} onGenerated={handleStartHereGenerated} onBusyChange={setPanelBusy} onExitWarning={setPanelExitWarning} />
        </Drawer>
      )}

      {drawer?.type === "disclosure-rehearsal" && (
        <Drawer title="Role disclosure rehearsal" eyebrow="Planner-only policy preview" busy={busy || panelBusy} error={drawer?.error} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <DisclosureRehearsalPanel apiClient={api} onChanged={handleStartHereGenerated} onBusyChange={setPanelBusy} />
        </Drawer>
      )}

      {drawer?.type === "role-policy" && (
        <Drawer title="Role and disclosure scope" eyebrow="Planner-authored policy" busy={busy || panelBusy} error={drawer?.error} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <RoleAssignmentPolicyPanel
            apiClient={api}
            contacts={contacts}
            matters={matters}
            initialMatterId={drawer.matterId}
            onChanged={handleStartHereGenerated}
            onDirtyChange={setPanelHasChanges}
            onBusyChange={setPanelBusy}
          />
        </Drawer>
      )}

      {confirmation}
      {toast && <div className="toast" role="status"><CheckCircle size={19} weight="fill" /> {toast}</div>}
    </div>
  );
}

function mapMatter(matter) {
  return {
    ...matter,
    recordStatus: matter.status,
    id: matter.publicId,
    label: matter.title,
    institution: matter.institutionName ?? "",
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
