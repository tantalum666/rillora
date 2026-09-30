import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock, PlusCircle, UserCircle, TrayArrowDown } from "@phosphor-icons/react";
import folio from "./assets/illustrations/rillora-folio.jpg";
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

export function AuthenticatedOverview({ matters, contacts, apiClient, refreshVersion, busy, onAdd, onOpenMatters, onInvite, onOpenConnection, onOpenShared, onGuide, showGuide, onReview, renderMatter }) {
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
  const connection = connections?.find((item) => ["pending", "expired"].includes(item.status)) ?? connections?.find((item) => item.status === "accepted");
  const ordered = [...matters.filter(item => item.status !== "added"), ...matters.filter(item => item.status === "added")];
  const next = ordered.find(item => item.status !== "added");
  const person = connection && contacts.find((item) => item.publicId === connection.personPublicId);
  return <div className="authenticated-overview" data-empty={matters.length === 0}>
    <div className="folio-brand">Rillora</div>
    <header className="folio-title"><h1>Your map</h1><span>{matters.length} {matters.length === 1 ? "matter" : "matters"}</span>{matters.length > 0 && <FolioArtwork compact />}</header>
    {matters.length > 0 ? <>
      {next && <button className="review-next" onClick={onReview}><span><small>Review next</small><strong>{next.label}</strong></span><ArrowRight size={24}/></button>}
      <section className="folio-matters"><header><h2>Your matters</h2><button className="text-button" onClick={onOpenMatters}>View all<ArrowRight size={18}/></button></header><div className="matter-list">{ordered.slice(0, 4).map(renderMatter)}</div></section>
      <button className="secondary-button folio-add" onClick={onAdd} disabled={busy}><PlusCircle size={22}/>Add a matter<ArrowRight size={20}/></button>
    </> : <div className="folio-workspace"><button className="folio-open" onClick={onAdd} aria-label="Add a matter"><FolioArtwork/></button><button className="primary-button" onClick={onAdd} disabled={busy}>Add your first matter<ArrowRight size={21}/></button></div>}
    <section className="folio-connections"><header><h2>People</h2><button className="text-button" onClick={onInvite}>Invite someone<ArrowRight size={18}/></button></header>
      {person ? <button className="invite-action existing-connection" onClick={() => onOpenConnection(person)}><ConnectionVisual status={connection.status} compact/><span><strong>{person.displayName}</strong><small>{sharingStatus[connection.status]}</small></span><ArrowRight size={21}/></button> : <InviteAction onInvite={onInvite}/>}
      {failed && <p className="connection-refresh-note" role="status">Connection status could not refresh.</p>}
    </section>
    <button className="incoming-action" onClick={onOpenShared}><TrayArrowDown size={25}/><span>Shared with me</span><ArrowRight size={20}/></button>
    {showGuide && <button className="text-button optional-guide" onClick={onGuide}>Quick start guide</button>}

  </div>;
}
