import { z } from "zod";

export const currentLegalContract = Object.freeze({
  termsVersion: "terms-2026-10-09-1",
  privacyVersion: "privacy-2026-09-15-1",
  consentTextVersion: "registration-clickwrap-2026-10-09-1",
  bundleSha256: "515e02711d81fd8e7574b993b590914737731109fbd3035a68bd2a21e8cf2124",
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
