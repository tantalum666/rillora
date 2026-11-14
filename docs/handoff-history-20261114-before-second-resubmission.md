# HISTORICAL — Fresh-login acceptance before the Owner's resubmission instruction

Superseded by [current handoff](handoff.md). This preserves the completed acceptance and previous unsent state; it is not a pending task list.

# Rillora Current Handoff

Status: REJECTED18 / LOGIN FIX DEPLOYED / FRESH WEB AND NATIVE SIGN-IN VERIFIED / NOT RESUBMITTED
Last updated: 2026-11-14 (Asia/Shanghai)

## Current task and completed result

Owner requested a serious investigation of the latest Apple login rejection, then explicitly confirmed the original synthetic review account's current Web and native terms/privacy/electronic-record submission. That confirmation has been used; do not ask again for this completed acceptance. [Earlier pending handoff](handoff-history-20261114-before-fresh-login-acceptance.md) is HISTORICAL.

The actual November12 review is for build18 on iPad Air11(M3), iPadOS27.2.1, guideline2.1(a). The original screenshot says the identity service could not establish a Rillora session. The November6 security-profile query used an unsupported Auth0 projection field, returning400 and causing session503. The supported exclusion projection preserves blocking/deletion/password-reset checks. The failing regression,20 passing related checks/typecheck/build, actual400/200comparison and existing reset-proof preservation are recorded in [the diagnosis](app-review-login-fix-20261114.md).

The one-module repair was deployed Preview then production. Both APIs use digest `aa5160ad985b765b33629d14ae9e620c8f5533ad63803079ec6aae33647546a3`; prior exact runtime/config/edge readbacks are retained, not rerun. Data, credentials, prices, session protections, workers, manual release and FanPass remain unchanged.

## Fresh acceptance completed on November14

- The existing protected password was successfully read after the earlier absent-popup report. No password reset, plaintext credential file or security change. The temporary system clipboard and credential memory were cleared after use.
- Production Web: signed-out entry → current consent → real hosted email/password login → Rillora App Review → original matter/detail/account/plan reads. Reload and return retain the same account and original matter.
- Native: the prepared independent M3 iPad simulator uses frozen18 Release source and all14 Rillora configuration values match the original archive. Real hosted authentication and current consent returned to the production API, established a new session, and loaded the same original matter/detail/account. After stopping and relaunching the process, the original map and account read succeeded without signing in again.
- Early tool input failures and one system authentication-window network interruption are retained. Correctly routed input and a new normal transaction succeeded; no session injection or TLS/identity bypass was used.
- Device Hub's original device view, window mode and keyboard capture were restored; only the dedicated simulator was shut down with its install retained. Tool defaults were cleared. No physical phone data/account changes, purchase, restore, deployment, upload, TestFlight or resubmission occurred in this continuation.

## Evidence and limits

[Fresh acceptance receipt and actual images](../collaboration/verification/review-login-20261114/fresh-login-acceptance.json) supersede the earlier pending verification-status.json for current status; that earlier timestamped receipt remains historical. QA: `output/qa/rillora-review-login-20261114/fresh-acceptance/`. Source implementation and prior tests are inherited from e61ebc6f44d68871cb17bf6096b4d54686981de7; this continuation changes documentation and evidence only.

Native acceptance is iPadOS27.0 Simulator, not a physical27.2.1 iPad or the App Store-signed binary running on hardware. The native plan page showed catalog price but no new-purchase quote; no purchase acceptance is claimed from it. Web correctly blocks new purchases for the dedicated review identity. Original device purchase/restore/signed-expiry evidence remains dated. No natural30-day duration, universal reliability or Apple approval is claimed.

Existing reviewer eligibility remains the previously verified December4 deadline with independent cloud monitoring; it was not renewed in this continuation. The deleted local maintenance automation is not recreated or treated as active evidence. Before a materially later submission, refresh only time-sensitive provider/reviewer state; do not repeat passed purchases, deployment or unchanged app tests.

## Single next step

Use the prepared [Apple response draft](../collaboration/verification/review-login-20261114/apple-response-draft.md) and exact18 evidence for the next review action. This continuation completes the failed login gate and saves the result; it does not send the draft, resubmit, distribute TestFlight or release the app. Preserve manual release. Any further identity/session change invalidates the affected fresh-login evidence and requires the full flow again.
