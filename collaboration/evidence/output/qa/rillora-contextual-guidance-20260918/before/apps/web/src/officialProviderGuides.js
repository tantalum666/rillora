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
