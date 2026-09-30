# Rillora Design QA

Original foundation QA date: 2026-08-11  
Reviewer role: source-to-implementation product design QA  
Original fixture state (historical): Overview, `3 of 5 essentials`, Maya Chen; not seeded user data or real acceptance  
Last updated: 2026-09-10 (checkpoint routing only; no new visual run)

## Evidence

- Source visual truth: `assets/concepts/visual-directions-20260804/01-calm-continuity.png`
- Final Web implementation screenshot: `qa/web-overview-v4-revised.png`
- Final iOS implementation screenshot: `qa/ios-overview-v8.png`
- Final Web combined comparison: `qa/comparison-web-v2.png`
- Final iOS combined comparison: `qa/comparison-ios-v1.png`
- API-connected Web screenshot: `qa/web-api-overview-1080x1033-v1.png`

## Viewport And Normalization

### Web

- Source crop: 1080 × 1033 px from the concept board’s Web surface.
- Implementation CSS viewport: 1080 × 1033 at device scale factor 1.
- The Codex in-app preview capture scaled the visible app shell to an 811 × 773 px raster region; the source crop was resized proportionally to the same 811 × 773 comparison size.
- Compared state: Overview, no drawer, initial fixture.

### iOS

- Source crop: 368 × 944 px from the concept board’s mobile surface.
- Implementation app viewport: 393 × 852 CSS px at device scale factor 1.
- Source crop was normalized to 393 × 852 for comparison.
- The protected mobile runtime’s device chrome remains visible in the implementation; app-owned content fidelity is judged inside it.
- Compared state: iPhone, Overview, no sheet, initial fixture.

## Full-View Comparison

The Web comparison preserves the source’s sidebar/content proportions, editorial hero, primary/supporting action relationship, segmented progress, matters/contact split, safety note and quiet surface treatment. The iOS comparison preserves the same hierarchy in one vertical flow, with the required protected status bar, home indicator and device frame.

The combined comparison boards place source and implementation in one raster for direct review. No comparison judgment was made from separate screenshots or code alone.

## Focused Region Comparison

A separate crop was not required after normalization: both combined boards preserve readable 1× text, icons, dividers, status markers, hero actions, matter rows, trusted-contact treatment and bottom navigation in a single view. The full boards were inspected at original resolution.

## Required Fidelity Surfaces

- Fonts and typography: Source Serif 4 reproduces the calm editorial display role; Inter handles UI and body copy. Weight, hierarchy, line height and wrapping match the source relationship without clipped text.
- Spacing and layout rhythm: Web sidebar, reading margins, section dividers and two-column lower region are aligned with the source. iOS safe-area offset and density were refined so the trusted contact remains visible above the tab bar at 393 × 852.
- Colors and visual tokens: warm ivory, deep navy, sage completion state, clay primary action, peach incomplete marker and thin warm dividers map closely to the selected concept. No gradients or glass effects were introduced.
- Image quality and asset fidelity: the target contains no photographic or illustrative raster assets that require generation. Phosphor and Radix library icons replace generated concept glyphs; no emoji, CSS illustration, handcrafted SVG or flattened screenshot UI is used. The template-owned iPhone chrome is intentionally preserved.
- Copy and content: heading, explanation, `3 of 5 essentials`, five matter labels, Maya Chen state and `Directions, not passwords.` match the selected fixture. Simulation/settings copy explicitly avoids false claims about real provider changes or account access.
- Accessibility and responsiveness: semantic headings/regions/buttons, labels, visible focus, keyboard-operable Web controls and non-color status text are present. Mobile controls use practical target sizes and remain scrollable above fixed navigation.

## Comparison History

### Iteration 1

- [P2] iOS app content started too close to the protected status bar, causing `Overview` to visually collide with the time.
  - Fix: increased app-owned top safe-area spacing and compressed nonessential vertical gaps.
  - Post-fix evidence: `qa/ios-overview-v8.png` and `qa/comparison-ios-v1.png` show a clear status/content boundary.
- [P2] iOS initial density pushed the trusted-contact summary below the first screen.
  - Fix: tightened hero, progress, row and section rhythm while preserving minimum usable controls.
  - Post-fix evidence: the complete Maya Chen row and fixed tab bar are visible in `qa/ios-overview-v8.png`.
- [P2] Web trusted-contact action wrapped to two lines despite the single-line source treatment.
  - Fix: applied the source’s compact action size and prevented wrapping.
  - Post-fix evidence: `qa/web-overview-v4-revised.png` and `qa/comparison-web-v2.png`.

### Iteration 2

No actionable P0, P1 or P2 differences remained after comparing the revised captures against the same source/state.

## Interaction And Browser Evidence

Tested in the Codex in-app browser:

- primary action opens the next incomplete Insurance matter;
- saving Insurance changes both platforms from 3/5 to 4/5 and shows success feedback;
- official settings opens a three-item simulated provider checklist;
- Web trusted-contact navigation and iOS Matters tab change the active surface;
- Web and iOS browser console error/warning checks returned zero messages.

API-connected Web recheck on 2026-08-05:

- the 1080 × 1033 layout preserves the approved sidebar/content ratio, editorial hero, action hierarchy, segmented progress and matters/contact split;
- the restored development fixture shows the same `3 of 5 essentials`, matter order and Maya Chen confirmed state;
- typography, ivory/navy/sage/clay palette, dividers and restrained density remain consistent with the selected source;
- editing Insurance changed readiness to 4/5 and persisted after reload; the initial 3/5 fixture was restored after verification;
- the Apple official-setting checkbox also persisted after reload and was restored afterward;
- the trusted-contact paragraph intentionally changed to state that the role does not automatically grant access or ownership; this is a product-truth correction, not an accidental visual drift;
- the API-connected page returned zero console warnings/errors in the final state.

Build evidence:

- Web production build passed; Sites packaging tests passed 4/4.
- iOS prototype TypeScript/Vite production build passed; Sites packaging tests passed 4/4.
- Protected mobile runtime integrity check passed for all 28 locked runtime files.
- The template’s generic `npm run test:runtime` suite initially could not start because its configured Playwright headless Chromium binary was missing. The matching Chromium runtime was installed locally and the complete suite now passes 9/9, including the product-specific three-destination navigation test.

## Findings

No actionable P0, P1 or P2 findings remain.

## 2026-08-11 UI Alignment Audit

The later cross-platform audit found six source-level defects and closed them without page-specific nudges:

- Web full-width secondary actions did not establish a flex alignment context; the shared control now centers the icon/label group with a measured `0px` center delta and preserves the authored `20px` icon.
- The role-policy safety row allowed its `19px` SVG to shrink; shared icon-bearing rows now keep icon geometry fixed.
- The compact `900px` sidebar rule collapsed the active Settings icon; the repaired icon is `23px` and centered.
- The `390px` Web state had no reachable product navigation; an opaque seven-destination bottom navigation now presents `44 × 48px` targets. At `320px`, only the navigation scrolls and the document remains `320px` wide.
- Repeated iOS SF Symbols previously used natural widths; the affected Form sections now share a reusable `28pt` optical icon column.
- Scrolled iOS content could remain visible through the navigation material; standard, scroll-edge, compact and compact-scroll-edge appearances now share one opaque canvas treatment.

Evidence:

