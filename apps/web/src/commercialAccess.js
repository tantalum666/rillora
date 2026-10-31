const capabilityLabels = Object.freeze({
  matter_map_core: "Matter map",
  official_setup_guides: "Official provider guides",
  trusted_person_basic: "Sharing with a trusted person",
  rehearsal_basic: "Basic rehearsal",
  data_export: "Export and read saved copies",
  account_deletion: "Account deletion",
  household_coplanner: "Household co-planner",
  family_maintenance: "Shared reviews and approved corrections",
  trusted_people_multiple: "Multiple trusted people",
  role_packages_advanced: "Advanced role packages",
  adaptive_reviews: "Adaptive review reminders",
  version_history: "Plan history",
  encrypted_attachments: "Encrypted attachments",
});

const requiredBoundaries = Object.freeze({
  serverAuthoritative: true,
  providerCallbackGrantsAccess: false,
  clientPurchaseResultGrantsAccess: false,
  billingStateCanTriggerClaim: false,
  billingStateCanTriggerDisclosure: false,
  storefrontPersistedToCustomerProfile: false,
  oneActiveRenewalProviderPerHouseholdPlan: true,
});

export const commercialEntryPolicy = Object.freeze({
  publicHomepageVisible: false,
  signedOutMoreVisible: false,
  requiresExplicitPaidCapabilityIntent: true,
});

export function normalizeCommercialStatus(payload) {
  const safe = payload?.contractVersion === "commerce-v1"
    && hasExactBoundaries(payload.boundaries)
    && typeof payload.billingOpen === "boolean"
    && typeof payload.currentAccess?.planCode === "string"
    && [undefined, null, 'test', 'production'].includes(payload.webBillingEnvironment)
    && Array.isArray(payload.plans)
    && Array.isArray(payload.offers)
    && payload.offers.every(isSafeOffer);

  if (!safe) throw new Error("The commercial status did not preserve its safety boundary.");

  const freePlan = payload.plans.find(({ planCode }) => planCode === "free");
  const familyPlan = payload.plans.find(({ planCode }) => planCode === "family");
  return Object.freeze({
    available: true,
    billingOpen: payload.billingOpen,
    validationOnly: payload.validationOnly === true,
    webBillingEnvironment: payload.webBillingEnvironment ?? null,
    serviceMarketCode: payload.serviceMarketCode,
    currentAccessLabel: planLabel(payload.currentAccess.planCode),
    currentAccess: payload.currentAccess,
    freeFeatures: Object.freeze(featuresFor(freePlan, "included")),
    familyFeatures: Object.freeze((familyPlan?.capabilities ?? [])
      .filter(capability => ["family_maintenance", "trusted_people_multiple"].includes(capability.code)
        && ["included", "planned"].includes(capability.enforcementMode) && capability.availability !== "retired")
      .map(capability => capabilityLabels[capability.code])),
    futureFeatures: Object.freeze(featuresFor(familyPlan, "planned").filter((label) => ![capabilityLabels.family_maintenance, capabilityLabels.trusted_people_multiple].includes(label))),
    offers: Object.freeze(payload.offers.map((offer) => Object.freeze({ ...offer }))),
    boundaries: Object.freeze({ ...payload.boundaries }),
  });
}

export function normalizePurchaseRoute(payload) {
  const knownRoutes = ["none", "stripe_web_external", "apple_storekit", "web_direct"];
  const safe = payload?.contractVersion === "commerce-v1"
    && hasExactBoundaries(payload.boundaries)
    && payload.requiresFreshEvaluation === true
    && knownRoutes.includes(payload.purchaseRoute)
    && typeof payload.reason === "string"
    && (
      (payload.reason === "available" && payload.purchaseRoute !== "none")
      || (payload.reason !== "available" && payload.purchaseRoute === "none")
    );
  if (!safe) throw new Error("The purchase route did not preserve its safety boundary.");
  return Object.freeze({ ...payload, boundaries: Object.freeze({ ...payload.boundaries }) });
}

export function unavailableCommercialStatus() {
  return Object.freeze({
    available: false,
    billingOpen: false,
    validationOnly: false,
    webBillingEnvironment: null,
    serviceMarketCode: null,
    currentAccessLabel: "Unavailable",
    currentAccess: null,
    freeFeatures: Object.freeze([]),
    familyFeatures: Object.freeze([]),
    futureFeatures: Object.freeze([]),
    offers: Object.freeze([]),
    boundaries: Object.freeze({ ...requiredBoundaries }),
  });
}

