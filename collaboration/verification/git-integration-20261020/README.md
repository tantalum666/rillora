# Git consolidation and readable-manifest repair — 2026-10-20

Status: CANDIDATE / FINAL CI AND MERGE RECEIPTS FOLLOW SEPARATELY

[Scope](../../../docs/git-integration-20261020.md) and [initial independent evidence](initial-review.json) distinguish the real26-file coverage failure from application failures. All23 fetched remote branch tips are already contained in the current working head; default main is200commits behind. PriorPR1/2 are merged, and[PR3](https://github.com/tantalum666/rillora/pull/3) consolidates history.

[Reading continuation](reading.json) retains the completed project Markdown chain. Full publication validation covers all readable files; prior encrypted archives are not resealed or represented as new plaintext verification. The existing local archives may be hashed by the verifier; CI can validate their LFS pointers.

AGENTS and source-control now require manifest regeneration/verification after the last receipt and actual CI readback. No guard or fixture exception is weakened, no hook is installed and no runtime/native/payment/deployment test is claimed by this documentation change.
