# Rillora direct hosted login and UI follow-up — 2026-09-06–07

The Owner selected removal of the native Account intermediary. Overview,
Matters and Profile now open Auth0 Web Auth directly. The preceding whole-app
review remains active; its Account screenshots are superseded by this change.

## What changed

| Journey | Observed problem | Final implementation |
| --- | --- | --- |
| Enter an account | Native email/method page still led to a second hosted login surface | Removed AccountAccessView and its route, email field, method chooser and local checkbox |
| Return with Google | A returning social user tried the unrelated email/password path | Social methods above email; explicit Google guidance on login and password screens |
| Hosted account confirmation | Inline legal links inherited tall action styling; nested dark background, misaligned checkbox and left-aligned action | One Account terms heading, continuous legal text, aligned unchecked field, transparent inner surface and centered action |
| Available methods | Apple hosted entry appeared without a configured web Services ID | Disabled only the Rillora iOS client's Apple connection binding; other clients and credentials preserved |
| Consent/session boundary | Removing the native page removes its affirmative consent source | Required hosted LEGAL field, scoped Post Login Action and strict current receipt validation before API session exchange |

The account-method lookup was read-only and used the Owner's own failed login.
No email address, profile payload or credentials are retained in this report.
The existing account used Google and was not blocked. No duplicate account was
created, linked, deleted or merged. Generic method guidance does not reveal an
arbitrary email address's account/provider association.

## Actual journey evidence

1. Public Overview/Matters/Profile → direct system domain notice. The three-entry
   test proves no native Account or email intermediary and cancellation back
   to the originating tab.
2. Hosted login → Google. Live mobile rendering shows the new provider order,
   guidance and absence of the unavailable Apple method/development warning.
3. Google identity → required hosted confirmation. The Owner completed the
   actual Google/device ceremony. The first confirmation screenshot exposed the
   spacing and button defects and was rejected as a visual result.
4. Confirmation → Rillora map. Sanitized Auth0 event types at 14:19 UTC show
   `forms_submission_succeeded`, successful Google login and authorization-code
   exchange. The ordinary cloud Debug app then displayed the authenticated
   empty map. This is a real Owner-controlled callback, not a development planner.
5. Final Form layout → unchecked validation and cancel. Follow-up visual QA uses
   the existing Google session and an explicit volatile-store signed-out launch.
   It does not overwrite the real Keychain session. The agent does not select
   the legal checkbox or submit acceptance in this check.

The actual form allows pressing Continue and validates the required field. It
must not be described as an initially disabled button. An unchecked submission
stays on the form with validation feedback and cannot issue the legal receipt.

## Verification

| Check | Result | Artifact |
| --- | --- | --- |
| Native units | 116 passed, 0 failed, 1 existing StoreKit environment skip | `unit-session-recovery-final.xcresult` |
| Direct three-entry/cancel case | 1 passed | `direct-entry-verified.xcresult` |
| Public/safety and commercial deferral | 2 passed | `entry-tests.xcresult` |
| Local Action/contract checks | 7 passed | `action-tests-final.tap` |
| Form schema | Valid against current official OAS | `form-schema-validation-final.json` |
| Debug build/run | Passed, local ad-hoc signing | `verification.json` |
| Release Simulator compile | Passed | `verification.json` |
| Live Form/Action/binding | Exact deployed code and readback | `tenant-readback/`, `tenant-layout-v2/` |
| Final Form styling | Exact source/readback; actual initial/error-state inspection | `form-style-v7/` and accepted screenshots |
| Method order/text and Apple scope | Applied and read back | `login-clarity-v2/` |
| Real Owner route | Google → required confirmation → code exchange → private map observed | `hosted-login-returned-map.jpg` |

The first entry test searched inside the app for a system-owned Chinese alert.
Its raw failure is retained. The corrected test queries SpringBoard and accepts
the observed Cancel labels. No application behavior was weakened to pass it.

