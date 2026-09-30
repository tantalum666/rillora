import { test } from "node:test";
import assert from "node:assert/strict";
import { applicableDetails, matterValidation, matterPayload, toMatterDraft, matterDraftChanged } from "../src/matterForm.js";

test("each category needs a real locator before saving", () => {
  for (const category of ["account", "financial_asset", "debt", "subscription", "document", "device", "crypto_asset"]) {
    const draft = toMatterDraft({ title: "Named", category });
    assert.ok(matterValidation(draft));
    if (["document", "device"].includes(category)) draft.location = "Blue folder";
    else if (category !== "crypto_asset") draft.institution = "Provider";
    else draft.details = { cryptoCustody: "self_custody", network: "Ethereum", walletAddress: "0x1234" };
    assert.equal(matterValidation(draft), null);
  }
});
test("custody and category changes submit only visible typed fields without destroying drafts", () => {
  const draft = toMatterDraft({ title: "Wallet", category: "crypto_asset", institution: "Exchange", details: { cryptoCustody: "self_custody", network: "Ethereum", walletAddress: "0x1234", assetType: "Savings" } });
  assert.deepEqual(applicableDetails(draft), { cryptoCustody: "self_custody", network: "Ethereum", walletAddress: "0x1234" });
  draft.details.cryptoCustody = "exchange";
  assert.deepEqual(matterPayload(draft).details, { cryptoCustody: "exchange" });
  assert.equal(draft.details.walletAddress, "0x1234");
  draft.category = "financial_asset";
  assert.deepEqual(matterPayload(draft).details, { assetType: "Savings" });
});
test("notes round-trip, clearing, maximum, malformed dates and missing wallet addresses", () => {
  const draft = toMatterDraft({ title: "Membership", category: "subscription", institutionName: "Provider", notes: "A note", details: { renewalDate: "2026-02-30" } });
  assert.ok(matterValidation(draft)); draft.details.renewalDate = "2026-02-28";
  assert.equal(matterValidation(draft), null); assert.equal(matterPayload(draft).notes, "A note");
  draft.notes = "x".repeat(2001); assert.ok(matterValidation(draft));
  draft.notes = "  "; assert.equal(matterPayload(draft).notes, null);
  draft.initialValues = { ...draft, details: { ...draft.details } }; assert.equal(matterDraftChanged(draft), false);
  draft.details = { ...draft.details, billingCycle: "annual" }; assert.equal(matterDraftChanged(draft), true);
});

test("hidden generic fields are neither submitted nor a validation trap after category change", () => {
  const draft = toMatterDraft({ title: "Document", category: "document", location: "Blue folder", accountHint: "x".repeat(161), valueBand: "100k_plus", currencyCode: "INVALID" });
  assert.equal(matterValidation(draft), null);
  const payload = matterPayload(draft);
  assert.equal(payload.accountHint, null); assert.equal(payload.valueBand, "unknown"); assert.equal(payload.currencyCode, null);
  assert.equal(draft.currencyCode, "INVALID");
  draft.category = "financial_asset"; draft.institution = "Bank";
  assert.ok(matterValidation(draft));
});
