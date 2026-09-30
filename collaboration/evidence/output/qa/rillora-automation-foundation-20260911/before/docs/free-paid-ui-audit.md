# Rillora Free And Paid UI Audit

Role: focused cross-platform commercial-presentation audit  
Authority scope: how Free, Family, billing state and safe downgrade are explained in current Web/iOS UI  
Superseded by: a later approved commercial UI audit  
Do not use for: entitlement authorization, payment implementation, legal pricing disclosure or market validation  
Status: SHARED-REVIEW PREVIEW IMPLEMENTED AND VISUALLY CHECKED; HISTORICAL AUDITS RETAINED; PUBLIC BILLING AND QUOTA ENFORCEMENT CLOSED  
Last updated: 2026-09-11

## Current commercial surface and implementation gap — 2026-09-10

Latest price-band work recommends79/year with8.99/month as main-test candidates
and88/year as an upper comparison. These are not live or validated. Review is
a supporting capability. Existing 99/9.99 test previews are historical, not the
current proposal; no catalog migration or UI deployment occurred in this reset.
Both clients need distinct prospective price versions and truthful contributor
copy before customer exposure. Do not sell the unbuilt99 expansion.
[Economics and rollout order](unit-economics.md).

Later implementation checkpoint: Shared reviews is now a real authenticated task
in Web More/sidebar and native Profile, with an explicit server-owned preview.
It has requests, scoped responses/suggestions, owner approval, approved history and
in-product cadence. A receiving link reaches Account then the receiving inbox;
it does not disclose data or start billing. [Current feature/evidence](family-maintenance.md).
The remainder of the earlier source audit below remains a dated boundary:
Family purchase, full co-owner editing and paid-cutoff sharing are not complete.

This update is a source audit, not a new visual/browser run. The current Web
`commercialAccess.js` and `App.jsx`, and native `PlanAccessView.swift`, keep the
comparison inside authenticated Plan & access. Family is marked planned/not yet
available and billing is closed. September 9's full-depth visual/interaction
evidence is in [interaction-experience.md](interaction-experience.md).

The catalog already declares Free's `trusted_person_basic` allowance as 1 and
Family's co-planner allowance as 1; the later planned v2 sets multiple
recipients to5. The earlier v1 null was never a published unlimited promise. New sharing routes do not read those commercial allowances and do not
enforce a plan-based person limit. The September 10 packaging contract now defines
Free 1 / provisional Family 5 **outgoing relationships**, free incoming access and
equal per-item privacy controls. Its quota/downgrade release behavior remains to
be implemented; neither existing UI copy nor test payments can grant Family.

Before enforcing or selling that offer, both clients must show the server's
available allowance only on the relevant sharing task, preserve the draft at the
second invitation, and provide a working eligible upgrade or deliberate slot
replacement. While sales are closed, do not introduce a dead-end purchase wall.
Keep the comparison short: recipients, co-planning and ongoing review; unavailable
attachments/support cannot be presented as included purchased benefits.

Owner follow-up, September 10: retrieval after expiry must not imply continuing
updates for every paid recipient. Before sale, show `Family until [date]`, the
chosen Free live recipient, and which others will have a dated saved version with
`Updates paused`. Keep the explanation in the subscription/share task; recipients
do not see a demand to buy the owner's subscription. Historical retrieval is not
labelled current or complete. Current clients do not implement this commercial
mode; the old generic “basic access remains” text is insufficient purchase
disclosure. A future failed/absent snapshot cannot silently fall back to live data.

The old audit below records earlier compositions and tests. Its native Account,
example page, static index and “next engineering gate” passages are **HISTORICAL**;
current entry is public interactive exploration, followed by direct hosted iOS
authentication on a private intent. Current billing/packaging authority is
[monetization.md](monetization.md); source evidence is in
[the September 10 QA record](../output/qa/rillora-packaging-review-20260910/README.md).

## Historical audit — 2026-08-15 to 2026-08-17

## Audit Question

Can a visitor understand what Rillora does and reach a useful free start without seeing a price pitch before they ask for a paid capability?

## Evidence Boundary

