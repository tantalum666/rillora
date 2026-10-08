# Rillora direct device iteration

Role: current native delivery workflow and evidence boundary
Status: WIRELESS INSTALL AND OWNER CONTENT CONFIRMED; DISTINCT SANDBOX ACCOUNT EXPLAINS RESTORE PROMPT
Last updated: 2026-10-08 (Asia/Hong_Kong)

Owner asks to continue fixing issues but stop making a TestFlight release for each small
change, and install directly on the existing iPhone. Owner asks about wireless installation,
then clarifies that either cable or wireless is acceptable; use whichever is convenient
and reliable. This supersedes the prior per-fix TestFlight distribution next step.

Use the paired iPhone16ProMax over an available wired or localNetwork connection. Developer Mode
is already enabled. Do not change phone accounts, clear app data, uninstall Rillora,
modify FanPass or broaden ordinary customer/billing access. User continues to operate the
physical UI; do not resume iPhone Mirroring without a later instruction.

## Prepared direct artifact

Current source is c0cec8680c613c3f6889f800754818fddf901031. Reuse its already-verified
Release11archive and export locally with Xcode's debugging method. This preserves the
compiled binary UUID, bundle/version, production connections and keychain configuration;
it avoids another implementation rebuild or App Store upload. The installed development
identity/profile is valid and includes the exact paired phone. All12direct signing and
configuration checks pass. No device identifier or private signing material is published.

The original localNetwork pairing reconnected wirelessly. The first app-info request
disconnected immediately; in-place installation then completed at2026-10-08T00:45:00Z.
Device readback returned com.rillora.ios/1.0/build11, and foreground launch completed
at00:50:29Z. No cable, uninstall, account change, implementation rebuild or TestFlight
operation was used. Owner subsequently replied that original matters and the requested page contents are
present. This records user confirmation separately from the install command. No exact
current amount/currency, new purchase or successful Apple restoration was reported.

## Retained October7 state

Build9was processed, distributed to the existing internal group/one tester and selected
in the unsubmitted manual-release draft. Owner installed9and saw original matters, but
rejected its plan/restore UI. The correction is in[the focused contract](apple-plan-restore-20261007.md).
Build10was uploaded and deliberately not distributed after a local button-hit issue.
Build11passed14distribution checks, uploaded at2026-10-07T02:58:55Z, processed Ready to Submit,
and its notes/original internal group1were saved and reloaded. No physical11result was
confirmed. Updating the store draft from9to11was not completed before this change of
instruction; leave it alone during direct iteration.

The44focused native tests/1existing StoreKit skip,34native guards,8bilingual complete-page
renders and final ready/subscribed Restore row taps retain their original dates. Direct
signing/installation does not establish Apple StoreKit restoration or final store readiness.
The code still requires verified Apple environment, owner/product/group binding and
server authorization; do not add a fake purchase path for development convenience.

Production remains API16/schema0093, original three review identities until
2026-10-08T20:00:00Z (October9 04:00Hong Kong). Prices, Family rights and real data are retained.
Current physical purchase/access state must be read independently; the October7active
Sandbox receipt is dated evidence, not a claim of today's subscription state.

QA: [direct installation records](../output/qa/rillora-direct-device-20261008/).

## Apple account prompt after direct installation

Owner reports that Media & Purchases and TestFlight use the original Gmail Apple account,
but Restore asks for the QQ Apple account. Owner then checks Settings > Developer >
Sandbox Apple Account and confirms that it displays QQ. This confirms the separate
sandbox account, rather than a Rillora sign-in email being passed to Apple.

[Apple's sandbox documentation](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox)
distinguishes development-signed apps from TestFlight apps: a development install uses
the Sandbox Apple Account without requiring sign-out from the normal Apple account.
The locally exported build11is development-signed even while the TestFlight app remains
signed in to the original account. That delivery change should have been explained when
installing. The normal Apple account, Rillora login and standalone sandbox identity are
different records; receipt verification cannot infer an Apple-account email.

Source inspection finds no supplied email in the StoreKit calls. Explicit Restore may
call AppTransaction.refresh when app-environment evidence is missing, or AppStore.sync
when owned history is missing. Both are Apple-controlled authentication paths; this turn
does not capture which of the two produced the observed sheet. No implementation bypass,
phone account switch, purchase-history deletion or repeat purchase is appropriate merely
to make the prompt disappear. Keep direct UI iteration; record any future restoration
against the actual purchasing account and installation channel. Existing TestFlight
purchase evidence cannot establish restoration under a different sandbox account.

## Complete-work preservation

[Archive23](../collaboration/verification/direct-device-20261008/README.md)adds4,208paths/507objects
and157,419,068encrypted bytes; local decryption verifies them. Earlier archives stay
immutable. Publication and fresh-remote verification follow as separate receipts.
