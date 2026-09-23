# Rillora — Flowing R / first identity design

Status: AGENT-SELECTED FIRST DESIGN; NOT INSTALLED OR PUBLICLY RELEASED  
Date: 2026-09-19

The Owner revoked every earlier Logo-specific restriction and asked the Agent to redesign it. This package develops the flowing R direction after comparing three new ImageGen concepts. The selected symbol was reconstructed as an explicit closed Bézier path; the delivered SVG is not an automatic bitmap trace or a flattened image.

## Files

- `identity-board.png` / `.svg`: complete design presentation.
- `hero.png` / `.svg`: uncluttered primary combination mark.
- `symbol-pine.svg`, `symbol-black.svg`, `symbol-white.svg`: scalable main mark.
- `symbol-micro.svg`: more open neck and less pointed tip for 16/24px.
- `symbol-16.png` through `symbol-512.png`: transparent images, named by pixel height.
- `wordmark-pine.svg` / `.png`: complete Rillora name.
- `lockup-pine.svg` / `.png` and `lockup-white.svg` / `.png`: horizontal combinations.
- `app-icon-dark`, `app-icon-light`, `app-icon-tinted`: SVG and 1024px opaque RGB PNG masters. These are square; rounded corners appear only in the design preview.
- `favicon.svg` and `favicon-32.png`: compact website icon.
- `optical-proof.png` / `.svg`: actual-size positive and reverse checks.
- `manifest.json`: source, palette and SHA-256 file records.

## Construction and type

The primary palette is pine `#183B31`, warm paper `#F5F1E8` and sage `#CBDDAF`. These are choices for this Logo design, not an unrequested App-wide colour change. Use a single light or dark fill for the symbol; keep its aspect ratio and clear space.

The wordmark uses Source Serif 4 SemiBold at -1.4% tracking, exported as outlines from Figma. This is a licensed typeface treatment, not a claim that the entire font was custom drawn. Its existing SIL OFL evidence is included as `Source-Serif-4-OFL.txt`; no new paid font or stock-mark licence was purchased.

[Figma review](https://www.figma.com/design/xvtskr8gtVJWubDyDQfRUu?node-id=51-2) includes the final visual board; [editable sources](https://www.figma.com/design/xvtskr8gtVJWubDyDQfRUu?node-id=52-2) include the main symbol, optical version and lockup. The native editable type reference is node49:4 on page49:2.

Rebuild locally with [the source builder](../../../tools/logo/build-rillora-identity-20260919.cjs), using an installed `sharp` or `RILLORA_SHARP_MODULE`. The outlined type source is included, so rendering does not depend on local font availability.

## Evidence and limits

The concept source is [ImageGen direction A](../../../output/qa/rillora-logo-resume-20260919/reset/a-ribbon-r.png), with its [exact prompt](../../../output/qa/rillora-logo-resume-20260919/selected-generation-prompt.txt). The two other explorations and pre-reset sketches remain QA history, not alternate production logos. The final design is an Agent choice under the Owner's delegated scope, not a claimed final Owner adoption.

Actual checks cover SVG parsing, palette values, output size/alpha, unclipped combinations, native small-size rendering and matching Figma colours. They do not establish human recall, trademark exclusivity/registration or public launch. No application UI, App icon installation, Auth0 branding or deployed service changed in this design task. [QA](../../../output/qa/rillora-logo-resume-20260919/README.md).
