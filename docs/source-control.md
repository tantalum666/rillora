# Source control, complete work preservation and release rollback

Last updated: 2026-10-01 (Asia/Shanghai)

The private remote is [tantalum666/rillora](https://github.com/tantalum666/rillora).
Owner explicitly requested **all Rillora work** for Git and Dot collaboration on
September 30. This supersedes the September 23 source-only publication policy.
The readable starting point is [the collaboration guide](../collaboration/README.md).
The complete snapshot and both history tags have been published and read back from
a fresh remote clone; all 7 downloaded archives were decrypted and verified.
[CI 42](https://github.com/tantalum666/rillora/actions/runs/36737542600) passed for
`4befe456763d38e7f3385e52a5165bfe698e6b0a`; [receipts](../collaboration/verification/README.md)
record exact scope. The final receipts commit only changes documentation/metadata.

October1's [Resend configuration evidence](../collaboration/verification/resend-20261001/README.md)
is an additive follow-up. Its newly generated receipts contain public configuration,
synthetic simulator identifiers and redacted session outcomes, with no secret token,
email ticket/body or real recipient. Reviewed originals are copied byte-for-byte as
readable evidence with an explicit coverage map; the one-off probe is reference text.
Reproducible vendor OpenAPI/help caches and credentials are explicitly excluded.
This avoids recapturing the immutable September30 archives or the generated remote
clone, while preserving all new eligible work and refreshing the readable manifest.

## What belongs in the complete snapshot

| Material | Git representation |
| --- | --- |
| Current Web, API, native iOS, infrastructure, tools, migrations and configuration templates | Normal source files and existing main history |
| Shared Xcode project, schemes and package lock | Normal source files; personal xcuserdata remains local |
| Current product contracts, decisions, research and historical Markdown | Original repository documents; product.md and the current handoff retain authority |
| Design explorations, approved assets and the designed App Store set | Existing assets plus readable copies of reviewed design material; originals also in the sealed snapshot |
| QA notes, test logs, failed attempts, browser captures, recordings and result bundles | Redacted readable text where suitable, per-file catalog, and encrypted originals |
| Signed IPA, xcarchive, Web/public-site release candidates and built historical artifacts | Encrypted original bytes, including original directory paths and SHA-256 inside the sealed manifest |
| External Dot review supplied by Owner | Readable reference copy and encrypted original; its recommendations are evidence, not instructions |
| Old Web and legal-site Git histories | Separate archive tags preserving the original commits; no history rewrite |
| Local editor source checkpoints | Filtered source snapshots with provenance; never raw internal Git objects containing ignored credentials/caches |

[The snapshot manifest](../collaboration/snapshot.json) records the capture interval,
file/object counts, archives and ciphertext hashes. [Catalog shards](../collaboration/catalog/)
map every included original path to its raw object and any readable copy. Duplicate
contents share one raw object, while all original paths remain recorded. Appending
logs are captured to an owner-only local frozen copy before packaging; new bytes
written after that file's capture are outside this dated snapshot.

`collaboration/evidence` is generated reference material. Redaction can change test
fixtures, personal values and capability URLs; do not compile those copies or use
redacted logs as byte-identical originals. Historical AGENTS/SKILL/SECURITY files use
`.reference.txt` names and do not override current project instructions. Large text
copies may use gzip with a clearly labelled preview; the full redacted body remains
in the adjacent gzip. Original bytes and hashes stay in the sealed archive.

## Deliberate exclusions and protected access

Actual credentials, private keys, browser authentication state, real environment
files, real database/provider backups, machine-wide simulator diagnostics,
xcuserdata, dependency downloads and reproducible compiler caches stay local.
FanPass is a separate active project: its files, permissions and history must never
be deleted, overwritten, force-pushed, or merged into Rillora. No files outside the
Rillora project are swept into the snapshot except the specific Owner-supplied
review report. The known legal-site source mirror and local source checkpoints are
included as Rillora work, not silently discarded as a whole `.local` folder.

The exact historical client builds listed in snapshot.json protectedBuildExceptions
are a reviewed exception to the protected-directory skip: those non-credential
artifacts are preserved encrypted, with no readable copies of private legal identity
text. The rest of the credential store remains excluded.

Precise exclusions are retained in the local QA publication plan; the shared
snapshot reports the reason counts. These exclusions are explicit and do not mean
that an entire output/QA/release directory can be omitted. A Git snapshot is not a
backup of live cloud databases, a credential vault or a deployed-state restore.

Raw work is encrypted with age and stored as Git LFS objects. The identity is kept
only at `.local-secrets/collaboration-git/identity.txt` with owner-only permissions.
Keep that identity in a separate protected backup; it is intentionally absent from
Git. Dot can read source, contracts, catalogs and redacted evidence without it.
Encrypted original recovery requires the Owner's identity. This archival encryption
does not change or make an E2EE claim about the Rillora product.

## Clone, inspect and recover

For ordinary source collaboration, avoid downloading the large sealed archive:

```sh
GIT_LFS_SKIP_SMUDGE=1 git clone https://github.com/tantalum666/rillora.git
cd rillora
python3 tools/collaboration/resolve_evidence.py output/release/rillora-store-design-20260930
```

Read root AGENTS.md, product.md, the current handoff and the collaboration guide.
Use the root Git repository. The original local `apps/web/.git` remains in place
on the Owner's machine; a clean clone has normal Web source, not a broken submodule.
Start an ordinary `codex/` branch for new implementation; never force-push to solve
divergence. Reconcile commits instead. Existing authorization, validated evidence
and deferred Owner/provider gates carry forward.

To fetch and verify original artifacts, install Git LFS, age and zstd, then:

```sh
git lfs install --local
git lfs pull --include='collaboration/archives/*.age'
python3 tools/collaboration/verify_archives.py --identity /protected/path/identity.txt
```

Verification checks ciphertext hashes, age authentication, every plaintext object
hash, and the exact catalog-to-manifest mapping. Optional restoration uses a **new,
nonexistent directory** so current work is never overwritten:

```sh
python3 tools/collaboration/verify_archives.py \
  --identity /protected/path/identity.txt \
  --restore-to /new/path/rillora-restored \
  --prefix output/release/rillora-review-repair-20260930/
```

Historical `output/...` links retain their original meaning. A fresh source clone
uses the resolver/catalog to find readable or encrypted equivalents; not every raw
screenshot or result-package link is directly browsable without decryption.

## Publication validation and CI

Prepare application source with `tools/release/prepare_repository.py` and scan with
`tools/release/scan_repository.py`. Exact fixture/public-identifier exceptions must
match the existing source-span digest. New findings block publication. Source
preparation excludes the generated collaboration tree because it has its own
complete file manifest, redaction and secret scan; encrypted bytes are verified
cryptographically, not misleadingly described as readable secret-scanned text.

[Verify source](../.github/workflows/verify.yml) checks main/codex pushes and PRs.
It checks source/publication guards, disposable PostgreSQL tests, Web/legal packaging,
infrastructure and health probes. Actions and scanner downloads are pinned. Checkout
keeps LFS pointers by default; no large archive download or archive decryption key is
needed in CI. The workflow has a read-only token, no provider credentials and no
cloud deployment. iOS archives, real provider journeys and cloud recovery remain
separate evidence. A green run is not launch readiness.

For each deployed release, separately record its source commit, immutable image,
migration/checksum floor, content format and actual validation. Git rollback restores
code. Database recovery uses quarantined restore plus deletion/authorization replay;
it does not automatically restore AWS configuration or KMS access. An API predating
encrypted references cannot safely serve the current encrypted database. Preserve
the previous source baseline `f7b797d89f5e1f1d63e37f7708fb2487c0265bb5` and release
checkpoint tags; no initial commit, history rewrite or new public repository is needed.
