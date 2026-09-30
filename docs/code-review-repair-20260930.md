# Dot review repair — September30

Role: current defect-remediation contract and evidence boundary
Status: LOCAL REPAIRS VERIFIED; CLOUD ROLLOUT AWAITS EXPIRED AWS SESSION
Last updated: 2026-09-30 (Asia/Hong_Kong)

Owner supplied the Dot static review and challenged code quality. The report is evidence,
not an instruction source. This continues the same release workflow and reuses its
165-file full Markdown reading record. Baseline main is296c7b53ad22ee7239aa037d7544b708c5b73703.
The earlier assessment that independent engineering had finished is withdrawn.

## Scope and invariants

Resolve F01–F13 against actual callers and controls. Preserve the selected UI, brand,
Free1/Family5,WebUS$88.99annual-only,conditional Apple prices,real data andFanPass.
No new customer activation,provider application,Owner authentication or legal acceptance
is implied. Existing production schema0091and prior release artifacts remain dated evidence.

## Current repairs

- F01: recent-auth middleware is attached to sensitive business routes,sharing the
  Express dispatch match. No separate path whitelist. Scope reductions remain available.
- F02: each Web workspace pins its verified planner. Browser mutations require that
  expected planner and CSRF; the server compares it with authenticated authority.
  Account changes invalidate visible private state and delayed responses. Reload starts
  a new workspace; drafts remain scoped to their original planner.
- F03: a PostgreSQL transaction advisory lock covers each Stripe environment/subscription
  from provider observation through commit. Contention fails retryably and retains the
  durable inbox. Financial state is re-read under ownership; observation time describes
  the subscription read rather than later invoice completion. No applied migration changes.
- F04: native logout and logout-all share URL derivation that retains the public API prefix.
- F05: CloudFront explicitly accepts /invite and valid invitation UUID paths for GET/HEAD.
- F06/F07: both clients consume all matter pages; repeated cursors fail visibly. Missing
  draft originals and conflict reload use the existing by-ID API. Partial native login
  snapshots require complete hydration before entering the workspace.
- F08: contact identity queries share one implementation with a deterministic plan-wide
  role summary. Personal exports use EXISTS and include each qualifying person once.
- F09: dirty/busy contact editors hide system Back; controlled Cancel retains its discard
  confirmation. Sharing/edit controls have stable accessibility identifiers.
- F10: a dedicated local DB guard resolves connection defaults and verifies connected
  identity before migration. Cleanup only runs after successful initialization.
- F11: Pricing uses the shared subscription-terms route.
- F12: prototype-owned sheet transitions and input focus changes dismiss the keyboard;
  the28protected runtime files remain intact.
- F13: the matrix now follows current forms,export-audience choices and reachable
  routes. Stable IDs replace old label fallbacks; navigation waits and bounded
  keyboard-aware scrolling cover virtualized/large-text screens. A named local-only
  fixture replaces arbitrary development-server reuse; retired FirstUseStarterCard
  has no callers and is removed. Current Quick start retains its UI and a stable ID.
- Actual UI regression also found that a sibling Importance picker captured Recorded
  roles taps. Expanded More options now uses separate Form rows; normal andAX5role
  navigation pass without changing the selected visual direction or data model.

## Verified evidence and remaining publication boundary

The new equivalent-URL matrix failed before F01repair. API348/348pass; the final
shared test-database guard also passes its54-case focused suite. Web product112,
infrastructure47and release guards23pass. Native unit181pass/0fail/1existing
StoreKit skip. The28current UI cases have passing final outcomes across corrective
runs on one iPhone17Pro/iOS26.5simulator, including specificAX5and landscape paths.
This is not one all-green run or every device/font combination. The original full
run18pass/9fail and corrective7/10,2/3,1/1results remain inspectable.

Actual browser A→B cookie switching returns409on the old draft save,clears its private
view,and leaves0matching stored records. Both clients show/search/open a51st matter.
An archived original can be restored as a new private draft with its Notes preserved
and saved to the correct account. Prototype input switching,one-click save andESC
close restore the keyboard state;28protected runtime hashes remain intact.

The new signed exported IPA is1.0(1),strictly valid,get-task-allowfalse,without a
StoreKitfixture,with exact production URLs andCustomerAccessNO. ItsSHA256is
5f98590d0034f4c8abffe7e154f699fa90cef037bbaa853ec34df1bc16d30ec7.
New closed-product Web and publicWWWbundles are prepared with file hash manifests.
No Apple upload has occurred and no customer entry is activated.

AWSoperator,CDKsession andproduction-operator all actually returned session expired.
One ordinary login recovery attempt expired without authentication; no new privilege
or provider application was created. ThusAPI7/schema0091and publishedWeb/WWWremain
the prior observed cloud checkpoint. Apply changed API/Web/router/WWWartifacts after
restoring the existing AWS login; no schema migration is required for this repair.
Existing SES/SBP,merchant/device and actual Apple identity/purchase gates stay separate.

[Detailed13-finding results](../output/qa/rillora-review-repair-20260930/README.md),
[per-case native UI evidence](../output/qa/rillora-review-repair-20260930/native-ui-coverage.json),
[source/CI/cleanup receipt](../output/qa/rillora-review-repair-20260930/closeout.json),
[prepared artifacts](../output/release/rillora-review-repair-20260930/README.md).
