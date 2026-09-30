# Signed-in surface/motion QA — 2026-09-17

Status: COMPLETE — SCOPED REFINEMENT VERIFIED AND PUBLISHED

## Scope and full reading

Owner's current request is consistent signed-in cards, better child-page feedback and commercially usable motion/components. Preserve Graphite / Prepared Folio, navigation and Profile grouping. The active task supersedes the previous monitor-next handoff without reopening its completed B/Stripe checks.

All78 owned Markdown files,19,271lines and269 full-body chunks were read before implementation. Excluded dependencies/caches/build products/third-party packages and generated output evidence. Exact manifest/exclusions/ranges are in [reading.json](reading.json), [chunk ledger](reading-chunks.json) and [completion](full-read-completion.json). No file changed during reading. Compaction reused this record with focused recovery only.

## What changed

Shared neutral card material and icon plates replace mismatched green/near-black card families. Native List and Form rows share the material; Profile, plan/data/support/sharing/review subpages retain their existing tasks. Short disclosure/press/icon-entry/real-state feedback respects Reduce Motion. Web data tools and plan disclosures have clear, roomy controls. No new library, paid asset, fake record, recurring animation or product text stack was introduced.

Rendered QA also caught and fixed the planned-feature narrow-column defect, outdated Free quota wording, and category-selection browser-history bug. Before the history fix, choosing Crypto then confirming discard returned to the blank Account editor. After the fix, Keep editing preserves Crypto and confirmed discard returns to `/?view=matters` with no editor. No record was saved in this check.

[Implementation patch](implementation.patch), [source list](source-changes.json), [rendered observations](rendered-verification.json).

## Tests and visual evidence

- [Native tests](native-tests.json):152 passed,0 failed,1 existing local StoreKit skip; new shared components compile without warnings/errors.
- [Web suite](web-tests.log):78 pass,0 fail after the final history fix. [Release build](web-release-build.log) passes; pre-existing chunk-size/HPKE build warnings are not runtime errors. [Sites worker check](sites-tests.log):4 pass (overlaps the overall suite, not4 additional unique tests).
- Native normal-size Profile, Plan access collapsed/expanded, My data, Open saved copy, Safety Keep/Leave out and Shared reviews tabs were operated. AX5/reduced-motion Plan disclosures retain full wrapped labels and semantic state.
- Web Settings and Plan cards compute to `rgb(37,44,41)`.320/390 layouts show no horizontal overflow in checked pages; changed action rows are76px tall. At reduced motion, new emblem/disclosure animation names are `none` and chevron transition duration is0s. Native reduced motion uses the explicit QA override. No physical VoiceOver certification is claimed.
- Web review settings opens/closes with Escape; matter requirements keep Save disabled; Crypto fields remain category-specific; input color computes to `rgb(218,216,207)`. Local console capture returned no errors/warnings.
- [Before native Profile](before/ios-qa-profile.jpg); [after Profile](after/ios-profile.jpg); [Plan access](after/ios-plan-access.jpg); [expanded](after/ios-plan-expanded.jpg); [AX5 expanded](after/ios-plan-ax5-expanded.jpg); [My data](after/ios-my-data.jpg); [Safety](after/ios-safety.jpg); [review inbox](after/ios-review-inbox.jpg).
- [Actual native motion recording](after/ios-disclosure-motion.mp4):19.615seconds,1 video track. Web screenshots were visually inspected in the browser tool; they are not represented as saved PNG files.

## Publication and cleanup

Final existing-staging Web deployment completed with asset `f02cb4edb734a81fd0cea5f2f19e55158bdf1078a65ee8686ac25042923c75ed.zip`. Both deployment diffs contained only the WebDeployment asset key. The first visual artifact was superseded by the final category-history correction. [Final publish log](aws-web.log), [initial visual publish](aws-web-initial.log), [final diff](aws-diff.log), [17/17 HTTPS and exact asset checks](aws-http-verification.json). API30 is retained; fresh [ECS readback](ecs-state.json) shows desired/running1, pending0, completed rollout and regular FARGATE. No API image, migration, auth service, legal site, permission or billing flag changed.

Ordinary cloud Debug is installed/running in Matrix17Pro with env{} and no developer identity. Its expired session remains the normal public entry; no new Owner login is claimed. The isolated Matrix13 simulator is shut down, local API4290/Web4291 are stopped, browser viewport/media overrides are reset and the temporary browser tab now shows the published staging public entry. The named synthetic local database is retained for repeatable QA; no real A/B relationship or account was modified. No Git commit, branch, stash or new runtime dependency was created.

## Documentation

Changed contracts: [DESIGN](../../../DESIGN.md), [interaction](../../../docs/interaction-experience.md), [invitation/motion](../../../docs/invitation-motion-ux.md), [account/matter](../../../docs/account-matter-ux.md), [focused refinement](../../../docs/surface-motion-20260917.md), [asset licenses](../../../docs/asset-licenses.md) and [Web instructions](../../../apps/web/AGENTS.md). Product/README/design QA point to the current checkpoint. The Owner's new surface/motion scope requires an appended decision; category exit is a narrow defect correction under existing repair authorization. Handoff is replaced and the previous handoff archived HISTORICAL; journey is appended. Link/date/state validation is recorded separately before final response.

## Boundaries

No API, identity configuration, legal wording/version, entitlement or sharing authorization changed. Real A/B revocation remains the earlier checkpoint and is not recreated. No new external message, paid asset, real charge, production sale, physical-device run or current real-login ceremony. Figma membership was not treated as a reusable-asset license. The native ordinary session had already expired before this visual work; no QA identity replaces it. Monitor delivery/activation and Apple/merchant/production evidence remain outside this task.
