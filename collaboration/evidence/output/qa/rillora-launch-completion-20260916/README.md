# Rillora remaining software — September16–17 QA

Status: sharing enforcement active in synthetic staging; API28 final readback and fixture cleanup complete; new-price payment requires Owner Stripe SMS verification.

## Scope and reading

Continue Owner's non-device completion task while preserving the existing UI. Pricing remains68/year and7.99/month. `reading.json` references the original66-file full-body Markdown read and subsequent continuations. Compression recovery reads current authority/focal files; fingerprints are not reading evidence. No new design or root navigation was adopted.

## Implementation and tests

- Migrations0048–0059: serialized Free1/Family5 outgoing reservations, actual paid-period permitted projections, saved owner previews, permanent restrictive redaction, explicit included person/pause/resume/replacement, rate bounds, bounded provider entitlements, invoice-bound financial overrides and new test-price bindings.
- API167 passes in `api-final-tests.log`; native149/0/1 existing StoreKit skip in `native-final-tests.json`; Web78 in `web-followup-all-tests.log`; infra17 in `infra-ops-final-tests.log`; public-probe6 in `ops-tests.log`. API typecheck/build and Web release build pass.
- Actual local mobile replacement/cancel-draft/pause/resume and saved recipient/owner projection are recorded in `replacement-browser.log`, `saved-browser.log` and screenshots. Native actual views matched old saved fields and explicit resume. Normal native launch was restored with empty override environment and public Overview observed.
- `test-billing-ui.log` is a deliberately mocked Web UI check of acknowledgment,409 recovery,close/reset and mobile width; the409 console resource error is expected. It does not prove a provider payment.
- The API's lost-provider-response test retains the same durable order/idempotency key through a later preflight failure. Configuration preflight runs before reserving a new order. An ambiguous provider outcome is never treated as proof of no payment.

## Cloud evidence

- Source checksums0048–0059 match; sharing enforcement is true, production entitlements false. Existing sole relationships were deliberately retained in their included place. The migration rejects ambiguous unselected legacy multi-person plans.
- `cloud-sharing-acceptance.json` contains13 assertions: Free reservation/contact/incoming guards; Family allowance via a bounded admin-created synthetic grant; actual recipient accept; cutoff-copy after later edit; explicit Free resume; permanent redaction; revoke. The15-minute manual grant is not a Stripe/Apple transaction.
- `aws-http-verification.json` and final verification log cover41 HTTP/security/current-build asset checks. `final-deployed-state.json` records API28/migration definition22, UPDATE_COMPLETE and1/1 with rollout COMPLETED after the final safe-preflight update.
- Legal Sites5 and legal wording/digests were not modified or redeployed. No new provider legal consent, actual B acceptance, live charge or physical-device result is inferred.

## Stripe and identity

The Owner authenticated Chrome in Rillora account `acct_1U6B2RCxTlowhyiG`. Test annual `price_1UGKXlCxTlowhyiGVLKAkfl1` and monthly `price_1UGKadCxTlowhyiGJ0bnY9Kn` are created/read back and mapped; legacy prices/subscriptions remain. The default local CLI belongs to another project and was not used. Runtime-key secret read was denied and not bypassed.

Actual current-price Checkout is blocked by the old restricted key lacking Prices Read. UI changes selected only that non-sensitive test-price read permission; saving triggers Stripe SMS verification, pending Owner. No successful new-price checkout/payment/portal lifecycle or revenue is claimed. Permission save must be read back and actual payment verified after the handoff.

A completed real Google login and prepared a disposable invitation. B real signup/acceptance remains pending. Browser URL policy blocked automatic cross-browser invitation opening, and no alternate automation was used to bypass it. Real addresses/tokens remain outside Markdown and ordinary QA files.

## Operations

`RilloraOperations` deployed after its first attempt failed because AWS could not reserve per-function concurrency. The corrected function uses the shared pool, one15-minute schedule,15-second timeout and bounded retries. `ops-invocation.log` records real AWS7/7 public checks, failed0, no response-body retention. Operator verification permissions are limited to the public job's function/logs/alarms/topic, not private app secrets or data.

Schedule is configured disabled and `ops-subscriber-state.json` confirms0 subscribers. Owner alert-destination question remains pending; no subscription email or test alarm was sent. The initial failed stack was removed; its retained log/DLQ IDs remain in `ops-rollback-retained.json` and are not claimed deleted. Denied queue/log-list permissions were recorded; no credentials were read through an alternate role.

## Cleanup

All3 disposable cloud planners were removed, remaining0. Each of their old sessions returns401; the protected fixture-token file is deleted. Real Owner accounts and pending real invitation were not modified by cleanup. Local4270/4271 QA servers and owned Playwright session are stopped. Normal native app launch uses empty test overrides.

## Documentation and boundaries

Updated focal contracts: commercial completion, monetization, trusted sharing, backend, platform, pricing68, StoreKit receipt, family maintenance, solo operations and infrastructure runbook; automation registry reflects deployed/disabled monitoring. Decision log and journey append this checkpoint; handoff retains one next step. No global memory writes, Git initial commit, branch or stash were created.

Remaining: Stripe SMS/new-price payment lifecycle, B actual acceptance/revoke, alert destination/delivery/silence drill, Apple actual transaction/restore, production purchase/merchant/market readiness, and later-stage automations. Physical devices remain excluded. All tests and fixtures have their exact scope; no all-app/all-launch closure claim.
