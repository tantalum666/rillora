# Build18 resubmission after the login repair — 2026-11-14

Status: ALL THREE ITEMS WAITING FOR REVIEW / MANUAL RELEASE

The Owner explicitly instructed sending the prepared repair response and resubmitting the existing18 app, yearly subscription and group together. Apple shows the response at21:47 Hong Kong, with two actual native sign-in/relaunch captures. The exact sent text is `apple-response-sent.txt`; the earlier draft remains a preparation record.

Apple shows the resubmission at21:49 Hong Kong. Refresh independently confirms all three Waiting for Review; the separate version page confirms18 and manual release. No new native upload, TestFlight distribution or public release. `three-items-waiting.png` is an actual browser capture, cropped only to omit the personal account header.

Current Auth0 reads confirm the original synthetic review account is unblocked and retains its password identity without reset or extra MFA. Production remains on the verified aa5160ad API fix. Operations is enabled every15minutes, its invocation returnedok/failed0, and the existing confirmed alert receiver and14-day deadline warning remain. December4at12:00Z is the Sandbox purchase-qualification deadline, not a global login deadline; runtime islive and has no global review-login expiry.

These status checks do not replace the [earlier same-day fresh Web/native acceptance](../review-login-20261114/fresh-login-acceptance.json), which is inherited without replay. Native acceptance remains iPadOS27.0 Simulator, not a physical27.2.1 result. Original real-device purchase/restore/signed-expiry evidence is not repeated.

Raw account, credentials, authorization, page/contact data and cloud responses remain private. The deleted local maintenance task is not recreated, and no future renewal, permanent availability or Apple approval is claimed. No cloud CI, subagent, source implementation or deployment change follows. See [current submission report](../../../docs/app-review-resubmission-20261114.md) and [handoff](../../../docs/handoff.md).
