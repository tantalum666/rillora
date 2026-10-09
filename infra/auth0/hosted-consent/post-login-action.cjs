// Deployment substitutes only these public resource identifiers after readback.
const IOS_CLIENT_ID = "__RILLORA_IOS_CLIENT_ID__";
const FORM_ID = "__RILLORA_FORM_ID__";
const FORM_ZH_ID = "__RILLORA_FORM_ZH_ID__";
const CLAIM = "https://rillora.xyz/legal-acceptance";
function isChinese(event) {
  const locale = event.request?.query?.ui_locales ?? event.transaction?.locale ?? "en";
  return event.prompt?.id === FORM_ZH_ID || (typeof locale === "string" && locale.startsWith("zh"));
}
const CURRENT = Object.freeze({
  termsVersion: "terms-2026-10-09-1",
  privacyVersion: "privacy-2026-09-15-1",
  consentTextVersion: "registration-clickwrap-2026-10-09-1",
  bundleSha256: "515e02711d81fd8e7574b993b590914737731109fbd3035a68bd2a21e8cf2124",
  acceptedTerms: true,
  acknowledgedPrivacy: true,
  acceptedElectronicRecords: true,
});

exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== IOS_CLIENT_ID) return;
  // Existing app versions retain their native affirmative-consent contract.
  // Only the new direct-hosted entry opts into this migration.
  if (event.request?.query?.rillora_auth_ui !== "single-hosted-v1") return;
  const formId = isChinese(event) ? FORM_ZH_ID : FORM_ID;
  if (!/^ap_[A-Za-z0-9]+$/.test(formId)) {
    api.access.deny(isChinese(event) ? "账号条款暂时不可用，请稍后重试。" : "Account acknowledgement is not configured.");
    return;
  }
  // Each interactive login receives an unchecked form. No consent metadata,
  // password, new M2M credential or vault connection is created here.
  api.prompt.render(formId, {
    fields: { rillora_legal_accepted: false },
    vars: { rillora_legal_bundle: CURRENT.bundleSha256 },
  });
};

exports.onContinuePostLogin = async (event, api) => {
  if (event.client.client_id !== IOS_CLIENT_ID) return;
  if (
    ![FORM_ID, FORM_ZH_ID].includes(event.prompt?.id) ||
    event.prompt?.fields?.rillora_legal_accepted !== true ||
    event.prompt?.vars?.rillora_legal_bundle !== CURRENT.bundleSha256
  ) {
    api.access.deny(isChinese(event) ? "请同意当前账号条款后继续。" : "Accept the current account terms before continuing.");
    return;
  }
  // Only this transaction's validated legal field can produce the receipt.
  // The Rillora API remains the acceptance and session system of record.
  api.accessToken.setCustomClaim(CLAIM, CURRENT);
};
