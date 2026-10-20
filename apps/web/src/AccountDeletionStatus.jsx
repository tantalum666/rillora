import { LanguageControl } from "./i18n/LanguageControl.jsx";
import { sharingMessage } from "./sharing.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { RilloraBrand } from "./RilloraBrand.jsx";
import { useEffect,useState,useRef } from "react";
import { CheckCircle,Clock } from "@phosphor-icons/react";
import { readDeletionReference,saveDeletionReference,validateDeletionReference } from "./accountDeletionClient.js";
export function AccountDeletionStatus({apiClient,reference:initialReference}){
  const { t, errorMessage } = useI18n();
  const [reference,setReference]=useState(()=>initialReference??readDeletionReference()),[status,setStatus]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const requestVersion=useRef(0);
  async function refresh(){if(!reference)return;const version=++requestVersion.current;setLoading(true);setError("");try{const result=await apiClient.getAccountDeletionStatus(reference.receipt);if(version!==requestVersion.current)return;if(!["pending","completed"].includes(result?.deletion?.status))throw Error("The status could not be verified.");setStatus(result.deletion);}catch(e){if(version===requestVersion.current)setError({ cause: e, key: "sharing.delete.statusError" });}finally{if(version===requestVersion.current)setLoading(false);}}
  useEffect(()=>{setStatus(null);void refresh();return()=>{requestVersion.current+=1;};},[reference]);
  return <main className="workspace-gate deletion-status">
    <a className="workspace-gate-brand" href="/" aria-label={t("sharing.delete.home")}><RilloraBrand decorative /></a>
    <LanguageControl />
    {status?.status==="completed"?<CheckCircle size={52}/>:<Clock size={52}/>}
    <h1>{status?.status==="completed"?t("sharing.delete.completed"):t("sharing.delete.status")}</h1>
    {status?.status==="pending"&&<p>{t("sharing.delete.pendingBody")}</p>}
    {status?.status==="completed"&&<p>{t("sharing.delete.completedBody")}</p>}
    {error&&<p role="alert">{sharingMessage(error, t, errorMessage)}</p>}
    {reference&&<><button className="primary-button" disabled={loading} onClick={()=>void refresh()}>{loading?t("sharing.delete.checking"):t("sharing.delete.checkStatus")}</button><button className="secondary-button" onClick={()=>saveDeletionReference(reference)}>{t("sharing.account.saveReference")}</button></>}
    <label className="secondary-button file-picker">{reference?t("sharing.delete.otherReference"):t("sharing.delete.chooseReference")}<input type="file" accept=".json" disabled={loading} aria-label={t("sharing.delete.referenceFile")} onChange={async e=>{try{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>4096)throw Error("Choose your saved reference file.");setReference(validateDeletionReference(JSON.parse(await file.text())));}catch(err){setError({cause:err,key:"sharing.delete.referenceError"});}}}/></label>
    <a className="text-button" href="/">{t("sharing.delete.back")}</a>
  </main>;
}
