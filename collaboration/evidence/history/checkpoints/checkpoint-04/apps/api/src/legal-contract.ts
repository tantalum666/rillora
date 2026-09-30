import { z } from "zod";

export const currentLegalContract = Object.freeze({
  termsVersion: "terms-2026-08-27-1",
  privacyVersion: "privacy-2026-09-15-1",
  consentTextVersion: "registration-clickwrap-2026-08-24-1",
  bundleSha256: "3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602",
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
