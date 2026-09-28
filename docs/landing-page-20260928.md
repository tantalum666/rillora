# Public landing and complete browser identity

Role: scoped public-website design and interaction contract
Status: CONTINUOUS SECOND ITERATION PUBLISHED; EXACT SOURCE AND ASSET READBACK IN HANDOFF
Last updated: 2026-09-28 (Asia/Hong_Kong)

## Owner direction and scope

Owner requests a carefully designed landing page, then finds the first published
attempt fragmented and sparse. The second iteration adds useful interactive
content and motion within a continuous visual system. Specific platform operation
guides belong after sign-in, still available to Free. Preserve contextual matching,
existing private App UI, the complete approved03Logo and production release gates.

Owner explicitly chooses Preview-labelled Sign in to the existing test app:
https://app.staging.rillora.xyz/account. Received invitations use that app's
`/invite`. Public website remains https://www.rillora.xyz; production product is
https://app.rillora.xyz and remains customer-closed. One configuration,
`config/public-entry.json`, controls the public account destination.

## Current implementation target

Agent-selected ImageGen references under the authorized redesign:
[organise](../assets/concepts/rillora-landing-20260928-v2/organise.png),
[people/control](../assets/concepts/rillora-landing-20260928-v2/people-control.png),
[plans/FAQ](../assets/concepts/rillora-landing-20260928-v2/plans-faq.png).
The [implementation inventory](../assets/concepts/rillora-landing-20260928-v2/implementation-target.md)
records extracted tokens, controls, intentional corrections and asset treatment.
The first iteration's references in `assets/concepts/rillora-landing-20260928/`
remain HISTORICAL; its dark/light bands do not override later feedback.

Paper#F5F1E8 continues from hero through footer and Support; forest#23473D type,
bronze#BD9473 hairlines, Source Serif4 display and Inter controls remain coherent.
Desktop gutters64–72px, content maximum1400px, section spacing56–88px. Open rails,
ruled lists and two purposeful example sheets replace large section-color changes.
All controls/text are real HTML; generated concepts are not shipped as UI.

Allowed hero copy is unchanged except Guides becomes Your control in navigation:
Rillora, How it works, Your control, Preview, Sign in, Leave less / for them to /
figure out., A private map of your important things, shared with the people you
choose., See how it works, Received an invitation?,01Organise,02Choose,03Share.
No extra hero slogan, security badge, sales number or endorsement is introduced.

## Composition and working interactions

1. Existing paper still-life hero and complete03Logo. The natural photograph has
   a bottom edge mask, not a color overlay. Short laptop and mobile layouts keep
   the primary action usable. Hero sections link to the actual demonstration.
2. Start with one important thing: Accounts/Documents/Devices/Digital assets
   update a read-only example sheet and map selection. A16-second walkthrough
   cycles once, can pause/restart, stops on manual selection and pauses in a hidden
   tab. No user input, persistence, provider request or fake save occurs.
3. Let the right people see the right details: Mum/Alex switches permitted-only
   illustrative matter rows and an animated connection. Details expand. Changing
   recipient immediately unmounts the other person's content. Stage choices show
   organising, choosing and inviting; they do not create an invitation.
4. Ready for life's changes: Death/Incapacity/Unreachable have distinct concise
   explanations. Being out of touch never triggers automatic release; contact
   status does not create legal authority. Controls change the actual explanation.
5. Your map. Your control: four disclosures cover sharing, revocation, exports and
   application-layer encryption. Existing downloaded copies cannot be revoked;
   this is not E2EE. Download an example returns an explicit synthetic text file.
6. A plan that fits your circle: an explicit Explore plans action opens the
   comparison. Current planned Web pricing is Free0/FamilyUS$88.99annual,1/5live
   contacts, shared reviews in Family and baseline export/privacy in both. Paid
   subscriptions are not open; the only account action is Try Preview.
7. Four keyboard FAQ disclosures, paper closing action and coherent shared footer.
   Support uses the same brand/header/background and actual contact addresses.

The public-site example allowance is scoped to this explicit WWW redesign; it
must not generate fake private records or change the original App onboarding.

## Guide placement and safe continuation

WWW no longer imports guide bodies or provides a public step-by-step directory.
Its edge function302redirects `/guides` bookmarks to the configured account entry,
retaining only a known service ID; tokens and arbitrary return targets are dropped.
The18public identifiers are parity-checked against the canonical private catalog.

The app's old `/guides`, `/account?next=guides` and authenticated workspace guide
intent return to the selected guide after sign-in. Unknown IDs open the directory.
Unauthenticated users see the account task with consent unchecked; private plans
must load before the workspace renders. Native signed-out Profile no longer has
an Account inheritance link; signed-in Profile/editor/shared-item paths remain.
This is product-entry placement, not a confidentiality claim about public provider
instructions, a new paid gate or proof of successful provider estate applications.

## Motion, assets and maintainability

Pinned MIT Motion13.4.4 and Radix Accordion1.2.20, existing MIT Phosphor/OFL fonts;
full notices remain shipped. No new library, paid Motion+ or unreviewed Figma asset.
New blank-cover folio artwork is generated against the selected paper reference;
its exact approved vector symbol is overlaid in code. Prompts/originals are kept.
The animated demo was also recorded from the real local browser as a17-secondMP4
for review; this is a recording, not Sora-generated footage. It is a QA artifact,
not an automatically downloaded video on the public page.

Shared LandingChrome and focused MatterDemo/SharingDemo/LifeSituations/
ControlSection/PlanSection/LandingFAQ keep state ownership small. CSS is scoped and
split by feature. Reduced motion retains a complete readable layout; the tour is
opt-in even in ordinary motion. No endless autoplay or artificial success meter.

## Complete browser identity

The former microfavicon exception is withdrawn. All10paths come deterministically
from `assets/brand/rillora/symbol-forest.svg` via
`tools/logo/export-approved-favicons.cjs`. SVG/32pxPNG, staging, closed production,
WWW, legalSites7and Auth0 were verified at the first publication checkpoint.
Historical boards/optical studies remain unchanged; new pages retain these assets.

## Evidence boundary

Current local checks:102Web tests,2public infrastructure tests, infra typecheck,
App/public/legal builds and the changed native Debug build pass. The recorded tour
reaches its final category and stops; desktop and390px layouts, permitted rows,
keyboard disclosures and life-state controls are checked. See the current
[fidelity ledger](../output/qa/rillora-launch-goal-20260926/landing-v2/fidelity.json)
and [work state](../output/qa/rillora-launch-goal-20260926/work-state.json) for exact
screenshots, runtime and publication readbacks. A local build is not a deployment,
real registration, paid transaction, TestFlight upload or production opening.
