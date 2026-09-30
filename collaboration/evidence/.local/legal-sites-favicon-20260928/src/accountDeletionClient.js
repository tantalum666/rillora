const storageKey="rillora.deletion-reference.v1";
export function createDeletionReference(){
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  const receipt=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  const result={schemaVersion:"rillora-deletion-reference-v1",receipt,createdAt:Date.now()};
  try{sessionStorage.setItem(storageKey,JSON.stringify(result));}catch{/* The view also offers an explicit reference download. */}
  return result;
}
export function readDeletionReference(){
  try{return validateDeletionReference(JSON.parse(sessionStorage.getItem(storageKey)));}catch{return null;}
}
export function validateDeletionReference(value){
  if(value?.schemaVersion!=="rillora-deletion-reference-v1"||!/^[A-Za-z0-9_-]{43}$/.test(value.receipt??"")||!Number.isFinite(value.createdAt))throw Error("Choose a saved Rillora deletion reference.");
  return value;
}
export function saveDeletionReference(reference){
  const url=URL.createObjectURL(new Blob([JSON.stringify(reference)],{type:"application/json"})),a=document.createElement('a');
  a.href=url;a.download="rillora-deletion-reference.json";document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
