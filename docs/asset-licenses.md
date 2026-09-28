# Prototype Asset And License Register

Role: prototype dependency and visual asset provenance  
Authority scope: fonts, icon libraries and selected visual evidence used by the current build  
Status: ACTIVE  
Last updated: 2026-09-28 (public landing components; original approved03 retained)

| Asset | Version | License | Use |
| --- | --- | --- | --- |
| Inter via `@fontsource/inter` | 5.3.0 | SIL Open Font License 1.1 | Web UI/body; native production body uses system type |
| Source Serif 4 via `@fontsource/source-serif-4` | 5.3.0 package; inspected WOFF4.004 | SIL Open Font License 1.1 | Web display; selected outlined Logo in Web/iOS |
| Phosphor Icons for React | 2.1.10 | MIT | Web interface icons |
| Motion | 13.4.4, exact package lock | MIT | Public landing reveal, recipient transitions, path drawing and folio response; no paid Motion+ APIs |
| Radix React Accordion | 1.2.20, exact package lock | MIT | Accessible public FAQ; bundled dependency notices preserved |
| `@hpke/core` | 1.9.0 | MIT | Web RFC 9180 HPKE key wrapping and recovery verification |
| Radix Icons | 1.3.2 | MIT | iOS prototype interface icons |
| Product Design mobile runtime device assets | bundled template | template-owned runtime asset set | iPhone/Pixel preview chrome; unmodified |
| `01-calm-continuity.png` | generated 2026-08-04 | project concept evidence | visual source only; not shipped as flattened UI |
| Google pre-approved iOS `Sign in with Google` light pill and Google Sans prototype resources | retrieved 2026-08-17 from Google Identity branding assets / Google Fonts | Google brand assets; use governed by the current Sign in with Google branding guidelines | Historical prototype resources only; the 2026-09-04 native／hybrid direction uses the official GoogleSignIn SDK and must follow its current button／branding contract when native Google is enabled |
| GitHub Invertocat white SVG | official `GitHub_Logos.zip`, retrieved 2026-08-20 from `brand.github.com/foundations/logo`; SHA-256 `ccd84c89b1056345608fc3489357f8acc7397e49a3cdc2d418b6c8016911d47b` | GitHub trademark／logo rules; permitted secondary referential link use, no modification or implied endorsement | iOS and Web `Official checks` GitHub guide only; original white SVG preserved on Rillora's neutral action-icon plate |
| X white logo PNG | official `x-logo.zip`, retrieved 2026-08-20 from `about.x.com/en/who-we-are/brand-toolkit`; SHA-256 `432bdd47255b48366843ec21d209e774f93b807e1fd0894fc983aad0dc7bd03b` | X Brand and Trademark Guidelines; original mark must remain unmodified and must not imply affiliation | iOS and Web `Official checks` X guide only; original white PNG preserved on Rillora's neutral action-icon plate |

Local license evidence is present in the installed packages’ `LICENSE` files. Before public distribution, preserve required license notices in the shipped product and re-audit any newly added asset.

September28 public landing: the two new libraries and their19runtime dependency
packages resolve to four distinct full license texts, appended to the shipped
`apps/web/src/assets/design-credits.txt`. Their installed manifests/licenses were
read directly; both selected libraries permit commercial use underMIT. Source
Serif4's existingOFL also covers the added400weight. Three ImageGen concepts and
two standalone assets are project-owned generation evidence in
`assets/concepts/rillora-landing-20260928/`; production WebP derivatives preserve
the referenced artwork. Existing provider-mark approvals are reused, not expanded
by a generated mock. The old microfavicon is withdrawn from product usage.

The provider catalog intentionally does **not** use approximate logos. The following August20 position is a conservative implementation checkpoint, not a ruling that unlicensed factual reference is always unlawful; current context-specific outcomes are in [Provider Mark Use](provider-mark-usage.md). Google Identity's downloaded `G` is limited to Google sign-in presentation, Microsoft's corporate logo commonly requires a license, LinkedIn's full logo requires a separate license, Bitwarden prohibits logo use without written permission, 1Password's developer mark license is limited to genuine integrations, and the combined Meta／password-manager rows do not have one truthful official mark. Those entries use neutral system／library icons until a current rule clearly permits this exact third-party directory use.

## Generated interaction artwork — 2026-09-09

The built-in ImageGen tool produced the [public storyboard](../assets/concepts/rillora-public-motion-20260909/reference-storyboard.png)
and [selected deep-page reference](../assets/concepts/rillora-public-motion-20260909/deep-pages-v2.png).
These are concept references, not flattened shipped screens. The rejected first
deep-page board remains clearly named as rejected evidence.

