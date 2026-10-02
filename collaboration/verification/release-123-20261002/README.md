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
- One assisted invitation email was accepted by the receiving server. Owner later
  confirmed it was found in spam or another classification. [Delivery distinction](receipts/qq-delivery-investigation.json).
  The prepared direct-link acceptance is not mailbox evidence.
- Duplicate signup was confirmed. [Failure receipt](receipts/qq-auth-failure-readback.json).
  Owner completed admin login; [two-key application/readback](signup-copy-applied.json) passed.
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

[Remote readback](remote-readback.json) confirms the source commit and fresh download/
decryption of both new archives:463paths/306objects. [CI43](ci43.json) passed for
572fae4c7; [the actual GitHub run](https://github.com/tantalum666/rillora/actions/runs/36977337394)
is independent of local test receipts. The CLI could not read Actions with its existing
limited token, so the already authenticated browser supplied the read-only result;
no token scope was expanded. A subsequent preflight/register correction has7focused passes and is recorded
separately; the final evidence-only follow-up does not change runtime implementation.

The register/checker drift was reproduced before repair and7preflight cases pass
afterward. [Actual remaining blockers](publication/preflight-current.json) keep
publication false; they do not repeat the already deployed Dot repair gate.

The [two-key apply helper](apply_signup_guidance.py.reference.txt) executed after Owner
admin authentication and its readback passed. It pins the tenant/prompt/language, merges only the two keys,
checks concurrent drift, preserves all other text and reads back the result. Personal
administrator authentication was completed; live error rendering is a separate check.

[CI44](ci44.json) passed for156a390f0, including the preflight/register correction
and recorded Auth0 copy application. A failed default Git/LFS connection and its
process-local transport recovery are recorded in [the continuation receipt](transport-and-native-resume.json);
no persistent setting, locking check or TLS validation changed. Native Google SSO
now reaches the unchecked account terms. Owner subsequently completed that action and found the QQ email outside the primary
inbox; [the actual callback/arrival receipt](real-account-progress-20261002.json) supersedes the pending state. The final receipt-only commit skips duplicate CI in
line with earlier evidence-only commits; implementation is unchanged fromCI44.

## Later October2 acceptance checkpoint

The native callback loaded the same synthetic Web matter and Connected recipient.
Owner found the QQ invitation email outside the primary inbox. [Actual account results](real-account-progress-20261002.json).
After renewed AWS MFA, [one exact QA planner was enrolled](apple-review-enrollment-task.json)
through the unchanged expiry without creating orders/entitlements. [API10 readback](production-runtime-after-renewal.json)
confirms running1/rolloutCOMPLETED. A [strictly checked development build](native-review-device-build.json)
is prepared; Owner explicitly defers phone work, and it was not installed.

The normal [QQ password-reset request](qq-password-reset-request.json) succeeded after
no-send reconciliation and using the existing local system proxy. [One delivered email](qq-password-reset-delivery.json)
is observed; actual password completion/relogin is still awaiting Owner. No agent-set
password or reset ticket/body is saved here. The open Web page is a personal handoff.

The [later snapshot](followup-snapshot.json) preserves112new/changed original file
versions and105objects in raw-work-010.tar.zst.age (8,977,879bytes), including the
prepared device app. [Its catalog](followup-catalog.json) is separate from the earlier
463-path capture, because mutable receipts keep dated versions. [Local decryption verification](followup-archive-verification.json)
passed. Credentials, authentication UI and device inventory remain excluded. Current
remote follow-up is recorded separately; the first two archive readbacks are retained.

[Later remote readback](followup-remote-readback.json) confirms8987b2c8b and a fresh
download/decryption of raw-work-010:112file versions/105objects. Old archives were
not downloaded again. The final proof-only commit updates these receipts and does
not change the implementation or gate classifications already covered by CI44.
