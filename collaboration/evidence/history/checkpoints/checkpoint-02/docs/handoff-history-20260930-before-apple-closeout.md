# HISTORICAL — Handoff before Apple release increment

Superseded by [current handoff](handoff.md). Captured2026-09-30.
Do not treat its next step or provider observations as current.

# Rillora Current Handoff

Status: FINAL LAUNCH GOAL ACTIVE; UI/UX AUDIT CLOSED; REPAIRS PUBLISHED; CI29 SUCCEEDED
Last updated: 2026-09-29 (Asia/Hong_Kong)

## Authority and recovery

Owner requests continuous work to launch readiness, with maintainable code. The
latest completed product scope is app-wide native appearance plus explicit Web
System/Light/Dark and a careful full UI/UX audit. Preserve established layout,
Legacy Imprint03, Free1/Family5, WebUS$88.99annual-only new sales, Apple channel
differentiation, historical receipts, real user data and FanPass.

147project-owned Markdown files/25,917lines were fully read in this ongoing
workflow. [Manifest/ranges](../output/qa/rillora-launch-goal-20260926/full-read.json).
Use focused recovery after compaction; do not restart the full read, tests or MFA.

## Completed this round

Native Home/Profile/Matters/details/sheets share one migrated appearance preference
and adaptive colors. Web uses the existing shared store/chooser and a hashed
pre-paint script. WWW entry links carry only a strict display enum to the owned
App origin. Profile exposes the control; neither client needs a Home detour.

Ten observed issues are repaired: forced-dark navigation, lost Web draft recovery,
opaque folio art, unlabeled export audience, disabled guide feedback, white provider
marks on light plates, scrolling-away dialog close, undersized refresh, technical
review network errors and11px account agreement. No new commercial feature or
permission policy is introduced. [Audit, coverage and current evidence](ui-ux-audit-20260929.md).

Web107checks plus7legal-artifact checks pass; native3appearance unit cases,
1navigation/restart case,2normal route cases and1AX5/reduced-motion case pass.
The old large-text matrix first failed due to its different QA identity setup;
the explicit isolated audit case passes. Preserve both results. No new full native
or local API suite is claimed; CI runs are recorded separately.

Actual A/B synthetic UI verifies invite→accept→scoped visibility→name-only→revoke→
old-link rejection. A separate synthetic Family capability verifies request→B
check→A finish/history. Backup imports10private records into empty D; personal
and encrypted directions open with9items, excluding Never disclose. Offline save
retains the draft and retry succeeds. These do not prove real provider login,
mail, billing or an estate request.

## Installed and published

Ordinary signed Debug is installed on Rillora-Matrix-17-Pro/iOS26.5 and left at
Profile with System appearance. Binary and asset hashes match; no test identity,
local API, large-text or motion override remains in the process. The existing
staging API endpoint and Keychain are retained.
[Actual install/config](../output/qa/rillora-ui-ux-audit-20260929/simulator-final.json).

Preview https://app.staging.rillora.xyz has the new immutable Web assets/index.
The update is front-end only; retained old assets allow existing tabs/rollback.
WWW https://www.rillora.xyz has the matching chooser/entry-handoff update; reviewed
CDK diff changes only static content. Online HTML/entry/bootstrap match artifacts.
LegalSites10succeeded from8a884b58882c721f536afe0c82f013f786f7e656; public audience,
accepted legal bodies/versions/digest remain unchanged. The dated appearance
supplement now includes the web app, with actual live Privacy readback.

Engineering eadefd435841bce6103cff6a0cd4c6c4b0d4e8b9 is pushed.
[CI29](https://github.com/tantalum666/rillora/actions/runs/36566846971) succeeds for that exact commit
(source, API, Web and infrastructure jobs).
Source scan:25reviewed non-secret matches,0unreviewed. Final documentation and
link validation (161Markdown files/1583local links,0missing) are recorded in[this QA](../output/qa/rillora-ui-ux-audit-20260929/work-state.json).

## Preserved release gates and external state

The overall release goal is incomplete. Production customer App remains closed;
this UI work does not upload or submit TestFlight/App Store or open paid sales.
Owner-deferred business facts and physical devices remain separate.

Staging API38/migration31/schema0075 and production API task1/schema0070 retain
the earlier handoff checkpoint. This round deploys no API/database changes;
0076–0085remain pending. The closed production client builds, but is not republished.
Apple fee/channel price, quote/transaction binding, actual purchase/restore,
production identity/mail, recovery reconciliation and signing/review are still
separate gates. Prior170native/300API results belong to the earlier release work.

AWS expired during publication; Owner completed authentication and STS confirmed
133857166372/rillora-operator. Reuse until actual expiry; do not request MFA again
speculatively. The Sites local plugin files were still unavailable; its native
connector plus the existing source checkout and ephemeral credential bridge
provided exact-source build/push/version/deploy with no permission expansion.

SES reconsideration on originalcase179022088800001 received a further refusal on
September29 at16:10+08. The actual Gmail reply cites sender reputation/deliverability
but no specific defect or remediation. Fresh22:01+08API read shows HEALTHY/sending
on, production=false/DENIED,200/day,1/second,0sent last24h;14configuration checks
pass and only production access is blocked. Owner then authorized sending the prepared clarification; it is submitted once
at22:31:40+08 in the original Support case, now Reopened, with exact text readback.
Post-send SES production remainsfalse/DENIED. Await the substantive reply without
duplicating the message; no service/credential change occurred. Prefer SES/Auth0;
no fallback switch is adopted. [Mail evidence](production-identity-mail-20260924.md).

## Latest launch-gap review

September29 22:44+08local preflight still has seven engineering/release gaps plus
two Owner-deferred facts, with no final distribution artifact supplied. Existing
native5/5connections/icon and all completed UI/runtime foundations remain counted.
The register now links the actual September29 mail refusal/clarification and current
public/UI evidence; no gate status or required flag was relaxed. Apple/TestFlight
Sandbox verification, real payment, identity/mail, final rollout, ongoing retention/
reconciliation, security acceptance and signed submission remain. [Current inventory](release-readiness.md).

## Single next step

Complete the safe Apple review/TestFlight transaction path and actual fee/channel
price binding, progressing toward a signed TestFlight candidate with real purchase/
restore evidence. Independent retention/reconciliation and final submission preparation
can proceed while SES answers the already-sent clarification. Follow[release readiness](release-readiness.md)
and[Apple preparation](production-apple-20260926.md); Owner-deferred facts remain separate.

[Previous handoff — HISTORICAL](handoff-history-20260929-before-ui-ux-closeout.md).
