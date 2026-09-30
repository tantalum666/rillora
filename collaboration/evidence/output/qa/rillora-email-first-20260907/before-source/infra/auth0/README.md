# Rillora Auth0 Universal Login

This directory is the versioned source for Rillora's hosted authentication
appearance. Auth0 continues to own credentials, password recovery, passkey,
social-login and challenge handling. Rillora owns the surrounding visual shell,
theme tokens and approved prompt copy.

## Scope

- New Universal Login on `login.rillora.xyz`;
- one Liquid page template shared by signup, login, recovery and challenge
  prompts;
- a complete branding theme that follows the current graphite Rillora product
  system;
- no embedded login, Resource Owner Password Grant, credential proxy or
  Rillora-hosted password form;
- no final logo asset. Until the identity mark is approved, the template uses
  the `Rillora` wordmark and hides the tenant/application logo inside the Auth0
  widget.

The desired theme override is in [`universal-login/theme.json`](universal-login/theme.json)
and [`universal-login/page-template.liquid`](universal-login/page-template.liquid).
Scoped English prompt overrides live in
[`universal-login/custom-text/`](universal-login/custom-text/); each file owns
one Auth0 prompt group and includes only keys supported by that prompt's current
documented screens.
The static [`universal-login/preview.html`](universal-login/preview.html) is a
local visual-QA fixture only; it is never uploaded and cannot authenticate.

## 2026-09-06 direct hosted iOS entry — current

The Owner explicitly selected removal of the native intermediary and direct
hosted login. [The hosted-consent configuration](hosted-consent/README.md)
contains the required legal field, stateless client-scoped Action and the apply
sequence. It preserves the API ledger and excludes old native builds using a
new-entry marker. No new credential or user metadata is used. This supersedes
the native/hybrid primary-entry decision below. The Owner completed CLI
reauthentication; Form, deployed Action and Post Login binding now match the
source on tenant readback. The new iOS build reaches the hosted email screen;
the Owner completed Google, hosted confirmation and the session callback.
The final Form initial/error/cancel states are also checked. The incomplete
Apple web binding is paused for the iOS client, with key rotation and Services
ID prerequisites retained. No secret or existing user was changed.

## 2026-09-04 native／hybrid iOS direction — historical

The Owner approved keeping Auth0 as identity authority while moving the primary
iOS account experience into native UI. The undeployed hosted Form／Action plan
was superseded and its local artifacts were removed; no tenant Form, Action or
binding ever changed.

The native Account surface owns the compact unchecked Terms／Privacy row and
passes the existing exact versioned proof to the Rillora API. Apple uses the
existing native token exchange. Google uses the official GoogleSignIn SDK and
Auth0 native-social token exchange only when an explicit flag plus complete
iOS／server client IDs are present. Passkey uses Auth0.swift's native challenge
and Apple's platform credential provider only after an explicit flag, Passkey
grant, database policy, Device Settings and AASA readback. Email, recovery,
complex MFA and exceptional challenges continue through this hosted domain;
Rillora never renders or receives an Auth0 password.

Current source includes no Google or Passkey secret. On 2026-09-05 the Owner
confirmed creation of one Google iOS OAuth client for `com.rillora.ios`; its
public ID, the existing public server Web client ID and Google-provided URL
scheme are wired into the local iOS project. No iOS client secret exists.

The Auth0 plugin exposes no MCP server in this session, so the official CLI and
Management API were reauthorized and used for sanitized readback. Built-in
Google Native Social Login rejected the iOS client because the setting requires
an Android `app_package_name`; the paid Custom Token Exchange profile endpoint
also remains outside the Free plan. No fake Android package or paid profile was
created, Apple was preserved, and native Google remains off.

Native Passkey is the current zero-cost native provider. The database policy,
connection binding, iOS Device Settings and custom-domain AASA were already
correct. The application now preserves `authorization_code` and adds
`urn:okta:params:oauth:grant-type:webauthn`; a custom-domain challenge returned
200 with RP ID `login.rillora.xyz`. Debug enables Passkey, Release keeps it off,
and the 2026-09-06 Simulator run now verifies native Account, method gating, legal links and system cancellation. A successful passkey ceremony and Rillora session remain open. The old Sign in with Apple key still requires its separately recorded rotation before real Apple authorization.

## Versioned legal-acceptance boundary

Rillora account provisioning is now server-gated by the exact current Terms,
Privacy and clickwrap versions. The Web begins authentication only through
`POST /api/auth/start`; iOS includes the same affirmative proof in
`POST /auth/native/session`. The API rejects the legacy direct `GET
/auth/login`, a missing／false checkbox, a stale version, a different bundle
digest or an unknown evidence field. Planner creation, append-only acceptance
evidence and session issuance commit in one transaction. Existing sessions
without a current linked acceptance are invalid. A direct Auth0 login can
therefore create or authenticate only an Auth0 identity; it cannot create or
use a Rillora planner/session without the Rillora proof.

Historical optional Auth0 prompt enforcement ideas are defence in depth, not the system of record or the current implementation plan:

- database／passkey signup can later use Universal Login Prompt
  Customizations plus a Pre User Registration Action to require an unchecked
  Terms field and validate it;
- social and enterprise connections do not expose those captured signup
  fields, so they require a Post Login Redirect Action if consent is collected
  inside Auth0;
- either Auth0 route must use the same versions and must never replace the
  Rillora database acceptance record;
- do not deploy a Redirect Action until the public consent URL, resume-token
  verification, timeout／error behavior and rollback have been tested. An
  Auth0 Action failure must deny Rillora access rather than silently bypass
  consent.

