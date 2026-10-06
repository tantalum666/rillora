# Apple production verification and price preparation

Role: current Apple production engineering, portal readback and actual evidence boundary
Status: REVIEW FLOW LOCALLY VERIFIED; SIGNED EXPORT PREPARED; ACTUAL PROVIDER AND CLOUD ACCEPTANCE OPEN
Last updated: 2026-10-07 (Asia/Hong_Kong)

Owner completed the requested Apple login. The actual Rillora app6803957639,
bundle com.rillora.ios, group22325627 and two existing products are accessible.
The app/version and products remain Prepare for Submission. No build, review
submission, live purchase or release was created in this increment.

## October7 current purchase presentation

The Owner supersedes the historical native checkbox with an explicit Subscribe button
beside the displayed annual quote, renewal/cancellation disclosure and policy links.
The button captures that displayed quote. Before preparation, the coordinator checks
it is still current and reloads the server/StoreKit offer; before the system sheet,
StoreKit reloads the Product and rechecks currency, amount and storefront. A changed
quote returns to the page for a new button tap. Page load records no acceptance.
The API's three semantic recurring-consent fields retain their meaning and versions;
they do not describe a checkbox widget. Signup consent is independent and unchanged.
The purchase page leads with Family5 versus Free1, shared review and one designated
contributor's owner-approved corrections; it does not advertise roadmap capabilities.
Latest physical receipt, build and evidence are in [the current contract](device-config-20261006.md).

## September29–30 Apple release increment — current

Owner proceeds with Apple work and completes the current login. The safe enrolled
review/TestFlight path is implemented using the shared strict lifecycle, isolated
Sandbox evidence and a verified native AppTransaction environment.314API tests,
175native full-suite passes with1existing skip, and14later focused checks pass.
Signed Release archive and non-debuggable App Store export succeed after refreshing
Rillora's old provisioning profile. Customer access remainsclosed; no upload or real
Apple transaction occurred. [Current implementation, rollout and evidence](apple-review-validation-20260929.md).

Owner confirms Small Business eligibility facts and the final attestation. Apple
confirms receipt of the enrollment; approval and15%effective date remainpending.
AnnualUSA68/Canada99 are unchanged, not the final differentiated price. The draft
now has saved public website/support links. Streamlined Purchasing remainson because
Apple requires an approved PurchaseIntent binary; source support is now added.

## HISTORICAL — September27 ordinary native purchase and restore

The ordinary production app now has a separate Apple purchase coordinator and
typed API contract. It compares StoreKit's localized price, currency, one-year
period and product/group with the server's reviewed offer before presenting an
action. Web88.99 is not relabelled as the Apple price. Annual-only new purchases
and historical monthly receipts remain separate; signed historical storefronts
do not have to match today's device country for restoration.

The server quotes only active, unambiguous Apple bindings with current operating
entity/market/storefront/route windows, exact production SKU identity, valid tax
configuration and both included Family capabilities actually enabled. Quote reads
do not infer residence or create a commerce account. Preparation requires an
independent, versioned recurring-price/renewal/cancellation acceptance and reserves
one owned order using a nonce. Its expected account UUID must match the current
authenticated account before any order or consent is stored, including when native
token storage changes during an in-flight request. The real sheet starts only after a fresh guarded
transition. Creating an account or receiving a provider callback cannot grant access.

Native and Web checkout share the same transaction lock and foreign-purchase
checks. Known resumable terminal subscriptions, unfinished other-channel orders,
and newly locked/deleting owners cannot start another purchase. An unused prepared
quote expires after15minutes; a sheet that may have opened or an Apple-pending
approval does not silently expire as if payment were canceled. These controls cover
Rillora-initiated flows; provider events, externally changed subscriptions and final
cross-channel lifecycle acceptance still need their actual evidence.

Migrations0083–0085 add purchase sessions, retain paid purchase-consent facts with
the existing financial-erasure archive, and recheck active ownership without
granting the commerce role profile reads. A matching new receipt completes its
order; restoring an older receipt does not invent another paid order. An old
expired notification cannot close a later unfinished purchase. No price, market,
cloud schema or sale flag is activated by these migrations.

The client only finishes after a consistent committed server acknowledgement.
Unfinished StoreKit transactions replay after restart; restore retains verified
transaction handles and also checks subscription status for expired/monthly history.
Owner-generation guards prevent late quote/preparation/receipt results from affecting
a different signed-in account. A history outage is reported as an incomplete check,
not as evidence that the customer has no purchases. The prior diagnostic Sandbox
harness stays separate.

The existing Plan & access form retains its materials and navigation. Its purchase
section shows Apple-localized price,5live recipients/shared reviews, an unchecked
compact consent, actual Terms/Privacy/Refund links and restore/management actions.
The three corrected policy URLs were opened in normal Chrome and their effective
headings/versions read back. Python urllib403 was a client difference, not proof of
a broken customer page. [Policy checks](../output/qa/rillora-launch-goal-20260926/apple-purchase-policy-links.json).

