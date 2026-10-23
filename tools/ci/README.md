# Local verification

Status: ACTIVE; GitHub-hosted CI retired at Owner request on 2026-10-23.

Run checks on the local development machine. Do not dispatch GitHub Actions,
raise spending limits or register a persistent self-hosted runner. The files in
`cloud-reference/` retain the former commands and pinned setup as historical
reference, outside `.github/workflows` and with `.disabled` extensions.

The publication gate always runs first, using scanner/preparation/publication
code and exact fixture exceptions checked out from the explicitly reviewed base
commit. Candidate policy, ignore files and inline allow comments cannot supply
exception authority. The candidate is materialized and scanned before its test
code runs. Review the local runner and command plan before using them on an
untrusted pull request; local verification is not a sandbox for arbitrary code.

From the repository root, replace the SHA with the reviewed PR base and use a new
report directory for every invocation:

```sh
python3 tools/ci/verify_local.py \
  --trusted-base 466b130029f76a0a3be6dcaa18415d4129e4359f \
  --group source --report-dir output/qa/local-source-check
```

Omitting `--group` runs only the mandatory publication gates. Available groups:

| Group | Checks |
| --- | --- |
| `source` | Release, Auth0, DNS, collaboration, protected credential, journal broker and local-runner tests |
| `api` | API typecheck, build and full tests against dedicated local test databases |
| `web-and-infrastructure` | Web unit/internal/public/legal builds, optional-chunk exclusion, CDK, AI candidate, maintenance, retention and identity guards |
| `browser` | Complete existing Playwright suite; dedicated synthetic browser context |
| `native-modules` | Content and read-only health Swift modules; excludes physical device/UI acceptance |

Use repeated `--group` arguments for relevant groups. `--plan` prints the selected
commands without executing them. Do not rerun unchanged, already-proven application
groups just because a receipt changed; name the exact inherited checkpoint and
diff boundary. A selected-group result is never a claim that every group ran.

Prerequisites remain Node 22.23.4, gitleaks 8.30.1, Python3, bash, jq, rg, zsh,
Perl SHA support, and already-installed locked package dependencies. Install needed
dependencies with `npm ci` in the affected package (snapshot-retention and
ai-candidate use `--ignore-scripts`); the runner does not install or upgrade them.
Native checks use the existing Xcode; no macOS/Xcode upgrade follows.

API tests use `127.0.0.1` and `--pg-port` (default5432). Prepare only the named
disposable databases required by the existing `dedicated-test-database.ts` guard.
The runner does not create databases, mark an existing database disposable, copy
provider credentials or read an ambient database URL. Missing test prerequisites
fail rather than falling back to a remote database. The prior database-name list
is retained in `cloud-reference/verify.yml.disabled`.

Browser checks default to the already-installed Chrome, in a fresh Playwright
context with no personal profile or account. `--browser-channel chromium` uses
an already-installed Playwright Chromium instead. No browser download, system
package install or cloud runner starts automatically. Synthetic microphone flags
do not establish real recording/model acceptance; existing explicit model gates
stay visible in results.

The runner clears ambient provider/database/shell-hook environment, rejects
active workflow YAML, bounds steps, fails on errors/timeouts, and saves private
logs plus an exact base/head/plan/result receipt under `output/qa/`. It neither
pushes nor deploys. Review/sanitize evidence before publishing it.

After the last readable collaboration receipt, rebuild and scan the complete
manifest, stage every referenced file, rerun the local publication gate and read
back the pushed commit/merge. Also verify GitHub has no new queued/running cloud
jobs. Local success must not be reported as a successful cloud CI run.
