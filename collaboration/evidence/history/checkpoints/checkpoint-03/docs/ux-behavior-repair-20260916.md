# UX behavior repairs within the existing UI

Status: DEPLOYED AND SYNTHETICALLY VERIFIED; EXISTING UI PRESERVED  
Last updated: 2026-09-17 (recipient continuation and Owner-requested Web return/consent follow-up)

## Scope

Owner said “开始修吧” after explicitly rejecting a UI redesign. Keep the selected Prepared Folio composition, root navigation groups, Profile arrangement, fonts and colors. Changes below repair existing controls, status, return paths and permission semantics. No new generated visual is a target. This is narrower than the withdrawn redesign, and does not restore its new preview step or intermediate sharing page.

## Current work

| Audit | Repair and current evidence |
| --- | --- |
| UX07 | Web routes preserve page, search, filter and task identity. Actual mobile-browser matter → existing contacts → existing sharing → original matter restores814px dialog scroll and search. Browser back/cancel/discard/forward checks pass. |
| UX08 | Existing quiet guide link also appears for paused state. Web reload preserves step2; native resumes the same Web-paused step. Optional guide never blocks manual Add. |
| UX09 | Web matter form links into existing contacts with the selected matter context and Back. Native existing People section shows actual per-person scope and opens the existing sharing screen; Invite reuses existing forms. No extra intermediate page. Runtime return path passes; new-person → link/QR → original matter also verified. |
| UX10 | Native acceptance/back/re-entry shows Connected; Web replaces the old invite entry, and a lost acceptance response recovers only after checking the exact current-account connection. Actual synthetic tests pass. Unsaved native sharing now hides the unguarded system Back button; existing Done/Close keeps its confirmation. |
| UX11 | Existing Visible details disclosure now contains a read-only server projection; save/invite flow and controls remain in place. Name/Directions/Details compare equal to actual recipient projection in12 sharing tests. Both renderers reuse the recipient field display. Name-only scope explanation and address copy are local. Actual existing-contact/new-contact paths, scope changes and return checks pass. |
| UX15 | Existing empty/filter areas gain accurate status text, without new layouts. Native filter-only empty state no longer describes an empty search. Local functional checks and release checks pass. |
| UX16 | Existing P1 focus ring/restoration retained; nested sharing Keep editing returns focus inside the original drawer in actual Chromium. Keyboard-only cancel/discard and3px sage focus-ring checks pass. |
| UX17 | Explicit task labels for the original public graph controls; Connected status stacks only at accessibility text sizes. AX5 and physical VoiceOver evidence remain separate. |
| UX18 | Earlier P1 exact export preview and direct refresh are retained; do not relabel old acceptance as a fresh run. |
| UX19 | Existing Activity rows get distinct sharing/review labels, time and context links; raw payloads remain hidden. Local functional checks and release checks pass. |
| UX20 | Print-only text contrast fix; on-screen legal composition remains unchanged. Seven routes pass print-style checks;27 PDF pages have no out-of-page text and representative pages were visually inspected. |
| UX21 | Shared task names and singular/plural corrected; existing safety copy accurately states unavailable welfare/claim services. No live-release claim. |
| UX22 | Active MVP/parity/quality/design clauses now explicitly supersede the old consumer simulation, root-motivation and circular-progress requirements. |

UX12–14's broad layout/navigation/public-redesign remedies are not automatically authorized. Preserve the Owner's UI choice; track remaining functional explanations separately instead of calling those design suggestions implemented.

## New connected defect

An already-open native recipient detail used to load only once. SharedAccessStore now clears cached content when backgrounded and on refresh, rejects late prior-generation responses, and fails closed when refresh fails. Actual same-process home/resume tests verify Details → Name removes Notes/address and revocation removes the open item. The process stayed34593 through both checks; this was not a relaunch test. Equivalent Web generation/visibility handling passes an actual delayed-response/downgrade/revocation check.

## Server boundary

`POST /v1/sharing/preview` is an authenticated, CSRF-protected owner read. Grants are bounded/unique, owner RLS applies, and archived/Never disclose/foreign records fail generically. The explicit field projection is checked against the real recipient projection at all three levels. Preview never changes grants, sends anything, or creates an invitation. No migration or consent-contract change is required.

## Evidence and remaining work

[Behavior QA](../output/qa/rillora-p2-repair-20260916/behavior-20260916/work-state.json), [Web return](../output/qa/rillora-p2-repair-20260916/behavior-20260916/matter-sharing-browser.log), [Web guide](../output/qa/rillora-p2-repair-20260916/behavior-20260916/guide-browser.log), [Web acceptance/lost response](../output/qa/rillora-p2-repair-20260916/behavior-20260916/invitation-browser.log), [native tests](../output/qa/rillora-p2-repair-20260916/behavior-20260916/native-focused-tests.json).

Final checkpoints: API149 pass; native145 pass/0 fail/1 existing StoreKit skip; Web75 pass; legal artifact7 pass. API24 is healthy1/1 after rollout; final Web and legal Sites5 are published.37 application/API HTTPS/asset checks,25 legal checks and12 authenticated synthetic cloud projection checks pass. No database migration or legal-consent digest changed. Both isolated cloud fixture identities and active maps were removed; their sessions return401. Ordinary native cloud configuration is restored.

The broad UX12/13 re-layout/navigation remedies and on-screen UX20 legal-layout proposal remain unimplemented by design under the Owner's no-redesign instruction. UX14 receives copy and accessibility feedback corrections inside the original selector; actual human comprehension remains a future study. UX17 has runtime labels/AX5 evidence, not physical VoiceOver certification. These distinctions must remain visible in status reporting.

[Final QA](../output/qa/rillora-p2-repair-20260916/behavior-20260916/README.md), [current handoff](handoff.md). Synthetic fixtures are not actual provider signup, delivery, consent, payment or physical accessibility certification. Sales remain closed.

## September17 connected follow-up

Real B acceptance exposed stale email proof and an account-switch action masquerading as verification continuation. API30/0060 now refreshes proof for the same authenticated identity; Web/native retain the invitation and current legal receipt. Visible recipient views also revalidate every15seconds without loading flicker and clear revoked/unverifiable fields. Owner's later screenshots prompted an explicit safe Back link, below-actions consent and neutral empty-state wording. Same-session provider/cloud checks, final rendered return/reload/consent gating,78 Web tests and42 publication checks pass. A real original-token browser reopen was not completed because that token was not retained; isolated deployed old-token rejection passes. [QA](../output/qa/rillora-real-invitation-20260917/README.md).
