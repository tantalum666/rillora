# Source control and release rollback

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
