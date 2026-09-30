# Rillora Account Provider Proportion Evidence

Date: 2026-08-17  
Scope: signed-out iOS Account provider sizing and Google brand rendering  
Simulator: iPhone 17 Pro Max, iOS 26.5, `32EE0859-2C1A-4912-A120-FF4A542E3A6D`

## Owner finding

- The centered `188 × 44` Apple and Google pills were visually undersized next
  to the full-width Account actions.
- The Google SVG rendered as a malformed color fragment rather than Google's
  recognizable multicolor `G`.

## Root cause and correction

- The previous Google SVG uses `foreignObject`, filters and an angular gradient
  that Xcode's Asset Catalog renderer did not reproduce correctly.
- Downloaded the current official Google branding bundle from
  `https://developers.google.com/static/identity/images/signin-assets.zip`,
  linked by Google's current Sign in with Google branding guidelines.
- Replaced the SVG with 1x, 2x and 3x iOS PNG content derived from the official
  light button artwork. The multicolor `G` and outlined Google Sans label are
  not stretched or recolored.
- Apple and Google now both fill the Account content column at `54pt` high with
  equal frames, `15pt` corners and a vertical `10pt` gap. Google uses the
  official white fill and `#747775` border; Apple remains the system component.
- No Google authentication SDK was introduced. The visible Google action still
  enters Auth0 Web Auth with the exact `google-oauth2` connection parameter.

## Checks

- Rillora Debug build, install and launch: PASS.
- Current-source unit tests: `77 / 77` PASS.
- RilloraLayoutMatrix build-for-testing: PASS with provider order, equal-frame
  and minimum-width assertions compiled.
- Runtime accessibility order: `account-entry.create`,
  `account-entry.sign-in`, `account-entry.apple`, `account-entry.google`.
- Visual inspection: official multicolor Google `G` visible; no provider
  clipping; both provider frames fill the same content column.
- `git diff --check`: PASS.

## Artifact

- `account-provider-full-width.png`
  - PNG, `1320 × 2868`
  - SHA-256:
    `2742696fb6f67d4e5d98a6df86b0ac47527e1907c7f2557a5778e66c41ce4181`

## Evidence boundary

No provider was pressed and no Apple or Google identity, credential, callback,
Rillora session or account-linking behavior was used. Apple remains blocked by
the credential-rotation gate; Release Apple remains disabled; Google production
OAuth credentials remain open.