- Before-state review used the live synthetic staging Web public and Account surfaces plus the current signed-out iOS build.
- After-state review used the current local Web source at desktop, `390 × 844` and `320 × 568`, plus the shipping SwiftUI app across the five-device Simulator matrix and focused UI automation.
- The original commercial audit is stored under `/Users/tantalum/.codex/visualizations/2026/08/13/rillora-free-paid-ui-audit/`. The selected public long-page source, implementation comparisons and current matrix evidence are under `assets/concepts/rillora-ui-directions-20260814/`, `output/qa/rillora-ai-01-20260814/` and `output/qa/ios-layout-matrix-20260814-212802/`.
- No checkout, StoreKit product, payment-provider account, real subscription, external tester, invitation or real sensitive data was used.
- Pricing and features remain hypotheses governed by [`monetization.md`](monetization.md). The UI is a truthful preview, not a market result or an authorization source.

Current-surface update, 2026-08-17: Owner retired the public and first-use example paths rather than renaming them. The architectural index now defaults to `01 · What exists` and describes real product capabilities without fake records; signed-out Matters describes the schema of a real Matter, and first use has only direct Matter creation plus the optional guide. Earlier references below to a public safe/synthetic example are retained as historical audit evidence and are superseded for current UI composition. Commercial deferral and public-before-account remain unchanged.

## Journey Review

### 1. Public understanding — healthy after correction

Before, `Start your private map` and Account creation did not say whether starting was free. A user could reasonably expect a payment wall immediately after creating an account.

The 2026-08-15 refinement removes both the creation CTA and `Free to start · No card required` from the first public viewport. Web and iOS now let the architectural index act as the product sample before conversion: a visitor can inspect the structure and open the safe synthetic example without an account. `Account` remains a quiet utility, and the first creation CTA appears only after the safety boundary at the bottom. The public explanation remains useful before identity; neither platform regresses to a login wall.

### 2. Plan comparison — healthy after deferring commercial detail

Before, neither platform offered one trustworthy place to understand the commercial boundary. The absence of a comparison made Free look accidental and left future upgrade UI likely to spread across unrelated screens.

The first implementation over-corrected by promoting `Plans`, a full Free list, a Family card and exact prices in public discovery. The commercial information was truthful, but it appeared before the visitor had expressed any need for collaboration or maintenance features.

Now public Web, signed-out iOS Overview／Matters／Profile and Account choice contain no Free/Family, `no card` or price promotion. `Plan & access` remains the single comparison destination inside the authenticated workspace and as the future landing surface for a named paid-capability intent. When reached intentionally, it still states:

- Free is useful on its own;
- Family is a planned offer for ongoing household coordination, not a currently purchased capability;
- monthly and annual are two billing periods for one entitlement set;
- the current global price hypothesis is labeled explicitly in `US$`, rather than using an ambiguous bare dollar symbol;
- billing is not open in the current staging build;
- ending Family does not remove the core map, export or security controls.

### 2a. Public long-page integration — healthy after removing the second comparison

The selected `AI-01 · Architectural Index` public page now carries only the product job, one expandable synthetic example, the three-event safety boundary and a final action. It does not use `Free` as public-entry reassurance and does not show a creation CTA before the visitor has explored the structure. Account and save intent now lead to neutral `Create account / Sign in` choices; merely reaching identity is not treated as commercial intent.

The detailed capability comparison remains centralized in `Plan & access`, where billing-closed language, safe downgrade and future entitlement states can be explained after intent. Both public-page start actions still enter Account choice rather than Auth0 or payment. No plan badge is repeated across Matters, no feature is client-authorized, and the page does not claim a trial, subscription or purchased capability.

### 3. Account entry — healthy after removing plan promotion

Web Account and native Account entry distinguish create from sign in without turning `Free`, `no card` or a plan name into a headline, card or primary control. Account remains a consequence of saving private data, not a prerequisite for learning or viewing a safe example. The absence of billing at account creation is the product truth; commercial explanation waits for plan-review or a named paid-capability intent.

### 4. Authenticated workspace — structurally healthy, authorization pending

Authenticated Web has `Plan & access`; mobile Web keeps exactly `Overview / Matters / More`, while native iOS keeps exactly `Overview / Matters / Profile`. The commercial destination remains inside each platform’s third aggregation root; signed-out More／Profile does not promote it. This avoids creating a fourth primary tab or repeating paid badges on every surface.

