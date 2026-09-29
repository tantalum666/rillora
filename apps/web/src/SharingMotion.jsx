import { RilloraBrand } from "./RilloraBrand.jsx";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, PlusCircle, UserCircle, TrayArrowDown } from "@phosphor-icons/react";
import folio from "./assets/illustrations/rillora-folio-cutout.png";
import { sharingStatus } from "./sharing.js";
import "./authenticated-motion.css";

export function ConnectionVisual({ status = "uninvited", compact = false }) {
  const Target = status === "accepted" ? UserCircle : status === "pending" ? Clock : PlusCircle;
  return <span className={`connection-visual${compact ? " compact" : ""}`} data-state={status} aria-hidden="true">
    <UserCircle weight="fill" /><span className="connection-path">{status === "accepted" && <Check />}<span /></span><Target weight={status === "accepted" ? "fill" : "regular"} />
  </span>;
}

export function InvitationSteps({ current }) {
  return <ol className="invitation-steps" aria-label={`Step ${current + 1} of 3`}>
    {["Person", "Access", "Link"].map((label, index) => <li key={label} aria-current={index === current ? "step" : undefined} data-complete={index < current}>{label}</li>)}
  </ol>;
}

export function FolioArtwork({ compact = false }) {
  return <img className={`folio-artwork${compact ? " compact" : ""}`} src={folio} width="768" height="768" alt="" draggable="false" />;
}

export function InviteAction({ onInvite, detail = "Share by link or QR" }) {
  return <button className="invite-action" onClick={onInvite}>
    <ConnectionVisual compact /><span><strong>Invite someone</strong><small>{detail}</small></span><ArrowRight size={21} aria-hidden="true" />
  </button>;
}

export function AuthenticatedOverview({ matters, contacts, apiClient, refreshVersion, busy, onAdd, onOpenMatters, onInvite, onOpenConnection, onOpenShared, onGuide, showGuide, guidePaused, renderMatter }) {
  const [connections, setConnections] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true, sequence = 0;
    const load = async () => {
      const request = ++sequence;
      try { const result = await apiClient.getSharingConnections(); if (active && request === sequence) { setConnections(result.connections); setFailed(false); } }
      catch { if (active && request === sequence) { setConnections(null); setFailed(true); } }
    };
    void load(); window.addEventListener("focus", load);
    return () => { active = false; window.removeEventListener("focus", load); };
  }, [apiClient, refreshVersion]);
  const connection = connections?.find((item) => item.status !== "revoked");
  const person = connection && contacts.find((item) => item.publicId === connection.personPublicId);
  return <div className="authenticated-overview" data-empty={matters.length === 0}>
    <div className="folio-brand"><RilloraBrand compact /></div>
    <header className="folio-title"><h1>Your map</h1><span>{matters.length} {matters.length === 1 ? "matter" : "matters"}</span></header>
    <div className="folio-workspace">
      <button className="folio-open" onClick={matters.length ? onOpenMatters : onAdd} aria-label={matters.length ? "Open your matters" : "Add a matter"}><FolioArtwork compact={matters.length > 0} /></button>
      <div className="folio-actions">
        <button className="primary-button" onClick={onAdd} disabled={busy}>Add a matter<ArrowRight size={21} aria-hidden="true" /></button>
        {person && <button className="invite-action existing-connection" onClick={() => onOpenConnection(person)}><ConnectionVisual status={connection.status} compact /><span><strong>{person.displayName}</strong><small>{sharingStatus[connection.status]}</small></span><ArrowRight size={21} aria-hidden="true" /></button>}
        <InviteAction onInvite={onInvite} />
        {failed && <span className="connection-refresh-note" role="status">Connection status could not refresh.</span>}
        <button className="incoming-action" onClick={onOpenShared}><TrayArrowDown size={25} aria-hidden="true" /><span>Shared with me</span><ArrowRight size={20} aria-hidden="true" /></button>
        {showGuide && <button className="text-button optional-guide" onClick={onGuide}>{guidePaused ? "Resume quick start guide" : "Quick start guide"}</button>}
      </div>
    </div>
    {matters.length > 0 && <section className="folio-matters"><header><h2>Your matters</h2><button className="text-button" onClick={onOpenMatters}>View all<ArrowRight size={18} /></button></header><div className="matter-list">{[...matters.filter(item => item.status !== "added"), ...matters.filter(item => item.status === "added")].slice(0, 3).map(renderMatter)}</div></section>}
  </div>;
}