The tenant was not changed for this legal contract. Native Account and the
compact Web control own the current proof. Do not deploy the retired Form／Action
plan merely because public legal URLs now work; any future hosted migration
needs its own deliberate decision, local validation and exact tenant readback.

### 2026-08-28 form-tail consent target

The static `preview.html` fixture now shows the Owner-requested signup target:
the unchecked Terms／Privacy／electronic-record checkbox appears immediately
below the email input and above `Create account`, with the recurring-charge
boundary in smaller supporting text. The fixture button remains disabled until
the checkbox is selected. After Owner review, the second visual pass further
removes emphasis: 11px muted label, neutral inline links, 16px checkbox, 10px
short boundary and 12px spacing before the CTA. This did not alter
`page-template.liquid`, the Auth0
widget, custom text, Actions or the development tenant. Database／passkey signup
would require Prompt Customization and a Pre User Registration Action; social
signup and returning-user re-consent require a fail-closed Post Login／Rillora
checkpoint design before external apply.

## Safe apply sequence

1. Authenticate the official Auth0 CLI as the Owner/operator. Never place a
   password, MFA code or Management API token in this repository.
2. Read back the current theme and page template before changing either one.
3. Store the redacted readback under a dated `output/qa/` evidence directory.
4. Run `tools/auth0/apply-universal-login.sh`. If the tenant has a default
   theme, it updates that exact id; if Auth0 returns `theme_not_found`, it
   records the absence and creates the tenant's first theme. It then applies
   the Liquid template and requires both resources to read back.
5. Pipe the Liquid source to `auth0 universal-login templates update --force`.
6. Run `tools/auth0/apply-custom-text.sh`. It reads every current English prompt
   dictionary before replacing it, then requires an exact Management API
   readback for each versioned file.
7. Open authentication through `https://login.rillora.xyz/authorize` from both
   the Web and iOS applications. Tenant-domain previews do not prove that the
   custom page template is active.
8. Check signup, login, password recovery, Google, passkey/challenge, cancel and
   callback behavior before calling the change verified.

Rollback uses the readback captured in step 3. Deleting the custom page template
returns the tenant to the Auth0-hosted default shell; restoring the previous
theme JSON returns the widget styling.

The template uses an empty data-URI favicon until the final Rillora identity is
approved. This avoids a misleading improvised icon and a repeated missing
`/favicon.ico` request. It also raises inline Auth0 account-switch and recovery
actions to a 44px minimum through semantic `a` and `button` selectors; Auth0
private generated class names remain untouched.

## Current development-tenant state

- Theme id: `GpJAJlTXdfUIS8CxG2bjw5EnI3NZEceJ` (`Rillora Graphite`).
- Theme/template final readback:
  `output/qa/rillora-auth0-universal-login-20260817T080723Z/`.
- English custom-text final readback:
  `output/qa/rillora-auth0-custom-text-20260817T075929Z/`.
- Live browser evidence:
  `output/playwright/rillora-auth0-live-20260817/`.
- Native iOS open/cancel evidence:
  `output/qa/rillora-auth0-live-ios-20260817/`.
- Direct signed-out Profile and current compact hosted-page evidence:
  `output/qa/rillora-direct-hosted-auth-20260817/`.
- Latest theme/template readback after the Apple-glyph treatment:
  `output/qa/rillora-auth0-universal-login-20260817T151918Z/`.

The hosted provider list remains the fallback chooser for email, recovery and
complex challenges, but it is no longer the only current iOS provider surface.
The 2026-09-04 native／hybrid decision adds an iOS Account view with native
Apple and configuration-gated native Google／Passkey; the hosted page template
still uses Auth0's stable `data-provider="apple"` attributes to turn only the
monochrome Apple glyph white on graphite and does not recolor Google's
multicolor mark. The native surface must not imply that its dormant Google or
Passkey configuration is live before tenant and client readback passes.

The Google connection now uses the dedicated Owner-controlled Web OAuth client
in Google Cloud project `rillora-identity`. Sanitized readback confirms the
credential fields are present, the scope remains `email / profile`, and only
`Rillora Web` plus `Rillora iOS` are enabled; `Default App` is disabled. Live
Web and iOS-client hosted prompts no longer show Auth0's development-key
warning, and both Google actions reach Google's account chooser without a
redirect mismatch. That initial check selected no account; a later
Owner-controlled Web staging run completed Google selection／consent, callback,
browser-session issuance and first private-plan load. It does not prove the
independent iOS callback, Web refresh／logout／logout-all, error handling or
production identity. Redacted setup evidence is in
`output/qa/rillora-google-oauth-20260818/README.md`.

Google's consent configuration remains External / Testing with its existing
test-user boundary. Google Cloud Branding now persists homepage
`https://rillora.xyz`, Privacy `https://legal.rillora.xyz/privacy` and Terms
`https://legal.rillora.xyz/terms`; a fresh page load returned the exact values
and Audience no longer showed the incomplete-configuration warning. This is
Testing metadata, not Google verification or production publication. After a
fresh creation-time mapping and separate Owner action-time confirmation, the
older unused Google client secret was deactivated and deleted. Client-detail
reload now shows exactly one enabled secret—the later value held by Auth0—and
the multiple-secret warning is gone; origin and callback remain unchanged.

## Evidence boundary

A successful CLI update proves only that the development tenant accepted the
configuration. Browser/simulator screenshots prove only the exact prompts and
viewports inspected. They do not prove production identity, email delivery,
Apple sign-in, physical-device behavior, localization, accessibility across the
full matrix or release readiness.