The old Web Settings checkboxes for annual reminders and plain-language guidance were removed because they looked active without a persistence contract and collided with the proposed paid adaptive-reminder value. iOS `Plan status: Active` became `Continuity status` so a domain-state label cannot be mistaken for a paid subscription.

Advanced prototype capabilities remain available only as development evidence. They are not marked purchased. Real capability gates must wait for the shared server entitlement result; client copy is never authorization.

### Accessibility and responsive review — healthy locally, physical gates open

The reduced Web homepage retains semantic headings and named actions. At `390 × 844` it falls from roughly `4745px` to `2405px`, reports zero horizontal overflow and has no visible target below `44 × 44px`; its rendered text contains no `Plans`, Family or price amount. The iOS implementation uses a native scrollable public Overview, keeps three native tabs and removes `Plan & access` from signed-out Profile. The last complete matrix belongs to the prior More-labelled candidate; the current Profile candidate has focused signed-out `2 / 2` iPhone 17 Pro Max and `1 / 1` iPhone SE evidence plus authenticated portrait／orientation／deep-route `3 / 3` on 17 Pro Max. A fresh complete device／Dynamic Type matrix remains open. Physical VoiceOver speech order, Display Zoom and translated copy remain separate release gates; exact evidence is tracked in [`ios-layout-matrix.md`](ios-layout-matrix.md).

### 5. Downgrade and failure — correctly stated, not yet implemented

The UI now explains the intended safe downgrade, but no subscription state exists yet. The next engineering gate remains the provider-neutral catalog, plan version, capability, price and subscription-state contract with server tests. Payment failure must never become a life-event signal.

### 2026-08-15 public-entry timing correction

The remaining public `Free to start · No card required` reassurance and above-fold creation action were removed after the Owner's correction and a current-run public-entry review. A later visual check then found the same commercial pressure had drifted into signed-out Matters, More and Account choice through `Create or access a free plan`, `No card is required` and `Create free account`. Those labels are removed: Matters now demonstrates a synthetic item and uses `Add a matter`; More uses `Account`; identity uses `Create account / Sign in`. Free remains a real entitlement, but is explained only in `Plan & access` after explicit plan-review or named paid-capability intent. The public index remains the first sample and the sole Overview creation action remains after exploration.

Focused verification for this correction passed the Web production build and `30 / 30` relevant Web tests, the iOS `75 / 75` unit suite, `2 / 2` targeted signed-out UI tests and a final `1 / 1` traversal rerun after the More refinement. The exact final result is `signed-out-ui-grammar-final.xcresult`, with current Matters and More screenshots in `attachments-grammar-final/`, under `output/qa/rillora-signed-out-commercial-copy-20260815/`. This is local code and Simulator evidence only; it does not prove staging deployment, real billing behavior or external user comprehension.

## Presentation Rules

- Keep Free reassurance out of public discovery, every signed-out top-level destination and Account choice. Explain the Free baseline only after explicit plan-review or named paid-capability intent.
- Keep the detailed capability comparison centralized in `Plan & access`, but do not promote it from the public homepage, signed-out Matters／More or Account choice. Enter only after explicit plan-review or named paid-capability intent.
- Do not use crowns, diamonds, repeated locks, dimmed baseline-safety controls or generic `Premium` labels.
- When billing opens, prompt for Family only at a paid-capability intent and explain the specific ongoing value.
- Never show a paid capability as available merely because the client rendered it. Resolve access from versioned server capability data.
- Never obscure export, deletion, security, cancellation, billing history or already-authorized recipient access.
- Always distinguish continuity-plan state, identity/session state and commercial subscription state.

## Open UX Gates

- External comprehension of the English Free/Family wording;
- real entitlement-driven enabled, unavailable, grace and safe-downgrade states;
- checkout, renewal, refund, restore-purchase and cross-store duplicate-subscription prevention;
- localization and storefront-specific price rendering;
- physical-device VoiceOver, Display Zoom and long-translation review;
- evidence that users value Family coordination enough to pay the proposed price.
