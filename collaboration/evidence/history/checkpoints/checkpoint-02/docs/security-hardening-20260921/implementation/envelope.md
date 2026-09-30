# Implementation Plan: application content encryption with managed keys

## Selected Design And Constraints

Owner selected Option2 on2026-09-22: “那就先搞你建议的，后续再看情况进行端到端加密”. Implement envelope encryption; completeE2EE stays deferred. The implementation is deployed to the existing staging environment; final privilege withdrawal, API37 and real-KMS readback are recorded separately in the current handoff and QA. No production release or certification is implied.

Keep UI, API plaintext response shapes, Free/Family security parity, exact sharing scopes, paid cutoff copies, owner recovery/export and all revocation rules. Do not change prices or open production sales.

## Source Revision And Drift Check

The12 previously inventoried source/evidence hashes matched before implementation. The root working tree remains uncommitted; no initial commit, branch or stash is introduced. Frozen input identity remains in the analysiscontext; new implementation evidence is separate underoutput/qa/rillora-content-encryption-20260922.

## Affected Components

API content storage adapter, KMS key provider, PostgreSQL content tables/guards and migration; Matter/contact/import/review/snapshot write paths; authenticated database read boundary; staging CDK and controlled rollout tooling. Clients continue receiving only authorized plaintext responses, so this is notE2EE.

## Ordered Work Packages

- Inventory protected columns and all retained copies before modifying runtime writes.
- Add immutable encrypted values and wrapped per-planner data keys behind an independent nologin content-service role. Existing text/JSON fields store opaque references, allowing the current SQL field projection and cutoff logic to copy references without plaintext or keys.
- Add a second authorization check when resolving references: owner access or exact reference membership in the current permitted sharing/review projection. A guessed reference, ciphertext-looking input, stale grant or saved-copy access must not resolve new/unselected contents.
- Encrypt usingNode's AES-256-GCM andAWSKMS GenerateDataKey/Decrypt, with versioned owner/key/value/source/field context. No key or plaintext goes to logs, SQL or environment variables. Production has no local-key fallback.
- Integrate every protected write, then validate migration, rollback readers, orphan removal and account-deletion cascade.
- Provision one retained stagingKMS key with rotation and narrowly scoped runtime permissions; deploy read compatibility, schema, encrypted writes, bounded migration, then enforce the database plaintext guard.

## Compatibility And Migration

Opaque references preserve existing storage shapes and SQL allowlists; a client never receives or supplies them as decryption authority. Each immutable value binds to a source and field, and old paid copies keep their own immutable references. Account identity display name, verified-email digest, access relationships and operational categories/status/dates remain explicitly outside the protected body scope. Do not say all personal metadata is encrypted.

Protected body scope: Matter title/provider/account hint/location/Notes/details/value band/currency; contact names/relationship; authorized sharing snapshots; review source/proposal/change values; retained private fields in disclosure snapshots. Plaintext owner exports remain explicit user-requested outputs, never retained server files.

Reader compatibility precedes encrypted writes. The migration skips valid references, preservesbusinessversions/cutoffs, uses transaction boundaries and verifies no protected plaintext remains before enabling the guard. Previous database backups may contain the old representation underRDS storage encryption until their retention expires; do not claim retroactive content encryption of those backups.

## Tactical Protections During Migration

Keep tenantRLS, CSRF, schema limits, exact A/B/C projection, current access-clock checks and all negative tests. Do not permit keys inPostgreSQL session variables or decrypt inSQL. KMS errors fail closed. The content-service role is never granted as a runtime membership. A bounded orphan sweep avoids retaining unreferenced oldvalues after edits; account removal cascades keys and ciphertext. Public readiness performs a bounded real-KMS canary without user data; list ordering occurs after decryption. Operational details are in[the runbook](operations.md).

## Tests And Security Validation

Roundtrip, wrongAAD/key, tampering, missing KMS, reference spoofing, cross-owner/cross-level lookup, expiry/revocation and post-cutoff values; encryptedcreate/edit/import/archive/reviews/exports; rawDB sentinel checks for current rows and retained copies; unchanged legacy readers; plain-write guard; migrationidempotency; orphan cleanup; no application secret output. Run appropriateAPI/infrastructure checks after implementation and verify deployed code/config/migration separately.

## Performance And Resource Benchmarks

Batch reference resolution and unwrap each ownerkey at most once within a transaction, with no unbounded process cache. Measure20/200-item andshared-read workloads, keycalls, latency, memory and pool pressure. Previous cross-oceanHTTP timings are not a crypto benchmark. Adjust only from observations.

## Rollout And Rollback

The first runtime is a compatibility reader with KMS configuration but plaintext writes; schema defaults unenforced. Next enable encrypted writes on compatible workers, migrate and enforce only after a zero-plaintext check. Rollback must use a build that understandsreferences and retains keys; never roll to a pre-encryption reader or silently store plaintext whenKMS is unavailable. Preserve an encryptedRDS snapshot and perform restore checks before any destructive cleanup.

## Acceptance Criteria

Protected active content and copies are ciphertext outside authorized API reads; A/B/C responses and previous cutoffs match; direct DB reads and guessed references reveal no protected body; unavailable key service denies without plaintext fallback; migration and recovery evidence recorded; no claim ofE2EE, independent certification or production release follows.

## Open Decisions

No further architectural selection is needed. Owner completed the required AWS MFA once; the renewed session completed the phased rollout. Do not ask for the old authentication again. Production isolation/identity/mail/TLS/independent review remain separately tracked release work, not implicitly completed by this content layer.
