# Node22.23.4 cloud validation receipt

Date: 2026-10-22 (UTC)
Base: main `5e4d6d6920e4d38b842f94f35832022057c1c2e8`
Scope: runtime pin, matching CI, benign request-decompression controls and handoff only.

## Executed checks

- Official Linux x64 Node22.23.4 downloaded from nodejs.org; SHA256 matches official SHASUMS256.txt. Tests used that binary, not the cloud machine's default Node24.
- Official container registry: independently hashed multi-platform manifest and selected linux/amd64 plus linux/arm64/v8 manifests/configs; both record Node22.23.4. [Receipt](registry.json).
- API npm ci with unchanged package-lock, typecheck and build passed. Full original API suite:64files/580tests passed against disposable PostgreSQL16.13 with en_US.utf8 locale and UTC timezone. Final patched suite:65files/588tests passed, including all8new transport controls; final typecheck/build also passed.
- Infrastructure typecheck and full test suite:9files/68tests passed with the current internal Web artifact.
- Web npm ci, internal, public, legal fixture and unpublished closed-client fixture builds passed; default build excludes optional AI. Web tests198/198, public SEO5/5, legal worker8/8, snapshot retention7/7, supporting health/client-package/maintenance/Auth0 fixture tests34/34 passed. Maintenance handler syntax passed.
- Full-body intake:380 unique project-owned Markdown files, canonical base Git blob hashes verified and complete line coverage recorded before implementation edits. Generated evidence/catalog/archive copies, dependencies, caches and build output were excluded. Detailed per-file ranges remain in the task QA working record.

- Python release/publication/native-source contract checks74/74, GoDaddy10/10, Auth010/10, collaboration9/9 and recovery-broker5/5 passed. Security suite:9checks,8passed and1existing environment skip.
- Prepared-source secret scan passed with32reviewed non-secrets and0unknown findings. Complete collaboration publication verification remains a separate real-CI gate, not implied by this result.
- Fresh independent read-only review found no actionable defects in the four implementation/CI/test files, independently verified upstream manifest/config hashes and ran the8controls plus typecheck successfully.

## Honest limitations and failed setup attempts

Initial database attempts failed because the service did not survive between cloud command sessions; an initial C-locale/Los_Angeles fixture then produced three environment-dependent ordering/time-window failures. Recreated a separate marked disposable database cluster matching CI's en_US locale and UTC; all580 original tests passed without application changes. This is not evidence of a product fix unrelated to Node.

Installed Chromium155 cannot create its required Unix socket in the cloud sandbox. Browser tests could not reach page assertions; an escalated launch also failed before execution. No sandbox bypass was attempted. The actual existing GitHub browser workflow must supply that gate; this receipt does not claim66 browser tests passed locally.

No Docker daemon/AWS deployment identity is available here, so the final ARM64 application container was not built or deployed in cloud. Registry config verification is not finished-container execution or production Node proof. Full collaboration publication verification needs the complete Git checkout; the partial connector materialization is not an equivalent exhaustive13,107-file scan. The publication manifest and security exceptions are unchanged and the real CI guard remains required.

## Original deployment handoff — subsequently completed

The cloud stage handed off actual CI readback and minimal ARM64 image deployment. Those steps were subsequently completed through the approved local route; see the [dated deployment receipt](../node-security-deployment-20261022/README.md) for all seven consumers, distinct application baselines, final digests, runtime proof limits and health. The three required PR checks and merged-main check passed. Existing normal GitHub CI was explicitly approved; no new runner/build service or cloud service was created. The checks above remain the original cloud results, not local reruns.

## Documentation closeout

Updated focused security specification, product routing, quality gate, current handoff, append-only decision log and project journey. Prior handoff is preserved as HISTORICAL. The decision entry is required because Owner prioritized cloud execution and approved only a limited local fallback and existing CI. No collaboration receipt, old archive, scanner exception, migration or product implementation was changed.
