# Apple production verification and price preparation

Role: current Apple portal readback and isolated production verification foundation
Status: VERIFICATION AND AUTHORITATIVE STATUS LOCALLY VERIFIED; PRICE AND DURABLE INTAKE OPEN
Last updated: 2026-09-26 (Asia/Hong_Kong)

Owner completed the requested Apple login. The actual Rillora app6803957639,
bundle com.rillora.ios, group22325627 and two existing products are accessible.
The app/version and products remain Prepare for Submission. No build, review
submission, live purchase or release was created in this increment.

## September26 launch-goal status adapter

The production Server API adapter now reads the official all-subscription-statuses
endpoint and re-verifies its nested transaction/renewal signatures with the existing
production verifier. Exact app/bundle/environment, group, original transaction and
server-known account must agree. Missing or duplicate target entries fail closed;
array order or a newly signed old refund cannot arbitrarily select a subscription.

The SDK still owns JWT generation and response schemas. A narrow transport permits
only production status GETs, rejects redirects and other endpoints, caps responses
at1MiB and bounds connection/body waits through the existing node-fetch2.7.0 SDK
dependency, now declared directly. No provider mutation is introduced.

Resolve current price from signed purchase time, storefront, currency and integer
milliunits against an explicit reviewed binding. Next-renewal price cannot relabel
an existing paid receipt; no historical v1 fallback exists. Grace uses its signed
expiry for access while preserving the paid-period end separately. Cancelled
renewal keeps paid coverage; delayed active/grace responses cannot extend their
signed cutoff, and retry/expiry/revocation/upgraded transactions do not grant access.
Unknown status/preferences and impossible dates fail. Unsupported monthly-payment
commitments and Advanced Commerce are rejected at the verification boundary.

This module produces evidence for the existing reconciliation/executor; it does
not persist a subscription, authorize finish or grant an entitlement by itself.
The existing Sandbox adapter and its historical tests are preserved. Current local
validation:26focused Apple checks,258API tests across30files, typecheck and build
pass. Tests use decoded synthetic payloads and a stubbed official-client transport;
no real Apple signature, online OCSP, purchase, HTTP latency or notification delivery
is claimed. The fixture99.99amount is not an adopted or saved Apple offer.
[QA](../output/qa/rillora-launch-goal-20260926/apple-snapshot-checks.json).

Next complete the production durable intake/notification/retry and native flow,
then exact price/catalog/provider configuration and actual lifecycle acceptance.
[Apple status endpoint](https://developer.apple.com/documentation/appstoreserverapi/get-all-subscription-statuses),
[renewal/grace fields](https://apple.github.io/app-store-server-library-node/interfaces/JWSRenewalInfoDecodedPayload.html).

## Current portal facts and concrete price choice

Annual6803959021/com.rillora.family.annual is one-year prepaid, saved atUS$68
for USA andCAD99 for Canada, with eight selected test-matrix territories. The
separate twelve-month contract with monthly payments is not enabled. Monthly
6803958645/com.rillora.family.monthly still selects zero territories. Apple Family
Sharing remains off; it must not be confused with Rillora recipient permissions.

The official CSV contains800USA points.88.80is absent, but this is not the pricing
objective: Owner has reaffirmed channel differentiation. The agent's88.90/88.99/
88.00near-parity recommendation and question are withdrawn. Web is now88.99after the subsequent Owner website-only decision; prior
Apple candidates are99.99if15%is approved/effective, or119.99under the standard30%
scenario. Both candidate points are confirmed in the downloaded official table.
Exact amount and effective fee remain open; no new price has been saved.
[Channel contract](channel-pricing-20260921.md),
[original table readback](../output/qa/rillora-production-apple-20260926/apple-price-points.json).

## New platform default corrected

The portal had automatically allowed multiseat purchases for both products.
Apple documents that this supports a group buyer and quantities greater than one;
Business and School channels require it. This does not match Rillora's current
single purchaser/household contract. Both unsubmitted products are now saved as
multiseat not allowed, App Store only. Monthly's zero-territory state and annual's
eight-territory test matrix are retained. No Family Sharing, tax category, agreement
or product approval was changed. [Apple purchase options](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-purchase-options-for-auto-renewable-subscriptions).

Streamlined Purchasing was observed enabled at the group list. Its out-of-app
account binding requires review before release; no change was made to that setting
in this increment. Do not claim all purchase routes are now covered.

## Verification and versioned price foundation

The separate production verifier uses Apple's official library, pinned roots,
online checks enabled, Environment.PRODUCTION and the exact required appAppleId.
The existing Sandbox verification/runtime is unchanged. Both official repository
and npm registry report the already-installed library3.1.0; no upgrade was needed.
[Official library and production verifier arguments](https://github.com/apple/app-store-server-library-node).

The new wrapper additionally binds bundle, group, product, configured storefront,
individual purchased ownership, quantity one, transaction/original transaction,
account UUID, signed dates and period. Nested notification/renewal subjects and
environments must agree. UUID letter casing is canonicalized without changing its
identity. Signed payload bodies do not enter normalized signal state. Invalid
signatures, missing price/currency, foreign identity, Sandbox, unsupported shared
or multiseat data fail closed. A verified signal still grants no entitlement.

Price mapping uses explicit reviewed bindings for the signed product, storefront,
currency, integer milliunits and signed purchase-date window. Empty, duplicate,
overlapping or unmatched bindings are rejected. This foundation has no live
price rows and no automatic v1-to-current fallback. Historical windows must reflect
actual provider facts: for distinct grandfathered prices, retain renewal coverage;
do not close them just because new purchases use another amount. Real bindings
and ledger/receipt integration remain to be implemented after the price decision.

## Verification and remaining work

Typecheck/build and242API tests pass, including18focused Apple checks. New tests
use synthetic decoded payloads and mapping rows; they do not prove Apple signed
production data, real StoreKit purchase, online certificate status, restore or
Notifications V2 delivery. Existing Sandbox tests retain their own scope.

The later launch-goal checkpoint above closes local production status-adapter preparation. Still incomplete: ordinary authenticated
intake/notification/retry and catalog/migrations, native server-gated purchase and
finish/restore, actual provider lifecycle acceptance and cross-channel consistency.
The older Sandbox snapshot still maps product IDs to v1; it has not been silently
relabelled or deployed as production. Existing production API task1/schema0070,
credentials, Auth0, sales flags and Owner-deferred business/device gates remain.
[StoreKit contract](storekit.md), [release readiness](release-readiness.md),
[current QA](../output/qa/rillora-production-apple-20260926/work-state.json).

Source checkpoint15f6709f8f116dc6e3b5b381d07625b66b184362 is pushed to the private
Rillora repository; [CI13 succeeds](https://github.com/tantalum666/rillora/actions/runs/36168352267).
Prepared912source files have24reviewed non-secret spans/0unknown;143project Markdown
files/1363local links have0missing. The additional reviewed span is a synthetic
appAccountToken UUID in a unit test, never an authentication credential. Annual
purchase options were re-opened and persisted as App Store only/no multiseat.
The evidence-only closeout does not imply another deployment or real transaction.
