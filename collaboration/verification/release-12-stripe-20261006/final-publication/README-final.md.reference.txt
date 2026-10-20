# Rillora bilingual rollout and Stripe Web acceptance

Updated: 2026-10-06 (Asia/Hong_Kong). Continued across midnight; the directory keeps
its start date. Scope: Owner-selected packages1/2 and current88.99StripeWeb acceptance.

## Reading and source

`reading.json` retains the full project Markdown/engineering baseline and records
incremental focused reads. Source85d79c891 is deployed; CI57 succeeded. Current source10194de6a/CI58success covers the
native-only delta, which repairs AX5 labels/export scrolling and clarifies English export
names; UI driver coverage and an explicitly local TEST cookie fixture accompany it.
No new security/price/permission model or UI redesign was introduced.

## Local and browser evidence

- `api-tests.log`:400pass; `restore-audit-tests.log`:14pass. The latter is a subset,
  not14additional full-suite cases. Typecheck passes. Restoration adds one metadata-only
  audit event transactionally, rejects stale repeats and leaks no content to recipients.
- `web-tests.log`:165non-legal passes; the initial combined invocation also ran3legal
  checks against an internal build and failed them. `legal-tests.log` uses the correct
  isolated legal artifact:7pass. Infra54pass/typecheck; source scan29reviewed/0unreviewed.
- Actual English/Chinese My-plan3/5→4/5→5/5, next unfinished matter/status focus and
  restore-to-private event pass. Screenshots are retained. Chrome saved an actual
  3,879byte backup with5synthetic matters and unchanged Chinese multiline Notes; it
  reopens read-only. IAB download callback timeout is retained, not counted as delivery.
- `browser-final-readback.json`: final Stripe/refund UI and deployed English website/
  Account snapshots, zero warnings/errors. Earlier saved deployed Chinese screenshots
  and actual language switching verify both languages. Account consent remains unchecked.

## Native matrix and real system setting

`native-matrix-results.json` indexes every failed and passed attempt; xcresults retain
test traces, attachments and recordings. Successful unchanged cases are not rerun merely
to produce an all-green combined bundle.

| Coverage | Passing evidence |
| --- | --- |
| Compact English/Chinese public shells and Chinese landscape | compact-zh:3passes; its initialAX5failure is replaced below |
| Compact English landscape | compact-en:1pass; its initialAX5failure is replaced below |
| Compact final English AX5 draft/export/audit | compact-en-disabled-control:1/1 |
| Compact final Chinese AX5 draft/export/audit | compact-zh-current:1/1 |
| Large phone English/Chinese landscape and AX5 | large-en2/2,large-zh2/2 |
| iPad English/Chinese landscape and AX5 | ipad-en-native-tabs2/2,ipad-zh-native-tabs2/2 |
| English/Chinese sharing and encrypted recovery-key retention | localized-sharing-encrypted-regression3/3 |
| iOS per-app preference, two relaunches, saved matter retained | system-language-persistence1/1 |

These are18 distinct passing case/configuration outcomes. Failed iterations include
actual multiline Label clipping and carried Format→Save scroll offset, followed by
narrow fixes; a disabled-button hit-test assumption and iPad UITabBar assumption were
test-driver defects. Accessibility description/text-clipping/hit-region audits collect
all findings and require zero. Nothing is excluded to force a pass. The3case sharing
tool timed out, but the completed xcresult is actually Passed; it was not rerun.

The language test opens real Settings, chooses English, then relaunches twice without
AppleLanguages/AppleLocale overrides. Original saved matter ID remains readable. The
test requires an explicit disposable-simulator opt-in. No Owner device/Mac preference
changes. Labels/audits are not spoken VoiceOver/device gesture acceptance; that remains
with the previously deferred physical-device work. Prior215unit passes/1existing skip
and earlier21localization tests retain their original dated evidence, not rerun claims.

## Actual restricted cloud rollout

