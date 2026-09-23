# HISTORICAL — Invitation completion handoff

Superseded as the active handoff by the Owner's September17 signed-in surface/motion refinement. The following is the prior checkpoint, not a parallel active task.

# Rillora Current Handoff

Status: REAL B ACCEPTANCE/REVOCATION OBSERVED; EMAIL CONTINUATION + WEB RETURN/CONSENT FIXES DEPLOYED; API30 HEALTHY/FARGATE1  
Last updated: 2026-09-17 (Asia/Hong_Kong)

## Completed current task

Owner requested B acceptance/revocation, reported a second login after email verification, then requested a received-invitation Back button and Web consent below signup/sign-in choices. All current software changes are implemented and published within the existing UI. [QA](../output/qa/rillora-real-invitation-20260917/README.md).

Actual A Google/native terms and B signup/mail verification/explicit acceptance were Owner-performed. B's UI showed the disposable selected document and permitted Notes, Read only; A showed Connected. A then stopped sharing, showing Disconnected/0 of1 place, and B reload showed no shared information. A/B real accounts and A's private test records remain; the relationship remains revoked. Exact mailboxes stay in conversation, not Markdown.

The repeat-login defect is repaired through a dedicated read-only Auth0 service selecting only the current session's stored issuer/subject, with exact user_id and boolean verified-email checks. The same opaque session/legal receipt remains; no provider flag write, same-email merge or new consent occurs. Web/native keep the invitation and can continue after verification; true session expiry still requires sign-in. Visible shared views recheck every15seconds without loading flicker and clear revoked/unverifiable content.

Web invitation Back returns to Shared with me for that entry and retains bounded context across auth/reload; direct entries return to Rillora. Account/invitation consent is below both auth choices, unchecked and mandatory. Empty recipient state is No shared items. The live Chrome invite page now shows Back to shared items. Styles/layout otherwise use the existing direction; no policy version/digest or pricing change.

## Deployment and validation

API30/migration23, checksum0060, dedicated verification secret and final Web asset are active. Actual task is RUNNING/HEALTHY/FARGATE; desired/running1, pending0, rollout COMPLETED.42 final HTTP/security/assets checks pass. API177, Web78, native151 passed/0 failed/1 old StoreKit skip plus4 final shared-store tests, infra19 and ordinary final native build/install/run pass. The final native Simulator is the normal cloud/public entry with env{} after the previous user session expired, not a seeded identity.

Actual Auth0/cloud isolated checks prove false proof denies acceptance, a later administrator-set fixture proof accepts with the same token, approved fields are readable, and revocation prevents both reads and reuse of the same capability. Cleanup logs verify two temporary cloud planners removed,0 remaining, exactly one session/receipt per actor. Old fixture tokens401, temporary Auth0 profile absent, protected fixture tokens removed. The persistent read-only service credential remains protected/ignored for the configured runtime. The owned local QA server/browser are stopped; the separately booted Matrix13 test Simulator is back in Shutdown. The normal Matrix17Pro remains available.

## Evidence boundaries

B's real ceremony occurred before the email-continuation repair. A fresh real signup/email ceremony after the repair is not claimed. The original real invitation token was not retained before revocation, so its exact browser re-open was not completed; cloud fixture rejection is separate evidence. Prior browser policy still prohibits an automated alternate route/new link to bypass the original real-link restriction. Revocation cannot erase copies already kept elsewhere.

Current-price Stripe test acceptance/cleanup and the regular-Fargate availability repair remain completed prior evidence. Monitor schedule is still off/0 subscribers; Apple actual transaction/restore, merchant/market readiness and production purchase remain open. Prices68/year and7.99/month, production entitlements/sales closed, physical-device work excluded. [Prior checkpoint — HISTORICAL](handoff-history-20260917-stripe-complete.md).

## Next step at that checkpoint — HISTORICAL

Resume the independent public-monitor activation after the Owner selects the pending alert destination, then verify delivered alarm/recovery and missing-heartbeat behavior before enabling its schedule. Do not send subscription mail before that destination is chosen or repeat completed B/Stripe authentication/tests merely to recover context.

## Recovery

Reuse the [full-read baseline](../output/qa/rillora-launch-completion-20260916/reading.json) and [current continuation record](../output/qa/rillora-real-invitation-20260917/reading-continuity.json). Read current product/handoff/latest decisions and changed focal files after compaction; do not restart full scans or personal logins. [Final runtime](../output/qa/rillora-real-invitation-20260917/final-runtime-state.json).
