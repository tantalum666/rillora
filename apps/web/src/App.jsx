import { AccountIdentityPanel, AccountSummary, useAccountIdentity } from "./AccountIdentity.jsx";
import { PlanAccessPreview } from "./PlanAccessPreview.jsx";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { LanguageControl } from "./i18n/LanguageControl.jsx";
import { ReauthenticationPrompt } from "./ReauthenticationPrompt.jsx";
import { AppAppearanceControl } from "./AppearanceControl.jsx";
import { RilloraBrand } from "./RilloraBrand.jsx";
import { ProviderMark } from "./ProviderMark.jsx";
import { readWorkspaceRoute, drawerRoute, useWorkspaceHistory } from "./workspaceNavigation.js";
import { AuthenticatedOverview, FolioArtwork, InviteAction } from "./SharingMotion.jsx";
import { MatterForm } from "./MatterForm.jsx";
import { toMatterDraft, matterPayload, matterValidation, matterDraftChanged } from "./matterForm.js";
import { clearMatterDraft, clearMatchingMatterDraft, readMatterDraft, writeMatterDraft, matterStatusLabel } from "./matterDraftStorage.js";
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { AccountDataPanel } from "./AccountDataPanel.jsx";
import { AccountDeletionStatus } from "./AccountDeletionStatus.jsx";
import { ContactEditorPanel } from "./ContactEditorPanel.jsx";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import { ContactSharingPanel, PeoplePanel, SharedWithMePanel } from "./SharingPanels.jsx";
import { InvitationPage } from "./InvitationPage.jsx";
import { FUTURE_NOTICES_ENABLED } from "./futureNoticeFeature.js";
import { LEGACY_CONTENT_ENABLED } from './legacyContentFeature.js';
import { ProviderGuidePanel, SafetyPanel } from "./TaskPanels.jsx";
import { PlatformGuideDirectory } from "./PlatformGuides.jsx";
import "./interaction-refinement.css";
import { DisclosureRehearsalPanel } from "./DisclosureRehearsalPanel.jsx";
import { RoleAssignmentPolicyPanel } from "./RoleAssignmentPolicyPanel.jsx";
import { PublicExperience } from "./PublicExperience.jsx";
import { publicRoutes } from "./publicRoutes.js";
import { requestedMatterCategory } from "./publicIntent.js";
import { FirstUseGuide, FirstUseStarter } from "./FirstUsePanel.jsx";
import { firstUseStates, normalizeFirstUse, shouldShowFirstUsePanel } from "./firstUse.js";
import {
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

const navigation = [
  { id: "overview", icon: House },
  { id: "matters", icon: AddressBook },
  { id: "contacts", icon: UserCircle },
  { id: "shared", icon: UserCircle },
  { id: "maintenance", icon: ClipboardText },
  ...(LEGACY_CONTENT_ENABLED ? [{ id: 'legacy', icon: FileText }] : []),
  { id: "guides", icon: BookOpen },
  { id: "access", icon: CreditCard },
  { id: "activity", icon: Pulse },
];

const FamilyMaintenancePanel = lazy(() => import("./FamilyMaintenancePanel.jsx").then((module) => ({ default: module.FamilyMaintenancePanel })));
const LegacyContentPanel = LEGACY_CONTENT_ENABLED ? lazy(() => import('./LegacyContentPanel.jsx')) : null;
const FutureNoticePanel = FUTURE_NOTICES_ENABLED ? lazy(() => import("./FutureNoticePanels.jsx").then(module => ({ default: module.FutureNoticePanel }))) : null;
const FutureInvitationPage = FUTURE_NOTICES_ENABLED ? lazy(() => import("./FutureInvitationPage.jsx")) : null;

const mobileNavigationIcons = {
  overview: House,
  matters: AddressBook,
  more: DotsThreeCircle,
};

const mobileMoreDestinationIcons = {
  access: CreditCard,
  contacts: UserCircle,
  shared: UserCircle,
  maintenance: ClipboardText,
  legacy: FileText,
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

function MatterRow({ matter, onOpen }) {
  const { t } = useI18n();
  const added = matter.status === "added";
  const statusLabel = matterStatusLabel(matter, t);
  return (
    <button className="matter-row" onClick={() => onOpen(matter)} aria-label={t("workspace.matter.open", { name: matter.label, status: statusLabel })}>
      <MatterIcon matter={matter} />
      <span className="matter-name">{matter.label}</span>
      <span className={`matter-status ${added ? "is-added" : "is-missing"}`}>
        {added ? <CheckCircle size={18} weight="fill" /> : <span className="missing-dot" aria-hidden="true" />}
        {statusLabel}
      </span>
      <CaretRight size={17} aria-hidden="true" />
    </button>
  );
}

function Drawer({ title, eyebrow, onClose, closeLabel, busy = false, error, onReload, children }) {
  const { t } = useI18n();
  const dialogRef = useRef(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("input:not([type=checkbox]), textarea, select")?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      // Unmounting removes the browser's implicit dialog return target. Wait until
      // removal is committed, and never steal focus from a replacement dialog.
      requestAnimationFrame(() => {
        if (dialog.isConnected || document.querySelector("dialog[open]")) return;
        const target = trigger?.isConnected && trigger !== document.body
          ? trigger : document.querySelector("main.main-content");
        target?.focus({ preventScroll: true });
      });
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
      <header className="drawer-header">
        <div>{eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}<h2 id="drawer-title">{title}</h2></div>
        <button className="icon-button drawer-close" disabled={busy} onClick={onClose} aria-label={closeLabel ?? t("workspace.drawer.close")}><X size={20} /></button>
      </header>
      {error && <div className="drawer-alert" role="alert"><p>{error}</p>{onReload && <button className="secondary-button" type="button" disabled={busy} onClick={onReload}>{t("workspace.drawer.loadLatest")}</button>}</div>}
      {children}
    </dialog>
  );
}

function ContactEvidence({ contact }) {
  const { t } = useI18n();
  const evidence = getTrustedContactEvidence(contact, t);
  const Icon = evidence.accepted ? CheckCircle : Info;
  return <p className="contact-evidence"><Icon size={17} weight={evidence.accepted ? "fill" : "regular"} /> {evidence.label}</p>;
}

export function App() {
  // Network confirmation must also work before the first private overview loads.
  return <><ReauthenticationPrompt apiClient={api} /><AppContent /></>;
}

function AppContent() {
  const { t, formatDate, errorMessage } = useI18n();
  const initialPublicPath = window.location.pathname.length > 1
    ? window.location.pathname.replace(/\/+$/, "")
    : window.location.pathname;
  const startsOnPublicReadOnlyRoute = [
    publicRoutes.savedCopy,
    "/account-deletion",
    publicRoutes.privacy,
    publicRoutes.terms,
    publicRoutes.subscriptions,
    publicRoutes.refunds,
    publicRoutes.acceptableUse,
    publicRoutes.cookies,
    publicRoutes.legalNotice,
  ].includes(initialPublicPath);
  const startsOnFutureInvitationRoute = /^\/future-invite(?:\/[a-f0-9-]{36})?\/?$/i.test(window.location.pathname);
  const startsOnInvitationRoute = startsOnFutureInvitationRoute || /^\/invite(?:\/[a-f0-9-]{36})?\/?$/i.test(window.location.pathname);
  const initialRoute = useRef(readWorkspaceRoute(window.location.href)).current;
  const returnedFromCheckout = useRef(window.location.pathname === "/account/billing/complete").current;
  const [activeNav, setActiveNav] = useState(initialRoute.view);
  const [matters, setMatters] = useState([]);
  const [sharingMatterId, setSharingMatterId] = useState(initialRoute.sharingMatterId);
  const [matterQuery, setMatterQuery] = useState(initialRoute.q);
  const [matterFilter, setMatterFilter] = useState(initialRoute.filter);
  useEffect(() => { if (activeNav !== "contacts") setSharingMatterId(null); }, [activeNav]);
  const [plan, setPlan] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [checks, setChecks] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [session, setSession] = useState(null);
  const accountIdentity = useAccountIdentity(api, session?.plannerPublicId);
  const [deletionReference, setDeletionReference] = useState(null);
  const [recoverableDraft, setRecoverableDraft] = useState(null);
  const [draftPersistenceFailed, setDraftPersistenceFailed] = useState(false);
  const [browsePublic, setBrowsePublic] = useState(false);
  const draftOwner = useRef(null);
  const [commerce, setCommerce] = useState(() => unavailableCommercialStatus());
  const [drawer, setDrawer] = useState(null);
  const [panelHasChanges, setPanelHasChanges] = useState(false);
  const [panelBusy, setPanelBusy] = useState(false);
  const [legacyHasChanges, setLegacyHasChanges] = useState(false);
  const [legacyBusy, setLegacyBusy] = useState(false);
  const [panelExitWarning, setPanelExitWarning] = useState("");
  const [sharingRefreshVersion, setSharingRefreshVersion] = useState(0);
  const { confirm, confirmation, cancel: cancelConfirmation } = useConfirmation();
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("success");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef(null);
  const workspaceRevision = useRef(0);

  useEffect(() => { setPanelHasChanges(false); setPanelBusy(false); setPanelExitWarning(""); }, [drawer?.type]);

  const editingMatter = ["matter", "matter-create"].includes(drawer?.type);
  const unsavedMatter = editingMatter && matterDraftChanged(drawer);
  useEffect(() => {
    if (unsavedMatter && draftOwner.current) {
      setDraftPersistenceFailed(!writeMatterDraft(draftOwner.current, drawer));
    }
  }, [drawer, unsavedMatter]);
  useEffect(() => {
    if (!unsavedMatter && !panelHasChanges && !legacyHasChanges) return;
    const protectDraft = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, [unsavedMatter, panelHasChanges, legacyHasChanges]);

  const loadWorkspace = useCallback(async () => {
    const revision = ++workspaceRevision.current;
    setLoading(true); setLoadError(null);
    try {
      const snapshot = await api.getOverview();
      if (workspaceRevision.current !== revision) return;
      if (!snapshot.session || !snapshot.plan) throw new Error("The map response was incomplete.");
      draftOwner.current = snapshot.session.plannerPublicId;
      setRecoverableDraft(readMatterDraft(draftOwner.current));
      setSession(snapshot.session); setPlan(snapshot.plan);
      setMatters(snapshot.matters.map(mapMatter)); setContacts(snapshot.trustedContacts);
      setLoading(false);
      const requestedCategory = requestedMatterCategory(window.location.search);
      if (requestedCategory) {
        openNewMatter({ category: requestedCategory });
        const url = new URL(window.location.href); url.searchParams.delete("compose"); url.searchParams.set("task", "matter-create"); url.searchParams.set("category", requestedCategory);
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
    const confirmed = () => { void loadWorkspace(); };
    window.addEventListener('rillora:identity-confirmed', confirmed);
    return () => window.removeEventListener('rillora:identity-confirmed', confirmed);
  }, [loadWorkspace]);

  useEffect(() => {
    if (import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS === "closed") setLoading(false);
    else if (!startsOnPublicReadOnlyRoute && !startsOnInvitationRoute) void loadWorkspace();
    else setLoading(false);
    return () => window.clearTimeout(toastTimer.current);
  }, [loadWorkspace, startsOnPublicReadOnlyRoute, startsOnInvitationRoute]);

  useEffect(() => {
    const invalidate = (event) => {
      ++workspaceRevision.current;
      setSession(null); setPlan(null); setMatters([]); setContacts([]);
      setChecks([]); setAuditEvents([]); setDrawer(null); setRecoverableDraft(null);
      setCommerce(unavailableCommercialStatus()); setBusy(false); setLoading(false);
      draftOwner.current = null;
      setLoadError(event?.type === 'rillora:session-expired'
        ? new ApiClientError(401, 'authentication_required', 'Sign in to continue.')
        : new ApiClientError(409, 'account_changed', 'The signed-in account changed. Reload before continuing.'));
    };
    const verify = () => {
      if (session && !document.hidden) void api.getSession().catch(error => {
        if (error.status === 401 || error.code === 'account_changed') invalidate();
      });
    };
    window.addEventListener('rillora:account-changed', invalidate);
    window.addEventListener('rillora:session-expired', invalidate);
    window.addEventListener('focus', verify);
    document.addEventListener('visibilitychange', verify);
    return () => {
      window.removeEventListener('rillora:account-changed', invalidate);
      window.removeEventListener('rillora:session-expired', invalidate);
      window.removeEventListener('focus', verify);
      document.removeEventListener('visibilitychange', verify);
    };
  }, [session]);

  useEffect(() => {
    if (session && plan) document.title = `${t(`workspace.nav.${activeNav}`)} · Rillora`;
  }, [session, plan, activeNav, t]);

  const currentMatter = drawer?.type === "matter" ? matters.find((matter) => matter.id === drawer.id) : null;
  const currentProviderGuide = drawer?.type === "provider-guide"
    ? getOfficialProviderGuide(drawer.providerKey)
    : null;
  const contact = contacts[0] ?? null;
  const editingContact = drawer?.contactId ? contacts.find((person) => person.publicId === drawer.contactId) ?? null : null;
  const sharingContact = drawer?.type === "contact-sharing" ? contacts.find((person) => person.publicId === drawer.contactId) : null;
  const contactEvidence = getTrustedContactEvidence(contact, t);
  const contactInitials = getInitials(contact?.displayName ?? "Trusted contact");

  const activeDrawerError = drawer?.errorKey ? t(drawer.errorKey, drawer.errorParams)
    : drawer?.errorError ? errorMessage(drawer.errorError, "workspace.error.save") : drawer?.error;

  function notifyKey(key, kind = "success", params) { notify({ key, params }, kind); }
  function notifyError(error, fallbackKey) { notify({ error, fallbackKey }, "error"); }

  function notify(message, kind = "success") {
    window.clearTimeout(toastTimer.current);
    setToastKind(kind);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2_600);
  }

  function openMatter(matter, reviewPreparation = false) {
    if (offerPendingMatterDraft()) return;
    const values = toMatterDraft(matter);
    setDrawer({ type: "matter", id: matter.id, expectedVersion: matter.version, ...values, initialValues: values, reviewPreparation });
  }

  function openNewMatter(seed = {}) {
    if (offerPendingMatterDraft()) return;
    const values = toMatterDraft(seed);
    setDrawer({ type: "matter-create", requestId: crypto.randomUUID(), ...values, initialValues: values });
  }

  function discardRecoveredDraft() {
    clearMatterDraft(draftOwner.current);
    setRecoverableDraft(null);
  }

  function offerPendingMatterDraft() {
    if (drawer) return false;
    const saved = readMatterDraft(draftOwner.current);
    if (!saved) return false;
    setRecoverableDraft(saved);
    setDrawer(null);
    notifyKey("workspace.draft.resumeFirst", "info");
    return true;
  }

  function discardCurrentMatterDraft() {
    clearMatchingMatterDraft(draftOwner.current, drawer);
    setRecoverableDraft(readMatterDraft(draftOwner.current));
  }

  function accountDeletionRequested(reference) {
    ++workspaceRevision.current;
    discardRecoveredDraft(); draftOwner.current = null;
    setSession(null); setPlan(null); setMatters([]); setContacts([]); setChecks([]); setAuditEvents([]); setDrawer(null);
    setLoading(false); setLoadError(null); setDeletionReference(reference);
    window.history.replaceState({}, "", "/account-deletion");
  }

  async function resumeDraft() {
    const saved = readMatterDraft(draftOwner.current);
    if (!saved) { setRecoverableDraft(null); return; }
    if (saved.type === "matter" && !matters.some((matter) => matter.id === saved.id)) {
      try {
        const {matter} = await api.getMatter(saved.id);
        if (!matter.archivedAt) {
          setMatters(items => [...items.filter(item => item.id !== saved.id), mapMatter(matter)]);
          setDrawer(saved); setRecoverableDraft(null); setDraftPersistenceFailed(false); return;
        }
      } catch (error) {
        if (error.status !== 404) { notifyKey("workspace.draft.originalUnavailable"); return; }
      }
      if (!await confirm({ titleKey: "workspace.draft.originalMissing", messageKey: "workspace.draft.createQuestion", confirmLabelKey: "workspace.draft.create", cancelLabelKey: "workspace.draft.keep" })) return;
      setDrawer({ type: "matter-create", requestId: crypto.randomUUID(), ...toMatterDraft(saved), initialValues: toMatterDraft() });
    } else setDrawer(saved.type === "matter-create" ? { ...saved, requestId: saved.requestId ?? crypto.randomUUID() } : saved);
    setRecoverableDraft(null);
    setDraftPersistenceFailed(false);
  }

  async function mayLeaveDrawer() {
    if (busy || panelBusy) return false;
    if (panelExitWarning && !await confirm({ titleKey: "workspace.recovery.keepKey", ...(typeof panelExitWarning === "string" ? { message: panelExitWarning } : { messageKey: panelExitWarning.key, params: panelExitWarning.params }), confirmLabelKey: "workspace.recovery.leaveWithout", cancelLabelKey: "workspace.recovery.returnGuide" })) return false;
    const dirty = panelHasChanges || (editingMatter && matterDraftChanged(drawer))
      || (drawer?.type === "settings" && checks.some((check) => check.completed !== check.serverCompleted));
    if (dirty && !await confirm({ titleKey: "workspace.draft.discardQuestion" })) return false;
    if (editingMatter) discardCurrentMatterDraft();
    if (drawer?.type === "settings") setChecks((items) => items.map((item) => ({ ...item, completed: item.serverCompleted })));
    setPanelHasChanges(false); setPanelExitWarning("");
    return true;
  }

  async function mayLeaveLegacy() {
    if (activeNav !== 'legacy') return true;
    if (legacyBusy) return false;
    if (legacyHasChanges && !await confirm({ titleKey: 'workspace.draft.discardQuestion' })) return false;
    setLegacyHasChanges(false); return true;
  }
  async function navigateWorkspace(view) {
    if (view !== activeNav && !await mayLeaveLegacy()) return;
    setActiveNav(view);
  }

  async function closeDrawer() {
    if ((window.history.state?.rillora?.index ?? 0) > 0) { window.history.back(); return; }
    if (!await mayLeaveDrawer()) return;
    setDrawer(null);
  }

  function restoreRoute(route) {
    setActiveNav(route.view); setMatterQuery(route.q); setMatterFilter(route.filter); setSharingMatterId(route.sharingMatterId);
    if (route.task === "matter") {
      const item = matters.find(matter => matter.id === route.id);
      if (item) openMatter(item); else { setDrawer(null); notifyKey("workspace.matter.noLongerActive"); }
    } else if (route.task === "matter-create") openNewMatter(route.category ? { category: route.category } : {});
    else if (route.task === "first-use-guide") setDrawer({ type: route.task, step: Math.max(1, plan?.firstUseStep ?? 1), motivation: plan?.motivation ?? "" });
    else setDrawer(route.task ? { type: route.task, matterId: route.id, contactId: route.contactId, providerKey: route.providerKey } : null);
  }

  useWorkspaceHistory({ enabled: !!session && !!plan && !startsOnInvitationRoute && !startsOnPublicReadOnlyRoute,
    state: { view: activeNav, q: matterQuery, filter: matterFilter, sharingMatterId: activeNav === "contacts" ? sharingMatterId : null, ...drawerRoute(drawer) },
    restore: restoreRoute, canLeave: async route => (route.view === activeNav || await mayLeaveLegacy()) && await mayLeaveDrawer(), cancelLeave: cancelConfirmation });

  function contactSaved(saved) {
    const isNew = !contacts.some((person) => person.publicId === saved.publicId);
    setContacts((items) => items.some((item) => item.publicId === saved.publicId)
      ? items.map((item) => item.publicId === saved.publicId ? saved : item) : [...items, saved]);
    setPanelHasChanges(false); setDrawer(isNew ? { type: "contact-sharing", contactId: saved.publicId } : null); notifyKey("workspace.contact.saved");
  }

  function updateNewMatterDraft(field, value) {
    setDrawer((current) => current?.type === "matter-create" ? { ...current, [field]: value } : current);
  }

  async function saveNewMatter() {
    if (drawer?.type !== "matter-create" || matterValidation(drawer) || busy) return;
    setBusy(true);
    setDrawer((current) => current ? { ...current, error: null, errorKey: null, errorError: null } : current);
    try {
      const response = await api.createMatter({ ...matterPayload(drawer), requestId: drawer.requestId });
      setMatters((items) => [...items.filter(item => item.id !== response.matter.publicId), mapMatter(response.matter)]);
      discardCurrentMatterDraft();
      setDrawer(null);
      notifyKey("workspace.matter.saved");
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
    if (!currentMatter || drawer?.type !== "matter" || matterValidation(drawer) || busy || !matterDraftChanged(drawer)) return;
    setBusy(true);
    setDrawer((current) => current ? { ...current, error: null, errorKey: null, errorError: null } : current);
    try {
      const response = await api.updateMatter(currentMatter.id, {
        ...matterPayload(drawer), expectedVersion: drawer.expectedVersion,
      });
      setMatters((items) => items.map((matter) => matter.id === currentMatter.id ? mapMatter(response.matter) : matter));
      discardCurrentMatterDraft();
      setDrawer(null);
      notifyKey("workspace.matter.changesSaved");
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setBusy(false);
    }
  }

  async function archiveCurrentMatter() {
    if (busy || drawer?.type !== "matter" || !currentMatter) return;
    const archiveMessageKey = matterDraftChanged(drawer) ? "workspace.matter.archiveUnsavedMessage" : "workspace.matter.archiveMessage";
    if (!await confirm({titleKey:"workspace.matter.archiveQuestion",messageKey:archiveMessageKey,confirmLabelKey:"workspace.matter.archive",cancelLabelKey:"workspace.draft.keepEditing"})) return;
    setBusy(true);
    try {
      await api.archiveMatter(currentMatter.id, drawer.expectedVersion);
      setMatters(items=>items.filter(item=>item.id!==currentMatter.id));discardRecoveredDraft();setDrawer(null);notifyKey("workspace.matter.archived");
    } catch(error) { await handleMutationError(error); }
    finally { setBusy(false); }
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
      notifyKey(changed.length ? "workspace.settings.reviewSaved" : "workspace.settings.noChanges");
    } catch (error) {
      await handleMutationError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleMutationError(error) {
    if (error instanceof ApiClientError && error.code === "saved_draft_changed" && drawer?.requestId) {
      try {
        const { matter } = await api.getCreatedMatter(drawer.requestId);
        if (!matter.archivedAt) {
          setMatters(items => [...items.filter(item => item.id !== matter.publicId), mapMatter(matter)]);
          setDrawer(current => ({ ...current, type: "matter", id: matter.publicId, expectedVersion: matter.version, initialValues: toMatterDraft(mapMatter(matter)), errorKey: "workspace.error.firstSaved", error: null, errorError: null }));
          return;
        }
      } catch { /* Keep the original draft and error if the saved record cannot be verified. */ }
    }
    if (error instanceof ApiClientError && error.status === 401) {
      await loadWorkspace();
      return;
    }
    if (error instanceof ApiClientError && error.code === "version_conflict") {
      if (!drawer) { notifyKey("workspace.error.planChanged", "error"); await loadWorkspace(); return; }
      setDrawer((current) => current ? { ...current, errorKey: "workspace.error.recordChanged", error: null, errorError: null, conflict: true } : current);
      return;
    }
    setDrawer((current) => current ? { ...current, errorError: error, errorKey: null, error: null } : current);
    if (!drawer) notifyError(error, "workspace.error.save");
  }

  async function reloadCurrentDraft() {
    if (!drawer || busy) return;
    if (editingMatter && matterDraftChanged(drawer) && !await confirm({ titleKey: "workspace.draft.replaceQuestion", messageKey: "workspace.draft.loadMessage", confirmLabelKey: "workspace.draft.loadLatest", cancelLabelKey: "workspace.draft.keepEditing" })) return;
    setBusy(true);
    try {
      if (drawer.type === "matter") {
        const { matter } = await api.getMatter(drawer.id);
        if (matter.archivedAt) throw new Error("This matter is no longer available.");
        const item = mapMatter(matter);
        discardRecoveredDraft();
        setMatters(items => items.map(current => current.id === item.id ? item : current));
        openMatter(item);
      } else if (drawer.type === "settings") {
        const response = await api.getOfficialSetupChecks();
        setChecks(response.officialSetupChecks.map((check) => ({ ...check, serverCompleted: check.completed })));
        setDrawer({ type: "settings" });
      } else {
        await loadWorkspace();
        setDrawer((current) => current ? { ...current, error: null, errorKey: null, errorError: null, conflict: false } : current);
      }
    } catch (failure) { notifyError(failure, "workspace.error.refresh"); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!await mayLeaveLegacy()) return;
    setBusy(true);
    try {
      ++workspaceRevision.current;
      await api.logout();
      discardRecoveredDraft();
      window.location.assign("/");
    } catch (error) {
      notifyError(error, "workspace.error.signOut");
      setBusy(false);
    }
  }

  async function signOutAllDevices() {
    const confirmed = await confirm({ titleKey: "workspace.session.signOutQuestion", messageKey: "workspace.session.signOutDetails", confirmLabelKey: "workspace.session.signOutAll", cancelLabelKey: "workspace.session.keep" });
    if (!confirmed) return;
    setBusy(true);
    try {
      ++workspaceRevision.current;
      await api.logoutAll();
      discardRecoveredDraft();
      window.location.assign("/");
    } catch (error) {
      notifyError(error, "workspace.error.revokeSessions");
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
    return <AuthenticatedOverview matters={matters} contacts={contacts} apiClient={api}
      refreshVersion={sharingRefreshVersion} busy={busy} onAdd={() => openNewMatter()}
      onOpenMatters={() => setActiveNav("matters")} onInvite={() => setDrawer({ type: "contact" })}
      onOpenConnection={(person) => setDrawer({ type: "contact-sharing", contactId: person.publicId })}
      onOpenShared={() => setActiveNav("shared")} showGuide={shouldShowFirstUsePanel(plan)} guidePaused={plan?.firstUseState === firstUseStates.guidePaused}
      onGuide={() => void openFirstUseGuide()}
      renderMatter={(matter) => <MatterRow key={matter.id} matter={matter} onOpen={openMatter} />} />;
  }

  const filteredMatters = matters.filter(matter =>
    (matterFilter === "all" || (matterFilter === "added" ? matter.status === "added" : matter.status !== "added"))
    && `${matter.label} ${matter.institution}`.toLowerCase().includes(matterQuery.trim().toLowerCase()));

  function showSection() {
    const titleKey = {
      matters: "workspace.matters.title", guides: "workspace.guides.title", activity: "workspace.activity.title",
    }[activeNav] ?? `workspace.nav.${activeNav}`;

    return (
      <section className="secondary-view">
        {activeNav === "activity" && <SectionLabel>{t("workspace.activity.private")}</SectionLabel>}
        <h1 style={activeNav === "maintenance" ? { fontSize: "clamp(32px, 4vw, 44px)", lineHeight: 1.08 } : undefined}>{t(titleKey)}</h1>
        {activeNav === "matters" && <>
          {matters.length === 0 && <div className="matter-empty-folio"><FolioArtwork compact /></div>}
          <div className="matter-list-tools">
            <label className="matter-search"><span className="sr-only">{t("workspace.matters.search")}</span><input type="search" placeholder={t("workspace.matters.search")} value={matterQuery} onChange={(event) => setMatterQuery(event.target.value)} /></label>
            <button className="primary-button" type="button" onClick={() => openNewMatter()}>{t("workspace.matters.add")} <ArrowRight size={20} aria-hidden="true" /></button>
          </div>
          <div className="panel-tabs" role="group" aria-label={t("workspace.matters.filter")}>
            {[["all", t("workspace.filter.all")], ["review", t("workspace.filter.review")], ["added", t("workspace.matterStatus.ready")]].map(([value, label]) => <button type="button" key={value} aria-pressed={matterFilter === value} onClick={() => setMatterFilter(value)}>{label}</button>)}
          </div>
          <div className="matter-list secondary-list">{filteredMatters.map(matter => <MatterRow key={matter.id} matter={matter} onOpen={openMatter}/>)}{!filteredMatters.length && <p className="drawer-intro" role="status">{matters.length === 0 ? t("workspace.matters.empty") : matterQuery ? t("workspace.matters.noQueryMatch", { query: matterQuery }) : t("workspace.matters.noFilterMatch")}</p>}</div>
          {(matterQuery || matterFilter !== "all") && <button type="button" className="text-button" onClick={() => { setMatterQuery(""); setMatterFilter("all"); }}>{t("workspace.matters.clear")}</button>}
        </>}

        {activeNav === "contacts" && <PeoplePanel contacts={contacts} matterContext={matters.find(item => item.id === sharingMatterId)} onReturnToMatter={() => { if ((window.history.state?.rillora?.index ?? 0) > 0) window.history.back(); else { const item = matters.find(item => item.id === sharingMatterId); setActiveNav("matters"); if (item) openMatter(item); } }} apiClient={api} refreshVersion={sharingRefreshVersion} onAdd={() => setDrawer({ type: "contact" })} onEdit={(person) => setDrawer({ type: "contact", contactId: person.publicId })} onShare={(person) => setDrawer({ type: "contact-sharing", contactId: person.publicId })} onIncoming={() => setActiveNav("shared")} onFutureNotice={FUTURE_NOTICES_ENABLED ? person => setDrawer({ type: "future-notice", id: person.publicId }) : undefined} />}
        {activeNav === "shared" && <SharedWithMePanel apiClient={api} />}
        {activeNav === "maintenance" && <Suspense fallback={<p role="status">{t("workspace.reviews.loading")}</p>}><FamilyMaintenancePanel apiClient={api} onChanged={() => void loadWorkspace()} onManageSharing={() => setActiveNav("contacts")} onDirtyChange={setPanelHasChanges} onBusyChange={setPanelBusy} /></Suspense>}
        {activeNav === 'legacy' && LegacyContentPanel && <Suspense fallback={<p role="status">{t('content.loading')}</p>}><LegacyContentPanel key={session.plannerPublicId} apiClient={api} contacts={contacts} matters={matters}
          onDirtyChange={setLegacyHasChanges} onBusyChange={setLegacyBusy} onReviewPlan={() => void navigateWorkspace('access')} onOpenGuide={providerKey => setDrawer({ type: 'provider-guide', providerKey })}/></Suspense>}
        {activeNav === "guides" && <PlatformGuideDirectory renderMark={(guide) => <ProviderMark providerKey={guide.key} label={guide.label}/>} onOpen={(guide) => setDrawer({ type: "provider-guide", providerKey: guide.key })}/>}
        {activeNav === "access" && <PlanAccessPreview commerce={commerce} onAccessChanged={setCommerce} returnedFromCheckout={returnedFromCheckout} />}
        {activeNav === "activity" && <div className="activity-list">
          {auditEvents.length ? auditEvents.map((event) => {
            const matter = event.resourceType === "matter"
              ? matters.find((item) => item.id === event.resourcePublicId) : null;
            return <p key={event.publicId}>
              <Check size={17} aria-hidden="true" />
              <span className="activity-action">
                {formatAuditAction(event, t)}
                {matter && <button className="text-button" onClick={() => openMatter(matter)}>{matter.label}</button>}
                {event.action.startsWith("sharing.") && <button className="text-button" onClick={() => setActiveNav("contacts")}>{t("workspace.activity.viewPeople")}</button>}
                {event.action.startsWith("family_review.") && <button className="text-button" onClick={() => setActiveNav("maintenance")}>{t("workspace.activity.openReview")}</button>}
              </span>
              <time dateTime={event.occurredAt}>{formatDate(event.occurredAt, {
                year: "numeric", month: "short", day: "numeric", hour: "numeric",
                minute: "2-digit", timeZoneName: "short",
              })}</time>
            </p>;
          }) : <p>{t("workspace.activity.empty")}</p>}
        </div>}
        {activeNav === "settings" && <AccountIdentityPanel identity={accountIdentity} plannerPublicId={session.plannerPublicId}/>}
        {activeNav === "settings" && <AccountDataPanel apiClient={api} onChanged={() => void loadWorkspace()} onDeletionRequested={accountDeletionRequested}/>}
        {activeNav === "settings" && <div className="plan-card settings-card"><button className="secondary-button" type="button" onClick={() => setActiveNav("access")}><CreditCard size={20} /> {t("workspace.settings.reviewAccess")}</button><button className="secondary-button" type="button" onClick={() => setDrawer({ type: "start-here" })}><FileText size={20} /> {t("workspace.plan.reviewStart")}</button>{session?.authenticationMode === "session" && <><button className="secondary-button settings-sign-out" disabled={busy} onClick={() => void signOut()}><SignOut size={20} /> {busy ? t("workspace.settings.signingOut") : t("workspace.settings.signOut")}</button><button className="secondary-button settings-sign-out" disabled={busy} onClick={() => void signOutAllDevices()}><SignOut size={20} /> {t("workspace.settings.signOutAll")}</button><p className="drawer-intro">{t("workspace.settings.sessionScope")}</p></>}</div>}
        {activeNav === "more" && <InviteAction onInvite={() => setDrawer({ type: "contact" })} />}
        {activeNav === "more" && <nav className="mobile-more-menu" aria-label={t("workspace.nav.moreDestinations")}>{mobileMoreDestinations.map(({ id, icon: Icon }) => <button type="button" key={id} onClick={() => void navigateWorkspace(id)}><Icon size={22} aria-hidden="true" /><span><strong>{t(`workspace.nav.${id}`)}</strong><small>{t(`workspace.navDetail.${id}`)}</small></span><CaretRight size={18} aria-hidden="true" /></button>)}</nav>}
      </section>
    );
  }

  if (import.meta.env.VITE_RILLORA_CUSTOMER_ACCESS === "closed") return <PublicExperience sessionStatus="not_open" />;
  if (startsOnFutureInvitationRoute) return FutureInvitationPage
    ? <Suspense fallback={<p role="status">{t("future.loading")}</p>}><FutureInvitationPage apiClient={api}/></Suspense>
    : <main className="invitation-page"><p>{t("future.unavailable")}</p><a href="/">{t("forms.invitation.backHome")}</a></main>;
  if (startsOnInvitationRoute) return <InvitationPage apiClient={api} />;
  if (deletionReference || window.location.pathname === "/account-deletion") return <AccountDeletionStatus apiClient={api} reference={deletionReference}/>;

  if (startsOnPublicReadOnlyRoute) {
    return <PublicExperience sessionStatus="signed_out" onRetry={() => void loadWorkspace()} />;
  }

  if (!session || !plan) {
    const signedOut = loadError instanceof ApiClientError && loadError.status === 401;
    const serviceNotOpen = loadError instanceof ApiClientError && loadError.code === "service_not_open";
    const accountChanged = loadError instanceof ApiClientError && loadError.code === "account_changed";
    const retry = accountChanged ? () => window.location.assign('/') : () => void loadWorkspace();
    if (!signedOut && !serviceNotOpen && !browsePublic) return <main className="workspace-gate" aria-busy={loading}>
      <span className="workspace-gate-brand"><RilloraBrand /></span>
      <LanguageControl />
      <FileText size={44} aria-hidden="true" />
      <h1>{loading ? t("workspace.gate.loading") : accountChanged ? t("workspace.gate.accountChanged") : t("workspace.gate.unavailable")}</h1>
      {loading ? <p role="status">{t("workspace.gate.checking")}</p> : <>
        <p role="alert">{accountChanged ? t("workspace.gate.changedDetails") : t("workspace.gate.connectionDetails")}</p>
        <button className="primary-button" onClick={retry}>{accountChanged ? t("workspace.gate.reload") : t("workspace.gate.retry")}</button>
        <button className="text-button" onClick={() => setBrowsePublic(true)}>{t("workspace.gate.browse")}</button>
      </>}
    </main>;
    return (
      <PublicExperience
        sessionStatus={loading ? "checking" : signedOut ? "signed_out" : serviceNotOpen ? "not_open" : "unavailable"}
        onRetry={retry}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label={t("workspace.nav.primary")}>
        <nav>{navigation.map(({ id, icon: Icon }) => <button type="button" key={id} className={activeNav === id ? "active" : ""} aria-current={activeNav === id ? "page" : undefined} onClick={() => void navigateWorkspace(id)}><Icon size={23} weight="regular" aria-hidden="true" /> <span>{t(`workspace.nav.${id}`)}</span></button>)}</nav>
        <div className="sidebar-spacer" />
        <section className="safety-note"><Leaf size={27} /><strong>{t("workspace.safety.motto")}</strong><button onClick={() => setDrawer({ type: "safety" })}>{t("workspace.safety.title")}</button></section>
        {session?.authenticationMode === "session" && <button type="button" className="sign-out-nav" disabled={busy} onClick={() => void signOut()}><SignOut size={23} aria-hidden="true" /> <span>{t("workspace.settings.signOut")}</span></button>}
        <button type="button" className={`settings-nav ${activeNav === "settings" ? "active" : ""}`} aria-current={activeNav === "settings" ? "page" : undefined} onClick={() => void navigateWorkspace("settings")}><GearSix size={23} aria-hidden="true" /> <span>{t("workspace.settings.title")}</span></button>
      </aside>

      <main className="main-content" tabIndex={-1}>
        <div className={`workspace-chrome${activeNav === "settings" ? " is-settings" : ""}`}><AccountSummary identity={accountIdentity} plannerPublicId={session.plannerPublicId} onOpen={() => void navigateWorkspace("settings")} />{session?.authenticationMode === "development" && <p className="development-notice">{t("workspace.workspace.testData")}</p>}{activeNav !== "settings" && <LanguageControl />}<AppAppearanceControl /></div>
        {recoverableDraft && !drawer && <section className="draft-recovery" aria-label={t("workspace.draft.label")}>
          <div><strong>{t("workspace.draft.continue")}</strong><p>{recoverableDraft.title || t("workspace.matter.new")}</p></div>
          <button className="secondary-button" onClick={() => void resumeDraft()}>{t("workspace.draft.resume")}</button>
          <button className="text-button" onClick={discardRecoveredDraft}>{t("workspace.draft.discard")}</button>
        </section>}
        {loadError && <div className="workspace-refresh" role="status"><span>{t("workspace.refresh.lastLoaded")}</span><button type="button" onClick={() => void loadWorkspace()}>{t("workspace.refresh.retry")}</button></div>}
        {loading && session && <div className="workspace-refresh" role="status">{t("workspace.refresh.busy")}</div>}
        <div className="motion-page" key={activeNav}>{activeNav === "overview" ? showOverview() : showSection()}</div>
      </main>

      <nav className="mobile-navigation" aria-label={t("workspace.nav.mobilePrimary")}>
        {mobileNavigation.map(({ id, icon: Icon }) => {
          const isActive = isMobilePrimaryActive(id, activeNav);
          return (
            <button
              type="button"
              key={id}
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
              onClick={() => void navigateWorkspace(id)}
            >
              <Icon size={22} weight="regular" aria-hidden="true" />
              <span>{t(`workspace.nav.${id}`)}</span>
            </button>
          );
        })}
      </nav>

      {drawer?.type === "first-use-guide" && (
        <Drawer
          title={drawer.step === 1 ? t("workspace.guide.setup") : t("workspace.guide.firstMatter")}
          eyebrow={t("workspace.guide.optional")}
          closeLabel={t("workspace.guide.saveExit")}
          busy={busy}
          error={activeDrawerError}
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
        <Drawer title={drawer.type === "matter-create" ? t("workspace.matter.new") : t("workspace.matter.edit")} busy={busy || panelBusy} onClose={closeDrawer}>
          <MatterForm draft={drawer} onChange={drawer.type === "matter-create" ? updateNewMatterDraft : updateMatterDraft}
            onManageSharing={drawer.type === "matter" ? () => { setSharingMatterId(drawer.id); setDrawer(null); setActiveNav("contacts"); } : undefined}
            onArchive={drawer.type === "matter" ? () => void archiveCurrentMatter() : undefined}
            busy={busy} isNew={drawer.type === "matter-create"} persistenceFailed={draftPersistenceFailed}
            onReload={drawer.conflict ? () => void reloadCurrentDraft() : undefined}
            onSave={() => void (drawer.type === "matter-create" ? saveNewMatter() : saveMatter())} />
        </Drawer>
      )}

      {drawer?.type === "settings" && (
        <Drawer title={t("workspace.settings.official")} eyebrow={t("workspace.settings.checklist")} busy={busy || panelBusy} error={activeDrawerError} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <p className="contact-evidence">{t("workspace.settings.selfReported")}</p>
          <div className="check-list">{officialCheckDefinitions.map((item) => {
            const check = checks.find((candidate) => candidate.providerKey === item.key);
            return <label key={item.key}><span><strong>{item.label}</strong></span><input type="checkbox" disabled={!check || busy} checked={check?.completed ?? false} onChange={() => check && toggleCheck(check.publicId)} /></label>;
          })}</div>
          <button className="primary-button drawer-primary" disabled={busy} onClick={() => void saveOfficialChecks()}>{busy ? t("workspace.settings.saving") : t("workspace.settings.saveReview")} {!busy && <Check size={20} />}</button>
          <details className="task-details"><summary>{t("workspace.settings.whatRecorded")}</summary><p>{t("workspace.settings.providerBoundary")}</p></details>
        </Drawer>
      )}

      {currentProviderGuide && drawer?.type === "provider-guide" && (
        <Drawer title={currentProviderGuide.label} onClose={closeDrawer}>
          <ProviderGuidePanel key={currentProviderGuide.key} guide={currentProviderGuide}
            mark={<ProviderMark providerKey={currentProviderGuide.key} label={currentProviderGuide.label} />}
            onReviewStatus={selfReportedProviderKeys.includes(currentProviderGuide.key) ? () => setDrawer({ type: "settings" }) : undefined} />
        </Drawer>
      )}

      {drawer?.type === "safety" && <Drawer title={t("workspace.safety.title")} onClose={closeDrawer}><SafetyPanel /></Drawer>}

      {drawer?.type === "contact" && (
        <Drawer title={editingContact ? t("workspace.contact.edit") : t("workspace.contact.invite")} busy={busy || panelBusy} error={activeDrawerError} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <ContactEditorPanel key={editingContact?.publicId ?? "new"} contact={editingContact} apiClient={api} onSaved={contactSaved} onDirtyChange={setPanelHasChanges} onBusyChange={setPanelBusy} />
        </Drawer>
      )}

      {sharingContact && <Drawer title={t("workspace.contact.shareWith", { name: sharingContact.displayName })} busy={panelBusy} onClose={closeDrawer}>
        <ContactSharingPanel key={sharingContact.publicId} contact={sharingContact} matters={matters} focusMatterId={sharingMatterId} apiClient={api} onDirtyChange={setPanelHasChanges} onBusyChange={setPanelBusy} onChanged={() => setSharingRefreshVersion((value) => value + 1)} />
      </Drawer>}
      {FutureNoticePanel && drawer?.type === "future-notice" && contacts.find(person => person.publicId === drawer.id) &&
        <Drawer title={t("future.title")} busy={panelBusy} onClose={closeDrawer}>
          <Suspense fallback={<p role="status">{t("future.loading")}</p>}><FutureNoticePanel key={drawer.id}
            contact={contacts.find(person => person.publicId === drawer.id)} apiClient={api}
            onDirtyChange={setPanelHasChanges} onBusyChange={setPanelBusy}/></Suspense>
        </Drawer>}

      {drawer?.type === "start-here" && (
        <Drawer title={t("workspace.start.title")} eyebrow={t("workspace.start.minimum")} busy={busy || panelBusy} error={activeDrawerError} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <StartHerePanel apiClient={api} onGenerated={handleStartHereGenerated} onBusyChange={setPanelBusy} onExitWarning={setPanelExitWarning} />
        </Drawer>
      )}

      {drawer?.type === "disclosure-rehearsal" && (
        <Drawer title={t("workspace.rehearsal.title")} eyebrow={t("workspace.rehearsal.private")} busy={busy || panelBusy} error={activeDrawerError} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
          <DisclosureRehearsalPanel apiClient={api} onChanged={handleStartHereGenerated} onBusyChange={setPanelBusy} />
        </Drawer>
      )}

      {drawer?.type === "role-policy" && (
        <Drawer title={t("workspace.role.title")} eyebrow={t("workspace.role.policy")} busy={busy || panelBusy} error={activeDrawerError} onReload={drawer?.conflict ? () => void reloadCurrentDraft() : undefined} onClose={closeDrawer}>
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
      {toast && <div className="toast" role={toastKind === "error" ? "alert" : "status"}>{toastKind === "error" ? <Info size={19} /> : <CheckCircle size={19} weight="fill" />} {typeof toast === "string" ? toast : toast.key ? t(toast.key, toast.params) : errorMessage(toast.error, toast.fallbackKey)}</div>}
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

function formatAuditAction(event, t) {
  const action = event.action === "family_review.responded"
    ? { confirmed: "family_review.confirmed", needs_update: "family_review.needs_update", suggested: "family_review.suggested" }[event.metadata?.response] ?? event.action
    : event.action;
  return t(auditActionKeys.has(action) ? `workspace.audit.${action}` : "workspace.audit.recorded");
}

const auditActionKeys = new Set([
  "sharing.invitation_created",
  "sharing.invitation_regenerated",
  "sharing.invitation_accepted",
  "sharing.scope_updated",
  "sharing.connection_revoked",
  "family_review.created",
  "family_review.responded",
  "family_review.confirmed",
  "family_review.needs_update",
  "family_review.suggested",
  "family_review.approve",
  "family_review.reject",
  "family_review.cancel",
  "family_review.reissue",
  "matter.created",
  "matter.updated",
  "matter.archived",
  "matter.restored",
  "trusted_contact.created",
  "trusted_contact.updated",
  "official_setup.self_reported",
  "simulation.completed",
  "disclosure_rehearsal.created",
  "disclosure_rehearsal.advance",
  "disclosure_rehearsal.simulate_cooling_off_elapsed",
  "disclosure_rehearsal.appeal",
  "disclosure_rehearsal.restart_review",
  "disclosure_rehearsal.cancel",
  "role_assignment.created",
  "role_assignment.updated",
  "role_assignment.revoked",
  "export.previewed",
  "export.generated",
  "export.encryption_prepared",
  "export.encrypted",
  "plan.updated"
]);
