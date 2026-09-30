# Rillora iOS Account Action Order — 2026-08-17

## Owner correction

Move Apple and Google below the email actions. Never place Apple and Google
side by side; render them as one vertical stack.

## Current order

1. `Create account`
2. `Sign in`
3. `or continue with`
4. `Continue with Apple`
5. `Sign in with Google`

Apple and Google retain the same official `188 × 44` provider-control size and
are centered in a vertical stack on every supported width. The earlier
wide-screen `ViewThatFits` horizontal branch has been removed.

## Verification

- Current-source unit tests: `77 passed / 0 failed / 0 skipped`.
- RilloraLayoutMatrix scheme compile: passed with explicit vertical frame-order
  and 44-point target assertions.
- iPhone 17 Pro Max Debug build/install/launch: passed.
- Runtime semantic order:
  - `account-entry.create`
  - `account-entry.sign-in`
  - `account-entry.apple`
  - `account-entry.google`
- Current screenshot: `account-provider-bottom-stack.png`.

No provider button was activated. This is layout, build and semantic evidence;
it is not Apple or Google callback evidence. The Apple credential-rotation gate
remains in force, and Release Apple sign-in remains closed.
