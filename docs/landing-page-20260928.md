# Public website, system theme and legal-information contract

Role: scoped public website design/interaction contract
Status: THIRD ITERATION IMPLEMENTED; PUBLICATION AND EXACT SOURCE CHECKS IN HANDOFF
Last updated: 2026-09-28 (Asia/Hong_Kong)

## Latest Owner direction

Centre the approved symbol on the photographed folio, follow system light/dark
appearance using the earlier ink-green theme, remove the meaningless timed
walkthrough and serial01/02chapters, and use meaningful top navigation/subpages.
Owner separately clarifies that licences belong in Terms or another legal area.
Remove the standalone raw Credits link; preserve required statements without
turning them into a new user agreement. This supersedes V2's long numbered page.

Preview Sign in remains https://app.staging.rillora.xyz/account; incoming invitations
use that host's `/invite`. Specific provider guidance remains signed-in and Free
eligible. No production identity, billing, API or native layout change is implied.

## Information architecture

- `/`: existing brand promise/photo, real permitted-only Mum/Alex sharing example,
  concise Product/Security links and a Preview account action.
- `/product`: category-specific read-only matter examples, actual invitation
  explanation and the separate Death/Incapacity/Unreachable boundaries.
- `/security`: sharing/revocation/export/encryption disclosures and access FAQ.
  No E2EE, bank-grade certification or automatic disclosure promise.
- `/pricing`: named plan-review intent directly shows the existing Free/Family
  comparison. Price reads the canonical catalog: WebUS$88.99annual,1/5live contacts.
  Paid subscriptions remain closed; Preview is the only account action.
- `/support`: actual support/privacy/security mail links and useful FAQ.
- `/legal`: an index of the seven existing official legal documents plus notices.
- `/legal/licenses`: readable overview, expandable complete unchanged statements,
  and optional plain-text download. Not a standalone homepage Credits promotion.

Product/Security/Pricing/Support appear in the shared top navigation. Mobile has
an accessible disclosure with Escape close/focus return. Standard links preserve
browser Back and direct-entry behavior; each subpage has an H1 and current-page
navigation. Old `/guides` bookmarks keep their bounded authentication continuation.
Unknown/private/write routes remain refused by the public edge router.

The terms publication shell links to `/legal/licenses` in its legal navigation.
`LegalDocumentPage.jsx`, accepted text, legal versions and body digest are unchanged;
no new consent or release market/commerce approval is introduced.

## Appearance and motion

Use the existing paper light theme and system-only `prefers-color-scheme` media
rules. Dark uses canvas#171F1B, cream#F1ECE2, sage#CDE1B0 and bronze details. The
header/footer marks, hero artwork, controls, sheets, text, rules and focus states
adapt together. CSS/picture sources react without reload or preference storage;
no manual toggle, cookie or analytics is added. This applies to the public website
and its new information pages, not a redesign of authenticated App screens.

The [dark reference](../assets/concepts/rillora-landing-20260928-v3/dark-concept.png)
and [implementation inventory](../assets/concepts/rillora-landing-20260928-v3/implementation-target.md)
refine the existing layout. ImageGen produced matching dark hero artwork and a
real alpha folio. Keep complete03SVG geometry, centred on the actual cover at
53%x/45%y of the image canvas,22%relative width,-13degree cover alignment. This
replaces the old fixed-pixel overlay and stays proportional on narrow displays.

Remove walkthrough, timers, artificial progress, stage buttons, numbered chapter
rails and pointer wobble. Keep bounded selection/disclosure/reveal feedback and
complete reduced-motion rendering. No new component dependency is installed.

Stripe and Privy informed content partition and navigation, not their imagery,
customer logos, metrics or claims: [Stripe](https://stripe.com/),
[Privy](https://www.privy.io/). Local browser references and analysis are saved in
[research QA](../output/qa/rillora-launch-goal-20260926/landing-v3/research.json).
No partner/integration/endorsement is implied by taking design inspiration.

## Assets, maintenance and evidence

Pinned MIT Motion/Radix, existing Phosphor/OFL fonts and complete notices remain.
Subpages and the notices body load separately from the homepage; shared chrome
and theme tokens prevent one-off page styling. No private provider-guide body is
imported by marketing pages. The existing full10-path favicon remains unchanged.

102Web checks,2public infrastructure checks, infra typecheck, public/legal builds
and7legal-artifact checks pass locally. Browser checks cover actual system media
changes, desktop/reference1435x1096,390px/320px, menu keyboard behavior, recipient
omission, subpage navigation and136readable notice paragraphs without code/pre
markup. Publication, source/CI and final visual comparison are recorded separately
in[handoff](handoff.md) and[QA](../output/qa/rillora-launch-goal-20260926/landing-v3/work-state.json).
No new real login, payment or provider inheritance ceremony was run.

[Previous visual/interaction contract — HISTORICAL](landing-page-20260928-v2-history.md).
