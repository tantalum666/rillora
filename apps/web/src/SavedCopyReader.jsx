import { sharingMessage, sharedCategoryLabel, sharedFieldValue, sharedFieldLabels } from "./sharing.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { useEffect, useRef, useState } from "react";
import { FileArrowUp, LockKey } from "@phosphor-icons/react";
import { readSavedFile, validateDirectionsCopy } from "./savedCopy.js";

export function SavedCopyReader({ onImport, busy = false }) {
  const { t, errorMessage } = useI18n();
  const [copy,setCopy]=useState(null),[error,setError]=useState(""),[opening,setOpening]=useState(false);
  const generation=useRef(0);
  useEffect(()=>()=>{generation.current++;},[]);
  async function open(file){
    if(!file)return;
    const current=++generation.current;
    setError("");setCopy(null);setOpening(false);
    try{const result=await readSavedFile(file);if(current===generation.current)setCopy(result);}
    catch(e){if(current===generation.current)setError({cause:e,key:"sharing.reader.openError"});}
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
    }catch{if(current===generation.current)setError("sharing.reader.unlockError");}
    finally{if(current===generation.current)setOpening(false);}
  }
  const records=copy?.kind==="backup"||copy?.kind==="directions"?copy.value.matters:[];
  const fieldLabels = Object.fromEntries(["institutionName", "locationHint", "desiredOutcome", "accountHint", "notes", "network", "walletAddress", "cryptoCustody", "assetSymbol", "deviceModel", "documentType", "assetType", "debtType", "walletLabel", "billingCycle", "renewalDate"].map(key => [key, sharedFieldLabels[key]]));
  return <section className="saved-copy-reader" aria-label={t("sharing.reader.open")}>
    <label className="secondary-button file-picker"><FileArrowUp size={22}/>{t("sharing.reader.chooseFile")}<input aria-label={t("sharing.reader.file")} type="file" accept=".json,.txt,application/json,text/plain" disabled={busy||opening} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void open(file);}}/></label>
    <p className="matter-form-hint">{t("sharing.reader.localHint")}</p>
    {error&&<p role="alert" className="drawer-alert">{sharingMessage(error, t, errorMessage)}</p>}
    {copy?.kind==="encrypted"&&<label className="secondary-button file-picker"><LockKey size={22}/>{opening?t("sharing.reader.opening"):t("sharing.reader.chooseKey")}<input type="file" aria-label={t("sharing.reader.keyFile")} accept=".json,application/json" disabled={opening} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void unlock(file);}}/></label>}
    {copy?.kind==="text"&&<pre className="saved-guide-text">{copy.text}</pre>}
    {(copy?.kind==="backup"||copy?.kind==="directions")&&<>
      <h3>{copy.kind==="backup"?copy.value.owner.displayName:copy.value.planner.display_name}</h3>
      <p>{t("sharing.reader.count",{count:records.length})}</p>
      {records.map(m=><details className="task-details" key={m.publicId}><summary>{m.title}{m.archivedAt?t("sharing.reader.archived"):""}</summary><dl className="export-preview-fields"><dt>{t("sharing.common.type")}</dt><dd>{sharedCategoryLabel(m.category,t)}</dd>{Object.entries({...m,...m.details}).filter(([k,v])=>Object.hasOwn(fieldLabels,k)&&typeof v==="string"&&v).map(([k,v])=><div key={k}><dt>{t(`sharing.field.${k}`)}</dt><dd>{sharedFieldValue(k,v,t)}</dd></div>)}</dl></details>)}
      {copy.kind==="backup"&&<details className="task-details"><summary>{t("sharing.reader.peopleCount",{count:copy.value.people.length})}</summary>{copy.value.people.map(p=><p key={p.publicId}>{p.displayName}{p.relationshipLabel?` · ${p.relationshipLabel}`:""}</p>)}</details>}
      {copy.kind==="backup"&&onImport&&<button className="primary-button" disabled={busy} onClick={()=>onImport(copy.value)}>{t("sharing.reader.import")}</button>}
      <button className="text-button" disabled={busy} onClick={()=>{generation.current++;setCopy(null);setError("");setOpening(false);}}>{t("sharing.reader.close")}</button>
    </>}
  </section>;
}
