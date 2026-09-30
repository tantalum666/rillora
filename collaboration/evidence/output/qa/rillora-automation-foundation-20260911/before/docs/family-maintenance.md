# Family shared maintenance

Status: IMPLEMENTED ON API / WEB / IOS; SYNTHETIC STAGING PREVIEW DEPLOYED — 2026-09-10  
Authority: implemented under the earlier Owner request for Family value. The later
same-day correction rejects this slice as sufficient US$99 value. It remains a
supporting capability in the proposed79/88 self-service price band, not
premium-price validation. Scope does not expand merely because the candidate
price rises. [Current band](pricing-band-20260910.md).

## Paid job

Keep permitted directions understandable and current together. Owner selects
already-connected people and matters, sets a review date and requests a check.
Recipients see only their existing scope, confirm the current version or flag
missing/outdated directions. One explicitly chosen collaborator can propose a
provider/location correction. Owner sees before/after, approves or dismisses;
approval updates the real Matter and records history atomically. A version change
invalidates earlier checks. A review completion is not legal authority or proof
of comprehension, death verification or release.

## First implementation scope

- A persistent review inbox for the owner and the receiver on Web and iOS.
- A shareable account-entry link, containing no task identifiers or grants. After
  login it opens the receiving inbox. Sending the link remains the user's action;
  generating/opening a share sheet does not prove delivery.
- Per-item, per-recipient task status, due dates and a genuine completion count.
- Explicit collaborator selection; being a read-only recipient does not by
  itself permit suggestions. No full-plan/co-owner role is inferred.
- Scoped corrections to provider/location only, with owner approval and current
  Matter version checks. Never accept a suggestion to change disclosure outcome,
  hidden fields, credentials, legal roles or another person's data.
- Saved review and change history, including what the owner applied, dismissed
  or needs to recheck. Recipients cannot see each other's responses/history.
- Configurable in-product review cadence and due/overdue reminders, preserved
  across sessions. External email/SMS/push delivery is not claimed by this slice.
- Progressive disclosure, direct choices, visible progress and draft protection.
  No new main tab, public pricing wall or long explanatory feature cards.

## Authority and lifecycle

All actions are authenticated, CSRF-protected for cookie sessions and enforced
against the owner's server-owned capability. A receiver's own paid tier is not
required. Private API data must preserve RLS; cross-owner review functions get
only bounded permissions, never runtime membership in their service role.
Unaccepted, revoked, archived, never-disclose or reduced-scope items disappear
from receiver reads and cannot be acted upon. Stale/version-conflicting approval
must preserve the current Matter and request a fresh check.

Ordinary billing stays closed. An explicit server-side preview may run locally
or in the existing synthetic staging; it is labelled preview and never writes a
subscription or paid entitlement. Disabling preview or losing a real capability
stops new maintenance work without removing baseline own-data/export rights.
Commercial live/archival sharing at paid expiry remains governed by
[monetization.md](monetization.md); do not claim the complete sellable lifecycle
until its independent cutoff/snapshot proof exists.

## Acceptance

Verify A requests a review, B confirms, a designated collaborator suggests a
correction, A applies it, current Matter/history change and stale checks are
identified. Test B/C isolation, no implicit collaborator, no hidden-field input,
concurrent/replayed decisions, revoked/reduced scope, stale source versions,
closed capability and receiver-independent access. Persist schedule/round state
and validate both clients, narrow screens, large text and cancellation. No real
recipient message, production release or willingness-to-pay result follows from
local tests or a synthetic staging preview.

## Current implementation and evidence

Migrations `0037–0039` create review settings, rounds, scoped tasks and approved
change history. `/v1/maintenance/overview`, `PATCH /settings`, and versioned
`POST /rounds`, task `respond / decide`, and round `close` operations are live in
the existing staging. A new immutable **planned** Family catalog version 2 adds
`family_maintenance`; prior prices/subscriptions remain unchanged.

The implemented collaborator can suggest provider/location changes only. This is
owner-approved maintenance, not a full co-owner role or unrestricted editing.
History covers approved review corrections, not every change to the entire plan.
Cadence supports 30/90/180/365 days or off, with in-product next-due state. It does
not claim automatic email/SMS/push delivery or provider-policy monitoring.

Authorization is checked against the owner's current server capability at each
maintenance action; the receiver's own subscription is irrelevant. Expired or
locked capability stops new work. Review closure and late responses serialize;
source/version conflicts cannot overwrite newer data. Revoked/reduced grants
cannot silently regain old task access. Deleting a contributing recipient detaches
their identity while preserving the owner's approved directions and cadence;
owner deletion still removes their data. PostgreSQL 16's
[column-specific foreign-key nulling](https://www.postgresql.org/docs/16/ddl-constraints.html)
is used for that ownership boundary.

Current evidence: **129 API tests**, including **14 focused review integration
cases**; **54 Web product/source tests** plus **7 legal-artifact isolation checks**
against the correct separate build; **129 native unit passes / one pre-existing
StoreKit skip**, then **5 focused native passes** after the final model/wiring
changes; **10 infrastructure tests**. Web A/B/C at desktop/390/320 and native A/B flow,
dirty dismissal, AX5 and Reduce Motion were exercised. The final decorative icon
adjustment was built and visually rechecked, not counted as another full test run.

AWS: two-phase deployment completed; migration task revision **14** exited 0,
API revision **19** reached **1/1**, no pending/failed tasks, CloudFormation and
rollout completed. **27/27 HTTPS/asset checks** match the final built JS/CSS,
including lazy review assets. Remote template readback confirms preview on,
development auth off, existing Stripe test on and Apple Sandbox off. Real provider
receiving-session proof and actual willingness to pay remain separate.

[QA, screenshots, operation video and deployment records](../output/qa/rillora-family-maintenance-20260910/README.md).
The current normal Simulator launch uses cloud Debug with no QA actor/large-text
override; it is not left on a fabricated personal account.
