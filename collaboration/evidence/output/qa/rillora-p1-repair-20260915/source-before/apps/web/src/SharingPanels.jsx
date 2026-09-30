import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle, Copy, Envelope, FileText, LinkSimple, LockKey, Plus, ShareNetwork, UserCircle, Users, ArrowClockwise } from "@phosphor-icons/react";
import { ConnectionVisual, InvitationSteps, InviteAction } from "./SharingMotion.jsx";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import { sharingLevels, sharingStatus, sharedFieldLabels } from "./sharing.js";
import "./sharing.css";

const canonical = (grants) => JSON.stringify([...grants].sort((a, b) => a.matterPublicId.localeCompare(b.matterPublicId)));
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export function PeoplePanel({ contacts, apiClient, onAdd, onEdit, onShare, onIncoming, refreshVersion }) {
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
    <InviteAction onInvite={onAdd} /><div className="people-toolbar"><span className="sharing-expiry">Your people</span><button className="icon-button" aria-label="Refresh connections" disabled={loading} onClick={() => void load()}><ArrowClockwise size={21} /></button></div>
    {error && <p className="drawer-alert" role="alert">{error}</p>}
    <div className="people-list">{contacts.filter((person) => !["revoked", "archived"].includes(person.status)).map((person) => {
      const connection = connections.find((item) => item.personPublicId === person.publicId);
      return <div className="person-row" key={person.publicId}>
        <button className="person-main" onClick={() => onShare(person)}><span className="person-avatar" aria-hidden="true">{initials(person.displayName)}</span><span><strong>{person.displayName}</strong><small>{loading ? "Checking connection…" : error ? "Connection unavailable" : sharingStatus[connection?.status] ?? "Not invited"}</small></span><ArrowRight size={20} aria-hidden="true" /></button>
        <button className="text-button person-edit" aria-label={`Edit ${person.displayName}`} onClick={() => onEdit(person)}>Edit</button>
      </div>;
    })}</div>
    <button className="shared-inbox-entry" onClick={onIncoming}><Users size={28} aria-hidden="true" /><span>Shared with me</span><ArrowRight size={20} aria-hidden="true" /></button>
  </div>;
}

