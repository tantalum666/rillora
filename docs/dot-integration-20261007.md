# Dot branch integration review — 2026-10-07

Status: LOCAL INTEGRATION VERIFIED IN PART; FINAL NATIVE UI/RELEASE AND GITHUB MERGE IN PROGRESS
Updated: 2026-10-07 (Asia/Hong_Kong)

Owner requests reviewing the latest GitHub work, fixing issues and merging if sound.
This supersedes the earlier cloud-only/no-merge scope. Existing release authorizations,
prices, real data and build8 remain; no deployment/real mail/purchase is performed.

## Exact sources and scope

- Operator baseline: e95007878729352c852b9bf411138e07c0361a1e
- Shared identity:8cc5e10042d5c9f3688b1093306b2e4377a92c82
- Native head:3c6e05b1c, includes the identity foundation and complete operator baseline
- Web head:75d4d7d9f, shares the same identity commit, integrated without duplicate patches
- Review branch:codex/dot-integration-20261007; target is the current release branch
  codex/device-config-20261006, not the older main checkpoint.

Review covers all incoming runtime changes: additive identity API/auth middleware,
read-only provider proof and revocation recheck; Swift/React lifecycle/old-server fallback;
explicit SDK reset and mock transport; guide phases/source provenance; native settings,
category/locator semantics and disclosure motion; Web header/locale/history/provider
fallbacks; Xcode/source registration, tests, workflows and archival metadata. Existing
product contracts are retained; incoming new Markdown and affected deltas were read.

## Findings and fixes

1. Native Safety & privacy failed real compilation: Section(title) with footer has no
matching SwiftUI initializer. Use explicit content/header/footer. Product behavior unchanged.
2. New AccountIdentityTests could not compile because the reused overview fixture was
file-private. Make that synthetic XCTest fixture available within the test module only.
3. The unrun category UI test made two invalid reachability assumptions: decorative
ContentUnavailableView image must accept taps, and native navigation-bar search must
sit below the bar. Verify the real Show all categories action and actual tappable search.
Screenshots show the product controls were already visible; assertions are retained.
4. Regenerate Xcode project from its committed spec. Added-file object references are
now canonical; only two existing public-identifier scanner line positions move, with
identical source-span hashes and no new exceptions.
5. Preserve Dot's archive20 readable-metadata correction. Move25ignored local generated
copies out of collaboration so regenerating a manifest cannot recreate their false Git
availability. All original3,102raw records and ciphertext remain unchanged.

## Evidence and remaining work

- Real native unit run:272pass/0fail/1known StoreKitTest platform skip;49new tests executed.
- Web174pass, API typecheck/build and17focused identity/proof pass;66release guards pass.
- Initial native UI:guide and identity/settings pass; category test failures above retained.
- Dot CI62, CI70 and20/20 browser job independently read back through GitHub connector;
  their historical scopes are retained, not claimed as a new local browser run.
- New native final UI/Release results and merge/preservation receipts follow here.

No iOS upload, cloud deploy, Auth0 setting, live reset email, real transaction, review
access extension, retained-account deletion or FanPass change. Review access expired
2026-10-06T17:08:57Z; testing here is isolated synthetic loopback and simulator only.

Raw results: `output/qa/rillora-dot-integration-20261007/`. Current release state remains in [handoff](handoff.md).
