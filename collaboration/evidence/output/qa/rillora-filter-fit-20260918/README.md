# Filter width and licensed component adoption — 2026-09-18

Status: COMPLETE — NATIVE FIX VERIFIED AND INSTALLED

## Request and continuity

Owner reports the Matters filter truncating Directions added, then explicitly directs adopting commercially permitted component libraries with their required notice. This is a continuation of September17 surface/motion work. Reuse the78-file full-body ledger and [focused recovery record](reading-continuity.json); no new whole-repository scan or personal login was needed. The prior monitor next step was not the active repair task.

## Cause and fix

The three equal-width native segmented cells allocated the same width to All and Directions added, so the longest label was clipped. Adopted Figma's Simple Design System Tag Toggle Group anatomy as `RilloraFilterPicker`: content-sized tags, visible selected check,44pt targets, group wrapping and individual long-label wrapping at Dynamic Type sizes. No abbreviation or minimumScaleFactor is used. Matters, shared-review inbox and billing-period pickers now share this component. Surrounding layout and data/filter logic remain.

## Actual Figma and license work

Listed the editable audit file's available libraries and found Simple Design System, Material3 and Apple kits. Searched the needed Tag Toggle Group; imported its published component key `16bdd1a370815a1ab8c04bd4aacaf3c6fa9bfe3b` into the existing editable file at node `8:52`, outside the old audit board, and read its actual Code Connect/context/screenshot before native adaptation. The original creator file did not grant edit access; the normal published-library import route provided the component in the Owner's editable file. No rights bypass or new paid purchase occurred.

[Figma source instance](https://www.figma.com/design/xms4CTEsq37oYcVnM3xu7F?node-id=8-52), [source record](figma-source.json), [pinned SDS code/license](sds-source/LICENSE). Creator Figma; source revision6afa4b44c37f11bba98d7d8b549dedba514f6cdb. Free Community design license CC BY4.0 and code MIT permit commercial reuse with the recorded obligations. Native adaptation changes colors, sizing, single-selection and wrapping. [Project notice](../../../THIRD_PARTY_NOTICES.md) is also bundled as DesignCredits.txt and exposed under About Rillora → Design credits. Pow MIT was rechecked but not adopted; no external runtime dependency was added.

## New validation

- Build/run passes without warnings/errors. [Build evidence](build.json).
- Matrix13 normal-size All/To review/Directions added labels are complete. Actual filtered fixture counts5/2/3 confirm selection still works.
- Matrix13 AX5 plus Reduce Motion keeps all full labels and wraps the long label instead of shrinking or clipping.
- MatrixSE3 at375pt wraps the complete long option to a second row; contents stay within the card.
- Review inbox switches between My plan and For me; billing toggles show the respective68/7.99 catalog offers without creating a purchase.
- Credit resource matches its source byte-for-byte inside the app bundle; actual in-app page exposes the attribution, source, changes and full MIT notice.
- [Before filter](before/matters-filter.jpg), [normal](after/normal.jpg), [selected long label](after/selected-directions.jpg), [AX5](after/ax5-reduced-motion.jpg), [SE3](after/se-3.jpg), [review picker](after/review-picker.jpg). Before uses the ordinary current screen and after uses isolated synthetic records; comparison is the filter, not identical whole-map data.

[Rendered-check record](verification.json), [patch](implementation.patch). No new unit/API/Web suite was needed or rerun for this bounded presentation fix; September17's152/1skip/78/17 publication results remain dated prior evidence. No physical-device or full VoiceOver certification is claimed.

## Delivery and cleanup

New native app installed on ordinary Matrix17Pro, with env{} and the configured cloud API. On fresh launch the ordinary session shows public Matters; no seeded identity or new authentication is substituted. Both isolated test simulators and owned API4290 are stopped; the pre-existing synthetic local database remains for repeatable QA. Web/API/Auth0/legal/billing/real sharing records were not modified or redeployed. No Git commit/branch/stash was created.

## Documentation

Updated DESIGN, interaction/surface contract, asset licenses, third-party notices, product/README/design QA and Web durable component policy. Appended the Owner's licensed-reuse direction to decision-log and journey; current handoff replaced and previous checkpoint archived HISTORICAL. Local-link/date/state checks run before final reply. Attribution is a routine implementation obligation, not a reason to avoid an otherwise suitable permitted library.