`runtime-after.json` proves task14,1/1HEALTHY/completed, unchanged roles/environment/
secrets/original3identities and expiry2026-10-06T17:08:57Z. Digest:
`sha256:7d101420d19982d747438316833f769ff4998ebb0d735520cd97a14870fc30f1`.
No migrations executed; floor0093retained. Live/ready200; private session/overview401
when unauthenticated, no-store/noissuedcookie. All86Web and31WWW files match built SHA256.
Reviewed neutral CDK changes preserve all other runtime fields. Wrong-selector and
literal-account/AZ synth attempts were not deployed. Public Preview target is retained.

## Actual Stripe TEST flow and boundaries

Only Rillora accountacct_1U6B2RCxTlowhyiG/TEST viaCLI1.53.0; Owner completed the scoped
device authorization. MCP tool remains unavailable. No FanPass access or new API key.
Existing restricted TEST key and official CLI listener secret stay owner-only/private.
The independent DB uses real cookie/CSRF/shipping handlers with synthetic identity and
consent rows. It does not claim actual Auth0 sign-in/human subscription consent.

Current annual Price8899USD: checkoutcancel→signed-inFree,continue→sameCheckout,
declinedofficialcard→Free,successfulofficialcard→signed-inFamily,Portalperiod-endcancel
→Familyretained,Portalresume→active,fullsucceeded8899refund→Free,subscriptionterminate
→renewaldisabled. Oneinvoice/payment/order remains. All10observed webhook inbox events
finishapplied. Concurrency503was explicitly recovered using actual immutable Stripe
events with fresh local SDK TEST signatures. Separately, original CLI-signed payload
and original signature replayed within81seconds returns200duplicate.

`stripe-original-signed-duplicate.json`, `stripe-before-refund.json`,
`stripe-full-test-refund.json`, `stripe-test-subscription-ended.json` and
`stripe-final-ledger.json` carry exact receipts. The terminate CLI returned success
with no JSON body; its parser failed, then readback confirmed cancellation. It was not
submitted twice. The initial QA expectation of a commerce_refunds row was incorrect:
this adapter stores event/object linkage and refunded entitlement override. The actual
Stripe receipt is numeric refund authority; no complete accounting-ledger claim.
Earlier68/7.99results are not repeated or presented as current-price proof.

## Signed native5

`native-build5-inputs.json` records exact app/project hashes. `distribution-build5.json`
records strict signature, correct team/app/configuration, no debug/device/enterprise/
StoreKitfixture, bilingual resources, retained approved encryption metadata and unchanged
privacy manifest. Initial verifier guessed the wrong production hostname; current
project.yml/previous contract verified the actual app.rillora.xyz/api proxy. No binary
change was needed; the failed verifier receipt is retained. IPA SHA256:
`46acd025c7187ce4fe7ac9a2808e7e1df5368b68db2dcb2493e9ded0cda2490b`.
Archive/export/upload succeeded once. Apple processing is complete: Ready to Submit, exact notes saved/reloaded, groups0
and individualtesters0 (`apple-build5-readback.json`). No tester invite/App Review.

## Documentation, preservation and remaining work

Focused contracts updated: release12, Web/native localization, production commerce,
release readiness. Decision log records scoped CLI authorization; journey adds actual
attempts/judgment/results. Handoff retains one next step. Only task fixtures/listener and3createdsimulators were stopped/removed; other simulators
and Owner accounts remain, synthetic cookies revoked. All failed attempts and new
eligible build/QA originals are to be sealed additively; final Git/remote receipts are
separate from the frozen archive. Actual keys/cookies/raw signed events/authentication
screens/vendor caches are excluded even from encrypted Git archives.

Still separate: actual physical installation/VoiceOver/Apple purchase/restore, retained
account deletion, truthful merchant/tax/market facts and live billing, final personal
store declarations/review, then customer cutover. Owner deferrals are unchanged. API14,
TEST payment and native upload do not imply ordinary customers or live sales are open.

Final receipt: `closeout.json` and the directly tracked collaboration addendum record
CI58/59, actual Apple5readback, cleanup and fresh remote archive verification. The frozen
archive retains the earlier capture; these post-capture receipts are separate versions.
