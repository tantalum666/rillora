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
    && Array.isArray(payload.plans)
    && Array.isArray(payload.offers)
    && payload.offers.every(isSafeOffer);

  if (!safe) throw new Error("The commercial status did not preserve its safety boundary.");

  const freePlan = payload.plans.find(({ planCode }) => planCode === "free");
  const familyPlan = payload.plans.find(({ planCode }) => planCode === "family");
  return Object.freeze({
    available: true,
    billingOpen: payload.billingOpen,
    serviceMarketCode: payload.serviceMarketCode,
    currentAccessLabel: planLabel(payload.currentAccess.planCode),
    currentAccess: payload.currentAccess,
    freeFeatures: Object.freeze(featuresFor(freePlan, "included")),
    familyFeatures: Object.freeze(featuresFor(familyPlan, "planned").filter((label) => [capabilityLabels.family_maintenance, capabilityLabels.trusted_people_multiple].includes(label))),
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