Local verification passes300API tests/34files, typecheck/build and170native tests
with1existing skip. The isolated Preview app was built/installed and its normal and
Accessibility3 layouts observed through CUA; consent-off disables Subscribe, the
local-only toggle enables it and was reset. The preview has no API client, real
identity or SDK purchase. Its99.99fixture is not an approved or saved Apple price.
[Exact evidence](../output/qa/rillora-launch-goal-20260926/apple-purchase-checks.json).

Still required: safe App Store review/TestFlight validation, real provider purchase/
restore/notification and cross-channel acceptance, exact fee/price/catalog decisions,
cloud deployment and alert delivery. The current ordinary production path deliberately
rejects Sandbox; final review cannot be represented as working until a separate
enrolled-account validation path exists. Customer access remains closed.

## Durable production intake and recovery — preceding September26 increment

The ordinary authenticated transaction endpoint and NotificationsV2 endpoint are
implemented behind an explicit default-off production flag. Verification, minimal
financial evidence, inbox ownership/leases, receipt persistence, current ledger,
HTTP parsing and runtime credentials are separate small modules. Stripe/Sandbox
continue using the common subscription ledger and existing permission functions.
No second entitlement engine or external queue service was introduced.

A verified transaction must match the current Rillora planner's appAccountToken and
an already existing active commerce account. The intake does not invent a service
market from the Apple storefront or provision an account from a callback. Unique
original/transaction links reject conflicting owners. A historical signed storefront
is retained when the device changes country; current new-purchase eligibility will
be checked by its separate quote/preflight, which remains unfinished.

Transaction revision identity includes its proof digest. Explicit client submission
always refreshes authoritative Apple status, including when that receipt was already
processed. Immutable financial receipts retain the first proof and purchased amount;
current access handles later refund/renewal/expiry and signed renewal extensions.
An older refund notification cannot choose an old subscription period over the
current server status. Signed transaction/renewal observation frontiers reject
regressions. Receipt, ledger, grants, reconciliation audit and delivery acknowledgement
commit in one owner-scoped transaction before the API authorizes device finish.

