# Source control and release rollback

Last updated: 2026-09-23 (Asia/Hong_Kong)

The private remote is [tantalum666/rillora](https://github.com/tantalum666/rillora).
The reviewed initial commit is `f7b797d89f5e1f1d63e37f7708fb2487c0265bb5`:
829 files, local/remote commit and tree read back, no Git submodules. The existing
Web commit `551b20f5468d03d301b3858fa3a8f14a38d43351` remains in place. Owner
separately confirmed adding only Rillora to the repository-scoped CLI token;
FanPass access and history were preserved.

Rillora uses a separate private repository under the Owner's GitHub account.
FanPass is a separate active project and must never be deleted, overwritten,
force-pushed or merged as part of Rillora work. The existing local `apps/web/.git`
is preserved in place; it is not published as a broken submodule. Use Git from
the Rillora root for the unified project.

Track application source, schema migrations, infrastructure, configuration
templates, product/operations documents and required licensed assets. Keep
credentials, real environment files, database backups, private account records,
raw QA/browser logs, dependency caches and compiled products outside Git. Links
to `output/qa` in historical documentation refer to restricted local evidence;
they are not a claim that those raw artifacts were uploaded to GitHub.

Prepare source with `python3 tools/release/prepare_repository.py` and scan it
with `tools/release/scan_repository.py`. Reviewed fixture/public-identifier
exceptions require an exact matching source-span digest. A changed/new finding
blocks publication; do not exclude entire test folders to make a scan green.
The scan is one check, not proof that every possible secret or personal datum
has been found.

For each deployed release, record the source commit, immutable image digest,
database migration/checksum floor, content format and validation result. Deploy
the tested artifact corresponding to that record. Git rollback restores code;
database recovery restores a quarantined database and replays deletion and
authorization state. Neither operation automatically restores AWS configuration
or KMS access. In particular, an API predating encrypted references cannot safely
serve the current encrypted database.

The initial source baseline is an unreleased engineering snapshot. A repository,
tag or successful build is not evidence of public release, payment readiness or
restore success. Production publishing remains governed by the existing gates.
Use short-lived, narrowly scoped cloud identities for any future CI deployment;
never place an AWS administrator key, database credential or recovery key in a
repository or workflow file.

## Automatic source checks

[Verify source](../.github/workflows/verify.yml) runs on main/codex pushes and
pull requests. It scans prepared source, tests publication/recovery guards,
runs the API against disposable local PostgreSQL databases, checks Web/legal
packaging, and tests infrastructure/health-probe code. Actions and scanner
downloads are pinned to verified commits/digests. The workflow token is
read-only and checkout credentials are not persisted.

CI has no AWS/Auth0/Stripe credentials and performs no cloud deployment. Legal
packaging is an unpublished fixture without real operator/address values;
production publication still requires its existing legal validation. iOS
archives, live providers, browser journeys and cloud recovery are separate.
A green run proves only the referenced source checks, not launch readiness.

Use Git from the root: `git -C apps/web ...` still addresses the preserved old
Web repository. Never force-push to resolve remote divergence. Review and
reconcile the commits instead. Raw local QA links are deliberately not all
resolvable from a fresh remote clone.
