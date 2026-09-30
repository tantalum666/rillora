# Prototype Asset And License Register

Role: prototype dependency and visual asset provenance  
Authority scope: fonts, icon libraries and selected visual evidence used by the current build  
Status: ACTIVE  
Last updated: 2026-08-20

| Asset | Version | License | Use |
| --- | --- | --- | --- |
| Inter via `@fontsource/inter` | 5.3.0 | SIL Open Font License 1.1 | Web and iOS prototype UI/body type |
| Source Serif 4 via `@fontsource/source-serif-4` | 5.3.0 | SIL Open Font License 1.1 | Web and iOS prototype display type |
| Phosphor Icons for React | 2.1.10 | MIT | Web interface icons |
| `@hpke/core` | 1.9.0 | MIT | Web RFC 9180 HPKE key wrapping and recovery verification |
| Radix Icons | 1.3.2 | MIT | iOS prototype interface icons |
| Product Design mobile runtime device assets | bundled template | template-owned runtime asset set | iPhone/Pixel preview chrome; unmodified |
| `01-calm-continuity.png` | generated 2026-08-04 | project concept evidence | visual source only; not shipped as flattened UI |
| Google pre-approved iOS `Sign in with Google` light pill and Google Sans prototype resources | retrieved 2026-08-17 from Google Identity branding assets / Google Fonts | Google brand assets; use governed by the current Sign in with Google branding guidelines | Historical prototype resources only; the 2026-09-04 native／hybrid direction uses the official GoogleSignIn SDK and must follow its current button／branding contract when native Google is enabled |
| GitHub Invertocat white SVG | official `GitHub_Logos.zip`, retrieved 2026-08-20 from `brand.github.com/foundations/logo`; SHA-256 `ccd84c89b1056345608fc3489357f8acc7397e49a3cdc2d418b6c8016911d47b` | GitHub trademark／logo rules; permitted secondary referential link use, no modification or implied endorsement | iOS and Web `Official checks` GitHub guide only; original white SVG preserved on Rillora's neutral action-icon plate |
| X white logo PNG | official `x-logo.zip`, retrieved 2026-08-20 from `about.x.com/en/who-we-are/brand-toolkit`; SHA-256 `432bdd47255b48366843ec21d209e774f93b807e1fd0894fc983aad0dc7bd03b` | X Brand and Trademark Guidelines; original mark must remain unmodified and must not imply affiliation | iOS and Web `Official checks` X guide only; original white PNG preserved on Rillora's neutral action-icon plate |

Local license evidence is present in the installed packages’ `LICENSE` files. Before public distribution, preserve required license notices in the shipped product and re-audit any newly added asset.

The provider catalog intentionally does **not** use approximate logos. Google Identity's downloaded `G` is limited to Google sign-in presentation, Microsoft's corporate logo commonly requires a license, LinkedIn's full logo requires a separate license, Bitwarden prohibits logo use without written permission, 1Password's developer mark license is limited to genuine integrations, and the combined Meta／password-manager rows do not have one truthful official mark. Those entries use neutral system／library icons until a current rule clearly permits this exact third-party directory use.
