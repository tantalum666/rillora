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
const fieldsByCategory = {
    account: [], financial_asset: ["assetType"], debt: ["debtType"],
    document: ["documentType"], device: ["deviceModel"],
    subscription: ["billingCycle", "renewalDate"],
    crypto_asset: ["cryptoCustody", "network", "walletAddress", "walletLabel", "assetSymbol"],
};
export function validateMatterRequirements(input, context, allowIncompleteRestore = false) {
    const details = input.details ?? {};
    const issue = (path, message) => context.addIssue({ code: "custom", path, message });
    for (const key of Object.keys(details)) {
        if (!fieldsByCategory[input.category]?.includes(key))
            issue(["details", key], "This field does not belong to the selected category.");
    }
    if (!allowIncompleteRestore && ["account", "financial_asset", "debt", "subscription"].includes(input.category) && !input.institutionName?.trim()) {
        issue(["institutionName"], input.category === "debt" ? "Add the creditor." : "Add the institution or provider.");
    }
    if (!allowIncompleteRestore && ["device", "document"].includes(input.category) && !input.locationHint?.trim())
        issue(["locationHint"], "Add where to find it.");
    if (input.category === "crypto_asset") {
        if (!allowIncompleteRestore && !details.cryptoCustody)
            issue(["details", "cryptoCustody"], "Choose an exchange or an on-chain wallet.");
        if (details.cryptoCustody === "exchange") {
            if (!allowIncompleteRestore && !input.institutionName?.trim())
                issue(["institutionName"], "Add the exchange.");
            for (const key of ["network", "walletAddress", "walletLabel"]) {
                if (details[key])
                    issue(["details", key], "Wallet fields belong to an on-chain wallet.");
            }
        }
        if (details.cryptoCustody === "self_custody") {
            if (!allowIncompleteRestore && !details.network)
                issue(["details", "network"], "Add the blockchain network.");
            if (!allowIncompleteRestore && !details.walletAddress)
                issue(["details", "walletAddress"], "Add the public wallet address.");
        }
    }
}
