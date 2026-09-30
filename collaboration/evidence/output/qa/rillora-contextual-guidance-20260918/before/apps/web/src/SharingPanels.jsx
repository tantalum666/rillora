import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle, Copy, Envelope, FileText, LinkSimple, LockKey, Plus, ShareNetwork, UserCircle, Users, ArrowClockwise } from "@phosphor-icons/react";
import { ConnectionVisual, InvitationSteps, InviteAction } from "./SharingMotion.jsx";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import { sharingLevels, connectionStatus, savedCopyLabel, sharedFieldLabels, sharedFieldValue } from "./sharing.js";
import "./sharing.css";

const canonical = (grants) => JSON.stringify([...grants].sort((a, b) => a.matterPublicId.localeCompare(b.matterPublicId)));
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export function PeoplePanel({ contacts, apiClient, onAdd, onEdit, onShare, onIncoming, refreshVersion, matterContext, onReturnToMatter }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setConnections((await apiClient.getSharingConnections()).connections); }
    catch (failure) { setError(failure.message || "Connections could not be loaded."); }
    finally { setLoading(false); }
  }, [apiClient]);
  useEffect(() => { void load(); }, [load, refreshVersion]);
  useEffect(() => { const refresh = () => void load(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, [load]);
  return <div className="people-panel">
    {matterContext && <button className="text-button" onClick={onReturnToMatter}><ArrowLeft size={18}/>Back to {matterContext.title}</button>}
    <InviteAction onInvite={onAdd} /><div className="people-toolbar"><span className="sharing-expiry">{matterContext ? `Access to ${matterContext.title}` : "Your people"}</span><button className="icon-button" aria-label="Refresh connections" disabled={loading} onClick={() => void load()}><ArrowClockwise size={21} /></button></div>
    {error && <p className="drawer-alert" role="alert">{error}</p>}
    <div className="people-list">{contacts.filter((person) => !["revoked", "archived"].includes(person.status)).map((person) => {
      const connection = connections.find((item) => item.personPublicId === person.publicId);
      const grant = connection?.status !== "revoked" && connection?.grants.find(item => item.matterPublicId === matterContext?.id);
      const scope = matterContext ? grant ? `${sharingLevels.find(level => level.value === grant.detailLevel)?.label} · ` : "Not shared · " : "";
      return <div className="person-row" key={person.publicId}>
        <button className="person-main" onClick={() => onShare(person)}><span className="person-avatar" aria-hidden="true">{initials(person.displayName)}</span><span><strong>{person.displayName}</strong><small>{loading ? "Checking connection…" : error ? "Connection unavailable" : scope + connectionStatus(connection)}</small></span><ArrowRight size={20} aria-hidden="true" /></button>
        <button className="text-button person-edit" aria-label={`Edit ${person.displayName}`} onClick={() => onEdit(person)}>Edit</button>
      </div>;
    })}</div>
    <button className="shared-inbox-entry" onClick={onIncoming}><Users size={28} aria-hidden="true" /><span>Shared with me</span><ArrowRight size={20} aria-hidden="true" /></button>
  </div>;
}

export function ContactSharingPanel({ contact, matters, apiClient, onDirtyChange, onBusyChange, onChanged, focusMatterId }) {
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
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => onBusyChange?.(loading || busy), [loading, busy, onBusyChange]);
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
      setConnection(latest); setGrants(latest && latest.status !== "revoked" ? latest.grants : []); setEmail("");
    } catch (failure) { if (generation === loadGeneration.current) setError(failure.message || "Sharing could not be loaded."); }
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
      .catch(failure => { if (current) setPreviewError(failure.message || "The preview could not be loaded."); });
    return () => { current = false; };
  }, [apiClient, grantKey, previewOpen, previewRetry, connection?.publicId, connection?.version, connection?.access?.mode, active]);

  function toggle(id) {
    setGrants((items) => items.some((item) => item.matterPublicId === id)
      ? items.filter((item) => item.matterPublicId !== id) : [...items, { matterPublicId: id, detailLevel: "name" }]);
  }
  function apply(result) {
    loadGeneration.current += 1;
    connectionVersion.current = result.connection.version;
    setConnection(result.connection); setGrants(result.connection.grants); setEmail("");
    if (result.invitationUrl) { setInviteUrl(result.invitationUrl); setShowLink(true); setCopied(false); }
    if (result.connection.access?.mode === "paused" || ["accepted", "revoked", "expired"].includes(result.connection.status)) { setInviteUrl(""); setShowLink(false); }
    setSaved(true); onChanged?.();
    if (result.access) setAccess(result.access);
    else apiClient.getSharingAccess().then(value => setAccess(value.access)).catch(() => setAccess(null));
  }
  async function selectLive(useFreeSlot) {
    if (!active || !access || busy || dirty) return;
    if (useFreeSlot && !await confirm({ title: "Use your included place for this person?", message: "This person receives current updates. Your previous choice will keep only an eligible saved copy unless covered by Family.", confirmLabel: "Use included place", cancelLabel: "Keep current choice" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.selectSharingLive(connection.publicId, { expectedVersion: connection.version, expectedAccessVersion: access.version, useFreeSlot })); }
    catch (failure) { setError(failure.message || "Sharing could not be resumed."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (busy || loading || (!active && !emailValid)) return;
    if (replacement && !await confirm({ title: `Replace ${replacement.personName}'s current updates?`, message: `Your included place will move to ${contact.displayName}. ${replacement.personName} will keep only an eligible saved copy.`, confirmLabel: "Replace and create invitation", cancelLabel: "Keep editing" })) return;
    setBusy(true); setError("");
    try {
      if (!active) apply(await apiClient.createSharingConnection({ personPublicId: contact.publicId, email: email.trim(), grants,
        ...(replacement ? { replaceConnection: { publicId: replacement.publicId, expectedVersion: replacement.version, expectedAccessVersion: access.version } } : {}) }));
      else if (email.trim() && connection.status !== "accepted") apply(await apiClient.regenerateSharingLink(connection.publicId, { expectedVersion: connection.version, email: email.trim(), grants }));
      else apply(await apiClient.updateSharingConnection(connection.publicId, { expectedVersion: connection.version, grants }));
    } catch (failure) { setError(failure.message || "Sharing was not saved. Your selection is still here."); }
    finally { setBusy(false); }
  }
  async function regenerate() {
    if (!active || connection.status === "accepted" || busy) return;
    if (!await confirm({ title: "Replace the invitation link?", message: "The previous link will stop working.", confirmLabel: "Create new link", cancelLabel: "Keep current link" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.regenerateSharingLink(connection.publicId, { expectedVersion: connection.version, grants })); }
    catch (failure) { setError(failure.message || "The link could not be created."); }
    finally { setBusy(false); }
  }
  async function revoke() {
    if (!active || !await confirm({ title: "Stop sharing with this person?", message: "They lose future access. Copies they already kept cannot be erased.", confirmLabel: "Stop sharing", cancelLabel: "Keep sharing" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.revokeSharingConnection(connection.publicId, connection.version)); setGrants([]); setInviteUrl(""); setShowLink(false); }
    catch (failure) { setError(failure.message || "Access could not be revoked."); }
    finally { setBusy(false); }
  }
  async function pauseLive() {
    if (!active || !access || busy || dirty || !await confirm({ title: "Pause current updates?", message: "This frees a sharing place. Only an eligible paid-period saved copy remains available.", confirmLabel: "Pause updates", cancelLabel: "Keep updating" })) return;
    setBusy(true); setError("");
    try { apply(await apiClient.pauseSharingLive(connection.publicId, { expectedVersion: connection.version, expectedAccessVersion: access.version })); }
    catch (failure) { setError(failure.message || "Updates could not be paused."); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="sharing-loading" role="status"><Users size={44} /><p>Loading sharing…</p></div>;
  return <div className="contact-sharing-panel">
    {confirmation}
    {error && <div className="drawer-alert" role="alert"><p>{error}</p><button className="text-button" disabled={busy} onClick={async () => { if (!dirty || await confirm({ title: "Replace this draft?", message: "Your unsaved sharing choices will be replaced.", confirmLabel: "Load latest", cancelLabel: "Keep editing" })) void load(); }}>Reload current settings</button></div>}
    {connection?.status !== "accepted" && <InvitationSteps current={showLink ? 2 : 1} />}
    {showLink && inviteUrl ? <div className="invitation-ready">
      <button className="text-button" onClick={() => setShowLink(false)}><ArrowLeft size={18} />Sharing settings</button>
      <h2>Ready to share</h2><p className="sharing-email-hint"><Envelope size={18} />{connection?.emailHint}</p>
      <InvitationQr value={inviteUrl} /><p className="sharing-expiry">Send this link or let them scan the QR.</p>
      <div className="sharing-link-actions"><button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); } catch { setError("Copy was unavailable. Use Share or select the link below."); } }}>{copied ? <CheckCircle size={20} /> : <Copy size={20} />}{copied ? "Copied" : "Copy link"}</button>
        {typeof navigator.share === "function" && <button className="primary-button" onClick={async () => { try { await navigator.share({ title: "Rillora invitation", url: inviteUrl }); } catch (failure) { if (failure.name !== "AbortError") setError("Sharing could not be opened."); } }}><ShareNetwork size={20} />Share</button>}</div>
      <p className="sharing-expiry">Waiting for them to accept · Expires {new Date(connection.expiresAt).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</p>
      <details className="task-details"><summary>Invitation link</summary><input className="share-url-field" readOnly value={inviteUrl} aria-label="Invitation link" onFocus={(event) => event.target.select()} /></details>
    </div> : <>
      <div className="sharing-person-heading"><ConnectionVisual status={connection?.status} compact /><span><strong>{contact.displayName}</strong><small>{connectionStatus(connection)}</small></span></div>
      {access?.enforcementEnabled && <p className="sharing-expiry">{access.used} of {access.limit} sharing {access.limit === 1 ? "place" : "places"} used</p>}
      {!active ? <label className="field-label">Recipient's sign-in email · Required<input type="email" autoComplete="off" placeholder="person@example.com" value={email} disabled={busy} onChange={(event) => setEmail(event.target.value)} /></label>
        : <p className="sharing-email-hint"><Envelope size={18} />{connection.emailHint}</p>}
      <h3 className="sharing-section-title">Choose what to share</h3>
      <div className="sharing-matter-list">{[...matters].sort((a, b) => Number(b.id === focusMatterId) - Number(a.id === focusMatterId)).map((matter) => {
        const grant = grants.find((item) => item.matterPublicId === matter.id);
        const blocked = matter.desiredOutcome === "never_disclose";
        const level = sharingLevels.find((item) => item.value === grant?.detailLevel);
        return <div className="sharing-matter" key={matter.id} data-selected={Boolean(grant)}>
          <label><FileText size={22} aria-hidden="true" /><strong>{matter.label}</strong>{blocked ? <span className="sharing-private"><LockKey size={18} />Private</span> : <input type="checkbox" checked={Boolean(grant)} disabled={busy} onChange={() => toggle(matter.id)} />}</label>
          {grant && !blocked && <><div className="sharing-levels" role="group" aria-label={`Detail shared for ${matter.label}`}>{sharingLevels.map((choice) => <button type="button" key={choice.value} disabled={busy} aria-pressed={grant.detailLevel === choice.value} onClick={() => setGrants((items) => items.map((item) => item.matterPublicId === matter.id ? { ...item, detailLevel: choice.value } : item))}>{choice.label}</button>)}</div><p className="sharing-level-description">{level.description}</p></>}
        </div>;
      })}</div>
      {matters.length === 0 && <p className="sharing-expiry">You can invite now and choose matters later.</p>}
      <button className="primary-button drawer-primary" disabled={busy || (!active ? !emailValid : !dirty || (email.trim() && !emailValid))} onClick={() => void save()}>{busy ? "Saving…" : replacement ? "Replace included person" : !active || email.trim() ? "Create link & QR" : "Save sharing"}<ArrowRight size={20} /></button>
      {saved && !dirty && <p className="sharing-expiry" role="status"><CheckCircle size={18} />{connection?.status === "revoked" ? "Sharing stopped" : "Sharing saved"}</p>}
      {active && connection.status !== "accepted" && <>
        <button className="secondary-button" disabled={busy || dirty} onClick={() => inviteUrl ? setShowLink(true) : void regenerate()}><LinkSimple size={19} />{inviteUrl ? "Show invitation" : "Create new link"}</button>
        <details className="task-details"><summary>Change invited email</summary><label className="field-label">New sign-in email<input type="email" value={email} disabled={busy} onChange={(event) => setEmail(event.target.value)} /></label></details>
      </>}
      {active && <button className="text-button danger-text sharing-revoke" disabled={busy} onClick={() => void revoke()}>Stop sharing</button>}
      {active && access?.enforcementEnabled && connection.status !== "expired" && <>
        {connection.access?.isFreeRecipient ? <p className="sharing-expiry">Your included place</p> : <button className="text-button" disabled={busy || dirty} onClick={() => void selectLive(true)}>Use included place</button>}
        {connection.access?.mode !== "live" && access.paidUntil && <button className="secondary-button" disabled={busy || dirty} onClick={() => void selectLive(false)}>Resume current updates</button>}
        {connection.access?.mode === "live" && <button className="text-button" disabled={busy || dirty} onClick={() => void pauseLive()}>Pause current updates</button>}
      </>}
      <details className="task-details" onToggle={event => setPreviewOpen(event.currentTarget.open)}><summary><LockKey size={18} />Visible details</summary>
        {previewError ? <div role="alert"><p>{previewError}</p><button className="text-button" onClick={() => setPreviewRetry(value => value + 1)}>Retry preview</button></div> : preview ? <>
          {preview.accessMode === "saved" && <p>Updates paused · Currently visible saved copies</p>}{preview.items.length === 0 && <p>{grants.length ? "No saved copy is available for this selection. Resume updates to share new content." : "No matters selected."}</p>}
          {preview.items.map(item => <section className="shared-item-detail" key={item.matterPublicId}><h3>{item.fields.title}</h3><p className="sharing-expiry">{item.fields.category.replaceAll("_", " ")}</p><SharedFields fields={item.fields} level={item.detailLevel}/></section>)}
          <p>Read only. Unselected matters remain private.</p>
        </> : <p role="status">Loading visible details…</p>}
      </details>
    </>}
  </div>;
}

export function InvitationQr({ value }) {
  const [image, setImage] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true; setImage(""); setFailed(false);
    import("qrcode").then((module) => module.default.toDataURL(value, { width: 280, margin: 2, errorCorrectionLevel: "M" }))
      .then((url) => { if (active) setImage(url); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [value]);
  return <div className="invitation-qr">{image ? <img src={image} width="280" height="280" alt="Scan to open this invitation" /> : <span role="status">{failed ? "Use the invitation link below" : "Preparing QR code…"}</span>}</div>;
}

export function SharedWithMePanel({ apiClient }) {
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
      setData(null); setNeedsSignIn(failure.status === 401); setError(failure.message || "Shared information could not be loaded."); return null;
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
  if (error) return <div className="drawer-alert" role="alert"><p>{error}</p>{needsSignIn ? <a className="secondary-button" href="/account?next=shared">Sign in to continue</a> : <button className="secondary-button" onClick={() => void load()}>Retry</button>}</div>;
  if (!data) return <div className="sharing-loading" role="status"><Users size={42} />Loading shared items…</div>;
  if (selected && !selectedItem) return <div className="shared-item-detail"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={18}/>All shared items</button><p role="status">Access changed. This item is no longer shared with you.</p></div>;
  if (selectedItem) return <div className="shared-item-detail"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={18} />All shared items</button><div className="task-symbol"><FileText size={54} /></div><h2>{selectedItem.fields.title}</h2><p className="sharing-expiry">{selectedItem.ownerName} · {selectedItem.fields.category.replaceAll("_", " ")} · Read only</p>{savedCopyLabel(selectedItem) && <p className="sharing-expiry" role="status">{savedCopyLabel(selectedItem)}</p>}<SharedFields fields={selectedItem.fields} level={selectedItem.detailLevel}/></div>;
  return <div className="shared-with-me-panel"><a className="incoming-action" href="/invite?from=shared"><LinkSimple size={22} /><span>Accept a received invitation</span><ArrowRight size={20} /></a><div className="people-toolbar"><span className="sharing-expiry">Read only</span><button className="icon-button" aria-label="Refresh shared items" onClick={() => void load()}><ArrowClockwise size={21} /></button></div>{data.connections.length === 0 ? <div className="task-empty"><ConnectionVisual status="pending" /><p>No shared items.</p></div> : data.connections.map((connection) => <section className="shared-owner" key={connection.publicId}><h3>{connection.ownerName}</h3>{connection.accessMode === "saved" && <p className="sharing-expiry">Updates paused · Saved copies</p>}{data.items.filter((item) => item.connectionPublicId === connection.publicId).map((item) => <button className="shared-item-row" aria-label={`Open ${item.fields.title}, shared by ${item.ownerName}`} key={item.matterPublicId} onClick={async () => { const id = `${item.connectionPublicId}:${item.matterPublicId}`; const current = await load(); if (current?.items.some((entry) => `${entry.connectionPublicId}:${entry.matterPublicId}` === id)) setSelected(id); }}><FileText size={24} /><strong>{item.fields.title}</strong><ArrowRight size={19} /></button>)}{!data.items.some((item) => item.connectionPublicId === connection.publicId) && <p className="sharing-expiry">{connection.accessMode === "paused" ? "Updates paused. The sender can resume sharing." : "No matters shared with you yet."}</p>}</section>)}</div>;
}

function CopySharedAddress({ value }) {
  const [message, setMessage] = useState("");
  useEffect(() => setMessage(""), [value]);
  return <><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(value); setMessage("Copied"); } catch { setMessage("Select the address to copy it."); } }}><Copy size={17}/>Copy address</button>{message && <span role="status">{message}</span>}</>;
}

function SharedFields({ fields, level }) { return <>{level === "name" && <p className="sharing-expiry">Only the name and category are shared with you.</p>}<dl>{Object.entries(sharedFieldLabels).filter(([key]) => fields[key] && !(key === "valueBand" && fields[key] === "unknown") && !(key === "desiredOutcome" && fields[key] === "undecided")).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{sharedFieldValue(key, fields[key])}{key === "walletAddress" && <CopySharedAddress value={fields[key]}/>}</dd></div>)}</dl></>; }
