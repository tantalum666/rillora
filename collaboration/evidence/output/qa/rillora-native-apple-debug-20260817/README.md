# Rillora native Apple Debug gate

Date: 2026-08-17  
Scope: local Debug entry visibility and Release isolation only

## Result

- `apps/ios/project.yml` sets `RILLORA_APPLE_SIGN_IN_ENABLED=YES` for Debug and
  retains `NO` for Release.
- XcodeGen regenerated `Rillora.xcodeproj`.
- Debug built, installed and launched on the configured iPhone 17 Pro Max
  Simulator.
- Profile → Account exposed the native system `Continue with Apple` target with
  accessibility identifier `account-entry.apple`.
- Current-source unit tests passed `77 / 77`.
- A separate Release Simulator build passed, and the built Release Info.plist
  resolved `RilloraAppleSignInEnabled` to `NO`.
- Visual evidence: `account-apple-debug.jpg`.

## Evidence boundary

The Apple button was not activated. No Apple identity, email, relay choice,
password or verification challenge was read or selected. This evidence does
not establish authorization-code issuance, Auth0 token exchange, Rillora
session creation, account creation/linking, private-plan load, cancellation,
logout, physical-device signing, App Store compliance or Release readiness.
