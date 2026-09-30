# HISTORICAL — provider acceptance in progress, September17

Captured before completion of the provider and availability checkpoint. Superseded by [current handoff](handoff.md). Authentication and old next-step text below are historical, not instructions to repeat them.

## Captured handoff — historical

Status: HISTORICAL SNAPSHOT; NON-DEVICE SOFTWARE CONTINUATION; SHARING ENFORCEMENT ACTIVE; API28 / WEB DEPLOYED; EXTERNAL ACCEPTANCE OPEN; SALES CLOSED  
Last updated: 2026-09-17 (Asia/Hong_Kong)

## Current task

Owner: “除了实体设备，把其他都搞好”. Continue remaining software and real account/payment acceptance while preserving the existing UI. Prices remain68/year and7.99/month. [Current work contract](commercial-completion-20260916.md).

## Completed and current evidence

Database0048–0059 is applied with source checksums matched. Free1/Family5 reservations, fixed authorized paid-period copies, permanent redaction, explicit included-person/pause/resume/replacement and bounded provider entitlements are implemented on API/Web/native. Global sharing enforcement is on; production entitlements/sales are off. Cloud synthetic cutoff/edit/resume/redaction/revoke checks passed. No homepage/navigation/Profile redesign was adopted.

Latest suites: API167, native149/0/1 prior StoreKit skip, Web78, infra17. Actual mobile/Web/native sharing checks pass.Final API28/migration definition22 is1/1, rollout COMPLETED;41 HTTP/security/asset checks passed after the safe-preflight patch. Legal Sites5 is unchanged. Normal native launch uses cloud configuration and public Overview; test identities are not the default.

Stripe TEST68/7.99 prices are created/read back and bound; legacy prices/subscriptions remain. Owner has completed the permission change, including broad test permissions; readback and actual Checkout now succeed. Annual68 and monthly7.99 test payments granted verified Family5. Annual portal cancel/resume and provider-ended Free1/saved-copy checks pass. Monthly refund/termination and this new fixture cleanup are being completed; no fresh login is required. New Checkout is CSRF/enrollment guarded, reuses unfinished orders and prevents duplicate subscriptions; preflight occurs before new reservation, while uncertain provider outcomes preserve idempotency.

Independent public monitor deployed; actual AWS invocation7/7 passes. Schedule is configured disabled,0 subscribers. Owner was asked for an alert destination. Alarm/recovery/silence delivery remains open. Initial failed stack's retained log/DLQ identifiers are in QA, not claimed removed.

## Boundaries and handoffs

A real Google login and disposable invitation creation were observed; B actual signup/acceptance/revoke remains pending. A browser safety block prevented automatic cross-browser invite opening; do not bypass it. User was asked to open the copied link manually. Synthetic cloud sessions/manual short-lived entitlement are not identity consent or provider payment proof. All three disposable cloud planners were removed, remaining0; each old session returns401 and their protected local tokens were deleted. The real Owner accounts/invitation remain untouched.

AWS STS and Chrome Stripe authentication succeeded; do not request either again. The former Stripe SMS save blocker is resolved. Default Stripe CLI belongs to another project. Do not read runtime secrets using another role after denied access. Merchant/KYC/live sales, normal production purchase, actual Apple transaction/restore and later-stage automations remain open. Physical devices are excluded.

## Unique next step

Finish the active monthly test refund/termination, verify reconciliation and remove the new disposable fixture, then record the provider checkpoint. Keep B and alert-destination handoffs visible; do not turn a passing test batch into overall release approval.

## Recovery

[Reading continuity](../output/qa/rillora-launch-completion-20260916/reading.json) reuses the completed original66-file full-body audit and subsequent continuations. After compaction read current product/handoff/latest decisions/current contract and changed files. [Current QA](../output/qa/rillora-launch-completion-20260916/README.md), [work state](../output/qa/rillora-launch-completion-20260916/work-state.json), [previous deployed checkpoint — HISTORICAL](handoff-history-20260916-before-commercial-completion.md).

Active provider acceptance: [current state](../output/qa/rillora-stripe-acceptance-20260917/work-state.json). The earlier3-fixture cleanup remains true for its prior run; this continuation has3 new disposable fixtures.