- [Editable Figma before/after audit](https://www.figma.com/design/xms4CTEsq37oYcVnM3xu7F?node-id=1-2)
- `output/ui-audit-20260811/web/05-my-plan-1440-final.png`
- `output/ui-audit-20260811/web/06-role-policy-drawer-1440-final.png`
- `output/ui-audit-20260811/web/07-settings-900-final.png`
- `output/ui-audit-20260811/web/08-overview-390-final.png`
- `output/ui-audit-20260811/ios/02-account-preparation-after.png`
- `output/ui-audit-20260811/ios/03-role-disclosure-scrolled-after.png`

The Web geometry checks and iPhone 17e Simulator on iOS 26.5 prove only the rendered states listed above. They do not prove physical-device behavior, Dynamic Type completion, VoiceOver completion or release readiness. The local `output/` captures are ignored build evidence; the Figma file is the durable review board.

## 2026-08-11 Non-blocking First-Use QA

The approved first-use contract is now implemented without turning it into a second design system:

- Web keeps the public explanation and Account gate ahead of private data, then shows three parallel authenticated choices on a usable Overview. Desktop and `390 × 844` browser checks covered guide skip/pause/resume, synthetic example preview, explicit Matter save, no horizontal overflow and empty-state recovery.
- The synthetic example remained absent from `GET /v1/matters`; only the explicit Save action created a draft. Guide answers and registration-equivalent state left readiness at `0 of 5`.
- iOS uses an ordinary SwiftUI sheet with visible `Save & exit`, skip and native dismissal semantics. `Not now` was repaired from a text-only accessibility frame to `314 × 44pt`; the Account resume action measures `358 × 52pt`.
- Simulator Text Size level `5` increased headings, explanatory copy and route rows without collapsing targets. This is focused Dynamic Type evidence for the first-use Overview, not full-app Dynamic Type certification.
- The editable [Figma first-use audit section](https://www.figma.com/design/xms4CTEsq37oYcVnM3xu7F?node-id=6-3) records the three paths, persisted states, platform-native differences and readiness boundary. It is an implementation review record, not a replacement `DESIGN.md`.

Local captures include `output/qa/ios-first-use-overview.png`, `output/qa/ios-first-use-actions.png`, `output/qa/ios-first-use-text-size-5.png` and `output/qa/ios-first-use-paused-overview.png`. They prove the named simulator states only; physical-device behavior, VoiceOver speech order, keyboard traversal of every Web surface, real registration and external usability remain open.

## Follow-up Polish

- [P3] Generated source glyphs and licensed library icons are not identical at every stroke; the implementation keeps one consistent icon family per platform.
- [P3] Final brand naming may change text metrics and should trigger another typography pass when selected.

## Implementation Checklist

- [x] Source and implementation opened and compared in combined inputs.
- [x] Web and iOS normalized to explicit states and sizes.
- [x] P2 findings fixed and visually rechecked.
- [x] Primary interactions and navigation tested.
- [x] Browser console checked.

## 2026-08-11 Mobile Navigation Consolidation QA

Owner feedback identified two related shell problems: the phone-width Web bar exposed seven equal destinations, the older browser-based iOS prototype exposed five, and the shipping SwiftUI roots mixed inline and automatic large-title modes. The repair changes information architecture rather than shrinking more icons:

- Desktop Web keeps the complete workspace side rail.
- Phone-width Web uses `Overview / Matters / More`; `My plan`, trusted contacts, official guides, activity and settings are rows under More. Labels remain visible.
- Shipping iOS uses one native SwiftUI `TabView` with `Overview / Matters / More`; the former Account aggregation is now More, and all three root stacks use native inline titles.
- The browser-based mobile prototype demonstrates the same three destinations and no longer presents its five-item custom bar as the current iOS structure. Its secondary-page top inset was also repaired so the simulated status-bar time does not overlap the heading.

Evidence:

- `390 × 844` Web geometry: three primary targets measured about `111 × 54px`; document horizontal overflow measured `0px`; opening nested Settings kept More as `aria-current="page"`.
- iPhone 17e / iOS 26.5 runtime accessibility snapshot: exactly three tab targets, with More selected and the authenticated More list reachable.
- Web mobile-navigation contract tests pass 2/2; existing Web suites and production build remain green.
- Mobile prototype integrity/build pass and Playwright passes 9/9.
- Shipping iOS build succeeds and 71/71 tests pass.
- Local visual captures: `output/qa/mobile-web-navigation-more-20260811.png` and `output/qa/mobile-prototype-navigation-more-20260811.png`.

This proves the listed local browser and simulator states only. It does not prove physical-device behavior, complete VoiceOver reading order, external usability or that `More` is the final market-tested label.

## 2026-08-11 Full iPhone Layout Matrix

The earlier four-device portrait smoke check is superseded by a repeatable UI-test matrix against the same local QA fixture:

- five representative devices: iPhone SE (3rd generation), 13 mini, 13, 17 Pro and 17 Pro Max;
- portrait and landscape root navigation on every representative device at the default content size;
- all 12 Dynamic Type categories on the shortest SE canvas;
- full primary-surface traversal on SE at default and AX5, iPhone 13 at default and iPhone 17 Pro Max at default, plus 17 Pro AX5 roots;
- exactly three native tabs, selected state, reachability, app-owned minimum target size and visible button labels;
- eight non-mutating editor/preparation destinations with screenshots retained in `.xcresult` bundles.

The final run in `output/qa/ios-layout-matrix-20260811-212104/` records `23 / 23` passing slices and `0` failures; the shipping unit-test scheme then passed `71 / 71`. Visual inspection was deliberately separate from assertions and caught four issues: the Debug identity banner, fixed horizontal icon/status rows, the long contact navigation title and Picker label/value composition at AX5. Shared repairs now reflow these structures vertically and preserve complete wrapping values rather than clipping them.

The SE landscape test also clarified a platform exception: Apple’s native compact-height TabBar reports `36pt` for each hittable accessibility element. The app keeps this system control instead of substituting a custom 44pt bar; portrait and app-owned controls retain the 44pt contract. The matrix runner now keeps only one isolated test simulator booted at a time, restores text size and leaves the Owner’s existing simulators untouched.

This closes the named local simulator layout and Dynamic Type matrix only. Physical-device Display Zoom, actual VoiceOver speech order/traits/rotor/hardware gestures, third-party keyboards, localization expansion, TestFlight and release evidence remain open. The target still requires iOS 17, so physical iPhone X is outside the install boundary; supporting it requires a separately approved minimum-OS change and compatibility pass.

## 2026-08-14 AI-01 Architectural Index Long-Page QA

Date: 2026-08-14  
Selected visual target: `AI-01 · Architectural Index`  
Long-page structure reference: `AI-02 · Architectural Index Long-Page Blueprint`  
Scope: signed-out Web landing and native iOS public Overview; authenticated Calm Continuity workspace is out of this visual replacement scope.

### Source And Evidence

- Selected source: `assets/concepts/rillora-ui-directions-20260814/AI-01-architectural-index.png` (`SHA-256 3103b23005e410616b8f59382693df4b4bbe0840d1c06ebc5f0ec0eb34e41176`).
- Long-page blueprint: `assets/concepts/rillora-ui-directions-20260814/AI-02-architectural-index-long-page-blueprint.png` (`SHA-256 fa19f61e3e775436689ac514625fa7f29e5e62fadca38e29b1e578dcb72884dc`).
- Web normalized comparison: `output/qa/rillora-ai-01-20260814/web-source-comparison-final.jpg` at `390 × 844`.
- Native iOS normalized comparison: `output/qa/rillora-ai-01-20260814/ios-source-comparison.jpg` at `368 × 800`.
- Web long-page implementation: `output/qa/rillora-ai-01-20260814/web-mobile-390x844-full-final.jpg`.
- Native iOS top and bottom: `output/qa/rillora-ai-01-20260814/ios-17-pro-max-hero.png` and `ios-17-pro-max-bottom.png`.

### Comparison Judgment

The implementation preserves the selected source’s graphite canvas, limestone editorial hierarchy, eucalyptus indexing, rust intent action, thin architectural dividers, restrained geometry and black-and-white readability. It deliberately adds a clearer job statement, explicit Free/no-card intent and platform-safe navigation instead of copying the source text literally. Web and iOS share the information sequence but use responsive-document and native-SwiftUI behavior respectively.

`AI-02` is treated as a structural density reference, not a literal phone-length spacing specification. The implemented long page keeps each section readable and scrollable, repeats the explicit private-plan action at the bottom, and keeps the safe example public. The detailed entitlement table remains in `Plan & access`, so the narrative Free/Family section does not become a second checkout.

### Findings Closed

- [P2] The Web lower page initially depended on reveal state, so animation-disabled/full-page evidence could appear blank below the hero. The signed-out long page now renders its lower sections visibly without requiring an observer transition.
- [P2] The native root forced a light color scheme, producing dark status-bar content on the graphite public canvas. AppShell now selects the public dark system chrome while retaining light private surfaces; direct Simulator evidence shows white status icons.
- [P2] The compact Web Family price rendered monthly and annual values as one cramped line. It now uses two explicit price/unit columns with an accessible combined label.
- [P3] The implementation’s public explanation and top CTA make the first viewport slightly denser than the image source. This is an intentional product-truth optimization and remains within the selected visual hierarchy.

### Interaction And Responsive Evidence

- Both Web private-plan actions route to `/account`; Account retains distinct sign-in and create-account actions. The safe example remains public and the architectural index expands/collapses.
- Web reports zero horizontal overflow at `1440 × 1000`, `390 × 844` and `320 × 568`; visible interactions are at least `44 × 44px`. Final app-origin console error/warning output is empty.
- Web production build, 32/32 focused tests and `npm audit` with zero vulnerabilities pass.
- Native UI snapshots expose the public scroll view, Account, safe example, private-plan action, expandable index and exactly three system tabs.
- The current-source native unit suite passes `75 / 75`. The raw matrix records `22 PASS / 1 FAIL`; the unchanged exact standard-device landscape case passes `1 / 1` on rerun. Both records remain in `output/qa/ios-layout-matrix-20260814-212802/`.

### Evidence Boundary

This QA proves only the named local Web states and Simulator states. It does not prove public staging deployment, physical-device accessibility, translated copy, real-user comprehension, payment willingness, production entitlement, legal effect, invitation delivery or release.

No actionable P0, P1 or P2 visual findings remain.

### 2026-08-14 Public Density And Commercial-Timing Correction

- Owner correction: truthful pricing was still premature when exposed in the public navigation and halfway down the homepage. The long page also repeated the same three-part explanation as an index, a separate handoff, Free/Family lists and a downgrade section.
- Web now contains only the hero, expandable architectural index, one compact three-event boundary and final action. At `390 × 844`, measured document height changed from roughly `4745px` to `2405px`; rendered public text has no Plans, Family or price amount, horizontal overflow is `0`, and all visible actions remain at least `44 × 44px`.
- Native signed-out Overview now mirrors the reduced information sequence with platform-native scrolling. Signed-out More exposes only the safe example and Account entry; the plan comparison remains available after authenticated plan-review intent and for a future named paid-capability gate.
- Before/after evidence is stored in `output/qa/rillora-home-reduction-20260814/`. The correction preserves AI-01 color, typography, index behavior, public safe example, public-before-account ordering and map-not-password truth.
- The current raw native matrix is `22 PASS / 1 FAIL`; the only SE landscape navigation observation passed unchanged in an exact `1 / 1` rerun. All updated signed-out commercial-deferral tests passed across five default device classes and all 12 SE content sizes. Evidence is retained under `output/qa/ios-layout-matrix-20260814-230952/`.

## 2026-08-15 Product-Before-Account Public Entry QA

Date: 2026-08-15  
Scope: signed-out Web home and native iOS public Overview after removing public `Free to start` and the above-fold private-plan action.

### Research And Product Judgment

- Direct-category public evidence from Everplans, DGLegacy and Life Ledger shows immediate signup pressure; Trustworthy combines that same pressure with a stronger later interactive sample.
- Airbnb, Notion Marketplace, 1Password's public generator and Apple iPhone demonstrate a more relevant sequence: expose the object or utility first, retain account/purchase as a secondary utility, and ask for commitment after the user forms intent.
- Rillora therefore uses its architectural index as the public product object. This is a timing principle, not a visual copy of any comparator.

### Implementation And Direct Evidence

- Web first viewport: brand, practical job, map-not-password boundary and operable three-part index. It contains no `Free`, price or creation action; `Account` remains visible. The single `Create my private map` action sits after the event-path boundary and routes to `/account`.
- Native first viewport preserves the same sequence with a SwiftUI scroll view, real safe-example destination and the existing `Overview / Matters / More` system tabs. The bottom creation action opens the explicit Account choice.
- Web captures: `output/qa/rillora-first-action-deferral-20260815/web/05-after-mobile-390x844.png`, `06-after-mobile-full.png`, `07-after-desktop-1440x1000.png` and `08-after-mobile-320x568.png`.
- Native captures: `output/qa/rillora-first-action-deferral-20260815/ios/01-after-top.jpg`, `02-after-bottom.jpg` and `03-owner-simulator-top.png`.
- Research captures: `output/qa/rillora-first-action-deferral-20260815/research/`.

### Verification

- Web passes 34/34 focused tests, production build and `npm audit --omit=dev --audit-level=high` with zero vulnerabilities. Current app-origin console review has zero errors and zero warnings.
- At `1440 × 1000`, `390 × 844` and `320 × 568`, document width equals viewport width and no visible action is below `44 × 44px`. The creation action begins at approximately `1737px`, `1754px` and `1822px` respectively, so it is not a first-screen prompt.
- Native current-source unit tests pass 75/75. The full matrix under `output/qa/ios-layout-matrix-20260815-133417/` records a raw 22 PASS / 1 FAIL; the only SE `extra-extra-extra-large` native-tab observation passes unchanged in `se-extra-extra-extra-large-signed-out-rerun.xcresult` (1/1).

### Evidence Boundary

This proves named local browser and Simulator states only. It does not prove staging deployment, physical-device accessibility, external comprehension, conversion lift, payment willingness, translated copy or release readiness. No actionable P0, P1 or P2 visual finding remains in this scope.

final result: passed

## 2026-09-04 iOS Hosted-Consent Placement Correction

Date: 2026-09-04  
Scope: iOS account entry and local Auth0 Form target; no physical device and no live tenant write  
Source evidence: Owner-provided Simulator screenshots of the rejected native page and the actual `login.rillora.xyz` prompt

### Findings And Fix

1. [P1 closed locally] The account action opened a full native agreement page before hosted identity. The page repeated a large heading, product disclaimer, document-version cards, long consent copy and its own CTA. `LegalConsentSheet.swift` and its presentation route are removed; the Simulator now enters the standard system authorization notice and then `login.rillora.xyz` directly.
2. [P1 open externally] The live hosted prompt still has no legal checkbox. The prior compact visual existed only in a static fixture. A supported Auth0 Form／Action desired state is now prepared but cannot be applied until the Owner restores the Auth0 Dashboard session.
3. [P0 closed locally] Removing the native visual could have silently treated login as acceptance. The native client now requires the exact current namespaced Auth0 legal claim before API exchange; missing, malformed, false and stale proof fail closed.
4. [P2 closed locally] The replacement preview contains only a compact `Terms & privacy` heading, one 11px required checkbox line, one 10px no-recurring-charge line and Continue. It removes every rejected product-description, version-card and long-disclaimer block.

### Runtime And Interaction Evidence

- iOS build／run: passed on booted `Rillora-Matrix-17-Pro` Simulator.
- Native suite: `104 passed / 0 failed / 1 skipped`.
- Observed path: `Profile -> Sign in / Sign up -> iOS authorization notice -> login.rillora.xyz`; native legal page absent.
- Hosted Action／contract tests: `8 / 8`.
- Local hosted preview: meaningful page identity／DOM, no framework overlay, zero console warnings／errors, unchecked Continue disabled and checked Continue enabled.
- Preview evidence: `/var/folders/w9/57v4cx3137g74nh7t0g2g2qc0000gn/T/rillora-hosted-consent-preview-20260904.jpg`.
- Simulator evidence: `/tmp/rillora-direct-hosted-login-20260904.png`.

### Evidence Boundary

The local source and Simulator prove removal of the rejected intermediate native page and direct hosted entry. The local preview proves the selected density and interaction only. Auth0 Form creation, Post Login Action deployment／binding, signed claim receipt, checked acceptance, Rillora session issuance and returning-user skip behavior are not yet live evidence. Web remains on its existing compact pre-auth gate during this staged iOS migration. No physical-device behavior is claimed.

final result: native placement passed; live hosted consent blocked on Owner Auth0 login

## 2026-09-04 Native／Hybrid Account Direction

Date: 2026-09-04  
Scope: compiled iOS Account surface and provider gates; no booted Simulator, external OAuth-client creation, Auth0 mutation or physical device  
Supersedes: the undeployed hosted Form target in the preceding section

### Current UI Contract

- Account access is a native full-screen task, not a legal-only sheet and not an immediate browser jump.
- The email input owns the first interaction. The small unchecked Terms／Privacy／electronic-record row follows it directly; no legal headline, version cards or disclaimer paragraphs are present.
- Every method is disabled before acceptance.
- Apple uses the system `SignInWithAppleButton` when configured.
- Google and Passkey are omitted rather than disabled or faked until their explicit native configurations are complete.
- `Other sign-in methods` truthfully identifies the hosted fallback; supporting copy names Google, Passkey and recovery as current fallback behavior while native gates remain closed.

### Compile Evidence

- XcodeGen: passed with Auth0 and GoogleSignIn `9.0.0` dependencies.
- Simulator build without booting a device: passed.
- Generic iOS Simulator `build-for-testing` with signing disabled: passed for app and unit-test targets.
- Google gate requires enable flag, iOS client ID and server Web client ID; incomplete configuration fails closed.
- Passkey gate requires explicit enablement; associated-domain entitlement is present but activation remains external.

### Open Visual Evidence

All installed Simulators were shut down at this checkpoint. The new page has not yet been installed, rendered, measured for overflow, exercised unchecked／checked, or reviewed at accessibility sizes. Google Cloud client creation is also unsaved. The prior hosted-login screenshot is evidence only for the superseded immediate-browser route, not this new native Account result.

final result: source and test targets compile; runtime visual QA pending an Owner-booted Simulator

### 2026-08-28 Second-Pass Prominence Reduction

Owner feedback: the first compact pass remained too visually prominent.

#### New Evidence

- Refined Web Account desktop: `/tmp/rillora-consent-refine-YFJS2o/01-account-desktop.jpg`, `1280 × 720`, DPR `1`.
- Refined Web Account mobile: `/tmp/rillora-consent-refine-YFJS2o/02-account-mobile.jpg`, `390 × 844`, DPR `1`.
- Refined Auth0 target desktop: `/tmp/rillora-consent-refine-YFJS2o/03-auth0-desktop.jpg`, `1280 × 720`, DPR `1`.
- Iteration comparisons: `/tmp/rillora-consent-refine-YFJS2o/04-account-desktop-iteration.jpg`, `05-account-mobile-iteration.jpg`, and `06-auth0-iteration.jpg`.

#### Comparison History

1. [P2 closed] The `Continue securely` heading and descriptive line still framed consent as a standalone content section. Both were removed. The Account action column now begins with the compact legal row followed immediately by the primary and secondary actions.
2. [P2 closed] Sage legal links and 12px／11px copy remained more noticeable than the reference form-tail treatment. The label is now muted 11px, links use ordinary body color, the checkbox is 16px, and the 10px non-billing boundary is shortened to one line where space permits. The entire label remains clickable and focusable.
3. [P2 closed] The Auth0 target received the same treatment below the email input: reduced spacing, muted copy, neutral links and a shorter boundary. The input, Create account action and provider choice remain the dominant hierarchy.

#### Required Fidelity Surfaces

- Typography: display and action typography are unchanged; legal copy is deliberately subordinate without altering the exact acceptance meaning.
- Spacing: the Account legal row no longer introduces its own section header or preamble; the primary action follows after 12px. Auth0 follows the input after 10px and the CTA after 12px.
- Colors: bright sage emphasis was removed from legal links; muted／body tokens preserve readable contrast against graphite.
- Images／icons: unchanged; no new assets or approximations.
- Copy: `Terms of Service` shortens to linked `Terms`; the recurring-charge line becomes `Required for account access. No recurring charge.` Terms／Privacy／electronic-record semantics and the server payload remain unchanged.

#### Verification

- Unchecked and checked button states pass on Web Account and Auth0 target.
- Desktop and `390 × 844` Web Account have zero horizontal overflow.
- Browser console warning／error count is zero on both surfaces.
- Web focused tests pass `41 / 41`; internal build and `git diff --check` pass.

final result: passed

## 2026-08-15 DG-01–DG-04 Global Graphite All-Surface QA

Date: 2026-08-15  
Scope: native iOS signed-out roots, authenticated roots and every current editor/preparation/rehearsal/export route; shared Web semantic color system  
Status: PASSED LOCAL SOURCE-TO-IMPLEMENTATION QA; PHYSICAL AND EXTERNAL GATES OPEN

### Selected Targets

- `assets/concepts/rillora-dark-ui-20260815/DG-01-public-continuity.png`
- `assets/concepts/rillora-dark-ui-20260815/DG-02-private-map.png`
- `assets/concepts/rillora-dark-ui-20260815/DG-03-guided-preparation.png`
- `assets/concepts/rillora-dark-ui-20260815/DG-04-rehearsal-export.png`

The target set was generated as one coordinated system after inventorying every current route. Generated placeholder names, monetary values, providers and device chrome were excluded from implementation; only the visual grammar and hierarchy were adopted.

### Combined Comparison Inputs

- Public Matters: `output/qa/rillora-dark-ui-20260815/compare-matters.png` places the `DG-01` Matters crop on the left and the same native signed-out state on the right.
- Simulation: `output/qa/rillora-dark-ui-20260815/compare-simulation.png` places the `DG-04` rehearsal crop on the left and the same native authenticated state on the right.

The comparison judges app-owned content rather than generated or Simulator device chrome. Both combined rasters were inspected at original resolution; the implementation preserves the matte graphite canvas, limestone hierarchy, eucalyptus structure/current state, rust-clay primary action, compact tonal panels, thin dividers and restrained radii. Native SwiftUI tab bars, toolbar controls, pickers and safe areas intentionally remain system behavior rather than flattened copies of generated controls.

### Full Child-Surface Inspection

The focused UI run opened and captured signed-out Matters, signed-out More, new Matter, role scope, trusted-contact editor, Plan & access, motivation, official checks, Simulation, role disclosure and Start Here. All 11 attachments are indexed by `output/qa/rillora-dark-ui-20260815/targeted-attachments/manifest.json` and retained in `targeted-1.xcresult`.

Inspection confirmed:

- no route returns to the previous cream canvas or white floating cards;
- pushed routes and sheets keep dark system chrome and readable navigation controls;
- dense forms use dark structured groups instead of undifferentiated light `Form` styling;
- long safety/product boundaries use compact evidence panels or progressive disclosure;
- the same native `Overview / Matters / More` shell remains available without introducing a second custom tab bar;
- commercial copy remains absent from signed-out roots and Account entry; `Plan & access` is still the explicit commercial-intent destination.

### Findings Closed

- [P1] Public Home and private/root tools looked like two unrelated products. The shared semantic token layer and unconditional dark shell now govern all app-owned surfaces.
- [P2] Child routes inherited generic cream `List`/`Form` groups with equal visual weight. Shared structured-list, boundary-panel and primary-action components now establish one hierarchy across editors, preparation and rehearsal.
- [P2] Several Web components retained hard-coded light-surface colors after the token switch. Inputs, role/rehearsal states, helper copy, navigation and warning surfaces now use the global dark semantic variables.
- [P2] Plan explanation could reappear as a dominant root message. Plan economics remain centralized behind the explicit authenticated `Plan & access` route.

### Current Verification

- Native `Rillora` Debug build succeeds on the ordinary iPhone 17 Pro Max Simulator.
- Focused native navigation and child-surface run passes `2 / 2` tests with `11` visual attachments.
- Web production build passes; the seven focused suites pass `30 / 30` tests.
- The native unit suite passes `75 / 75` tests.
- The complete five-device/orientation/Dynamic Type matrix retains an original `22 / 23` result. Its only failure came from the UI helper treating a row as tappable while the row center was behind the native Tab Bar. The exact same iPhone SE, largest accessibility size and deep-surface case passed `1 / 1` after correcting that hit-target visibility check, giving effective named-slice coverage of `23 / 23` without deleting the raw failure.

No actionable P0, P1 or P2 visual finding remains in the directly inspected iPhone 17 Pro Max states.

Physical-device Display Zoom, VoiceOver speech order, localization, external comprehension, staging deployment and release proof remain open.

final result: passed

## 2026-08-16 Signed-out More And Add-a-matter Navigation QA

Date: 2026-08-16  
Scope: selected native Tab state, signed-out More density and the Matters-to-Account transition  
Status: PASSED FOCUSED LOCAL SIMULATOR QA; PHYSICAL AND EXTERNAL GATES OPEN

### Findings Closed

- [P2] The selected `More` state depended on a low-contrast gray capsule and muted eucalyptus foreground. The selected item now uses a brighter eucalyptus token and filled symbol while preserving the native system TabView and accessibility-selected value.
- [P2] Signed-out More repeated three product/security statements already available contextually elsewhere. The complete `Security boundary` section is removed; the root now contains only the safe example and neutral Account utility.
- [P1] `Add a matter` opened a half-height Account sheet whose content could be partially hidden. It now pushes a full Account child page in the Matters navigation stack, uses system Back, hides the Tab Bar while focused and omits sheet-only dismissal actions.
- [P1] The first largest-Dynamic-Type screenshot technically passed automation but showed horizontal button content colliding. Accessibility sizes now use a vertical action layout; the final screenshot has no icon/text overlap and retains scrolling without capping Dynamic Type.

### Evidence

- `output/qa/rillora-entry-navigation-20260816/attachments-17-pro-max-final/manifest.json`: final ordinary-device Matters, full Account child page and simplified More screenshots.
- `output/qa/rillora-entry-navigation-20260816/attachments-se-ax5-final/manifest.json`: same journey on iPhone SE at `accessibility-extra-extra-extra-large` after the adaptive-button correction.
- `output/qa/rillora-entry-navigation-20260816/focused-17-pro-max.log`: focused signed-out regressions pass `2 / 2`.
- `output/qa/rillora-entry-navigation-20260816/focused-se-ax5.log`: complete signed-out journey passes `1 / 1` at the largest accessibility size.
- `output/qa/rillora-entry-navigation-20260816/unit-75.log`: current-source native unit suite passes `75 / 75`.

No staging deployment, physical-device Display Zoom, spoken VoiceOver order, localization or external comprehension is proven.

final result: passed

## 2026-08-16 Native Profile Information Architecture QA

Date: 2026-08-16  
Scope: native Overview Account placement, third-tab naming, signed-out Profile density and child-page navigation  
Status: PASSED FOCUSED SIGNED-OUT SIMULATOR QA; AUTHENTICATED FULL-MATRIX RERUN OPEN

### Findings Closed

- [P2] Account appeared both in the public Overview toolbar and in the third aggregation destination. The Overview copy and safe index now own the first page; Account is centralized in Profile and still appears contextually when a user tries to save private information.
- [P2] `More` described neither a user goal nor the expanded content family. Native iOS now uses `Profile`; mobile Web intentionally keeps `More` until its own navigation is changed.
- [P2] The signed-out third root was underfilled. It now contains Account, safe example, How Rillora works, Safety & privacy, App settings and About Rillora without duplicating the full Overview or surfacing plans/prices.
- [P2] Support content previously had no stable destinations. All four new child pages are real NavigationStack routes with native Back, inline titles, shared graphite styling and Dynamic Type-safe lists.

### Evidence

- `output/qa/rillora-profile-navigation-20260816/unit-75-of-75.xcresult`: current-source unit suite passes `75 / 75`.
- `output/qa/rillora-profile-navigation-20260816/signed-out-17-pro-max-2-of-2.xcresult`: strengthened signed-out regressions pass `2 / 2` and traverse Account plus every new child page.
- `output/qa/rillora-profile-navigation-20260816/signed-out-se-1-of-1.xcresult`: the same complete signed-out path passes `1 / 1` on iPhone SE 3.
- `output/qa/rillora-profile-navigation-20260816/profile-root-17-pro-max.jpg`: direct runtime screenshot of the selected Profile root.
- `output/qa/rillora-profile-navigation-20260816/authenticated-17-pro-max-3-of-3.xcresult`: authenticated portrait, orientation and deep-route traversal passes `3 / 3` with the isolated synthetic QA API.
- `output/qa/rillora-profile-navigation-20260816/authenticated-api-precondition-failure.xcresult`: retained initial `0 / 3` prerequisite attempt before that API was started.

The test-only API listened on `127.0.0.1:4181` only for the focused authenticated rerun and was stopped afterward. The prior complete `23 / 23` device／Dynamic Type matrix belongs to the More-labelled candidate and is not silently relabelled as current Profile evidence; the current Profile candidate still needs a fresh full matrix. Physical-device Display Zoom, spoken VoiceOver order, localization, staging deployment and external comprehension remain open.

final result: passed for the focused signed-out scope; authenticated complete matrix pending

## 2026-08-16 Profile Action-Clarity And Safety De-duplication QA

Date: 2026-08-16  
Scope: native signed-out Profile affordance, unique task ownership, Safety child structure and maximum-Dynamic-Type traversal  
Status: PASSED FOCUSED LOCAL SIMULATOR QA; FULL FRESH MATRIX, PHYSICAL AND EXTERNAL GATES OPEN

### Findings Closed

- [P1] Tappable Profile groups differed from the graphite canvas by too little and relied on pale text or the system chevron. The new action surface is materially brighter, icons use filled eucalyptus tiles, titles use limestone, purposes use readable body color and external／forward actions carry explicit accessories.
- [P1] `Safety & privacy` appeared at the Profile root and again inside an App settings shell. App settings is removed; the single root Safety destination owns the complete safety family.
- [P2] `How Rillora works` duplicated the already operable Overview, while App settings showed two non-editable status rows. Both filler routes are removed. The direct iPhone Settings row performs the actual system action.
- [P1] The prior Safety page was a long equal-weight policy wall. It now offers two task choices: a safe-information checklist and disclosure safeguards with progressive event detail.
- [P2] About was mostly static product copy. It now exposes installed version/build and a working copy action; product boundary is reduced to one compact, truthful line.
- [P2] Authenticated Profile repeated a passive Security boundary block beside Safety. The block is removed and the single Safety task hub remains available from support/settings.

### Evidence

- `output/qa/rillora-profile-actions-20260816/profile-root-current.jpg`: final ordinary-device Profile root.
- `output/qa/rillora-profile-actions-20260816/unit-final-75-of-75.xcresult`: final current-source unit suite.
- `output/qa/rillora-profile-actions-20260816/signed-out-17-pro-max-2-of-2.xcresult`: full ordinary signed-out regression pair.
- `output/qa/rillora-profile-actions-20260816/signed-out-se-ax5-1-of-1.xcresult`: complete AX5 small-screen traversal.
- `output/qa/rillora-profile-actions-20260816/se-ax5-precondition-lazy-row-failure.xcresult` and `se-ax5-precondition-hidden-row-failure.xcresult`: retained raw test-assumption failures.
- Direct runtime inspection confirmed the iPhone Settings action opened the Settings app; About copy confirmation and both nested Safety routes were covered by UI automation.

No staging deployment, Auth0/API/payment change, physical-device accessibility, localization, external comprehension or release proof occurred.

final result: passed for the focused Profile action scope

## 2026-08-16 Profile Task-Pruning QA

Date: 2026-08-16  
Scope: signed-out and authenticated Profile task ownership after removing duplicate／taskless actions  
Status: PASSED STATIC RUNTIME AND COMPILE CHECK; UI AUTOMATION AND FRESH MATRIX OPEN

### Findings Closed

- [P1] `Open a safe example` duplicated Overview's existing interactive example path. It is removed from Profile without removing the public example itself.
- [P1] `iPhone settings` opened the Settings app but had no named Rillora permission, blocked capability or recovery task. It is removed from both signed-out and authenticated Profile.
- [P2] The `Privacy & settings` heading no longer described the remaining About destination. The residual group is now `Rillora` and contains only working Safety and About routes.
- [P2] No replacement filler was added. Signed-out Profile intentionally has three tasks: Account, Safety & privacy and About Rillora.

### Evidence And Boundary

- `output/qa/rillora-profile-simplification-20260816/profile-signed-out-17-pro-max.png`: ordinary iPhone 17 Pro Max static runtime screenshot of the three-task Profile.
- Current-source unit tests pass `75 / 75`; the app installs and launches from the final restored Overview default.
- `Rillora` and `RilloraLayoutMatrix` schemes compile with no reported warning or error in this workstream.
- UI-test assertions now require `public-profile.example` and `public-profile.iphone-settings` to be absent. They were not executed because the current iOS 26.5 runtime repeatedly crashes SpringBoard while initializing `XCTAutomationSession`; no automated traversal, SE/Dynamic Type or full-matrix pass is claimed.

No staging deployment, Auth0/API/payment change, physical-device accessibility, localization, external comprehension or release proof occurred.

final result: passed for the narrowed static/compile scope; automated interaction matrix pending a stable simulator automation path

## 2026-08-17 Unified Account Child-Page QA

Date: 2026-08-17  
Scope: all signed-out native Account triggers and the Profile-to-Account transition reported as clipped  
Status: PASSED FOCUSED ORDINARY-DEVICE RUNTIME／COMPILE CHECK; FRESH AUTOMATED MATRIX OPEN

### Findings Closed

- [P1] Profile still opened the shared Account task as a bottom sheet even though Matters had already moved the same task to navigation. All Account triggers now push the same full child page from the originating tab.
- [P1] The sheet could show a partial task and added competing dismissal controls. Account now owns the full viewport below native navigation, remains scrollable, hides the Tab Bar while focused and uses only system Back.
- [P2] Route-dependent behavior made future regressions likely. Overview, public-example save／adapt, Matters and Profile now share one navigation-only `AccountEntryView`; sheet-specific presentation state and controls are removed from the implementation.

### Evidence And Boundary

- `output/qa/rillora-account-navigation-20260817/profile-account-child-page.jpg`: ordinary iPhone 17 Pro Max runtime capture. The complete heading, explanation, both identity actions and safety note are visible without a bottom-sheet edge.
- The runtime semantic snapshot exposes a `Profile` Back button, `Create account`, `Sign in` and the `account-entry.view` scroll view; no Account `Close`, `Not now` or sheet handle is present.
- The Rillora Debug app builds, installs and launches; current-source unit tests pass `75 / 75`; the updated RilloraLayoutMatrix scheme compiles.
- XCUITest was not run because the retained iOS 26.5 environment fault crashes SpringBoard while initializing `XCTAutomationSession`. No SE／maximum-Dynamic-Type, VoiceOver, physical-device or complete-matrix pass is claimed from this workstream.

No staging deployment, Auth0/API/payment change, external communication or real-data handling occurred.

final result: passed for the focused ordinary-device navigation correction; fresh automated matrix pending a stable simulator automation path

## 2026-08-17 Repeated Small-Copy Pruning QA

Date: 2026-08-17  
Scope: signed-out Overview final section and full Account child page  
Status: PASSED FOCUSED ORDINARY-DEVICE VISUAL／COMPILE CHECK; FRESH AUTOMATED MATRIX OPEN

### Findings Closed

- [P2] The event boundary repeated `Death / Incapacity / Unreachable` as tiny uppercase labels beneath an already complete heading, then added another small disclaimer. Both caption layers are removed; the readable heading now leads directly to the final creation section.
- [P2] Account repeated map／password／secret guidance after the two identity actions in caption text. The task now ends cleanly after `Create account / Sign in`; contextual safety education remains elsewhere.
- [P2] Deleting the content initially risked leaving inherited spacing from the old caption group. The final implementation reduces the section rhythm and uses a deliberate eight-point transition into `Make this map yours.` rather than preserving an empty block.

### Evidence And Boundary

- `output/qa/rillora-small-copy-pruning-20260817/overview-without-repeated-small-copy.jpg`: Overview final section without the event-label/disclaimer block.
- `output/qa/rillora-small-copy-pruning-20260817/account-without-footer-copy.jpg`: Account child page without the map／secret footer.
- Direct runtime semantic inspection shows the Account page has only Back, Create account, Sign in and its scroll container as actionable structure; the removed footer is absent.
- Rillora Debug builds, installs and launches; current-source unit tests pass `75 / 75`; the updated RilloraLayoutMatrix scheme compiles.
- XCUITest was not executed because the retained iOS 26.5 environment fault crashes SpringBoard during `XCTAutomationSession` initialization. No fresh SE／Dynamic Type, VoiceOver, physical-device or complete-matrix pass is claimed.

No staging deployment, Auth0/API/payment change, external communication or real-data handling occurred.

final result: passed for the focused ordinary-device information-hierarchy correction

## 2026-08-17 Real Product Index And Example Retirement QA

Date: 2026-08-17  
Scope: shipping Web/iOS public index, signed-out Matters and authenticated first-use entry  
Status: PASSED FOCUSED RUNTIME／BUILD／UNIT CHECK; FRESH AUTOMATED DEVICE MATRIX OPEN

### Findings Closed

- [P1] Public Overview entered with `02` expanded. Web and iOS now initialize the index to `01`; the native runtime semantic tree reports 01 `Expanded` and 02/03 `Collapsed` on every fresh launch.
- [P1] Public and first-use surfaces still depended on example labels, fake records, example sheets and a prefilled draft. Those product paths and their state/callback/CSS/test hooks are removed instead of renamed.
- [P2] Signed-out Matters looked like it contained a saved insurance record. It now explains the four real fields a Matter may contain and does not impersonate user data.
- [P2] First use exposed three choices even though only two lead to real product work. It now offers direct Matter creation and the optional resumable guide.

### Evidence And Boundary

- `output/qa/rillora-real-product-index-20260817/ios-overview-default-01.jpg`: fresh signed-out Overview with 01 expanded and no example label/action.
- `output/qa/rillora-real-product-index-20260817/ios-matters-real-structure.jpg`: signed-out Matters with real schema explanation and no fake insurance record.
- Native runtime semantics confirmed 01→02 state switching without navigation to a preview route.
- Shipping `apps/ios/Rillora` and `apps/web/src` source scans contain no user-facing `example` path. Test-only reserved domains and cryptographic rehearsal fixtures are not product UI.
- Rillora Debug builds, installs and launches; current-source iOS unit tests pass `75 / 75`; RilloraLayoutMatrix compiles; Web production build and all focused tests pass `34 / 34`.
- XCUITest was not executed because the retained iOS 26.5 environment fault crashes SpringBoard during `XCTAutomationSession` initialization. No fresh SE／Dynamic Type, VoiceOver, physical-device or complete-matrix pass is claimed.

No staging deployment, Auth0/API/payment change, external communication or real-data handling occurred.

final result: passed for the focused production-facing surface correction

## 2026-08-17 Hosted Authentication Local Design QA

Date: 2026-08-17  
Scope: versioned Auth0 Universal Login theme, Liquid shell and non-authenticating local visual fixture  
Status: HISTORICAL LOCAL CHECKPOINT; SUPERSEDED BY THE LIVE DEVELOPMENT-TENANT QA BELOW

### Source And Intent

- Product source: current graphite Web/iOS tokens and the ordinary iPhone Account child-page capture in `output/qa/rillora-account-navigation-20260817/profile-account-child-page.jpg`.
- Current provider source: Owner's 2026-08-17 iOS system-browser capture of the generic white `login.rillora.xyz` signup prompt.
- Desired source: `docs/authentication-experience.md`, `infra/auth0/universal-login/theme.json` and `page-template.liquid`.
- The target is not a new landing page. It is the existing Rillora graphite system applied to a hosted authentication task while Auth0 retains the secure widget.

### Findings Closed Locally

- [P1] Authentication changed from graphite Rillora to a generic white provider page. The desired theme now uses graphite canvas and widget surfaces, limestone/body text, eucalyptus focus and one clay primary action.
- [P1] The provider mark appeared as if it were the product logo. The page template hides the widget logo and uses only the Rillora text wordmark because no final symbol is approved.
- [P2] Provider-generated application wording repeated `Rillora` and `Rillora iOS` instead of describing the account task. The focused contract now defines short signup/login/recovery task copy; exact keys will be applied only after current prompt readback.
- [P2] White-page mobile composition left large empty space and did not feel related to the app. The compact target removes the desktop editorial panel, places the wordmark over a single scrollable task and preserves the browser-owned custom-domain chrome.
- [P2] White label text on `#CB704C` did not meet normal-text contrast in the calculated pair. Auth0 primary action labels use graphite `#171C1C`, producing approximately `4.89:1` contrast against the clay fill.

### Local Evidence And Boundary

- Chrome directly inspected the local fixture at compact and desktop widths.
- DOM viewport checks at `320 × 568`, `390 × 844` and `1440 × 900` report document `scrollWidth` equal to viewport width and `clipped: false` in all three states.
- `jq` accepts the desired theme JSON; the Liquid file contains exactly one `auth0:head` and one `auth0:widget`; page-template size is 5,421 bytes, below Auth0's 100KB limit; the replayable apply script passes `bash -n`.
- The local fixture does not use Auth0 and cannot prove real widget dimensions, password rules, passkey/MFA/recovery/error expansion, callback behavior or security.
- At this historical checkpoint the official Auth0 CLI session was still awaiting Owner authorization and no remote value had yet changed. The following live QA entry supersedes that deployment state without erasing this pre-apply evidence.

final result at this historical checkpoint: local visual direction and responsive shell passed; the following entry records the later development-tenant apply/readback and live route checks

## 2026-08-17 Hosted Authentication Live Development-Tenant QA

Date: 2026-08-17  
Scope: Auth0 EU development tenant theme/template/custom text, live compact and desktop prompts, Web staging Account routes and native iOS system-authentication entry/cancel  
Status: PASSED CONFIGURATION READBACK AND NO-CREDENTIAL LIVE ROUTE QA; FULL CREDENTIAL, PRODUCTION, PHYSICAL-DEVICE AND RELEASE GATES OPEN

### Findings Closed

- [P1] The prior checkpoint was only a static fixture. Theme `GpJAJlTXdfUIS8CxG2bjw5EnI3NZEceJ`, the Liquid page shell and five English prompt dictionaries are now applied to `rillora-dev.eu.auth0.com` and read back from the tenant.
- [P1] A first-time tenant cannot be updated through a nonexistent default-theme id. The apply script records `theme_not_found`, creates the first theme, then uses exact readback; later runs update the returned id.
- [P2] The live page requested a missing favicon although no final Rillora symbol exists. An empty data-URI now makes the unresolved identity state explicit without fabricating a mark or leaving a 404.
- [P1] Inline recovery and account-switch actions were smaller than the 44px interaction contract. Semantic `a` and `button` rules now raise those targets without binding CSS to Auth0 private generated classes.
- [P1] A hosted page is not sufficient unless product routes reach it. Web staging Sign in／Create account and native iOS Sign in／Create account independently reached `login.rillora.xyz`; native cancel returned to the full Account child page in both cases without an error alert.

### Evidence

- `output/qa/rillora-auth0-universal-login-20260817T080723Z/`: final theme/template apply and readback manifest.
- `output/qa/rillora-auth0-custom-text-20260817T075929Z/`: before/after/response dictionaries and readback manifest.
- `output/playwright/rillora-auth0-live-20260817/`: final signup 320／390／desktop, login, recovery and Web staging-route captures.
- `output/qa/rillora-auth0-live-ios-20260817/`: native Create account, Sign in and both post-cancel Account captures.
- `output/qa/rillora-auth0-live-20260817/README.md`: exact control measurements and exclusions.

Signup had no horizontal overflow at 320／390／1440px. At 390px, the checked login controls measured 52px input, 44px recovery, 52px Continue, 44px Create account switch, 52px passkey and 52px Google. Recovery measured 52px input, 44px Continue and 44px Back to sign in. Final checked sessions reported no captured console error.

### Open Boundaries

- No email, password, MFA code or Google credential was entered. No account creation, authenticated callback, password, passkey, Google, recovery delivery, verification, challenge or logout completion is claimed.
- The visible Auth0 Dev Keys warning remains because Google still uses Auth0 development keys. Production needs an Owner-controlled Google OAuth client and separate social-login verification; hiding the warning is not an accepted design fix.
- This is an EU development tenant, Web staging and iOS Simulator check. It does not prove production identity, physical-device behavior, full Dynamic Type／VoiceOver／localization, WCAG conformance, email delivery, App Store readiness or release approval.

final result: deployed graphite experience and exact no-credential routes pass within the stated development/staging scope; credential-family and production gates remain open

## 2026-08-17 Direct Hosted Authentication Entry QA

Date: 2026-08-17  
Scope: signed-out native Profile entry, removal of duplicate Account/provider UI and compact hosted-page treatment  
Status: PASSED FOCUSED LOCAL SIMULATOR AND NO-CREDENTIAL LIVE VISUAL QA; CALLBACK, PHYSICAL-DEVICE AND RELEASE GATES OPEN

### Findings Closed

- [P1] App and Auth0 both presented identity choices. The native Account child page and its email/Apple/Google group are removed from the current route; Profile now has one direct `Sign in / Sign up` action.
- [P1] The intermediate Account page had no unique product task once hosted login owned all methods. Profile and signed-out private actions now call one hosted-authentication callback while first launch remains public.
- [P2] The hosted Apple glyph was black on graphite. Only the Apple provider glyph now receives a white monochrome filter through stable provider data attributes; Google's multicolor mark is unchanged.
- [P2] The upper-right exclamation was visually unexplained. Live DOM identifies it as Auth0's `Dev Keys` warning. It is intentionally retained until the Google connection uses an Owner-controlled production OAuth client.

### Evidence And Boundary

- `output/qa/rillora-direct-hosted-auth-20260817/README.md` indexes Profile, Matters, Safety/About, hosted compact page and final install evidence.
- Current-source unit tests pass `77 / 77`; the two focused signed-out UI regressions pass `2 / 2` on iPhone 17 Pro Max.
- At `390 × 844`, the hosted page has no horizontal overflow and the checked browser session emitted no console error.
- No provider was clicked and no credential, callback, private plan, physical device, production Google key, App Store review or Release result is claimed.

final result: passed for the direct-entry information architecture and checked hosted-page appearance

## 2026-08-20 Authenticated Root Density And Profile Consistency QA

Date: 2026-08-20  
Scope: authenticated empty-state `Overview / Matters / Profile` on the Owner-controlled iPhone 17 Pro Max Simulator session  
Status: PASSED CURRENT-RUN DEFAULT-SIZE VISUAL／SEMANTIC QA AND AX5 REFLOW CHECK; FULL XCUITEST EXECUTION, PHYSICAL DEVICE AND EXTERNAL COMPREHENSION OPEN

### Audit Steps And Health

1. **Overview before — unhealthy.** The same empty state was repeated by a hero paragraph, progress card, empty-Matters card and trusted-contact card. The longest text was a legal-role disclaimer rather than the next useful action.
2. **Profile before — unhealthy.** Tappable actions, passive status and internal `Policy version` shared one card family; `Why I’m preparing` used a different green row inside a black status card. Each action then repeated explanatory copy beneath it.
3. **Matters before — needs correction.** An empty plan rendered empty `Added` and `Needs review` sections plus a paragraph explaining the status, rather than giving the user one clear empty-state action.
4. **Overview after — healthy in the checked state.** One short title, one Add action and one progress surface now carry the hierarchy. The progress ring, Matter count and trusted-contact status are compact and actionable; separate empty cards and long disclaimers are gone.
5. **Profile after — healthy in the checked state.** All root actions use one action surface, icon block, stroke and type hierarchy. Plan／session status is compact; `Policy version` and long contact／guide footers are absent; preparation and support destinations are icon-led grids.
6. **Matters after — healthy in the checked state.** One centered SF Symbol, a two-line empty state and one Add action replace empty list sections. No fake Matter or authority claim is introduced.

### Structural Changes

- Overview removes the duplicate hero Add action when the two-path first-use starter is visible. The starter itself now uses two compact visual actions and one short progress-truth line.
- Progress is represented with a native circular completion indicator and numeric transition. `accessibilityReduceMotion` disables ring and count animation.
- Empty Overview no longer renders prose-only Matter or trusted-contact cards. Matter and contact status become two status/action modules; a populated plan still exposes up to three Matter rows and `View all`.
- Profile removes `Authentication / Continuity status / Policy version` from a mixed passive/action card. `Plan & access` now carries only the useful plan, continuity and session summary.
- Contact creation says `Record only · sends nothing`; detailed invitation／authority boundaries remain in the contact workflow instead of occupying the root.
- Preparation is a four-tile grid (`Official checks / Simulation / Disclosure / Start Here`); `Safety & privacy / About` use the same tile anatomy. Ordinary widths use two columns, accessibility sizes use one.
- The former 600-line Account file is split into orchestration, authenticated root content, dashboard components and support destinations. Overview dashboard components are likewise separated from root orchestration.

### Accessibility And Interaction Evidence

- Runtime semantic inspection exposes one progress metric control per destination, not duplicate nested accessibility buttons. The final post-build tree also keeps `overview.progress`, `overview.open-matters` and `overview.open-profile` as three unique identifiers instead of inheriting the card identifier onto both actions.
- The four preparation controls retain their full accessibility labels and existing identifiers; an actual `Official provider checks` tile push／Back cycle succeeded.
- Maximum `accessibility-extra-extra-extra-large` was applied and visually inspected. Overview progress changes to a vertical composition; Profile action labels move below the icon／badge row, avoiding the earlier mid-word fragmentation. Tool grids become one column and remain scrollable.
- The Simulator content size was restored to `large` after inspection.
- The Layout Matrix target compiles with a new authenticated-root condensed-hierarchy regression. Full XCUITest execution is not claimed because the retained iOS 26.5 `XCTAutomationSession`／SpringBoard environment fault remains.

### Evidence

- `qa/authenticated-ux-audit-2026-08-20/01-overview-before.png`
- `qa/authenticated-ux-audit-2026-08-20/02-profile-before.png`
- `qa/authenticated-ux-audit-2026-08-20/03-overview-after.jpg`
- `qa/authenticated-ux-audit-2026-08-20/04-profile-after.jpg`
- `qa/authenticated-ux-audit-2026-08-20/05-profile-tools-after.jpg`
- `qa/authenticated-ux-audit-2026-08-20/06-overview-ax5.jpg`
- `qa/authenticated-ux-audit-2026-08-20/07-profile-ax5.jpg`
- `qa/authenticated-ux-audit-2026-08-20/08-overview-comparison.jpg`
- `qa/authenticated-ux-audit-2026-08-20/09-profile-comparison.jpg`
- `qa/authenticated-ux-audit-2026-08-20/10-matters-before.jpg`
- `qa/authenticated-ux-audit-2026-08-20/11-matters-after.jpg`
- `qa/authenticated-ux-audit-2026-08-20/12-matters-comparison.jpg`

The three comparison images place the current-run before and after states in the same normalized input; judgments were not made from code or isolated screenshots alone.

### Verification Boundary

- XcodeGen regeneration passes.
- Native Debug build/run passes on `Rillora-Matrix-17-Pro-Max`.
- Native tests: `87 passed / 0 failed / 1 skipped`; the retained skip is the separately documented iOS 26.5 StoreKitTest tool regression.
- Release Simulator build passes.
- `RilloraLayoutMatrix` build-for-testing passes with the updated root-density assertions.
- Runtime logs contain no Rillora product error; the only matched warning is the existing iOS 26.5 duplicate WebKit/WebCore accessibility-loader warning.

This proves the current empty authenticated roots on one Simulator at default and maximum accessibility text size. It does not prove every populated-data combination, landscape, five-device matrix, physical-device VoiceOver／Display Zoom, localization, external comprehension, market improvement or release readiness.

final result: passed for the authenticated root redesign and checked evidence scope

## 2026-08-20 Common Provider Official-Guide QA

Date: 2026-08-20  
Scope: authenticated Web／iOS official-provider catalog, Apple detail, Binance correction, official external link and AX5 reflow  
Status: PASSED LOCAL DEFAULT-SIZE／AX5 VISUAL AND SEMANTIC QA; FULL XCUITEST, PHYSICAL DEVICE, PROVIDER OUTCOME AND EXTERNAL COMPREHENSION OPEN

### Audit Steps And Health

1. **Prior iOS checklist — unhealthy.** It displayed a provider name, a generic `I checked this provider` toggle and an internal policy snapshot, but no official URL, no action steps and no separation between living-user setup and a later estate request.
2. **Provider research — healthy within the current official-source scope.** Eleven categories now have provider-owned links, short planner and later-handler actions, usual inputs and one explicit result limitation. Binance is no longer implied to have a global Legacy Contact setting.
3. **Default-size root — healthy.** The root remains a scan surface: icon, provider, one-line purpose and existing reviewed state. Detailed instructions appear only after push navigation.
4. **Default-size detail — healthy.** Apple and Binance show numbered `Do now` and `If someone handles it later` cards, a compact requested-material list and focused links without returning to a prose wall at the Profile root.
5. **Official link interaction — healthy after correction.** The first Apple link initially appeared at the bottom edge while its center was behind the native Tab Bar; runtime tap selected Matters instead of Safari. Provider details now hide the Tab Bar. The same link then opened the system Safari surface at `support.apple.com`.
6. **AX5 — healthy in the checked states.** The first AX5 root made the introductory explanation fill the viewport; it was reduced to a compact `Official routes` header. Provider rows, detail header and link anatomy reflow vertically. Step-number circles use a fixed decorative 12pt glyph so Dynamic Type cannot clip the numeral inside a fixed 24pt marker. Text itself remains uncapped and scrollable.

### Evidence

- `qa/provider-guides-2026-08-20/01-official-guides-default.jpg` — SHA-256 `d6200cd4928bb8ce6c03afea9ce9deded25b2a0be2063fff7fefc5bf07e464d7`.
- `qa/provider-guides-2026-08-20/02-apple-guide-default.jpg` — SHA-256 `bf4e7015fbf8b79de0cec0a9a140a91f59356e9d08b3253ca213ec99ebb6acf9`.
- `qa/provider-guides-2026-08-20/03-official-guides-ax5.jpg` — SHA-256 `537c3c5101db07abc7a70b5ee311f2b9a6ddba03016acf6a69c86e521fc47281`.
- `qa/provider-guides-2026-08-20/04-apple-guide-ax5.jpg` — SHA-256 `bf61a09bfa1ad8958b649ea8e250de7ba681eb551194ecb9fdc7a6f0f9cde0bf`.
- `qa/provider-guides-2026-08-20/05-binance-guide-default.jpg` — SHA-256 `28c18cbac4c59d460db2a70722203d648858d96d4b602c73bad08fabab65aada`.

### Verification Boundary

- XcodeGen regeneration and Debug build/run pass.
- Native current-source tests discover 92 and report `91 passed / 0 failed / 1 skipped`; the skip remains the unrelated iOS 26.5 StoreKitTest synchronization regression.
- `RilloraLayoutMatrix` build-for-testing passes with Apple detail, link reachability and hidden-Tab-Bar assertions.
- A fresh Release Simulator build passes.
- Web complete focused suite passes `40 / 40`; production build passes.
- Native semantic inspection exposes all eleven provider rows, deterministic provider/detail/link identifiers and no Tab Bar on a provider detail.
- The Simulator content size was restored to `large` after AX5 inspection.

This evidence does not prove all live external links at every time, regional variants, provider setup completion, valid death／identity／authority documents, account access, content delivery, memorialization, closure, asset transfer, legal ownership, physical-device VoiceOver／Display Zoom, localization, full XCUITest or external usability.

final result: passed for the common-provider guidance implementation and checked evidence scope

## 2026-08-20 Signed-out／Authenticated／Child-Task System QA

Date: 2026-08-20  
Scope: native iOS signed-out roots, authenticated roots, representative focused tasks, Web public／Account routes and official-provider marks  
Status: PASSED CURRENT LOCAL VISUAL／INTERACTION／BUILD QA; PHYSICAL, EXTERNAL AND DEPLOYMENT GATES OPEN

### Audit Steps And Health

| Step | Directly inspected state | Health after repair |
| --- | --- | --- |
| 1 | Signed-out iOS Overview | Healthy: one sentence, one three-row product map, three event facts and one action; no expandable prose stack |
| 2 | Signed-out iOS Matters | Healthy: two-by-two icon map plus one action; no field-definition table or invented Matter |
| 3 | Signed-out iOS Profile | Healthy: Account, Safety and About share one action surface, icon tile, divider and label scale |
| 4 | Authenticated iOS Overview／Profile | Healthy in the current populated fixture: same title／card／button grammar as signed out; Profile root retains one color family |
| 5 | Matter editor and contact／role contracts | Healthy in inspected matter state and source review: concise task footers, focused navigation and no Tab Bar obstruction |
| 6 | Simulation／disclosure／Start Here | Healthy in inspected Simulation and source-reviewed peers: visual fact strip replaces the repeated paragraph plus disclosure list; deep Tab Bar hidden |
| 7 | Plan & access | Healthy by source/build review: capabilities render as compact adaptive grids; billing／StoreKit truth remains unchanged |
| 8 | Official checks | Healthy in top／bottom runtime states: GitHub and X official marks render on the shared neutral plate; restricted or aggregate brands use neutral icons; root Tab Bar hidden |
| 9 | AX5 signed-out Overview | Healthy in top and bottom runtime states: content remains scrollable, event facts become full-width, CTA wraps without clipping and no text-size cap is applied |
| 10 | Web public home／Account at `390 × 844` | Healthy: public map and account actions use the same graphite surfaces and clay action grammar; no app-origin console error／warning |

### Findings Closed

- [P1] Limestone text on the clay action measured approximately `2.99:1`. Web and iOS primary actions now use graphite canvas text, approximately `4.89:1`.
- [P1] Deep pages could bring the native Tab Bar back over focused content. A shared focused-task modifier now hides it on editors, safety routes, plan routes and preparation tools.
- [P1] Safety boundaries were repeated as small muted paragraphs plus another disclosure list. Shared visual facts preserve the truth with substantially less reading load.
- [P2] Signed-out roots and authenticated roots used different composition personalities. Both now share the same title scale, card anatomy, icon blocks, action surfaces and color tokens.
- [P2] Signed-out Matters explained four fields through a dense text table. It now exposes four short icon-led concepts and one intent action.
- [P2] Signed-out Profile's Account row was a transparent exception beside filled Rillora rows. All rows now share the same action surface.
- [P2] Provider rows used approximate SF Symbol shapes as if they were brand marks. Only clearly applicable official assets are used; unclear／restricted／aggregate rows remain neutral rather than imitating a logo.

### Comparison Evidence

Current-run evidence is under `qa/full-ui-system-audit-2026-08-20/`:

- `before/`: 18 captured iOS／Web states used for this audit;
- `after/`: default, AX5, focused-task and Web states after implementation;
- `comparisons/01-signed-out-overview.jpg`;
- `comparisons/02-signed-out-profile.jpg`;
- `comparisons/03-authenticated-profile.jpg`;
- `comparisons/04-simulation.jpg`;
- `comparisons/05-matter-editor.jpg`.

Each combined image places the current-run before state on the left and the same route／viewport family after implementation on the right. Inspection confirms the public root is shorter and more visual, Profile no longer has a surface-color exception, Simulation removes the duplicate boundary row and Tab Bar, and Matter footers remain present but concise.

### Verification

- iOS Debug Simulator build succeeds; unit scheme discovers 92 tests and reports `91 passed / 0 failed / 1 skipped`.
- The retained skip is the already documented iOS 26.5 StoreKitTest configuration-sync problem, not a visual test failure.
- Runtime semantic snapshots covered signed-out Overview／Matters／Profile, authenticated Overview／Profile, Official checks, Simulation, Matter editor and AX5 top／bottom reachability.
- Web production build succeeds and all nine Web test files report `40 / 40`.
- Web mobile runtime has no app-origin console errors or warnings; only ordinary Vite connection and React DevTools information is present.

### Evidence Boundary

This proves only the named local browser and iOS Simulator states. It does not prove physical-device Display Zoom, complete VoiceOver speech order, every Dynamic Type size on every route, translation expansion, provider trademark permission beyond the recorded exact assets, provider endorsement, external-user comprehension, staging deployment or release approval.

final result: passed for the unified root／task redesign and checked evidence scope

## 2026-08-28 Compact Legal-Consent Placement QA

Date: 2026-08-28  
Scope: public Web Account consent hierarchy plus the static Auth0 signup target; no Auth0 tenant mutation  
State: signed out, legal checkbox unchecked and checked

### Source Visual Truth

- Current Rillora before state: `/tmp/rillora-consent-audit-AT45J5/01-rillora-account-desktop.jpg` at `1280 × 720`, CSS viewport `1280 × 720`, DPR `1`.
- Current Rillora mobile before state: `/tmp/rillora-consent-audit-AT45J5/02-rillora-account-mobile.png` at `390 × 844`, CSS viewport `390 × 844`, DPR `1`.
- Form-tail references: `/tmp/rillora-consent-audit-AT45J5/03-dropbox-signup.jpg`, `04-bitwarden-signup.jpg`, and `05-onepassword-signup.jpg`, each captured from the live public signup route at `1280 × 720`.

### Implementation Evidence

- Web Account desktop unchecked: `/tmp/rillora-consent-build-aFGSKv/01-account-desktop.jpg`, `1280 × 720`.
- Web Account desktop checked: `/tmp/rillora-consent-build-aFGSKv/02-account-desktop-checked.jpg`, `1280 × 720`.
- Web Account mobile unchecked: `/tmp/rillora-consent-build-aFGSKv/03-account-mobile.png`, `390 × 844`.
- Auth0 signup target desktop: `/tmp/rillora-consent-build-aFGSKv/05-auth0-signup-desktop-fixed.jpg`, `1280 × 720`.
- Combined comparisons: `/tmp/rillora-consent-build-aFGSKv/07-account-before-after.jpg`, `08-reference-auth0-comparison.jpg`, and `09-account-mobile-before-after.jpg`.
- Density normalization: all accepted comparison inputs are DPR `1` and paired at identical pixel／CSS viewport dimensions. The browser backend produced one half-scale mobile Auth0 screenshot despite correct DOM metrics; it was excluded from fidelity judgment rather than treated as product evidence.

### Comparison History

1. [P1 closed] The standalone bordered `Before you continue` fieldset was the first right-column surface and dominated both desktop and mobile before account actions. It was removed. The consent is now a borderless 12px label and 11px supporting line within one compact action form.
2. [P2 closed] `Agree` was repeated in the checkbox and both `Agree and…` buttons. The buttons now read `Create account` and `Sign in`; the unchecked checkbox remains the sole affirmative legal action.
3. [P1 closed] The first Auth0 fixture pass inherited a global `min-height: 44px` link rule inside the consent sentence, producing broken wrapping and inflated line spacing. `.panel .consent a` now restores inline, zero-min-height links. The post-fix desktop target matches the compact form-tail rhythm.

### Required Fidelity Surfaces

- Fonts and typography: the existing Source Serif／Inter product hierarchy is unchanged. Consent copy uses 12px／1.5 and the non-billing boundary uses 11px／1.45; neither is used for the main action label.
- Spacing and layout rhythm: the 20px padded legal card, legend, background and 15px radius are gone. The consent sits 20px below the compact account explanation and 16px above the primary action. Desktop and `390 × 844` remain free of horizontal overflow.
- Colors and visual tokens: existing graphite, sage, clay, divider and focus tokens are preserved. Disabled opacity and native accent color remain semantically consistent.
- Image quality and assets: no image or icon asset was added, approximated or replaced. Existing Rillora wordmark and Phosphor lock／arrow assets are unchanged.
- Copy and content: the exact Terms／Privacy／electronic-record acceptance and recurring-charge boundary are preserved. Only duplicated button wording and the oversized `Before you continue` wrapper were removed.

### Interaction And Runtime Checks

- Web Account: unchecked keeps `Create account` and `Sign in` disabled; checking enables both.
- Static Auth0 target: unchecked keeps `Create account` disabled; checking enables it.
- Terms and Privacy remain keyboard-focusable links and open separately.
- Browser DOM contains the native checkbox, `aria-describedby` support note, meaningful headings and both account actions.
- Browser console errors／warnings: none on the Web Account or static Auth0 target.
- Web focused suite: `41 / 41`; internal production-style build: passed.

### Evidence Boundary

This passes the local Web Account implementation and the static hosted-signup visual target only. The Auth0 development tenant, Prompt Customization, Pre User Registration／Post Login Redirect Actions, returning-user acceptance lookup and iOS consent state have not changed. The Web pre-auth checkbox remains the authoritative working gate until a separately verified Auth0／API migration replaces it.

final result: passed

## 2026-08-28 Historical Result — Consent Prominence Refinement

The detailed two-pass comparison, evidence paths, typography／spacing／color／asset／copy checks, interaction results and external-Auth0 boundary are recorded above under `Compact Legal-Consent Placement QA` and `Second-Pass Prominence Reduction`. The current refined screenshots are `/tmp/rillora-consent-refine-YFJS2o/01-account-desktop.jpg`, `02-account-mobile.jpg` and `03-auth0-desktop.jpg`; normalized iteration comparisons are `04` through `06` in the same directory. No P0／P1／P2 finding remains for the local Web Account or static Auth0 target.

final result: passed

## 2026-09-06 Native Account Runtime, Cancellation And AX5

Date: 2026-09-06 (Asia/Hong_Kong)  
Scope: native Account on the already-booted Rillora-Matrix-17-Pro, iOS 26.5; Xcode 26.6 (17F113)  
Status: FOCUSED RUNTIME AND FINAL SOURCE VERIFICATION PASS; REAL PROVIDER LOGIN OPEN

The run began with a full read of 50 project Markdown files / 14,408 lines.
The initial unsigned compile artifact produced a Keychain-unavailable error;
local ad-hoc Simulator signing restored the normal public launch. No volatile
session override was used for the manual runtime path. The automated signed-out
fixture remains explicitly limited to UI tests.

Findings closed:

- [P2] The method separator used Divider inside HStack and rendered short vertical
  stubs beside OR. It now uses horizontal one-point rules and a minimum height
  that grows with the label.
- [P2] The email field lacked an explicit accessibility name. It now identifies
  Email address, retains an explicit placeholder, dismisses keyboard focus at
  provider handoff and locks input/consent while working.
- [P2] The fallback explanation did not clearly include the visible email method.
  It now names email, recovery and other methods and uses readable footnote text.
- [P2] AX5 interaction passed, but screenshot review found methods broken inside
  the word because decorative icons consumed the label column. At accessibility
  sizes those method icons/arrows are omitted and labels use the full width.
- [P1 QA contract] The existing entry test still expected the retired expandable
  index and direct-hosted route. It now checks the static product map, separate
  events and current native Account; the runner references the updated methods.

Final unit tests: 106 passed / 0 failed / 1 existing StoreKit environment skip.
Focused default-size UI: 3 / 3. AX5 consent flow: 1 / 1. Debug runtime build and
Release Simulator compile pass. The consent test traverses Overview, Matters
and Profile, validates unchecked/checked/re-unchecked, invalid/valid synthetic
email, Apple+Passkey visibility, Google absence and Cancel/reopen reset.

Manual runtime separately verifies Terms and Privacy opening Safari at the
formal legal host, return to Account, cancellation at the hosted system notice
and native Passkey system-request cancellation without an error. The Passkey
request reaches Apple's cross-device/Bluetooth requirement; no Bluetooth change
or credential selection occurs. The run creates no provider assertion/token,
Rillora session, actual acceptance, user map, tenant change or publication.

Evidence: output/qa/rillora-native-hybrid-20260906/ contains source snapshots,
read coverage/hashes, final xcresults, default/AX5 images and an image manifest.
The current Account is left empty and unchecked at large content size.
The earlier Sign in with Apple identity key still requires rotation before
real authorization; StoreKit's separate IAP key does not close that gate.
Full five-device/VoiceOver/physical-device/localization and provider success
remain outside this focused result.

final result: passed for native Account layout, gating, links and system cancellation


## 2026-09-06 Whole-app native UI/UX review

Scope: public entry, Account, Overview / Matters / Profile, first-use, matter
and contact editors, role scope, plan access, official guides, rehearsals,
Start Here preview/export selection, search and failure recovery.

Accepted evidence: native units **111 passed / 0 failed / 1 existing StoreKit
environment skip**; **14 standard-size UI cases** with successful accepted
runs; **one additional AX5 journey** covering Account, actual typed input,
progress, both editors and role scope. Debug runs and Release compiles. The
exact case ledger, original failures, source snapshots and image comparisons
are in `output/qa/rillora-full-app-ux-20260906/README.md`.

Landscape requires a scope correction to older reports. Device orientation
commands alone left this Simulator’s scene in portrait. The app declares both
landscape orientations, and Debug-only test input requests UIKit scene geometry.
The test now asserts actual width greater than height, traverses the three
native roots and captures the complete screen (2622 × 1206). This validates
landscape geometry and controls, not physical sensor-driven auto-rotation.
`XCUIScreen.main.screenshot()` avoids the observed app-crop orientation defect.

Visual review also corrects an early small-sheet impression: Role scope did
not overflow at default size in the original image. Its accepted issue was
excess nested-card emphasis. New persistent labels, literal gray prompts,
neutral disabled actions, descriptive task rows, simplified facts and separated
export choices were checked against current-run images. Largest-text progress
and input/button sizing were reviewed after the initial interaction pass.

The final app is restored to ordinary cloud Debug, portrait and `large` text.
QA used synthetic local records; it created no real login, recipient key,
notification, file sharing, release or payment. Physical devices, VoiceOver
speech, localization, automatic rotation and external comprehension remain
separate checks; this pass is not the complete five-device matrix.


## 2026-09-06 Direct hosted login follow-up — Historical checkpoint

Its paused-Apple/social-first statements are superseded by the September 9
email-first Apple restoration. Current full-depth UI and sharing evidence is in
[interaction-experience.md](docs/interaction-experience.md) and
[trusted-sharing.md](docs/trusted-sharing.md). September 10's documentation audit
does not constitute a fresh visual test.

The Owner removed the native Account intermediary. All three private intents
now directly open hosted authentication; the system domain notice is retained.
The new unit suite passes **116 / 0 / 1**. Public/safety and commercial-deferral
cases pass, and the corrected three-entry system-notice/cancel case passes.
The runner uses the new hosted-entry test names; the former native chooser
assertions are retired. Earlier whole-app and AX5 evidence remains bounded to
its original checkpoint.

The Owner completed Google authentication and required hosted acceptance, after
which the ordinary cloud Debug app returned to the private map. Form/Action
deployment, current receipt validation and the API exchange preserve the
existing acceptance contract. The first actual Form screenshot was rejected;
subsequent visual checks cover the repaired initial and unchecked error states.
Supported theme/custom-text changes put social methods before email and explain
Google return login. The incomplete Apple hosted binding is paused for the
iOS client; no credential or user was changed.

Exact raw iterations, final screenshots, source snapshots, tenant readbacks and
limits are in [the hosted-login report](output/qa/rillora-single-hosted-entry-20260906/README.md).
The remaining Apple identity-key/Services ID, physical-device, localization,
VoiceOver, full device matrix and release gates are separate.
