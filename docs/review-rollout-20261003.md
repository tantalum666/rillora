# Reviewed production rollout and native build3 — October3

Role: current execution and evidence contract for Owner-selected launch packages1and2
Status: PACKAGES1/2COMPLETE;API/WEB/WWW VERIFIED;NATIVE3READY TO SUBMIT;PUBLIC LAUNCH CLOSED
Last updated: 2026-10-03 (Asia/Shanghai)

Owner explicitly selected the repaired deployment and new native candidate. Continue
existing authorization, source/CI evidence and complete-reading baseline. Preserve UI,
full03, Web88.99/conditional Apple pricing, existing identities/data, FanPass and
physical-device/merchant deferrals. No public customer or live billing activation.

## Production rollout completed

Deployed source is1ab6316a8bfd9a168ba029155e0dd0891c423139; its application code
matches the reviewed CI47 baseline. AWS CLI actually reported expiry, then the
existing browser login renewed it; three original scoped identities were verified
without new credentials or privilege expansion. Apple browser/Xcode sessions worked.
No new Owner login, provider application or email was requested for this rollout.

The reviewed maintenance assembly changed only three immutable task images and the
API's desired count1to0. All data/network/key/secret resources and review parameters
remained identical; NoEcho identity parameters used their previous values. With0/0
API tasks confirmed, one exact migration task applied0092/0093 and checked93source
checksums. Existing91files remained identical. Eight private table counts/content
fingerprints matched before/after. Runtime login retained verified TLS and could
not assume recovery, retention or content-service roles. A bounded actual-role
retention call was rolled back; it did not clean real records as a test.

The active assembly then changed only desired0to1. API task11 is1/1HEALTHY with
rolloutCOMPLETED, image digest
`sha256:7fe1d89a7cf22c2269372b27731f2d42a3abd59ee662c74923306f4cc7db14e3`.
Runtime environment, secret references, identity digest set and review expiry remain
identical. Retention is enabled; two observed new worker heartbeats have0failures.
Ordinary customers and live Apple/Stripe remainclosed.

RilloraProductionWeb and RilloraPublicWeb changed only their asset object keys.
Actual HTTPS bytes match all86restricted Web files and30public website files.
Metadata/unknown routes remain404 and static writes403. API live/ready return200,
unauthenticated session/overview401; all API responses are no-store with no issued
cookie. The public page renders with loaded fonts, no broken images/horizontal
overflow or browser console errors. The actual account entry retains unchecked
personal consent and disabled sign-in until consent; it was not completed by Agent.

The first Web comparison selected the old closed-client output directory and found
a missing hashed file. Live HTML already matched the actual review artifact. The
correct dist-production-review manifest passed every file, with no code change or
repeated deployment. The first heartbeat parser also matched commerce metrics;
filtering the retention namespace resolved the probe error. Failed attempts remain
in QA and are not called production failures or extra successful deployments.

## New native distribution prepared and uploaded

A separate build-only Info.plist sets CFBundleVersion3; version1.0, normal source
defaults and five exact production connections remain. The account-entry build
override isYES for the same restricted server identities/expiry. No development
identity, StoreKit fixture, device install or simulator session change occurred.
The real archive and exported IPA pass eight signature/configuration/distribution
checks, with eleven privacy manifests inventoried. Exported IPA SHA256:
`4c3ae91a1e9a1c555806410f59afe968ee79e5cbbd43320938c329dda72b0b82`.

Xcode upload succeeded at2026-10-03 18:21:03Asia/Shanghai with normal distribution
eligibility (testFlightInternalTestingOnly=false). Apple processed1.0(3), build ID
60051464-b509-4fd8-aa16-f683607bc21d; it has no Internal-only tag. Test notes describing
actual changed paths and pending physical/purchase acceptance were saved. Groups and
testers remain0. No external tester distribution, beta review or App Review submission.
The first upload command failed locally because its options file was not generated;
no package was sent until the corrected options and successful upload.

## Final encryption declaration — Owner confirmed and saved

The native app calls Apple's CryptoKit AES.GCM, P256 and HPKE directly. Its dependency
inventory uses system CryptoKit/CommonCrypto/Security, and the binary links system
Security/CryptoKit; no extra cipher library implementation was found. Apple's
[documentation table](https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption)
says OS-only encryption needs no document upload in App Store Connect. This is a
submission-documentation conclusion, not a general legal export clearance.

The exact build3dialog draft selected the option excluding proprietary and non-OS
standard algorithms. Owner explicitly replied确认，提交这份声明. Agent saved that
specific declaration and navigated to the iOS build list: build3now shows准备提交
(Ready to Submit), with Missing Compliance cleared. Legacy internal build2is unchanged.
[Technical review](../output/qa/rillora-review-rollout-20261003/encryption-declaration-review.md),
[approved draft](../output/qa/rillora-review-rollout-20261003/apple-encryption-draft.jpg)
and [persisted result](../output/qa/rillora-review-rollout-20261003/apple-build3-ready.jpg).

Source Info.plist now includes ITSAppUsesNonExemptEncryption=false for future builds
on the same confirmed OS-only basis. The key is declaration metadata; encryption
code and every other plist value remain unchanged. Syntax/semantic comparison pass.
The already uploaded build3uses its saved portal declaration and was not rebuilt or
uploaded again. Reassess this metadata if cryptography or linked dependencies change.


## Evidence and boundaries

[QA](../output/qa/rillora-review-rollout-20261003/) and
[release artifacts](../output/release/rillora-review-20261003/) retain inputs,
provider readbacks, diff guards, migrations, failed attempts, checks and screenshots.
The full Apple Markdown download is an excluded reproducible third-party reference
cache; the source-linked technical analysis is preserved. Actual login URLs/tokens
stay protected and are excluded from Git and raw work archives.

API400/Web115+7/native190pass1existingStoreKitSkip/infra53 and CI47 retain their
previous dates; unchanged full suites were not rerun. Current checks are artifact,
migration, constrained-runtime, HTTP/file and rendered-page acceptance. They do not
prove a new real sign-in, consent, recipient revocation, purchase, restore, AppReview
or public release. Existing QQ outcomes, six saved store images and earlier actual
Apple TEST evidence are retained. No AWS SES reply is needed for Resend.
