# Rillora Auth0 Live Verification — 2026-08-17

Scope: Auth0 EU development tenant, `login.rillora.xyz`, Web staging Account
entry and the iPhone 17 Pro Max iOS Simulator Account child page.

## Configuration readback

- Theme and Liquid template:
  `../rillora-auth0-universal-login-20260817T080723Z/`.
- Theme id: `GpJAJlTXdfUIS8CxG2bjw5EnI3NZEceJ`.
- English custom text:
  `../rillora-auth0-custom-text-20260817T075929Z/`.
- Apply scripts performed pre-change readback and post-change exact readback.

## Browser checks

Final screenshots are in
`../../playwright/rillora-auth0-live-20260817/`.

- Signup: 320px, 390px and 1440px; document `scrollWidth` equalled viewport
  width at each checked size.
- Login at 390px: identifier 52px, recovery link 44px, Continue 52px,
  Create-account switch 44px, passkey 52px and Google 52px.
- Recovery request at 390px: identifier 52px, Continue 44px and Back-to-sign-in
  44px.
- Final checked pages produced no captured console error.
- `https://app.staging.rillora.xyz/account` reached both custom-domain login and
  signup prompts.

## iOS checks

Evidence files in `../rillora-auth0-live-ios-20260817/`:

- `ios-create-account.jpg`: native Account → Create account opened the branded
  `Create your account` prompt on `login.rillora.xyz`.
- `ios-sign-in.jpg`: native Account → Sign in opened the branded `Welcome back`
  prompt on `login.rillora.xyz`.
- `ios-account-after-cancel.jpg` and
  `ios-account-after-sign-in-cancel.jpg`: cancelling each system authentication
  session returned to the complete native Account child page without an alert.

The simulator was iPhone 17 Pro Max, iOS 26.5, bundle
`com.rillora.ios`. This is not physical-device or complete device-matrix
evidence.

## Explicit exclusions

- No email, password, MFA code or Google credential was entered.
- No account creation, authenticated callback, password submission, passkey,
  Google login, recovery delivery, verification email or challenge completion
  was attempted.
- The login prompt shows Auth0's development-key warning because the Google
  connection still uses Auth0 development keys. It was not hidden.
- These artifacts prove only the exact development-tenant and staging routes
  inspected; they do not prove production identity, localization, full WCAG
  conformance, email delivery, App Store readiness or release readiness.
