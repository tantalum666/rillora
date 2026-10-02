import { useEffect, useRef, useState } from "react";
import { FileArrowUp, LockKey } from "@phosphor-icons/react";
import { readSavedFile, validateDirectionsCopy } from "./savedCopy.js";

export function SavedCopyReader({ onImport, busy = false }) {
  const [copy,setCopy]=useState(null),[error,setError]=useState(""),[opening,setOpening]=useState(false);
  const generation=useRef(0);
  useEffect(()=>()=>{generation.current++;},[]);
  async function open(file){
    if(!file)return;
    const current=++generation.current;
    setError("");setCopy(null);setOpening(false);
    try{const result=await readSavedFile(file);if(current===generation.current)setCopy(result);}
    catch(e){if(current===generation.current)setError(e.message);}
  }
  async function unlock(file){
    if(!file || !copy)return;
    const current=++generation.current;
    setOpening(true);setError("");
    try{
      if(file.size>16_384)throw new Error("The recovery file is too large.");
      const recovery=JSON.parse(await file.text());
      const {decryptEncryptedStartHere}=await import("./startHereCrypto.js");
      const payload=await decryptEncryptedStartHere(copy.value,recovery);
      const value=validateDirectionsCopy(payload.package);
      if(current===generation.current)setCopy({kind:"directions",value});
    }catch{if(current===generation.current)setError("This recovery file could not open the package. Check that the two files belong together.");}
    finally{if(current===generation.current)setOpening(false);}
  }
  const readable=(key,value)=>key==="desiredOutcome"?({notify:"Notify someone",transfer_request:"Request transfer",close:"Request closure",delete_request:"Request deletion",memorialize:"Request memorialization",delay_disclosure:"Delay disclosure",never_disclose:"Never disclose",undecided:"Not decided"}[value]??value):key==="cryptoCustody"?({exchange:"Exchange",self_custody:"On-chain wallet"}[value]??value):value;
  const records=copy?.kind==="backup"||copy?.kind==="directions"?copy.value.matters:[];
  const fieldLabels={institutionName:"Provider",locationHint:"Where to find it",desiredOutcome:"Wishes",accountHint:"Masked reference",notes:"Notes",network:"Network",walletAddress:"Public wallet address",cryptoCustody:"Held in",assetSymbol:"Asset or token",deviceModel:"Model",documentType:"Document type",assetType:"Asset type",debtType:"Debt type",walletLabel:"Wallet app or device",billingCycle:"Billing cycle",renewalDate:"Renewal date"};
  return <section className="saved-copy-reader" aria-label="Open saved copy">
    <label className="secondary-button file-picker"><FileArrowUp size={22}/>Choose saved file<input aria-label="Saved copy file" type="file" accept=".json,.txt,application/json,text/plain" disabled={busy||opening} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void open(file);}}/></label>
    <p className="matter-form-hint">Files and recovery keys open on this device.</p>
    {error&&<p role="alert" className="drawer-alert">{error}</p>}
    {copy?.kind==="encrypted"&&<label className="secondary-button file-picker"><LockKey size={22}/>{opening?"Opening…":"Choose matching recovery file"}<input type="file" aria-label="Recovery file" accept=".json,application/json" disabled={opening} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void unlock(file);}}/></label>}
    {copy?.kind==="text"&&<pre className="saved-guide-text">{copy.text}</pre>}
    {(copy?.kind==="backup"||copy?.kind==="directions")&&<>
      <h3>{copy.kind==="backup"?copy.value.owner.displayName:copy.value.planner.display_name}</h3>
      <p>Saved copy · Read only · {records.length} {records.length===1?"matter":"matters"}</p>
      {records.map(m=><details className="task-details" key={m.publicId}><summary>{m.title}{m.archivedAt?" · Archived":""}</summary><dl className="export-preview-fields"><dt>Type</dt><dd>{m.category.replaceAll("_"," ")}</dd>{Object.entries({...m,...m.details}).filter(([k,v])=>Object.hasOwn(fieldLabels,k)&&typeof v==="string"&&v).map(([k,v])=><div key={k}><dt>{fieldLabels[k]}</dt><dd>{readable(k,v)}</dd></div>)}</dl></details>)}
      {copy.kind==="backup"&&<details className="task-details"><summary>People · {copy.value.people.length}</summary>{copy.value.people.map(p=><p key={p.publicId}>{p.displayName}{p.relationshipLabel?` · ${p.relationshipLabel}`:""}</p>)}</details>}
      {copy.kind==="backup"&&onImport&&<button className="primary-button" disabled={busy} onClick={()=>onImport(copy.value)}>Import into an empty map</button>}
      <button className="text-button" disabled={busy} onClick={()=>{generation.current++;setCopy(null);setError("");setOpening(false);}}>Close this copy</button>
    </>}
  </section>;
}
