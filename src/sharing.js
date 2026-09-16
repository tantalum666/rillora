export const sharingLevels = [
  { value: "name", label: "Name", description: "Title · Category", fields: ["title", "category"] },
  { value: "directions", label: "Directions", description: "Provider · Location · Wishes", fields: ["title", "category", "institutionName", "locationHint", "desiredOutcome"] },
  { value: "details", label: "Details", description: "All saved details", fields: ["title", "category", "institutionName", "locationHint", "desiredOutcome", "accountHint", "valueBand", "currencyCode", "importance", "assetType", "debtType", "documentType", "deviceModel", "billingCycle", "renewalDate", "cryptoCustody", "network", "walletAddress", "walletLabel", "assetSymbol", "notes"] },
];
export const sharingStatus = { pending: "Invitation pending", expired: "Link expired", accepted: "Connected", revoked: "Disconnected" };
export const sharedFieldLabels = { institutionName: "Provider", locationHint: "Where to find it", desiredOutcome: "Wishes", accountHint: "Masked hint", valueBand: "Value range", currencyCode: "Currency", importance: "Importance", assetType: "Asset type", debtType: "Debt type", documentType: "Document type", deviceModel: "Model", billingCycle: "Billing cycle", renewalDate: "Next renewal", cryptoCustody: "Held in", network: "Blockchain network", walletAddress: "Public wallet address", walletLabel: "Wallet app or device", assetSymbol: "Asset or token", notes: "Notes" };
export function sharedFieldValue(key, value) {
  const labels = {
    desiredOutcome: { notify: "Notify someone", transfer_request: "Request transfer", close: "Request closure", delete_request: "Request deletion", memorialize: "Request memorialization", delay_disclosure: "Delay disclosure", never_disclose: "Never disclose", undecided: "Not decided" },
    cryptoCustody: { exchange: "An exchange", self_custody: "An on-chain wallet" },
    billingCycle: { monthly: "Monthly", annual: "Annual", other: "Other" },
    valueBand: { none: "No monetary value", under_1k: "Under 1,000", "1k_10k": "1,000–10,000", "10k_100k": "10,000–100,000", "100k_plus": "100,000+" },
    importance: { standard: "Standard", important: "Important", critical: "Critical" },
  };
  return labels[key]?.[value] ?? value;
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function invitationTokenFromUrl(value) {
  try {
    const url = new URL(value);
    if (!["https:", "http:", "rillora:"].includes(url.protocol)) return null;
    const token = new URLSearchParams(url.hash.slice(1)).get("invitation");
    return /^[A-Za-z0-9_-]{43}$/.test(token ?? "") ? token : null;
  } catch { return null; }
}
export function validateSharedResponse(value) {
  if (!value || value.readOnly !== true || value.purpose !== "planner_directed" || !Array.isArray(value.connections) || !Array.isArray(value.items)) throw new Error("Shared information could not be verified.");
  const connections = new Set(value.connections.map((connection) => {
    if (!uuid.test(connection.publicId) || typeof connection.ownerName !== "string" || connection.readOnly !== true) throw new Error("Invalid sharing connection.");
    return connection.publicId;
  }));
  for (const item of value.items) {
    const level = sharingLevels.find((option) => option.value === item.detailLevel);
    if (!level || !connections.has(item.connectionPublicId) || !uuid.test(item.matterPublicId) || !item.fields || typeof item.fields.title !== "string" || typeof item.fields.category !== "string"
      || Object.keys(item.fields).some((key) => !level.fields.includes(key)) || Object.values(item.fields).some((field) => typeof field !== "string")) throw new Error("Shared information exceeded its allowed detail level.");
  }
  return value;
}

export function validateSharingPreview(value, grants) {
  if (!value || value.preview !== true || value.readOnly !== true || value.purpose !== "planner_directed" || !Array.isArray(value.items) || value.items.length !== grants.length) throw new Error("The preview could not be verified.");
  const seen = new Set();
  for (const item of value.items) {
    const grant = grants.find(entry => entry.matterPublicId === item.matterPublicId);
    const level = sharingLevels.find(entry => entry.value === item.detailLevel);
    if (!grant || !level || grant.detailLevel !== level.value || seen.has(item.matterPublicId) || !item.fields || typeof item.fields.title !== "string" || typeof item.fields.category !== "string" || Object.keys(item.fields).some(key => !level.fields.includes(key)) || Object.values(item.fields).some(field => typeof field !== "string")) throw new Error("The preview exceeded its selected scope.");
    seen.add(item.matterPublicId);
  }
  return value;
}
