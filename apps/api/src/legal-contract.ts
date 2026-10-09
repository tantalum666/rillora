import { z } from "zod";

export const currentLegalContract = Object.freeze({
  termsVersion: "terms-2026-10-09-1",
  privacyVersion: "privacy-2026-09-15-1",
  consentTextVersion: "registration-clickwrap-2026-10-09-1",
  bundleSha256: "c983dc26bb372fba66b8df467d6e4c0ea1d85a2f4d94d86104b4bffa8d7f3ddb",
});

const legalAcceptanceSchema = z.object({
  termsVersion: z.literal(currentLegalContract.termsVersion),
  privacyVersion: z.literal(currentLegalContract.privacyVersion),
  consentTextVersion: z.literal(currentLegalContract.consentTextVersion),
  bundleSha256: z.literal(currentLegalContract.bundleSha256),
  acceptedTerms: z.literal(true),
  acknowledgedPrivacy: z.literal(true),
  acceptedElectronicRecords: z.literal(true),
}).strict();

export type LegalAcceptance = z.infer<typeof legalAcceptanceSchema>;

export function parseLegalAcceptance(value: unknown): LegalAcceptance {
  return legalAcceptanceSchema.parse(value);
}

export function legalBundleDigest(value: LegalAcceptance): Buffer {
  return Buffer.from(value.bundleSha256, "hex");
}
