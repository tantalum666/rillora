# HISTORICAL — Login repair handoff before fresh acceptance

Superseded by [current handoff](handoff.md) after the Owner answered the pending consent question and the actual fresh sign-ins completed. This is a dated checkpoint, not a current task list.

# Rillora Current Handoff

Status: REJECTED18 LOGIN FIX DEPLOYED / FRESH LOGIN ACCEPTANCE OPEN
Last updated: 2026-11-14 (Asia/Shanghai)

## Current task

Owner reports another rejection and requires a serious investigation of the actual reviewer login. Read the actual November12message and screenshot: build18, iPad Air11M3, iPadOS27.2.1,2.1(a), unable to establish a Rillora session. [Previous handoff](handoff-history-20261114-before-login-diagnosis.md) is historical; the November6 waiting state is superseded. Preserve data, prices, security, manual release, no TestFlight, no cloud CI/subagents and FanPass.

## Confirmed cause and completed repair

The November6 identity-security check included last_password_reset in Auth0's fields allowlist. The actual exact-user endpoint rejects that projection with400, so SessionSecurity rejects new sessions with503. The native error matches the Apple screenshot. This affects new logins, not only the dedicated reviewer; current user existence and December4eligibility do not fix it. Old tests returned a prepared profile and even asserted the invalid query. The previous review preparation did not verify a fresh login after this backend change.

Only email-verification.ts and its focused test changed. Supported exclusion mode preserves user_id, blocked and returned password-reset proof while excluding contact data, linked identities and metadata. A live reviewer comparison is400before/200after. A separate read-only comparison preserves an existing real password-reset timestamp; no password, account or consent was changed. The new regression failed first;20related tests, typecheck and build pass. SessionSecurity and30-day/7-day/CSRF/network/revocation controls stay unchanged.

One compiled module was overlaid onto266b79fb, producing aa5160ad985b765b33629d14ae9e620c8f5533ad63803079ec6aae33647546a3. Preview then production rollout completed, exact healthy tasks and unchanged parameters/edge policy verified. No migration, worker, pricing, credentials, native distribution or real purchase change. Health200/private401 are runtime evidence, not fresh-login acceptance.

## Actual login checks still open

- The isolated in-app browser tab1 is on https://app.rillora.xyz/account, with the existing same-version consent box unchecked. Owner action-time confirmation for the dedicated synthetic account's Web and native fresh-login tests was requested and has not arrived. Do not infer consent from silence.
- Protected reviewer password read required Mac user presence. The parent timed out; its orphaned signed helper was stopped, no plaintext credential was obtained. Reopen this exact protected read when Owner is ready; do not reset or replace the password.
- New independent simulator1C66A07D-F66B-43DF-8ED2-0F48096BE1A5 is iPad Air11M3/iPadOS27.0, with frozen18Release source installed and all Rillora configuration keys compared against the original18archive. It reached the real hosted login page without logging in; it has now been shut down with its prepared install retained. It is not a physical27.2.1 test. Original iPhone16ProMax is unavailable, not erased or altered.
- Device Hub was restored to its prior iPhone17Pro view; F57B6381 remains untouched/booted. XcodeBuildMCP defaults are cleared back to their initial state. On resume, use fresh-ipad.json and native-config-comparison.json to boot the prepared instance and set the frozen18Release project; no rebuild is required. Colima rillora-build is stopped; no local PG was started.

## Evidence boundaries

[Current diagnosis and gates](app-review-login-fix-20261114.md). QA output/qa/rillora-review-login-20261114, raw provider/account/auth/logs in private. Safe receipts in collaboration/verification/review-login-20261114. A bounded log query found POST503at2026-11-12T18:48:05Z, consistent with the screenshot time but not uniquely attributable because paths/identities are redacted. No matching Auth0 user logs were returned.

Original18archive/source and real purchase evidence stay dated; this repair does not require a new native version. No fresh full login, physical iPad27.2.1 result, new resubmission or Apple acceptance is claimed. A previously deleted local automation is not recreated or used as current availability evidence. New source/readable receipts use the exact f017648cada6d39144a88aa12b5a42d470c40e5d base publication gate; do not repeat old archive downloads.

## Single next step

Complete the pending protected read and action-time terms confirmation, then finish the same dedicated account's fresh Web and native login through the real provider, actual session issuance, private map/plan read and reopen. Bind results to this API digest and18configuration. Do not resubmit before those results; do not use existing-session, account-existence or health checks as substitutes.
