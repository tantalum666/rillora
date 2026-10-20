import { createTranslator } from "./i18n/core.js";
import { en, zhCN } from "./i18n/messages/forms.js";

// Helpers default to English for existing non-React consumers; callers inject the
// active translator. Category/field IDs and submitted values never depend on locale.
const english = createTranslator("en", { en, "zh-CN": zhCN });
export const matterCategoryKeys = ["account", "financial_asset", "debt", "document", "device", "subscription", "crypto_asset"];
export const matterCategories = matterCategoryKeys.map(key => [key, english(`forms.category.${key}`)]);
const field = (key, t, required = false, max = 160) => ({ key, labelKey: `forms.field.${key}.label`, placeholderKey: `forms.field.${key}.placeholder`, label: t(`forms.field.${key}.label`), placeholder: t(`forms.field.${key}.placeholder`), required, max });
export function matterFields(draft, t = english) {
  switch (draft.category) {
    case "financial_asset": return [field("assetType", t)];
    case "debt": return [field("debtType", t)];
    case "document": return [field("documentType", t)];
    case "device": return [field("deviceModel", t)];
    case "subscription": return [field("renewalDate", t, false, 10)];
    case "crypto_asset": return [...(draft.details?.cryptoCustody === "self_custody" ? [
      field("network", t, true, 80),
      field("walletAddress", t, true, 200),
      field("walletLabel", t),
    ] : []), field("assetSymbol", t, false, 40)];
    default: return [];
  }
}
const providerKey = category => `forms.provider.${["financial_asset", "debt", "device", "document", "crypto_asset"].includes(category) ? category : "default"}`;
export const providerTitle = (category, t = english) => t(providerKey(category));
export const locationTitle = (category, t = english) => t(`forms.location.${["device", "document", "account", "debt"].includes(category) ? category : "default"}`);
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
// Validation returns semantic metadata before display formatting. The same issue
// is produced in every language, so changing language cannot alter save eligibility.
export function matterValidationIssue(draft) {
  const issue = (messageKey, params = {}) => ({ messageKey: `forms.validation.${messageKey}`, params });
  if (!draft.title?.trim()) return issue("name");
  if (!matterCategories.some(([key]) => key === draft.category)) return issue("category");
  if (requiresProvider(draft) && !draft.institution?.trim()) return issue("provider", { fieldKey: providerKey(draft.category), lowerCaseField: true });
  if (requiresLocation(draft.category) && !draft.location?.trim()) return issue("location");
  if (draft.category === "crypto_asset" && !["exchange", "self_custody"].includes(draft.details?.cryptoCustody)) return issue("custody");
  const details = applicableDetails(draft);
  for (const { key, labelKey, required, max } of matterFields(draft)) {
    if (required && !details[key]) return issue("requiredDetail", { fieldKey: labelKey, lowerCaseField: true });
    if (details[key]?.length > max) return issue("tooLong", { fieldKey: labelKey, max });
  }
  if (details.walletAddress && !/^[A-Za-z0-9:._-]+$/.test(details.walletAddress)) return issue("wallet");
  if (details.renewalDate && (!/^\d{4}-\d{2}-\d{2}$/.test(details.renewalDate) || !Number.isFinite(Date.parse(details.renewalDate)) || new Date(details.renewalDate).toISOString().slice(0,10) !== details.renewalDate)) return issue("date");
  if (hasValue(draft.category) && draft.currencyCode?.trim() && !/^[A-Za-z]{3}$/.test(draft.currencyCode.trim())) return issue("currency");
  for (const [key, max] of [["title", 120], ["institution", 160], ["location", 500], ["accountHint", 160], ["notes", 2000]]) {
    if ((key !== "institution" || showsProvider(draft)) && (key !== "accountHint" || showsAccountHint(draft)) && draft[key]?.trim().length > max) return issue("tooLong", { fieldKey: key === "notes" ? "forms.notes" : "forms.validation.thisField", max });
  }
  return null;
}
export function matterValidation(draft, t = english, formatNumber = value => value.toLocaleString("en-US")) {
  const issue = matterValidationIssue(draft);
  if (!issue) return null;
  const { fieldKey, lowerCaseField, max } = issue.params;
  const field = fieldKey ? t(fieldKey) : undefined;
  return t(issue.messageKey, { ...issue.params, field: lowerCaseField ? field?.toLowerCase() : field, max: max === undefined ? undefined : formatNumber(max) });
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
