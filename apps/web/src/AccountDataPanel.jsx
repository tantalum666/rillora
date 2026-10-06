import { sharingMessage } from "./sharing.js";
import { useI18n } from "./i18n/I18nProvider.jsx";
import { useEffect, useState } from "react";
import { Archive, DownloadSimple, FolderOpen, CaretRight, CheckCircle } from "@phosphor-icons/react";
import { SurfaceIcon } from "./SurfaceMotion.jsx";
import { SavedCopyReader } from "./SavedCopyReader.jsx";
import { downloadMapBackup } from "./savedCopy.js";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import { createDeletionReference, saveDeletionReference } from "./accountDeletionClient.js";

export function AccountDataPanel({ apiClient, onChanged, onDeletionRequested }) {
  const { t, errorMessage } = useI18n();
  const [profile,setProfile]=useState(null),[archives,setArchives]=useState([]),[section,setSection]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const {confirm,confirmation}=useConfirmation();
  const [deleteWord,setDeleteWord]=useState(""),[savedCopies,setSavedCopies]=useState(false),[billing,setBilling]=useState(false),[reference,setReference]=useState(null);
  const [reload,setReload]=useState(0);
  const [billingRequiredByServer,setBillingRequiredByServer]=useState(false);
  useEffect(()=>{let active=true;Promise.all([apiClient.getAccountProfile(),apiClient.getArchivedMatters()]).then(([p,a])=>{if(active){setProfile({...p.account,billing:p.billing});setArchives(a.matters);setError("");}}).catch(()=>{if(active)setError("sharing.account.loadError");});return()=>{active=false};},[apiClient,reload]);
  const needsBilling = billingRequiredByServer || profile?.billing?.hasSubscription === true || profile?.billing?.hasPendingPurchase === true;
  async function run(action){setBusy(true);setError("");setMessage("");try{await action();}catch(e){setError({ cause: e, key: "sharing.account.actionError" });}finally{setBusy(false);}}
  async function backup(){if(!await confirm({titleKey:"sharing.account.backupTitle",messageKey:"sharing.account.backupBody",confirmLabelKey:"sharing.account.downloadMap",cancelLabelKey:"sharing.common.cancel"}))return;await run(async()=>{downloadMapBackup(await apiClient.exportMapBackup());setMessage("sharing.account.backupReady");});}
  async function restore(backup){if(!await confirm({titleKey:"sharing.account.importTitle",messageKey:"sharing.account.importBody",params:{count:backup.matters.length,name:profile?.displayName??t("sharing.account.yourAccount")},confirmLabelKey:"sharing.account.importRecords",cancelLabelKey:"sharing.common.cancel"}))return;await run(async()=>{const result=await apiClient.importMapBackup(backup);setMessage({key:"sharing.account.imported",params:{count:result.matterCount}});await onChanged?.();});}
  async function removeAccount(){
    if(deleteWord!=="DELETE"||!savedCopies||(needsBilling&&!billing)||!reference||busy||!profile)return;
    if(!await confirm({titleKey:"sharing.account.deleteTitle",messageKey:"sharing.account.deleteBody",confirmLabelKey:"sharing.account.delete",cancelLabelKey:"sharing.account.keep"}))return;
    setBusy(true);setError("");
    try{await apiClient.requestAccountDeletion(reference.receipt,billing);onDeletionRequested(reference);}
    catch(e){if(e.status&&e.status<500){if(e.code==='billing_confirmation_required')setBillingRequiredByServer(true);setError({cause:e,key:"sharing.account.deleteError"});setBusy(false);}else onDeletionRequested(reference);}
  }
  return <section className="account-data-panel">
    {confirmation}
    {error&&<div className="drawer-alert" role="alert">{sharingMessage(error, t, errorMessage)}{!profile&&<button onClick={()=>setReload(n=>n+1)}>{t("sharing.common.tryAgain")}</button>}</div>}{message&&<p role="status"><CheckCircle size={22} aria-hidden="true"/>{sharingMessage(message,t,errorMessage)}</p>}
    <button className="secondary-button" disabled={busy} onClick={()=>void backup()}><SurfaceIcon icon={DownloadSimple}/><span>{t("sharing.account.downloadComplete")}</span><CaretRight className="disclosure-chevron" size={17} aria-hidden="true"/></button>
    <button className="secondary-button" disabled={busy} aria-expanded={section==="open"} aria-controls="saved-copy-tools" onClick={()=>setSection(section==="open"?"":"open")}><SurfaceIcon icon={FolderOpen}/><span>{t("sharing.account.openCopy")}</span><CaretRight className="disclosure-chevron" size={17} aria-hidden="true"/></button>
    {section==="open"&&<div id="saved-copy-tools" className="data-disclosure"><SavedCopyReader busy={busy} onImport={restore}/></div>}
    <button className="secondary-button" disabled={busy} aria-expanded={section==="archive"} aria-controls="archived-matter-tools" onClick={()=>setSection(section==="archive"?"":"archive")}><SurfaceIcon icon={Archive}/><span>{t("sharing.account.archivedCount",{count:archives.length})}</span><CaretRight className="disclosure-chevron" size={17} aria-hidden="true"/></button>
    {section==="archive"&&<div id="archived-matter-tools" className="data-disclosure">{archives.length===0?<p>{t("sharing.account.noArchived")}</p>:archives.map(m=><div className="archive-row" key={m.publicId}><span>{m.title}</span><button disabled={busy} onClick={()=>void run(async()=>{await apiClient.restoreArchivedMatter(m.publicId,m.version);setArchives(rows=>rows.filter(row=>row.publicId!==m.publicId));setMessage("sharing.account.restored");await onChanged?.();})}>{t("sharing.account.restore")}</button></div>)}</div>}
    <button className="text-button danger-text" disabled={busy||!profile} onClick={()=>{setSection(section==="delete"?"":"delete");if(!reference)setReference(createDeletionReference());}}>{t("sharing.account.deleteMine")}</button>
    {section==="delete"&&<section className="account-delete-form" aria-label={t("sharing.account.delete")}>
      <h3>{t("sharing.account.deleteHeading")}</h3><p>{t("sharing.account.deleteHint")}</p>
      <label><input type="checkbox" checked={savedCopies} onChange={e=>setSavedCopies(e.target.checked)}/>{t("sharing.account.copiesAck")}</label>
      {needsBilling&&<><label><input type="checkbox" checked={billing} onChange={e=>setBilling(e.target.checked)}/>{t("sharing.account.billingAck")}</label>{profile.billing?.providers?.some(p=>["apple","storekit"].includes(p))&&<a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noreferrer">{t("sharing.account.appleSubscriptions")}</a>}</>}
      <label className="field-label">{t("sharing.account.typeDelete")}<input aria-label={t("sharing.account.typeDelete")} value={deleteWord} autoComplete="off" onChange={e=>setDeleteWord(e.target.value)}/></label>
      {reference&&<button className="secondary-button" onClick={()=>saveDeletionReference(reference)}>{t("sharing.account.saveReference")}</button>}
      <button className="primary-button" disabled={busy||deleteWord!=="DELETE"||!savedCopies||(needsBilling&&!billing)} onClick={()=>void removeAccount()}>{busy?t("sharing.account.deleting"):t("sharing.account.delete")}</button>
    </section>}
  </section>;
}
