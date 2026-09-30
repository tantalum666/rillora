export const matterCategories = [
  ["account", "Online account"], ["financial_asset", "Financial asset"], ["debt", "Debt"],
  ["document", "Document"], ["device", "Device"], ["subscription", "Subscription"], ["crypto_asset", "Crypto asset"],
];
const field = (key, label, placeholder, required = false, max = 160) => ({ key, label, placeholder, required, max });
export function matterFields(draft) {
  switch (draft.category) {
    case "financial_asset": return [field("assetType", "Asset type", "Savings, investment or insurance")];
    case "debt": return [field("debtType", "Debt type", "Mortgage, loan or credit card")];
    case "document": return [field("documentType", "Document type", "Will, policy or certificate")];
    case "device": return [field("deviceModel", "Model", "Device model")];
    case "subscription": return [field("renewalDate", "Next renewal", "YYYY-MM-DD", false, 10)];
    case "crypto_asset": return [...(draft.details?.cryptoCustody === "self_custody" ? [
      field("network", "Blockchain network", "Ethereum, Bitcoin or another network", true, 80),
      field("walletAddress", "Public wallet address", "Public address only", true, 200),
      field("walletLabel", "Wallet app or device", "Where you manage this wallet"),
    ] : []), field("assetSymbol", "Asset or token", "BTC, ETH, USDC…", false, 40)];
    default: return [];
  }
}
export const providerTitle = (category) => ({ financial_asset: "Institution", debt: "Creditor", device: "Manufacturer", document: "Issuer", crypto_asset: "Exchange" })[category] ?? "Provider";
export const locationTitle = (category) => ({ device: "Where you keep it", document: "Document location", account: "Recovery information location", debt: "Agreement location" })[category] ?? "Where to find the records";
export const requiresLocation = (category) => ["device", "document"].includes(category);
export const hasValue = (category) => ["financial_asset", "debt", "crypto_asset"].includes(category);
export const showsAccountHint = (draft) => draft.category !== "document" && !(draft.category === "crypto_asset" && draft.details?.cryptoCustody === "self_custody");
export const showsProvider = (draft) => draft.category !== "crypto_asset" || draft.details?.cryptoCustody === "exchange";
export const requiresProvider = (draft) => ["account", "financial_asset", "debt", "subscription"].includes(draft.category) || (draft.category === "crypto_asset" && draft.details?.cryptoCustody === "exchange");
export function applicableDetails(draft) {
  const allowed = new Set(matterFields(draft).map(({ key }) => key));
  if (draft.category === "crypto_asset") allowed.add("cryptoCustody");
  if (draft.category === "subscription") allowed.add("billingCycle");
  return Object.fromEntries(Object.entries(draft.details ?? {}).filter(([key, value]) => allowed.has(key) && value.trim()).map(([key, value]) => [key, value.trim()]));
}
export function matterValidation(draft) {
  if (!draft.title?.trim()) return "Add a name.";
  if (!matterCategories.some(([key]) => key === draft.category)) return "Choose a category.";
  if (requiresProvider(draft) && !draft.institution?.trim()) return `Add the ${providerTitle(draft.category).toLowerCase()}.`;
  if (requiresLocation(draft.category) && !draft.location?.trim()) return "Add where to find it.";
  if (draft.category === "crypto_asset" && !["exchange", "self_custody"].includes(draft.details?.cryptoCustody)) return "Choose an exchange or an on-chain wallet.";
  const details = applicableDetails(draft);
  for (const { key, label, required, max } of matterFields(draft)) {
    if (required && !details[key]) return `Add the ${label.toLowerCase()}.`;
    if (details[key]?.length > max) return `${label} must be ${max} characters or fewer.`;
  }
  if (details.walletAddress && !/^[A-Za-z0-9:._-]+$/.test(details.walletAddress)) return "Use a public wallet address without spaces.";
  if (details.renewalDate && (!/^\d{4}-\d{2}-\d{2}$/.test(details.renewalDate) || !Number.isFinite(Date.parse(details.renewalDate)) || new Date(details.renewalDate).toISOString().slice(0,10) !== details.renewalDate)) return "Use a valid renewal date: YYYY-MM-DD.";
  if (hasValue(draft.category) && draft.currencyCode?.trim() && !/^[A-Za-z]{3}$/.test(draft.currencyCode.trim())) return "Use a three-letter currency code.";
  for (const [key, max] of [["title", 120], ["institution", 160], ["location", 500], ["accountHint", 160], ["notes", 2000]]) {
    if ((key !== "institution" || showsProvider(draft)) && (key !== "accountHint" || showsAccountHint(draft)) && draft[key]?.trim().length > max) return `${key === "notes" ? "Notes" : "This field"} must be ${max.toLocaleString()} characters or fewer.`;
  }
  return null;
}
export function toMatterDraft(matter = {}) {
  return {
    title: matter.title ?? matter.label ?? "", category: matter.category ?? "account",
    institution: matter.institutionName ?? matter.institution ?? "", location: matter.locationHint ?? matter.location ?? "",
    accountHint: matter.accountHint ?? "", valueBand: matter.valueBand ?? "unknown", currencyCode: matter.currencyCode ?? "",
    importance: matter.importance ?? "important", desiredOutcome: matter.desiredOutcome ?? "undecided",
    status: matter.recordStatus ?? matter.status ?? "draft", details: { ...(matter.details ?? {}) }, notes: matter.notes ?? "",
  };
}
export function matterPayload(draft) {
  return {
    category: draft.category, title: draft.title.trim(), institutionName: showsProvider(draft) ? draft.institution.trim() || null : null,
    locationHint: draft.location.trim() || null, accountHint: showsAccountHint(draft) ? draft.accountHint.trim() || null : null,
    valueBand: hasValue(draft.category) ? draft.valueBand : "unknown", currencyCode: hasValue(draft.category) ? draft.currencyCode.trim().toUpperCase() || null : null,
    importance: draft.importance, desiredOutcome: draft.desiredOutcome, status: draft.status,
    details: applicableDetails(draft), notes: draft.notes.trim() || null,
  };
}
export const matterDraftChanged = (draft) => Object.keys(toMatterDraft()).some((key) => JSON.stringify(draft[key]) !== JSON.stringify(draft.initialValues?.[key]));
