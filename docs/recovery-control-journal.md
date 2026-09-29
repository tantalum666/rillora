# Recovery control journal and quarantine

Role: engineering contract for restoring encrypted Rillora data safely
Status: SCOPED CLOUD RESTORE BASELINE RETAINED; HOLDS/COMMERCE REPLAY IMPLEMENTED; REAL TRANSACTION ACCEPTANCE OPEN
Last updated: 2026-09-30 (Asia/Hong_Kong)

The production foundation is separate from staging. Customer traffic remains
closed while the [production/recovery gate](production-recovery-20260923.md)
is validated. Git source history, database snapshots and control-state recovery
are distinct evidence.

## September30 holds and commerce reconciliation

The journal now includes minimal retention_hold facts. Active holds have no TTL;
released facts retain90days. Independent reason codes cannot release each other and
idempotent replay preserves identifiers. No private legal/security case narrative
is added to the journal.

Recovery markers carry bounded subscription references from0091's migration set
(0089introduces the inventory). The isolated frozen-source reconciliation command
replays privacy first and requires current trusted provider facts before clearing
markers. Legacy/unknown/manual/stale cases remainblocked. Local refund/ownership/
restoration regressions pass; actual paid-history recovery awaits real provider
transactions.[Exact boundary](release-engineering-20260930.md).


## Why a data backup is insufficient

A backup can contain a contact whose permission was later revoked, a deleted
account's wrapped data key, and still-valid session hashes. Restoring those rows
alone could reopen old access. Control metadata must survive outside the data
snapshot and be applied while the restored database is quarantined.

Migrations0068–0070 add an opt-in recovery policy, database generation, monotonic
control revisions and restricted functions. DynamoDB stores opaque entity IDs,
permission levels, states and revisions. It does not store private matter bodies,
plaintext names, email addresses, invitation tokens or unwrapped keys. Existing
RDS/application encryption still has its own scope; this is not E2EE.

## Commit and failure boundary

Restrictive database changes create a transaction-local control record. Before
commit, the API publishes its final minimal state to DynamoDB and marks the
record published. A deferred SQL constraint rejects unjournaled commits when
enforcement is on. Missing publishers and publication failures therefore cannot
silently save an unprotected restriction. Temporary failures return503 and leave
the original database transaction rolled back. Source readiness also verifies
the independent journal and matching database generation.

The external write and PostgreSQL commit are not a distributed atomic transaction.
If the external write succeeds but the database commit fails, a restrictive intent
may remain in the journal. A restore applies that intent conservatively and can
require reconciliation; it must not be described as a successful original user
operation. Conditional revisions prevent older retries overwriting newer records.

Runtime logins cannot hold `continuity_recovery_service` or the content migration
role. Administrative restore uses explicit forced-RLS policies and is tested with
a non-superuser/non-bypass-RLS login, matching the important RDS boundary.

## What replay does

- Reapplies terminal account deletion through the existing erasure functions,
  preserving the snapshot's bounded financial records and removing private keys
  and bodies. An incomplete source deletion stays pending rather than becoming
  an invented provider-deletion success.
- Revokes removed connections and intersects remaining grant levels/items with
  their current journal ceilings. It does not grant new access absent from the
  restored data. Unaffected accepted recipients remain available after fresh
  authentication.
- Reapplies removed/private/archived matter and contact restrictions, invalidates
  restored sessions and authentication handoffs, and expires pending invitations.
  A recipient is not made an account-recovery authority.
- Refuses automatic completion if post-snapshot billing/entitlement changes need
  provider reconciliation. It does not globally revoke all accepted contacts as
  a substitute for a correct recovery.
- Advances the restored revision sequence beyond external records and removes
  orphaned ciphertext while the clone has no active readers. Replay is idempotent.

These are conservative restore rules. Post-snapshot additions/expansions and an
ambiguous pre-commit intent can require recovery reconciliation. They are not a
promise of zero data loss, unattended failover or uninterrupted access.

## Coverage, retention and operation

An independently stored coverage record identifies the initialized database
generation. Eligible snapshots must be within that coverage and at most35days
old. Control items have90-day DynamoDB TTL; the coverage record has no TTL.
TTL is asynchronous provider cleanup, not proof of immediate erasure. Older
snapshots cannot be admitted simply because a corresponding tombstone expired.
Production automated RDS retention is7days; drill snapshots are explicitly removed
after verification. Long-lived manual backups and restoring the journal itself
need separate reviewed recovery procedures.

The synthetic batch helper checks the exact production/restore host, TLS, run
identifier and existing fixture identities. The recovery task has read-only
journal access, decrypt-only KMS use and a separate security group that cannot
connect to the original database. There is no public listener or traffic switch.
The resource driver always keeps `acceptancePassed=false`; data verification
results are separate reports.

Schema/source checks, database creation, journal initialization, synthetic seed,
snapshot availability, later deletion/revocation, isolated restore, replay,
decryption and cleanup each require their own observed result. Raw evidence stays
in the restricted QA folder; current state belongs to [handoff](handoff.md).
Future production ingress and recurring retention/reconciliation operations are
still launch gates, not implied by this bounded drill.

## September23 actual acceptance

Real production RDS snapshot/clone and production KMS passed: before replay the
clone contained D's later-deleted key/account and an old session; afterwards B
retained its allowed content, C was refused, D/account keys/bodies were absent,
all old sessions were removed and repeated replay changed nothing. All70 schema
checksums matched; plaintext0 and invalid references0. This was four synthetic
accounts/ten initially protected values, not real customer/provider transactions.

The recovery task also actually timed out connecting to the privately resolved
original database while the source remained available, received KMS GenerateDataKey
AccessDenied and DynamoDB PutItem AccessDenied. Original synthetic account/content/
key rows were cleaned to0; the exact temporary DB and manual drill snapshot were
confirmed absent. Minimal control tombstones/receipts remain within their own
retention boundary. Observed restore request to verified result was1206seconds,
including operator observation cadence, not an automatic failover SLA.

See [QA](../output/qa/rillora-production-recovery-20260923/README.md). Public runtime,
provider reconciliation after billing changes and recurring operational cleanup
remain separate release work. Do not bypass quarantine by manually pointing the
application at an old backup database.
