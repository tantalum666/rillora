import { useEffect,useState,useRef } from "react";
import { CheckCircle,Clock } from "@phosphor-icons/react";
import { readDeletionReference,saveDeletionReference,validateDeletionReference } from "./accountDeletionClient.js";
export function AccountDeletionStatus({apiClient,reference:initialReference}){
  const [reference,setReference]=useState(()=>initialReference??readDeletionReference()),[status,setStatus]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const requestVersion=useRef(0);
  async function refresh(){if(!reference)return;const version=++requestVersion.current;setLoading(true);setError("");try{const result=await apiClient.getAccountDeletionStatus(reference.receipt);if(version!==requestVersion.current)return;if(!["pending","completed"].includes(result?.deletion?.status))throw Error("The status could not be verified.");setStatus(result.deletion);}catch(e){if(version===requestVersion.current)setError(e.message||"The status could not be checked. Try again.");}finally{if(version===requestVersion.current)setLoading(false);}}
  useEffect(()=>{setStatus(null);void refresh();return()=>{requestVersion.current+=1;};},[reference]);
  return <main className="workspace-gate deletion-status">
    <a className="workspace-gate-brand" href="/">Rillora</a>
    {status?.status==="completed"?<CheckCircle size={52}/>:<Clock size={52}/>}
    <h1>{status?.status==="completed"?"Account deleted":"Deletion status"}</h1>
    {status?.status==="pending"&&<p>Your request is saved and Rillora access has ended. Cleanup is in progress and retries automatically.</p>}
    {status?.status==="completed"&&<p>Your active Rillora account and private map have been removed. Required records and routine backup retention follow the Privacy Policy.</p>}
    {error&&<p role="alert">{error}</p>}
    {reference&&<><button className="primary-button" disabled={loading} onClick={()=>void refresh()}>{loading?"Checking…":"Check status"}</button><button className="secondary-button" onClick={()=>saveDeletionReference(reference)}>Save deletion reference</button></>}
    <label className="secondary-button file-picker">{reference?"Open another reference":"Choose saved reference"}<input type="file" accept=".json" disabled={loading} aria-label="Deletion reference file" onChange={async e=>{try{const file=e.target.files?.[0];e.target.value="";if(!file)return;if(file.size>4096)throw Error("Choose your saved reference file.");setReference(validateDeletionReference(JSON.parse(await file.text())));}catch(err){setError(err.message);}}}/></label>
    <a className="text-button" href="/">Back to Rillora</a>
  </main>;
}
