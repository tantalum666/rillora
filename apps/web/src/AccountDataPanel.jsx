import { useEffect, useState } from "react";
import { Archive, DownloadSimple, FolderOpen, CaretRight, CheckCircle, Files } from "@phosphor-icons/react";
import { SurfaceIcon } from "./SurfaceMotion.jsx";
import { SavedCopyReader } from "./SavedCopyReader.jsx";
import { downloadMapBackup } from "./savedCopy.js";
import { useConfirmation } from "./ConfirmationDialog.jsx";
import { createDeletionReference, saveDeletionReference } from "./accountDeletionClient.js";

export function AccountDataPanel({ apiClient, onChanged, onDeletionRequested }) {
  const [profile,setProfile]=useState(null),[archives,setArchives]=useState([]),[section,setSection]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
  const {confirm,confirmation}=useConfirmation();
  const [deleteWord,setDeleteWord]=useState(""),[savedCopies,setSavedCopies]=useState(false),[billing,setBilling]=useState(false),[reference,setReference]=useState(null);
  const [reload,setReload]=useState(0);
  const [billingRequiredByServer,setBillingRequiredByServer]=useState(false);
  useEffect(()=>{let active=true;Promise.all([apiClient.getAccountProfile(),apiClient.getArchivedMatters()]).then(([p,a])=>{if(active){setProfile({...p.account,billing:p.billing});setArchives(a.matters);setError("");}}).catch(()=>{if(active)setError("Your data tools could not be loaded. Try again.");});return()=>{active=false};},[apiClient,reload]);
  const needsBilling = billingRequiredByServer || profile?.billing?.hasSubscription === true || profile?.billing?.hasPendingPurchase === true;
  async function run(action){setBusy(true);setError("");setMessage("");try{await action();}catch(e){setError(e.message||"This action could not be completed.");}finally{setBusy(false);}}
  async function backup(){if(!await confirm({title:"Keep a complete private copy?",message:"This file includes private matters, Notes and recorded people. Anyone with the file can read it.",confirmLabel:"Download my map",cancelLabel:"Cancel"}))return;await run(async()=>{downloadMapBackup(await apiClient.exportMapBackup());setMessage("Backup prepared. Keep the file private.");});}
  async function restore(backup){if(!await confirm({title:"Import this map?",message:`Import ${backup.matters.length} matters into ${profile?.displayName??"your account"}? Existing records are never replaced. Sharing and invitations stay off.`,confirmLabel:"Import private records",cancelLabel:"Cancel"}))return;await run(async()=>{const result=await apiClient.importMapBackup(backup);setMessage(`${result.matterCount} matters imported. Choose sharing separately.`);await onChanged?.();});}
  async function removeAccount(){
    if(deleteWord!=="DELETE"||!savedCopies||(needsBilling&&!billing)||!reference||busy||!profile)return;
    if(!await confirm({title:"Delete this Rillora account?",message:"This removes your private map, people, saved packages and Rillora access. It cannot be undone.",confirmLabel:"Delete account",cancelLabel:"Keep my account"}))return;
    setBusy(true);setError("");
    try{await apiClient.requestAccountDeletion(reference.receipt,billing);onDeletionRequested(reference);}
    catch(e){if(e.status&&e.status<500){if(e.code==='billing_confirmation_required')setBillingRequiredByServer(true);setError(e.message);setBusy(false);}else onDeletionRequested(reference);}
  }
  return <section className="account-data-panel">
    {confirmation}{profile&&<div className="account-data-heading"><SurfaceIcon icon={Files} emblem/><p className="account-identity">{profile.displayName}</p></div>}
    {error&&<div className="drawer-alert" role="alert">{error}{!profile&&<button onClick={()=>setReload(n=>n+1)}>Try again</button>}</div>}{message&&<p role="status"><CheckCircle size={22} aria-hidden="true"/>{message}</p>}
    <button className="secondary-button" disabled={busy} onClick={()=>void backup()}><SurfaceIcon icon={DownloadSimple}/><span>Download my complete map</span><CaretRight className="disclosure-chevron" size={17} aria-hidden="true"/></button>
    <button className="secondary-button" disabled={busy} aria-expanded={section==="open"} aria-controls="saved-copy-tools" onClick={()=>setSection(section==="open"?"":"open")}><SurfaceIcon icon={FolderOpen}/><span>Open a saved copy</span><CaretRight className="disclosure-chevron" size={17} aria-hidden="true"/></button>
    {section==="open"&&<div id="saved-copy-tools" className="data-disclosure"><SavedCopyReader busy={busy} onImport={restore}/></div>}
    <button className="secondary-button" disabled={busy} aria-expanded={section==="archive"} aria-controls="archived-matter-tools" onClick={()=>setSection(section==="archive"?"":"archive")}><SurfaceIcon icon={Archive}/><span>Archived matters · {archives.length}</span><CaretRight className="disclosure-chevron" size={17} aria-hidden="true"/></button>
    {section==="archive"&&<div id="archived-matter-tools" className="data-disclosure">{archives.length===0?<p>No archived matters.</p>:archives.map(m=><div className="archive-row" key={m.publicId}><span>{m.title}</span><button disabled={busy} onClick={()=>void run(async()=>{await apiClient.restoreArchivedMatter(m.publicId,m.version);setArchives(rows=>rows.filter(row=>row.publicId!==m.publicId));setMessage("Restored as a private draft. Sharing stays off.");await onChanged?.();})}>Restore privately</button></div>)}</div>}
    <button className="text-button danger-text" disabled={busy||!profile} onClick={()=>{setSection(section==="delete"?"":"delete");if(!reference)setReference(createDeletionReference());}}>Delete my account</button>
    {section==="delete"&&<section className="account-delete-form" aria-label="Delete account">
      <h3>Delete your Rillora account</h3><p>Keep a map backup first if you need it. Required consent and payment records may be retained.</p>
      <label><input type="checkbox" checked={savedCopies} onChange={e=>setSavedCopies(e.target.checked)}/>I understand copies already saved or shared cannot be removed.</label>
      {needsBilling&&<><label><input type="checkbox" checked={billing} onChange={e=>setBilling(e.target.checked)}/>I understand deleting the account does not cancel provider billing.</label>{profile.billing?.providers?.some(p=>["apple","storekit"].includes(p))&&<a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noreferrer">Manage Apple subscriptions</a>}</>}
      <label className="field-label">Type DELETE to confirm<input aria-label="Type DELETE to confirm" value={deleteWord} autoComplete="off" onChange={e=>setDeleteWord(e.target.value)}/></label>
      {reference&&<button className="secondary-button" onClick={()=>saveDeletionReference(reference)}>Save deletion reference</button>}
      <button className="primary-button" disabled={busy||deleteWord!=="DELETE"||!savedCopies||(needsBilling&&!billing)} onClick={()=>void removeAccount()}>{busy?"Requesting deletion…":"Delete account"}</button>
    </section>}
  </section>;
}
