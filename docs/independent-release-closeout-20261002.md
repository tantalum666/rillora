# Independent release preparation — October2

Role: current independent-work completion and remaining dependency boundary
Status: INTERNAL TESTFLIGHT BUILD UPLOADED; STORE IMAGES SAVED; PERSONAL ACCEPTANCE AND DECLARATIONS OPEN
Last updated: 2026-10-02 (Asia/Shanghai)

Owner asks to finish everything that does not require their participation. This
continues the existing full-read release workflow and supersedes waiting for the
simulator's unchecked Account terms as the only executable task. Keep that genuine
consent step parked. Preserve physical-device/merchant deferrals, UI, full03,
Free1/Family5, Web88.99, conditional Apple prices, real records and FanPass.

## Completed independently

The existing Apple browser and Xcode credentials both worked. No new login, key,
permission or account was requested. The active native source is unchanged from
the retained tested implementation. A separate Release archive uses an explicit
Info.plist copy with only CFBundleVersion changed to2, and the existing
RILLORA_CUSTOMER_ACCESS_ENABLED=YES build override. Ordinary Release defaults stay
closed; the same server allowlist and2026-10-06T17:08:57Z expiry remain authoritative.

The App Store distribution export is1.0(2), strictly signed, non-debuggable, uses
all five exact production connections, and contains neither a development planner
nor a StoreKit fixture. Eight artifact checks pass; eleven SDK/app privacy manifests
are inventoried. Local IPA SHA256:
`14a766690eb5dbbfdce2b0c36495a5ad96dec9499177b2bfdcb3560bc8d776fe`.
This is the local export hash, not an independently supplied Apple package digest.

Xcode uploaded this archive with testFlightInternalTestingOnly=true. Upload succeeded
at19:40:48+08. Apple finished processing and lists build2 as **Internal / Missing
Compliance**, build ID da5948b7-1215-4c05-8dfb-042df26f0e93. The actual encryption
questionnaire was inspected, then cancelled without an answer. This build cannot
be used for external TestFlight or App Store distribution. A later submission build
needs a new build number after the remaining acceptance and declaration gates;
do not rebuild or re-upload2 simply because another chat resumes.

The four existing6.9inch iPhone designs and two13inch iPad designs are saved in the
English App Store1.0 draft. Upload completion initially placed iPhone3 before2;
the supported keyboard ordering control restored1/2/3/4. Reload/navigation readback
confirms4/10 and2/10 with the intended filenames/order. Smaller iPhone classes use
Apple's6.9inch fallback. No image redesign or source-screen modification occurred.

The existing public listing fields already match config/app-store-listing.en-US.json;
they were read, not needlessly rewritten. TestFlight's English description, existing
public support email, marketing URL and privacy URL were saved and read back. No
tester invitation, external distribution, final declaration, App Review submission
or public release occurred.

## Remaining work and actual dependency

| Work | What is complete | What must happen before the remainder |
| --- | --- | --- |
| Account/mail/shared access | Deployment, real A/B sign-in, native cross-platform read, QQ receipt, password reset/new login and Directions field filtering | Planner's current genuine consent/authentication, then remaining scope/revoke/export/delete/recent-auth journeys; use a deliberately disposable account for deletion |
| Apple purchase | Review runtime/catalog/enrollment, strict verification, official TEST delivery, development build and uploaded internal distribution build | Final export-compliance determination; Owner resumes deferred physical-device/Apple test interaction; then actual purchase/restore/lifecycle and recovery reconciliation |
| Store submission | Six designed images saved; public listing and beta basics prepared; artifact/SDK/privacy/age/encryption worksheets | Truthful contact/market/privacy/age/encryption declarations, usable reviewer identity, accepted transaction/device results, final channel price and a submission build |
| Live billing | Existing implementation and historical test evidence retained | Owner-deferred merchant/tax/market facts, live provider onboarding, effective Apple fee/final price, then genuine payment lifecycle |
| General customer cutover | Isolated production, existing recovery/retention/monitoring and current code repairs deployed | Upstream acceptance, bounded retirement of exact Preview identity powers, actual86400-second token lifetime plus skew and negative checks before opening customers |
| QQ external images | Correct sent HTML, source PNG bytes, all three HTTP200 responses and rendering in Resend preview | Actual QQ client/network/image-loading evidence; no receiving-client fix is inferred from the sender preview |

The operations gate retains its14public targets, worker/retention alarms and dated
delivery/silence evidence. The Resend dashboard/failure-event receipts remain a
separate mail operating boundary; SES alarms do not monitor Resend. Future roadmap
automations are not silently promoted to new launch requirements or claimed deployed.
No further SES application or reply wait is required for the selected sender.

## Verification, preservation and next step

The preflight run against the new exported app reports no native-artifact blockers.
All12gate classifications remain:2verified and10open/in-progress/deferred. The
register is not a percentage-complete measure, and the ten entries share the
dependencies above. Product tests/CI44 and API10 deployment keep their original
dates; no unchanged product suite or cloud deployment was repeated.

The QA directory records build inputs, signature/configuration checks, upload log,
Apple readback, safe screenshots, continuation reading, documentation reconciliation
and Git preservation. [Git-readable results](../collaboration/verification/independent-release-20261002/README.md)
and the [release package](../output/release/rillora-review-20261002/README.md) distinguish
local export, upload, Apple processing and actual end-user success.
Use [handoff](handoff.md) for the sole next step; do not restart completed work or
ask for a new login without actual failure.
