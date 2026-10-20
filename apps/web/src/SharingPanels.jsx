import { InvitationQr } from "./InvitationQr.jsx";
export { InvitationQr } from "./InvitationQr.jsx";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { MatterAccountGuides } from "./MatterAccountGuides.jsx";
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FUTURE_NOTICES_ENABLED } from "./futureNoticeFeature.js";
import { ArrowLeft, ArrowRight, Check, CheckCircle, Copy, Envelope, FileText, LinkSimple, LockKey, Plus, ShareNetwork, UserCircle, Users, ArrowClockwise } from "@phosphor-icons/react";
import { ConnectionVisual, InvitationSteps, InviteAction } from "./SharingMotion.jsx";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import { sharingLevels, connectionStatus, savedCopyLabel, sharedFieldLabels, sharedFieldValue, sharingMessage, sharedCategoryLabel } from "./sharing.js";
import "./sharing.css";

const canonical = (grants) => JSON.stringify([...grants].sort((a, b) => a.matterPublicId.localeCompare(b.matterPublicId)));
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const FutureNoticesInbox = FUTURE_NOTICES_ENABLED ? lazy(() => import("./FutureNoticePanels.jsx").then(module => ({ default: module.FutureNoticesInbox }))) : null;

export function PeoplePanel({ contacts, apiClient, onAdd, onEdit, onShare, onIncoming, onFutureNotice, refreshVersion, matterContext, onReturnToMatter }) {
  const { t, errorMessage } = useI18n();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setConnections((await apiClient.getSharingConnections()).connections); }
    catch (failure) { setError({ cause: failure, key: "sharing.people.loadError" }); }
    finally { setLoading(false); }
  }, [apiClient]);
  useEffect(() => { void load(); }, [load, refreshVersion]);
  useEffect(() => { const refresh = () => void load(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, [load]);
  return <div className="people-panel">
    {matterContext && <button className="text-button" onClick={onReturnToMatter}><ArrowLeft size={18}/>{t("sharing.people.back", { name: matterContext.title })}</button>}
    <InviteAction onInvite={onAdd} /><div className="people-toolbar"><span className="sharing-expiry">{matterContext ? t("sharing.people.access", { name: matterContext.title }) : t("sharing.people.yours")}</span><button className="icon-button" aria-label={t("sharing.people.refresh")} disabled={loading} onClick={() => void load()}><ArrowClockwise size={21} /></button></div>
    {error && <p className="drawer-alert" role="alert">{sharingMessage(error, t, errorMessage)}</p>}
    <div className="people-list">{contacts.filter((person) => !["revoked", "archived"].includes(person.status)).map((person) => {
      const connection = connections.find((item) => item.personPublicId === person.publicId);
      const grant = connection?.status !== "revoked" && connection?.grants.find(item => item.matterPublicId === matterContext?.id);
      const scope = matterContext ? grant ? `${t(`sharing.level.${grant.detailLevel}`)} · ` : t("sharing.people.notShared") : "";
      return <div className={`person-row${FUTURE_NOTICES_ENABLED && onFutureNotice ? " has-future" : ""}`} key={person.publicId}>
        <button className="person-main" onClick={() => onShare(person)}><span className="person-avatar" aria-hidden="true">{initials(person.displayName)}</span><span><strong>{person.displayName}</strong><small>{loading ? t("sharing.people.checking") : error ? t("sharing.people.unavailable") : scope + (FUTURE_NOTICES_ENABLED && !connection ? t("future.noLiveSharing") : connectionStatus(connection, t))}</small></span><ArrowRight size={20} aria-hidden="true" /></button>
        <button className="text-button person-edit" aria-label={t("sharing.people.edit", { name: person.displayName })} onClick={() => onEdit(person)}>{t("sharing.common.edit")}</button>
        {FUTURE_NOTICES_ENABLED && onFutureNotice && <button className="text-button person-future" aria-label={t("future.forPerson", { name: person.displayName })} onClick={() => onFutureNotice(person)}><LockKey size={18}/>{t("future.title")}</button>}
      </div>;
    })}</div>
    <button className="shared-inbox-entry" onClick={onIncoming}><Users size={28} aria-hidden="true" /><span>{t("sharing.people.incoming")}</span><ArrowRight size={20} aria-hidden="true" /></button>
  </div>;
}

export function ContactSharingPanel({ contact, matters, apiClient, onDirtyChange, onBusyChange, onChanged, focusMatterId }) {
  const { t, formatDate, errorMessage } = useI18n();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewRetry, setPreviewRetry] = useState(0);
  const [connection, setConnection] = useState(null);
  const [access, setAccess] = useState(null);
  const [otherConnections, setOtherConnections] = useState([]);
  const loadGeneration = useRef(0);
  const connectionVersion = useRef(null);
  const [grants, setGrants] = useState([]);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { confirm, confirmation } = useConfirmation();
  const active = connection && connection.status !== "revoked";
  const replacement = !active && access?.enforcementEnabled && access.limit === 1 && access.used >= 1
    ? otherConnections.find(item => item.publicId === access.freeConnectionPublicId) : null;
  const grantChanged = canonical(grants) !== canonical(active ? connection.grants : []);
  const dirty = grantChanged || Boolean(email.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailError = emailTouched && !emailValid && (!active || Boolean(email.trim()));
  useLayoutEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useLayoutEffect(() => onBusyChange?.(loading || busy), [loading, busy, onBusyChange]);
  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setLoading(true); setError("");
    try {
      const [connections, capacity] = await Promise.all([apiClient.getSharingConnections(), apiClient.getSharingAccess()]);
      if (generation !== loadGeneration.current) return;
      const latest = connections.connections.find((item) => item.personPublicId === contact.publicId) ?? null;
      setAccess(capacity.access);
      setOtherConnections(connections.connections);
      if (["accepted", "revoked", "expired"].includes(latest?.status) || latest?.access?.mode === "paused" || (connectionVersion.current !== null && connectionVersion.current !== latest?.version)) {
        setInviteUrl(""); setShowLink(false);
      }
      connectionVersion.current = latest?.version ?? null;
      setConnection(latest); setGrants(latest && latest.status !== "revoked" ? latest.grants : []); setEmail(""); setEmailTouched(false);
    } catch (failure) { if (generation === loadGeneration.current) setError({ cause: failure, key: "sharing.contact.loadError" }); }
    finally { if (generation === loadGeneration.current) setLoading(false); }
  }, [apiClient, contact.publicId]);
  useEffect(() => { void load(); return () => { loadGeneration.current += 1; }; }, [load]);
  useEffect(() => {
    const refresh = () => { if (!dirty && !busy) void load(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load, dirty, busy]);

  const grantKey = canonical(grants);
  useEffect(() => {
    let current = true; setPreview(null); setPreviewError("");
    if (previewOpen) apiClient.previewSharing(JSON.parse(grantKey), active && connection.access ? connection.publicId : undefined).then(value => { if (current) setPreview(value); })
      .catch(failure => { if (current) setPreviewError({ cause: failure, key: "sharing.contact.previewError" }); });
    return () => { current = false; };
  }, [apiClient, grantKey, previewOpen, previewRetry, connection?.publicId, connection?.version, connection?.access?.mode, active]);

  function toggle(id) {
    setGrants((items) => items.some((item) => item.matterPublicId === id)
      ? items.filter((item) => item.matterPublicId !== id) : [...items, { matterPublicId: id, detailLevel: "name" }]);
  }
  function apply(result) {
    loadGeneration.current += 1;
    connectionVersion.current = result.connection.version;
    setConnection(result.connection); setGrants(result.connection.grants); setEmail(""); setEmailTouched(false);
    if (result.invitationUrl) { setInviteUrl(result.invitationUrl); setShowLink(true); setCopied(false); }
    if (result.connection.access?.mode === "paused" || ["accepted", "revoked", "expired"].includes(result.connection.status)) { setInviteUrl(""); setShowLink(false); }
    setSaved(true); onChanged?.();
    if (result.access) setAccess(result.access);
    else apiClient.getSharingAccess().then(value => setAccess(value.access)).catch(() => setAccess(null));
  }
  async function selectLive(useFreeSlot) {
    if (!active || !access || busy || dirty) return;
    if (useFreeSlot && !await confirm({ titleKey: "sharing.confirm.usePlaceTitle", messageKey: "sharing.confirm.usePlaceBody", confirmLabelKey: "sharing.contact.usePlace", cancelLabelKey: "sharing.confirm.keepChoice" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.selectSharingLive(connection.publicId, { expectedVersion: connection.version, expectedAccessVersion: access.version, useFreeSlot })); }
    catch (failure) { setError({ cause: failure, key: "sharing.contact.resumeError" }); }
    finally { setBusy(false); }
  }
  async function save() {
    if (busy || loading || (!active && !emailValid)) return;
    if (replacement && !await confirm({ titleKey: "sharing.confirm.replacePersonTitle", messageKey: "sharing.confirm.replacePersonBody", params: { name: replacement.personName, recipient: contact.displayName }, confirmLabelKey: "sharing.confirm.replaceAndInvite", cancelLabelKey: "sharing.common.keepEditing" })) return;
    setBusy(true); setError("");
    try {
      if (!active) apply(await apiClient.createSharingConnection({ personPublicId: contact.publicId, email: email.trim(), grants,
        ...(replacement ? { replaceConnection: { publicId: replacement.publicId, expectedVersion: replacement.version, expectedAccessVersion: access.version } } : {}) }));
      else if (email.trim() && connection.status !== "accepted") apply(await apiClient.regenerateSharingLink(connection.publicId, { expectedVersion: connection.version, email: email.trim(), grants }));
      else apply(await apiClient.updateSharingConnection(connection.publicId, { expectedVersion: connection.version, grants }));
    } catch (failure) { setError({ cause: failure, key: "sharing.contact.saveError" }); }
    finally { setBusy(false); }
  }
  async function regenerate() {
    if (!active || connection.status === "accepted" || busy) return;
    if (!await confirm({ titleKey: "sharing.confirm.replaceLinkTitle", messageKey: "sharing.confirm.replaceLinkBody", confirmLabelKey: "sharing.contact.newLink", cancelLabelKey: "sharing.confirm.keepLink" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.regenerateSharingLink(connection.publicId, { expectedVersion: connection.version, grants })); }
    catch (failure) { setError({ cause: failure, key: "sharing.contact.linkError" }); }
    finally { setBusy(false); }
  }
  async function revoke() {
    if (!active || !await confirm({ titleKey: "sharing.confirm.stopTitle", messageKey: "sharing.confirm.stopBody", confirmLabelKey: "sharing.contact.stop", cancelLabelKey: "sharing.confirm.keepSharing" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.revokeSharingConnection(connection.publicId, connection.version)); setGrants([]); setInviteUrl(""); setShowLink(false); }
    catch (failure) { setError({ cause: failure, key: "sharing.contact.revokeError" }); }
    finally { setBusy(false); }
  }
  async function pauseLive() {
    if (!active || !access || busy || dirty || !await confirm({ titleKey: "sharing.confirm.pauseTitle", messageKey: "sharing.confirm.pauseBody", confirmLabelKey: "sharing.confirm.pause", cancelLabelKey: "sharing.confirm.keepUpdating" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.pauseSharingLive(connection.publicId, { expectedVersion: connection.version, expectedAccessVersion: access.version })); }
    catch (failure) { setError({ cause: failure, key: "sharing.contact.pauseError" }); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="sharing-loading" role="status"><Users size={44} /><p>{t("sharing.contact.loading")}</p></div>;
  return <div className="contact-sharing-panel">
    {confirmation}
    {error && <div className="drawer-alert" role="alert"><p>{sharingMessage(error, t, errorMessage)}</p><button className="text-button" disabled={busy} onClick={async () => { if (!dirty || await confirm({ titleKey: "sharing.confirm.replaceDraftTitle", messageKey: "sharing.confirm.replaceDraftBody", confirmLabelKey: "sharing.confirm.loadLatest", cancelLabelKey: "sharing.common.keepEditing" })) void load(); }}>{t("sharing.contact.reload")}</button></div>}
    {connection?.status !== "accepted" && <InvitationSteps current={showLink ? 2 : 1} />}
    {showLink && inviteUrl ? <div className="invitation-ready">
      <button className="text-button" onClick={() => setShowLink(false)}><ArrowLeft size={18} />{t("sharing.contact.settings")}</button>
      <h2>{t("sharing.contact.ready")}</h2><p className="sharing-email-hint"><Envelope size={18} />{connection?.emailHint}</p>
      <InvitationQr value={inviteUrl} /><p className="sharing-expiry">{t("sharing.contact.linkHint")}</p>
      <div className="sharing-link-actions"><button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); } catch { setError("sharing.contact.copyError"); } }}>{copied ? <CheckCircle size={20} /> : <Copy size={20} />}{copied ? t("sharing.common.copied") : t("sharing.contact.copyLink")}</button>
        {typeof navigator.share === "function" && <button className="primary-button" onClick={async () => { try { await navigator.share({ title: t("sharing.contact.invitationTitle"), url: inviteUrl }); } catch (failure) { if (failure.name !== "AbortError") setError("sharing.contact.shareError"); } }}><ShareNetwork size={20} />{t("sharing.contact.share")}</button>}</div>
      <p className="sharing-expiry">{t("sharing.contact.waitingExpires", { date: formatDate(connection.expiresAt) })}</p>
      <details className="task-details"><summary>{t("sharing.contact.invitationLink")}</summary><input className="share-url-field" readOnly value={inviteUrl} aria-label={t("sharing.contact.invitationLink")} onFocus={(event) => event.target.select()} /></details>
    </div> : <>
      <div className="sharing-person-heading"><ConnectionVisual status={connection?.status} compact /><span><strong>{contact.displayName}</strong><small>{connectionStatus(connection, t)}</small></span></div>
      {access?.enforcementEnabled && <p className="sharing-expiry">{t("sharing.contact.capacity", { used: access.used, count: access.limit })}</p>}
      {!active ? <label className="field-label">{t("sharing.contact.requiredEmail")}<input type="email" autoComplete="off" placeholder="person@example.com" value={email} disabled={busy} onBlur={() => setEmailTouched(true)} aria-invalid={emailError || undefined} aria-describedby="sharing-email-feedback" onChange={(event) => setEmail(event.target.value)} /></label>
        : <p className="sharing-email-hint"><Envelope size={18} />{connection.emailHint}</p>}
      {!active && <p id="sharing-email-feedback" className="sharing-expiry" role={emailError ? "alert" : undefined}>{t(emailError ? "sharing.contact.invalidEmail" : "sharing.contact.emailNeeded")}</p>}
      <h3 className="sharing-section-title">{t("sharing.contact.chooseMatters")}</h3>
      <div className="sharing-matter-list">{[...matters].sort((a, b) => Number(b.id === focusMatterId) - Number(a.id === focusMatterId)).map((matter) => {
        const grant = grants.find((item) => item.matterPublicId === matter.id);
        const blocked = matter.desiredOutcome === "never_disclose";
        const level = sharingLevels.find((item) => item.value === grant?.detailLevel);
        return <div className="sharing-matter" key={matter.id} data-selected={Boolean(grant)}>
          <label><FileText size={22} aria-hidden="true" /><strong>{matter.label}</strong>{blocked ? <span className="sharing-private"><LockKey size={18} />{t("sharing.contact.private")}</span> : <input type="checkbox" checked={Boolean(grant)} disabled={busy} onChange={() => toggle(matter.id)} />}</label>
          {grant && !blocked && <><div className="sharing-levels" role="group" aria-label={t("sharing.contact.detailFor", { name: matter.label })}>{sharingLevels.map((choice) => <button type="button" key={choice.value} disabled={busy} aria-pressed={grant.detailLevel === choice.value} onClick={() => setGrants((items) => items.map((item) => item.matterPublicId === matter.id ? { ...item, detailLevel: choice.value } : item))}>{t(`sharing.level.${choice.value}`)}</button>)}</div><p className="sharing-level-description">{t(`sharing.level.${level.value}Description`)}</p></>}
        </div>;
      })}</div>
      {matters.length === 0 && <p className="sharing-expiry">{t("sharing.contact.chooseLater")}</p>}
      <button className="primary-button drawer-primary" disabled={busy || (!active ? !emailValid : !dirty || (email.trim() && !emailValid))} onClick={() => void save()}>{busy ? t("sharing.common.saving") : replacement ? t("sharing.contact.replacePerson") : !active || email.trim() ? t("sharing.contact.createLink") : t("sharing.contact.saveSharing")}<ArrowRight size={20} /></button>
      {saved && !dirty && <p className="sharing-expiry" role="status"><CheckCircle size={18} />{connection?.status === "revoked" ? t("sharing.contact.stopped") : t("sharing.contact.saved")}</p>}
      {active && connection.status !== "accepted" && <>
        <button className="secondary-button" disabled={busy || dirty} onClick={() => inviteUrl ? setShowLink(true) : void regenerate()}><LinkSimple size={19} />{inviteUrl ? t("sharing.contact.showInvitation") : t("sharing.contact.newLink")}</button>
        <details className="task-details"><summary>{t("sharing.contact.changeEmail")}</summary><label className="field-label">{t("sharing.contact.newEmail")}<input type="email" value={email} disabled={busy} onBlur={() => setEmailTouched(true)} aria-invalid={emailError || undefined} aria-describedby={emailError ? "sharing-email-feedback" : undefined} onChange={(event) => setEmail(event.target.value)} /></label>{emailError && <p id="sharing-email-feedback" className="sharing-expiry" role="alert">{t("sharing.contact.invalidEmail")}</p>}</details>
      </>}
      {active && <button className="text-button danger-text sharing-revoke" disabled={busy} onClick={() => void revoke()}>{t("sharing.contact.stop")}</button>}
      {active && access?.enforcementEnabled && connection.status !== "expired" && <>
        {connection.access?.isFreeRecipient ? <p className="sharing-expiry">{t("sharing.contact.includedPlace")}</p> : <button className="text-button" disabled={busy || dirty} onClick={() => void selectLive(true)}>{t("sharing.contact.usePlace")}</button>}
        {connection.access?.mode !== "live" && access.paidUntil && <button className="secondary-button" disabled={busy || dirty} onClick={() => void selectLive(false)}>{t("sharing.contact.resume")}</button>}
        {connection.access?.mode === "live" && <button className="text-button" disabled={busy || dirty} onClick={() => void pauseLive()}>{t("sharing.contact.pause")}</button>}
      </>}
      <details className="task-details" onToggle={event => setPreviewOpen(event.currentTarget.open)}><summary><LockKey size={18} />{t("sharing.contact.visibleDetails")}</summary>
        {previewError ? <div role="alert"><p>{sharingMessage(previewError, t, errorMessage)}</p><button className="text-button" onClick={() => setPreviewRetry(value => value + 1)}>{t("sharing.contact.retryPreview")}</button></div> : preview ? <>
          {preview.accessMode === "saved" && <p>{t("sharing.contact.savedPreview")}</p>}{preview.items.length === 0 && <p>{grants.length ? t("sharing.contact.noSavedCopy") : t("sharing.contact.noneSelected")}</p>}
          {preview.items.map(item => <section className="shared-item-detail" key={item.matterPublicId}><h3>{item.fields.title}</h3><p className="sharing-expiry">{sharedCategoryLabel(item.fields.category, t)}</p><SharedFields fields={item.fields} level={item.detailLevel}/></section>)}
          <p>{t("sharing.contact.previewBoundary")}</p>
        </> : <p role="status">{t("sharing.contact.loadingPreview")}</p>}
      </details>
    </>}
  </div>;
}


export function SharedWithMePanel({ apiClient }) {
  const { t, formatDate, errorMessage } = useI18n();
  const [data, setData] = useState(null); const [selected, setSelected] = useState(null); const [error, setError] = useState(""); const [needsSignIn, setNeedsSignIn] = useState(false);
  const sequence = useRef(0);
  const inFlight = useRef(false);
  const load = useCallback(async ({ quiet = false } = {}) => {
    const request = ++sequence.current; inFlight.current = true; setError(""); if (!quiet) setData(null);
    try {
      const current = await apiClient.getSharedWithMe();
      if (request !== sequence.current) return null;
      setData(current); setNeedsSignIn(false); return current;
    } catch (failure) {
      if (request !== sequence.current) return null;
      setData(null); setNeedsSignIn(failure.status === 401); setError({ cause: failure, key: "sharing.incoming.loadError" }); return null;
    } finally { if (request === sequence.current) inFlight.current = false; }
  }, [apiClient]);
  useEffect(() => {
    void load();
    const refresh = () => void load();
    const visibility = () => { if (document.hidden) { sequence.current += 1; inFlight.current = false; setData(null); } else void load(); };
    const recheck = window.setInterval(() => { if (!document.hidden && !inFlight.current) void load({ quiet: true }); }, 15_000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", visibility);
    return () => { sequence.current += 1; window.clearInterval(recheck); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", visibility); };
  }, [load]);
  const selectedItem = data?.items.find((item) => `${item.connectionPublicId}:${item.matterPublicId}` === selected);
  if (error) return <div className="drawer-alert" role="alert"><p>{sharingMessage(error, t, errorMessage)}</p>{needsSignIn ? <a className="secondary-button" href="/account?next=shared">{t("sharing.incoming.signIn")}</a> : <button className="secondary-button" onClick={() => void load()}>{t("sharing.common.retry")}</button>}</div>;
  if (!data) return <div className="sharing-loading" role="status"><Users size={42} />{t("sharing.incoming.loading")}</div>;
  if (selected && !selectedItem) return <div className="shared-item-detail"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={18}/>{t("sharing.incoming.all")}</button><p role="status">{t("sharing.incoming.accessChanged")}</p></div>;
  if (selectedItem) return <div className="shared-item-detail"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={18} />{t("sharing.incoming.all")}</button><div className="task-symbol"><FileText size={54} /></div><h2>{selectedItem.fields.title}</h2><p className="sharing-expiry">{t("sharing.incoming.itemMeta", { name: selectedItem.ownerName, category: sharedCategoryLabel(selectedItem.fields.category, t) })}</p>{savedCopyLabel(selectedItem, t, formatDate) && <p className="sharing-expiry" role="status">{savedCopyLabel(selectedItem, t, formatDate)}</p>}<SharedFields fields={selectedItem.fields} level={selectedItem.detailLevel}/><MatterAccountGuides fields={selectedItem.fields}/></div>;
  return <div className="shared-with-me-panel">{FutureNoticesInbox && <Suspense fallback={<p role="status">{t("future.loading")}</p>}><FutureNoticesInbox apiClient={apiClient}/></Suspense>}<a className="incoming-action" href="/invite?from=shared"><LinkSimple size={22} /><span>{t("sharing.incoming.accept")}</span><ArrowRight size={20} /></a><div className="people-toolbar"><span className="sharing-expiry">{t("sharing.common.readOnly")}</span><button className="icon-button" aria-label={t("sharing.incoming.refresh")} onClick={() => void load()}><ArrowClockwise size={21} /></button></div>{data.connections.length === 0 ? <div className="task-empty"><ConnectionVisual status="pending" /><p>{t("sharing.incoming.empty")}</p></div> : data.connections.map((connection) => <section className="shared-owner" key={connection.publicId}><h3>{connection.ownerName}</h3>{connection.accessMode === "saved" && <p className="sharing-expiry">{t("sharing.incoming.savedCopies")}</p>}{data.items.filter((item) => item.connectionPublicId === connection.publicId).map((item) => <button className="shared-item-row" aria-label={t("sharing.incoming.openItem", { title: item.fields.title, name: item.ownerName })} key={item.matterPublicId} onClick={async () => { const id = `${item.connectionPublicId}:${item.matterPublicId}`; const current = await load(); if (current?.items.some((entry) => `${entry.connectionPublicId}:${entry.matterPublicId}` === id)) setSelected(id); }}><FileText size={24} /><strong>{item.fields.title}</strong><ArrowRight size={19} /></button>)}{!data.items.some((item) => item.connectionPublicId === connection.publicId) && <p className="sharing-expiry">{connection.accessMode === "paused" ? t("sharing.incoming.paused") : t("sharing.incoming.noMatters")}</p>}</section>)}</div>;
}

function CopySharedAddress({ value }) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  useEffect(() => setMessage(""), [value]);
  return <><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(value); setMessage("sharing.common.copied"); } catch { setMessage("sharing.incoming.copyFallback"); } }}><Copy size={17}/>{t("sharing.incoming.copyAddress")}</button>{message && <span role="status">{t(message)}</span>}</>;
}

function SharedFields({ fields, level }) {
  const { t } = useI18n(); return <>{level === "name" && <p className="sharing-expiry">{t("sharing.incoming.nameBoundary")}</p>}<dl>{Object.entries(sharedFieldLabels).filter(([key]) => fields[key] && !(key === "valueBand" && fields[key] === "unknown") && !(key === "desiredOutcome" && fields[key] === "undecided")).map(([key, label]) => <div key={key}><dt>{t(`sharing.field.${key}`)}</dt><dd>{sharedFieldValue(key, fields[key], t)}{key === "walletAddress" && <CopySharedAddress value={fields[key]}/>}</dd></div>)}</dl></>; }
