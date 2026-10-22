# Node 22.23.4 deployment receipt

Date: 2026-10-22 (UTC)

Status: STAGING AND PRODUCTION CONTAINERS DEPLOYED AND VERIFIED

Both CloudFormation stacks are `UPDATE_COMPLETE`; all four long-running services have one running task, zero pending tasks and a single `COMPLETED` deployment. All seven task definitions reference patched ARM64 images. Maintenance definitions were updated without running migration, recovery or standalone deletion tasks. This is container deployment evidence; managed Lambda patch status and direct remote-process version readback remain outside the verified scope.

## Source, CI and distinct application baselines

- Reviewed source: `f95d99d90d3ae221d720f671ed70327b6233c443`; [PR5](https://github.com/tantalum666/rillora/pull/5) merged as `4347d7db803388a8f1308f76adcc9348b66d6584`. Both have tree `ac57e2cf541b2ecc099d32d630f5caacfaa823d4`.
- Required [source215](https://github.com/tantalum666/rillora/actions/runs/39702725244), [browser15](https://github.com/tantalum666/rillora/actions/runs/39702725267), [publication guard1](https://github.com/tantalum666/rillora/actions/runs/39702725205), and merged [main216](https://github.com/tantalum666/rillora/actions/runs/39703422598) were independently read as successful. [Machine-readable receipt](source-ci.json). No rollout preceded the required gates.
- Cloud tests API588, Web198 and infra68 are the existing [cloud checkpoint](../node-security-20261022/README.md), not a locally repeated suite. This local continuation performed builds, artifact comparisons, deployment checks and publication checks only.
- Today's live baseline confirmed three distinct application images. Staging retains source `bfe9baaf520e051e70081daf7ed459f0926264b4`; production worker/migration/recovery retain `aa1864fbda5295a8e75939ae2e166ba3fbf050ff`; production API retains application bytes from `c6beccfdeab7c0274941fe24d986ab0c9b69bb3c` and uses the reviewed source head's runtime patch. No newer staging/worker application was silently released.
- The three builds use the pinned official Node22.23.4 multi-architecture index from the [focused specification](../../node-security-upgrade-20261022.md). Old live images were pulled by their actual digest and executed locally: Node22.22.3. All three patched images execute Node22.23.4/linux/arm64/uid1000.
- [Application comparison](application-compatibility.json) checks every file in package.json, dist, node_modules, migrations and certificate directories: staging8,974 and each production group10,126 files; zero byte differences. Full per-file fingerprints, source-context provenance, successful build logs and initial build failure are preserved in [evidence](evidence/).

## Immutable images

All images use the existing repository `133857166372.dkr.ecr.eu-central-1.amazonaws.com/cdk-hnb659fds-container-assets-133857166372-eu-central-1`.

| Image group | Previous actual digest | Patched ECR index digest | ARM64 child manifest |
| --- | --- | --- | --- |
| Staging API / worker / migration | `sha256:75fa633d5d30cc4b74a0c9de5cfec9c187d2eab4f118f3b8b7842cb0214fc734` | `sha256:97d87dd1f5adad24a8b043c1eaf580041848f5f8c3ee2c43b7c37be16f958bb4` | `sha256:0c0e431884ca31228b3e24a2452595e99c68f6a1399c4360137a9f2689967b99` |
| Production API | `sha256:1985c37321fd8bd22b585410d3b88005b89a6a272234a566cc57062b0f47f071` | `sha256:62b440548b3e248ff236d845720cf598c93e9109f9e13cce5c3f7a22a9a5c68e` | `sha256:a835d495d09ca8ff1c4b877a1a9564a93daa3f58572f6bc45976c2b8206d5e08` |
| Production worker / migration / recovery | `sha256:f3a1e36545af4fc56e284d55d48b704cfcc699783aa0de8d5fe57dcff85c6543` | `sha256:341e86009284fed26f08cac62ac4c5e06b2b092b1dedbf9355c8e3e2ea2c5c1a` | `sha256:bc29cdefb19bea9d8c9f3aafe77451b4c0df1f54fa40ec21deb5b229db4d932e` |

The registry index and its ARM64 child are separate identifiers. ECS reported the index digest, exactly matching the image pulled and executed by immutable ECR reference in the [runtime readback](exact-digest-runtime.json). Containers used read-only filesystems and no network for this local version check. **ECS Exec stayed disabled: this is digest-linked artifact execution plus live-task digest readback, not direct execution of `node --version` inside remote ECS tasks.**

## Change sets and deployment results

Actual deployed templates were the baseline; no cached CDK assembly or active-runtime tag context was used. All parameters used `UsePreviousValue`, including NoEcho fields. The actual AWS change-set TemplateBody matched the reviewed local template before execution; the final deployed template matched afterward.

- Staging: `node-22-23-4-20261022-staging/bcdea9d7-d806-4b64-a8b2-f4c99c28129a`; three direct Image edits. Final readback `2026-10-22T01:29:02.267803+00:00`. [Reviewed changes](staging-reviewed-changeset.json), [final definitions/services](staging-after.json).
- Production: `node-22-23-4-20261022-production/8a371d60-0ade-4c13-ab23-a74f2b7036b5`; four direct Image edits. Execute accepted01:34:19; stack completed01:39:29; final readback `2026-10-22T01:40:28.051845+00:00`. [No-drift preflight](production-preflight.json), [reviewed changes](production-reviewed-changeset.json), [execution](production-execution.json), [final definitions/services](production-after.json).
- CloudFormation also updated derived references in two services, the existing maintenance broker's environment, and its existing task-ARN policies/operator references. There were no direct IAM policy edits or permission expansion, no new service, and no Web/CDN, storage, networking or database changes.
- Full non-image task configuration matches the captured baseline, including commands, environment, secret references, roles, CPU/memory, health checks, strict database TLS/CA and ARM64 platform. ECS returned compatibility lists in a different order and added derived Docker API1.21 capability metadata; those differences are recorded explicitly, not hidden as application changes.

| Consumer | Before task definition | After task definition | Verification |
| --- | --- | --- | --- |
| RilloraStaging / ApiTaskDefinition51EA709E | `RilloraStagingApiTaskDefinitionF6347BA4:44` | `RilloraStagingApiTaskDefinitionF6347BA4:45` | RUNNING; HEALTHY |
| RilloraStaging / IdentityWorkerTaskDD5047F2 | `RilloraStagingIdentityWorkerTaskE9CF37C5:1` | `RilloraStagingIdentityWorkerTaskE9CF37C5:2` | RUNNING; UNKNOWN |
| RilloraStaging / MigrationTaskDefinitionE89B136E | `RilloraStagingMigrationTaskDefinitionD83F7D18:37` | `RilloraStagingMigrationTaskDefinitionD83F7D18:38` | Definition updated; never launched |
| RilloraProduction / MigrationTask69EAEF9D | `RilloraProductionMigrationTask3A96A2B6:26` | `RilloraProductionMigrationTask3A96A2B6:27` | Definition updated; never launched |
| RilloraProduction / RecoveryTaskD940248B | `RilloraProductionRecoveryTask4FA4E62D:27` | `RilloraProductionRecoveryTask4FA4E62D:28` | Definition updated; never launched |
| RilloraProduction / RuntimeApiTaskCF645D67 | `RilloraProductionRuntimeApiTask93405B31:31` | `RilloraProductionRuntimeApiTask93405B31:32` | RUNNING; HEALTHY |
| RilloraProduction / RuntimeIdentityWorkerTask676ED9B0 | `RilloraProductionRuntimeIdentityWorkerTaskCE49E148:7` | `RilloraProductionRuntimeIdentityWorkerTaskCE49E148:8` | RUNNING; UNKNOWN |

Actual production tasks: API `c6aa0a6e6d5540c4ab92d8629f632ec7`, worker `ff0ff2de9de6461ea2909053574e6cf9`. Actual staging tasks: API `7d948f67815b40c995cd2e56a6ef7183`, worker `ac976d0ff9d04d8d881154dd271ddeee`.

## Health, retained state and limits

[Final public checks](production-after-public.json) passed7/7 at `2026-10-22T01:40:05.092283+00:00`: both API live/readiness endpoints200, both unauthenticated session endpoints401, and production MCP protected-resource discovery200. HTTPS certificate verification stayed enabled; no credentials, cookies, exploit payloads, response bodies or real-user workflows were used.

The APIs are ECS HEALTHY. Deletion workers are RUNNING/stable with expected health UNKNOWN because they have no container health check; their log sample is unavailable, not a claim of zero errors or functional deletion success. Staging API's20-event sample had no failure keywords. Production's naive keyword sample matched the `Failed` metric key; [structured log classification](production-log-classification.json) records actual numeric counters and levels separately. These bounded samples are not a guarantee of all future behavior.

The [switch summary](preserved-switches.json) and full private before/after comparison preserve actual runtime flags. No API request changed prices, Apple review/manual-release state or real data; no Web artifact was uploaded. Database schema was not queried or migrated: documented production schema106 remains historical context, not a new database audit. Existing ordinary background workers continue their configured behavior.

The live template inventory found **four**, not the preparation document's three, separate AWS-managed Node22 Lambda functions: staging broker, production broker, Operations health check and snapshot-retirement worker. `GetRuntimeManagementConfig` was denied under the existing staging operator scope. Their patch version/update mode remain unverified; no permissions were expanded and no Lambda runtime upgrade is claimed. [Inventory](managed-runtime-scope.json). Cloudflare compatibility mode is independent and untouched.

## Failures, recovery and coordination

- Existing AWS login was expired and renewed using the existing login/MFA flow; no new persistent credential was created. No keys or authentication material are published.
- `docker build --progress` failed before building because the client did not discover buildx. The already installed `/opt/homebrew/bin/docker-buildx` completed all ARM64 builds; no tool was installed.
- ECR DescribeImages with the deployment role was denied. The existing documented CDK publishing role supported the authorized BatchGetImage/pull/push workflow; no IAM change or repetition of the denied operation.
- The generic health checker rejected reserved addresses returned by this Mac's DNS/proxy path, including inside Docker. Its guard was left intact. Separate fixed, repository-confirmed HTTPS metadata probes passed; the initial incomplete MCP discovery path404 is preserved, and the correct `/api/mcp` suffix passes.
- Early verification encountered UPDATE_IN_PROGRESS/CREATE_IN_PROGRESS and stopped; subsequent read-only checks confirmed readiness before continuing. A comparison initially flagged unordered ECS compatibility metadata; normalization retained every configured field and records the derived capability delta.
- A post-execution staging change-set lookup by name returned ChangeSetNotFound. The saved pre-execution review, final stack/template and task readbacks establish the actual result; no second execute was issued.
- Parent requested a coordination pause after staging; production remained untouched until the parent explicitly resumed the existing authorization. No user cancellation, failed deployment or rollback occurred.

## Executable rollback procedure — prepared, not executed

A compatible patched prior application is preferable. The fallback below restores the exact original application image digests and **reintroduces vulnerable Node22.22.3**. It must be reported as recovery, not successful remediation. It never runs maintenance tasks or changes data/schema.

Use a complete checkout, Python3 and the existing authenticated `rillora-cdk-deploy`/`rillora-cdk-session` profiles. From repository root:

```sh
python3 docs/qa/node-security-deployment-20261022/rollback.py production prepare
python3 docs/qa/node-security-deployment-20261022/rollback.py production inspect
```

Use `staging` instead of `production` only for a staging recovery. `prepare` reads the current stable template, requires this release's current images, restores only the three/four old immutable digests from [rollback-images.json](rollback-images.json), uploads through the existing CDK file-publishing role, and creates a change set. It preserves every other live field and parameter, rather than copying an old whole-stack template. A saved request prevents blind duplicate preparation; inspect actual AWS status if a call has an uncertain outcome.

If creation is pending, run `inspect` later. It reads the actual AWS TemplateBody, checks exact target equality, unchanged parameters and the allowed existing resources, and prints an executable AWS command for that exact change-set ARN. Execute that printed command once **only when recovery is required**. Do not guess a change-set name, run `ecs run-task`, or restore an old task-definition revision that CloudFormation may have deregistered. On timeout, read stack/service status before any retry. Read back UPDATE_COMPLETE, stable services, old digests and the same public health endpoints; disclose the restored vulnerable version. Never add migration/data recovery to this image rollback.

[Helper](rollback.py), [existing-bucket publisher](publish_template.py), and [offline guard checks](rollback-checks.json) are included. Offline tests exercise both real captured templates, reject wrong current images, and preserve unrelated fields. The AWS rollback itself was deliberately not executed; normal forward deployment already used the same existing template upload/CloudFormation route.

## Publication and preservation

[Complete collaboration check](publication.json) passes13,108 readable files/46,768 catalogued work files with zero unreviewed secret findings. No collaboration file, manifest, old archive, scanner policy or exception was changed. The [source scan](source-scan.json) and [local Markdown/helper checks](document-checks.json) are separate receipts for this documentation candidate. New links resolve; 90 unchanged historical output references remain catalog/archive references absent from a source-only checkout. The initial findings and corrected scope are preserved; GitHub push alone is not CI success. The deployment PR records the exact documentation SHA and actual GitHub check links/results after upload.

[evidence-coverage.json](evidence-coverage.json) maps newly generated eligible receipts/logs/helpers/fingerprints to published bytes and explicitly records the one reference transformation. The generic scanner initially misclassified a non-secret API image digest constant in a historical helper as an API key; that reference now resolves the identical value from the included ECR receipt, with both original and published hashes retained. No scanner rule or exception changed. Protected AWS template/task snapshots contain runtime configuration and remain excluded; only sanitized summaries are published. Authentication state, credentials, private provider payloads and real-user records are excluded. Git source contexts and compiler/dependency caches are reproducible from the recorded commits and pinned image; they are not silently substituted for deployment proof. The original user checkout remains untouched.

Focused specification, product routing, current handoff, quality gate and append-only journey are updated. The pre-deployment handoff is [preserved as historical](../../handoff-history-20261022-node-source.md). No new approval or product decision was introduced, so no new decision-log entry is required; the existing October22 authorization remains applicable. This task completes the narrow container deployment. Managed-runtime uncertainty, remote-process proof and real-user/Apple outcomes retain the limits above.