Two generated RGBA assets, `continuity-map.png` and `continuity-guide.png`, are
copied into native asset catalogs and Web resources. They depict conceptual folded
paper, contain no user data or third-party logos, and use ImageGen rather than a
stock-image source. Prompts and originals are retained in the
[concept folder](../assets/concepts/rillora-public-motion-20260909/README.md).
Interactive nodes, connectors, controls and state labels remain native/DOM UI.

## Invitation UI assets — 2026-09-10

- `qrcode` 1.5.4 (MIT; upstream soldair/node-qrcode) renders the actual Web QR locally. No QR service receives the invitation capability. iOS uses system Core Image.
- [Generated interaction board](../assets/concepts/rillora-trusted-sharing-20260909/interaction-reference.png) is design evidence only. Its invented QR and inset are not shipped as controls or pre-acceptance data.
- Existing Phosphor and SF Symbols provide functional person/file/link controls. No real recipient photo or third-party avatar service is used.

## Authenticated folio — 2026-09-11

Generated through the built-in ImageGen tool from Rillora's selected Prepared Folio concept and existing app screenshots. Use is subject to the applicable OpenAI terms; no independent copyright or exclusivity claim is made. Source/provenance and exact prompt are in the [asset record](../assets/concepts/rillora-authenticated-motion-20260911/README.md). Shipping JPEG is87,765bytes, SHA256536cf7e6658ce0be63fd74964f51c66870c6d39b0b9f7223343c3a8cd21f9901, used identically in Web and native asset catalogs. No generated number, QR, provider logo or fake transparency is shipped.


## Signed-in surface and motion components — 2026-09-17

