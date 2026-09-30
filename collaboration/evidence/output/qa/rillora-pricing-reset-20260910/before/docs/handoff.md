# Rillora Current Handoff

Role: compact restart and execution handoff  
Status: FAMILY SHARED-MAINTENANCE PREVIEW IMPLEMENTED AND DEPLOYED  
Last updated: 2026-09-10 (Asia/Hong_Kong)

## Current Owner task and completed result

Owner asks to implement tangible Family value instead of more discussion. The
first complete shared-maintenance loop now works on API, Web and iOS:
owner request -> permitted recipient check/issue -> selected contributor's
provider/location suggestion -> owner approval -> real Matter + before/after
history -> persisted next review. [Focused contract](family-maintenance.md).

Web entry: authenticated sidebar/More -> Shared reviews. Native: Profile ->
Shared reviews. Receivers with active assignments land in their inbox. The owner
can share an account/inbox link without private IDs or grants; actual forwarding
is the user's action. An existing accepted sharing relationship is required.

Scope is deliberate: one contributor can suggest corrections for approval, not
edit the whole plan. History records approved review changes. Cadence/reminders
are in product; email/SMS/push delivery and real-event release are not implemented.

## Verification and deployment

- API:129 passes, including14 new review integration cases.
- Web:54 product/source tests plus7 legal-isolation checks on the proper separate
  artifact. Product build restored afterward; review UI lazy-loads.
- Native:129 unit passes/one existing StoreKit skip;5 final focused passes after
  model/wiring refinement. Later decorative icon adjustment built and visually checked.
- Infrastructure:10 passes. Browser desktop/390/320 and native A/B, dirty-close,
  history, cadence, AX5/Reduce Motion tested. Web also verified independent B/C.
- AWS two-phase update: migration task14 exit0; migration/runtime-role logs both
  successful; API task19 desired/running1/1, pending0, failed0, completed rollout
  and CloudFormation UPDATE_COMPLETE.27 HTTPS/asset checks pass.
- Remote flags: Family preview true, development auth false, prior Stripe test
  true, Apple Sandbox false. Ordinary sales and paid mutation remain closed.

[QA, tests, screenshots, video and readback](../output/qa/rillora-family-maintenance-20260910/README.md).
Normal Simulator launch is restored to cloud Debug with no actor/AX5 override.
Simulator: Rillora-Matrix-17-Pro, iOS26.5,
EA356940-5220-4AA8-89CF-499C6D5D14E4.
DerivedData: /tmp/rillora-family-maintenance-20260910-derived-data.
Web: https://app.staging.rillora.xyz.

## Current commercial truth

Permanent Free + one Family tier remains the contract; US$9.99/month or US$99/year
is unvalidated. Shared reviews now have implemented value, but the future paid
bundle is not all complete. Planned outgoing allowances remain Free1/Family5;
base sharing routes still do not enforce those commercial counts. The earlier
all-recipient live access after expiry proposal was superseded: the intended
lifecycle keeps one Free live recipient and authorized paid-cutoff copies for
others. Those accurate cutoff copies and base-sharing enforcement are not shipped.
Do not sell a lifecycle that does not yet exist.

## Next step — one bounded work item

Implement and verify the default-disabled commercial sharing lifecycle from
[monetization.md](monetization.md): accurate paid-cutoff copies, one selected Free
live recipient, atomic reservation/replacement and server checks on continued
access. Preserve free owner editing/export, restrictive privacy/revoke behavior
and existing recipient retrieval. Keep ordinary sales closed until that lifecycle
and the independent merchant/production gates are evidenced. The current preview
already supplies the shared-maintenance workflow; do not redesign it from scratch.

## Recovery and independent open gates

This continues the workflow whose full Markdown read covered55 files/16,011 lines.
Current/changed authority and relevant source/skills were recovered before edits.
After compaction, use AGENTS -> product -> this handoff -> latest decision ->
family-maintenance/monetization and changed files. Prior checkpoints are
[historical](handoff-history-20260910.md), not alternative next actions.

Real provider receiving-session proof, actual family delivery/WTP, physical-device
review, full co-owner editing, external notifications, all-plan history and live
billing remain separate. Do not restart completed AWS/Auth0 login-key work from
old notes. Use rillora-operator for CDK, rillora-cdk-deploy for CFN lookup and the
restricted staging operator for exact ECS/log operations; its missing broad list/
task-definition rights do not call for permission expansion.

Local synthetic preview artifacts/actor IDs are in the QA directory. API4210,
Web A4211/B4212/C4213, database continuity_family_preview; separate integration DB
continuity_family_test is disposable. These are not default product identities.
