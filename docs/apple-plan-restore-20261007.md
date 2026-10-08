# Native plan display and restore correction — October7

Role: focused correction after actual build9 acceptance failed
Status: FIXED SOURCE AND11DISTRIBUTED; DIRECT INSTALL VERIFIED; OWNER ACCEPTANCE PENDING
Last updated:2026-10-08 (Asia/Hong_Kong)

## Actual build9 result and why work changed

Owner restored Apple login. Build9 (83b4ebcc-fa48-452b-8d51-532589614183) had processed to
Ready to Submit. Bilingual notes and the original Rillora Owner QA group/one tester
were saved and reloaded. The unsubmitted App Store1.0draft now selects9 and retains
manual release. Owner explicitly chose direct phone operation for this turn and
confirmed TestFlight1.0(9) opens with the original matters.

Owner then reported that the paid benefits/price still did not appear and Restore again
opened App Store Settings. That is a failed physical plan/restore acceptance, even though
upload, distribution and original-data access succeeded. No new purchase was attempted.

Read-only server inspection after the actual AWS session was restored confirms the original
HKG/HKD888 signed Sandbox receipt, active subscription through2026-10-07T14:25:09Z and a new
applied CLIENT_SIGNED_TRANSACTION at2026-10-07T01:42:24.546Z. It exported no private content
or financial identifiers and changed no database rows. The old AUD quote remains canceled.

## Confirmed defects and correction

- PlanAccessView selected the legacy page whenever a subscription existed or a quote
  was unavailable. ApplePurchaseSection also hid its whole benefits/price card for any
  subscription. The previous preview rendered only that isolated section with nil
  subscription, so it missed the actual owner state.
- The Apple plan flow now always renders the same Family card. Benefits stay visible;
  a current Apple catalog price has its explicit currency. The read-only catalog is
  independent of eligibility to create a new purchase. Missing/mismatched server quotes
  cannot enable the Subscribe button or prepare an order.
- An existing Apple subscription keeps the benefits and current catalog price and uses
  Manage Apple subscription as its primary action. It does not invite a duplicate order.
  A new subscriber gets one Subscribe button, nearby renewal/policy text and secondary
  Restore. The native Apple flow no longer falls back to legacy roadmap/closed-billing
  disclosures. Other diagnostic/legacy flows retain their existing behavior.
- Explicit Restore first reads verified StoreKit history. If a matching owned purchase
  already exists, it goes directly through the unchanged authoritative server verification
  and finish authorization. Only missing owned history requires AppStore.sync. The existing
  verified AppTransaction environment, account/product/group checks and server ledger remain
  required; no environment guessing, local entitlement grant or new financial policy.
- Quote request generations prevent a late catalog response replacing a newer price.
  Account-switch guards remain. Partial history cannot overwrite its warning with a
  misleading full-success message. Restore retains the native Form row button behavior.

[Apple's sync documentation](https://developer.apple.com/documentation/storekit/appstore/sync())
explains that normal StoreKit history is maintained automatically and explicit sync can
prompt for App Store authentication. This correction avoids unnecessary sync; it does not
promise to suppress a system authentication step when history is genuinely missing.

## Evidence and boundaries

An added owned-history test fails against the old code because it invokes sync. The fixed
source passes44focused coordinator/client/store tests with0failures and1existing StoreKit
platform skip.34native release/localization guards pass. Unit execution pins English;
the first red run also exposed the previous simulator Chinese locale assumption.

The preview now hosts the actual complete PlanAccessView with synthetic CommerceStore
fixtures: ready, subscribed with new-purchase quote refused, unavailable quote, missing
Apple product; all four states were rendered in English and Chinese (8screens). Benefits
stay visible; real-fixture currency remains where supplied, subscribed uses management,
and unavailable prices are not fabricated. This is local rendering evidence, not physical
StoreKit restoration. There are no new display/debug controls in the shipping app.

Build11was signed, uploaded and distributed to the original group after exact per-file checks. No API/Web/WWW redeployment, price
change, re-upload of9, real purchase, account deletion, new tester or App Review submission.
The previous cloud/runtime16, original3identity expiry (October9 04:00Hong Kong), legal
versions, Free1/Family5, WebUSD88.99/AppleUSA119.99 and FanPass stay unchanged.

QA: [build9 provider/Owner evidence](../output/qa/rillora-build9-distribution-20261007/)
and [current correction evidence](../output/qa/rillora-apple-plan-restore-20261007/).

## Final row interaction correction

After10uploaded but before any group assignment, full-page tapping found that an added
borderless style made Restore inert at the accessibility row center. Removed that style
and retained the original native Form button behavior. Both ready and subscribed complete
fixtures now respond to an actual Restore tap, display the expected stub history result
and stay in the plan view; the management link is not activated.10is held and remains
undistributed.11is the replacement candidate. This one-line view change leaves the44
coordinator/store tests unchanged; final Debug preview and Release archive are separate
checks. Original failure/UI snapshots and10artifact are retained.

## October8 direct delivery

Owner now pauses incremental TestFlight releases. The retained Release11was exported
for development,12device/signing checks pass, and it was installed over com.rillora.ios
via localNetwork. Device readback shows1.0(11)and foreground launch succeeded. No product
rebuild. Owner confirms original matters and requested page contents. A later Restore
prompt uses the separately configured QQ Sandbox Apple Account, confirmed by Owner in
Developer settings; physical restoration is still unverified. No account change or new
purchase was performed to address this development-signing difference.
[Current workflow](direct-device-iteration-20261008.md).
