# Remaining software completion — September16–17

Status: SHARING ENFORCEMENT ACTIVE IN SYNTHETIC STAGING; CURRENT-PRICE STRIPE TEST ACCEPTANCE COMPLETE; ALERT/IDENTITY/LAUNCH GATES OPEN; SALES CLOSED  
Last updated: 2026-09-19 (new88.80/9.99 price and release routing)

Owner requests all remaining software except physical devices. Preserve the existing UI, homepage, root navigation and Profile arrangement. Prices remain US$68/year and US$7.99/month. Software behavior, provider test transactions, personal identity acceptance and merchant approval are distinct evidence.


## September19 current offer and continuation

The prior68/7.99 Stripe lifecycle remains completed historical payment evidence. Owner now selects88.80 annual/9.99 monthly. New immutable v3 prices retain Family capability version2 and the old receipts. The current price and channel exception are in[pricing-88-80](pricing-88-80-20260919.md); formal launch preparation is now governed by[release-readiness](release-readiness.md). Operations alert delivery/silence was verified and its schedule enabled; do not repeat the old destination question. New-price provider creation and catalog migration are separate from a new actual payment. Production sales remain closed.

## Implemented behavior

Migrations0048–0059 are applied with matching checksums. Per-owner transactions enforce Free1/Family5 outgoing places, including pending unexpired invitations. Contacts and incoming shares do not consume places. Duplicate targets and concurrent over-limit reservations are rejected. Full Free supports confirmed atomic replacement with draft preservation. Twenty activations per rolling24hours bounds repeated place rotation without blocking restriction, revocation or export.

Paid-period copies capture only actual permitted projections while eligible; expiry never lazily copies later private edits. An explicitly included Free person continues receiving updates; extra recipients receive only their saved permitted copy. Narrowing/removing grants permanently redacts/removes hosted copies. Routine saves preserve unchanged grant IDs. Later expansion cannot revive old review access. Retroactively shortened cutoffs remove unproven later copies. A new paid period requires explicit resumption.

Web/native retain existing controls and consume authoritative access/version states, saved dates and exact saved owner previews. Test/sandbox entitlements require expiring validation enrollment; production activation remains false. Ordered provider observations and invoice-bound refund state prevent stale events or an old invoice refund from overriding later paid access. Canceled subscriptions use actual ended timestamps.

## Checkout and actual provider state

Stripe TEST68/7.99 hosted payments now both complete through the actual independent Rillora test account. Signed events grant Family5 only to the expiring enrolled fixtures. Portal annual cancellation preserves the paid period; undoing cancellation restores renewal. Provider termination returns Free1 and preserves only permitted saved fields. Full monthly test refund is reflected as refunded after verified delivery; repeated same-event delivery adds no extra event/reconciliation. Existing active subscriptions reject a second checkout. After an ended subscription, a fresh quote can be opened, switching period is blocked until the pending provider session is expired, and closing unpaid checkout grants nothing.

Owner completed the prior permission/SMS blocker and expanded the existing restricted-type TEST key's permissions broadly. Actual readback confirms Core/Prices/Customers/Subscriptions/Checkout write. This is Owner-configured test access, not a least-privilege or live-merchant approval claim. No key value was copied. Legacy99/9.99 records and subscriptions are retained.

Test Checkout requires CSRF and explicit enrollment. Repeated clicks reuse unfinished same-price checkout; changing period requires closing it. Existing subscriptions are checked before allowing duplicates. Checkout/Portal return to existing Plan & access; return alone never grants access. Expired/completed sessions return recoverable409. A price preflight runs before reserving a new order and returns503 when unavailable. Once provider submission may have occurred, a later lookup failure preserves the durable order and idempotency key. This prevents a lost payment response from enabling a duplicate purchase.

Only enrolled Web accounts see test billing controls with server-priced recurrence acknowledgment and exact HTTPS Stripe destination checks. Ordinary sales stay closed. This is not a completed public production purchase flow.

## Evidence and current dependencies

September17 provider acceptance additionally exposed a real availability fault: the only Spot API task was interrupted at09:11:10 HKT and Gateway returned four500 responses with No target endpoints found at09:11:12–13. The existing API is now one regular Fargate task, actually RUNNING/HEALTHY with completed rollout. API28 and the database schema are unchanged. Infra18 tests,41 HTTP/asset checks and an invalid-signature400 boundary check passed after the change. The recovered refund types are applied; see [provider QA](../output/qa/rillora-stripe-acceptance-20260917/README.md).

- API167 passed after provider-failure recovery; native149 passed/0 failed/1 existing StoreKit skip; Web78 app tests and final release build pass; infra17 passes. Actual local mobile/Web/native checks cover draft-preserving replacement, pause, saved projection and explicit resume. Mocked test-billing UI covers failure/close/reset; its induced409 is expected.
- Global sharing enforcement is true; production entitlements are false. Existing sole connections were migrated to their included place; activation rejects ambiguous multi-person legacy plans. Cloud Free reservation, ordinary-account enforcement, incoming access and failed-payment/no-grant checks pass.
- API28/migration definition22 and final Web reached1/1, rollout COMPLETED, with41 final HTTP/security/asset checks. Safe preflight and lost-response retention are deployed. Legal Sites5 and legal wording/digests are unchanged. Current details are in [QA state](../output/qa/rillora-launch-completion-20260916/work-state.json).
- Owner-controlled A/B actual registration, email verification, explicit acceptance, read-only permitted details and A revocation are now observed. B reload denies retrieval and A's Free place is released. Owner reported the extra login after verification; API30/0060 now refreshes current proof within the same session, with actual Auth0/cloud synthetic acceptance and old-capability denial verified. The original human token was not retained for browser re-open.42 HTTP/asset checks pass; all new isolated cloud/Auth0 fixtures are cleaned. Web Back/consent ordering is also published. [Current evidence](../output/qa/rillora-real-invitation-20260917/README.md).
- Public monitoring first hit an AWS concurrency-reservation limit. The read-only checker now uses the shared account pool with one15-minute schedule,15-second timeout and bounded retries. A narrowly scoped operator policy permits this job's invocation/logs/alarms/topic operations. Deployment and one actual AWS invocation7/7 are verified; schedule stays off pending an Owner-selected subscriber, delivered alarm/recovery and silence drill.

## Remaining work

Disposable fixture cleanup is complete (3 planners,0 remaining,3 old sessions401). Current-price Stripe test acceptance is complete. Current B acceptance/revocation and its observed continuation defect are handled within the recorded evidence boundary. Continue alert destination/delivery and monitor activation. Apple actual transaction/restore, merchant/KYC, live charge, production market readiness and later-stage automations remain separate unfinished gates. Physical-device work and UI redesign are excluded.

[Reading continuity](../output/qa/rillora-launch-completion-20260916/reading.json) reuses the completed full-body Markdown baseline and supplements changed focal files. This continues the same workflow.