The earlier whole-app result records 14 standard-size cases, an AX5 journey and
actual landscape geometry. These are earlier checkpoints in this conversation,
not a claim that every device/surface was rerun after this authentication change:
[whole-app review](../rillora-full-app-ux-20260906/README.md).

## Configuration and iteration limits

The initial preflight found no named Form/Action and no Post Login bindings.
The Owner restored the expired CLI session, after which the required resources
were created and read back. The Action is scoped to the existing iOS client and
the new `single-hosted-v1` marker. Older builds retain their former consent path;
the separate Apple binding pause applies to that iOS client across versions.

The current Management API returns 402 for the existing Universal Login page
template. No subscription was purchased and no template write was attempted.
The fix uses the available Form CSS plus supported theme/custom-text controls.
The original page-template source remains unchanged. Form CSS deliberately
preserves Auth0's hidden controls and status-message color inheritance.

Earlier style versions are retained as iteration evidence. The first actual
Form showed spacing defects; a later overly broad display override exposed a
hidden control, and the error-state check exposed low-contrast text inherited
from a generic paragraph rule. The accepted source removes those overrides.
Schema/deployment success alone was not counted as visual acceptance.

The API acceptance ledger remains authoritative. The client decoder does not
verify a JWT signature; it passes the same unchanged token to the API's existing
signature/issuer/audience/expiry/scope verification and atomic planner/acceptance/
session exchange. No M2M app, vault, user metadata or new key was introduced.

## Sources and remaining gates

- [Auth0 Forms render contract](https://auth0.com/docs/customize/forms/render) defines prompt fields, server-side vars and continuation.
- [Auth0 account-linking precautions](https://auth0.com/docs/manage-users/user-accounts/user-account-linking) require authentication of both identities before linking. Same-email automatic merging is not implemented.
- [Auth0 developer-key limits](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/devkeys) explain why an unconfigured hosted connection cannot be presented as ready for the custom domain.

Apple's identity-key rotation and hosted Services ID remain prerequisites before
its method can be restored. Physical devices, spoken VoiceOver, localization,
complete five-device coverage, release and real business-data workflows retain
their separate gates. No payment, publication, recipient delivery or data
release occurred. The parent repository remains untracked; no commit/branch/
stash was created and pre-existing nested Web work is preserved.


## Final restart and current Simulator state

The original Keychain entry remains present and its creation/modification time
is still 14:19:49 UTC. The current API requires reauthentication. The 30-minute
idle default in source is consistent with the elapsed review; a live override
could not be checked because scoped AWS CLI access was expired. No timeout or
remote session was changed. The earlier Google/confirmation/code-exchange/private
map sequence is still established; an active restored session is not claimed.

The final UI now explains this as Welcome back / Sign in again and retains the
public tabs. New visitors retain the normal product overview. Updated recovery
unit assertions pass with the same 116 / 0 / 1 count, and final Debug/Release
builds pass. The installed ordinary cloud Debug app has no enabled QA identity
or forced signed-out flag. Personal reauthentication remains the Owner action.

## Accepted visual comparison

| Original hosted confirmation | Final hosted confirmation |
| --- | --- |
| ![Original confirmation](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-single-hosted-entry-20260906/hosted-consent-before-owner.png) | ![Final confirmation](/Users/tantalum/Documents/电子遗嘱app/output/qa/rillora-single-hosted-entry-20260906/hosted-consent-final.jpg) |

[Final unchecked error state](hosted-consent-error-final.jpg) · [Returning Google guidance](hosted-login-final.jpg) · [Owner callback to the private map](hosted-login-returned-map.jpg)

Handoff completed on 2026-09-07 (Asia/Hong_Kong). The directory name records the
start date. All 51 current project-owned Markdown files are accounted for; 152
local Markdown links resolve and changed source has no trailing whitespace.
The original 50-file full-read ledger is retained; generated dependencies and
build/QA outputs are excluded from the source-document inventory.

[Current reauthentication recovery](session-recovery-final.jpg) is the installed
ordinary Debug state; it is not a claim of an active restored server session.
