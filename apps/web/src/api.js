import { normalizeCommercialStatus, normalizePurchaseRoute } from "./commercialAccess.js";
import { validateSharingPreview, validateSharedResponse } from "./sharing.js";
import { validateFamilyMaintenance } from "./familyMaintenance.js";

export class ApiClientError extends Error {
  constructor(status, code, message, requestId) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function createApiClient({
  baseUrl = "/api/v1",
  fetchImpl = globalThis.fetch,
  devPlannerId = null,
  csrfTokenReader = readCsrfCookie,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("A Fetch implementation is required");
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const publicBase = normalizedBase.endsWith("/v1")
    ? normalizedBase.slice(0, -3)
    : normalizedBase;

  async function request(path, options = {}, context = {}) {
    const responseKind = options.responseKind ?? "json";
    const { responseKind: _responseKind, ...fetchOptions } = options;
    const method = (options.method ?? "GET").toUpperCase();
    const headers = new Headers(options.headers);
    if (!context.publicRehearsal) headers.set("x-rillora-client", "web");
    if (context.rehearsalSessionToken) {
      headers.set("authorization", `Rillora-Rehearsal ${context.rehearsalSessionToken}`);
    } else if (devPlannerId) {
      headers.set("x-dev-planner-id", devPlannerId);
    }
    if (!context.publicRehearsal && !["GET", "HEAD", "OPTIONS"].includes(method)) {
      const csrfToken = csrfTokenReader();
      if (csrfToken) headers.set("x-csrf-token", csrfToken);
    }
    if (options.body !== undefined && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const requestBase = context.publicRehearsal || context.publicAuth
      ? publicBase
      : normalizedBase;
    const response = await fetchImpl(`${requestBase}${path}`, {
      ...fetchOptions,
      method,
      credentials: context.publicRehearsal ? "omit" : "include",
      headers,
      body: options.body === undefined || typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body),
    });
    const requestId = response.headers.get("x-request-id");
    if (response.status === 204) return null;
    const contentType = response.headers.get("content-type") ?? "";
    const payload = (
      contentType.includes("application/json") || contentType.includes("+json")
    ) ? await response.json() : null;
    if (!response.ok) {
      if (response.status === 403 && payload?.error?.code === 'reauthentication_required' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('rillora:reauthentication-required'));
      }
      throw new ApiClientError(
        response.status,
        payload?.error?.code ?? "request_failed",
        payload?.error?.message ?? "The request could not be completed.",
        requestId,
      );
    }
    if (responseKind === "printable-start-here") {
      const exportPublicId = response.headers.get("x-rillora-export-id") ?? "";
      const serverCopyRetained = response.headers.get("x-rillora-server-copy-retained");
      const disposition = response.headers.get("content-disposition") ?? "";
      const filenameMatch = disposition.match(
        /^attachment; filename="(rillora-start-here-\d{4}-\d{2}-\d{2}\.txt)"$/,
      );
      if (
        !contentType.startsWith("text/plain")
        || !/^[0-9a-f-]{36}$/i.test(exportPublicId)
        || serverCopyRetained !== "false"
        || !filenameMatch
      ) {
        throw new ApiClientError(
          502,
          "invalid_export_response",
          "The printable guide response did not preserve its safety boundary.",
          requestId,
        );
      }
      return {
        blob: await response.blob(),
        filename: filenameMatch[1],
        exportPublicId,
        serverCopyRetained: false,
      };
    }
    return payload;
  }

  return {
    getCreatedMatter: (requestId) => request(`/matters/creation/${encodeURIComponent(requestId)}`),
    archiveMatter: (id, expectedVersion) => request(`/matters/${encodeURIComponent(id)}`, {method:"DELETE",headers:{"if-match":String(expectedVersion)}}),
    getFamilyMaintenance: () => request("/maintenance/overview").then(validateFamilyMaintenance),
    startFamilyReview: (input) => request("/maintenance/rounds", { method: "POST", body: input }),
    saveFamilyReviewSettings: (input) => request("/maintenance/settings", { method: "PATCH", body: input }),
    respondToFamilyReview: (id,input) => request(`/maintenance/tasks/${encodeURIComponent(id)}/respond`, { method: "POST", body: input }),
    decideFamilyReview: (id,input) => request(`/maintenance/tasks/${encodeURIComponent(id)}/decide`, { method: "POST", body: input }),
    closeFamilyReview: (id,input) => request(`/maintenance/rounds/${encodeURIComponent(id)}/close`, { method: "POST", body: input }),
    getSharingConnections: () => request("/sharing/connections"),
    getSharingAccess: () => request("/sharing/access").catch(error => {
      if (error.status === 404 && error.code === "not_found") return { access: null };
      throw error;
    }),
    selectSharingLive: (id, input) => request(`/sharing/connections/${encodeURIComponent(id)}/live`, { method: "POST", body: input }),
    pauseSharingLive: (id, input) => request(`/sharing/connections/${encodeURIComponent(id)}/pause`, { method: "POST", body: input }),
    previewSharing: (grants, connectionPublicId) => request("/sharing/preview", { method: "POST", body: { grants, ...(connectionPublicId ? { connectionPublicId } : {}) } }).then(value => validateSharingPreview(value, grants)),
    getAccountProfile: () => request("/account/profile"),
    requestAccountDeletion: (receipt, acknowledgesBilling = false) => request("/account/delete", {method:"POST",body:{confirmation:"DELETE",receipt,acknowledgesSavedCopies:true,acknowledgesBilling}}),
    getAccountDeletionStatus: receipt => request("/account-deletions/status", {headers:{authorization:`Deletion-Receipt ${receipt}`}}, {publicAuth:true}),
    exportMapBackup: () => request("/account/map/export", {method:"POST",body:{acknowledgesPrivateCopy:true}}),
    importMapBackup: backup => request("/account/map/import", {method:"POST",body:{backup,acknowledgesPrivateImport:true}}),
    getArchivedMatters: () => request("/account/archived-matters"),
    restoreArchivedMatter: (id, expectedVersion) => request(`/account/archived-matters/${encodeURIComponent(id)}/restore`, {method:"POST",body:{expectedVersion}}),
    createSharingConnection: (input) => request("/sharing/connections", { method: "POST", body: input }),
    updateSharingConnection: (id, input) => request(`/sharing/connections/${encodeURIComponent(id)}`, { method: "PATCH", body: input }),
    regenerateSharingLink: (id, input) => request(`/sharing/connections/${encodeURIComponent(id)}/link`, { method: "POST", body: input }),
    revokeSharingConnection: (id, version) => request(`/sharing/connections/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "if-match": String(version) } }),
    resolveSharingInvitation: (invitationToken) => request("/sharing/invitations/resolve", { method: "POST", body: { invitationToken } }, { publicAuth: true }),
    getSharingInvitation: (id) => request(`/sharing/invitations/${encodeURIComponent(id)}`, {}, { publicAuth: true }),
    acceptSharingInvitation: (input) => request("/sharing/invitations/accept", { method: "POST", body: input }),
    getSharedWithMe: () => request("/sharing/shared-with-me").then(validateSharedResponse),
    checkEmailVerification: () => request("/sharing/email-verification", { method: "POST", body: {} }),
    getSessionStatus: () => devPlannerId
      ? request("/session").then((session) => ({
        authenticated: session?.authenticationMode === "development"
          && session?.plannerPublicId?.toLowerCase() === devPlannerId.toLowerCase(),
      }))
      : request("/auth/session-status", {}, { publicAuth: true }),
    startReauthentication: () => request('/auth/reauthenticate', { method: 'POST', body: {} }, { publicAuth: true }),
    getReauthenticationStatus: pollToken => request('/auth/reauthentication-status', { method: 'POST', body: { pollToken } }, { publicAuth: true }),
    startAuthentication: (input) => request("/auth/start", {
      method: "POST",
      body: input,
    }, { publicAuth: true }),
    getOverview: () => request("/overview"),
    getSession: () => request("/session"),
    getLegalAcceptance: () => request("/legal/acceptance"),
    getPlan: () => request("/plan"),
    getMatters: () => request("/matters?limit=50"),
    getTrustedContacts: () => request("/trusted-contacts"),
    createTrustedContact: (input) => request("/trusted-contacts", { method: "POST", body: input }),
    updateTrustedContact: (publicId, input) => request(`/trusted-contacts/${encodeURIComponent(publicId)}`, { method: "PATCH", body: input }),
    getOfficialSetupChecks: () => request("/official-setup-checks"),
    getReadiness: () => request("/readiness"),
    getAuditEvents: () => request("/audit-events?limit=20"),
    getCommerceStatus: (serviceMarketCode) => request(
      `/commerce/status?serviceMarketCode=${encodeURIComponent(serviceMarketCode)}`,
    ).then(normalizeCommercialStatus),
    resolvePurchaseRoute: (input) => request("/commerce/purchase-route", {
      method: "POST",
      body: input,
    }).then(normalizePurchaseRoute),
    getTestBillingStatus: () => request("/commerce/test/status"),
    getProductionBillingStatus: () => request("/commerce/stripe/status"),
    getProductionPurchaseQuote: () => request("/commerce/stripe/quote"),
    startProductionCheckout: (purchaseConsent, idempotencyKey) => request("/commerce/stripe/checkout", {
      method: "POST", headers: { "idempotency-key": idempotencyKey }, body: { billingPeriod: "annual", purchaseConsent },
    }),
    openProductionBillingPortal: () => request("/commerce/stripe/portal", { method: "POST", body: {} }),
    cancelProductionCheckout: () => request("/commerce/stripe/checkout/cancel", { method: "POST", body: {} }),
    startTestCheckout: (billingPeriod, idempotencyKey) => request("/commerce/test/checkout", {
      method: "POST", headers: { "idempotency-key": idempotencyKey }, body: { billingPeriod },
    }),
    openTestBillingPortal: () => request("/commerce/test/portal", { method: "POST", body: {} }),
    cancelTestCheckout: () => request("/commerce/test/checkout/cancel", { method: "POST", body: {} }),
    updatePlan: (input) => request("/plan", {
      method: "PATCH",
      body: input,
    }),
    createMatter: (input) => request("/matters", {
      method: "POST",
      body: input,
    }),
    updateMatter: (publicId, input) => request(`/matters/${encodeURIComponent(publicId)}`, {
      method: "PATCH",
      body: input,
    }),
    updateOfficialSetupCheck: (publicId, input) => request(
      `/official-setup-checks/${encodeURIComponent(publicId)}`,
      { method: "PATCH", body: input },
    ),
    runSimulation: (lifeEvent) => request("/simulations", {
      method: "POST",
      body: { lifeEvent },
    }),
    getDisclosureRehearsals: () => request("/disclosure-rehearsals")
      .then(validateDisclosureRehearsalPayload),
    getRoleAssignments: () => request("/role-assignments")
      .then(validateRoleAssignmentPayload),
    createRoleAssignment: (input) => request("/role-assignments", {
      method: "POST",
      body: {
        ...input,
        acknowledgesRecordOnly: true,
        acknowledgesNoAuthority: true,
      },
    }).then(validateRoleAssignmentPayload),
    updateRoleAssignment: (publicId, input) => request(
      `/role-assignments/${encodeURIComponent(publicId)}`,
      {
        method: "PATCH",
        body: {
          ...input,
          acknowledgesRecordOnly: true,
          acknowledgesNoAuthority: true,
        },
      },
    ).then(validateRoleAssignmentPayload),
    revokeRoleAssignment: (publicId, expectedVersion) => request(
      `/role-assignments/${encodeURIComponent(publicId)}`,
      { method: "DELETE", headers: { "if-match": String(expectedVersion) } },
    ).then(validateRoleAssignmentPayload),
    createDisclosureRehearsal: (lifeEvent) => request("/disclosure-rehearsals", {
      method: "POST",
      body: { lifeEvent },
    }).then(validateDisclosureRehearsalPayload),
    updateDisclosureRehearsal: (publicId, expectedVersion, action) => request(
      `/disclosure-rehearsals/${encodeURIComponent(publicId)}/actions`,
      {
        method: "POST",
        body: { expectedVersion, action, acknowledgesSimulationOnly: true },
      },
    ).then(validateDisclosureRehearsalPayload),
    previewStartHere: (recipientConnectionPublicId = null) => request("/exports/start-here/preview", {
      method: "POST",
      body: recipientConnectionPublicId ? { recipientConnectionPublicId } : {},
    }),
    createPrintableStartHere: (previewPublicId) => request("/exports/start-here/printable", {
      method: "POST",
      body: {
        previewPublicId,
        acknowledgesPlaintext: true,
        acknowledgesNoRevocation: true,
      },
      responseKind: "printable-start-here",
    }),
    prepareEncryptedStartHere: (previewPublicId) => request(
      "/exports/start-here/encrypted/prepare",
      { method: "POST", body: { previewPublicId } },
    ),
    finalizeEncryptedStartHere: (packagePublicId, input) => request(
      `/exports/start-here/encrypted/${encodeURIComponent(packagePublicId)}/finalize`,
      { method: "POST", body: input },
    ),
    getEncryptedStartHere: (packagePublicId) => request(
      `/exports/start-here/encrypted/${encodeURIComponent(packagePublicId)}`,
    ),
    createRecipientRehearsal: (personPublicId) => request("/recipient-rehearsals", {
      method: "POST",
      body: { personPublicId },
    }),
    acceptRecipientRehearsal: (acceptanceToken) => request("/recipient-rehearsals/accept", {
      method: "POST",
      body: { acceptanceToken },
    }, { publicRehearsal: true }),
    enrollRecipientDeviceKey: (sessionToken, input) => request("/recipient-rehearsals/device-keys", {
      method: "POST",
      body: input,
    }, { publicRehearsal: true, rehearsalSessionToken: sessionToken }),
    prepareRecipientRehearsalPackage: (rehearsalPublicId, previewPublicId) => request(
      `/recipient-rehearsals/${encodeURIComponent(rehearsalPublicId)}/packages/prepare`,
      { method: "POST", body: { previewPublicId } },
    ),
    finalizeRecipientRehearsalPackage: (rehearsalPublicId, packagePublicId, input) => request(
      `/recipient-rehearsals/${encodeURIComponent(rehearsalPublicId)}/packages/${encodeURIComponent(packagePublicId)}/finalize`,
      { method: "POST", body: input },
    ),
    getRecipientRehearsalPackage: (sessionToken, packagePublicId) => request(
      `/recipient-rehearsals/packages/${encodeURIComponent(packagePublicId)}`,
      {},
      { publicRehearsal: true, rehearsalSessionToken: sessionToken },
    ),
    revokeRecipientDeviceKey: (sessionToken, keyPublicId) => request(
      `/recipient-rehearsals/device-keys/${encodeURIComponent(keyPublicId)}`,
      { method: "DELETE" },
      { publicRehearsal: true, rehearsalSessionToken: sessionToken },
    ),
    revokeRecipientRehearsal: (rehearsalPublicId) => request(
      `/recipient-rehearsals/${encodeURIComponent(rehearsalPublicId)}`,
      { method: "DELETE" },
    ),
    logout: () => request("/auth/logout", { method: "POST", body: {} }),
    logoutAll: () => request("/auth/logout-all", { method: "POST", body: {} }),
  };
}

const requiredDisclosureBoundaries = {
  simulationOnly: true,
  operative: false,
  identityVerified: false,
  documentsVerified: false,
  multiPartyVerified: false,
  notificationsSent: false,
  dataReleased: false,
  releaseAvailable: false,
  legalAuthorityGranted: false,
};

const forbiddenDisclosureKeys = new Set([
  "accountHint",
  "valueBand",
  "currency",
  "password",
  "recoveryCode",
  "seedPhrase",
  "privateKey",
]);

const requiredRoleAssignmentBoundaries = {
  recordOnlyByDefault: true,
  invitationSent: false,
  identityBound: false,
  legalAuthorityGranted: false,
  accountAccessGranted: false,
  releaseAvailable: false,
};

function validateDisclosureRehearsalPayload(payload) {
  const rehearsals = payload?.disclosureRehearsal
    ? [payload.disclosureRehearsal]
    : payload?.disclosureRehearsals;
  const safe = Array.isArray(rehearsals)
    && hasDisclosureBoundaries(payload.boundaries)
    && rehearsals.every((rehearsal) => (
      rehearsal
      && hasDisclosureBoundaries(rehearsal.boundaries)
      && rehearsal.snapshot?.operative === false
      && rehearsal.snapshot?.policyIllustrative === true
      && typeof rehearsal.snapshotFresh === "boolean"
      && (rehearsal.snapshotFresh
        ? rehearsal.invalidatedAt == null && rehearsal.invalidatedReason == null
        : rehearsal.invalidatedAt != null && rehearsal.invalidatedReason === "policy_source_changed")
      && Array.isArray(rehearsal.completedCheckpoints)
      && rehearsal.completedCheckpoints.every((checkpoint) => checkpoint.realEvidenceCollected === false)
      && Array.isArray(rehearsal.snapshot?.guardrails)
      && rehearsal.snapshot.guardrails.every((guardrail) => guardrail.realEvidenceCollected === false)
      && !containsForbiddenDisclosureKey(rehearsal.projectedRoleViews)
    ));
  if (!safe) {
    throw new ApiClientError(
      502,
      "invalid_disclosure_rehearsal_response",
      "The disclosure rehearsal response did not preserve its simulation-only safety boundary.",
      null,
    );
  }
  return payload;
}

function validateRoleAssignmentPayload(payload) {
  const assignments = payload?.roleAssignment
    ? [payload.roleAssignment]
    : payload?.roleAssignments ?? [];
  const revokedOnly = payload?.revoked === true && payload?.roleAssignment === undefined;
  const safe = Array.isArray(assignments)
    && hasExactBoundaries(payload?.boundaries, requiredRoleAssignmentBoundaries)
    && (revokedOnly || assignments.length > 0 || Array.isArray(payload?.roleAssignments))
    && assignments.every((assignment) => {
      const evidence = ["record_only", "simulation", "invitation_pending", "invitation_accepted"]
        .includes(assignment?.evidence);
      const scoped = assignment?.scope === "plan_wide"
        ? assignment.matter === null
        : assignment?.scope === "matter_specific" && assignment.matter?.publicId;
      const recipientScoped = assignment?.role !== "recipient" || assignment?.scope === "matter_specific";
      const editableSafe = assignment?.editable !== true
        || (assignment.status === "draft" && assignment.evidence === "record_only");
      return assignment
        && ["trusted_contact", "executor", "recipient"].includes(assignment.role)
        && evidence && scoped && recipientScoped && editableSafe
        && !containsForbiddenDisclosureKey(assignment);
    });
  if (!safe) {
    throw new ApiClientError(
      502,
      "invalid_role_assignment_response",
      "The role-assignment response did not preserve its record-only and no-authority boundary.",
      null,
    );
  }
  return payload;
}

function hasDisclosureBoundaries(value) {
  return hasExactBoundaries(value, requiredDisclosureBoundaries);
}

function hasExactBoundaries(value, expectedBoundaries) {
  return Object.entries(expectedBoundaries)
    .every(([key, expected]) => value?.[key] === expected);
}

function containsForbiddenDisclosureKey(value) {
  if (Array.isArray(value)) return value.some(containsForbiddenDisclosureKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => (
    forbiddenDisclosureKeys.has(key) || containsForbiddenDisclosureKey(nested)
  ));
}

function readCsrfCookie() {
  if (typeof document === "undefined") return null;
  const prefix = "continuity_csrf=";
  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

const viteEnvironment = import.meta.env ?? {};
const configuredDevelopmentPlannerId = viteEnvironment.VITE_DEV_PLANNER_ID?.trim();
const developmentPlannerId = viteEnvironment.DEV && configuredDevelopmentPlannerId
  ? configuredDevelopmentPlannerId
  : null;

export const api = createApiClient({
  baseUrl: viteEnvironment.VITE_API_BASE_URL ?? "/api/v1",
  devPlannerId: developmentPlannerId,
});
