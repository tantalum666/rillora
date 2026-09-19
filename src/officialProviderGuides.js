import catalog from "../../../config/provider-guides.json" with { type: "json" };

const kindLabels = { prepareNow: "Preparation guidance", estateRequest: "After-death request", prepareAndRequest: "Preparation and requests" };
export const selfReportedProviderKeys = Object.freeze(catalog.selfReportedProviderKeys);
export const officialProviderGroups = Object.freeze(catalog.groups);
export const officialProviderGuides = Object.freeze(catalog.guides.map(guide => Object.freeze({
  ...guide,
  key: guide.id,
  label: guide.name,
  kindCode: guide.kind,
  kind: kindLabels[guide.kind],
  detail: guide.summary,
  doNow: guide.prepareSteps,
  later: guide.laterSteps,
  requirements: guide.usuallyRequested,
  reviewed: guide.lastReviewed,
  linkDetails: guide.links,
  links: guide.links.map(link => [link.title, link.urlString]),
})));
export function getOfficialProviderGuide(key) { return officialProviderGuides.find(guide => guide.key === key) ?? null; }
export function guideMatchesQuery(guide, query) {
  const needle = query.trim().toLocaleLowerCase();
  return !needle || [guide.label, guide.detail, ...guide.aliases].some(value => value.toLocaleLowerCase().includes(needle));
}
export function guideInitialPart(guide) { return guide.kindCode === "estateRequest" ? "later" : "now"; }
export function guideLinksForPart(guide, part) {
  if (part === "details") return guide.linkDetails;
  const phase = part === "now" ? "prepare" : "afterDeath";
  const matching = guide.linkDetails.filter(link => link.phase === phase || link.phase === "both");
  return matching.length ? matching : guide.linkDetails;
}

const normalizeMatch = value => String(value ?? "").normalize("NFKC").toLowerCase().trim();
function containsTerm(value, term) {
  const needle = normalizeMatch(term);
  if (!needle) return false;
  if (/\p{Script=Han}/u.test(needle)) return value.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?![a-z0-9])`, "u").test(value);
}
// Call with only the current viewer's permitted fields. Never search notes,
// account hints, email addresses or an unprojected owner's matter record.
export function suggestedAccountGuides({ title = "", institutionName, category, cryptoCustody } = {}) {
  if (!["account", "subscription", "device", "crypto_asset", "financial_asset"].includes(category)) return [];
  const eligible = officialProviderGuides.filter(guide => !(category === "crypto_asset" && cryptoCustody === "self_custody" && guide.group === "money"));
  const provider = normalizeMatch(institutionName);
  const explicit = eligible.filter(guide => guide.matterMatch.exactProviderTerms.some(term => normalizeMatch(term) === provider)
    || guide.matterMatch.terms.some(term => containsTerm(provider, term)));
  const matches = explicit.length ? explicit : eligible.filter(guide => guide.matterMatch.terms.some(term => containsTerm(normalizeMatch(title), term)));
  const suppressed = new Set(matches.flatMap(guide => guide.matterMatch.suppresses));
  return matches.filter(guide => !suppressed.has(guide.key)).slice(0, 3);
}
