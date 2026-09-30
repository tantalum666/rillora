import { z } from "zod";
export declare const currentLegalContract: Readonly<{
    termsVersion: "terms-2026-08-27-1";
    privacyVersion: "privacy-2026-09-15-1";
    consentTextVersion: "registration-clickwrap-2026-08-24-1";
    bundleSha256: "3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602";
}>;
declare const legalAcceptanceSchema: z.ZodObject<{
    termsVersion: z.ZodLiteral<"terms-2026-08-27-1">;
    privacyVersion: z.ZodLiteral<"privacy-2026-09-15-1">;
    consentTextVersion: z.ZodLiteral<"registration-clickwrap-2026-08-24-1">;
    bundleSha256: z.ZodLiteral<"3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602">;
    acceptedTerms: z.ZodLiteral<true>;
    acknowledgedPrivacy: z.ZodLiteral<true>;
    acceptedElectronicRecords: z.ZodLiteral<true>;
}, z.core.$strict>;
export type LegalAcceptance = z.infer<typeof legalAcceptanceSchema>;
export declare function parseLegalAcceptance(value: unknown): LegalAcceptance;
export declare function legalBundleDigest(value: LegalAcceptance): Buffer;
export {};
