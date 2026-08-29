import assert from "node:assert/strict";
import test from "node:test";
import {
  commercialEntryPolicy,
  formatMoneyMinor,
  normalizeCommercialStatus,
  normalizePurchaseRoute,
  unavailableCommercialStatus,
} from "../src/commercialAccess.js";

const safeBoundaries = {
  serverAuthoritative: true,
  providerCallbackGrantsAccess: false,
  clientPurchaseResultGrantsAccess: false,
  billingStateCanTriggerClaim: false,
  billingStateCanTriggerDisclosure: false,
  storefrontPersistedToCustomerProfile: false,
  oneActiveRenewalProviderPerHouseholdPlan: true,
};

const payload = {
  contractVersion: "commerce-v1",
  billingOpen: false,
  serviceMarketCode: "GLOBAL_US",
  currentAccess: { planCode: "free", planVersion: 1, subscription: null },
  plans: [
    {
      planCode: "free",
      capabilities: [
        { code: "matter_map_core", enforcementMode: "included" },
        { code: "account_deletion", enforcementMode: "included" },
      ],
    },
    {
      planCode: "family",
      capabilities: [
        { code: "household_coplanner", enforcementMode: "planned" },
        { code: "adaptive_reviews", enforcementMode: "planned" },
      ],
    },
  ],
  offers: [
    {
      priceCode: "family_usd_monthly_v1",
      amountMinor: 999,
      minorUnitExponent: 2,
      currencyCode: "USD",
      billingInterval: "monthly",
      purchasable: false,
    },
    {
      priceCode: "family_usd_annual_v1",
      amountMinor: 9900,
      minorUnitExponent: 2,
      currencyCode: "USD",
      billingInterval: "annual",
      purchasable: false,
    },
  ],
  boundaries: safeBoundaries,
};

test("commercial state is derived from the server catalog while billing remains closed", () => {
  const commercial = normalizeCommercialStatus(payload);

  assert.equal(commercial.billingOpen, false);
  assert.equal(commercial.currentAccessLabel, "Rillora Free");
  assert.equal(commercial.offers[0].amountMinor, 999);
  assert.equal(commercial.offers[1].amountMinor, 9900);
  assert.deepEqual(commercial.freeFeatures, ["Matter map", "Account deletion"]);
  assert.deepEqual(commercial.familyFeatures, ["Household co-planner", "Adaptive review reminders"]);
  assert.equal(formatMoneyMinor(999, "USD", 2), "$9.99");
  assert.equal(formatMoneyMinor(9900, "USD", 2), "$99.00");
  assert.equal(formatMoneyMinor(69800, "CNY", 2), "CN¥698.00");
});

test("unsafe or malformed commercial responses fail closed", () => {
  assert.throws(
    () => normalizeCommercialStatus({
      ...payload,
      boundaries: { ...safeBoundaries, clientPurchaseResultGrantsAccess: true },
    }),
    /safety boundary/,
  );
  assert.throws(
    () => normalizeCommercialStatus({
      ...payload,
      offers: [{ ...payload.offers[0], amountMinor: 9.99 }],
    }),
    /safety boundary/,
  );

  const unavailable = unavailableCommercialStatus();
  assert.equal(unavailable.available, false);
  assert.equal(unavailable.billingOpen, false);
  assert.deepEqual(unavailable.offers, []);
});

test("purchase routing rejects a client-success or contradictory route", () => {
  const closed = normalizePurchaseRoute({
    contractVersion: "commerce-v1",
    purchaseRoute: "none",
    reason: "billing_closed",
    requiresFreshEvaluation: true,
    boundaries: safeBoundaries,
  });
  assert.equal(closed.purchaseRoute, "none");

  assert.throws(
    () => normalizePurchaseRoute({
      ...closed,
      purchaseRoute: "stripe_web_external",
      reason: "billing_closed",
    }),
    /safety boundary/,
  );
  assert.throws(
    () => normalizePurchaseRoute({
      ...closed,
      boundaries: { ...safeBoundaries, providerCallbackGrantsAccess: true },
    }),
    /safety boundary/,
  );
});

test("commercial details stay out of public discovery until explicit paid-capability intent", () => {
  assert.equal(commercialEntryPolicy.publicHomepageVisible, false);
  assert.equal(commercialEntryPolicy.signedOutMoreVisible, false);
  assert.equal(commercialEntryPolicy.requiresExplicitPaidCapabilityIntent, true);
});