- `RilloraSurfaceMotion.swift`, `SurfaceMotion.jsx` and `surface-motion.css` are project-authored components using platform SwiftUI/CSS capabilities. No new runtime library, stock animation, Lottie file or paid component is added.
- Existing Phosphor React2.1.10 supplies Web symbols. Its [upstream MIT license](https://github.com/phosphor-icons/react/blob/master/LICENSE) permits commercial use subject to retaining its copyright and permission notice. Existing license evidence remains in the installed package; this is not a waiver of attribution/notice obligations.
- Native symbols remain system SF Symbols on Apple platforms, used under [Apple's symbol guidance](https://developer.apple.com/sf-symbols/); no SF Symbol is exported into Web assets or adopted as a logo.
- Evaluated [Pow's MIT license](https://github.com/EmergeTools/Pow/blob/main/LICENSE), but no Pow code or package was imported. Native transitions cover this task without another dependency.
- Read-only Figma library searches in the existing audit file returned no Card/Button component to reuse. No Community asset was imported. Figma membership is not itself an asset license: the [official Community licensing page](https://help.figma.com/hc/en-us/articles/360042296374-Figma-Community-copyright-and-licensing) distinguishes free CC BY4 files, paid-resource terms and plugin/widget terms. Any later asset needs its own checked license and required credit.
- The existing generated Prepared Folio remains the visual reference. No new concept image or branding decision supersedes it in this refinement.


## Adopted Figma component — 2026-09-18

Owner explicitly clarifies that a commercially permitted component should be adopted with the required notice, rather than rejected because attribution is needed. This supersedes any inferred policy of avoiding external components; September17's no-import statement remains a historical fact.

The Figma-authored **Simple Design System — Tag Toggle Group / Tag Toggle** is now imported into the existing Rillora audit design file, node `8:52`, source component key `16bdd1a370815a1ab8c04bd4aacaf3c6fa9bfe3b`. Its reference code and screenshot were read before adapting its content-sized selected/unselected tag anatomy to native SwiftUI. Changes: Rillora colors, single selection,44pt targets, wrapping and uncapped Dynamic Type. No whole-app template replacement or React runtime is imported into iOS.

- [Official Community licensing](https://help.figma.com/hc/en-us/articles/360042296374-Figma-Community-copyright-and-licensing): free files allow commercial adaptation under CC BY4.0 with credit. The [official UI-kit catalog](https://help.figma.com/hc/en-us/articles/24037724065943-Start-designing-with-UI-kits) identifies SDS as Figma's built-in kit available on any plan.
- [SDS Community file](https://www.figma.com/community/file/1380235722331273046/simple-design-system), creator Figma; [CC BY4.0](https://creativecommons.org/licenses/by/4.0/).
- [SDS code MIT license](https://github.com/figma/sds/blob/main/LICENSE), Copyright2024 Figma; inspected source revision `6afa4b44c37f11bba98d7d8b549dedba514f6cdb`.
- Attribution, source links, modification statement and full MIT notice are in [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md) and bundled `DesignCredits.txt`, reachable through About Rillora → Design credits. Bundle equality and actual page rendering are checked.
- Pow's current MIT license was also reconfirmed; it is still evaluated, not installed. No royalty or paid component purchase was required for this adopted SDS component. Apple-specific kits require their own EULA and are not generalized from SDS's license.


## Installed motion libraries — 2026-09-18 continuation

Owner then requests usable components/effects installed for direct Simulator review. Pow is now adopted, superseding the earlier evaluated-only state. Use official fixed revision `1b4b1dda28c50b95f0872927ee2226fe8b58950e` ([commit](https://github.com/EmergeTools/Pow/commit/1b4b1dda28c50b95f0872927ee2226fe8b58950e)) after its1.0.5 tag failed current Xcode's `.pi` inference. [Pow MIT license](https://github.com/EmergeTools/Pow/blob/main/LICENSE), Copyright2023 Emerge Tools, Inc. No source fork or private binary is used.

SwiftUI-Shimmer1.5.1 is also installed; [MIT license](https://github.com/markiv/SwiftUI-Shimmer/blob/1.5.1/LICENSE), Copyright2021 Vikram Kriplaney. Its effect is limited to visible active loading and honors reduced motion. Both notices are preserved in the project and both app bundles. The native Preview target uses actual shared code and existing SDS components; it does not add a new asset licensing regime. [Integration and preview contract](component-preview-20260918.md), [QA](../output/qa/rillora-components-preview-20260918/README.md).


## Official provider marks — September18–19 guidance follow-up

Owner asks whether company logos can replace neutral icons. Product names and downloaded artwork do not by themselves grant unrestricted commercial trademark rights. Rechecked [Google visual-brand rules](https://partnermarketinghub.withgoogle.com/brands/google/branding-guidelines/how-to-show-googles-brand/), [Microsoft trademark rules](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks), [Dropbox rules](https://www.dropbox.com/branding) and [Meta Instagram rules](https://www.meta.com/brand/resources/instagram/instagram-brand/). Google restricts general business logo use; Microsoft graphical marks ordinarily need a license. Dropbox distinguishes instruction from commercial/product use; an example image was inspected but not adopted, avoiding an uncertain/currentness-mismatched asset.

Adopted the current Meta-hosted Instagram pack's **Instagram_Glyph_White.svg**,1819bytes, unmodified. Its published rules permit this secondary descriptive placement subject to their brand conditions; do not infer partnership, general trademark ownership or an MIT license. The18-guide directory now uses Instagram's actual glyph alongside the already licensed/referential GitHub and X marks. Public Web and contextual recommendations reuse the same permitted mark component. Other companies keep neutral symbols where this exact use is not cleared; no approximated logo or third-party icon-pack license is treated as trademark permission.

- Official pack page: https://www.meta.com/brand/resources/instagram/instagram-brand/
- Asset path in pack: `IG_brand_asset_pack_2023.zip / 01 Static Glyph/02 White Glyph/Instagram_Glyph_White.svg`.
- Exact SHA-256 and source choice: [asset provenance](../output/qa/rillora-contextual-guidance-20260918/instagram-asset.json). The2.65MB gradient raster was not shipped; the official white SVG is used without edits.
- The non-affiliation statement and source link are in THIRD_PARTY_NOTICES and bundled DesignCredits. No royalty, paid subscription or new runtime dependency was added.


## September19 re-review — instructional reference versus advertising

Owner challenges the earlier broad caution. [Provider Mark Use](provider-mark-usage.md) now separates official purpose-limited guidelines, Hong Kong section21 honest identifying use, independent copyright questions and unconfirmed contexts. Do not turn “no general license found” into “all use prohibited,” or turn a possible statutory defense into worldwide logo clearance.

Adopt **Facebook Primary Logo PNG** from Meta's current official pack and **Dropbox Glyph_128.svg** from the brand site's linked Brand partner toolkit. Both are used only as secondary guide identifiers, with original artwork/colors/proportions and purpose-specific notices. Dropbox's education/instruction clause governs this bounded content decision; not its promotional/partner use. This supersedes the previously not-adopted Dropbox state, but the old illustrated box file stays rejected. [Source files, hashes and constraints](../output/qa/rillora-provider-marks-20260919/adopted-assets.json).

At that checkpoint the original external marks were Facebook, Dropbox, Instagram, GitHub and X. Other neutral icons reflect a bounded implementation choice or remaining scope question, not a claim that every identifying reference is illegal. Existing native Apple system-symbol use is not an imported corporate-logo or cross-platform license. Public-source research is not formal legal approval.

## September19 supported-mark rollout — Coinbase

Owner asks to use supported marks as broadly as possible and specifically names Coinbase and Netflix. Adopt Coinbase's official CDS LogoMark from revision `1e9dd1347462254cea684fd8f8b325cac6c955fb`, [original source](https://github.com/coinbase/cds/blob/1e9dd1347462254cea684fd8f8b325cac6c955fb/packages/common/src/hooks/useLogo.ts), [official component documentation](https://cds.coinbase.com/components/media/LogoMark/), [source license](https://github.com/coinbase/cds/blob/1e9dd1347462254cea684fd8f8b325cac6c955fb/LICENSE).

The source copyright license is Apache-2.0, Copyright2026 Coinbase. Preserve the original24px path and documented dark-mode white, extracting only a static SVG; mark this format adaptation explicitly. Include the complete Apache license and attribution in root notices, native bundled DesignCredits and Web's same-content downloadable credits resource. Apache section6 is not a general trademark grant: the small truthful Coinbase-account guide identifier uses a separate, bounded functional-reference assessment, without an endorsement, integration, marketing or financial service claim. This is not adoption via the press site's download agreement and not a claim of individual approval.

The adopted set is now **six** external marks. Netflix's actual rendered terms expressly include content in the advance-approval condition; no Netflix artwork is installed. Binance's official style-guide link is currently private; no login/password guess or third-party replacement pack is used. Microsoft product-documentation permissions, PayPal's Web-link exception and other unresolved contexts remain purpose-specific in the [mark register](provider-mark-usage.md). Exact current source/hash and build evidence: [rollout QA](../output/qa/rillora-provider-icons-rollout-20260919/README.md).


## September19 Rillora identity — design assets only

The Owner revokes all old Logo restrictions. The Agent-selected Flowing R starts from a built-in ImageGen concept and is reconstructed as an explicit Bézier vector. This is new Rillora design work, not an imported third-party corporate mark, icon-library glyph or automatic bitmap trace. Generated source and prompt are retained in QA; no exclusivity or trademark clearance is claimed.

The complete wordmark uses the existing Source Serif 4 SemiBold family with adjusted tracking; its SIL OFL is included in the [design package](../assets/brand/rillora-identity-20260919/README.md). No new paid font/library is installed into the product. PNG/SVG/Figma outputs remain first-design assets, without an App, Web or Auth0 branding deployment.


## September19 second identity — Open Folio

A fresh built-in ImageGen folio concept was reconstructed as two explicit Bézier contours. The wordmark uses the existing Inter Medium family, with -3% tracking and outlined export; its OFL is bundled. The side-by-side comparison retains the first version's Source Serif 4 artwork and licence. The [second package](../assets/brand/rillora-identity-02-open-folio-20260919/README.md) is separate; no first-design asset, application dependency or shipped credits changed. No stock logo licence, trademark exclusivity or final Owner adoption is claimed.


## September19 identity03 — Legacy Imprint

After the Owner rejects Open Folio, a new fingerprint/tree study is generated with built-in ImageGen and reconstructed as editable curves/strokes. The Source Serif 4 outlined wordmark and OFL are reused from retained01 without changing its files. [The separate third package](../assets/brand/rillora-identity-03-legacy-imprint-20260919/README.md) remains an unshipped design alternative;02 is historical/rejected. No stock Logo, new font dependency, trademark clearance or biometric product feature is claimed.


## September19 focused tree study05

Owner retains03 and rejects the first leafy04 variation.05 is an unmodified built-in ImageGen edit of03's own icon source, saved as a raster shape study with the exact prompt. No stock asset, font dependency or new product component is added. It has no claimed vector reconstruction, trademark clearance or deployed use. [Study notes](../assets/brand/rillora-identity-05-line-tree-20260919/README.md).


## Selected03 identity and font distribution — September19

Owner chooses the original03 board. [Canonical assets](../assets/brand/rillora/README.md) are now consumed by the main iOS App icon and existing native/Web brand slots; earlier unshipped statements above describe their dated exploration checkpoints. The old03 source folder remains byte-identical. No stock Logo was imported or new font dependency purchased.

[Font verification](brand-font-license-20260919.md) confirms Source Serif4 SemiBold and Inter commercial use underOFL1.1 from primary sources. Actual SourceSerifWOFF metadata includes Adobe copyright and Reserved Font NameSource; complete original Adobe/GoogleFonts/Inter notices supplement the incomplete package-level copyright header. Canonical package, root THIRD_PARTY_NOTICES, identical Web/native credits and the legal/app same-origin font-licences resource now retain them. Outlined artwork and app code do not inheritOFL. Font permission does not establish trademark clearance.
