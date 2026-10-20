import { toMatterDraft } from "./matterForm.js";

const prefix = "rillora.matter-draft.v1.";
const lifetime = 24 * 60 * 60 * 1000;
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = Object.keys(toMatterDraft());

// A draft is tab-local, short-lived and only offered after verifying the same account.
// No session token, provider token or recovery key belongs in this store.
function storage() { try { return globalThis.sessionStorage; } catch { return null; } }
function key(owner) { return idPattern.test(owner ?? "") ? `${prefix}${owner.toLowerCase()}` : null; }
function pickDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid draft");
  return Object.fromEntries(fields.map((field) => {
    const entry = value[field];
    if (field === "details") {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)
        || Object.entries(entry).some(([k,v]) => !/^[a-zA-Z]{1,40}$/.test(k) || typeof v !== "string" || v.length > 500)) throw new Error("Invalid details");
      return [field, { ...entry }];
    }
    if (typeof entry !== "string" || entry.length > 2000) throw new Error("Invalid field");
    return [field, entry];
  }));
}

export function writeMatterDraft(owner, drawer, store = storage(), now = Date.now()) {
  const name = key(owner);
  if (!name || !store) return false;
  try {
    const value = { version: 1, owner: owner.toLowerCase(), type: drawer.type,
      id: drawer.id ?? null, expectedVersion: drawer.expectedVersion ?? null, requestId: drawer.requestId ?? null,
      fields: pickDraft(drawer), initialValues: pickDraft(drawer.initialValues),
      savedAt: now, expiresAt: now + lifetime };
    store.setItem(name, JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function readMatterDraft(owner, store = storage(), now = Date.now()) {
  const name = key(owner);
  if (!name || !store) return null;
  try {
    const text = store.getItem(name);
    if (!text) return null;
    if (text.length > 40_000) throw new Error("Oversize draft");
    const saved = JSON.parse(text);
    if (saved.version !== 1 || saved.owner !== owner.toLowerCase()
      || !["matter", "matter-create"].includes(saved.type)
      || (saved.requestId != null && !idPattern.test(saved.requestId))
      || !Number.isFinite(saved.savedAt) || saved.savedAt > now
      || !Number.isFinite(saved.expiresAt) || saved.expiresAt <= now || saved.expiresAt - saved.savedAt > lifetime
      || (saved.type === "matter" && (!idPattern.test(saved.id) || !Number.isSafeInteger(saved.expectedVersion) || saved.expectedVersion < 1))) throw new Error("Expired or invalid draft");
    return { type: saved.type, ...(saved.type === "matter" ? { id: saved.id, expectedVersion: saved.expectedVersion } : {}),
      ...pickDraft(saved.fields), requestId: saved.requestId ?? null, initialValues: pickDraft(saved.initialValues), savedAt: saved.savedAt };
  } catch { try { store.removeItem(name); } catch { /* unavailable storage */ } return null; }
}

export function clearMatterDraft(owner, store = storage()) {
  try { const name = key(owner); if (name) store?.removeItem(name); } catch { /* unavailable storage */ }
}

export function isSameMatterDraft(first, second) {
  if (!first || !second || first.type !== second.type) return false;
  if (first.type === "matter") return Boolean(first.id && first.id === second.id);
  return first.type === "matter-create"
    && Boolean(first.requestId && first.requestId === second.requestId);
}

// Closing or saving a different editor must not erase a pending recovery.
export function clearMatchingMatterDraft(owner, drawer, store = storage()) {
  const saved = readMatterDraft(owner, store);
  if (!isSameMatterDraft(drawer, saved)) return false;
  clearMatterDraft(owner, store);
  return true;
}

export function matterStatusLabel(matter, t) {
  switch (matter.recordStatus ?? matter.status) {
    case "ready": case "added": return t ? t("workspace.matterStatus.ready") : "Directions added";
    case "needs_review": return t ? t("workspace.matterStatus.needs_review") : "Needs review";
    case "archived": return t ? t("workspace.matterStatus.archived") : "Archived";
    default: return t ? t("workspace.matterStatus.draft") : "Draft";
  }
}
