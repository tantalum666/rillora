# Installed component and motion preview

Status: INSTALLED — NORMAL APP UPDATED; INTERACTIVE PREVIEW READY  
Last updated: 2026-09-18 (Asia/Hong_Kong)

Owner explicitly requests selecting usable components/effects and installing them in Simulator for hands-on review. Continue the existing Graphite / Prepared Folio and licensed-reuse work; no new whole-app composition, identity flow or consumer Simulation feature is introduced.

## Selected packages and components

| Component / effect | Source | Integration |
| --- | --- | --- |
| Content-sized single-select tags | Figma SDS; CC BY4.0 design / MIT code | Existing Matters, inbox and billing controls; now with a subtle selected-state jump |
| Confirmation pulse and small jump | Pow, MIT | Actual About-copy and invitation-copy feedback; full interactive preview |
| Blur-to-clear insertion | Pow, MIT | Shared disclosure style; removal is immediate |
| Loading shimmer | SwiftUI-Shimmer1.5.1, MIT | Existing Overview/Matters loading skeleton; stops when absent, inactive or reduced motion |
| Attention shake | Pow, MIT | Preview candidate only; not attached to every product error |

Pow is pinned to the official `1b4b1dda28c50b95f0872927ee2226fe8b58950e` commit. Its latest numbered1.0.5 release failed the current Xcode with ambiguous `.pi` in Anvil; the pinned official commit explicitly fixes that issue. No local vendor patch or floating branch is used. Shimmer is pinned to1.5.1. Existing Auth0/Google versions remain3.0.2/9.2.0. Pow's optional snapshot-preview product is not compiled/linked into the app.

Full MIT notices and existing SDS credits ship in DesignCredits.txt, reachable from About Rillora and the preview's information button. [Asset register](asset-licenses.md), [notices](../THIRD_PARTY_NOTICES.md).

## Simulator review app

`RilloraComponentPreview` is a separate scheme and application bundle, `com.rillora.component-preview`, displayed as **Rillora Preview**. It reuses the actual shared components but has its own SwiftUI entry point and local state. It does not initialize AppDependencies, authentication or API services. It creates no user record or invitation and requires no login. The normal Rillora application remains installed separately.

Feedback provides confirmation/attention replay and the SDS filters. Loading deliberately previews a three-second operation; that delay exists only in the preview, never in production loading. Flow replays Person/Access/Link labels and the same Visible details disclosure. A local Reduce motion toggle permits comparison while the system preference is still honored. No fake connected account, QR or legal acceptance is generated.

## Scope and evidence

The normal App receives the shared confirmation, selection, disclosure and loading effects; the attention shake remains a candidate in the separate preview. Product copy/status still comes from actual operations. A successful copy triggers confirmation; resetting the temporary label does not. Confirmation eligibility is passed as a live predicate so its old rendered value cannot suppress a new success or animate a reset.

New normal-App unit run:152 pass,0 fail,1 existing StoreKit skip. Final normal and preview builds are checked separately. Rendered preview interactions, loading-to-ready, disclosure, local reduced-motion state, credits and actual normal-App Copy information→Copied are checked. A15.938-second final runtime recording and an85.74-second initial recording are retained, with the final Simulator state in [QA](../output/qa/rillora-components-preview-20260918/README.md).

No Web/API deployment, real login, payment, new sharing authorization, physical-device haptic or whole-product accessibility certification is implied. Review feedback should tune these reusable components before widening the motion vocabulary.
