# October22 Node security runtime upgrade

Last updated: 2026-10-22 (UTC)
Status: STAGING AND PRODUCTION CONTAINER UPGRADE VERIFIED; MANAGED RUNTIMES SEPARATE

## October22 deployment result

[Actual deployment receipt](qa/node-security-deployment-20261022/README.md) completes the approved staging-then-production rollout. All seven task definitions use patched ARM64 images; all four services are stable, both APIs healthy, and fixed public checks pass7/7. Three distinct application baselines were preserved byte-for-byte. Actual ECS digests match ECR artifacts executed locally asNode22.23.4; ECS Exec remains disabled, so this is not a direct remote-process version query. No migration/recovery task, database change or Web release occurred. Separate managed Lambda patch status remains unknown.

## Scope and security basis

Owner requested the security upgrade, deployment, and a GitHub handoff, with cloud preparation first and notice before quota/cost use. A narrow local deployment/online-verification fallback was subsequently approved. This document does not authorize new resources, changed permissions, or unrelated release work.

[Node's October21 advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) identifies the Brotli native decoder issue CVE-2026-111497 and patched Node22.23.4. Rillora's two API image stages and all three CI setup-node version fields used22.22.3. The shared Express JSON parser accepts compressed input before planner authentication; both `/v1` and `/api/v1` are relevant. Absence of a login does not remove this runtime exposure. No PHP runtime/application was found in this scoped repository; that is not a claim about other services or the Owner's computer.

Change only these active pins to22.23.4, without a major-version or npm dependency upgrade. Keep the existing parser/authentication behavior and body limits. The safe transport regression covers identity, Brotli (including uppercaseBR), gzip and deflate, both API aliases and JSON media types, invalid decoded JSON, and the decoded body-size limit. It contains no exploit payload. Compatibility controls are not a native exploit reproduction; remediation rests on the verified official patched runtime.

## Immutable upstream image

Both stages use `node:22.23.4-bookworm-slim` and multi-platform index:

`sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d`

Registry manifest bytes were independently hashed; Docker Hub metadata agrees. Selected linux/amd64 and linux/arm64/v8 configs both state `NODE_VERSION=22.23.4`. See [registry receipt](qa/node-security-20261022/registry.json). Preserve production's ARM64 architecture. The upstream index digest is not the digest of the finished application image; record the latter after the local build and ECR push.

## Source baseline versus actual deployment

This patch is based on main `5e4d6d6920e4d38b842f94f35832022057c1c2e8`. A GitHub comparison against the last documented API deployment commit `c6beccfdeab7c0274941fe24d986ab0c9b69bb3c` shows no `apps/api` or `infra` changes before this patch. Main is16commits ahead overall, so do not deploy the consolidated Web or other unrelated assets merely because main is newer.

The October18 canonical deployment receipt records an API-only rollout, verified at2026-10-18T09:09:56Z, application image digest `sha256:1985c37321fd8bd22b585410d3b88005b89a6a272234a566cc57062b0f47f071`. This is historical evidence, not an October22 live readback. The documented production schema is106; do not run migrations or treat staging's older schema record as permission to update it. Existing customer MCP is already production functionality; conditional disclosure remains future design.

## Safe deployment handoff

1. Read the exact current CloudFormation templates/parameters, ECS services, running tasks and all relevant task definitions with the existing deployment identity. Establish actual image digest, application baseline and architecture for each consumer. Stop if application state differs from the documented baseline in a way the minimal runtime-only patch does not preserve.
2. Inventory all seven existing image consumers: production API, identity-deletion worker, migration task and recovery task; staging API, identity-deletion worker and migration task. Do not silently stamp a newer application build onto an older worker baseline. Where code differs, build the runtime-only patch against that consumer's current source and preserve its application behavior. Updating a maintenance task definition is not permission to run migrations, deletion, or recovery tasks.
3. Build the reviewed API context locally for `linux/arm64` using existing Docker and the pinned upstream image. Do not upgrade the Mac's Node installation. Verify `node --version` in the finished image, preserve source/build evidence, push to the existing ECR repository and resolve its immutable application digest. Use existing resources only; do not create CodeBuild, new CI runners or deployment credentials.
4. Create a minimal image-only change from each actual deployed template or existing verified narrow procedure. Production's source guard rejects `productionRuntimeImageTag` when review or live runtime is active; do not bypass the guard by disabling live/review or prescribe that context blindly. Preserve every non-image field and existing Web asset reference. Preserve parameter values, using previous values for NoEcho fields rather than masked readbacks. Keep desired counts, architecture, environment, command/entrypoint, secret references, IAM, network, strict TLS and CA pin unchanged.
5. Inspect the actual AWS change set and its `TemplateBody`, not merely local synthesized output. Reject unrelated Web/CDN, database, IAM, networking, pricing/flags, identity, Apple or conditional-disclosure changes. Existing rolling replacement can cause ordinary temporary Fargate/ECR usage; new resource provisioning or nonroutine paid build work requires prior approval.
6. Roll out and wait for stabilization. Verify public API health/readiness, running task image digest and actual Node22.23.4 runtime. Identity-deletion workers have no ECS container healthcheck, so expected `UNKNOWN` health is not evidence of failure or `HEALTHY`; verify RUNNING status and no startup/retry errors separately. Check that every inventoried task definition references a patched image without launching one-off maintenance work.
7. Preserve prior compatible images/task definitions and exact rollback parameters. Prefer a patched compatible prior application build if rollback is needed; reverting to22.22.3 reintroduces the security issue and must be explicitly reported. Do not roll back data/schema or use an obsolete pre-hardening image.
8. Append a sanitized, dated deployment receipt to the GitHub handoff: actual source commit, finished image digest(s), task-definition/service references, runtime readback, health, retained flags/data and any unpatched consumers. No credentials, signed URLs, raw private records, or masked values presented as proofs. Source/CI success alone must not be reported as production remediated.

The actual deployment inventory found four separately managed AWS Node22 Lambda functions, correcting the preparation estimate of three. Their runtime-management read was denied under the existing operator scope; update mode and patch version remain unverified, without permission expansion. This container patch does not upgrade Lambda. Cloudflare compatibility mode is independent and unchanged. The original cloud preparation could not produce deployment proof; the subsequent approved local deployment supplies the bounded artifact/live-task evidence above.

## Validation and evidence boundary

See [validation receipt](qa/node-security-20261022/README.md). Lockfiles, SQL migrations, application source, infrastructure source, security scanners and publication exceptions are unchanged. Browser/complete-publication CI must remain enabled. Do not create a release by skipping failed gates. Historical handoff is [preserved](handoff-history-20261022-before-node-security.md); future feature work is deferred until this runtime upgrade is verified.
