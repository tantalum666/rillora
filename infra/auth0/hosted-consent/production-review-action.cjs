// A separate client-scoped action; the existing Preview action stays unchanged.
const crypto = require('node:crypto');
const WEB = 'EcevpyKt1GELKwkLnVU3aCbh3Ix2SJhz';
const IOS = 'POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4';
const IDENTITY_DIGESTS = '__REVIEW_IDENTITY_DIGEST__'.split(',');
const EXPIRES_AT = '__REVIEW_EXPIRES_AT__';
const FORM = '__RILLORA_FORM_ID__';
const CURRENT = Object.freeze({
  termsVersion: 'terms-2026-08-27-1', privacyVersion: 'privacy-2026-09-15-1',
  consentTextVersion: 'registration-clickwrap-2026-08-24-1',
  bundleSha256: '3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602',
  acceptedTerms: true, acknowledgedPrivacy: true, acceptedElectronicRecords: true,
});
function authorized(event, api) {
  const digest = crypto.createHash('sha256').update(`https://login.rillora.xyz\u001f${event.user.user_id}`).digest('hex');
  if (IDENTITY_DIGESTS.length < 1 || IDENTITY_DIGESTS.length > 8
      || new Set(IDENTITY_DIGESTS).size !== IDENTITY_DIGESTS.length
      || !IDENTITY_DIGESTS.every(value => /^[a-f0-9]{64}$/.test(value))
      || !IDENTITY_DIGESTS.includes(digest)
      || !Number.isFinite(Date.parse(EXPIRES_AT)) || Date.now() >= Date.parse(EXPIRES_AT)) {
    api.access.deny('Account access is not open for this identity.'); return false;
  }
  return true;
}
exports.onExecutePostLogin = async (event, api) => {
  if (![WEB, IOS].includes(event.client.client_id)) return;
  if (!authorized(event, api) || event.client.client_id === WEB) return;
  if (event.request?.query?.rillora_auth_ui !== 'single-hosted-v1' || !/^ap_[A-Za-z0-9]+$/.test(FORM)) {
    api.access.deny('Account acknowledgement is not configured.'); return;
  }
  api.prompt.render(FORM, {fields:{rillora_legal_accepted:false},vars:{rillora_legal_bundle:CURRENT.bundleSha256}});
};
exports.onContinuePostLogin = async (event, api) => {
  if (event.client.client_id !== IOS) return;
  if (!authorized(event, api)) return;
  if (event.prompt?.id !== FORM || event.prompt?.fields?.rillora_legal_accepted !== true
      || event.prompt?.vars?.rillora_legal_bundle !== CURRENT.bundleSha256) {
    api.access.deny('Accept the current account terms before continuing.'); return;
  }
  api.accessToken.setCustomClaim('https://rillora.xyz/legal-acceptance',CURRENT);
};
