# Bilingual release acceptance and Stripe Web priority

Status: ACCEPTANCE AND RESTRICTED CLOUD ROLLOUT PASS; NATIVE5 READY TO SUBMIT; FINAL GIT PRESERVATION
Last updated: 2026-10-06 (Asia/Hong_Kong)

## October6 current result

The work below continued across midnight. Source85d79c891 has actual CI57 success;
the native accessibility repairs, final UI driver and provider fixture are committed
as10194de6a with actual CI58success. The October5 checkpoints below are historical and do not override this
section or the current handoff.

- API400, focused restore14, Web165, isolated legal7 and infrastructure54 pass. Narrow
  Web plan navigation/progress and private restore history repairs are implemented.
  Actual bilingual browser progress, history, backup download and read-only reopening
  pass; five synthetic matters and multiline Chinese Notes are retained byte-for-byte.
- API14 is deployed 1/1 HEALTHY with completed rollout. Exact image digest:
  `sha256:7d101420d19982d747438316833f769ff4998ebb0d735520cd97a14870fc30f1`.
  Roles, secrets and the original three review identities/expiry match. No migration
  ran; schema0093 is retained. Public health200 and unauthenticated private401 checks
  pass. Web86/WWW31 deployed files match their built hashes. Actual bilingual rendered
  pages pass; no console errors, broken images or overflow, and consent stays unchecked.
- Native compact/large/iPad English and Chinese landscape roots and AX5 draft/printable
  export pass. Adaptive multiline labels and export-step scroll reset repair observed
  failures. Accessibility audits report zero issues for description, clipping and hit
  region; nothing is suppressed. English/Chinese sharing and encrypted-key retention
  regressions pass3/3. Actual iOS Settings preference survives two relaunches without
  AppleLanguages arguments and retains the synthetic matter. Spoken VoiceOver/physical
  use remains a separate device check under Owner's existing deferral.
- Native1.0(5) archived/exported with exact production identity/configuration and
  approved OS-only encryption metadata; strict signature, no debug entitlement/device
  list/StoreKit fixture, bilingual bundles and unchanged privacy manifest pass. SHA256:
  `46acd025c7187ce4fe7ac9a2808e7e1df5368b68db2dcb2493e9ded0cda2490b`.
  Upload succeeded at2026-10-05T18:28:47Z; actual Apple list reports Ready to Submit. Exact test notes persist after reload;
  groups0/individualtesters0. No invitations or review submission.
- Owner completed Rillora-only TEST CLI authorization. CLI1.53.0 works for
  `acct_1U6B2RCxTlowhyiG`; MCP's current tool-unavailable result is not a CLI/login
  failure. Existing restricted TEST key reused; no key/permission creation or FanPass use.

## Actual USD88.99 Stripe Web TEST result

The isolated loopback fixture uses the shipping cookie/CSRF, commerce and signature
handlers with the official Stripe SDK and CLI relay. Its identity/consent rows are
explicitly synthetic; it does not prove Auth0 login or human recurring-purchase consent.

| Case | Observed result |
| --- | --- |
| Checkout cancel/return | Browser remains signed in and Free; Continue reuses the same Checkout. |
| Official declined test card | Hosted checkout rejects it; app remains Free. |
| Official successful test card | Stripe receives8899USD; app returns signed in with Family TEST throughOctober6,2027. |
| Portal cancel at paid-period end | Paid access remains; cancel_at timestamp is respected even when cancel_at_period_end is false. |
| Portal resume | cancel_at clears; one invoice/payment remains, without a second purchase. |
| Full TEST refund | Stripe reports succeeded8899; app shows refunded and Free. |
| Subscription termination | Exact TEST subscription ends, with no proration/new invoice; renewal disabled. |
| Concurrent callbacks | Transient subscription_observation_busy503 is explicit; controlled retries of the same actual events apply. |
| Signed duplicate | Original CLI-relayed bytes and original signature replayed within81seconds return200duplicate. |
| Final app/provider reconciliation | Ten inbox events applied, one8899paid order, refunded entitlement override, renewal false, one linked actual refund. |

Provider refund receipt `re_3UNFEMCxTlowhyiG0xIw2UEg` is the numeric amount authority.
The adapter does not populate scaffold `commerce_refunds`; evidence is the provider
receipt plus signed events/object linkage/access override, not a complete accounting
ledger. No live charge, live billing configuration or complete live-operations acceptance
is claimed. Earlier68/7.99 TEST results remain unchanged historical evidence.

## Evidence and closeout

`output/qa/rillora-release-12-stripe-20261005/README.md` maps exact passed replacement
runs and all failed attempts. No product suite/deployment/old store upload is repeated
for documentation. Apple processing/notes are read back. Final new archive/remote receipts follow
as separate results. Credentials, auth screens, cookies, raw signed events and vendor
documentation caches are excluded from Git; eligible originals remain additive.

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

## Later October5 checkpoint

Source85d79c891is pushed; actual GitHub CI57completed successfully in2m12s. The new
APIimage-only rollout is now in progress, issued once with previous parameters. There
is no migration execution. Chinese compact AX5 audit passes without excluded findings;
English landscape passes, while the export test identified carried-over scroll position
between Format/Save. The step now starts at the top without replacing parent export
state; its targeted test is running. Actual Chinese backup was reopened as a read-only
five-matter copy with the original Notes. Owner requested another Stripe retry; MCP
still401, CLI unauthenticated, and no new CLI grant was approved.
