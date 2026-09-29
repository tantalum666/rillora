# Private content encryption operations

Status: STAGING AND RESTRICTED PRODUCTION CONTROLS VERIFIED; CUSTOMER ACCEPTANCE GATES REMAIN OPEN
Last updated: 2026-09-30 (Asia/Hong_Kong)

## September30 production operating increment

The separate restricted production runtime now uses the encrypted namespace,verified
TLS,91matching migrations,independent identity services and bounded recurring retention.
Active holds/released reasons and exact-snapshot retirement have scoped operator paths
and monitoring. Sensitive exports/import/deletion and expanded sharing require recent
verified authentication. Current source/artifact/dependency checks are distinguished
from actual customer journeys and external certification.
[Current evidence and rollback boundaries](../../release-engineering-20260930.md).


## Boundary

Ordinary protected content is encrypted by the API using AES-256-GCM. Each planner
has a data key wrapped by one environment-specific AWS KMS key. The database
holds ciphertext and wrapped keys; it cannot independently obtain plaintext.
The authorized application runtime can decrypt. This is not client E2EE.

Covered bodies are listed in [the implementation contract](envelope.md).
Identity display names, email digests, access relationships, categories, statuses
and dates remain operational metadata. External copies requested by users remain
under their control. Free and Family use the same protection.

## Key lifecycle

- The KMS key is retained across stack deletion and replacement. Its AWS backing
  key rotates annually; the key ARN remains stable and older ciphertext stays
  readable. A change to the wrapping-key ARN is a separate migration, not an
  ordinary configuration edit.
- Runtime IAM permits GenerateDataKey and Decrypt only for this key, application
  and environment, with owner/key context present. There is no local key fallback.
- Plain data keys are reused only inside one database transaction and then
  best-effort zeroed. JavaScript plaintext strings and operating-system memory
  are not claimed to be securely erased.
- The migration role temporarily receives the same scoped KMS use for backfill.
  The `finish` rollout removes that permission from the shared IAM role, including
  old task-definition revisions. Normal runtime DB credentials cannot assume the
  administrative content role.
- Never disable or schedule deletion of this key while retained data/backups
  need it. Keep the namespace, exact key ARN, protocol version and database
  backup together in a restricted recovery inventory; do not store raw keys.

## Monitoring and failure

`/health/ready` on the existing API Gateway origin checks SQL and a real KMS
GenerateDataKey/Decrypt canary. The canary contains no user content. One process
shares a successful result for five minutes or a failure for ten seconds,
including concurrent calls. Existing public health monitoring can observe failure
without logging in. `/health/live` remains the process-only liveness probe.

Protected reads or writes fail with a generic503 when key retrieval, context or
authentication-tag verification fails. There is no plaintext write fallback.
Do not dump an upstream exception, request body, database contents or credentials
into an incident ticket. Check the task version, key state/rotation, exact IAM
conditions, region/namespace, DB readiness and service metrics using metadata.

## Rollout and rollback

The rollout tool is `infra/aws/scripts/content-rollout.py`, run from the repository.
It preserves the existing staging parameters and sales gates. The sequence is:

1. `diff`, then `prepare`: install a compatible reader and temporary migration
   key access. Run normal numbered SQL migrations and runtime-role validation.
2. Create and wait for an encrypted RDS snapshot to be available. A snapshot
   being requested or created is not a tested restore.
3. `encrypt`: finish the rolling update to encrypted API writes. Confirm the
   actual task/configuration, synthetic A/B/C, cutoff, negative and health checks.
4. Run `node dist/migrate-private-content.js --check`, `--apply`, a second
   `--apply`, then `--enforce`. Confirm zero protected plaintext and invalid
   references. Each owner transaction preserves and compares logical content,
   versions and cutoff timestamps; failed transactions can be rerun.
5. `finish`: remove migration key access and verify the denial with that role.
   Confirm SQL protection is enforced, live API health and scoped fixture cleanup.

After encrypted writes begin, rollback must retain a compatible decoder, valid
KMS access and the encrypted writer. A pre-encryption image cannot read the new
representation. Do not set protection to off, remove the DB guard, or decrypt
the database in place as a rollback. Pause writes/migration if necessary, inspect
sanitized evidence and deploy a compatible repair. Take a fresh backup before
representation changes.

The tool stops at5,000rows per source table or16MiB of protected owner data per
transaction. An account above that boundary requires a separately reviewed batch
migration; the limit must not be silently removed. No SQL statement may receive
an unwrapped data key.

## Retention and recovery limits

Unreferenced encrypted values have a15-minute grace period; the worker sweeps a
bounded number of owners every five minutes. Current items, paid copies and
retained review/disclosure records keep their immutable references. Account
removal cascades that account's wrapped data keys and encrypted values.

The pre-migration manual snapshot retains the old representation under RDS
storage encryption. It does not become application-encrypted retroactively and
must not be described as such. Keep it restricted until an encrypted replacement
has passed the separate restore/delete-replay gate, then remove it under the
documented retention procedure. A manual snapshot has no automatic expiry.

Current staging has a one-day automated backup policy. Production still requires
at least seven days, isolated restore, RPO/RTO measurement and deletion replay.
Local migration idempotency and KMS reconstruction do not close those gates.
No whole-product E2EE, independent audit or production-release claim follows.
