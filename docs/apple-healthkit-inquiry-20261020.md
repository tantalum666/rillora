# Apple HealthKit future-use inquiry — 2026-10-20

Status: APPLE DECLINED CONCEPT PRE-APPROVAL / NEXT-VERSION IMPLEMENTATION AUTHORIZED BY OWNER
Last updated: 2026-10-22 (Asia/Hong_Kong)

Owner's “开始吧，但是不要影响当前审核” authorizes the previously proposed next-version preparation and Apple purpose consultation. The request is separate from the existing App Review status case. No private health records, credentials, review passwords or unrelated project data are included.

Route: Apple Developer Support → Development & Technical → Other Development or Technical Questions → Email. Existing account session is valid. The existing review case is left untouched; no Fall Detection/SafetyKit application is submitted.

Subject: HealthKit permitted-use question for a future Rillora update

## Exact sent message body

Hello Apple Developer Support,

I am planning a future update to Rillora (bundle ID com.rillora.ios). This is a HealthKit permitted-use question, separate from our existing App Store submission and review-status case. Please do not amend, withdraw, or replace the current submission. The current app does not use HealthKit.

Rillora helps users organize digital-legacy information and choose who may access specific information. We are considering optional, read-only heart-rate data synced from Apple Watch to iPhone. A user would deliberately enable the feature and choose permissions. We would assess data quality and multiple circumstances before prompting the user to check in; missing measurements or nonresponse would not be labelled proof of death.

We need guidance on these distinct designs before implementation:
A. Health data is processed on-device only to support optional personal safety/welfare check-in reminders, without granting access to the user's digital-legacy information.
B. A possible later feature would combine a health-triggered check-in, nonresponse and other circumstances to execute the user's advance instructions granting selected contacts access to selected NON-health digital information. This is a conditional-access feature, not medical death certification. We understand that local processing and express consent alone may not make this use permissible.
C. Death-only access would instead require independently verified death evidence and recipient/scope checks, with no HealthKit-derived signal used as a release condition.

Under the HealthKit/Motion purpose restrictions in the Apple Developer Program License Agreement and App Review Guideline 5.1.3, is A permissible in an app with Rillora's primary purpose? Is B outside the permitted use, including where only a derived check-in/nonresponse state reaches our server? If B is excluded, can A coexist with the independent C flow, and what separation or disclosures would you require?

We currently propose reading heart rate only, no writes, clinical records, advertising, analytics use, or sharing of raw health records. No health capability or collection is enabled. We are not requesting Fall Detection or SafetyKit entitlements at this stage. Please identify any additional approval or more appropriate private review channel needed for this future feature; we understand guidance is not final App Review approval.

Thank you.

## Evidence boundary

Apple accepted the independently submitted message as case103002496561. The form contained the Subject line above, a blank line, and this body; [exact submitted field and receipt](../collaboration/verification/healthkit-prep-20261020/README.md) preserve the result.

On 2026-10-22 at 12:47 Hong Kong time, appreview_cn@apple.com replied under the subject “[103002496561] 6803957639 - Pre-review issue”. The reply says Apple does not provide concept pre-approval or guidance and will give implementation-specific feedback during review. It did not answer A/B/C individually. The actual message was read in the existing developer-account Gmail session; no repeated login, new inquiry or change to the current submission occurred.

Owner then explicitly authorized the agreed next-version reading implementation without waiting for concept pre-approval. This changes the development gate, not platform permitted-use facts, personal HealthKit consent or App Review status. Scope and current evidence are in [the preparation contract](healthkit-preparation-20261020.md).
