# Rillora App Store presentation — designed first edition

> October2 update: the newer internal TestFlight build and persisted six-image store draft are recorded in [the current contract](../../../../docs/independent-release-closeout-20261002.md). The dated preparation facts below remain historical; they are not the current no-upload/no-reset status.

Prepared2026-09-30. The Owner requested designed store images after rejecting direct
screenshots as the presentation. The app UI,source captures,full03identity and pricing
remain unchanged. This is a local design set,not an App Store upload or release.

[View the six designs](review-board.html) · [iPhone sequence](iphone-series-preview.jpg) · [iPad sequence](ipad-series-preview.jpg)

| File | Story | Export |
| --- | --- | --- |
| [iPhone1](iphone-01-private-map.jpg) | Leave less to figure out — your private map | 1320×2868JPEG |
| [iPhone2](iphone-02-chosen-sharing.jpg) | Their view. Your choice — selected sharing scope | 1320×2868JPEG |
| [iPhone3](iphone-03-keep-a-copy.jpg) | A copy to keep close — audience-bound guide preview | 1320×2868JPEG |
| [iPhone4](iphone-04-start-small.jpg) | Start with what matters — a gentle starting point | 1320×2868JPEG |
| [iPad1](ipad-01-private-map.jpg) | Private map,using the real iPad capture | 2064×2752JPEG |
| [iPad2](ipad-02-start-small.jpg) | Getting started,using the real iPad capture | 2064×2752JPEG |

The composition uses warm paper/forest/sage,SourceSerif4andInter,large concise copy,
illustrative device frames and controlled curves. The sharing emphasis is a magnified
crop of the actual screenshot control; it is not an invented interface. iPad layout
has its own device proportions. Source UI pixels are supplied intact as embedded
image layers,with scaling/cropping only for composition. All private records are
synthetic; no real personal data,rating,price or certification is added.

The six JPEGs are opaque,sRGB and dimension-checked. [Validation](validation.json)
records output hashes and source preservation. The combined sheets are for comparison,
not upload. The original direct captures remain in the earlier release package.

Editable vector masters are the six corresponding SVG files. For copy/layout edits,
use sources/build_posters.py; sources/font_outline.py renders exact bundled font
outlines instead of relying on host font substitution. Run the Python generator with
fonttools available,then node sources/render.cjs with Sharp. Original font files and
fullOFLlicences are in fonts; original screen/brand inputs are in sources.
Keep the licences with those font files. No external image-generation service is
needed to reproduce this set.

Apple permits text/image overlays while requiring screenshots to reflect actual app
use and fictional account data.[App Review Guidelines2.3](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata).
The dimension/opaque-image contract remains the previously checked[Apple screenshot
specification](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).
Final store submission remains a separate task.
