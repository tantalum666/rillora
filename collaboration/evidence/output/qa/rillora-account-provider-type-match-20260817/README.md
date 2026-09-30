# Rillora Account Provider Type Match — 2026-08-17

> Superseded visual evidence: the Owner found that Google Sans Medium still
> appeared lighter than Apple and that the two email actions were smaller than
> both provider actions. Preserve this as historical evidence only. The accepted
> replacement is `../rillora-account-action-type-system-20260817/README.md`.

## Status

Accepted replacement for the rejected complete-raster Google label treatment in
`../rillora-account-label-alignment-20260817/`.

## Implemented result

- Apple remains the native system `SignInWithAppleButton` with `.signIn` copy.
- Google is composed from independent brand elements so the label does not stay
  smaller merely because the complete image has a fixed internal ratio:
  - official current multicolor G: `20 × 20pt`;
  - bundled `GoogleSans-Medium`: fixed `20pt`;
  - mark-to-label spacing: `12pt`;
  - white fill, `#747775` one-point border and `54pt` outer height.
- Both provider groups are centered in equal full-width controls.
- Visible and semantic labels remain `Sign in with Apple` and
  `Sign in with Google`.

## Brand resource provenance

- Guidance and pre-approved asset bundle:
  `https://developers.google.com/identity/branding-guidelines`
- G source: current pre-approved iOS Light / icon asset. The `20 × 20pt` mark
  was cropped mechanically without redrawing or recoloring.
- Font source: the Google Sans Medium TrueType URL returned by the current
  official Google Fonts stylesheet for `Google Sans` weight `500`.
- Bundled font SHA-256:
  `e9156f50951740b525f8e6d110e0be344214cb6d5fce1e76cd3e828a604997e9`
- G asset SHA-256:
  - 1x: `c26fcccaa60b1f048eef6c6824f10cd8889eb0a61941e7462031ca979657f6c5`
  - 2x: `19a1f74bde2c1ee5b2606300814aee26b6789ab016b811322aaa151a61da2882`
  - 3x: `dae3e3f8dc6652c01c0ff030d249c4fb77ade372bd70b8d8ca0aa642d7064329`

## Verification

- Debug build, install and launch on the configured iPhone 17 Pro Max
  Simulator: passed.
- Current-source unit tests: `78 passed / 0 failed / 0 skipped`.
- The added brand-resource test proves both `GoogleSans-Medium` and
  `GoogleGLogo` load from the application bundle.
- `RilloraLayoutMatrix` build-for-testing: passed.
- Runtime semantic targets expose `Sign in with Apple` and
  `Sign in with Google`.
- No provider or email authentication action was selected during visual QA.

## Visual evidence

- `account-provider-type-match.jpg`
- SHA-256:
  `1582214968f13450786662d2c679f877da88626c5f780ca9e6620716fc99ce83`

## Evidence boundary

This proves the current local simulator rendering, brand-resource bundling,
compiled layout contracts, runtime labels and unit-test state. It does not prove
Google or Apple authorization, callback/session exchange, Google app-verification
acceptance, production Google OAuth credentials, account linking, physical-device
behavior, App Store compliance or Release readiness. The Apple-key rotation gate
and Release closure remain unchanged.
