# Publication verification

Last updated: 2026-10-11 (Asia/Hong_Kong)

[October11 security remediation](security-remediation-20261011/README.md) is the
current additive source/QA preservation record. Its archive31does not replace or
rebuild the earlier captures; online deployment remains unchanged by Owner request.

[October1 Resend configuration and verification](resend-20261001/README.md) is an
additive record. The complete September30 snapshot and its proof below remain dated
and unchanged; provider configuration does not rerun the product's previous tests.

## September30 complete work preservation

This folder records preservation and artifact recovery, not a cloud database restore or product launch.

- [Closeout](closeout.json): complete scope and evidence boundaries.
- [CI 42](ci-readback.json): successful source commit 4befe4567, read in the existing authenticated GitHub browser session.
- [Remote references](remote-ref-readback.json): fresh clone main and both original history tags.
- [Downloaded original bytes](remote-archive-verification.json): all 7 archives, 20,108 objects and 46,768 paths verified after downloading from GitHub.
- [Restored signed IPA](restored-ipa-check.json): exactly matches the original release candidate hash.
- [Final coverage](coverage-final.json): no unaccounted eligible project files and no runtime source changes.
- [Readable evidence scan](publication-final-scan.json) and [current source scan](source-scan-final.json).
- [Historical-link mapping](fresh-clone-link-map.json): original raw paths are catalogued rather than falsely described as directly browsable.
- [External file boundary](external-scope-check.json): the supplied review is included; personal exports and recovery codes stay local.

The initial upload was interrupted after observing repeated file-offset restarts. A request-scoped single-transfer retry with a longer activity timeout reused the five objects already accepted by GitHub and uploaded the remaining two. No history was rewritten. Private network traces remain local.

The fresh clone initially downloaded LFS objects without checking them out because only the original repository had LFS configured. Verification rejected the remaining pointers. Running `git lfs install --local` and `git lfs checkout` in that clone materialized the already-downloaded bytes, which then passed complete decryption/hash checks. The clone instructions now include initialization.

Earlier receipts retain their original intermediate counts; closeout.json and coverage-final.json are authoritative for this completed snapshot. The final receipt commit only changes documentation and evidence metadata and uses `[skip ci]`; CI 42 covers the unchanged implementation, while its final manifests are checked locally and read back from the remote.
