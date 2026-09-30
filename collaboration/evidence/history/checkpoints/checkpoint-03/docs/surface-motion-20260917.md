# Signed-in surface and motion refinement

Role: bounded implementation contract for the Owner's September17 refinement  
Status: IMPLEMENTED / STAGING WEB PUBLISHED / ORDINARY SIMULATOR UPDATED  
Last updated: 2026-09-18 (filter-width correction and licensed SDS component adoption)

## September18 follow-up

Owner supplied a truncated Matters segmented picker and explicitly directed adoption of commercially permitted component libraries with attribution. The previous September17 no-import statement below is historical, not an ongoing prohibition. Adopt SDS Tag Toggle Group as a content-sized native single-select control; use it for Matters, review inbox and billing-period choices. The group wraps when needed and individual long labels can wrap at accessibility sizes, without `minimumScaleFactor` or ellipsis. Source, license and shipped credits are in the [asset register](asset-licenses.md). Current checks are in [follow-up QA](../output/qa/rillora-filter-fit-20260918/README.md); September17 suite/deployment numbers below are not rerun claims.

## Owner scope and preserved structure

Owner requests consistent signed-in card colors, less bare child pages and more motion, with commercially usable components. Continue within the selected Graphite / Prepared Folio direction. Root composition, navigation groups, Profile ordering, field requirements and sharing/consent boundaries remain. This explicitly permits shared surface and feedback refinement; it does not reopen the withdrawn redesign or consumer Simulation pages.

The existing generated Prepared Folio is the reference. Fresh UI screenshots establish the before-state. No new concept is selected and no Figma Community file is imported merely because the Owner has a membership.

## Components and state

- Native card/action/Form/List material and signed-in Web card material: `#252C29`; shared edge `#3D4842`; icon plate `#2E3731`. Accent is limited to icons, selected edges and explicit status. Inset controls retain a darker well; warning/destructive states remain distinct.
- Native task symbols use one short spring entrance and perimeter draw; Web uses one short icon entrance. Both stop after entry. No timer, fake progress or repeating decorative animation is added.
- Native disclosures expose Expanded/Collapsed and a minimum44pt whole-row button. Height/opacity and chevron transitions reveal the existing content. Web details keep native semantics; data tools expose `aria-expanded`/`aria-controls` and keyboard-operable controls.
- Press response is brief; unavailable buttons do not animate as successful actions. Copy/saved/review-complete feedback remains bound to actual state, without delaying privacy invalidation or implying delivery.
- Profile, Plan & access, My data/saved-copy entry, safety choices, shared item detail and the review inbox reuse this vocabulary. Empty incoming reviews use a tray rather than a completion checkmark. No extra explanatory card stack is added.
- Reduce Motion disables the new transforms/animations/transitions while preserving controls, text, icons and state. Dynamic Type is uncapped. The changed native labels reflow at AX5; checked Web layouts fit320/390px.

## Adjacent defects found and repaired

1. Family feature rows without a leading icon were still placed in the narrow icon grid column. Planned-feature lists now use a full text column and readable text size.
2. Family cutoff copy still called the implemented Free one-recipient allowance “planned”. Both clients now describe the current allowance and paid-period copy boundary while retaining the closed-billing notice.
3. Web category changes inside New matter created extra browser-history pages. Selection now replaces the current draft route. Keep editing retains Crypto; confirmed discard closes to Matters in one step. No private draft field is added to a URL and no backend state is changed by that check.

## September17 licensing and implementation choice — historical

Use project-authored SwiftUI/CSS and the already-installed Phosphor MIT icons. Pow's MIT terms were checked but the dependency was not adopted. Existing Figma library Card/Button searches returned no reusable component; no paid pack or Community asset is added. Native SF Symbols remain Apple-platform UI resources. Exact sources and notice requirements are maintained in the [asset register](asset-licenses.md).

## Verification and evidence limits

Current native unit suite:152 pass,0 fail,1 pre-existing StoreKit skip. Web78 tests pass after the final navigation fix; app release build passes. Scoped browser/Simulator checks cover card fills, disclosures, settings/dialog return, draft cancellation,320/390px, AX5 and Reduce Motion. A19.615-second actual Simulator recording is retained. These are not fresh real-user login, invitation delivery, payment, physical-device accessibility or whole-product acceptance claims.

The API, identity services and permissions are unchanged. Publish only the existing staging Web asset and install the ordinary cloud Debug build in Matrix17Pro, with no synthetic identity in its launch environment. Final publication hashes, HTTP checks and cleanup are recorded in [QA](../output/qa/rillora-surface-motion-20260917/README.md) and [handoff](handoff.md). Earlier real A/B and Stripe evidence remains dated separately.
