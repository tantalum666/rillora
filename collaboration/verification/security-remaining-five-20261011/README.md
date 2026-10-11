# October11 remaining five security groups — additive preservation

Status: LOCAL SOURCE / TESTS / ARCHIVE VERIFIED; PUSH AND CI READBACK PENDING
Updated: 2026-10-11 (Asia/Hong_Kong)

Owner requests code/tests for groups31–35 and one complete Git delivery with online
state unchanged. The active branch is `codex/security-findings-20261011`, continuing
from `b6f5b8c971196db3f513a7dbb5f6dc36efae8b6a` after the preserved first30groups.
Read the [focused result](../../../docs/security-remaining-five-20261011.md) and
[current handoff](../../../docs/handoff.md) for implementation and deployment limits.

The new `raw-work-032.tar.zst.age` preserves249eligible file paths and232unique raw
objects in345,291encrypted bytes. [Catalog](catalog.json) records each original path;
[snapshot](snapshot.json) defines the frozen capture and exclusions. Its exact objects
and catalog passed [local authenticated decryption](archive-verification.json).
Archives1–31 and the initial root snapshot are unchanged.

Included material comprises failed/passed API/infra/tool logs, both candidate/final
patches, scoped review findings and decisions, synthetic macOS hardware probes,
disposable-database reset protection, the compiled API and focused QA/reading records.
Source/config/specs remain ordinary Git files. Readable `.reference.txt` copies are
redacted reference evidence; raw patches and compiled artifacts remain sealed.

Actual credentials, browser/provider/database state, the age identity, SDK/dependency
caches, duplicate source copies and reproducible native test binaries are excluded.
No new provider operation, deployment, real credential migration, money movement,
account deletion, device installation, TestFlight upload or scan execution occurred.
The existing publication redactor and scanner protections remain intact.

API519/519, infra58/58, release-tools73, maintenance-broker7, credential-tools7,
Auth0-tools7, journal-broker4 and collaboration9 pass locally. API/infra typechecks,
API build and current Swift helper compilation pass. Real Secure Enclave synthetic
control/denial checks pass; real signed installation and credential migration do not
follow from them. Web/iOS prior evidence is retained without claiming a new run.

Final source/readable scans, Git/CI and independent new-LFS-download receipts are
post-capture reviewed Git metadata. They do not reseal this immutable archive or
repeat the old archive downloads. None of these outcomes is production activation.
