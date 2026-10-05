# Rillora Current Handoff

Status: NATIVE CHINESE SOURCE IMPLEMENTED; STATIC VALIDATION; XCODE ACCEPTANCE PENDING
Last updated: 2026-10-05 (Asia/Hong_Kong)

## Current task

Owner clarified that the requested Chinese interface includes native iOS, not only
Web. Implement maintainable English / Simplified Chinese on the real SwiftUI app
and push isolated codex/chinese-ios-20261005 from verified 2cc95f77. The separate
Web branch is not overwritten or merged. [Native contract](native-localization-20261005.md).

## Completed and evidence

- 1,058 paired String Catalog entries, 8 native plural entries; core navigation,
forms, sharing, exports/recovery, account/billing UI, errors and accessibility text
- Profile language entry uses standard iOS per-app settings and system persistence;
no Bundle override/view identity reset. App and Preview catalog wiring and four new
native test files are recorded in the committed project and XcodeGen specification
- Static catalog/source/target/placeholder checks; 21 added native XCTest cases remain
unrun. [QA](qa/chinese-ios-20261005/README.md) keeps local, remote and native evidence separate
- User data, shared-field permissions, machine enums, legal acceptance, actual prices,
crypto and file formats remain intact. No production/provider/store action occurred

## Boundaries and blocker

Linux has no Swift compiler, Xcode SDK or Simulator; the Mac was offline when checked.
This is source implementation, not a compiled or installed Chinese app. Actual UI,
Dynamic Type/VoiceOver, OS language-switch persistence and end-to-end native regression
need Mac acceptance. Native source CI does not replace that gate.

Hosted sign-in/mail, official guide bodies, legal text and server-generated files
retain their disclosed language boundaries. No merge, deployment or store upload.
The prior disposable Web acceptance and temporary restricted runtime were not changed
or rechecked; retain the [dated handoff](handoff-history-20261005-before-chinese-ios.md)
and its original owner-confirmation dependency. Localization does not close it.

## Single next step

When the Mac is connected, run the documented Debug/Release/unit/UI Chinese-English
acceptance matrix on this branch, preserving existing data and authentication. Then
separately review consolidation with the Web branch and any publication/deployment.
