# October20 Git consolidation and publication-manifest repair

Status: REPAIR CANDIDATE / MERGE WAITING FOR CURRENT CI
Last updated: 2026-10-20 (Asia/Shanghai)

## Owner request and finding

Owner supplies Dot's screenshot reporting26 omitted verification files and asks to inspect and merge remaining GitHub work. The screenshot is an external report; this task independently fetches repository refs, PR state and actual Actions job results.

- Current integrated head: `bb6cb37e9755e1de4cb301e94ab2fdc39113fe3b`.
- Initial main: `3a5739ea87c022b390a39e05bebe4e0b1f17035a`, exactly200commits behind, with no main-only commit.
- All23 fetched remote branch tips, including main, are ancestors of the integrated head. There is no independent unmerged Dot source branch to import.
- No open PR existed. PriorPR1/2 are merged into earlier working branches; their changes are ancestors of the current head, not proof that main is current.
- [Reported run39250537407](https://github.com/tantalum666/rillora/actions/runs/39250537407) has successful API and Web/infrastructure jobs. The source job's tests and source-secret scan pass, then `verify_publication.py` fails its readable-file coverage assertion.
- Independent filesystem comparison reproduces exactly26 missing files: social banner, X link diagnosis, Apple review follow-up, marketing plan, Watch feasibility and conditional-disclosure receipts. There are no extra manifest rows or changed bytes among existing rows.

[Initial receipt](../collaboration/verification/git-integration-20261020/initial-review.json) records exact branches, SHA values and missing paths. [PR3](https://github.com/tantalum666/rillora/pull/3) consolidates the existing history into main without rewriting commits.

## Repair and review scope

Regenerate the complete readable manifest after all new receipts are written, then verify coverage, hashes, archive/LFS representation and the full readable secret scan. Preserve scanner policy and all existing exceptions; no file is removed to make the check pass. Prior encrypted archives remain immutable.

The earlier closeouts scanned source and isolated new evidence but omitted the global coverage check. AGENTS and source-control now require the complete publication check after the final receipt, plus readback of actual GitHub checks. This addresses the repeated workflow omission without adding hooks, skipping CI or weakening the verifier.

No application, infrastructure, tool or workflow source differs between the last mail checkpoint `bf203f17c` and the initial head; the intervening marketing configuration is documented planning data. The reported current-head runtime checks pass. The main integration contains previously reviewed work across200commits, not200new unreviewed feature commits. Review here covers branch ancestry, actual CI failure, manifest delta and merge-tree preservation; it is not a new repository-wide security audit, native test or live acceptance.

All three workflows were inspected: source validation, a trusted-base publication guard, and branch-scoped Web browser checks. None deploys or possesses cloud credentials. Merging changes repository state only; existing App14 review, manual release, TestFlight pause, prices, billing, real records and FanPass remain unchanged.

## Verification and final merge

Local publication validation, current PR checks, merged commit/tree equality and post-merge main state are separate receipts. At this candidate checkpoint the merge is deliberately not represented as complete. Final status will be updated after the checks and actual remote merge.
