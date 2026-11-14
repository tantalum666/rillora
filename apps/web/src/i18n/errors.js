// Only known machine codes are localized. Never translate, log, or interpolate arbitrary server content.
const errorKeys = Object.freeze({
  authentication_required: "common.error.authentication",
  reauthentication_required: "common.error.reauthentication",
  account_changed: "common.error.accountChanged",
  invalid_session: "common.error.invalidSession",
  invalid_pagination: "common.error.incompleteMap",
  version_conflict: "common.error.conflict",
  saved_draft_changed: "common.error.savedDraftChanged",
  service_not_open: "common.error.serviceNotOpen",
  verified_email_required: "common.error.verifiedEmail",
  billing_confirmation_required: "common.error.billingConfirmation",
  temporarily_unavailable: "common.error.unavailable",
  identity_status_unavailable: "common.error.unavailable",
  invalid_export_response: "common.error.invalidResponse",
  invalid_disclosure_rehearsal_response: "common.error.invalidResponse",
  invalid_role_assignment_response: "common.error.invalidResponse",
});

export function errorMessage(error, t, fallbackKey = "common.error.request") {
  const key = Object.hasOwn(errorKeys, error?.code) ? errorKeys[error.code]
    : error?.status === 429 ? "common.error.rateLimit"
      : error?.status === 401 ? "common.error.authentication" : fallbackKey;
  return t(key);
}
