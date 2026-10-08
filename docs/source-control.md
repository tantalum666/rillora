# Source control, complete work preservation and release rollback

Last updated: 2026-10-08 (Asia/Hong_Kong)

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

## October2 additive release acceptance preservation

The [release1/2/3 addendum](../collaboration/verification/release-123-20261002/README.md)
preserves new eligible QA, deployment receipts, restricted Web/native artifacts and
prior installed Debug bundle in two additional encrypted LFS archives. Its463-path
catalog is independent of the immutable September30 snapshot;305 objects were sealed
first, then one rendered client asset containing only published legal identity text
was classified separately and retained encrypted. No credential was included.

Readable QA references omit personal values and ambiguous public identifier fields;
exact originals remain sealed. Authentication UI/session state, actual credentials/
capabilities and reproducible caches remain explicit exclusions. The strict existing
archive verifier checked this addendum through an isolated metadata root; previous
archives were not rebuilt or redownloaded. Publication and remote/CI results are
separate receipts in that addendum. The old snapshot resolver covers its dated catalog;
use the addendum's own catalog for these new paths.

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

The later October2 continuation has a separate112-version/105-object addendum in
raw-work-010, including the prepared device app and updated acceptance receipts.
Its separate catalog preserves changed versions without replacing the earlier
463-path capture. Personal auth screens, credential/capability files, exact device
inventory and reproducible caches remain excluded. See the current addendum index
for local/remote verification and the completed-versus-pending account boundaries.

The later addendum was also read back from remote commit8987b2c8b, and its new
archive was freshly downloaded and decrypted/verified. Old archive readbacks are
retained without another download. Exact results are in followup-remote-readback.json
in the linked current addendum.

## October2 independent distribution and store-draft addendum

The [new addendum](../collaboration/verification/independent-release-20261002/README.md)
preserves111eligible file paths/109objects in raw-work-011,21,163,687bytes. The
internal TestFlight archive/local IPA, build/upload logs, safe Apple evidence and
four corrected dated package documents are included; previous archives are not
rebuilt. Signed artifact bytes and private-header screenshots stay encrypted only.
Source, current authority documents, redacted receipts and safe screenshots remain
directly readable. Generated extraction/publication copies and actual credential
stores are excluded explicitly. Local cryptographic verification and fresh remote
object verification have separate receipts; upload/Apple processing do not prove
an installation, transaction or public release.

The new archive was then freshly fetched from GitHub at e1a5054b16d29e8dff774e9420e259af472c24ca.
All109objects/111paths decrypted and verified against remotely read metadata.
[Remote receipt](../collaboration/verification/independent-release-20261002/remote-readback.json)
records this additional result without repeating earlier archive downloads.

## October3 strict-review additive preservation

The [strict-review addendum](../collaboration/verification/strict-review-20261003/README.md)
preserves1,433new eligible paths/934objects in raw-work-012, including QA/failed
attempts, result bundles and the five local build outputs. Archive originals are
14,412,702bytes; the encrypted archive is7,533,297bytes and locally decrypted/verified.
Existing archives remain immutable. Final publication/Git/CI receipts are directly
saved reviewed nonsecret originals, separately from the archive capture interval.
The current work branch is codex/strict-review-20261002; source review and remote
preservation do not deploy the new0092/0093 migrations or open customers/billing.

