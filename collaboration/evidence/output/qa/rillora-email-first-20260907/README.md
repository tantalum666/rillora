# Rillora email-first hosted login — 2026-09-07

The Owner explicitly requested email above the other methods, less empty space,
and restoration of Apple login. This supersedes the earlier agent decision to
place social methods first. The native Account intermediary remains removed.

## Applied and inspected

- The supported Auth0 theme now uses `social_buttons_layout: bottom`.
- Login copy is shortened to “Signed up with Google? Use Google.”
- Email and Continue precede the alternative methods in the actual iOS hosted
  container and in 390px/320px browser checks.
- At 390px the reminder fits one line; the description-to-input gap is about
  27 CSS pixels. At 320px text wraps without horizontal overflow. Main Continue
  is 44px high and the provider buttons are 52px high.
- No global page-template, native code, session limit, consent contract or
  account-linking behavior was changed in this pass.

![Email-first at 390px](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-email-first-20260907/email-first-390.png)

[Actual iOS hosted view](ios-email-first.jpg) · [320px check](email-first-320.png) · [Owner original](before-owner.png)

The original iOS build/tests remain their earlier evidence. This pass uses
configuration readback and actual visual checks instead of repeating unrelated
native tests.

## Apple preparation and exact remaining gate

Apple's official account page was authenticated. The Services ID list was empty.
`Rillora Account / com.rillora.auth` was registered and configured with only
Sign in with Apple, the existing primary `com.rillora.ios`, domain
`login.rillora.xyz`, and return URL `https://login.rillora.xyz/login/callback`.
After saving and reopening, the capability, primary App and both registered
URLs were read back.

The Apple Keys list and Auth0 connection both still use `9H3JRBA558`, the login
key documented as exposed in an earlier tool output. It has not been rotated.
The replacement draft `Rillora Auth0 20260907` is prepared with only Sign in with
Apple and the Rillora primary App. The browser is stopped before Register.
No replacement key has been created, downloaded or sent; no old key is revoked.

The Owner has been asked to approve creation/storage of this replacement key,
its transmission to the existing Auth0 Apple connection, old-key revocation
once the replacement is configured, and restoration of the iOS binding.
`tools/auth0/apply-apple-hosted.py` validates the protected key file and target,
preserves other options/bindings, and logs no private material. Its syntax is
checked; execution requires the approved new key. It does not itself create or
revoke keys, and it leaves binding restoration as a separately verified step.
The StoreKit key is outside this operation.

## Evidence limits

The Apple button is still paused while the credential gate is pending. A
prepared key form is not a created key or completed Apple login. This pass
creates no user identity, account merger, payment, notification or public app
release. The browser viewport override has been reset.
