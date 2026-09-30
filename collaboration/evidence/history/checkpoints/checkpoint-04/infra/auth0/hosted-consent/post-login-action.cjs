// Deployment substitutes only these public resource identifiers after readback.
const IOS_CLIENT_ID = "__RILLORA_IOS_CLIENT_ID__";
const FORM_ID = "__RILLORA_FORM_ID__";
const CLAIM = "https://rillora.xyz/legal-acceptance";
const CURRENT = Object.freeze({
  termsVersion: "terms-2026-08-27-1",
  privacyVersion: "privacy-2026-09-15-1",
  consentTextVersion: "registration-clickwrap-2026-08-24-1",
  bundleSha256: "3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602",
  acceptedTerms: true,
  acknowledgedPrivacy: true,
  acceptedElectronicRecords: true,
});

exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== IOS_CLIENT_ID) return;
  // Existing app versions retain their native affirmative-consent contract.
  // Only the new direct-hosted entry opts into this migration.
  if (event.request?.query?.rillora_auth_ui !== "single-hosted-v1") return;
  if (!/^ap_[A-Za-z0-9]+$/.test(FORM_ID)) {
    api.access.deny("Account acknowledgement is not configured.");
    return;
  }
  // Each interactive login receives an unchecked form. No consent metadata,
  // password, new M2M credential or vault connection is created here.
  api.prompt.render(FORM_ID, {
    fields: { rillora_legal_accepted: false },
    vars: { rillora_legal_bundle: CURRENT.bundleSha256 },
  });
};

exports.onContinuePostLogin = async (event, api) => {
  if (event.client.client_id !== IOS_CLIENT_ID) return;
  if (
    event.prompt?.id !== FORM_ID ||
    event.prompt?.fields?.rillora_legal_accepted !== true ||
    event.prompt?.vars?.rillora_legal_bundle !== CURRENT.bundleSha256
  ) {
    api.access.deny("Accept the current account terms before continuing.");
    return;
  }
  // Only this transaction's validated legal field can produce the receipt.
  // The Rillora API remains the acceptance and session system of record.
  api.accessToken.setCustomClaim(CLAIM, CURRENT);
};
