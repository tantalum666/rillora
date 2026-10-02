# Apple review validation and distribution preparation

Role: current TestFlight/App Review engineering and provider evidence
Status: RESTRICTED REVIEW CLOUD VERIFIED; DISTRIBUTION PREPARED; REAL TRANSACTIONS AND SUBMISSION OPEN
Last updated: 2026-10-02 (Asia/Shanghai)

Owner requests Apple-related release work. Existing UI, annual-only new sales,
WebUS$88.99, differential Apple pricing, historical receipts and FanPass stay intact.
The launch workflow's147-file full reading baseline remains valid; this is a focused
continuation, not a new project scan. [QA](../output/qa/rillora-apple-release-20260929/work-state.json).

## October2 actual review preparation follow-up

Production Web/native identity and genuine consent were observed. The one existing QA
planner now has bounded validation enrollment through the unchanged October6expiry;
no order or entitlement was fabricated. Sandbox URL/official Apple TEST delivery are
verified after the measured OCSP repair. A strictly checked Release Apple Development
build is prepared for the paired phone, but Owner explicitly keeps real-device steps
deferred and nothing was installed. Actual Apple-signed purchase/restore/lifecycle and
App Store/TestFlight distribution remain open. [Current evidence](release-123-20261001.md).

## HISTORICAL — September30 restricted review preparation

The review API, exact Sandbox/Web vaults and immutable review-onlyUSA6800catalog
are now deployed under an expiring Auth0/API identity allowlist. Schema0091and91cloud
checksums match; no ordinary production planner or live sale existed at acceptance.
Actual reviewer login/affirmative terms/enrollment and purchase/restore/notification
steps remain parked for Owner participation. See[the current contract](release-engineering-20260930.md).

A new strictly verified, non-debuggable distribution IPA includes the privacy/API
reason and callback/recent-auth repairs. It retainsCustomerAccessNOand was not
uploaded. Six direct JPEG screenshots and submission worksheets are[prepared](../output/release/rillora-20260930/README.md).
The historical September29 build and its314API/175native evidence are not current
reruns; current API341and targeted native41have their own reports.


## One purchase lifecycle, two explicit verification contexts

Reuse the existing production verifier/status/receipt/inbox/ledger/preflight with
immutable server-selected production or review contexts. Review uses only Apple's
Sandbox host and Sandbox-signed evidence; production still rejects it. Both retain
pinned roots, online signature checks, exact bundle/group/SKU, individual quantity1,
appAccountToken ownership, amount/currency/storefront binding and signed-date checks.
Apple may omit appAppleId in Sandbox only. Never retry a failed signature in another
environment, accept Xcode fixtures, or let an unsigned client field pick a verifier.

Migration0086 adds environment-specific price bindings and receipts/observations.
The modern worker has an explicit intake marker, so it cannot consume the old
Sandbox diagnostic queue. Environment-specific leases, owner/object links, order
transitions and receipt completion prevent cross-environment reuse. No real offer,
account enrollment, market or sale flag is seeded. Historical Sandbox/v1 code is
preserved as a diagnostic path, not relabeled as the new review lifecycle.

Review accounts need an explicit, unexpired existing validation enrollment and
active ownership. Accounts with any production order or subscription are excluded.
Real Apple and Web checkout also reject active validation enrollment or any test
billing history, even after enrollment expires. Retire synthetic billing explicitly
or use a separate customer identity; a test account cannot drift into real payment.
Eligibility is rechecked on quote/preparation/intake and within the commit; the
existing access clock stops test access when enrollment expires without waiting
for a notification. A separate test-only route, Sandbox merchandising SKU and
review price binding are mandatory; merchant sales policy stays closed. Review
amounts and receipts remain labeled Sandbox, never proof of revenue or a real charge.

The same checkout lock, explicit recurring-terms consent, nonce, prepared-order
reservation, fresh price evaluation, current signed status retrieval, duplicate
restore refresh, immutable first receipt and atomic finish acknowledgement apply.
The ordinary production contract remains compatible; review receipt replies use
`commerce-apple-review-v1` plus `environment=sandbox` and `validationOnly=true`.
The client rejects a production acknowledgement for a review transaction.

## Native routing and App Store purchase intent

