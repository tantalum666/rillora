# Rillora iOS Account Social Provider Group — 2026-08-17

## Objective

Replace the visually isolated Apple action with one coherent provider group:
Apple and Google first, then the existing email account paths.

## Implemented

- Apple remains the native `SignInWithAppleButton` path.
- Google now has a dedicated, actionable `account-entry.google` target.
- Google Web Auth passes `connection=google-oauth2`; it does not reopen the
  generic Auth0 provider chooser first.
- Wide layouts render the two official provider controls side by side at
  `188 × 44` each. Narrow layouts use the same controls in a vertical stack.
- The single `or use email` divider precedes `Create account` and `Sign in`.
- The Google visual is Google's current pre-approved iOS light-pill SVG. Its
  colors and aspect ratio are unchanged.

## Verification

- XcodeGen regenerated `apps/ios/Rillora.xcodeproj` from `project.yml`.
- Final Debug build, install and launch passed on the configured iPhone 17 Pro
  Max Simulator.
- Runtime semantic snapshot exposed:
  - `Continue with Apple / account-entry.apple`
  - `Sign in with Google / account-entry.google`
  - `Create account / account-entry.create`
  - `Sign in / account-entry.sign-in`
- Current-source unit tests: `77 passed / 0 failed / 0 skipped`.
- The Google authorization parameter is covered by a unit assertion for the
  exact `google-oauth2` connection name.
- RilloraLayoutMatrix scheme compile check passed after adding the provider
  target assertion.
- Screenshot: `account-social-group.png`.

The first build after introducing an Asset Catalog failed because Xcode inferred
an `AppIcon` set that does not exist. The final configuration explicitly leaves
the AppIcon catalog name empty because the Rillora logo is still unresolved;
no temporary icon was fabricated. The subsequent final build and test run pass.

## Evidence boundary

No Google or Apple button was taken through a personal identity selector in
this check. No email, provider account, password, verification challenge or
credential was read or entered; no callback, Rillora session, account linking,
logout or private-plan load was proven. The current Google connection still
uses Auth0 development keys and is not production social-login evidence.

## Official references

- Google Sign in branding guidelines:
  <https://developers.google.com/identity/branding-guidelines>
- Auth0 connection-directed authorization:
  <https://support.auth0.com/center/s/article/Authenticating-users-through-a-specific-Connection-database-social-etc>
