# Rillora native Apple sign-in preflight

Date: 2026-08-17  
Scope: local iOS implementation, Apple App ID registration and external-state preflight  
Environment: `apps/ios`, Auth0 EU development tenant, Apple Developer account resource page

## Implemented locally

- `AuthenticationServices` system authorization is connected to the Account
  child page through `SignInWithAppleButton`.
- Apple authorization-code exchange uses Auth0.swift
  `login(appleAuthorizationCode:fullName:audience:scope:)`.
- The Auth0 access token reuses the existing Rillora
  `POST /auth/native/session` exchange and opaque Keychain session.
- `Rillora.entitlements` declares `com.apple.developer.applesignin`.
- `RilloraAppleSignInEnabled` defaults to false in both Debug and Release, so
  an externally unconfigured button cannot appear as a working feature.

## Verification

- XcodeGen regenerated `apps/ios/Rillora.xcodeproj` from `project.yml`.
- XcodeBuildMCP discovered and passed `77 / 77` current-source unit tests on
  the configured iPhone 17 Pro Max Simulator.
- A Release Simulator build succeeded with the Apple feature gate still closed;
  the build check did not turn on Apple login or supply production identity.
- The two added tests prove default-closed and explicit-open parsing for the
  Apple feature gate.
- `project.yml` now fixes the Rillora application target to Apple Developer
  team `8L99CFNK24` with automatic signing; XcodeGen regenerated the project.
- A Debug Simulator build with code signing disabled succeeded after the
  signing-setting change. This proves compilation only, not provisioning,
  physical-device signing or a native Apple callback.

## External state and readback

- Auth0 CLI is authenticated to the development tenant.
- Auth0 Apple connection `con_W01eaZ5ruegFXB4T` now exists. Independent
  Management API readback confirms Team ID `8L99CFNK24`, Key ID
  `9H3JRBA558`, `email name` scope, stored app-secret presence and
  `on_each_login` synchronization without returning the secret value.
- The connection clients endpoint returns exactly one client:
  `Rillora iOS / HDfmJrHaM08lDAgsygPm7b5OB1aaUhrZ`.
- Auth0 client `Rillora iOS` readback now contains iOS Team ID `8L99CFNK24`,
  app bundle identifier `com.rillora.ios`, and native Apple login enabled.
- A valid local Apple Development signing identity exists.
- The Owner accepted the current Program License Agreement; resource access
  resumed for Apple Developer team `8L99CFNK24`.
- With the Owner's explicit confirmation, Apple Developer registered the
  explicit App ID `com.rillora.ios` (`Rillora iOS`). Its configuration readback
  shows `Sign in with Apple` enabled as the primary App ID.
- With the Owner's explicit sensitive-credential confirmation, Apple registered
  key `Rillora Auth0 Development` for the Rillora primary App ID. Apple reports
  Key ID `9H3JRBA558` and marks the one-time `.p8` as downloaded.
- The Owner located the downloaded key at
  `/Users/tantalum/Downloads/AuthKey_9H3JRBA558.p8`; permissions were tightened
  to owner-only. After the Owner personally accepted the Marketplace terms and
  reconfirmed the exact sensitive transmission, the key was streamed through
  standard input to the Auth0 Management API. It was not printed, written to a
  request file or copied into the repository. At the Owner's direction, the
  local copy was retained at
  `.local-secrets/apple/AuthKey_9H3JRBA558.p8`. The root `.gitignore` excludes
  `.local-secrets/`; the directory is mode `0700`, the file is mode `0600`, the
  Downloads source is absent, Git status does not expose it, and current build
  or deployment configuration does not reference it.

## Explicitly not completed

- no Apple credential submission, native callback or Rillora private-plan load;
- no encrypted secret-store or independent backup evidence for the retained
  local private-key copy;
- no account linking, logout-revocation or physical-device proof;
- no production signing, App Store submission or compliance claim.

The native Apple button must remain hidden until every external gate above is
completed and a real end-to-end native login passes.
