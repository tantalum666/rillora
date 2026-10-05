# Bilingual release acceptance and Stripe Web priority

Status: IN PROGRESS
Last updated: 2026-10-05 (Asia/Hong_Kong)

Owner explicitly requests completion of the current launch packages1and2,then prioritizes
Stripe/Web acceptance over Apple physical-device transactions. Keep WebUSD88.99annual,
Free1/Family5,existing UI/brand/data andFanPass. Do not interpret this as resuming deleted
QA-account cleanup,physicalphoneuse,merchant fact invention or public/live activation.

## Current scope

1. Complete remaining localized client journeys and representative compact/large/iPad,
large-text/orientation/accessibility/system-language checks. Reproduce/fix consequential
remaining Dot findings,not new decorative features.
2. Build/review/deploy matching restricted Web/WWW and new signed iOS candidate; retain
old artifacts and completed declarations. New observed API fixes need their own reviewed
image update,not a repeat of applied0093migrations.
3. Verify current annual88.99StripeWebpath end-to-end,including browser session/consent,
provider checkout/return,signature/webhook/entitlement,management/cancel/refund/idempotency
and failure recovery. TEST provider results and real live charges remain distinct.

## Existing Stripe proof and gap

September17used the isolated Rillora account with actual hosted TEST68annual/7.99monthly
checkout,portal cancel/resume,termination/refund/duplicate-event checks. It used synthetic
bearer actors;browser return was signed out. It does not prove current88.99or a signed-in
Web purchase UI. September26created the immutable88.99TESTPrice and v4mapping,without a
new hosted payment. Retain both records and test only the current gap.

## Access observed this continuation

AWS rillora-cdk-session currently resolves the existing Rillora operator. No MFA requested.
Stripe MCP returnedUNAUTHORIZED/re-authentication;CLI rillora has no key;CLI docs returned401.
An async request asks Owner to reconnect the existing Rillora plugin,notFanPass. Independent
packages1/2continue. No key,token,real card or new security grant is placed in chat/QA.

## Findings being addressed

- UX-01:Web openNextMatter falls back to the first already-completed matter;progress goal
and next-action target need explicit truthful explanation.
- OBS-01:restoring an archived matter clears sharing but emits no activity event. Add a
metadata-only event within the existing transaction and verify isolation/stale retries.

Evidence:output/qa/rillora-release-12-stripe-20261005. Current result/status is updated as
actions complete;this initial plan is not verification,deployment,payment or store proof.

## October 5 acceptance checkpoint — still in progress

- Web My plan now names the unfinished matter, focuses Preparation status, explains the
  five-matter organizing goal, and moves to creation/list when no unfinished record remains.
  Actual bilingual browser writes changed 3/5 to 4/5 to 5/5 and advanced the action correctly.
- Archived matter restoration now writes a metadata-only `matter.restored` audit entry in
  the same transaction. The private-draft event is visible in English and Chinese. Sharing
  remains cleared; repeated stale restore and recipient isolation are regression-tested.
- English export entry labels now say what they do, including native Profile. Public
  artifact v4 declares both existing appearance and language preferences; the infrastructure
  guard accepts only those exact two keys without cookies or tracking. Legacy v3 remains
  readable for rollback. No preference behavior or permission scope was added.
- API typecheck and all 400 tests pass, including the extended 14-case restore suite.
  Web 165 non-legal checks pass; a combined invocation also ran three legal-packaging
  checks against the wrong internal build, then the correct isolated legal build passed
  all 7. Infra typecheck and 54 tests pass. Source scan reports zero unreviewed findings.
- Actual Chrome Chinese backup download is 3,879 bytes with five synthetic matters and
  unchanged multiline Chinese Notes. The IAB download callback timed out and is not
  counted as a successful file delivery. No real account backup or deletion was performed.
- Compact native English/Chinese shells and Chinese authenticated landscape roots pass.
  The AX5 flow reaches real local printable generation; system accessibility audit found
  two multiline Label issues. Narrow intrinsic-title/adaptive-information fixes are being
  verified. Wider device/language/sharing and system-language acceptance are still pending.
- Cloud readback confirms all four existing stacks UPDATE_COMPLETE. Production synthesis
  with environment-neutral account/AZ tokens has exactly three image changes. No deployment
  or migration has run. The first wrong context selector produced no selected stack; a
  profile-bound synthesis had unwanted literal account/AZ differences and was not deployed.
- Stripe plugin remains UNAUTHORIZED after Owner reconnect and requested retry. Plugin
  Management confirms installed/enabled, which is not OAuth success. Actual browser is
  authenticated to Rillora TEST. CLI 1.53.0 has no Rillora credential; its separate device
  permission was prepared but not approved. No new transaction/provider configuration.

Artifacts: `output/qa/rillora-release-12-stripe-20261005/`. Existing true production/user
results remain at their earlier checkpoints; these new results are local/synthetic unless
explicitly identified as a cloud readback.
