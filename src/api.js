import { normalizeCommercialStatus, normalizePurchaseRoute } from "./commercialAccess.js";

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
    getSessionStatus: () => request("/auth/session-status", {}, { publicAuth: true }),
    startAuthentication: (input) => request("/auth/start", {
      method: "POST",
      body: input,
    }, { publicAuth: true }),
    getSession: () => request("/session"),
    getLegalAcceptance: () => request("/legal/acceptance"),
    getPlan: () => request("/plan"),
    getMatters: () => request("/matters?limit=50"),
    getTrustedContacts: () => request("/trusted-contacts"),
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
    previewStartHere: () => request("/exports/start-here/preview", {
      method: "POST",
      body: {},
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