export function testBillingDestination(payload, kind) {
  const value = payload?.[kind];
  const host = kind === "checkout" ? "checkout.stripe.com" : kind === "portal" ? "billing.stripe.com" : null;
  if (payload?.contractVersion !== "commerce-stripe-test-v1" || value?.testOnly !== true || !host) throw new Error("Test billing response could not be verified.");
  const url = new URL(value.url);
  if (url.protocol !== "https:" || url.hostname !== host || url.port || url.username || url.password) throw new Error("Test billing destination could not be verified.");
  return url.href;
}

export function formatMoneyMinor(amountMinor, currencyCode, minorUnitExponent, locale = "en-US") {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    throw new TypeError("amountMinor must be a non-negative safe integer");
  }
  if (!Number.isInteger(minorUnitExponent) || minorUnitExponent < 0 || minorUnitExponent > 3) {
    throw new TypeError("minorUnitExponent must be an integer from 0 to 3");
  }
  const amount = amountMinor / (10 ** minorUnitExponent);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: minorUnitExponent,
    maximumFractionDigits: minorUnitExponent,
  }).format(amount);
}

function hasExactBoundaries(boundaries) {
  return boundaries && Object.entries(requiredBoundaries)
    .every(([key, value]) => boundaries[key] === value);
}

function isSafeOffer(offer) {
  return offer
    && typeof offer.priceCode === "string"
    && Number.isSafeInteger(offer.amountMinor)
    && offer.amountMinor > 0
    && Number.isInteger(offer.minorUnitExponent)
    && offer.minorUnitExponent >= 0
    && offer.minorUnitExponent <= 3
    && /^[A-Z]{3}$/.test(offer.currencyCode)
    && ["monthly", "annual"].includes(offer.billingInterval)
    && typeof offer.purchasable === "boolean";
}

function featuresFor(plan, enforcementMode) {
  if (!Array.isArray(plan?.capabilities)) return [];
  return plan.capabilities
    .filter((capability) => capability.enforcementMode === enforcementMode && capability.code !== "rehearsal_basic"
      && capability.availability !== "retired"
      && (enforcementMode !== "included" || ((capability.availability === undefined || capability.availability === "available") && ["matter_map_core", "official_setup_guides", "trusted_person_basic", "data_export"].includes(capability.code))))
    .map((capability) => capabilityLabels[capability.code] ?? humanize(capability.code));
}

function planLabel(planCode) {
  if (planCode === "free") return "Rillora Free";
  if (planCode === "family") return "Rillora Family";
  return humanize(planCode);
}

function humanize(value) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

// Rendering adapters keep the normalized API model and legacy English labels stable.
// Only recognized catalog capabilities are localized; unknown server data is never rewritten.
const capabilityCodesByLabel = new Map(Object.entries(capabilityLabels).map(([code, label]) => [label, code]));

export function commercialFeatureLabel(label, t) {
  const code = capabilityCodesByLabel.get(label);
  return t && code ? t(`workspace.capability.${code}`) : label;
}

export function commercialPlanLabel(commerce, t) {
  if (!t) return commerce.currentAccessLabel;
  if (!commerce.available) return t("workspace.plan.unavailable");
  const code = commerce.currentAccess?.planCode;
  if (!["free", "family"].includes(code)) return commerce.currentAccessLabel;
  const plan = t(`workspace.plan.${code}`);
  return plan;
}

const billingStates = new Set(["active", "cancel_at_period_end", "grace", "past_due", "expired_read_only", "refunded", "revoked", "previewing"]);

export function billingStateLabel(state, t) {
  if (!t) return typeof state === "string" ? state.replaceAll("_", " ") : "Family subscription";
  return t(billingStates.has(state) ? `workspace.billing.state.${state}` : "workspace.billing.subscription");
}

// Refunded/revoked records are history, not proof that renewal has stopped.
// A new checkout is offered only when the server has confirmed termination;
// the purchase route still rechecks all providers before creating an order.
export function subscriptionPreventsNewCheckout(subscription) {
  if (!subscription) return false;
  if (["expired_read_only", "refunded", "revoked"].includes(subscription.state)) {
    return subscription.renewalIsPossible !== false;
  }
  return true;
}
