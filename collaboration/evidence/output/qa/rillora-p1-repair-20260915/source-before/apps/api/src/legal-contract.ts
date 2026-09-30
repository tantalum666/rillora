import { z } from "zod";

export const currentLegalContract = Object.freeze({
  termsVersion: "terms-2026-08-27-1",
  privacyVersion: "privacy-2026-08-27-1",
  consentTextVersion: "registration-clickwrap-2026-08-24-1",
  bundleSha256: "73d9cb6039b97f72d802e543d03944355e68b2bc59a7f859326ce3236b704d2b",
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
