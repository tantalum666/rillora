# Rillora Dark UI Redesign Brief

Role: focused visual brief for the 2026-08-15 all-surface dark redesign  
Authority scope: Imagegen exploration, cross-screen visual consistency and implementation acceptance  
Superseded by: Owner feedback or an updated `DESIGN.md` after implementation  
Do not use for: product scope, legal claims, entitlement authorization, final Logo or release evidence  
Status: OWNER-DIRECTED; IMPLEMENTED LOCALLY; TARGETED VISUAL AND EFFECTIVE 23/23 SIMULATOR COVERAGE PASSED  
Last updated: 2026-08-15

## Owner Correction

Rillora currently looks like two unrelated products: the public Overview uses the selected graphite architectural language while Matters, More and most child routes still use the older cream Calm Continuity treatment. The default product appearance must be dark. Every child route must be redesigned as part of one system instead of inheriting generic light `Form` or `List` styling.

## Visual Contract For This Round

- Default canvas is matte graphite, not an isolated dark landing page.
- Limestone is the primary text color; muted stone is secondary text.
- Eucalyptus is structure, current state and calm confirmation; rust-clay is reserved for one primary intent or meaningful warning.
- Raised surfaces remain near-black with thin structural dividers. Do not use white floating cards, glass, gradients, neon, heavy shadows or decorative dashboard charts.
- Navigation, sheets, editors, pickers, toggles, destructive actions, empty/loading/error states and the native three-tab shell must read as one product.
- Editorial serif can mark one page-level idea or result; task labels, controls and dense data remain highly legible system sans-serif.
- Long safety and legal boundaries use progressive disclosure and compact evidence blocks; they must not become walls of equal-weight body copy.
- Generated images are visual specifications only. Shipping UI is rebuilt in native SwiftUI with Dynamic Type, VoiceOver labels, safe areas and minimum target sizes preserved.

## Screen Inventory

### Public and identity

- Signed-out Overview
- Signed-out Matters
- Signed-out Profile
- Account choice sheet
- Safe synthetic Matter example
- Loading and recoverable failure

### Private workspace and records

- Authenticated Overview
- Matters list
- New and edit Matter
- Profile workspace index (formerly More)
- New and edit trusted contact
- Role and disclosure scope

### Guided preparation

- Optional setup
- Safe example before saving
- Why I am preparing
- Official provider checks
- Plan and access

### Rehearsal and export

- Simulation rehearsal
- Role disclosure rehearsal and result states
- Start Here empty, preview, printable, encrypted and recipient-rehearsal states

Native confirmation dialogs and provider-hosted Auth0 remain platform surfaces. They receive compatible tint and color-scheme treatment but are not replaced with fake custom controls.

## Imagegen Board Plan

1. `DG-01 · Public Continuity`: public roots, safe example and Account choice.
2. `DG-02 · Private Map`: authenticated roots, Matter editing and trusted-contact editing.
3. `DG-03 · Guided Preparation`: optional setup, motivation, official checks and plan access.
4. `DG-04 · Rehearsal & Export`: simulation, disclosure, role scope and Start Here.

Each board must show realistic, shippable iPhone screens rather than mood art. The four boards share the same tokens, spacing logic, navigation treatment, component construction and icon weight.

## Selected Imagegen Targets

The complete four-board set is the selected visual specification for this implementation round. It is a coordinated system rather than four independent style options:

| Board | Asset | SHA-256 | Implemented purpose |
| --- | --- | --- | --- |
| `DG-01 · Public Continuity` | `assets/concepts/rillora-dark-ui-20260815/DG-01-public-continuity.png` | `7eee1899e9ed444429a698cfb4cdcc7048279e3339c20d205e5c81437db9dc96` | signed-out roots, safe example and Account choice |
| `DG-02 · Private Map` | `assets/concepts/rillora-dark-ui-20260815/DG-02-private-map.png` | `7ac8366d446e7ea7533f32a07af9d9c207a45e76a4c8990ce69e861e94401f46` | authenticated roots, Matter and contact editing |
| `DG-03 · Guided Preparation` | `assets/concepts/rillora-dark-ui-20260815/DG-03-guided-preparation.png` | `eb76ce8ed6faa6e792285a3ba2589ca6d54a3890ad754c326b899877c1508fc3` | optional setup, motivation, official checks and plan access |
| `DG-04 · Rehearsal & Export` | `assets/concepts/rillora-dark-ui-20260815/DG-04-rehearsal-export.png` | `c898de53149df3bfb91b8e347e0de9f05b2e9c821a21fb73edafa7b07d225ed2` | simulation, disclosure, role scope and Start Here |