This addendum's new archive has now been freshly downloaded from GitHub and decrypted:
934objects/1,433paths pass. Latest reviewed source ef09d0b22f7586cf4e60d3039f986b6fe6c19d02
matches the remote review branch; [CI47](https://github.com/tantalum666/rillora/actions/runs/37056754027)
passes all three jobs. Thirty already-redacted browser/result references were explicitly
tracked after global cache/result patterns excluded them; no ignore or scan rule was
weakened. Staged readable file paths and bytes now exactly match the complete manifest.

## October3 reviewed deployment and native3addendum

The [rollout addendum](../collaboration/verification/review-rollout-20261003/README.md)
preserves312eligible paths/284objects (116,632,072raw bytes) in raw-work-013, including
new QA, signed native archive/IPA and the actually deployed review/public clients.
Encrypted bytes are51,343,122; local decryption/object/catalog checks pass. Previous
archives remain unchanged. Final source/publication and remote receipts are separate.
The deployed API/native application code is pinned to1ab6316a8 on the current
codex/strict-review-20261002 branch; do not assume oldmain describes the live runtime.
The later native source change only stores Owner-confirmed encryption declaration
metadata for future builds; the existing uploaded3was not rebuilt/re-uploaded.

The artifact commit94a4b8890292a4e1e0858e30328ec6839234f8c8 now matches the remote
branch readback. Raw-work-013 was freshly downloaded into separate empty LFS storage;
its exact ciphertext hash/size and all284objects/312catalog paths pass decryption
verification against metadata read from GitHub. [Remote receipt](../collaboration/verification/review-rollout-20261003/remote-readback.json).
Receipt-only follow-up changes preserve this immutable capture and the original CI47
scope; no previous archive, deployment, native upload or product suite is repeated.

## October4 real-core acceptance checkpoint

The [new addendum](../collaboration/verification/real-core-20261004/README.md) preserves
135paths/112objects (58143731original bytes) and the current Release simulator app
in raw-work-014. Local ciphertext/object/catalog verification passes. At that frozen checkpoint, native legal
confirmation and the remaining actual cases were pending. Later actual results are
recorded separately; the archive is historical, not the current execution gate. Auth handoff/session material and compiler
caches are excluded; previous archives are unchanged.


## October4 actual core follow-up preservation

The [follow-up addendum](../collaboration/verification/real-core-20261004-followup/README.md)
records completed actual scope/copy/recovery/revocation/logout, the observed native
reauthentication repair, CI48and uploaded/processed1.0(4). Its raw-work-015capture
includes only new/changed QA versions, the fixed simulator and new signed candidate;
unchanged archive14paths and earlier archives are retained. Recovery private keys,
authentication/MFA screens, runtime authentication logs and reproducible caches remain
excluded. Current disposable-account terms/import/delete and temporary-access cleanup
stay explicit pending items. Local/remote archive receipts are separate from product
acceptance; final receipt files follow the frozen capture without recursive resealing.


The follow-up archive is35,005,928bytes, covering387paths/262objects. A fresh remote
LFS download atbc9b502fbfe4de6f25f56c3e6794abcd1c3fae86 decrypted and verified them
against GitHub-read metadata. [Remote receipt](../collaboration/verification/real-core-20261004-followup/remote-readback.json).
Opaque public/wrapped crypto strings were removed from the readable package reference
when the scanner flagged them; the exact original remains sealed, and the unchanged
scanner then passed. The recovery private key was never part of either publication.


## October5 import, Web account choice and retained-account cleanup

The [October5addendum](../collaboration/verification/real-core-closeout-20261005/README.md)
preserves149eligible QA/client paths and149objects in raw-work-016,28,717,330encrypted
bytes. It includes the Web-only repaired artifact, actual import/recent-auth outcomes,
Owner's keep-account result and original3-access restoration. Irreversible deletion
was not submitted or claimed verified. Native4and previous archives remain unchanged.
Source5714ec158on the existing review branch hasCI54success; source/ciphertext/Git
preservation remain separate from public launch, physical purchases and deletion.


The new archive was freshly downloaded and decrypted/verified atd7aad3b38d02e172ff687088845b9481dd20b669:
149objects/149paths pass against GitHub-read metadata. [Remote receipt](../collaboration/verification/real-core-closeout-20261005/remote-readback.json).
Final metadata is preserved directly after the capture; no old archive, CI54, native4
upload or completed user journey is repeated for this receipt-only closeout.

## October5 Dot branch consolidation addendum

Owner requested follow-up of Dot's GitHub progress. The new `codex/dot-integration-20261005`
branch starts from03c97fcand merges all four fetched Dot tips without moving their
branches,strict-review ormain. Current handoff retains Owner's later keep-account choice.
[The addendum](../collaboration/verification/dot-followup-20261005/README.md) preserves
1,404paths/772objects in raw-work-017 (26,500,710encrypted bytes), locally decrypted and
verified. Exact originals include failed/passed Mac results,Simulator app bundles and
synthetic browser QA; readable screenshots/receipts are separately checked. No credential,
Keychain,provider session,real database or other project is included. Remote download/CI
receipts are appended separately; no previous archive or deployment is repeated.

Owner's subsequent Chinese copy request is preserved separately in [archive18addendum](../collaboration/verification/chinese-copy-20261005/README.md):625paths/383objects,25932470ciphertext bytes,locally decrypted/verified. Archive17remains immutable; original English/data/permission/price boundaries are retained.

Both new archives have now been freshly downloaded from GitHub and decrypted/verified at`747c98874b8517a5f41c1a6293ed6ca0eb4ee3a8`:17covers1,404paths/772objects;18covers625paths/383objects. [CI56](https://github.com/tantalum666/rillora/actions/runs/37279020925)is successful for that exact integrated source. Prior archives/source branches and production remain unchanged.

## October6 bilingual rollout and current-price Stripe Web addendum

[Archive19](../collaboration/verification/release-12-stripe-20261006/README.md) preserves
9,769eligible paths/1,541objects in581,672,952ciphertext bytes. Local decryption/object/
catalog verification passes. This includes new failed/passed UI evidence, signednative5,
exact deployed Web/WWW and actual Rillora TEST commerce results; prior archives remain.
Source10194de6a/CI58passes. Native5is Ready to Submit with saved/reloaded testnotes and
zero groups/testers. Public customers/live billing stay closed. Fresh remote archive
verification and final metadata are separate post-capture receipts, not repeat tests.

Archive19has now been freshly downloaded from GitHub at557af9f11a19ca7af64fa4b04d76a9f756e9d697:
all1,541objects/9,769paths decrypt and match remotely read metadata. CI59passes that
artifact commit; CI58covers source10194de6a. [Remote receipt](../collaboration/verification/release-12-stripe-20261006/remote-readback.json).
Final receipt-only updates do not rerun product tests, deployments or Apple uploads.

## October7 device/purchase and simplified paywall increment

[Archive20](../collaboration/verification/device-config-20261006/README.md) adds3,102eligible
paths/677objects and141,191,492encrypted bytes. Local decryption passes. It retains
builds6/7/8, superseded render-fix artifact, exact tests/preview products and provider
receipts; real credentials, personal onboarding, raw device logs and caches stay excluded.
Source08afb3821/CI63passes. Build8 internal distribution and verified HKD888 Sandbox
receipt are separate from physical8/Restore, real Live charges and App Review. Fresh remote
download/decryption verifies677objects/3,102paths against GitHub metadata at3e46e5130;
previous1–19were not downloaded again. [Remote receipt](../collaboration/verification/device-config-20261006/remote-readback.json).

## October7 reviewed Dot integration preservation

[Archive21](../collaboration/verification/dot-integration-20261007/README.md) preserves7,314paths/
913objects and233,637,603encrypted bytes, including failed/passed native results, exact
compiled artifacts and four complete cloud browser ZIPs verified against GitHub digests.
The read-only archive20metadata correction is preserved; ignored build/test package
copies remain archive-only. Local decryption passes. Source5a547339a/CI73and20browser
scenarios plus actual Xcode checks precede [PR1](https://github.com/tantalum666/rillora/pull/1)
mergeeb5fb1a70. The merge tree equals the validated source. Fresh remote download/decryption
verifies913objects/7,314paths at06519bde8; every readable path is staged in Git, including
the final direct receipts. [Remote proof](../collaboration/verification/dot-integration-20261007/remote-readback.json). Previous20archives stay unchanged.

## October7 reviewed rollout addendum

[Archive22](../collaboration/verification/dot-rollout-20261007/README.md) preserves387paths/
274objects and55,533,496encrypted bytes. Local authenticated decryption and catalog/object
verification pass. It includes the exact new signed9artifact, failed/successful deployment
logs and three live client builds. Previous1–21are immutable. Current production API16and
same-identity expiry renewal, native9upload, later distribution/physicalRestore and public
customer/Live activation each retain separate evidence. Remote verification follows as a
post-capture receipt; actual credentials/authentication/private cloud readbacks are excluded.

Current rollout work is preserved on `codex/dot-rollout-20261007`, based on58fadf357.
This does not move the older main checkpoint or rewrite the merged source branch.

Archive22was freshly downloaded and decrypted/verified at7d4189371b4c440a5c3dbbec832f03c5d12e69b5:
274objects/387paths match GitHub-read metadata. [Remote receipt](../collaboration/verification/dot-rollout-20261007/remote-readback.json).
Final metadata commits do not rebuild, upload or deploy the same product again.

[CI75](https://github.com/tantalum666/rillora/actions/runs/37525238866)passed all three jobs
for7d4189371. Final metadata receipts retain that exact result without claiming a new
iOS build, cloud deployment, transaction or source-test rerun.

## October8 native correction and wireless direct delivery

[Archive23](../collaboration/verification/direct-device-20261008/README.md)preserves4,208eligible
paths/507objects and157,419,068encrypted bytes, including original failures, tests,
signed10/11and the direct development export. Local decryption and object/catalog mapping
pass. Sourcec0cec8680and the current branchcodex/apple-plan-restore-20261007preserve the
fix; direct-device signing/install and Owner content confirmation are separate evidence.
Private credentials/raw device logs stay excluded, developer artifact remains encrypted
only, and no previous archive is rebuilt or redownloaded. Final receipts follow the capture.

Archive23is published at a14c7bb74b29ed04b1961b34303af62c9b508456 on
codex/apple-plan-restore-20261007. A fresh separate LFS download from GitHub and
authenticated decryption verify all507objects/4,208paths against metadata read from
that exact remote commit. [Remote receipt](../collaboration/verification/direct-device-20261008/remote-readback.json).
The final account investigation and wired-or-wireless preference are separate readable
receipts; the encrypted capture is not resealed. These documentation changes do not
repeat native/cloud deployment, payment tests or earlier archives.

## October8 matter category refinement and direct update

[Archive24](../collaboration/verification/matter-categories-20261008/README.md) preserves3,251paths/
364objects and98,028,452encrypted bytes for source35f37e1b2 on codex/matter-category-bar-20261008.
It includes the supplied screenshot, actual synthetic UI captures, bilingual category/search
results, test packages, Release archive, development export and install/readback/launch records.
Local authenticated decryption passes; earlier archives are immutable and not downloaded again.
Remote publication and fresh-download verification follow separately. No TestFlight distribution
or provider deployment is implied by this source/artifact preservation.

The completed [remote receipt](../collaboration/verification/matter-categories-20261008/remote-readback.json)
verifies archive24at efc22209a99038d84e5523165595dd0ea81d0cef: all364objects/3,251paths
match metadata read directly from GitHub and a fresh separate LFS download. Earlier1–23
were not fetched again. Final receipt commits do not change the installed source35f37e1b2.
