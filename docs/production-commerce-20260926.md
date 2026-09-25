# Production annual commerce preparation

Role: focused ordinary Web purchase, consent and provider-isolation contract
Status: SOURCE AND LOCAL LIFECYCLE VERIFIED; CLOSED WEB DEPLOYED; LIVE BILLING NOT CONFIGURED
Last updated: 2026-09-26 (Asia/Hong_Kong)

Owner asks to complete release engineering. Keep Free plus WebUS$88.99 annual Family,
current UI/brand, historical receipts, test identities and FanPass. This increment
prepares an ordinary production path; it does not open sales or complete the
Owner-deferred merchant/business facts. Apple remains a separate workstream.

## September26 Web price revision

The later Owner decision changes the current Web offer to88.99, price-v4 with
8899cents and a new purchase-consent version. Earlier implementation/CI evidence
below retains its original price/checkpoint date. Current rollout and preserved
v3 receipts are tracked in[the88.99contract](pricing-88-99-20260926.md).

## Provider and configuration boundary

The production adapter accepts only restricted live credentials for the exact
Rillora Stripe account. The existing test adapter still rejects live objects.
Shared SDK transport and pure normalization are reused, while configuration,
provider objects, inbox, subscriptions and routes retain explicit environments.
Stripe SDK22.6.2 pins API2026-08-26.dahlia; this version was checked against the
[official versioning page](https://docs.stripe.com/api/versioning).

A strict versioned secret schema loads AWSCURRENT from only the named Rillora
production billing secret in Frankfurt. Secret bytes are not returned in parser
errors, committed or supplied as plaintext runtime environment variables. The
actual secret and production task permission are **not installed** yet. The
ordinary runtime flag requires the reviewed production origin, encrypted content,
recovery journal and internalTLS; development/test/closed-runtime flags cannot be
combined with it. A closed production build and server stay independently closed.

Before a new checkout, check market/operator/storefront/route/plan/product status,
effective dates, production entitlement enablement, exact account and merchant
charges/payouts readiness. The Web route is web_direct; stripe_web_external is the
separate iOS route. The provider must confirm an active live Product and its
recorded tax code, exact annualUSD8899 licensed/per-unit Price, explicit tax
behavior, one item and quantity one. No new monthly purchase, trial, promotion
code, adaptive pricing or client-supplied price/provider identity is accepted.

Tax remains a factual launch gate. Configuration requires a recorded assessment
and confirmed product code; automatic tax additionally rechecks the specified
active registrations. An explicit reviewed-no-collection decision is a separate
mode, never an automatic inference from missing registration. No tax registration,
filing, merchant verification or tax assessment was performed in this increment.

## Customer flow and durable purchase proof

Plan & access now has annual review/checkout, current status, management, refresh
and unfinished-checkout closure. It reuses the existing visual language. A separate,
unchecked consent shows the annual amount, renewal/cancellation and current
Subscription Terms/Refund Policy. Account-registration consent cannot substitute.
Version, legal-bundle digest, amount/currency and three explicit acknowledgements
are checked by the server; an immutable per-order receipt is saved transactionally.

An owned durable order/attempt and stable provider idempotency key precede the
provider call. Ambiguous response retries retain the same reservation and original
pre-existing-Customer choice. A finished idempotency key cannot reopen a checkout;
a fast verified webhook cannot be overwritten back to pending by a late POST result.
Expired-read-only subscriptions are checked against the provider before another
purchase, since paused collection can still resume renewal. Provider Customer
bindings cannot be silently replaced by an incoming event.

Only exact provider-host HTTPS URLs can be navigated to. Return paths resolve to
Plan & access, survive authentication and discard session/payment query values.
The return URL never grants access. A separate status response exposes only the
user's state/period and management/pending flags, not provider/customer identifiers.
Closing new sales does not remove the existing customer's management route.

## Notifications, retry and access

Raw-body signature verification and environment/account binding precede inbox
processing. A fresh authoritative Subscription plus settled invoice and exact
customer/catalog binding is required for active access. Existing object ownership
wins over metadata; conflicting mappings fail. A fast unlinked event must prove
an owned order/attempt and its durable purchase consent. Subscription cancellation
retains paid-period access; expiry ends live extra access through existing sharing
rules. Refund/dispute effects apply to their matching invoice, so a late old refund
cannot revoke a newly paid period. No automatic provider refund/cancel is inferred.

The same-origin proxy removes /api. Both prefixed and unprefixed webhook aliases
therefore resolve to the same signature-checked handler; this also repairs the
existing Apple Sandbox notification alias without claiming Apple production support.
Unmapped production events return503 for provider retry. A production-only worker
can retry stored verified routing references every five minutes, up to20 per pass
and12 internal retries; it never stores/replays raw webhook bodies. Per-process
runs do not overlap, duplicate ledger application is suppressed, and generic
counts/errors omit customer content. Exhausted/unmapped items require operational
review; final alert wiring and post-restore provider-wide reconciliation remain
release work. This worker is source/local tested, not currently running in AWS.

## Evidence, rollout and remaining gates

Local:233API tests, typecheck/build;89Web source tests plus7legal fixture tests;
39infra tests and21release guards. The initial all-Web invocation used the product
artifact for legal-only packaging tests; rerunning the intended legal fixture
passed without weakening assertions. Earlier failures exposed missing commerce
read permission and a wrong route assumption; migrations0071–0073 and code fix them.
Those migrations ran only in disposable local databases, not cloud production.

Actual local Chrome fixture checks cover unchecked/checked consent, valid proof,
recoverable failure, cancellation/management, pending-checkout exit, desktop and
390px width. Price emphasis, link color, disabled appearance and stale confirmation
copy were corrected. No real consent, payment or provider navigation was performed.

Only RilloraProductionWeb was updated: two billing-return paths and the matching
closed artifact. Seven actual HTTPS/HTML/API/negative-route checks pass, and Chrome
shows Accounts are not open yet at the return page. Production API task1/schema0070,
provider credentials, Auth0 bindings and sales flags remain unchanged. Earlier
native client/monitor/recovery evidence is retained with its original date.

Before enabling customers: complete merchant/market and tax facts; create and
read back the exact live Product/Price, restricted key, signed endpoint and Portal
configuration (cancel/resume/payment-method management; no unapproved price switch);
install the named vault/IAM configuration, apply the reviewed append-only migrations,
deploy the configured API, verify ordinary provider transactions and failure/retry
alarms, then complete cross-channel/restore/retention checks. Code rollback preserves
added tables/receipts; do not drop data or revert to a pre-encryption runtime.
Identity/email, Apple price/production verification, signed artifacts, submission
and Owner-deferred device/business checks remain governed by
[release readiness](release-readiness.md).

[Local QA and exact evidence boundary](../output/qa/rillora-production-commerce-20260925/work-state.json).

Source checkpoint e38cd05e7278443bd05a223c09849d1f3411d4d9 is pushed to the private
Rillora repository; [CI11 succeeds](https://github.com/tantalum666/rillora/actions/runs/36163894825).
The final evidence-only documentation follow-up does not rerun or redeploy that
engineering. Prepared source scan:906files,23reviewed non-secret spans,0unknown;
141project Markdown files/1348local links have0missing targets.

A final Web follow-up keeps current Family benefits visible after catalog activation
and distinguishes closed new sales from existing paid access. Its focused10tests
pass; the complete source-Web suite now has89checks. This follow-up does not alter
pricing or provider behavior and has a separate commit/CI receipt in the QA record.

The final follow-up7cf75bb4ad4b3403a9932a2095edf2ad891ecdff passes
[CI12](https://github.com/tantalum666/rillora/actions/runs/36164574920).
Its closed Web artifact is deployed/UPDATE_COMPLETE, exact HTML and seven final
HTTP checks pass, and actual Chrome still presents the intended closed-account
page. The API deployment/merchant/identity boundaries above remain unchanged.