The native client reads verified `AppTransaction.shared` to choose the explicit
production or review API route. It does not call `refresh()` or infer the environment
from build names, receipts filenames or an unverified decoded payload. Missing,
unverified or Xcode application evidence leaves buying unavailable; explicit retry
can recheck. Owner-generation guards discard late results after account changes.
The review purchase section clearly says Apple test purchase / no charge.
[Apple AppTransaction](https://developer.apple.com/documentation/storekit/apptransaction/shared),
[TestFlight uses Sandbox](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight/).

`PurchaseIntent.intents` now listens while the ordinary app is open, including when
signed out. An annual product opens the existing Plan & access flow; sign-in is
required before purchase, the terms start unchecked, and receiving an intent never
opens a payment sheet or grants access. Keep the actual Product supplied by Apple
through the guarded purchase. Monthly and unsupported products do not start new
sales. Invites/contact/setup sheets retain priority and return controls.
[Apple PurchaseIntent](https://developer.apple.com/documentation/storekit/purchaseintent).

## Default-off cloud contract

`ALLOW_APPLE_REVIEW_INTEGRATION` defaults false. Its only credential reference is
`rillora/production/apple-review` in the existing account/region, schema1,
`environment=sandbox`, exact bundle, EC/P-256 IAP key and explicit storefronts.
It requires the encrypted production namespace, recovery journal, TLS, official
App origin and real authentication. It cannot coexist with developer authentication,
the old Sandbox diagnostic runtime or closed health-only production mode.
Production and review can coexist only as separately loaded configured contexts.
Queue metrics carry their actual environment. The September29implementation checkpoint activated no cloud resource. September30now activates the restricted configuration/catalog; notification URL and real enrollment remain pending.

Before a usable TestFlight candidate: complete actual sign-in/affirmative terms and
validation enrollment for the prepared restricted identity, then verify the configured
review quote, actual notifications and purchase/restore. The schema/runtime/vault/catalog
preparation is already completed; do not repeat it. Final identity/email and live commerce gates remain separate;
changing the native customer-access switch alone cannot complete them.

## Actual Apple administration

September29 account readback confirms paid/free agreements active, banking available,
tax forms in use and the membership active throughJune2027. Those observations do
not establish the Small Business Program rate or clear the Owner-deferred merchant
facts. Annual pricing is stillUSAUS$68 / CanadaCAD99, eight test-matrix territories,
App Store only, no multiseat, Family Sharing off. No final Apple price is saved.
Web88.99 and conditional Apple99.99/119.99 candidates retain their separate authority.

Owner confirms no associated developer accounts and prior-year total proceeds no
more thanUS$1million, then explicitly confirms the final attestation and submission.
The Small Business Program page confirms receipt of the enrollment. Approval and
15% effective date are **pending**, not inferred from submission.
[Submission receipt](../output/qa/rillora-apple-release-20260929/small-business-submitted.txt).

Attempting to disable Streamlined Purchasing was rejected by Apple because the
latest approved binary lacks the required API. The setting remains on. The source
now includes PurchaseIntent; return to this setting after the relevant binary is
approved, before enabling external merchandising. No offer-code or promoted-IAP
campaign is launched. [Official restriction](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-streamlined-purchasing).

The unsubmitted App Store draft now saves the actual public website and support
page; reload confirms both fields. No new public claims were added to the listing.
Version1.0 remains Prepare for Submission; screenshots/reviewer account/contact
fields are incomplete, and TestFlight explicitly shows no builds.
[Listing source](../config/app-store-listing.en-US.json).

## Verification and artifact boundaries

The full local API suite passes314tests/35files; typecheck and build pass. Native
full unit run passes175 with1existing StoreKitTest skip; subsequent13purchase tests
and1new transport test pass after the final focused edits. These use synthetic
Apple decoded payloads/transport and isolated PostgreSQL, not an actual Apple
signature, purchase, notification or refund. No additional physical-device result
is claimed. [Native evidence](../output/qa/rillora-apple-release-20260929/native-tests.json).

The first archive failed because the old Rillora provisioning profile omitted
Associated Domains. Xcode's authorized automatic refresh resolves it; Release
archive and App Store distribution export succeed. The exported app has the exact
bundle/team, a non-debuggable store profile, compiled icon, production connections,
no development identity and no embedded `.storekit` fixture. Strict code-signature
verification passes. Customer access remainsNO, so this is a signed preparation
artifact, **not a usable TestFlight release**. No build was uploaded or submitted.
The ordinary Debug Simulator app is rebuilt/installed against the existing Preview
API without new test overrides. [Distribution record](../output/qa/rillora-apple-release-20260929/distribution-verification-final.json).

Remaining Apple acceptance is an operational production review environment,
effective fee/final channel price, real purchase/restore and lifecycle notifications,
final screenshots/privacy/age/encryption/reviewer package, TestFlight/upload/review
and manual release. Preserve physical-device and business-fact deferrals. Do not
mark the overall Apple or submission release gates verified from these local results.

Final engineering79cea6429b8a6b0d0712a4af4aeea3096e7e35d5 is pushed and
[CI35](https://github.com/tantalum666/rillora/actions/runs/36596303754) succeeds. Source scan preserves
25exact reviewed nonsecret spans/0unknown;163Markdown files/1613local links resolve.
The final guard uses existing scoped database functions and needs no migration
beyond0086. This source/CI closeout deploys no cloud API and changes no signed native
artifact or provider configuration.
