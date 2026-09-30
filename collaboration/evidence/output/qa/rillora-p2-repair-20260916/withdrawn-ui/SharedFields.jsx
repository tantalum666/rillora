import { useState } from "react";
import { Copy, CheckCircle } from "@phosphor-icons/react";
import { sharedFieldLabels } from "./sharing.js";

export function SharedFields({ fields, detailLevel }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  return <>
    {detailLevel === "name" && <p className="sharing-expiry">Only the name and category are shared.</p>}
    <dl className="shared-fields">{Object.entries(sharedFieldLabels).filter(([key]) => fields[key] && !(key === "valueBand" && fields[key] === "unknown") && !(key === "desiredOutcome" && fields[key] === "undecided")).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{["desiredOutcome", "valueBand", "importance", "cryptoCustody", "billingCycle"].includes(key) ? fields[key].replaceAll("_", " ").replace(/^./, letter => letter.toUpperCase()) : fields[key]}{key === "walletAddress" && <button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(fields[key]); setCopied(true); setError(""); } catch { setError("Select the address to copy it."); } }}>{copied ? <CheckCircle size={18}/> : <Copy size={18}/>} {copied ? "Copied" : "Copy address"}</button>}</dd></div>)}</dl>
    {error && <p role="status">{error}</p>}
  </>;
}
