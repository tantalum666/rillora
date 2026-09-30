import { z } from "zod";
export declare const matterDetailsSchema: z.ZodObject<{
    assetType: z.ZodOptional<z.ZodString>;
    debtType: z.ZodOptional<z.ZodString>;
    documentType: z.ZodOptional<z.ZodString>;
    deviceModel: z.ZodOptional<z.ZodString>;
    billingCycle: z.ZodOptional<z.ZodEnum<{
        annual: "annual";
        monthly: "monthly";
        other: "other";
    }>>;
    renewalDate: z.ZodOptional<z.ZodISODate>;
    cryptoCustody: z.ZodOptional<z.ZodEnum<{
        exchange: "exchange";
        self_custody: "self_custody";
    }>>;
    network: z.ZodOptional<z.ZodString>;
    walletAddress: z.ZodOptional<z.ZodString>;
    walletLabel: z.ZodOptional<z.ZodString>;
    assetSymbol: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type MatterDetails = z.infer<typeof matterDetailsSchema>;
export declare function validateMatterRequirements(input: {
    category: string;
    institutionName?: string | null | undefined;
    locationHint?: string | null | undefined;
    details?: MatterDetails;
}, context: z.RefinementCtx, allowIncompleteRestore?: boolean): void;
