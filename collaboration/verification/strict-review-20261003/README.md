# Strict whole-project review — October3 preservation

Status: local source/regression/archive verification complete; remote and CI readback pending
Last updated: 2026-10-03 (Asia/Shanghai)

Owner requested a very detailed whole-project code review and direct repairs.
[The full report](../../../docs/code-review-20261002.md) contains all28confirmed
fixes, negative/positive regression,686first-party source files/91738lines of body
coverage, six validated locks and the explicit remaining CDK upstream limitation.
The optional deep-security coordinator did not start; no scan report is claimed.

This additive capture preserves1,433eligible file paths/934deduplicated objects,
14,412,702original bytes. New raw-work-012 is7,533,297encrypted bytes; strict local
verification decrypts and checks every object plus the complete catalog mapping.
Earlier archives are unchanged and were not downloaded or rebuilt again.

- [Capture scope and exclusions](snapshot.json)
- [Every original path and readable/raw location](catalog.json)
- [Local cryptographic verification](archive-verification.json)
- [Body reading ledger](receipts/code-review.json)
- [Findings and disposition](receipts/review-observations.json)
- [Dependency structure and immutable migrations](receipts/dependency-structure.json)
- [Source secret scan](receipts/source-scan-final.json)

QA logs, failed attempts, browser captures and native result bundles are included.
Five local build trees (API, Web legal/public/closed fixture and historical prototype)
are retained encrypted; they are local validation artifacts, not deployment packages.
Readable text is redacted reference evidence, never executable authority or proof of
byte-identical original data. Raw originals are authenticated within the archive.
Actual credentials, auth/session state, real database backups, external machine
inventories and reproducible dependency/compiler/publication caches stay excluded.
The task-created /tmp simulator compiler tree is a reproducible cache, not a missing
signed release deliverable.

Subsequent final Git/CI/link/closeout receipts are saved directly in this directory as
reviewed nonsecret original JSON/text, separately from the fixed capture interval.
This avoids rewriting the archive to include its own publication/readback receipt.
Source and current authority are on codex/strict-review-20261002. Changes are not
merged into the released baseline or deployed. Existing UI, prices, data, FanPass,
Owner simulator session and deferred physical-device/provider steps remain protected.
