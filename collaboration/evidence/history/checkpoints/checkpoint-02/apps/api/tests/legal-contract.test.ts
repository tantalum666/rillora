import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  currentLegalContract,
  parseLegalAcceptance,
} from "../src/legal-contract.js";

describe("versioned legal contract", () => {
  it("matches the normalized Web legal bundle source", async () => {
    const source = await readFile(
      new URL("../../web/src/LegalDocumentPage.jsx", import.meta.url),
      "utf8",
    );
    expect(createHash("sha256").update(source).digest("hex"))
      .toBe(currentLegalContract.bundleSha256);
  });

  it("accepts only the exact current versions and affirmative actions", () => {
    expect(parseLegalAcceptance({
      ...currentLegalContract,
      acceptedTerms: true,
      acknowledgedPrivacy: true,
      acceptedElectronicRecords: true,
    })).toEqual(expect.objectContaining(currentLegalContract));

    expect(() => parseLegalAcceptance({
      ...currentLegalContract,
      acceptedTerms: false,
      acknowledgedPrivacy: true,
      acceptedElectronicRecords: true,
    })).toThrow();
  });

  it("rejects a stale document version or unknown evidence field", () => {
    expect(() => parseLegalAcceptance({
      ...currentLegalContract,
      termsVersion: "terms-stale",
      acceptedTerms: true,
      acknowledgedPrivacy: true,
      acceptedElectronicRecords: true,
    })).toThrow();
    expect(() => parseLegalAcceptance({
      ...currentLegalContract,
      acceptedTerms: true,
      acknowledgedPrivacy: true,
      acceptedElectronicRecords: true,
      silentlyPrechecked: true,
    })).toThrow();
  });
});
