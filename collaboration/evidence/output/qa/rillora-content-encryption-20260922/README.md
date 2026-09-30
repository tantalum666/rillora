# Rillora application content encryption QA

Status: APPLICATION CONTENT ENCRYPTION IMPLEMENTED AND VERIFIED IN STAGING  
Last updated: 2026-09-23 (Asia/Hong_Kong)

## Authority and reading

Owner selected application envelope encryption onSeptember22 and deferred full
onlineE2EE. This is the implementation continuation of the security/release
workflow. [Start record](implementation-start.json) retains the12-source matching
checkpoint. The full project-owned Markdown body-read baseline remains
[92files/20,554lines](../rillora-release-readiness-20260919/full-read-completion.json),
with206body chunks and no missing ranges. It excludes dependencies, caches,
builds, third-party packages and generatedoutput evidence, not project-owned
historical Markdown. Context recovery rereadAGENTS, currentproduct/handoff,
latestdecision entries and implementation/source changes; it did not repeat the
full read or earlierLogo/pricing/capacity authentication work.

## Delivered scope

AES-256-GCM private bodies with per-planner data keys wrapped by one retained,
rotating stagingKMS key. Opaque references preserve SQL disclosure and paid-copy
projections; the resolver rechecks exact permitted references. Matter fields and
details, contact names/relationships, review proposal/history, saved sharing
copies and private disclosure-snapshot leaves are covered. Authorized responses
remain plaintext. Identity/access/status metadata is deliberately outside this
body scope. Free and Family share the same protection.

Numbered migrations0064–0067 provide the separate nologin content service,
ciphertext/wrapped-key tables, field/source guards, migration-only representation
updates and bounded orphan maintenance. Runtime DB logins cannot assume that
role. Rollback must retain a compatible reader, encrypted writer and KMS access.

Health readiness includes a realKMS canary with five-minute success/ten-second
failure caching. Unavailable keys or tampered ciphertext fail closed. Sorting
uses decrypted names, preventing opaque reference order from changing lists.

## Local checks

- LatestAPI typecheck/build passed; [198tests/20files](api-final.log) passed.
- [23infrastructure tests](infra-final.log) and typecheck passed.
- Earlier179-test compatibility checkpoint is in[the initial log](api-compatibility.log).
  It predates subsequent maintenance code and is not the final run.
- Protected tests include ciphertext-looking input, wrongAAD/tag, unavailable key
  service, direct reference/cross-owner denial, Name-only scope, revocation,
  proposals/approval/history, backups/import, self-service deletion cascade,
  migration rollback/idempotency, locked-owner migration, cutoff copies andGC.
- [KMS provider tests](kms-provider-tests.log) check fixed-key/context requests,
  shared/cached readiness, failure/recovery, and best-effort buffer zeroing.

Local development keys exist only in the excludedtest helper, never in the
production build. Passing these checks is not an independent security audit.

## Cloud execution and evidence

1. [Compatibility deployment](aws-prepare-compatible.log) installedAPI34 and
   migration27. [Schema task](schema-status.json) exited0. Source migrations
   include checksums and runtime-role validation.
2. Snapshot creation first met a real least-privilege denial. The scoped role was
   extended only for the exact stagingDB and migration snapshot prefix; no
   database plaintext or secret was exposed. The[backup](before-content-snapshot-status.json)
   is encrypted andavailable. The[IAM-only update](aws-prepare.log) completed.
3. [Encrypted writer deployment](aws-encrypt.log) installedAPI35/migration28.
   [KMS readback](kms-live.json) confirmsEnabled, customer-managed symmetric key
   and365-day rotation.
4. First cloud acceptance passed the four crypto/permission checks but used an
   incorrectCloudFront health path and received404. The fixture was removed;
   [the failed record](encrypted-acceptance-logs.json) is retained. The health
   check was routed to its actualAPI Gateway URL; no application guard was weakened.