export function ContactSharingPanel({ contact, matters, apiClient, onDirtyChange, onBusyChange, onChanged }) {
  const [connection, setConnection] = useState(null);
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
  const grantChanged = canonical(grants) !== canonical(active ? connection.grants : []);
  const dirty = grantChanged || Boolean(email.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => onBusyChange?.(loading || busy), [loading, busy, onBusyChange]);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const latest = (await apiClient.getSharingConnections()).connections.find((item) => item.personPublicId === contact.publicId) ?? null;
      if (latest?.status === "accepted" || latest?.status === "revoked" || (connectionVersion.current !== null && connectionVersion.current !== latest?.version)) {
        setInviteUrl(""); setShowLink(false);
      }
      connectionVersion.current = latest?.version ?? null;
      setConnection(latest); setGrants(latest && latest.status !== "revoked" ? latest.grants : []); setEmail("");
    } catch (failure) { setError(failure.message || "Sharing could not be loaded."); }
    finally { setLoading(false); }
  }, [apiClient, contact.publicId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const refresh = () => { if (!dirty && !busy) void load(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load, dirty, busy]);

  function toggle(id) {
    setGrants((items) => items.some((item) => item.matterPublicId === id)
      ? items.filter((item) => item.matterPublicId !== id) : [...items, { matterPublicId: id, detailLevel: "name" }]);
  }
  function apply(result) {
    connectionVersion.current = result.connection.version;
    setConnection(result.connection); setGrants(result.connection.grants); setEmail("");
    if (result.invitationUrl) { setInviteUrl(result.invitationUrl); setShowLink(true); setCopied(false); }
    setSaved(true); onChanged?.();
  }
  async function save() {
    if (busy || loading || (!active && !emailValid)) return;
    setBusy(true); setError("");
    try {
      if (!active) apply(await apiClient.createSharingConnection({ personPublicId: contact.publicId, email: email.trim(), grants }));
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
      <p className="sharing-expiry">Waiting for them to accept · Expires {new Date(connection.expiresAt).toLocaleDateString()}</p>
      <details className="task-details"><summary>Invitation link</summary><input className="share-url-field" readOnly value={inviteUrl} aria-label="Invitation link" onFocus={(event) => event.target.select()} /></details>
    </div> : <>
      <div className="sharing-person-heading"><ConnectionVisual status={connection?.status} compact /><span><strong>{contact.displayName}</strong><small>{sharingStatus[connection?.status] ?? "Not invited"}</small></span></div>
      {!active ? <label className="field-label">Recipient's sign-in email · Required<input type="email" autoComplete="off" placeholder="person@example.com" value={email} disabled={busy} onChange={(event) => setEmail(event.target.value)} /></label>
        : <p className="sharing-email-hint"><Envelope size={18} />{connection.emailHint}</p>}
      <h3 className="sharing-section-title">Choose what to share</h3>
      <div className="sharing-matter-list">{matters.map((matter) => {
        const grant = grants.find((item) => item.matterPublicId === matter.id);
        const blocked = matter.desiredOutcome === "never_disclose";
        const level = sharingLevels.find((item) => item.value === grant?.detailLevel);
        return <div className="sharing-matter" key={matter.id} data-selected={Boolean(grant)}>
          <label><FileText size={22} aria-hidden="true" /><strong>{matter.label}</strong>{blocked ? <span className="sharing-private"><LockKey size={18} />Private</span> : <input type="checkbox" checked={Boolean(grant)} disabled={busy} onChange={() => toggle(matter.id)} />}</label>
          {grant && !blocked && <><div className="sharing-levels" role="group" aria-label={`Detail shared for ${matter.label}`}>{sharingLevels.map((choice) => <button type="button" key={choice.value} disabled={busy} aria-pressed={grant.detailLevel === choice.value} onClick={() => setGrants((items) => items.map((item) => item.matterPublicId === matter.id ? { ...item, detailLevel: choice.value } : item))}>{choice.label}</button>)}</div><p className="sharing-level-description">{level.description}</p></>}
        </div>;
      })}</div>
      {matters.length === 0 && <p className="sharing-expiry">You can invite now and choose matters later.</p>}
      <button className="primary-button drawer-primary" disabled={busy || (!active ? !emailValid : !dirty || (email.trim() && !emailValid))} onClick={() => void save()}>{busy ? "Saving…" : !active || email.trim() ? "Create link & QR" : "Save sharing"}<ArrowRight size={20} /></button>
      {saved && !dirty && <p className="sharing-expiry" role="status"><CheckCircle size={18} />{connection?.status === "revoked" ? "Sharing stopped" : "Sharing saved"}</p>}
      {active && connection.status !== "accepted" && <>
        <button className="secondary-button" disabled={busy || dirty} onClick={() => inviteUrl ? setShowLink(true) : void regenerate()}><LinkSimple size={19} />{inviteUrl ? "Show invitation" : "Create new link"}</button>
        <details className="task-details"><summary>Change invited email</summary><label className="field-label">New sign-in email<input type="email" value={email} disabled={busy} onChange={(event) => setEmail(event.target.value)} /></label></details>
      </>}
      {active && <button className="text-button danger-text sharing-revoke" disabled={busy} onClick={() => void revoke()}>Stop sharing</button>}
      <details className="task-details"><summary><LockKey size={18} />Visible details</summary>{sharingLevels.map((level) => <p key={level.value}><strong>{level.label}:</strong> {level.value === "details" ? "All saved fields, including category details and Notes." : level.description}</p>)}<p>Read only. Unselected matters remain private.</p></details>
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
  const load = useCallback(async () => { setError(""); try { const current = await apiClient.getSharedWithMe(); setData(current); return current; } catch (failure) { setData(null); setSelected(null); setNeedsSignIn(failure.status === 401); setError(failure.message || "Shared information could not be loaded."); } }, [apiClient]);
  useEffect(() => { void load(); const refresh = () => void load(); window.addEventListener("focus", refresh); return () => window.removeEventListener("focus", refresh); }, [load]);
  const selectedItem = data?.items.find((item) => `${item.connectionPublicId}:${item.matterPublicId}` === selected);
  if (error) return <div className="drawer-alert" role="alert"><p>{error}</p>{needsSignIn ? <a className="secondary-button" href="/account?next=shared">Sign in to continue</a> : <button className="secondary-button" onClick={() => void load()}>Retry</button>}</div>;
  if (!data) return <div className="sharing-loading" role="status"><Users size={42} />Loading shared items…</div>;
  if (selectedItem) return <div className="shared-item-detail"><button className="text-button" onClick={() => setSelected(null)}><ArrowLeft size={18} />All shared items</button><div className="task-symbol"><FileText size={54} /></div><h2>{selectedItem.fields.title}</h2><p className="sharing-expiry">{selectedItem.ownerName} · {selectedItem.fields.category.replaceAll("_", " ")} · Read only</p><dl>{Object.entries(sharedFieldLabels).filter(([key]) => selectedItem.fields[key] && !(key === "valueBand" && selectedItem.fields[key] === "unknown") && !(key === "desiredOutcome" && selectedItem.fields[key] === "undecided")).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{["desiredOutcome", "valueBand", "importance"].includes(key) ? selectedItem.fields[key].replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()) : selectedItem.fields[key]}</dd></div>)}</dl></div>;
  return <div className="shared-with-me-panel"><a className="incoming-action" href="/invite"><LinkSimple size={22} /><span>Accept a received invitation</span><ArrowRight size={20} /></a><div className="people-toolbar"><span className="sharing-expiry">Read only</span><button className="icon-button" aria-label="Refresh shared items" onClick={() => void load()}><ArrowClockwise size={21} /></button></div>{data.connections.length === 0 ? <div className="task-empty"><ConnectionVisual status="pending" /><p>Nothing shared with you yet.</p></div> : data.connections.map((connection) => <section className="shared-owner" key={connection.publicId}><h3>{connection.ownerName}</h3>{data.items.filter((item) => item.connectionPublicId === connection.publicId).map((item) => <button className="shared-item-row" key={item.matterPublicId} onClick={async () => { const id = `${item.connectionPublicId}:${item.matterPublicId}`; const current = await load(); if (current?.items.some((entry) => `${entry.connectionPublicId}:${entry.matterPublicId}` === id)) setSelected(id); }}><FileText size={24} /><strong>{item.fields.title}</strong><ArrowRight size={19} /></button>)}{!data.items.some((item) => item.connectionPublicId === connection.publicId) && <p className="sharing-expiry">No matters shared with you yet.</p>}</section>)}</div>;
}
