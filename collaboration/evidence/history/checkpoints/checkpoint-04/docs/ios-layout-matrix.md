# Rillora iPhone Layout And Accessibility Matrix

Role: repeatable local iPhone layout and accessibility QA contract  
Authority scope: simulator device classes, orientations, content sizes, core surfaces and evidence limits  
Superseded by: a later approved revision of this file  
Do not use for: physical-device, TestFlight, market, legal or production identity claims  
Status: WHOLE-APP STANDARD-SIZE AND AX5 SIMULATOR CHECKS PASS; LANDSCAPE GEOMETRY VERIFIED; FULL FIVE-DEVICE AND PHYSICAL ACCESSIBILITY REMAIN OPEN  
Last updated: 2026-09-11 (invitation clarity and authenticated motion; older evidence retains its date)

## Invitation/motion focused follow-up — 2026-09-11

The same Pro Simulator covers direct Overview/Profile invitation, required Name/email, Access/Link progression, QR/copy, receiving, scoped Details/Notes and dirty-cancel recovery. AX5 exposed split step labels; the repaired current-step header and full-size form are verified with Reduce Motion. Native135 tests pass with one pre-existing StoreKit skip. This is a focused run, not a fresh five-device/physical VoiceOver matrix. [QA and recordings](../output/qa/rillora-invite-motion-20260911/README.md).


## September11 focused native revision

Current local Xcode26.6/iOS26.5 Rillora-Matrix-17-Pro checks cover the one-page New/Edit matter form, conditional exchange/on-chain fields, required-save gating, Notes persistence, Profile cleanup and the expired public Profile label. The targeted AX5/Reduce Motion run checks adaptive category/custody pickers and flowing labels/fields. It is not a new five-device or physical VoiceOver matrix. Native133 tests pass with the single pre-existing StoreKit environment skip. [Evidence](../output/qa/rillora-account-matter-ux-20260911/README.md).

## Purpose

This matrix prevents a single simulator model or screenshot from becoming an accidental product target. It tests representative layout classes and all supported Dynamic Type categories while preserving a separate physical-device gate.

