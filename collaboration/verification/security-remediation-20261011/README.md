# October11 security remediation preservation

Status: SOURCE PUSHED; CI124 PASSED; ARCHIVE31 REMOTELY VERIFIED; NOT DEPLOYED
Last updated: 2026-10-11 (Asia/Hong_Kong)

Owner requested fixes for the recent Rillora audit exports and then explicitly
approved the precise protected production-source mode and synthetic-fixture scan
registry updates. The online configuration must remain unchanged. The current
[repair record](../../../docs/security-findings-remediation-20261011.md) distinguishes
source fixes, calibrated trust assumptions, local verification and future rollout.

This addendum preserves2,430logical paths/1,389unique objects,15,788,242raw path bytes
in one6,289,927-byte encrypted archive. The raw unique payload is14,428,090bytes.
[Archive metadata](snapshot.json), [path catalog](catalog.json) and
[local decryption verification](archive-verification.json) record exact scope.
Archives1–30 and the original September30 snapshot metadata are unchanged.

Included: the exact source-fix input index/provenance, candidate diffs, approved
decisions, successful and failed tests, synthetic probes, compiled API/Web and
the specific native result bundles/logs from this task. Credentials, database or
provider objects, browser state, SDK/compiler caches and unsigned reproducible
test products are excluded. The existing owner-only age identity is reused;
its fingerprint matches the original snapshot identity.

All files under receipts are generated reference copies. Some deliberately retain
pre-approval/failed checkpoints; they are historical evidence, not current commands
or authority. Current implementation is in apps/infra/tools/config. Raw patches,
compiled outputs and result bundles remain encrypted, and readable copies are
redacted and independently scanned. Do not count historical implementations as
new current defects or infer deployment from test results.

Current tests: API495/495plus typecheck/build, iOS287passed/1existing skip,
Web191, infrastructure56, release tools70, Auth0tools7/Actions14, broker4 and
collaboration guards9. Some focused subsets overlap. Source scan has32matched
findings/0unknown under the exact Owner-approved registry. No real payment,
refund, provider change, phone installation, TestFlight or deployment occurred.

Source/archive commit `076bd5a8b86632b0dad134a6b39ce566d8eda5ba` was pushed to
`codex/security-findings-20261011` in the existing private repository.
[CI124](https://github.com/tantalum666/rillora/actions/runs/38134460959) completed
successfully for api, web-and-infrastructure and source; [CI receipt](ci-readback.json)
retains the latest job states and the browser-observed immutable commit association.

The [remote receipt](remote-readback.json) records a fresh separate LFS download
of archive31 only, comparison with remote snapshot/catalog bytes at076bd5a, and
authenticated decryption of all1,389objects/2,430paths. Earlier archives were not
downloaded again. Final documentation/receipts are saved directly after capture
without modifying the sealed originals or claiming another product test run.
