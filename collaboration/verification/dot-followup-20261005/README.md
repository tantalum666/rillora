# October5 Dot integration work preservation

This additive package preserves the local follow-up of four Dot branches and the
current release branch. [Scope and actual validation](../../../docs/qa/dot-followup-20261005/README.md)
separates source integration, focused repairs, local tests and unperformed release work.

The new `raw-work-017` archive contains eligible current QA, failed/passed test results,
Simulator app bundles and local Web builds. [Snapshot](snapshot.json), [per-file catalog](catalog.json)
and [local verification](archive-verification.json) describe exact scope. Earlier archives
are immutable. Readable receipts are redacted reference copies; exact originals remain
sealed. Selected screenshots contain public or deliberately synthetic UI only.

Credentials, browser authentication state, recovery/deletion capabilities, unrelated
projects, machine caches and reproducible dependency/test-product duplicates are excluded.
Keychain and Owner data were not cleared. No account deletion, provider/cloud change,
physical purchase, store upload or AI runtime occurred.

Remote commit/CI and fresh new-archive recovery are recorded separately after push.
The previous branch-specific CI results are not the integrated source's CI.

Local verification passed: 1404 paths / 772 objects, 111,539,826 original bytes; new ciphertext 26,500,710 bytes. Exact snapshot interval and exclusions are retained in snapshot.json.