Generated names, monetary values, provider examples and device chrome are not product truth. Only the visual grammar, hierarchy and component relationships are adopted; shipping copy and state continue to come from the product contracts and current code.

## Final Imagegen Prompt Set

Mode: built-in ImageGen, `ui-mockup` generation. The prompts shared this normalized production specification:

> Create a landscape product-spec board containing five polished, realistic iPhone screens for Rillora, a private map for digital-life continuity. Use one coherent premium dark system: matte graphite canvas, limestone primary type, muted stone support type, eucalyptus structure/current state and rust-clay for one primary action. Pair an editorial serif page idea with highly legible system sans controls. Use near-black tonal panels, thin dividers, restrained radii, real iOS-safe spacing and one consistent three-tab shell where applicable. Avoid white cards, glass, gradients, glow, neon, crypto-wallet or password-vault aesthetics, memorial imagery, decorative charts, fake legal authority, clutter and unrelated component styles. The board is a visual specification, not a marketing poster.

Board-specific additions:

1. `DG-01`: signed-out Overview, Matters, More, safe synthetic Matter and neutral Account choice; keep the product usable before account and do not foreground pricing.
2. `DG-02`: authenticated Overview, Matters, More, Matter editor and trusted-contact editor; show a denser private workspace without changing the visual system or inventing secrets.
3. `DG-03`: optional setup, motivation, official provider self-checks and Plan & access; use progressive disclosure for boundaries and keep billing visibly non-operative.
4. `DG-04`: non-operative Simulation, result, role disclosure/scope and Start Here; clearly separate death, incapacity and unreachable flows and avoid any suggestion that a notification, release or legal appointment occurred.

## Rejection Conditions

- A board merely turns the old cream screen black without rebuilding hierarchy.
- Different boards introduce unrelated navigation, cards, corner radii or button styles.
- The design resembles a crypto wallet, password vault, cyber-security console or memorial app.
- Dense child routes remain a default iOS Form with every paragraph at the same weight.
- Commercial copy appears before explicit commercial intent.
- Generated text invents product capabilities, legal authority, delivery, verification or release.

## Implementation Acceptance

- Signed-out Overview, Matters and the current Profile root have the same default dark chrome and canvas.
- Profile/settings controls use a brighter dedicated action surface, filled icon tile and readable purpose text; passive cards stay quieter, so clickability is not encoded by a barely visible chevron.
- Every listed child route uses the shared dark components and preserves its current safety/product truth.
- No private route becomes reachable without authentication because of the redesign.
- Current automated identifiers and domain behavior remain stable unless a documented information-architecture change requires an update.
- iOS build, unit tests, focused navigation/UI checks and representative visual screenshots pass before this brief is marked implemented.

## Final Evidence

- Native iOS Debug build passed. The focused all-surface traversal passed `2 / 2` tests and retained `11` screenshots across signed-out roots, editors, preparation, Plan & access, rehearsal, disclosure and Start Here in `output/qa/rillora-dark-ui-20260815/`.
- The complete iPhone matrix retained its raw `22 / 23` result. The only failure was a test-helper false-positive that considered a control tappable while its center sat behind the native Tab Bar; the corrected helper passed the exact same iPhone SE, largest accessibility size and deep-surface test `1 / 1`. Effective named-slice coverage is `23 / 23`, with the original failure preserved.
- The ordinary native unit suite passed `75 / 75`. The Web production build and seven focused suites passed `30 / 30`.
- `compare-matters.png` and `compare-simulation.png` place the selected ImageGen visual targets beside their native implementations. Generated placeholder facts, custom fake controls and device chrome were not shipped.

This proves the named local source, Web build and Simulator states only. It does not prove physical-device accessibility, translated layouts, external comprehension, staging deployment, TestFlight or release readiness.
