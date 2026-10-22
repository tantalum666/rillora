const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const opaque = /^[A-Za-z0-9_-]{43}$/;
const statuses = new Set(["pending", "expired", "acknowledged", "declined", "revoked"]);
function invalid() { return Object.assign(new Error("Invalid future arrangement response"), { status: 502, code: "invalid_future_notice" }); }
function onlyKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw invalid();
}
function common(value, keys) {
  onlyKeys(value, keys);
  if (!uuid.test(value.publicId) || value.purpose !== "future_notice" || value.contentAvailable !== false || !statuses.has(value.status)) throw invalid();
  if (keys.includes("version") && (!Number.isSafeInteger(value.version) || value.version < 1)) throw invalid();
}
export function validateFutureNotice(value, kind = "received") {
  if (kind === "owner") {
    common(value, ["publicId", "personPublicId", "emailHint", "status", "expiresAt", "acknowledgedAt", "version", "purpose", "contentAvailable"]);
    if (!uuid.test(value.personPublicId) || typeof value.emailHint !== "string" || !Number.isFinite(Date.parse(value.expiresAt))
      || (value.acknowledgedAt !== null && !Number.isFinite(Date.parse(value.acknowledgedAt)))) throw invalid();
  } else if (kind === "public") {
    common(value, ["publicId", "status", "expiresAt", "purpose", "contentAvailable"]);
    if (value.status !== "pending" || !Number.isFinite(Date.parse(value.expiresAt))) throw invalid();
  } else {
    common(value, ["publicId", "ownerName", "status", "version", "purpose", "contentAvailable"]);
    if (typeof value.ownerName !== "string" || !value.ownerName.trim() || !["pending", "acknowledged"].includes(value.status)) throw invalid();
  }
  return value;
}
export function validateFutureNoticeEnvelope(value, kind = "owner") {
  onlyKeys(value, kind === "owner" ? ["notice", "invitationUrl"] : ["notice"]);
  if (value.notice === null && kind === "owner" && !value.invitationUrl) return value;
  validateFutureNotice(value.notice, kind);
  if (value.invitationUrl !== undefined && !futureNoticeTokenFromUrl(value.invitationUrl)) throw invalid();
  return value;
}
export function validateFutureNoticeLeave(value) {
  onlyKeys(value, ["left", "contentAvailable"]);
  if (value.left !== true || value.contentAvailable !== false) throw invalid();
  return value;
}
export function validateFutureNoticeList(value) {
  onlyKeys(value, ["notices", "contentAvailable"]);
  if (value.contentAvailable !== false || !Array.isArray(value.notices) || value.notices.length > 100) throw invalid();
  const ids = new Set();
  for (const notice of value.notices) {
    validateFutureNotice(notice);
    if (notice.status !== "acknowledged" || ids.has(notice.publicId)) throw invalid();
    ids.add(notice.publicId);
  }
  return value;
}
export function validateFutureNoticeDecision(value) {
  onlyKeys(value, ["result"]);
  const result = value.result;
  onlyKeys(result, ["publicId", "status", "version", "contentAvailable"]);
  if (!uuid.test(result.publicId) || !["acknowledged", "declined"].includes(result.status)
    || result.contentAvailable !== false || !Number.isSafeInteger(result.version) || result.version < 1) throw invalid();
  return value;
}
export function futureNoticeTokenFromUrl(value) {
  try {
    const url = new URL(String(value).trim());
    const trusted = url.protocol === "https:" && ["app.rillora.xyz", "app.staging.rillora.xyz"].includes(url.hostname) && !url.port
      || ["http:", "https:"].includes(url.protocol) && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (!trusted || url.username || url.password || url.pathname !== "/future-invite") return null;
    if ([...url.searchParams.keys()].some(key => key !== "lang") || url.searchParams.getAll("lang").length > 1
      || url.searchParams.has("lang") && !["en", "zh-CN"].includes(url.searchParams.get("lang"))) return null;
    const values = new URLSearchParams(url.hash.slice(1));
    if ([...values.keys()].length !== 1 || !opaque.test(values.get("invitation") ?? "")) return null;
    return values.get("invitation");
  } catch { return null; }
}
