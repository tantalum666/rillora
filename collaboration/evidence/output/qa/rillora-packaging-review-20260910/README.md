# Free / Family packaging and Markdown continuity review

Date: 2026-09-10 (Asia/Hong_Kong)  
Scope: current product contract, implementation audit, source research and document alignment.  
Status: COMPLETE — 57 Markdown files / 247 local links checked; no failures.

**Later same-workflow correction:** the Owner challenged the expiry proposal.
The initial all-recipient live-read survival below is superseded by one Free live
recipient plus eligible paid-term saved versions. See [the follow-up record](expiry-followup/README.md)
and the current commercial contract. Counts in this initial report belong to its
10:17 checkpoint; they are not a fresh verification of the later revision.

## What the Owner asked

Read all project-owned Markdown before new work, recover concisely after
compaction, and update focused specifications, decisions, handoff and journey.
Check prior Free/paid discussions and define an offer that could earn payment.

## Reading evidence

- 55 files, 16,011 lines, completed before product/doc edits at
  `2026-09-10T09:51:27.476735+08:00`.
- `reading.json` retains full source chunks and 189 acknowledged ranges;
  `full-read-completion.json` retains inventory, per-file hashes and completion.
- Dependencies, caches, build outputs and generated `output` evidence excluded;
  nested AGENTS, project specifications and historical Markdown included.
- Truncated handoff/journey ranges were reread. Hashes only prove source stability,
  not that reading occurred; the full chunks and acknowledged coverage are separate.
- Compaction recovery reused the completed read and read current/focused sections.
- The original 1,121-line handoff is preserved verbatim after a historical preface
  in [the archive](../../../docs/handoff-history-20260910.md). Active handoff has
  99 lines and one next item. This removes competing old execution gates.

## Source audit and implementation truth

| Source | Observed fact | Product implication |
| --- | --- | --- |
| `apps/api/migrations/0022_provider_neutral_commerce.sql:652` | Free trusted-person allowance 1; Family multiple-person planned/null and co-planner 1 | The one-person idea already exists; null planned allowance is not an unlimited promise |
| `apps/api/src/commerce-routes.ts:171` | Shared versioned catalog/current access/billing state result | Copy or provider callback cannot independently grant access |
| `apps/api/src/app.ts:139`, `sharing-routes.ts:133` and `routes.ts:592` | Authenticated routes; contact/share creation has no commercial allowance check | Newly implemented B/C sharing does not enforce Free's catalog cap |
| `apps/web/src/commercialAccess.js:33`, `App.jsx:185` | Free included list, planned Family list, closed billing | Presentation is preview, not purchased access |
| `apps/ios/Rillora/Features/Account/PlanAccessView.swift:37` | Free feature disclosure and Family not-available disclosure | No live purchase capability from this surface |
| `apps/api/src/identity.ts:119` and native authentication scopes | Email is now requested for verified target matching | Old “email scope unused” wording was stale |

Fingerprints of the referenced source files are saved in `code-audit.json`. This is a source
audit, not a fresh live tenant, database, browser or payment readback. Prior runtime
evidence remains [the sharing QA](../rillora-trusted-sharing-20260909/README.md).

## Initial packaging result — expiry rule superseded by the follow-up

- Retain permanent Free, one paid Family tier and provisional US$9.99/month or
  US$99/year. Monthly/annual entitlements are the same.
- Free: useful text map, one outgoing complete share, all included-recipient
  field/privacy controls, basic rehearsal/guides/export and trust/exit controls.
- Family launch hypothesis: five outgoing recipients and one additional
  co-planner, with actual ongoing review/change history. Five is reversible design,
  not customer validation or a modified catalog. Received shares remain free.
- Preserve existing accepted read-only sharing after expiry; prevent new
  above-limit connections and stop paid co-editing/automation. Record the
  setup-only monthly-use risk instead of silently cutting off existing recipients.
- Exact pending/expiry/replacement/concurrency behavior and future safe downgrade
  are specified, not implemented. No dead-end quota paywall was activated.
- Do not sell unimplemented attachments, priority support, legal services or
  event release as part of the bundle. Do not gate basic privacy or leaving.

Current authority: [monetization.md](../../../docs/monetization.md), linked from
[product.md](../../../docs/product.md), [MVP](../../../docs/mvp.md),
[sharing](../../../docs/trusted-sharing.md) and the
[commercial UI audit](../../../docs/free-paid-ui-audit.md).

## Current primary research

Reviewed on September 10:

- [Everplans FAQ](https://www.everplans.com/faq): Free up to three items and
  Premium US$99.99/year. A packaging/price example, not Rillora demand.
- [Trustworthy pricing](https://www.trustworthy.com/pricing): Free one family
  member; Silver five at US$10/month paid annually. Its all-plan baseline includes
  security/privacy and download. A “family member” is not assumed to equal a
  Rillora outgoing recipient. Duplicate SecureLinks rows were not relied on.
- [Apple subscriptions](https://developer.apple.com/app-store/review/guidelines/#subscriptions):
  recurring value and clear paid scope required; no Rillora review approval implied.
- Quicken LifeHub returned 403 on the final read; no current price adopted.

Do not copy those companies' feature caps mechanically. A whole useful text map
and safe first-recipient experience are Rillora's existing product decision.

## Document corrections and validation boundary

Updated AGENTS, product, monetization, MVP, sharing, commercial UI audit,
platform contract, current handoff/archive, decision log and project journey.
Aligned stale refund/list-price/region guidance, native Account verification,
interactive-map fixtures, verified email use, backend encryption wording and
completed staging state in their focused documents. Old dated research, financial
models and test evidence remain historical; the original files/links are retained.

No runtime source, provider configuration, public legal text, subscription,
entitlement or deployment was changed. No real invitation/message/recruitment or
charge occurred. No new application test/build is claimed for documentation-only
edits. `validation.json` records 57 Markdown files, 247 local links (no local
heading fragments were present), exact archive preservation, current-state
assertions, dates and coverage of 24 changed existing Markdown files. All pass.
The read proof was independently reconstructed from 189 acknowledged ranges and
matched every original file hash. `git diff --check` passes and is
supplementary because the parent repository is broadly untracked.

Future engineering checks must cover two concurrent second invites, same-target
duplicates, expired/regenerated pending slots, received-share independence,
scope/dirty-draft preservation, downgrade with accepted and pending recipients,
free privacy/revoke/export and parity across Web/iOS. These are acceptance criteria,
not new tests executed here.
