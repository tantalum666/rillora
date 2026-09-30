import { useEffect, useState } from "react";
import { ArrowRight, LockKey, UserPlus } from "@phosphor-icons/react";
import { sharingLevels, sharingStatus } from "./sharing.js";

export function MatterSharingPanel({ matter, contacts, apiClient, onShare, onInvite }) {
  const [connections, setConnections] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => { let active = true; setError(""); setConnections(null);
    apiClient.getSharingConnections().then(result => { if (active) setConnections(result.connections); })
      .catch(failure => { if (active) setError(failure.message || "Sharing could not be checked."); });
    return () => { active = false; };
  }, [apiClient, matter?.id, retry]);
  if (!matter) return <p>This matter is no longer in your active map.</p>;
  if (matter.desiredOutcome === "never_disclose") return <div className="task-empty"><LockKey size={32}/><h3>{matter.title}</h3><p>Never disclose is selected. This matter stays private.</p></div>;
  if (error) return <div role="alert"><p>{error}</p><button className="secondary-button" onClick={() => setRetry(value => value + 1)}>Retry</button></div>;
  if (!connections) return <p role="status">Checking who can see this…</p>;
  const people = contacts.filter(person => !["archived", "revoked"].includes(person.status));
  const shared = connections.some(connection => connection.status !== "revoked" && connection.grants.some(grant => grant.matterPublicId === matter.id));
  return <section className="matter-sharing-summary"><h3>{matter.title}</h3><p>{shared ? "Manage each person’s access below." : "Only you can see this matter."}</p>
    <div className="people-list">{people.map(person => {
      const connection = connections.find(item => item.personPublicId === person.publicId && item.status !== "revoked");
      const grant = connection?.grants.find(item => item.matterPublicId === matter.id);
      return <button key={person.publicId} className="person-main" onClick={() => onShare(person)}><span><strong>{person.displayName}</strong><small>{grant ? `${sharingLevels.find(level => level.value === grant.detailLevel)?.label} · ${sharingStatus[connection.status]}` : "Not shared"}</small></span><ArrowRight size={20}/></button>;
    })}</div><button className="secondary-button" onClick={onInvite}><UserPlus size={20}/>Invite someone</button>
  </section>;
}
