# Native Chinese localization QA

Date: 2026-10-05 (Asia/Hong_Kong)
Status: STATIC CHECKS; NATIVE BUILD / RUNTIME NOT RUN

This is the native continuation of the same requested bilingual-interface workflow.
The inherited complete reading record covers all 194 project-owned Markdown files at
2cc95f77, 33,195 lines / 3,587,490 bytes. It was completed by the preceding workflow;
it is not presented as a second reading performed by this continuation. Native
implementation additionally reviewed applicable root instructions, current/locked
product and platform contracts, current handoff/decisions, native Home/layout guidance,
and the native source files it changed. See [reading record](inherited-reading-coverage.json).

161 native text blobs were materialized through authorized GitHub reads and verified
against their Git blob SHA. Existing images/fonts are retained from the base tree;
they were not downloaded or treated as a locally buildable complete checkout.

## Checks and evidence

- 9 dependency-free Python tests validate catalog coverage, both languages, glossary,
numbered argument parity, all 8 plural entries, plist/spec languages, exact native
source/resource/test target membership, OS-owned language preference and raw values
- 21 native XCTest cases were added across LocalizationTests, AccountLocalizationTests,
CoreLocalizationTests and SharingLocalizationTests. They have NOT been compiled/run. Two additional signed-out XCUITest cases
launch English/zh-Hans with existing Debug-only isolation and verify native tabs and
Language-page return without opening Settings; they also remain unrun
- Tree-sitter Swift syntax comparison and OpenStep project parsing are auxiliary static
checks only. The installed parser cannot parse five baseline Swift constructs; compare
the same files against baseline rather than calling the full tree parser-clean
- Independent review found an initial project-group/build-phase wiring mistake. It was
fixed before publication, actual parent paths/target phases rechecked, and exact group/
phase assertions added to the regression test
- Existing public Auth0 identifiers moved by added project/spec lines. Only four exact
scanner exception line numbers are refreshed; bytes/hashes/reasons remain unchanged,
with no new blanket ignore rule
- Per-area static reports: [core](core-validation.json), [account](account-validation.json),
[sharing](sharing-validation.json). The combined catalog reconciles repeated terms with
the Web glossary; these reports are focused checks, not native build results

Final [local validation](local-validation.json), [static test log](static-tests.log),
and [remote verification](remote-verification.json) are saved. Source commit c68b9d67
has all 92 changed blobs verified and all three existing CI jobs passed. The CI
checks source/API/Web/infrastructure, not Xcode or Simulator. No live service, provider, database, billing,
App Store or deployed client was changed by this source task.

## Required Mac acceptance

1. Regenerate/inspect the project with XcodeGen; verify catalog is in App and Preview,
and tests are only in RilloraTests. Build ordinary Debug and Release with the existing
signing/Keychain configuration; do not replace it with unsigned runtime evidence
2. Run the legacy complete Rillora unit/UI suite in English (`-testLanguage en
-testRegion US`): its existing assertions intentionally contain English presentation
text. Separately run the new deterministic bilingual resource tests and the two
RilloraLocalizationUITests with their per-launch language arguments, including
compiled plural resources at 0/1/2 and private values containing percent/format tokens
3. Launch separate English and zh-Hans configurations with the same existing safe QA
fixtures. Exercise signed-out Home/Matters/Profile and cancelled hosted authentication
4. Check iPhone compact/large and iPad, normal/AX5 Dynamic Type, portrait/landscape,
light/dark, Reduce Motion, VoiceOver labels, multiline buttons and sheet dismissal
5. Traverse matter/contact drafts, validation, filters/search in Chinese, save/cancel,
shared-field restrictions, invitation return, review edits, recent-auth cancellation
and explicit retry. Verify actual saved names/content and permissions are unchanged
6. Check existing plaintext/encrypted/backup reading, import/archive/deletion status
UI using already-authorized synthetic fixtures; do not delete real data or accept
new terms/purchases merely to validate translations
7. Open Language from Profile, return without change, save a draft, choose per-app
English/简体中文 in Settings, then verify system restart/persistence and existing
session/data. Confirm no appearance preference is changed

Xcode/iOS SDK/Simulator are unavailable in this Linux executor; the user's Mac was
offline at the parent check. There is no screenshot, compiled binary, StoreKit
transaction, real-user journey or App Store upload evidence for this localization.
