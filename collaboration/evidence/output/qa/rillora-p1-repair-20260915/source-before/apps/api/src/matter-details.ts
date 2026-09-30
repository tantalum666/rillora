import { z } from "zod";

const text = (max = 160) => z.string().trim().min(1).max(max);
export const matterDetailsSchema = z.object({
  assetType: text().optional(),
  debtType: text().optional(),
  documentType: text().optional(),
  deviceModel: text().optional(),
  billingCycle: z.enum(["monthly", "annual", "other"]).optional(),
  renewalDate: z.iso.date().optional(),
  cryptoCustody: z.enum(["exchange", "self_custody"]).optional(),
  network: text(80).optional(),
  walletAddress: text(200).regex(/^[A-Za-z0-9:._-]+$/, "Use a public wallet address without spaces.").optional(),
  walletLabel: text().optional(),
  assetSymbol: text(40).optional(),
}).strict();

export type MatterDetails = z.infer<typeof matterDetailsSchema>;
const fieldsByCategory: Record<string, string[]> = {
  account: [], financial_asset: ["assetType"], debt: ["debtType"],
  document: ["documentType"], device: ["deviceModel"],
  subscription: ["billingCycle", "renewalDate"],
  crypto_asset: ["cryptoCustody", "network", "walletAddress", "walletLabel", "assetSymbol"],
};

export function validateMatterRequirements(
  input: { category: string; institutionName?: string | null | undefined; locationHint?: string | null | undefined; details?: MatterDetails },
  context: z.RefinementCtx,
) {
  const details = input.details ?? {};
  const issue = (path: string[], message: string) => context.addIssue({ code: "custom", path, message });
  for (const key of Object.keys(details)) {
    if (!fieldsByCategory[input.category]?.includes(key)) issue(["details", key], "This field does not belong to the selected category.");
  }
  if (["account", "financial_asset", "debt", "subscription"].includes(input.category) && !input.institutionName?.trim()) {
    issue(["institutionName"], input.category === "debt" ? "Add the creditor." : "Add the institution or provider.");
  }
  if (["device", "document"].includes(input.category) && !input.locationHint?.trim()) issue(["locationHint"], "Add where to find it.");
  if (input.category === "crypto_asset") {
    if (!details.cryptoCustody) issue(["details", "cryptoCustody"], "Choose an exchange or an on-chain wallet.");
    if (details.cryptoCustody === "exchange") {
      if (!input.institutionName?.trim()) issue(["institutionName"], "Add the exchange.");
      for (const key of ["network", "walletAddress", "walletLabel"] as const) {
        if (details[key]) issue(["details", key], "Wallet fields belong to an on-chain wallet.");
      }
    }
    if (details.cryptoCustody === "self_custody") {
      if (!details.network) issue(["details", "network"], "Add the blockchain network.");
      if (!details.walletAddress) issue(["details", "walletAddress"], "Add the public wallet address.");
    }
  }
}
