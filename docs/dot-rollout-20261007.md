# October7 Dot integration rollout

Role: focused deployment and release evidence
Status: HISTORICAL ROLLOUT VERIFIED; LATER NATIVE DELIVERY USES DIRECT DEVICE ITERATION
Last updated: 2026-10-08 (Asia/Hong_Kong)

Owner asked “开始部署和下一步”. This continues the existing full-read baseline and
[reviewed PR1 integration](dot-integration-20261007.md). Source is
`58fadf35781fb165afe0920be3b6c213480089ed`; the application tree is the validated
`5a547339a689fadd4f2241d4d17d2e2756931be2` tree. No new product implementation was
needed. Existing tests/CI73 are retained; they were not rerun or re-labelled as
this deployment's tests.

The Apple-login and native9pending statements below describe this dated checkpoint.
They were resolved before the later native correction. Current delivery and the sole
next gate are in[direct iteration](direct-device-iteration-20261008.md)and[handoff](handoff.md).

## Deployment and actual checks

- Production image rollout completed as task15. CloudFormation changed only the
  Migration/Recovery/API task image references. No migration task was run for schema
  changes; schema0093 remains the retained floor. Roles, secrets, network and sales
  policy were preserved. A separate expiry-only rollout is recorded below.
- Restricted production Web, public WWW and the Preview frontend were deployed.
  Live SHA256 readback matched all86/31/86files respectively. WWW routes preserve
  `langHint=zh-CN` and underscore provider IDs while dropping unknown query values.
- The Preview link deliberately remains `app.staging.rillora.xyz`. Its frontend
  asset alone changed; its API/database/configuration were not replaced with current
  production infrastructure. The first preparation attempt omitted the template
  publishing asset and stopped before a stack update. The corrected assembly kept
  that template asset and only the frontend ZIP; the retry completed.
- Production live/ready endpoints return200. Anonymous session/overview/new account
  identity endpoints return401, `Cache-Control: no-store`, without cookies. Browser
  readback confirms the Chinese WWW→Preview account journey. No real account's
  consent, data, password, purchase or deletion was changed by these checks. After the
  runtime expiry update, the formal Web account entrance again presents the existing
  unchecked consent and login flow; no new consent was submitted.

## Bounded review continuation

The previous expiry,2026-10-06T17:08:57Z, had passed. Under Owner's deployment/next-step
instruction and retained default authorization, Agent announced and selected a
bounded renewal to2026-10-08T20:00:00Z (October9 04:00Hong Kong). This keeps exactly
the same three identities and original production clients. It is not a release or
ordinary-customer access decision.

Auth0 CLI explicitly reported session expiry; the existing browser session restored
the same CLI scopes without new user credentials or permissions. Only the existing
Action's expiry literal changed, deployed code and unchanged bindings were read back.
The existing Owner QA planner's Sandbox enrollment alone was updated to the same
expiry; no enrollment was inserted, current genuine consent was retained, and no
order/entitlement was created. Apple key/allowed storefronts and all price rows are
unchanged. CFN updates only the existing expiry parameter, using the previous template.
Runtime16 is UPDATE_COMPLETE with one HEALTHY task and a COMPLETED rollout. Its image is
`sha256:c43336c743d5ecc0cdd24d92b13ca46dd6db2eb47f918b075f91a19bf919fb43`.
Readback against task14 proves that only image and expiry differ; roles, secret references,
network and all other runtime environment values match. Protected operational expiry
metadata was synchronized after all three layers passed. No Apple secret update was
needed because its schema has no review-expiry field.

## iOS9 and remaining gates

1.0(9) was archived and exported from the current source, with the new reviewed
password-reset connection key. All14artifact checks pass, including strict signature,
team/bundle/version, non-debuggable App Store distribution, no StoreKit fixture,
retained production connection values, bilingual resources, unchanged privacy and
Owner-confirmed OS-only encryption metadata. IPA SHA256:
`9323253ef3d87ee0ac7195f431f49285551a80eb3546a57269f926a89a125e59`.
Apple upload succeeded at2026-10-06T19:57:49Z. Upload does not establish completed
processing, internal distribution, selection in the App Store draft or installation.
The App Store Connect detail actually returnedauthResult=FAILED and is waiting for
Owner's password/MFA. Bilingual TestFlight notes are prepared. Existingbuild8 remains
the last verified distributed/draft build until new readback proves otherwise.

After Apple login, distribute9only to the original internal group/tester, update the
unsubmitted manual-release draft, then check the installed new build and restore the
already-signed HKD888 Sandbox purchase without buying again. WebUSD88.99/AppleUSA119.99,
Free1/Family5, retained data and FanPass remain unchanged. Stripe merchant facts/tax
assessment, Live runtime/webhook/catalog activation and real Live payment lifecycle,
App Review submission and public access remain separate unfinished gates. External
TestFlight invitations and the independent account deletion retain Owner's deferral.

QA: [current records](../output/qa/rillora-dot-rollout-20261007/README.md).

## Complete-work publication

[Archive22and receipts](../collaboration/verification/dot-rollout-20261007/README.md)
preserve387eligible paths/274objects,55,533,496encrypted bytes. Local and independently
fetched GitHub originals pass authenticated decryption, hashes and exact catalog mapping
at7d4189371. All readable-manifest paths are tracked; no credential/authentication
material is archived and no scanner exception was added. Final post-capture receipts
are directly preserved rather than rebuilding the immutable archive.