Apple’s current guidance asks interfaces to support larger text and sufficiently sized controls, while SwiftUI exposes all seven standard and five accessibility Dynamic Type categories. This contract follows those platform primitives instead of scaling one fixed screenshot: [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility/), [SwiftUI `DynamicTypeSize`](https://developer.apple.com/documentation/swiftui/dynamictypesize), [SwiftUI accessibility fundamentals](https://developer.apple.com/documentation/swiftui/accessibility-fundamentals).

## Device-Class Matrix

| Representative | Portrait canvas class | Hardware feature | Covers |
| --- | --- | --- | --- |
| iPhone SE (3rd generation) | `375 × 667pt` | Home button, shortest height | shortest supported canvas and dense vertical flow |
| iPhone 13 mini | `375 × 812pt` | notch | compact full-screen width and iPhone X-shaped canvas geometry |
| iPhone 13 | `390 × 844pt` | notch | common iPhone 13/14 standard class |
| iPhone 17 Pro | current standard Pro | Dynamic Island | modern sensor housing and safe-area behavior |
| iPhone 17 Pro Max | `440 × 956pt` | Dynamic Island, large canvas | large-phone width and height extreme |

The matrix tests layout classes, not marketing names. Devices with equivalent point dimensions do not need redundant full runs unless a platform feature changes their safe areas or navigation behavior.

## Runtime Matrix

### Every representative device

- portrait native `Overview / Matters / Profile` root reachability;
- landscape native `Overview / Matters / Profile` root reachability;
- exactly three native tabs;
- portrait tab targets at least `44 × 44pt`;
- compact-height landscape uses Apple’s native TabBar geometry: each tab must remain visible and hittable, at least `44pt` wide, and at least the system-reported `36pt` high;
- Overview primary action reachable and at least `44pt` high;
- signed-out launch opens a public Overview rather than an authentication error or Account sheet;
- the selectable animated product map works without an account and preserves understandable feedback under Reduce Motion; Overview creation, Matters addition and Profile sign-in directly open hosted authentication, with no native Account/email/method page; cancellation returns to the source and preserves its selection;
- signed-out Matters and Profile remain useful public destinations with no private-data editor or false private state;
- signed-out Overview and Profile do not promote `Plan & access`, Family or price amounts before explicit paid-capability intent;
- no missing accessibility label on visible buttons.

### Smallest canvas: iPhone SE (3rd generation)

Run root reachability at every system content-size category:

- `extra-small`;
- `small`;
- `medium`;
- `large`;
- `extra-large`;
- `extra-extra-large`;
- `extra-extra-extra-large`;
- `accessibility-medium`;
- `accessibility-large`;
- `accessibility-extra-large`;
- `accessibility-extra-extra-large`;
- `accessibility-extra-extra-extra-large`.

At `large` and `accessibility-extra-extra-extra-large`, also traverse the Matter editor, role-policy editor, trusted-contact editor, motivation, official checks, simulation, role disclosure and Start Here surfaces.

### Standard and large canvases

- iPhone 13 runs the full primary-surface traversal at `large`.
- iPhone 17 Pro runs roots at `large` and `accessibility-extra-extra-extra-large`.
- iPhone 17 Pro Max runs roots and full primary-surface traversal at `large`.

## Automation Contract

- `RilloraLayoutMatrixTests` is a separate UI-test target and does not enter the ordinary unit-test scheme.
- `RilloraLayoutMatrix` is the dedicated scheme for API-connected local QA.
- Matrix builds must explicitly set a local API URL and a synthetic development planner ID. Release and default Owner-facing builds remain free of this bypass.
- Screenshots belong in `.xcresult` bundles or ignored local output. They are evidence for only the named simulator, orientation, content size and state.
- Tests must not save, archive, revoke, send, share, print, create encrypted exports or change provider checks.

## Pass Criteria

- No missing root destination, clipped navigation surface or unreachable tested route.
- System tabs remain present and hittable through rotation and Dynamic Type changes.
- Critical actions meet the minimum target size.
- Text may reflow and content may require scrolling; truncation, mid-word fragmentation, horizontal overflow and controls hidden behind bars are failures.
- A failure is repaired in shared layout/components where possible, then the affected slice and regression suites are rerun.

## 2026-08-11 Result

- Final evidence directory: `output/qa/ios-layout-matrix-20260811-212104/` (local, ignored build evidence).
- `23 / 23` matrix slices passed with `0` failed slices.
- Five representative devices passed portrait and landscape root navigation at the default content size.
- iPhone SE passed root navigation at all 12 system content-size categories from `extra-small` through `accessibility-extra-extra-extra-large`.
- iPhone SE passed the full primary-surface traversal at both `large` and the largest accessibility size; iPhone 13 and iPhone 17 Pro Max passed the default-size traversal; iPhone 17 Pro passed the largest-size root slice.
- The ordinary `Rillora` scheme then passed `71 / 71` unit tests.
- Visual review found and repaired shared large-text defects that the first automation pass did not catch: fixed horizontal icon/status rows now reflow vertically, form pickers separate their title from a wrapping complete current value, the Debug identity banner reflows, and the contact editor uses a compact navigation title.
- One early landscape failure was a bad test assumption: Apple’s native compact-height TabBar reported a `36pt` element height while remaining visible and hittable. The contract now preserves the system control and applies the app-owned `44pt` requirement outside that compact native exception.
- One later run completed four device slices before CoreSimulator reached the Mac’s process-resource ceiling because multiple pre-existing user simulators were already booted. The runner now starts at most one isolated matrix simulator at a time and does not shut down the Owner’s existing devices.
- The final run completed every test slice. Its first cleanup implementation returned a non-test `Shutdown` error after the 23rd PASS while trying to change the text size of an already closed simulator. Cleanup ordering is fixed, the affected Pro simulator was explicitly restored to `large`, script syntax passes, and all five matrix devices are shut down.

## 2026-08-12 Public-Before-Account Regression Result

- Final evidence directory: `output/qa/ios-layout-matrix-20260812-232931/` (local, ignored build evidence).
- The updated matrix again passed `23 / 23` slices with `0` failed slices; the ordinary current-source unit suite passed `75 / 75` separately.
- Every representative device at the default content size now also launches signed out into the public Overview, opens the safe synthetic example without an account, enters Account only from the explicit adapt/save action, returns through `Not now`, and exposes signed-out Matters and More without a private editor or false private state.
- iPhone 17 Pro repeats the signed-out journey at `accessibility-extra-extra-extra-large`; Account actions are scrolled into view before their minimum `44pt` target checks rather than assuming one fixed sheet viewport.
- The regression first exposed a real accessibility defect: the `Not now` button’s effective frame measured about `17pt`, then `42.4pt`. The app-owned label and hit shape now use a stable `48pt` content height and pass the `44pt` gate.
- The run kept private-flow coverage on an explicit synthetic development planner while launching the new signed-out test with the planner override removed. It did not use the Owner’s account, credentials or cloud data and made no external invitation or release.

## 2026-08-13 Reduced Public Entry Result

- Evidence directory: `output/qa/ios-layout-matrix-20260813-001645/` (local, ignored build evidence).
- The signed-out journey now runs at every representative device’s default content size and at all 12 iPhone SE content-size categories. Every run opened the reduced public Overview, explored the synthetic example, entered Account only after an explicit save/adapt intent, returned with `Not now`, reached the private-plan action, and kept signed-out Matters and More available.
- The new regression assertions also prove that the removed `Map what matters` workflow section and repeated `Your plan is not public content` card do not return. The private-plan action and Account actions retain the minimum `44pt` target contract.
- The raw matrix summary records `22 / 23` slices passing on the first execution. The only failed assertion was outside the new public entry: after rotating the authenticated iPhone 17 Pro Overview, XCTest synthesized a native `Matters` tab tap but the selected tab did not change. The same unchanged orientation test passed immediately in `pro-large-orientation-rerun.xcresult`; the earlier three full matrices had also passed that slice. Both the raw failure and clean rerun are retained rather than rewriting the first result.
- The ordinary current-source unit suite passed `75 / 75`. This remains Simulator evidence; it does not prove physical-device input delivery, VoiceOver speech order, localization or external comprehension of the provisional English copy.

## 2026-08-13 Free And Family Commercial-UI Result

- Evidence directory: `output/qa/ios-layout-matrix-20260813-224908/`; corrected-source reruns are retained under its `final-reruns/` directory.
- Effective final coverage is `23 / 23` slices passing after retaining the raw first execution (`19 PASS / 4 FAIL`) and cleanly rerunning each failed test on the final rebuilt UI-test product. The ordinary current-source unit suite passed `75 / 75` separately.
- Every representative device at the default content size reached the signed-out `Plan & access` destination and scrolled from the `Free foundation` section to `Planned Rillora Family` and the exact billing-closed notice. iPhone SE repeated the same route across all 12 system content-size categories, including `accessibility-extra-extra-extra-large`.
- Two raw failures identified test-harness assumptions introduced by the longer commercial content: an offscreen Account row was asserted before scrolling at the largest size, and the deep route traversal searched only downward for the newly inserted access row after returning from a lower contact sheet. The final test source scrolls to the Account row and visits `Plan & access` before lower More routes; `se-ax5-corrected.xcresult` passes both corrected paths (`2 / 2`).
- The other two raw failures were isolated Simulator automation transients outside the commercial content: the Pro largest-size orientation test once failed to switch to Matters, and Pro Max once timed out returning from a role-policy editor. The unchanged final source passed `pro-ax5-orientation-rerun.xcresult` (`1 / 1`) and `max-large-surfaces-rerun-2.xcresult` (`1 / 1`). Raw failures and clean reruns are both retained; they are not rewritten into a fictitious single clean execution.
- Visual review confirms the currency is explicit as `US$`, the native three-tab shell remains intact and the long Free, Family and safe-downgrade content remains scrollable. This still does not prove physical VoiceOver speech order, Display Zoom, localization or external price comprehension.

## 2026-08-14 AI-01 Public Long-Page Result

- Evidence directory: `output/qa/ios-layout-matrix-20260814-212802/`; direct visual evidence and unit results are under `output/qa/rillora-ai-01-20260814/`.
- The signed-out Overview now implements the selected `AI-01 · Architectural Index` direction as a native long page: purpose and Free intent, expandable `What exists / What should happen / Who helps`, safe synthetic handoff, Free baseline, planned Family summary, safe downgrade, separate `Death / Incapacity / Unreachable` language and the final Account-gated action.
- The raw complete matrix records `22 / 23` passing slices. The only failure was `standard-large-roots`: after landscape rotation XCTest synthesized a native `More` tap but did not observe `more.list` within ten seconds. The same standard simulator, `large` content size, unchanged built product and exact `testOrientationChangeKeepsRootsReachable` case passed `1 / 1` in `standard-large-orientation-rerun.xcresult` (`23.224s`, zero failures). Effective named-slice coverage is therefore `23 / 23`, while the raw failure remains intact and is not rewritten as a clean first run.
- All other representative-device roots, the complete 12-size iPhone SE sequence, SE default and AX5 surfaces, standard/Max surfaces, Pro AX5 roots and visible-action checks passed in the original execution. The current-source unit suite separately passed `75 / 75`.
- Direct iPhone 17 Pro Max inspection confirmed white status-bar content on the graphite public canvas, native safe areas, the unchanged three-tab system shell, the top public action and expandable index, and the bottom safety/final-action region above the tab bar. Combined source/implementation evidence is `output/qa/rillora-ai-01-20260814/ios-source-comparison.jpg`.
- This proves the named local Simulator states only. Physical-device Display Zoom, VoiceOver speech order/traits, translated copy, third-party keyboards, TestFlight and external comprehension remain open.

## 2026-08-14 Deferred Commercial Detail And Reduced Public Page Result

- Evidence directory: `output/qa/ios-layout-matrix-20260814-230952/`; direct before/after evidence is under `output/qa/rillora-home-reduction-20260814/`.
- The signed-out Overview keeps the AI-01 hero and expandable `What exists / What should happen / Who can help` index, but removes the repeated handoff, Free catalogue, Family price card and downgrade list. Signed-out More also removes the public `Plan & access` row. New assertions verify that signed-out Overview and More expose no Family or price amount before explicit commercial intent.
- The raw complete matrix records `22 / 23` passing slices. All five default device classes, all 12 iPhone SE content-size categories, default and AX5 deep-surface traversals, visible-action checks and the new commercial-deferral checks passed except the SE default root bundle's pre-existing landscape navigation case.
- In that raw bundle, XCTest tapped the native `Matters` tab after rotation but did not observe `matters.list` within ten seconds; the other three tests in the same slice, including both updated signed-out tests, passed. The exact unchanged `testOrientationChangeKeepsRootsReachable` case then passed `1 / 1` on the same SE, `large` content size, built product and API contract in `se-large-orientation-rerun.xcresult` (`19.865s`, zero failures). Effective named-slice coverage is `23 / 23`, while the raw failure remains intact.
- The current-source ordinary unit suite separately passes `75 / 75`. This remains local Simulator evidence; physical-device VoiceOver speech order, Display Zoom, localization, payment behavior and external comprehension remain open.

## 2026-08-15 Product-Before-Account Entry Result

- Evidence directory: `output/qa/ios-layout-matrix-20260815-133417/`; direct top/bottom inspection is under `output/qa/rillora-first-action-deferral-20260815/ios/`.
- The signed-out Overview removes both public `Free to start` reassurance and the above-fold private-plan action. It keeps the product job, map-not-password boundary and expandable architectural index; the safe synthetic example remains usable before Account, and the only creation action appears at the bottom as `Create my private map`.
- The raw complete matrix records `22 / 23` passing slices. All five representative devices, all 12 iPhone SE content sizes, deep surface traversals and visible-target checks pass except one SE `extra-extra-extra-large` run where XCTest tapped the native `Matters` tab but did not observe `public-matters.scroll` within ten seconds.
- The unchanged exact `testSignedOutExperienceDefersAccountEntry` case then passes `1 / 1` on the same SE, same `extra-extra-extra-large` content size, same built test product and same synthetic API contract in `se-extra-extra-extra-large-signed-out-rerun.xcresult`. Effective named-slice coverage is `23 / 23`; the raw failure remains preserved.
- The ordinary current-source unit suite separately passes `75 / 75`. This remains local Simulator evidence and does not prove physical VoiceOver, Display Zoom, localization, TestFlight or external comprehension.

## 2026-08-15 Signed-Out Commercial-Copy Focused Result

- Evidence directory: `output/qa/rillora-signed-out-commercial-copy-20260815/`. This was a focused regression on the ordinary iPhone 17 Pro Max Simulator, not a replacement for the latest full five-device and Dynamic Type matrix above.
- Signed-out Matters now presents a compact synthetic insurance example and an `Add a matter` intent instead of a plan pitch. Signed-out More exposes a neutral `Account` row, and the Account choice uses `Create account / Sign in`. Assertions reject `Free plan` and `No card` across Account, Matters and More before explicit commercial intent.
- The current-source unit suite passed `75 / 75`. The two targeted signed-out UI tests passed `2 / 2`; after the final More simplification and copy refinement, the complete signed-out traversal passed an exact `1 / 1` rerun. Final Matters and More attachments are in `attachments-grammar-final/`, and `signed-out-ui-grammar-final.xcresult` retains the final UI evidence.
- The latest Debug app was installed and launched on the ordinary `iPhone 17 Pro Max` Simulator. These results do not claim a fresh complete device matrix, staging deployment, physical-device accessibility or external comprehension.

## 2026-08-15 Global Graphite All-Surface Result

- Evidence directory: `output/qa/ios-layout-matrix-20260815-185519/`; direct child-surface screenshots and source comparisons are in `output/qa/rillora-dark-ui-20260815/`.
- The complete matrix retained an original `22 / 23` result. All five representative roots, all 12 iPhone SE content-size categories, standard and large-device deep surfaces, visible-action checks and accessibility-size roots passed except `se-ax5-surfaces`.
- The raw failure hierarchy showed `plan-motivation.open` reporting as hittable while its tap center was behind the native Tab Bar; XCTest consequently selected `Matters`. This was a test-helper visibility defect, not a cream/light product surface or an unreachable screen.
- The helper now requires the target center to clear hittable system navigation and Tab Bar chrome. The exact same iPhone SE, largest accessibility size and deep-surface test passed `1 / 1` in `se-ax5-surfaces-fixed-rerun.xcresult`. Effective named-slice coverage is `23 / 23`, while the raw failure and hierarchy remain preserved.
- The current-source unit suite separately passed `75 / 75`; the focused all-surface traversal passed `2 / 2` with `11` retained visual attachments.
- This remains local Simulator evidence. Physical-device Display Zoom, VoiceOver speech order and rotor behavior, localization, TestFlight and external comprehension remain open.

## 2026-08-16 Signed-out More And Account Navigation Focused Result

- Evidence directory: `output/qa/rillora-entry-navigation-20260816/`. This focused correction does not replace the latest complete five-device matrix.
- On the ordinary iPhone 17 Pro Max, the two signed-out regressions pass `2 / 2`: selected More remains an accessibility-selected native tab with a brighter foreground, More contains no repeated `Security boundary`, and `Add a matter` pushes the complete Account child page with system Back and without `Close / Not now`.
- On iPhone SE at `accessibility-extra-extra-extra-large`, the complete signed-out journey passes `1 / 1`. Direct inspection rejected an earlier technically passing horizontal-button screenshot because its content collided; the final adaptive vertical-button screenshot is in `attachments-se-ax5-final/` and does not retain the Tab Bar on the focused child page.
- The final current-source unit suite separately passes `75 / 75`. The SE content size was restored to `large` after the run.
- This remains local Simulator evidence and does not prove physical-device Display Zoom, spoken VoiceOver order, localization, TestFlight or external comprehension.

## 2026-08-16 Native Profile Navigation Focused Result

- Evidence directory: `output/qa/rillora-profile-navigation-20260816/`. This is a focused local regression for the native `More -> Profile` change and does not replace the last complete device／Dynamic Type matrix.
- The signed-out Overview no longer duplicates Account in its top-right toolbar. The third native tab is `Profile`; its root exposes Account, the safe example, How Rillora works, Safety & privacy, App settings and About Rillora. Authenticated Profile retains existing plan, contact, preparation, security and session routes and adds the settings/support family.
- Current-source unit tests pass `75 / 75`. On the ordinary iPhone 17 Pro Max, the two strengthened signed-out regressions pass `2 / 2`; the complete test now proves Account appears inside Profile, dismisses back to Profile and pushes/returns from every newly added child page. The same complete signed-out traversal passes `1 / 1` on iPhone SE 3 at its current standard content size.
- The first authenticated portrait／orientation／deep-route attempt recorded `0 / 3`: all three tests stopped at the identical `launchApp()` prerequisite because the synthetic QA API was not running, before any Profile assertion. That raw precondition failure remains retained. The existing isolated test API was then started on `127.0.0.1:4181`, the exact three-test set passed `3 / 3`, and the listener was stopped immediately afterward. This closes the focused authenticated 17 Pro Max routes; it is not a fresh full matrix or cloud-authentication result.
- XcodeBuildMCP built, installed and directly inspected the current Debug app on iPhone 17 Pro Max. The runtime accessibility tree exposed exactly `Overview / Matters / Profile`, no Overview Account target and all six signed-out Profile actions. This remains Simulator evidence; physical-device, VoiceOver speech order, localization, staging deployment and external comprehension are open.

## 2026-08-17 Direct Hosted Authentication Focused Result

- Evidence directory: `output/qa/rillora-direct-hosted-auth-20260817/`. This is a focused ordinary-device regression and does not replace the last complete device／Dynamic Type matrix.
- `testSignedOutExperienceUsesDirectHostedAuthenticationEntry` verifies the signed-out Profile top action `public-profile.sign-in`, absence of the former Account child-page and four outer identity targets, signed-out Matters, Safety/About routes and return behavior.
- `testSignedOutCommercialDetailsStayDeferred` separately verifies that the Profile change did not reintroduce plan/price language into public entry.
- The two focused tests pass `2 / 2` on iPhone 17 Pro Max; the current-source unit suite passes `77 / 77`.
- This result does not prove external provider authorization, callback, physical-device behavior, Display Zoom, spoken VoiceOver order, localization, TestFlight or Release readiness.

## Evidence Boundary

Simulator passes do not prove:

- physical-device Display Zoom;
- real VoiceOver speech order, pronunciation, rotor behavior or hardware gestures;
- keyboard behavior with third-party keyboards;
- every locale before localization resources exist;
- iOS versions not installed on the QA machine;
- iPhone X support, because the current deployment minimum is iOS 17 and iOS 17 starts at iPhone XS.

Those remain separate device, localization and release gates in `docs/quality-gates.md`.

## 2026-08-16 Profile Action Clarity Focused Result

- Evidence directory: `output/qa/rillora-profile-actions-20260816/`. This focused correction supersedes the exact Profile row family in the immediately preceding focused result; it still does not replace a fresh complete five-device matrix.
- Signed-out Profile now exposes five non-duplicated actions: Account, safe example, Safety & privacy, iPhone settings and About Rillora. The removed `How Rillora works` and App settings shell are asserted absent. The complete test opens/dismisses Account and the example, pushes both Safety tools, expands a disclosure topic, copies app information from About and returns to Profile. The external settings row is separately runtime-tapped and opens the iOS Settings app.
- Current-source unit tests pass `75 / 75`. The two signed-out regressions pass `2 / 2` on ordinary iPhone 17 Pro Max. The complete journey passes `1 / 1` on iPhone SE at `accessibility-extra-extra-extra-large` after visibility-aware test correction.
- Two raw SE failures remain in the evidence directory. The first required an offscreen lazy Profile example row to already report `exists`; the second required the lower Safety row to be immediately hittable after returning at AX5. Neither reported text clipping, overlap or app-navigation failure. The final test scrolls each target clear of system chrome before asserting it.
- The SE content size was restored to `medium`. The latest Debug build is installed on the ordinary iPhone 17 Pro Max and leaves Profile available for Owner inspection.
- This remains local Simulator evidence. Physical-device Display Zoom, spoken VoiceOver order, localization, full Profile matrix, staging deployment and external comprehension remain open.

## 2026-09-06 Native Account focused result

The already-booted `Rillora-Matrix-17-Pro` on iOS 26.5 passed three default-size
UI tests and the consent flow at `accessibility-extra-extra-extra-large`. The
updated entry test checks the static product map and separate event facts,
instead of asserting the retired expandable article.

`testNativeAccountConsentGatesMethodsAndResetsOnCancel` enters from Overview,
Matters and Profile, verifies email-before-consent placement, default-unchecked
method gating, Apple＋Passkey presence, Google absence, invalid/valid synthetic
email, re-unchecked denial and Cancel/reopen reset. It performs no provider
authentication. The matrix runner references the new test names.

Visual inspection independently caught and repaired AX5 mid-word wrapping in
`Other sign-in methods`: decorative icons/arrows disappear at accessibility
sizes, text gets the full width, and the method divider grows with its label.
The final default/AX5 screenshots, unit result `106 / 0 / 1`, focused UI results
and source snapshots live in `output/qa/rillora-native-hybrid-20260906/`.

Use a locally signed Simulator artifact for runtime Keychain checks. A
compile-only unsigned build is not a valid Keychain/runtime baseline. Content
size is restored to `large`. This run does not replace the complete five-device
matrix or prove VoiceOver speech, physical devices, provider login or release.


## 2026-09-06 Whole-app standard size and AX5 result

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

The following counts belong to September 6. Hosted Apple/email-first ordering and
the interactive map now follow the September 9/10 checkpoints in
[authentication-experience.md](authentication-experience.md),
[interaction-experience.md](interaction-experience.md) and [trusted-sharing.md](trusted-sharing.md).
The September 10 documentation audit did not rerun this device matrix.

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
limits are in [the hosted-login report](../output/qa/rillora-single-hosted-entry-20260906/README.md).
The remaining Apple identity-key/Services ID, physical-device, localization,
VoiceOver, full device matrix and release gates are separate.
