const maxBytes = 2 * 1024 * 1024;
const string = value => typeof value === "string";
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
export function validateMapBackup(value) {
  if (value?.schemaVersion !== "rillora-map-backup-v1" || value?.boundaries?.containsPrivateMap !== true
    || value?.boundaries?.restoresAccess !== false || value?.boundaries?.credentialsIncluded !== false
    || !string(value?.owner?.displayName) || !Array.isArray(value.matters) || value.matters.length > 500
    || !Array.isArray(value.people) || value.people.length > 200 || !Array.isArray(value.roles) || value.roles.length > 1000
    || !Array.isArray(value.officialChecks) || value.officialChecks.length > 50 || !value.plan || typeof value.plan !== "object" || Array.isArray(value.plan)
    || value.matters.some(m => !record(m) || !string(m.publicId) || !string(m.title) || !string(m.category)
      || (m.notes != null && !string(m.notes)) || (m.details != null && (!record(m.details) || Object.values(m.details).some(v => !string(v)))))
    || value.people.some(p => !record(p) || !string(p.publicId) || !string(p.displayName))) throw new Error("This file is not a supported complete map backup.");
  return value;
}
export function validateDirectionsCopy(value) {
  if (value?.schemaVersion !== "start-here-v1" || value.directionsNotPasswords !== true || value.legalAuthorityNotGranted !== true
    || !string(value?.planner?.display_name) || !Array.isArray(value.matters) || value.matters.length > 500
    || value.matters.some(m => !record(m) || !string(m.publicId) || !string(m.title) || !string(m.category)
      || [m.institutionName,m.locationHint,m.desiredOutcome].some(v=>v!=null&&!string(v)))) throw new Error("The directions copy has an unsupported format.");
  return value;
}
export async function readSavedFile(file) {
  if (!file || file.size > maxBytes) throw new Error("Choose a file no larger than 2 MB.");
  const text = (await file.text()).replace(/^\uFEFF/, "");
  if (/\.txt$/i.test(file.name)) return {kind:"text",text};
  let value;
  try { value=JSON.parse(text); } catch { throw new Error("This file is not valid JSON."); }
  if(!value || typeof value!=="object" || Array.isArray(value))throw new Error("Choose a supported Rillora saved copy.");
  if(value.schemaVersion === "rillora-map-backup-v1") return {kind:"backup",value:validateMapBackup(value)};
  if(value.schemaVersion === "rillora-encrypted-start-here-v1") return {kind:"encrypted",value};
  throw new Error("Choose a Rillora map backup, encrypted directions package, or text guide.");
}

export function downloadMapBackup(backup) {
  validateMapBackup(backup);
  // Match the API and both readers' byte limit. Pretty-printing can make an
  // otherwise valid near-limit export too large to open again on Web or iOS.
  const blob=new Blob([JSON.stringify(backup)],{type:"application/json"});
  if(blob.size>maxBytes)throw new Error("This backup exceeds the current 2 MB file limit.");
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=`rillora-map-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
