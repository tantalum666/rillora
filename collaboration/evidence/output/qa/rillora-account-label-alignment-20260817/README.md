# Rillora Account Label Alignment Evidence — 2026-08-17

> Superseded visual evidence: the Owner rejected this complete-raster Google
> treatment because its label still appeared smaller than Apple's. Preserve
> this file as historical evidence only. The accepted replacement is indexed
> by `../rillora-account-provider-type-match-20260817/README.md`.

## Scope

Signed-out iOS `Profile → Account` visual and semantic correction only:

- align both provider verbs to `Sign in with …`;
- align the Apple and Google visual type scale;
- center `Create account` and `Sign in` against the complete button frame;
- preserve the existing provider order, handlers and fail-closed authentication gates.

## Implemented result

- Runtime order: `Create account → Sign in → or sign in with → Sign in with Apple → Sign in with Google`.
- Apple remains the system `SignInWithAppleButton`.
- Google remains the current official iOS raster content. The source content was uniformly scaled from logical `156 × 20` to `195 × 25`; its aspect ratio, official multicolor `G` and outlined Google Sans label were not redrawn or distorted.
- The upper action labels use the full button frame as their center axis. Leading and trailing symbols are decorative edge affordances; at accessibility Dynamic Type sizes they are omitted to prevent collision with centered text.

## Verification

- Debug build, install and launch on the configured iPhone 17 Pro Max Simulator: passed.
- Current-source unit tests: `77 passed / 0 failed / 0 skipped`.
- `RilloraLayoutMatrix` build-for-testing: passed with exact provider-label, equal-provider-frame and four-action-center-axis assertions compiled.
- Runtime semantic targets:
  - `account-entry.create` → `Create account`
  - `account-entry.sign-in` → `Sign in`
  - `account-entry.apple` → `Sign in with Apple`
  - `account-entry.google` → `Sign in with Google`
- No Apple, Google or email authentication action was selected during this visual verification.

## Visual evidence

- `account-labels-centered.png`
- SHA-256: `370f75c3e64d3933de820989dd3d3d97ef22bc1cd3ca8b6892b705f49346074b`

## Evidence boundary

This evidence proves the current local simulator layout, compiled layout contracts, runtime labels and unit-test state. It does not prove Apple or Google authorization, callback/session exchange, account linking, production Google credentials, physical-device behavior, App Store compliance or Release readiness. The existing Apple-key rotation gate and Release closure remain unchanged.