Notifications return200 only after verified minimal evidence is durably committed;
that response does not assert a grant. A thirty-second worker claims short leases,
serializes each original subscription across processes, reclaims crashed work, and
backs off up to twelve attempts. Exhausted or unmapped work remains visible for
operations instead of retrying forever. Only error codes and aggregate counts/age
are logged. Apple confirms production notification retries and current-status/history
recovery are separate from sandbox delivery; the internal durable queue does not
depend on receiving a duplicate from Apple. [Official response and retry contract](https://developer.apple.com/documentation/appstoreservernotifications/responding-to-app-store-server-notifications).

The runtime requires the exact named Rillora production Apple-IAP vault secret,
validatedEC/P-256 key and explicit storefront list, pinned roots, production
encryption/recovery/TLS and no development/Sandbox surfaces. It is separate from
Sign in with Apple. Startup reads the reviewed price bindings; a catalog release
must restart this worker. No secret was created or installed this round.
The generic purchase route now also checks configured production runtime and
production catalog environment; receipt intake alone does not advertise Apple
new sales. Apple quote/consent/account reservation and native wiring are next.

Migrations0080–0082 are applied only to fixed disposable local databases.285API
tests across33files,40infrastructure tests, typechecks and API build pass. Coverage
includes real cookieCSRF/authentication, wrong owner, concurrent duplicates, queue
crash/retry/exhaustion, late refund, immutable receipts/extensions, provider regression,
cross-channel active conflict and closed flags. An initial failure exposed the old
one-event/one-audit constraint; separate immutable observation records fix restores.
Full regression then found a partial-index/old-constraint naming collision in the
existing real local pg_restore test; the additive rename now passes that test.
[Exact checks](../output/qa/rillora-launch-goal-20260926/apple-intake-checks.json).

AggregateEMF and four opt-in CloudWatch alarms cover worker errors, failed deliveries,
pending age and missing heartbeat through the existing alert topic. They are only
synthesized/tested: no cloud activation, actual alarm delivery, production schema
rollout, real Apple signature/purchase, native build or App Store submission occurred.
New-purchase preflight must still block every resumable cross-channel subscription,
including expired billing-retry states, before the StoreKit payment sheet can open.

## September26 launch-goal status adapter — preceding local checkpoint

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

The latest increment above completes local durable intake/notification/retry.
Native purchase preflight/flow and exact provider lifecycle acceptance remain open.
[Apple status endpoint](https://developer.apple.com/documentation/appstoreserverapi/get-all-subscription-statuses),
[renewal/grace fields](https://apple.github.io/app-store-server-library-node/interfaces/JWSRenewalInfoDecodedPayload.html).

## Shared ledger and price integration — preceding local checkpoint

Append-only migrations0076–0079 are implemented and tested only in disposable
local databases. No cloud schema, provider price or sale flag changed. The common
subscription access clock now honors a verified production Apple grace window
through its actual end, with the supported28-day ceiling. Missing, backwards or
excessive grace dates fail closed; other providers retain their existing seven-day
cap. The limit uses elapsed hours so DST/session time zones cannot shorten it.
The signed paid-period end and optional graceEndsAt are separate snapshot fields;
shared reading, effective subscription and grant application use the same SQL clock.
This does not turn on Billing Grace Period in App Store Connect.
[Apple's supported durations](https://developer.apple.com/help/app-store-connect/manage-subscriptions/enable-billing-grace-period-for-auto-renewable-subscriptions).

Production Apple price bindings are a separate one-to-many catalog mapping because
Apple retains a product ID across local currencies and historical prices. They
reference only apple_app_store prices; the generic Web offer query explicitly uses
web prices. No real Apple price is seeded. The loader derives signed milliunits
from the catalog's integer amount/exponent, rejects ambiguity and retains retired
windows for historical receipts. The existing Sandbox/v1 mapping is unchanged.

New immutable Apple receipt rows are tenant-isolated and bound to the same
production StoreKit subscription/owner. They retain amount/currency/paid-period
and proof digest, never raw JWS or private map content. Account erasure archives
only these financial facts through the existing closed-account-record mechanism,
then removes active receipt rows with the account. Recurring retention remains
an open operational gate; this is not proof of seven-year automated cleanup.

Stripe and the existing Apple Sandbox executor now call one75-line subscription
ledger module for observed state/price/grace and entitlement reconciliation. Each
provider keeps its own signature, ownership, catalog and financial-event checks.
Existing orders/receipts are not rewritten when a later verified period uses a
new reviewed price. This prepares the production intake; it does not mount it.

Local typecheck/build and266API tests across31files pass. New database checks cover
16/28-day grace beyond day7, invalid/missing expiry, DST, exact price units, Web88.99
separation, binding-channel rejection, ambiguity, receipt immutability/RLS and
financial retention on erasure. Two initial test errors used a private helper
without permission and the wrong response field; corrected to the real public
sharing facade/offers field without expanding permissions. Actual production
intake/notifications/retries, native purchase/restore and provider ceremonies remain.
[Current checks](../output/qa/rillora-launch-goal-20260926/ledger-checks.json).

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

## HISTORICAL — initial foundation verification and remaining work

Typecheck/build and242API tests pass, including18focused Apple checks. New tests
use synthetic decoded payloads and mapping rows; they do not prove Apple signed
production data, real StoreKit purchase, online certificate status, restore or
Notifications V2 delivery. Existing Sandbox tests retain their own scope.

The later launch-goal checkpoints above supersede this initial foundation gap list.
Native new-purchase preflight/consent and finish/restore wiring, actual provider
lifecycle acceptance, cloud rollout and complete cross-channel prevention remain.
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


Launch-goal source checkpoint4ed6a8295d6674473e1a673a0ae7f8ddb2994221 is pushed;
[CI15 passes](https://github.com/tantalum666/rillora/actions/runs/36237208779) in
source, API and Web/infrastructure jobs.920prepared files have25reviewed
non-secret spans and0unknown findings. No new scanner exception was needed.
The documentation receipt preserves this result without a new deployment.


The shared-ledger/catalog increment7c53bba56aea25c95f3c877641f01cde4b1a3100 is
pushed and[CI16 passes](https://github.com/tantalum666/rillora/actions/runs/36239456505).
Prepared source927files/25reviewed non-secrets/0unknown; no scanner exception was
added.0076–0079 remain local-only. The evidence receipt does not imply new builds,
cloud migration, configured Apple products or a completed production purchase.


Durable-intake engineeringcd7f203fb8b1dd5441b7df8bd8a89616c6b57e5a is pushed;
[CI17 passes](https://github.com/tantalum666/rillora/actions/runs/36242214340).
941prepared source files have25reviewed non-secret spans/0unknown. The single
scan-location update retains the exact old PEM-delimiter validator hash; it is not
a new secret exemption.148Markdown files/1432local targets have0missing.
No cloud/provider/native activation follows from this source checkpoint.


Native-purchase engineering0a51db9e880ee6d4b324170be72c075b0b1218e0 is pushed;
[CI18 passes](https://github.com/tantalum666/rillora/actions/runs/36327186360) in
source, API and Web/infrastructure jobs.955prepared files have25reviewed non-secret
spans/0unknown and no new scanner exception. The separately executed native suite
passes170with1existing test skipped because this project's current iOS26.4/26.5
Simulator StoreKitTest synchronization guard is active. The runtime issue and
actual provider lifecycle remain open; this is not a missing-fixture-only result.
No deployment or
actual Apple purchase follows from this checkpoint.
