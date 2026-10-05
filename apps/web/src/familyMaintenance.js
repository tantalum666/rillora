const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const fields = new Set(["institutionName", "locationHint"]);
export const reviewStates = Object.freeze({
  waiting: "Waiting",
  confirmed: "Checked",
  needs_update: "Needs attention",
  suggested: "Update suggested",
  applied: "Updated",
  dismissed: "Kept current"
});
export const reviewReasons = Object.freeze({
  cannot_find: "Can't find it",
  outdated: "Out of date",
  unclear: "Directions unclear"
});
export function reviewTaskLabel(task, t) {
  if (t) return t(`sharing.review.state.${!task.scopeAvailable ? "sharingChanged" : task.isStale ? "checkAgain" : Object.hasOwn(reviewStates, task.state) ? task.state : "unavailable"}`);
  if (!task.scopeAvailable) return "Sharing changed";
  if (task.isStale) return "Check again";
  return reviewStates[task.state] ?? "Unavailable";
}
export function isReviewResolved(task) {
  return task.scopeAvailable && !task.isStale && ["confirmed", "applied", "dismissed"].includes(task.state);
}
function safeFields(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.entries(value).every(([key, field]) => fields.has(key) && typeof field === "string");
}
export function validateFamilyMaintenance(value) {
  const bounds = value?.boundaries;
  if (value?.contractVersion !== "family-maintenance-v1" || bounds?.ownerApprovalRequired !== true || bounds.recipientScopeEnforced !== true || bounds.externalNotificationsSent !== false || bounds.billingActivated !== false || !["preview", "family", "unavailable"].includes(value.access?.mode) || value.access.canCreate !== (value.access.mode !== "unavailable") || ![0, 30, 90, 180, 365].includes(value.settings?.cadenceDays) || ![value.eligible, value.rounds, value.incoming, value.history].every(Array.isArray)) throw new Error("The review response could not be verified.");
  for (const task of [...value.rounds.flatMap(r => r.tasks ?? []), ...value.incoming]) {
    if (!uuid.test(task.publicId) || !uuid.test(task.matterPublicId) || !uuid.test(task.connectionPublicId) || !Object.hasOwn(reviewStates, task.state) || !Number.isInteger(task.version) || task.version < 1 || !safeFields(task.fields) || task.proposal !== null && !safeFields(task.proposal) || ![task.scopeAvailable, task.isStale, task.canRespond, task.canSuggest, task.canManage].every(v => typeof v === 'boolean')) throw new Error("Review information exceeded its allowed scope.");
  }
  if (value.incoming.some(task => task.canManage || !task.scopeAvailable) || value.history.some(entry => !safeFields(entry.beforeFields) || !safeFields(entry.afterFields))) throw new Error("Review information exceeded its allowed scope.");
  return value;
}
export function reviewShareUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    return (url.protocol === "https:" || url.protocol === "http:" && local) && !url.username && !url.password && !url.hash && url.pathname === "/account" && url.search === "?next=reviews" ? url.href : null;
  } catch {
    return null;
  }
}
