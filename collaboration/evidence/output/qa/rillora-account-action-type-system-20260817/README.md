# Rillora Account Action Type System — 2026-08-17

## Status

Accepted default-text-size replacement for the superseded provider-only type
match in `../rillora-account-provider-type-match-20260817/`.

## Implemented result

- All four Account actions use one `20pt` semibold visual baseline at the
  checked default system text size.
- `Create account` and `Sign in`: SF Semibold, explicit fixed `20pt`.
- `Sign in with Apple`: unmodified native system `SignInWithAppleButton`.
- `Sign in with Google`: bundled `GoogleSans-SemiBold`, fixed `20pt`, paired
  with the unchanged current official `20 × 20pt` multicolor G.
- Every label/group stays centered within an equal `54pt`-high control.

## Brand and accessibility boundaries

- Google's published custom-button reference specifies Google Sans Medium.
  SemiBold is retained here as an explicit prototype visual-parity choice in the
  official font family; it requires provider-brand review before production and
  is not claimed as Google app-verification approval.
- This screenshot covers the default system text size. Accessibility Dynamic
  Type remains a separate matrix obligation and is not inferred from this image.

## Resource provenance

- Google branding guidance:
  `https://developers.google.com/identity/branding-guidelines`
- `GoogleSans-SemiBold.ttf` was downloaded from the official Google Fonts
  delivery URL returned for Google Sans weight `600`.
- Font SHA-256:
  `3f9e55d5a74e96e8d6c047a2b8ecc0993fb7ad65986aa8a6a6284715a8a9e909`

## Verification

- Debug build, install and launch on the configured iPhone 17 Pro Max
  Simulator: passed.
- Current-source unit tests: `78 passed / 0 failed / 0 skipped`.
- Brand-resource tests confirm `GoogleSans-SemiBold` and `GoogleGLogo` load from
  the application bundle.
- `RilloraLayoutMatrix` build-for-testing: passed.
- Runtime semantics retain `Create account`, `Sign in`, `Sign in with Apple`
  and `Sign in with Google`.
- No authentication action was selected during this visual verification.

## Visual evidence

- `account-action-type-system.jpg`
- SHA-256:
  `77a840ef7b125d579d66d00d175dd0e142953e42166734de598209faea9ec3a2`

## Evidence boundary

This proves the current local default-size simulator rendering, font and mark
bundling, compiled layout contracts, runtime labels and unit-test state. It does
not prove the full Dynamic Type matrix, Google brand approval, Apple or Google
authorization, callback/session exchange, production OAuth credentials, account
linking, physical-device behavior, App Store compliance or Release readiness.
The existing Apple-key rotation gate and Release closure remain unchanged.
