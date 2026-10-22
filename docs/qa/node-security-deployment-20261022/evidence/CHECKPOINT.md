# Node security deployment coordination checkpoint

Recorded 2026-10-22T01:30:02.339602+00:00. Staging deployment is complete and verified. Production deployment has not started. Paused at the parent-requested coordination boundary; no approval wait, no running CloudFormation operation, and no active technical blocker.

## Source and authorization gate

- Source PR: https://github.com/tantalum666/rillora/pull/5
- Reviewed head: `f95d99d90d3ae221d720f671ed70327b6233c443`.
- Merged main: `4347d7db803388a8f1308f76adcc9348b66d6584`; identical tree `ac57e2cf541b2ecc099d32d630f5caacfaa823d4`.
- Independently read all three required PR workflows plus merged-main Verify source as successful; see source-ci.json. No rollout occurred before the required gates passed.

## Actual completed work

- Read live staging/production stacks, templates, parameters, seven task-definition consumers, four services and task digests. Baseline snapshot was taken today, not inferred from historical documentation.
- Renewed the existing AWS login. Used only existing operator/deploy/CDK publishing roles and temporary credentials; no new service, persistent credential, permission grant or runner.
- Discovered three distinct live application baselines. Built three ARM64 patched images and compared application package, dependencies, dist, migrations and certificates against each actual old image: all files identical. Old runtime v22.22.3; patched runtime v22.23.4. See application-compatibility.json.
- Pushed all three images to the existing CDK ECR repository and read back registry manifests. Uploaded patched and rollback templates to the existing CDK assets bucket.
- Created, inspected and executed only the staging change set. Actual AWS TemplateBody matched exactly three Image edits. All parameters used previous values; other template fields identical. Derived task-definition references in services/maintenance broker/IAM resources updated without direct policy edits.
- Did not run migration, recovery or standalone deletion tasks, execute database changes, deploy Web or change feature flags.

## Staging final readback

- Checked at `2026-10-22T01:29:02.267803+00:00`: `UPDATE_COMPLETE`; actual template equals reviewed template and parameters equal baseline.
- Change-set ID: `arn:aws:cloudformation:eu-central-1:133857166372:changeSet/node-22-23-4-20261022-staging/bcdea9d7-d806-4b64-a8b2-f4c99c28129a`.
- The post-execution lookup by name returned ChangeSetNotFound. Completion is verified independently using the stack, deployed template, all three definitions and both services; the pre-execution review is preserved in staging-reviewed-changeset.json.
- All non-image task configuration fields match baseline. ECS compatibility metadata has identical set membership; ECS added derived attribute `com.amazonaws.ecs.capability.docker-remote-api.1.21`.

| Consumer | Before | After |
| --- | --- | --- |
| ApiTaskDefinition51EA709E | RilloraStagingApiTaskDefinitionF6347BA4:44 | RilloraStagingApiTaskDefinitionF6347BA4:45 |
| IdentityWorkerTaskDD5047F2 | RilloraStagingIdentityWorkerTaskE9CF37C5:1 | RilloraStagingIdentityWorkerTaskE9CF37C5:2 |
| MigrationTaskDefinitionE89B136E | RilloraStagingMigrationTaskDefinitionD83F7D18:37 | RilloraStagingMigrationTaskDefinitionD83F7D18:38 |

- RilloraStaging-ApiServiceC9037CF0-5g3SX8ZcaI5n: task `7d948f67815b40c995cd2e56a6ef7183`, COMPLETED, running/desired 1/1, pending 0, health HEALTHY.
- RilloraStaging-IdentityWorkerService1E7E1C54-mIyAUR2a39d1: task `ac976d0ff9d04d8d881154dd271ddeee`, COMPLETED, running/desired 1/1, pending 0, health UNKNOWN.

- Actual running digest, both services: `sha256:97d87dd1f5adad24a8b043c1eaf580041848f5f8c3ee2c43b7c37be16f958bb4`.
- ARM64 child manifest: `sha256:0c0e431884ca31228b3e24a2452595e99c68f6a1399c4360137a9f2689967b99`.
- API recent sample: 20 log events, zero error/fatal/retry/failed/failure keyword matches. Worker has no sampled log events; health UNKNOWN because it has no health check, not a claimed health PASS.
- Public fixed HTTPS checks passed 7/7, including both staging health endpoints and expected unauthenticated 401; production remained healthy. TLS verification remained enabled and no cookies or response bodies were stored. See staging-after-public.json.

## Production prepared, not deployed

Production remains UPDATE_COMPLETE with last update `2026-10-18T08:58:41.747000+00:00`. No production change set was created or executed.

- API image prepared: `sha256:62b440548b3e248ff236d845720cf598c93e9109f9e13cce5c3f7a22a9a5c68e`.
- Worker/migration/recovery image prepared: `sha256:341e86009284fed26f08cac62ac4c5e06b2b092b1dedbf9355c8e3e2ea2c5c1a`.
- Proposed production template changes exactly four Image fields, retaining distinct application baselines. It must still be verified against AWS's actual change-set TemplateBody before execution.

## Limits, failures and continuation

- ECS Exec is disabled. v22.23.4 was executed locally from the digest-linked artifacts; direct remote Node process readback was not performed and must not be claimed.
- Lambda GetRuntimeManagementConfig was denied by the existing operator scope. Four managed Node 22 Lambda functions were identified, but their managed patch versions remain unverified. Cloudflare compatibility runtime is separate and untouched.
- ECR DescribeImages using the deploy role was denied; the existing documented CDK image-publishing role supported BatchGetImage and the authorized push/pull workflow. No permissions were expanded.
- Generic health monitor was blocked by its reserved-address protection in this Mac's DNS/proxy environment. Separate fixed known HTTPS checks were used without changing that guard. An initial wrong MCP discovery path yielded 404; the repository-confirmed `/api/mcp` suffix passes.
- A premature post-deploy verifier ran while UPDATE_IN_PROGRESS and stopped. The next verifier initially flagged unordered compatibility metadata. After narrowly normalizing that set, complete readback succeeded; all metadata deltas remain recorded.
- Rollback templates and preparation helpers are saved. Rollback has not been run. `prepare_rollback.py` is still draft and must be reviewed before publication/use; it returns to vulnerable v22.22.3 and must only restore the reviewed Image fields.
- GitHub deployment handoff is not yet published. Working branch is `codex/node-security-deployment-20261022`; no tracked changes/commits yet. Generated receipts remain under this output directory and raw AWS snapshots under protected `.local/node-security-deployment-20261022`.
- Continue after coordination: inspect/execute production change set, verify four consumers and public checks, then finalize sanitized GitHub handoff and required repository publication checks. Do not repeat the merged source PR or rerun full cloud development/tests.
