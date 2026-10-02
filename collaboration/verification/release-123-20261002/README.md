# Release packages1–3 — October1–2 evidence

Updated: 2026-10-02 (Asia/Shanghai)

[Current execution contract](../../../docs/release-123-20261001.md) and
[handoff](../../../docs/handoff.md) own the live task. These dated receipts are
reference evidence, not instructions to rerun deployments or provider sends.

- Prepared API/Web/WWW repairs deployed; restricted clients/identities subsequently
  deployed with the original expiry. [Repair readback](receipts/repair-rollout-readback.json),
  [restricted Web readback](receipts/review-web-html-readback.json).
- Actual Apple TEST initially failed. [Cloud timeout](receipts/apple-cloud-verification-logs.json),
  [bounded template difference](receipts/ocsp-rollout-template-diff.json),
  [API10 deployment outputs](receipts/ocsp-deploy-outputs.json),
  [official TEST SUCCESS](receipts/apple-test-notification-after-fix.json).
- One assisted invitation email was accepted by the receiving server. Owner still
  reports no QQ inbox arrival. [Delivery distinction](receipts/qq-delivery-investigation.json).
  The prepared direct-link acceptance is not mailbox evidence.
- Duplicate signup was confirmed. [Failure receipt](receipts/qq-auth-failure-readback.json).
  Source text is prepared; provider copy application is pending actual Auth0 admin login.
- [Scoped new checks](receipts/new-test-results.json), [execution state](receipts/work-state.json).
  Prior full suites retain their dates. No actual purchase, TestFlight upload or launch.

All eligible new QA and client artifacts are preserved additively:463 original paths,
306 unique objects, two encrypted LFS archives totaling56,164,478bytes. [Catalog](catalog.json),
[snapshot and explicit exclusions](snapshot.json), [decryption verification](archive-verification.json).
Readable QA text is privacy-redacted; scripts/Markdown use reference suffixes. Rendered
clients, native binaries and inspected account screenshots stay encrypted. Personal
authentication UI, credentials/capabilities, dependency/compiler caches and expanded
asset copies are explicitly excluded. The known review simulator app is retained
separately from reproducible compiler outputs; the preserved prior Debug app remains.

The September30 seven-archive snapshot/catalog is unchanged. This addendum has its own
catalog and is not counted in that historical snapshot. The existing strict verifier
checked it through a temporary metadata root; the one-off capture/verification code is
[retained as reference](receipts/archive_addendum.py.reference.txt). No secret key is in Git.
The archives are `collaboration/archives/raw-work-008.tar.zst.age` and
`raw-work-009.tar.zst.age`; obtain them through
Git LFS and use the original protected age identity for recovery. Their manifests store
all original paths and content hashes. Do not extract over the active checkout.

Publication receipts added after the capture interval are readable follow-ups with
separate hashes in the repository-wide readable manifest. Remote readback and CI must
be assessed independently from local archive verification.