5. [Second cloud acceptance](encrypted-acceptance2-logs.json) exited0: eight
   groups coverHTTPS create/read/rawDB, A/B/C, cutoff copies, wrongKMS
   owner/environment, readiness,20/200items, revocation and cleanup. Five synthetic
   accounts and all their encrypted values were removed. No realAuth0 login,
   personal legal consent or consumer payment is implied.
6. [Data migration](content-migration-logs.json) verified both existing accounts:
   five protected plaintext values became references/ciphertext across two rows.
   Second pass changed zero rows. Finalplaintext=0, invalidreferences=0 and the
   databasewrite guard isenforced. Contents were compared in memory; no private
   body, raw data key, auth token or content hash was logged.
7. [Permission withdrawal](aws-finish-key-withdrawal.log) deployedAPI36. The
   [final key-boundary task](final-key-boundary-logs.json) exited0: actual
   GenerateDataKey and Decrypt denied for the migration role, normalAPI writes
   succeeded, direct plaintext writes were rejected, and0064–0067 hashes matched.
   Its one synthetic account was removed; the remaining two accounts still had
   five protected values, plaintext0 and invalidreferences0.
8. A final regression exposed403 being masked as503 when a revoked reviewer
   submitted a suggestion. [Before-fix failure](revoked-review-before-fix.log)
   is preserved. The content adapter now preserves the existing permission
   refusal contract. The full198-test suite passed after this fix;
   [API37 deployment](aws-finish.log) and[real cloud regression](revoked-review-final-logs.json)
   passed, including unchanged Matter content and cleanup of both synthetic accounts.
9. [Final runtime](final-runtime.json):API37, migration30, encrypted mode,
   desired/running1/1, rolloutCOMPLETED, retainedKMS enabled/rotating and no
   migrationkey configuration. [30HTTP/asset checks](aws-http-verification.json)
   pass. This readback is independent from the priorAPI36 checkpoint.

## Performance boundary

[Summary](performance-summary.json) contains20 sequential paired observations for
each size/mode fromFrankfurt, using identical synthetic content in plaintext and
encrypted accounts before the guard was enabled. All fixtures were removed.

| Workload | Plaintext p50/p95 | Encrypted p50/p95 |
| --- | --- | --- |
| 20items, one page | 57.5/106ms | 43/90ms |
| 200items, two pages | 67.5/121ms | 105.5/223ms |

The20-item result shows network/runtime noise, not proof encryption is faster.
The200-item p95 difference is102ms across two sequentialrequests; the earlier
100ms incremental target was tentative and is not asserted as universally met.
This is not a100-concurrent-user load test or global latencySLA. Runtime size and
DB pool limit remain the existing0.25vCPU/512MiB and5connections. Final readback
shows a35-minute CPU maximum12.86% and memory13.67%; that later window includes
rollout/verification and isnot the overnight benchmark window or a concurrency test.

## Boundaries and remaining release work

The application runtime can decrypt after authorization: noE2EE, zero-knowledge,
SOC2 or bank certification claim. No frontend/native redesign, price change,
live billing or production launch. The pre-migration manual snapshot retains the
old representation underRDS storage encryption; manual snapshots do not expire
automatically. Isolated restore, deletion replay, at leastseven-day production
backup, productionidentity/mail, internalTLS and independent review remain
separate release gates. No cloud restore was performed in this checkpoint.

## Documentation closeout

The implementation and operational contract are in
[envelope](../../../docs/security-hardening-20260921/implementation/envelope.md) and
[operations](../../../docs/security-hardening-20260921/implementation/operations.md).
The[decision log](../../../docs/decision-log.md),[handoff](../../../docs/handoff.md),
[journey](../../../docs/journey/PROJECT_JOURNEY.md),product,security-positioning,
release-readiness,SECURITY and infrastructureREADME are synchronized. Owner's
Option2 selection and the implementation checkpoint are separate appended entries;
no new pricing, E2EE or production-launch approval was inferred. Historical research
and its structuredJSON remain dated snapshots with clear current-selection pointers.
[Implementation fingerprints](implementation-source.json) preserve28 affected
source/test files independently from the original frozen research collection.
The Markdown link check and closeout manifest record documentation verification.
