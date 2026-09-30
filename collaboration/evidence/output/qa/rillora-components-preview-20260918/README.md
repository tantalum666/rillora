# Installed component/motion preview — 2026-09-18

Status: COMPLETE — NORMAL APP UPDATED; SEPARATE PREVIEW RUNNING IN SIMULATOR

## Owner request and continuity

Owner explicitly asks to choose usable components/effects and install them into Simulator for hands-on review. Continue the September17–18 UI/licensed-reuse workflow, using its full-body78-file ledger and [focused recovery](reading-continuity.json), not a new full scan or authentication ceremony. Keep Graphite/Prepared Folio, existing navigation, real-data boundaries and closed billing.

## Adopted components

Figma SDS tags remain the content-sized selection component. Pow adds confirmation jump/pulse and blur insertion; Shimmer1.5.1 animates real loading skeletons. These libraries are MIT and their complete notices are bundled alongside SDS credit. [Pinned package record](resolved-packages.json), [project notices](../../../THIRD_PARTY_NOTICES.md), [contract](../../../docs/component-preview-20260918.md).

Pow1.0.5 initially failed current Xcode on ambiguous `.pi` in Anvil.swift. The official commit1b4b1dda28c50b95f0872927ee2226fe8b58950e explicitly fixes this; the project pins that revision, with no vendor modification or floating branch. Source/manifest/license evidence is under vendor-reference/Pow. Its optional SnapshotPreferences product is not compiled. Auth0/Google stay3.0.2/9.2.0, matching the prior build log.

## Actual product vs preview scope

The ordinary Rillora app uses the shared subtle selection jump, confirmed copy pulse/jump, blur disclosure insertion with immediate removal, and active/visible/reduced-motion-aware loading shimmer. The attention shake is a preview candidate only. Confirmation eligibility is a live closure, so updated successful state enables feedback and resetting a temporary copy label does not.

The separate **Rillora Preview** app (`com.rillora.component-preview`) shares the actual component source but uses its own @main and local @State. It never initializes AppDependencies/authentication/API services. It has Feedback, Loading and Flow pages, a local Reduce motion comparison toggle and Component credits. The three-second loading demonstration is exclusive to the preview. No real map, invitation, QR, consent or paid action is fabricated.

## New checks

- [Main unit run](native-tests.json):152pass/0fail/1 pre-existing StoreKit skip. This ran before the final live-predicate UI polish; final main build/run and actual About Copy information→Copied were checked afterward. No API/Web suite was rerun.
- [Final preview build](final-preview-build.json) and ordinary app build succeed with no errors/warnings. The first tagged-Pow failure is retained as resolved compatibility evidence, not a remaining failure.
- Actual preview confirmation, attention, full-label selection, loading→Ready after its three-second replay, Person→Access, expanded Visible details and reduced-motion-on confirmation work. Component credits contain SDS plus both new full MIT notices.
- [Final15.938-second interaction recording](preview-short.mp4), [action timeline](recording-timeline.json), [Feedback](preview-feedback.jpg), [Flow](preview-flow.jpg), [reduced-motion state](preview-reduced-motion.jpg). The earlier85.74-second recording is initial evidence; use the short clip for the final state.
- Exact-time video-frame extraction uses zero time tolerances. [Loading frame7.7s](frames/exact-77.png) versus [8.4s](frames/exact-84.png) visibly shows the shimmer band moving. Default keyframe-tolerant extracts were not used to assert temporal behavior. This is visual evidence, not a frame-rate or energy benchmark.
- Resources/DesignCredits.txt is shared by both targets; ordinary bundle equality and actual preview credit text readback were checked. All demo state is local; no local QA server is needed.

## Delivery and cleanup

Ordinary Rillora.app is installed in Matrix17Pro with its existing cloud configuration. RilloraPreview.app is installed separately and left running on Feedback with Reduce motion off, env{}. The Simulator frontend was opened. Matrix13 used for main-app checks is shut down. No real account data, auth configuration, invitation permission, Web/API deployment, merchant gate or billing state changed.

XcodeBuildMCP defaults intentionally remain **RilloraComponentPreview / com.rillora.component-preview / Matrix17Pro** for the delivered preview. Before ordinary app work, explicitly switch scheme to Rillora and bundle to com.rillora.ios. Do not confuse the preview with a normal signed-in account or production acceptance. No physical haptic/VoiceOver certification, App Store submission or new real login is claimed.

## Documentation

Updated component-preview contract, DESIGN/interaction and asset licenses; product/README/design-QA route to this checkpoint. Decision/journey appended, current handoff replaced and previous checkpoint archived HISTORICAL. Markdown link/date/status check runs before the final response. No initial Git commit, branch, stash or remote message was created.
