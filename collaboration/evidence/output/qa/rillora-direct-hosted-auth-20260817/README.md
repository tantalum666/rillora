# Rillora Direct Hosted Authentication QA

Date: 2026-08-17  
Scope: signed-out iOS authentication entry, hosted Auth0 provider presentation and Apple-glyph contrast  
Status: PASSED FOCUSED LOCAL SIMULATOR AND NO-CREDENTIAL LIVE VISUAL QA; CALLBACK, PHYSICAL DEVICE AND RELEASE GATES OPEN

## Implemented product behavior

- Signed-out Profile begins with one `Sign in / Sign up` action and the purpose
  `Access your private map`.
- That action, signed-out `Add a matter` and other explicit private-plan intents
  call the same hosted authentication entry directly.
- The former Account child page and its outer `Create account`, `Sign in`, Apple
  and Google controls are absent. Email, passkey, Google and Apple remain inside
  Auth0 Universal Login on `login.rillora.xyz`.
- `Safety & privacy` and `About Rillora` remain reachable child tasks and their
  Back paths continue to return to Profile.

## Hosted-page result

- The current iOS-client login prompt was inspected at `390 × 844`.
- Apple and Google are both present in the Auth0-owned provider list.
- The Apple glyph's computed CSS filter is `brightness(0) invert(1)`, producing
  a white monochrome mark on graphite. Google's multicolor mark is unchanged.
- The document `scrollWidth` and `clientWidth` both measured `390`; no
  horizontal overflow was observed and the checked page emitted no console
  error.
- The upper-right coral warning is Auth0's `Dev Keys` alert. It remains visible
  because the current Google connection uses Auth0 development keys; this QA did
  not hide or relabel it.

Latest tenant theme/template readback:
`output/qa/rillora-auth0-universal-login-20260817T151918Z/`.

## Automated checks

- Rillora unit tests: `77 / 77` passed on iPhone 17 Pro Max.
- Focused RilloraLayoutMatrix UI tests: `2 / 2` passed.
  - `testSignedOutExperienceUsesDirectHostedAuthenticationEntry`
  - `testSignedOutCommercialDetailsStayDeferred`
- Result bundle:
  `/Users/tantalum/Library/Developer/Xcode/DerivedData/Rillora-dwckojwigkpoyqceginrsetpyldt/Logs/Test/Test-RilloraLayoutMatrix-2026.08.17_23-21-22-+0800.xcresult`

## Evidence inventory

- `xcresult-attachments/DB18DB48-4C99-45F0-AE9B-34FA70970B4A.png` — current
  signed-out Profile with direct top entry.
- `xcresult-attachments/4C703759-C69B-43D1-8F15-6132D6C3195A.png` — current
  signed-out Matters surface.
- `xcresult-attachments/131F6538-C12D-4692-8B31-A32C102D2475.png` and related
  attachments — Safety/About child-route regression evidence.
- `auth0-ios-client-390.png` — current live hosted login at compact iOS width.
- `auth0-ios-client-390.yml` — matching accessibility/DOM snapshot.
- `simulator-launched-overview.png` — final installed signed-out build launch.

## Evidence boundary

No email, password, passkey, Apple ID, Google credential, MFA code or account
data was entered. No provider was clicked and no callback, Rillora session,
private-plan load, logout, account linking, physical-device behavior, production
Google key, App Store review or Release readiness is proven by this result.
